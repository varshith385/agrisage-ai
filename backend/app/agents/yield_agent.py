from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import YieldEstimate
from backend.app.schemas.envelope import AgentEnvelope


class YieldAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="YieldAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        disease_output = context.get("disease_finding")
        now = datetime.now(timezone.utc)

        warnings = []
        is_degraded = False

        if not weather_output or weather_status == "failed":
            is_degraded = True
            warnings.append("Weather agent failed; yield regressor telemetry missing.")
        elif weather_output.get("stale"):
            is_degraded = True
            warnings.append("Weather data is stale; yield baseline calculations degraded.")

        estimate = YieldEstimate(
            status="stub",
            message="not implemented yet",
            expected_yield_quintals_per_acre=None,
            yield_range_lower=None,
            yield_range_upper=None,
            adjustment_factors=[],
            confidence=0.0,
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "has_weather": bool(weather_output),
                "has_disease_finding": bool(disease_output),
            },
            outputs=estimate.model_dump(),
            confidence=0.0,
            warnings=warnings,
        )
