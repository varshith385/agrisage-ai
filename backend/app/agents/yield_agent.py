from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import YieldEstimate
from backend.app.ml.yield_model import yield_model_engine
from backend.app.schemas.envelope import AgentEnvelope


class YieldAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="YieldAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        disease_output = context.get("disease_finding") or {}
        now = datetime.now(timezone.utc)

        warnings: List[str] = []
        is_degraded = False

        if not weather_output or weather_status == "failed":
            is_degraded = True
            warnings.append("Weather agent failed; yield regressor environmental telemetry degraded.")
        elif weather_output.get("stale"):
            is_degraded = True
            warnings.append("Weather data is stale; yield prediction calibrated with reduced certainty.")

        crop_name = context.get("crop_name")
        area_acres = context.get("area_acres", 1.0)
        state = context.get("state", "Telangana")
        district = context.get("district", "Warangal")
        season = context.get("season", "Kharif")

        # If crop_name is absent in context, preserve clean stub behavior per Yuktik rules
        if not crop_name:
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
                    "has_crop": False,
                },
                outputs=estimate.model_dump(),
                confidence=0.0,
                warnings=warnings,
            )

        # Evaluate upstream signals for heuristic adjustments
        # Upstream disease finding: check fungal risk flag or high risk
        fungal_disease = bool(
            disease_output.get("fungal_risk_elevated")
            or (disease_output.get("risk_level") in ["High", "CRITICAL"])
            or ("blight" in str(disease_output.get("detected_disease", "")).lower())
            or ("fungal" in str(disease_output.get("detected_disease", "")).lower())
        )

        # Upstream weather report: check moisture stress
        moisture_stress = False
        if weather_output:
            rain_24h = float(weather_output.get("rain_forecast_24h_mm", 0.0) or weather_output.get("expected_rainfall_today_mm", 0.0))
            et0 = float(weather_output.get("reference_et0_mm", 4.5))
            if rain_24h < 1.0 and et0 >= 5.5:
                moisture_stress = True

        # Run model inference
        pred_res = yield_model_engine.predict_yield(
            crop_name=crop_name,
            state=state,
            district=district,
            season=season,
            area_acres=float(area_acres),
            fungal_disease_present=fungal_disease,
            moisture_stress_present=moisture_stress,
        )

        status_val = pred_res.get("status", "WORKING")
        adj_strings = [
            f"{a['factor_name']} ({a['adjustment_pct']}%) - {a['citation']}"
            for a in pred_res.get("adjustment_factors", [])
        ]

        if status_val == "DEMO":
            warnings.append("Yield regressor running in DEMO fallback (artifacts missing).")
            estimate = YieldEstimate(
                status="DEMO",
                message="Yield model artifact missing; fallback response.",
                expected_yield_quintals_per_acre=None,
                yield_range_lower=None,
                yield_range_upper=None,
                adjustment_factors=[],
                confidence=0.0,
            )
        elif status_val == "PARTIAL":
            msg = pred_res.get("explanation", {}).get("value", "Crop not supported by metric yield model.")
            warnings.append(msg)
            estimate = YieldEstimate(
                status="PARTIAL",
                message=msg,
                expected_yield_quintals_per_acre=None,
                yield_range_lower=None,
                yield_range_upper=None,
                adjustment_factors=[],
                confidence=0.0,
            )
        else:
            estimate = YieldEstimate(
                status="WORKING",
                message=f"Predicted expected yield: {pred_res['expected_yield_quintals_per_acre']} q/acre (Range: {pred_res['yield_range_lower']} - {pred_res['yield_range_upper']} q/acre).",
                expected_yield_quintals_per_acre=pred_res["expected_yield_quintals_per_acre"],
                yield_range_lower=pred_res["yield_range_lower"],
                yield_range_upper=pred_res["yield_range_upper"],
                adjustment_factors=adj_strings,
                confidence=pred_res.get("explanation", {}).get("confidence", 0.80),
            )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "crop_name": crop_name,
                "state": state,
                "district": district,
                "season": season,
                "area_acres": area_acres,
                "fungal_disease_evaluated": fungal_disease,
                "moisture_stress_evaluated": moisture_stress,
            },
            outputs=estimate.model_dump(),
            confidence=estimate.confidence,
            warnings=warnings,
        )
