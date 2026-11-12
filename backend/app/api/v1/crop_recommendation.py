"""
AgriSage AI — Crop Recommendation API Router
Implements:
- POST /api/v1/recommend/crop
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.ml.crop_recommender import crop_recommender_engine
from backend.app.models.farm import Farm
from backend.app.models.user import User
from backend.app.schemas.crop_recommendation import (
    CropRecommendationRequest,
    CropRecommendationResponse,
)
from backend.app.security.auth import get_current_user

router = APIRouter(prefix="/recommend", tags=["Crop Recommendation"])


@router.post("/crop", response_model=CropRecommendationResponse)
async def recommend_crop(
    payload: CropRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates environmental and soil parameters to recommend top-3 crops.
    If soil nutrients (N, P, K, pH) are missing, runs a dedicated weather-only model
    variant with lowered confidence and an explicit disclaimer.
    """
    n = payload.n
    p = payload.p
    k = payload.k
    ph = payload.ph
    temp = payload.temperature
    hum = payload.humidity
    rain = payload.rainfall
    state = payload.state or "Telangana"
    district = payload.district or "Warangal"
    season = payload.season or "Kharif"

    # If farm_id is provided, check authorization and auto-populate location
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

    result = crop_recommender_engine.recommend(
        n=n,
        p=p,
        k=k,
        ph=ph,
        temperature=temp,
        humidity=hum,
        rainfall=rain,
        state=state,
        district=district,
        season=season,
    )

    return result
