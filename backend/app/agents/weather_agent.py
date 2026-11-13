from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy.orm import Session

from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import WeatherReport
from backend.app.schemas.envelope import AgentEnvelope
from backend.app.services.open_meteo import get_weather_forecast


class WeatherAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 8.0):
        super().__init__(name="WeatherAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        lat = context.get("latitude")
        lon = context.get("longitude")
        db: Session = context.get("db")

        now = datetime.now(timezone.utc)

        if lat is None or lon is None or db is None:
            return AgentEnvelope(
                agent_name=self.name,
                status="failed",
                timestamp=now,
                inputs_used=context,
                outputs={"error": "Missing latitude, longitude, or database session in context"},
                confidence=0.0,
                warnings=["Coordinates required for Open-Meteo meteorological query."],
            )

        try:
            forecast = await get_weather_forecast(float(lat), float(lon), db)
        except Exception as exc:
            return AgentEnvelope(
                agent_name=self.name,
                status="failed",
                timestamp=now,
                inputs_used={"latitude": lat, "longitude": lon},
                outputs={"error": str(exc)},
                confidence=0.0,
                warnings=[f"Failed to retrieve Open-Meteo forecast: {str(exc)}"],
            )

        current = forecast.current
        daily = forecast.daily

        # Calculate 24h and 48h rainfall projections
        rain_24h = daily[0].precipitation_sum_mm if len(daily) > 0 else current.expected_rainfall_today_mm
        rain_48h = (
            (daily[0].precipitation_sum_mm + daily[1].precipitation_sum_mm)
            if len(daily) > 1
            else rain_24h
        )

        weather_report = WeatherReport(
            temperature_c=current.temperature_c,
            relative_humidity_pct=current.relative_humidity_pct,
            expected_rainfall_today_mm=current.expected_rainfall_today_mm,
            rain_forecast_24h_mm=rain_24h,
            rain_forecast_48h_mm=rain_48h,
            reference_et0_mm=current.reference_et0_mm,
            wind_speed_kmh=current.wind_speed_kmh,
            stale=forecast.stale,
            source=forecast.source,
            fetched_at=forecast.fetched_at.isoformat(),
            status="WORKING" if not forecast.stale else "PARTIAL",
        )

        status_val = "degraded" if forecast.stale else "success"
        warnings = []
        if forecast.stale:
            warnings.append(
                f"Using cached meteorological forecast from {forecast.fetched_at.isoformat()}; upstream Open-Meteo was unreachable."
            )

        out_dict = weather_report.model_dump()
        out_dict["daily_forecast"] = [
            {
                "date": d.date.isoformat() if hasattr(d.date, "isoformat") else str(d.date),
                "temp_min_c": d.temp_min_c,
                "temp_max_c": d.temp_max_c,
                "precipitation_probability_pct": d.precipitation_probability_pct,
                "precipitation_sum_mm": d.precipitation_sum_mm,
                "reference_et0_mm": d.reference_et0_mm,
            }
            for d in daily
        ]

        return AgentEnvelope(
            agent_name=self.name,
            status=status_val,
            timestamp=now,
            inputs_used={"latitude": lat, "longitude": lon},
            outputs=out_dict,
            confidence=0.85 if forecast.stale else 0.95,
            warnings=warnings,
        )
