from typing import Any, Dict, List
from backend.app.agents.schemas import Conflict
from backend.app.config import settings


def detect_and_resolve_conflicts(
    weather_report: Dict[str, Any],
    irrigation_plan: Dict[str, Any],
    disease_finding: Dict[str, Any],
    farm_context: Dict[str, Any],
) -> List[Conflict]:
    conflicts: List[Conflict] = []

    rain_24h = weather_report.get("rain_forecast_24h_mm", 0.0) if weather_report else 0.0
    humidity = weather_report.get("relative_humidity_pct", 0.0) if weather_report else 0.0
    irrigation_method = str(farm_context.get("irrigation_method", "drip")).lower()

    # Rule 1: Rain-Skip Conflict
    # Spec example: 15 mm rain in 24h
    if rain_24h >= settings.RAIN_CONFLICT_THRESHOLD_MM:
        conflicts.append(
            Conflict(
                agent_a="IrrigationAgent",
                agent_b="WeatherAgent",
                issue=(
                    f"Irrigation agent scheduled watering, but Weather agent forecasts "
                    f"{rain_24h:.1f} mm rain within 24h (threshold: {settings.RAIN_CONFLICT_THRESHOLD_MM} mm)."
                ),
                resolution=(
                    "Recommended Action: Defer scheduled irrigation for 24-48 hours. "
                    "Allow natural precipitation to fulfill soil moisture deficit."
                ),
                rationale=(
                    f"Indicative baseline rule: Natural rainfall >= {settings.RAIN_CONFLICT_THRESHOLD_MM} mm "
                    f"in 24 hours satisfies crop evapotranspiration demand and avoids soil waterlogging."
                ),
                rule_type="rule_based",
                indicative=True,
            )
        )

    # Rule 2: Fungal Humidity vs Overhead Irrigation Recommendation
    # Change 4: Recommendation with reason, not absolute prohibition. Mark humidity as indicative heuristic.
    if humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT and irrigation_method in ["sprinkler", "overhead", "flood"]:
        conflicts.append(
            Conflict(
                agent_a="DiseaseAgent",
                agent_b="IrrigationAgent",
                issue=(
                    f"Relative humidity is {humidity:.1f}% (heuristic threshold: {settings.FUNGAL_HUMIDITY_THRESHOLD_PCT}%), "
                    f"and farm irrigation method is {irrigation_method}."
                ),
                resolution=(
                    "Recommendation: Consider ground-level root zone application (e.g. drip) or schedule watering "
                    "during early morning rather than evening overhead watering to allow leaves to dry rapidly."
                ),
                rationale=(
                    f"Indicative heuristic: Persistent leaf wetness combined with relative humidity >= {settings.FUNGAL_HUMIDITY_THRESHOLD_PCT}% "
                    f"favors fungal spore germination and foliar blight progression."
                ),
                rule_type="heuristic",
                indicative=True,
            )
        )

    return conflicts
