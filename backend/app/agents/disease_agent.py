from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Any, Dict, Optional

from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import DiseaseFinding
from backend.app.config import settings
from backend.app.ml.disease_model import disease_model
from backend.app.schemas.envelope import AgentEnvelope


class DiseaseAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="DiseaseAgent", timeout_seconds=timeout_seconds)

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        image_path = context.get("image_path")
        image_bytes = context.get("image_bytes")
        crop_name = context.get("crop_name") or context.get("crop_hint")
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

        humidity = float(weather_output.get("relative_humidity_pct", 0.0)) if weather_output else 0.0
        fungal_risk_elevated = humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT

        # Rule-based weather fungal factor (always separate, never modifies raw CV model confidence)
        weather_fungal_factor = None
        if fungal_risk_elevated:
            weather_fungal_factor = (
                f"Relative humidity is {humidity:.1f}%, exceeding indicative "
                f"{settings.FUNGAL_HUMIDITY_THRESHOLD_PCT}% threshold; microclimate favors fungal sporulation."
            )

        # Case 1: Image provided (either as raw bytes or valid file path)
        if image_bytes or (image_path and os.path.exists(image_path)):
            if not image_bytes and image_path:
                try:
                    with open(image_path, "rb") as f:
                        image_bytes = f.read()
                except Exception as e:
                    warnings.append(f"Failed to read image file at {image_path}: {e}")

            if image_bytes:
                predict_res = await disease_model.predict_async(image_bytes, crop_hint=crop_name)
                if predict_res.get("success"):
                    for w in predict_res.get("warnings", []):
                        if w not in warnings:
                            warnings.append(w)

                    pred_disease = predict_res["predicted_disease"]
                    conf = predict_res["prediction_confidence"]

                    # Assess risk level
                    if "healthy" in pred_disease.lower():
                        risk_level = "low"
                    elif predict_res.get("is_uncertain"):
                        risk_level = "medium"
                    elif conf >= 0.70:
                        risk_level = "high"
                    else:
                        risk_level = "medium"

                    finding = DiseaseFinding(
                        status="WORKING",
                        message="Vision inference completed successfully",
                        image_provided=True,
                        detected_disease=pred_disease,
                        risk_level=risk_level,
                        confidence=conf,
                        confidence_type="prediction confidence (uncalibrated)",
                        fungal_risk_elevated=fungal_risk_elevated,
                        safe_ipm_steps=predict_res.get("safe_ipm_steps", []),
                        crop_hint=crop_name,
                        predicted_crop=predict_res.get("predicted_crop"),
                        predicted_class=predict_res.get("predicted_class"),
                        is_uncertain=predict_res.get("is_uncertain", False),
                        crop_supported=predict_res.get("crop_supported", True),
                        quality_gate_passed=True,
                        weather_fungal_risk_factor=weather_fungal_factor,
                        top3_predictions=predict_res.get("top3_predictions", []),
                        symptoms=predict_res.get("symptoms"),
                        sources=predict_res.get("sources", []),
                        scheme_tags=predict_res.get("scheme_tags", []),
                        warnings=warnings,
                    )

                    return AgentEnvelope(
                        agent_name=self.name,
                        status="degraded" if is_degraded else "success",
                        timestamp=now,
                        inputs_used={
                            "image_provided": True,
                            "crop_hint": crop_name,
                            "humidity_pct": humidity,
                        },
                        outputs=finding.model_dump(),
                        confidence=conf,
                        warnings=warnings,
                    )
                else:
                    # Quality gate rejected or corrupt format
                    err_msg = predict_res.get("error", "Vision analysis failed")
                    warnings.append(err_msg)
                    finding = DiseaseFinding(
                        status="PARTIAL",
                        message=err_msg,
                        image_provided=True,
                        detected_disease=None,
                        risk_level=None,
                        confidence=0.0,
                        fungal_risk_elevated=fungal_risk_elevated,
                        safe_ipm_steps=[],
                        quality_gate_passed=False,
                        weather_fungal_risk_factor=weather_fungal_factor,
                        warnings=warnings,
                    )
                    return AgentEnvelope(
                        agent_name=self.name,
                        status="degraded",
                        timestamp=now,
                        inputs_used={"image_provided": True, "humidity_pct": humidity},
                        outputs=finding.model_dump(),
                        confidence=0.0,
                        warnings=warnings,
                    )

        # Case 2: Partial run mode (no image provided)
        warnings.append("No crop leaf image provided in request. Running in partial mode (CV vision analysis skipped).")
        finding = DiseaseFinding(
            status="stub",
            message="not implemented yet",
            image_provided=False,
            detected_disease=None,
            risk_level=None,
            confidence=0.0,
            fungal_risk_elevated=fungal_risk_elevated,
            safe_ipm_steps=[],
            weather_fungal_risk_factor=weather_fungal_factor,
            warnings=warnings,
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "image_provided": False,
                "humidity_pct": humidity,
            },
            outputs=finding.model_dump(),
            confidence=0.0,
            warnings=warnings,
        )
