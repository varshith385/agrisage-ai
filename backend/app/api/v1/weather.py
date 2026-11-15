from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database.session import get_db
from backend.app.models.farm import Farm
from backend.app.services.open_meteo import (
    get_weather_forecast,
    get_farm_weather,
    evaluate_crop_suitability,
    get_climate_normals,
)
from backend.app.schemas.weather import (
    CurrentWeatherResponse,
    WeatherForecastResponse,
    CropSuitabilityResponse,
)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/climate-normals")
async def get_historical_climate_normals(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
):
    """Fetches trailing 12-month climate averages (temperature, humidity, monthly precipitation) from Open-Meteo."""
    return await get_climate_normals(lat, lon)


@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude"),
    farm_id: Optional[int] = Query(None, description="Optional Farm ID"),
    db: Session = Depends(get_db),
):
    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {farm_id} not found.",
            )
        forecast = await get_farm_weather(farm, db)
        return forecast.current

    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either farm_id or both lat and lon query parameters must be provided.",
        )
    forecast = await get_weather_forecast(lat, lon, db)
    return forecast.current


@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_forecast(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude"),
    farm_id: Optional[int] = Query(None, description="Optional Farm ID"),
    db: Session = Depends(get_db),
):
    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {farm_id} not found.",
            )
        return await get_farm_weather(farm, db)

    if lat is None or lon is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either farm_id or both lat and lon query parameters must be provided.",
        )
    return await get_weather_forecast(lat, lon, db)


@router.get("/farm/{farm_id}", response_model=WeatherForecastResponse)
async def get_weather_for_farm(
    farm_id: int,
    db: Session = Depends(get_db),
):
    """Unified endpoint to retrieve weather forecast for a specific farm holding."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found.",
        )
    return await get_farm_weather(farm, db)


@router.get("/suitability", response_model=CropSuitabilityResponse)
async def get_crop_suitability(
    crop: str = Query(..., min_length=2, description="Crop name (e.g., cotton, rice, groundnut, maize)"),
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    db: Session = Depends(get_db),
):
    forecast = await get_weather_forecast(lat, lon, db)
    return evaluate_crop_suitability(crop, forecast)

