from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class CurrentWeatherResponse(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    precipitation_mm: float
    wind_speed_kmh: float
    expected_rainfall_today_mm: float
    reference_et0_mm: float
    stale: bool = False
    fetched_at: datetime
    source: str = "Open-Meteo Global Meteorological Forecast"
    village_coordinates_note: str = "Coordinates represent approximate village/farm centroid. Precision is indicative."


class DailyForecastItem(BaseModel):
    date: str
    temp_min_c: float
    temp_max_c: float
    precipitation_probability_pct: float
    precipitation_sum_mm: float
    reference_et0_mm: float


class WeatherForecastResponse(BaseModel):
    latitude: float
    longitude: float
    current: CurrentWeatherResponse
    daily: List[DailyForecastItem]
    stale: bool = False
    fetched_at: datetime
    source: str = "Open-Meteo Global Meteorological Forecast"
    village_coordinates_note: str = "Coordinates represent approximate village centroid."


class CropSuitabilityResponse(BaseModel):
    crop: str
    value: Literal["Suitable", "Moderately Suitable", "Not Recommended"]
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_type: Literal["rule"] = "rule"
    reasons: List[str]
    sources: List[str]
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
    limitations: List[str]

