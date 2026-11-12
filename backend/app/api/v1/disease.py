import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.ml.disease_model import SUPPORTED_CROPS, disease_model
from backend.app.models.disease_prediction import DiseasePrediction
from backend.app.models.farm import Farm
from backend.app.models.user import User, UserRole
from backend.app.security.auth import get_current_user
from backend.app.services.open_meteo import get_weather_forecast

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/disease", tags=["Disease Diagnosis"])


@router.get("/supported-crops")
async def get_supported_crops():
    """
    Returns the list of 14 crops supported by the pretrained PlantVillage benchmark model,
    along with non-supported crop examples for clear user expectation setting.
    """
    return {
        "model_name": "MobileNetV2 (PlantVillage)",
        "num_classes": 38,
        "supported_crops": SUPPORTED_CROPS,
        "unsupported_examples": ["Cotton", "Chilli", "Rice", "Wheat"],
        "note": (
            "The pretrained computer vision model classifies foliar lesions across 14 supported crop types. "
            "For crops outside this list (e.g. Cotton, Chilli, Rice, Wheat), the model provides a visual similarity match "
            "with a clear mismatch warning; please consult your local KVK for ground verification."
        ),
    }


@router.post("/predict")
async def predict_plant_disease(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None),
    farm_id: Optional[int] = Form(None),
    report_to_outbreak: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates leaf photo quality gate, executes MobileNetV2 CV classification in a background threadpool,
    computes weather-informed fungal sporulation risk (if farm_id provided), and optionally logs an anonymized
    village centroid report to the Outbreak Map if the user explicitly opted in.
    The uploaded image is discarded immediately after inference and is never stored on disk.
    """
    # 1. Read file bytes and validate file size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image: {str(e)}",
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please upload a valid image file.",
        )

    if len(contents) > settings.MAX_IMAGE_FILE_SIZE_BYTES:
        max_mb = settings.MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)
        actual_mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image file size ({actual_mb:.1f} MB) exceeds maximum allowed limit of {max_mb:.0f} MB.",
        )

    # 2. Verify farm ownership & fetch weather for fungal factor if farm_id is provided
    farm = None
    weather_fungal_risk: Optional[Dict[str, Any]] = None
    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {farm_id} not found.",
            )
        if farm.user_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this farm.",
            )

        # Retrieve weather to compute rule-based fungal risk factor (does not affect model confidence)
        try:
            forecast = await get_weather_forecast(farm.latitude, farm.longitude, db)
            humidity = forecast.current.relative_humidity_pct
            rain_24h = forecast.daily[0].precipitation_sum if forecast.daily else 0.0
            elevated = (
                humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT
                or rain_24h >= settings.RAIN_CONFLICT_THRESHOLD_MM
            )
            weather_fungal_risk = {
                "elevated": elevated,
                "relative_humidity_pct": humidity,
                "rain_24h_mm": rain_24h,
                "explanation": (
                    f"Microclimate relative humidity is {humidity:.1f}% (heuristic threshold: {settings.FUNGAL_HUMIDITY_THRESHOLD_PCT}%) "
                    f"with {rain_24h:.1f} mm rain forecast in 24h. Prolonged foliar wetness increases fungal sporulation risk."
                    if elevated
                    else f"Microclimate relative humidity ({humidity:.1f}%) and rainfall are below critical sporulation thresholds."
                ),
                "indicative": True,
            }
        except Exception as exc:
            logger.warning(f"Could not fetch weather telemetry for farm {farm_id}: {exc}")
            weather_fungal_risk = {
                "elevated": False,
                "explanation": "Weather service telemetry unavailable; microclimate fungal risk skipped.",
                "indicative": True,
            }

    # 3. Asynchronous model inference in worker threadpool
    pred = await disease_model.predict_async(contents, crop_hint=crop_hint)

    # 4. Outbreak persistence: STRICT PRIVACY RULES
    # - Only saved if report_to_outbreak is TRUE (user opted in)
    # - NEVER store image bytes or image file on disk
    # - ONLY store village-level centroid (never precise GPS)
    saved_record_id = None
    if report_to_outbreak and pred.get("success"):
        village_name = farm.village if farm else "Centroid Area"
        district_name = farm.district if farm else "Nalgonda"
        state_name = farm.state if farm else "Telangana"

        record = DiseasePrediction(
            farm_id=farm_id,
            user_id=current_user.id,
            image_path=None,  # image is discarded from memory immediately
            crop_hint=crop_hint,
            predicted_disease=pred["predicted_disease"],
            confidence=pred["prediction_confidence"],
            top3_json=json.dumps(pred["top3_predictions"]),
            village=village_name,
            district=district_name,
            state=state_name,
            reported_to_outbreak=True,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        saved_record_id = record.id

    # Discard raw image buffer from memory
    del contents

    return {
        "success": pred.get("success", False),
        "quality_gate": pred.get("quality_gate", {}),
        "predicted_class": pred.get("predicted_class"),
        "predicted_crop": pred.get("predicted_crop"),
        "predicted_disease": pred.get("predicted_disease"),
        "prediction_confidence": pred.get("prediction_confidence"),
        "confidence_type": pred.get("confidence_type", "prediction confidence (uncalibrated)"),
        "is_uncertain": pred.get("is_uncertain", False),
        "crop_supported": pred.get("crop_supported", True),
        "supported_crops": pred.get("supported_crops", SUPPORTED_CROPS),
        "top3_predictions": pred.get("top3_predictions", []),
        "symptoms": pred.get("symptoms"),
        "safe_ipm_steps": pred.get("safe_ipm_steps", []),
        "sources": pred.get("sources", []),
        "scheme_tags": pred.get("scheme_tags", []),
        "weather_fungal_risk": weather_fungal_risk,
        "warnings": pred.get("warnings", []),
        "reported_to_outbreak": report_to_outbreak and pred.get("success", False),
        "outbreak_record_id": saved_record_id,
        "error": pred.get("error"),
    }


@router.get("/history")
async def get_disease_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns past disease reports saved by current user (opt-in records).
    """
    records = (
        db.query(DiseasePrediction)
        .filter(DiseasePrediction.user_id == current_user.id)
        .order_by(DiseasePrediction.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "farm_id": r.farm_id,
            "crop_hint": r.crop_hint,
            "predicted_disease": r.predicted_disease,
            "confidence": r.confidence,
            "confidence_type": "prediction confidence (uncalibrated)",
            "village": r.village,
            "district": r.district,
            "state": r.state,
            "reported_to_outbreak": r.reported_to_outbreak,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]
