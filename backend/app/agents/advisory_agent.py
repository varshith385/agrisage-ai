from datetime import datetime, timezone
from typing import Any, Dict, List
from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import AdvisoryPlan
from backend.app.schemas.envelope import AgentEnvelope, ExplainabilitySchema


class AdvisoryAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="AdvisoryAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        conflicts = context.get("conflicts", [])
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        irrigation_output = context.get("irrigation_plan")
        disease_output = context.get("disease_finding")
        now = datetime.now(timezone.utc)

        warnings = []
        is_degraded = False

        if weather_status == "failed":
            is_degraded = True
            warnings.append("Upstream weather telemetry failed; advisory synthesized with limited environmental context.")
        elif weather_output and weather_output.get("stale"):
            is_degraded = True
            warnings.append("Upstream weather is stale; advisory schedule flagged as indicative.")

        # Build explainability card documenting the orchestration run
        explain_reasons: List[str] = [
            "Multi-agent orchestrator evaluated 5 specialized pipeline nodes (Weather, Irrigation, Disease, Yield, Advisory)."
        ]
        if weather_output:
            explain_reasons.append(
                f"Meteorological input: {weather_output.get('temperature_c')}°C, humidity {weather_output.get('relative_humidity_pct')}%, 24h expected rain {weather_output.get('rain_forecast_24h_mm')} mm."
            )
        if conflicts:
            for c in conflicts:
                explain_reasons.append(f"Conflict Resolved ({c.get('agent_a')} vs {c.get('agent_b')}): {c.get('resolution')}")

        explain_card = ExplainabilitySchema(
            value="Multi-Agent Pipeline Orchestration Completed",
            confidence=0.85 if not is_degraded else 0.50,
            confidence_type="rule",
            reasons=explain_reasons,
            sources=[
                "AgriSage Multi-Agent Framework (SPEC.md Section 5)",
                "Open-Meteo Global Meteorological Forecast",
            ],
            status="DEMO",
            limitations=[
                "Non-weather agents are currently operating in stub mode; predictions will be unlocked in subsequent tiers.",
                "Agronomic actions should always be verified against local Krishi Vigyan Kendra (KVK) guidelines.",
            ],
        )

        plan = AdvisoryPlan(
            status="stub",
            message="not implemented yet",
            farm_health_score=None,
            seven_day_plan=None,
            summary="Multi-agent orchestration completed. Downstream ML models pending activation in Prompts 3.2–3.5.",
            explainable_cards=[explain_card],
            confidence=0.0,
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "conflicts_count": len(conflicts),
                "has_weather": bool(weather_output),
                "has_irrigation": bool(irrigation_output),
                "has_disease": bool(disease_output),
            },
            outputs=plan.model_dump(),
            confidence=0.0,
            warnings=warnings,
        )
