from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.open_meteo import get_weather_forecast, evaluate_crop_suitability
from backend.app.schemas.weather import (
    CurrentWeatherResponse,
    WeatherForecastResponse,
    CropSuitabilityResponse,
)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    db: Session = Depends(get_db),
):
    forecast = await get_weather_forecast(lat, lon, db)
    return forecast.current


@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_forecast(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    db: Session = Depends(get_db),
):
    return await get_weather_forecast(lat, lon, db)


@router.get("/suitability", response_model=CropSuitabilityResponse)
async def get_crop_suitability(
    crop: str = Query(..., min_length=2, description="Crop name (e.g., cotton, rice, groundnut, maize)"),
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    db: Session = Depends(get_db),
):
    forecast = await get_weather_forecast(lat, lon, db)
    return evaluate_crop_suitability(crop, forecast)

