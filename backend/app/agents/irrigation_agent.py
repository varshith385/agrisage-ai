from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import IrrigationPlan
from backend.app.config import settings
from backend.app.schemas.envelope import AgentEnvelope


class IrrigationAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="IrrigationAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        irrigation_method = context.get("irrigation_method", "drip")
        now = datetime.now(timezone.utc)

        warnings = []
        is_degraded = False

        if not weather_output or weather_status == "failed":
            is_degraded = True
            warnings.append("Weather agent failed; irrigation evaluation degraded due to missing meteorological telemetry.")
        elif weather_output.get("stale"):
            is_degraded = True
            warnings.append("Weather data is stale (offline cache); rule checks are evaluated with indicative caution.")

        # Rule-based conflict flags (only non-null logic allowed in stubs)
        rain_24h = weather_output.get("rain_forecast_24h_mm", 0.0) if weather_output else 0.0
        humidity = weather_output.get("relative_humidity_pct", 0.0) if weather_output else 0.0

        rain_skip_triggered = rain_24h >= settings.RAIN_CONFLICT_THRESHOLD_MM
        foliar_wetness_caution = (
            humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT
            and str(irrigation_method).lower() in ["sprinkler", "flood", "overhead"]
        )

        plan = IrrigationPlan(
            status="stub",
            message="not implemented yet",
            irrigate=None,
            water_depth_mm=None,
            litres_needed=None,
            litres_saved=None,
            rain_skip_triggered=rain_skip_triggered,
            foliar_wetness_caution=foliar_wetness_caution,
            recommendation_text=None,
            confidence=0.0,
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "irrigation_method": irrigation_method,
                "weather_available": bool(weather_output),
                "weather_stale": weather_output.get("stale", False) if weather_output else False,
            },
            outputs=plan.model_dump(),
            confidence=0.0,
            warnings=warnings,
        )
