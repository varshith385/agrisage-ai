from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.ml.irrigation import IrrigationDiagnostician, irrigation_engine
from backend.app.models.farm import Farm, IrrigationMethod
from backend.app.models.user import User, UserRole
from backend.app.schemas.irrigation import (
    IrrigationDiagnosisResponse,
    IrrigationPlanRequest,
    IrrigationPlanResponse,
)
from backend.app.security.auth import get_current_user
from backend.app.services.open_meteo import get_weather_forecast

router = APIRouter(prefix="/irrigation", tags=["irrigation"])


@router.post("/plan", response_model=IrrigationPlanResponse)
async def generate_irrigation_plan(
    payload: IrrigationPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Executes the FAO-56 Single Crop Coefficient ($ET_c = K_c \\times ET_0$) water budget model.
    Computes effective rainfall, soil water balance bucket simulation by soil texture,
    irrigation method efficiency, depth (mm), volume in litres, next irrigation date,
    and litres saved if rain is forecast.
    """
    farm = None
    crop_name = payload.crop_name or "Cotton"
    planting_date = payload.planting_date
    soil_type = payload.soil_type or "Black Cotton"
    irrigation_method = payload.irrigation_method or "drip"
    area_acres = payload.area_acres or 1.0

    lat = payload.latitude
    lon = payload.longitude

    # 1. If farm_id provided, look up registered farm holding & verify ownership
    if payload.farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {payload.farm_id} not found.",
            )
        if farm.user_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this farm holding.",
            )

        lat = farm.latitude
        lon = farm.longitude
        soil_type = farm.soil_type or soil_type
        if farm.irrigation_method:
            irrigation_method = (
                farm.irrigation_method.value
                if hasattr(farm.irrigation_method, "value")
                else str(farm.irrigation_method)
            )
        area_acres = farm.area or area_acres

        # Look up active crop cycle
        if farm.current_crop_cycles:
            active_cycles = [c for c in farm.current_crop_cycles if c.is_active]
            if active_cycles:
                cycle = active_cycles[0]
                crop_name = cycle.crop_name
                planting_date = cycle.planting_date

    # Default planting date if unspecified: 35 days ago (mid-vegetative stage)
    if not planting_date:
        planting_date = date.today() - timedelta(days=35)

    # 2. Fetch live/cached Open-Meteo meteorological forecast if coordinates available
    ref_et0 = payload.reference_et0_mm or 4.5
    rain_24h = payload.rain_forecast_24h_mm or 0.0
    rain_48h = payload.rain_forecast_48h_mm or 0.0
    daily_forecast_list: List[Dict[str, Any]] = []

    if lat is not None and lon is not None:
        try:
            weather_data = await get_weather_forecast(lat, lon, db)
            if weather_data.daily and len(weather_data.daily) > 0:
                day0 = weather_data.daily[0]
                ref_et0 = day0.reference_et0_mm if payload.reference_et0_mm is None else payload.reference_et0_mm
                rain_24h = day0.precipitation_sum if payload.rain_forecast_24h_mm is None else payload.rain_forecast_24h_mm
                if len(weather_data.daily) > 1 and payload.rain_forecast_48h_mm is None:
                    rain_48h = day0.precipitation_sum + weather_data.daily[1].precipitation_sum

                # Build 7-day daily forecast list
                for d in weather_data.daily[:7]:
                    daily_forecast_list.append({
                        "date": d.date,
                        "reference_et0_mm": d.reference_et0_mm,
                        "precipitation_sum_mm": d.precipitation_sum,
                    })
        except Exception:
            # Fall back to payload or nominal parameters
            pass

    # 3. Execute FAO-56 Engine
    calc_res = irrigation_engine.calculate_plan(
        crop_name=crop_name,
        planting_date=planting_date,
        area_acres=area_acres,
        soil_type=soil_type,
        irrigation_method=irrigation_method,
        reference_et0_mm=ref_et0,
        forecast_rain_24h_mm=rain_24h,
        forecast_rain_48h_mm=rain_48h,
        daily_forecast=daily_forecast_list,
        current_depletion_mm=payload.current_depletion_mm,
    )

    return IrrigationPlanResponse(
        crop_name=calc_res["crop_name"],
        growth_stage=calc_res["growth_stage"],
        days_after_sowing=calc_res["days_after_sowing"],
        kc=calc_res["kc"],
        reference_et0_mm=calc_res["reference_et0_mm"],
        etc_today_mm=calc_res["etc_today_mm"],
        effective_rain_today_mm=calc_res["effective_rain_today_mm"],
        should_irrigate=calc_res["should_irrigate"],
        net_depth_mm=calc_res["net_depth_mm"],
        gross_depth_mm=calc_res["gross_depth_mm"],
        litres_needed=calc_res["litres_needed"],
        litres_saved=calc_res["litres_saved"],
        rain_skip_triggered=calc_res["rain_skip_triggered"],
        next_irrigation_date=calc_res["next_irrigation_date"],
        irrigation_method=calc_res["irrigation_method"],
        method_efficiency=calc_res["method_efficiency"],
        soil_type=calc_res["soil_type"],
        awc_mm_per_m=calc_res["awc_mm_per_m"],
        taw_mm=calc_res["taw_mm"],
        raw_mm=calc_res["raw_mm"],
        depletion_today_mm=calc_res["depletion_today_mm"],
        daily_forecast_balance=calc_res["daily_forecast_balance"],
        recommendation_text=calc_res["recommendation_text"],
        explanation=calc_res["explanation"],
        status="WORKING",
    )


@router.post("/diagnose", response_model=IrrigationDiagnosisResponse)
async def diagnose_irrigation_issue(
    text_query: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
):
    """
    Classifies irrigation problem symptoms using multilingual keyword matching (en/te/hi)
    and surface visual clue inspection.
    HONESTY RULE: Explicitly disclaims that photos do NOT measure soil moisture,
    and supplies a tactile Finger Test guide.
    """
    if not text_query and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a problem description text or an affected field photo.",
        )

    image_bytes = None
    if file:
        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read image file: {str(e)}",
            )
        if len(image_bytes) > settings.MAX_IMAGE_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image file size exceeds maximum limit.",
            )

    result = IrrigationDiagnostician.diagnose(text_query=text_query, image_bytes=image_bytes)
    return IrrigationDiagnosisResponse(
        category=result["category"],
        title=result["title"],
        severity=result["severity"],
        confidence=result["confidence"],
        description=result["description"],
        suggestions=result["suggestions"],
        visual_cues=result.get("visual_cues"),
        finger_test_guide=result["finger_test_guide"],
        status="PARTIAL",
    )
