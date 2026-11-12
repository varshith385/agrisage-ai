"""
AgriSage AI — Crop Yield Prediction API Router
Implements:
- POST /api/v1/yield/predict
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.ml.yield_model import yield_model_engine
from backend.app.models.farm import Farm, CurrentCropCycle
from backend.app.models.user import User
from backend.app.schemas.yield_prediction import (
    YieldPredictionRequest,
    YieldPredictionResponse,
)
from backend.app.security.auth import get_current_user

router = APIRouter(prefix="/yield", tags=["Yield Prediction"])


@router.post("/predict", response_model=YieldPredictionResponse)
async def predict_yield(
    payload: YieldPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Predicts crop yield (quintals/acre) and 10-90% empirical prediction intervals.
    Excludes non-tonne crops (Coconut, Cotton, Jute, Mesta, Sannhamp) with explicit notices.
    Maps Telangana legacy districts and falls back to state averages with lower confidence if absent.
    Applies visible, rule-based heuristic adjustments labeled 'indicative assumption, no source'.
    """
    crop_name = payload.crop_name
    state = payload.state or "Telangana"
    district = payload.district or "Warangal"
    season = payload.season or "Kharif"
    area_acres = payload.area_acres or 1.0

    if payload.farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm holding with ID {payload.farm_id} not found."
            )
        if farm.user_id != current_user.id and current_user.role.value != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this farm holding."
            )
        state = farm.state or state
        district = farm.district or district
        area_acres = farm.area or area_acres

        # Look up active crop cycle if crop_name was left default or empty
        active_crop = (
            db.query(CurrentCropCycle)
            .filter(CurrentCropCycle.farm_id == farm.id, CurrentCropCycle.is_active == True)
            .first()
        )
        if active_crop and payload.crop_name == "Rice":
            crop_name = active_crop.crop_name

    result = yield_model_engine.predict_yield(
        crop_name=crop_name,
        state=state,
        district=district,
        season=season,
        area_acres=area_acres,
        fungal_disease_present=payload.fungal_disease_present or False,
        moisture_stress_present=payload.moisture_stress_present or False,
        waterlogging_present=payload.waterlogging_present or False,
    )

    return result
