"""
Grow2Gain — Crop Recommendation API Router (Round 7b)
Implements:
- POST /api/v1/recommend/crop with 4-tier decision state classification
- Automated 12-month climate normals fetching from Open-Meteo for farm lat/lon
- Physical validation returning 422 with named invalid fields
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
from backend.app.services.open_meteo import get_climate_normals

router = APIRouter(prefix="/recommend", tags=["Crop Recommendation"])


@router.post("/crop", response_model=CropRecommendationResponse)
async def recommend_crop(
    payload: CropRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates environmental and soil parameters to recommend top-3 crops.
    Returns decision_status: CONFIDENT, LOW_CONFIDENCE, UNUSUAL, or INVALID.
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

    weather_source = payload.weather_source
    window_dates = payload.window_dates
    soil_source = payload.soil_source or ("Entered (user)" if (n is not None and p is not None and k is not None and ph is not None) else "Not provided")

    lat = payload.latitude
    lon = payload.longitude

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
        if lat is None: lat = farm.latitude
        if lon is None: lon = farm.longitude

    # If weather parameters are omitted and coordinates are available, fetch measured climate normals
    if (temp is None or hum is None or rain is None) and lat is not None and lon is not None:
        try:
            normals = await get_climate_normals(lat, lon)
            if temp is None: temp = normals["mean_temperature_c"]
            if hum is None: hum = normals["mean_relative_humidity_pct"]
            if rain is None: rain = normals["mean_monthly_rainfall_mm"]
            weather_source = "Measured (weather API, trailing 12mo)"
            window_dates = f"{normals['window_start_date']} to {normals['window_end_date']}"
        except Exception:
            # If weather API fails and no weather was entered, let recommender use defaults or fail gracefully
            pass

    if weather_source is None:
        weather_source = "Entered (user)" if (payload.temperature is not None or payload.humidity is not None or payload.rainfall is not None) else "Default agro-climate baseline"

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
        soil_source=soil_source,
        weather_source=weather_source,
        window_dates=window_dates,
    )

    # Tier 1 Physical Rejection
    if result.get("decision_status") == "INVALID":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "These values are not valid",
                "invalid_fields": result.get("invalid_fields", []),
                "reasons": result.get("decision_reasons", []),
                "status": "INVALID",
                "decision_status": "INVALID",
            }
        )

    return result
