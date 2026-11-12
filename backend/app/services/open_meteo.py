import json
import httpx
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.weather import WeatherCache
from backend.app.schemas.weather import (
    CurrentWeatherResponse,
    DailyForecastItem,
    WeatherForecastResponse,
    CropSuitabilityResponse,
)

# Agronomic indicative requirements (temperature ranges and 7-day rain tolerance)
CROP_THRESHOLDS = {
    "cotton": {"min_temp": 18.0, "max_temp": 38.0, "optimal_min": 21.0, "optimal_max": 32.0, "max_rain_7d": 120.0},
    "rice": {"min_temp": 20.0, "max_temp": 38.0, "optimal_min": 22.0, "optimal_max": 33.0, "max_rain_7d": 250.0},
    "paddy": {"min_temp": 20.0, "max_temp": 38.0, "optimal_min": 22.0, "optimal_max": 33.0, "max_rain_7d": 250.0},
    "wheat": {"min_temp": 10.0, "max_temp": 28.0, "optimal_min": 15.0, "optimal_max": 25.0, "max_rain_7d": 60.0},
    "maize": {"min_temp": 15.0, "max_temp": 35.0, "optimal_min": 18.0, "optimal_max": 30.0, "max_rain_7d": 100.0},
    "groundnut": {"min_temp": 18.0, "max_temp": 35.0, "optimal_min": 22.0, "optimal_max": 30.0, "max_rain_7d": 80.0},
    "chilli": {"min_temp": 15.0, "max_temp": 35.0, "optimal_min": 20.0, "optimal_max": 30.0, "max_rain_7d": 70.0},
    "tomato": {"min_temp": 14.0, "max_temp": 32.0, "optimal_min": 18.0, "optimal_max": 28.0, "max_rain_7d": 80.0},
    "pulses": {"min_temp": 15.0, "max_temp": 32.0, "optimal_min": 18.0, "optimal_max": 28.0, "max_rain_7d": 60.0},
}


async def fetch_open_meteo_raw(lat: float, lon: float) -> Dict[str, Any]:
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&"
        f"daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&"
        f"timezone=auto"
    )
    async with httpx.AsyncClient(timeout=6.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()


async def get_weather_forecast(lat: float, lon: float, db: Session) -> WeatherForecastResponse:
    lat_bin = round(lat, 2)
    lon_bin = round(lon, 2)
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Check local cache
    cached = (
        db.query(WeatherCache)
        .filter(
            WeatherCache.latitude_bin == lat_bin,
            WeatherCache.longitude_bin == lon_bin,
        )
        .order_by(WeatherCache.fetched_at.desc())
        .first()
    )

    if cached and cached.expires_at > now:
        cached_data = json.loads(cached.forecast_json)
        cached_data["stale"] = False
        cached_data["current"]["stale"] = False
        return WeatherForecastResponse(**cached_data)

    # 2. Attempt live fetch with retry
    raw_data: Optional[Dict[str, Any]] = None
    fetch_error: Optional[str] = None
    for attempt in range(2):
        try:
            raw_data = await fetch_open_meteo_raw(lat, lon)
            if raw_data:
                break
        except Exception as e:
            fetch_error = str(e)

    # 3. Handle live fetch success
    if raw_data and "current" in raw_data and "daily" in raw_data:
        current_raw = raw_data["current"]
        daily_raw = raw_data["daily"]

        daily_items: List[DailyForecastItem] = []
        dates = daily_raw.get("time", [])
        temp_maxs = daily_raw.get("temperature_2m_max", [])
        temp_mins = daily_raw.get("temperature_2m_min", [])
        precip_sums = daily_raw.get("precipitation_sum", [])
        precip_probs = daily_raw.get("precipitation_probability_max", [])
        et0s = daily_raw.get("et0_fao_evapotranspiration", [])

        for i in range(len(dates)):
            daily_items.append(
                DailyForecastItem(
                    date=dates[i],
                    temp_min_c=float(temp_mins[i]) if i < len(temp_mins) and temp_mins[i] is not None else 0.0,
                    temp_max_c=float(temp_maxs[i]) if i < len(temp_maxs) and temp_maxs[i] is not None else 0.0,
                    precipitation_probability_pct=float(precip_probs[i]) if i < len(precip_probs) and precip_probs[i] is not None else 0.0,
                    precipitation_sum_mm=float(precip_sums[i]) if i < len(precip_sums) and precip_sums[i] is not None else 0.0,
                    reference_et0_mm=float(et0s[i]) if i < len(et0s) and et0s[i] is not None else 0.0,
                )
            )

        today_expected_rain = daily_items[0].precipitation_sum_mm if daily_items else float(current_raw.get("precipitation", 0.0))
        today_et0 = daily_items[0].reference_et0_mm if daily_items else 4.0

        current_obj = CurrentWeatherResponse(
            temperature_c=float(current_raw.get("temperature_2m", 0.0)),
            relative_humidity_pct=float(current_raw.get("relative_humidity_2m", 0.0)),
            precipitation_mm=float(current_raw.get("precipitation", 0.0)),
            wind_speed_kmh=float(current_raw.get("wind_speed_10m", 0.0)),
            expected_rainfall_today_mm=today_expected_rain,
            reference_et0_mm=today_et0,
            stale=False,
            fetched_at=now,
        )

        forecast_resp = WeatherForecastResponse(
            latitude=lat,
            longitude=lon,
            current=current_obj,
            daily=daily_items,
            stale=False,
            fetched_at=now,
        )

        # Store in cache
        new_cache = WeatherCache(
            latitude_bin=lat_bin,
            longitude_bin=lon_bin,
            forecast_json=forecast_resp.model_dump_json(),
            fetched_at=now,
            expires_at=now + timedelta(minutes=settings.WEATHER_CACHE_TTL_MINUTES),
        )
        db.add(new_cache)
        db.commit()
        return forecast_resp

    # 4. Handle live fetch failure: check for fallback cache
    if cached:
        cached_data = json.loads(cached.forecast_json)
        cached_data["stale"] = True
        cached_data["current"]["stale"] = True
        cached_data["current"]["village_coordinates_note"] = (
            f"STALE FORECAST WARNING: Weather service unreachable. Showing cached data from {cached.fetched_at} UTC."
        )
        return WeatherForecastResponse(**cached_data)

    # 5. No cache exists and API failed
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            f"Weather service is temporarily unreachable and no cached forecast exists "
            f"for coordinates ({lat}, {lon}). Error: {fetch_error}"
        ),
    )


def evaluate_crop_suitability(crop: str, forecast: WeatherForecastResponse) -> CropSuitabilityResponse:
    crop_lower = crop.strip().lower()
    thresholds = CROP_THRESHOLDS.get(crop_lower)
    
    current_temp = forecast.current.temperature_c
    daily_precip_7d = sum(item.precipitation_sum_mm for item in forecast.daily)
    max_forecast_temp = max((item.temp_max_c for item in forecast.daily), default=current_temp)
    min_forecast_temp = min((item.temp_min_c for item in forecast.daily), default=current_temp)

    reasons: List[str] = []
    limitations = [
        "Temperature and precipitation thresholds are indicative agronomic baselines, not exact site measurements.",
        "Coordinates represent approximate village centroid, which may exhibit microclimatic variance from field conditions.",
    ]

    if not thresholds:
        return CropSuitabilityResponse(
            crop=crop,
            value="Moderately Suitable",
            confidence=0.55,
            confidence_type="rule",
            reasons=[
                f"Agronomic rules for '{crop}' are generalized. Current temperature is {current_temp:.1f}°C."
            ],
            sources=["General Agro-Climatic Extension Manuals (Indicative)"],
            status="WORKING",
            limitations=limitations,
        )

    # Evaluate rules
    reasons.append(
        f"Indicative baseline for {crop}: optimal temp range {thresholds['optimal_min']}°C–{thresholds['optimal_max']}°C, "
        f"max 7-day rainfall {thresholds['max_rain_7d']} mm."
    )
    reasons.append(
        f"Current weather: {current_temp:.1f}°C, forecast range {min_forecast_temp:.1f}°C–{max_forecast_temp:.1f}°C, "
        f"expected 7-day rainfall {daily_precip_7d:.1f} mm."
    )

    if daily_precip_7d > thresholds["max_rain_7d"]:
        value = "Not Recommended"
        confidence = 0.88
        reasons.append(f"Excessive rainfall forecast ({daily_precip_7d:.1f} mm) exceeds indicative tolerance ({thresholds['max_rain_7d']} mm). Risk of waterlogging or seed rotting.")
    elif min_forecast_temp < thresholds["min_temp"]:
        value = "Not Recommended"
        confidence = 0.85
        reasons.append(f"Forecasted minimum temperature ({min_forecast_temp:.1f}°C) falls below indicative physiological threshold ({thresholds['min_temp']}°C).")
    elif max_forecast_temp > thresholds["max_temp"]:
        value = "Not Recommended"
        confidence = 0.85
        reasons.append(f"Forecasted maximum temperature ({max_forecast_temp:.1f}°C) exceeds indicative heat stress threshold ({thresholds['max_temp']}°C).")
    elif thresholds["optimal_min"] <= current_temp <= thresholds["optimal_max"]:
        value = "Suitable"
        confidence = 0.90
        reasons.append("Current ambient temperature and moisture levels fall within optimal physiological germination/vegetative windows.")
    else:
        value = "Moderately Suitable"
        confidence = 0.78
        reasons.append("Current temperature is acceptable but outside optimal peak window; manageable with appropriate irrigation practices.")

    return CropSuitabilityResponse(
        crop=crop,
        value=value,
        confidence=confidence,
        confidence_type="rule",
        reasons=reasons,
        sources=[
            "ICAR Package of Practices & Agro-Meteorological Advisory Baselines",
            f"Open-Meteo 7-Day Forecast ({forecast.latitude:.2f}, {forecast.longitude:.2f})",
        ],
        status="WORKING",
        limitations=limitations,
    )
