from datetime import datetime, timezone
from typing import Any, Dict
from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import DiseaseFinding
from backend.app.config import settings
from backend.app.schemas.envelope import AgentEnvelope


class DiseaseAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="DiseaseAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        image_path = context.get("image_path")
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        now = datetime.now(timezone.utc)

        warnings = []
        is_degraded = False

        if not weather_output or weather_status == "failed":
            is_degraded = True
            warnings.append("Weather agent failed; fungal spore humidity heuristics unavailable.")
        elif weather_output.get("stale"):
            is_degraded = True
            warnings.append("Weather data is stale; fungal humidity heuristic evaluated with cached telemetry.")

        image_provided = bool(image_path)
        if not image_provided:
            warnings.append("No crop leaf image provided in request. Running in partial mode (CV vision analysis skipped).")

        # Indicative rule-based heuristic: relative humidity >= threshold indicates elevated fungal sporulation risk
        humidity = weather_output.get("relative_humidity_pct", 0.0) if weather_output else 0.0
        fungal_risk_elevated = humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT

        finding = DiseaseFinding(
            status="stub",
            message="not implemented yet",
            image_provided=image_provided,
            detected_disease=None,
            risk_level=None,
            confidence=0.0,
            fungal_risk_elevated=fungal_risk_elevated,
            safe_ipm_steps=[],
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "image_provided": image_provided,
                "humidity_pct": humidity,
            },
            outputs=finding.model_dump(),
            confidence=0.0,
            warnings=warnings,
        )
