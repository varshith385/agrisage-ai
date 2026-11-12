from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict
from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import IrrigationPlan
from backend.app.config import settings
from backend.app.ml.irrigation import irrigation_engine
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

        # Rule-based conflict flags
        rain_24h = weather_output.get("rain_forecast_24h_mm", 0.0) if weather_output else 0.0
        rain_48h = weather_output.get("rain_forecast_48h_mm", 0.0) if weather_output else 0.0
        humidity = weather_output.get("relative_humidity_pct", 0.0) if weather_output else 0.0
        et0 = weather_output.get("reference_et0_mm", 4.5) if weather_output else 4.5

        rain_skip_triggered = rain_24h >= settings.RAIN_CONFLICT_THRESHOLD_MM
        foliar_wetness_caution = (
            humidity >= settings.FUNGAL_HUMIDITY_THRESHOLD_PCT
            and str(irrigation_method).lower() in ["sprinkler", "flood", "overhead"]
        )

        # Check if crop information is provided (either direct or via crop_cycle/farm)
        crop_name = context.get("crop_name")
        crop_cycle = context.get("crop_cycle")
        farm = context.get("farm")

        if crop_cycle and not crop_name:
            crop_name = getattr(crop_cycle, "crop_name", None)

        if not crop_name and farm and hasattr(farm, "current_crop_cycles"):
            active_cycles = [c for c in farm.current_crop_cycles if getattr(c, "is_active", True)]
            if active_cycles:
                crop_name = active_cycles[0].crop_name
                crop_cycle = active_cycles[0]

        # STUB MODE: If no crop is available, maintain honest stub contract (zero invented numbers)
        if not crop_name or weather_status == "failed":
            plan = IrrigationPlan(
                status="stub",
                message="not implemented yet" if not crop_name else "degraded due to weather failure",
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
                    "crop_available": bool(crop_name),
                    "weather_available": bool(weather_output),
                    "weather_stale": weather_output.get("stale", False) if weather_output else False,
                },
                outputs=plan.model_dump(),
                confidence=0.0,
                warnings=warnings,
            )

        # FULL FAO-56 EXECUTION MODE:
        # Determine planting date
        planting_date = getattr(crop_cycle, "planting_date", None) if crop_cycle else None
        if not planting_date:
            planting_date = date.today() - timedelta(days=35)  # default mid-vegetative if unrecorded

        soil_type = getattr(farm, "soil_type", "Black Cotton") if farm else "Black Cotton"
        area_acres = float(getattr(farm, "area", 4.0)) if farm else 4.0
        method_str = getattr(farm, "irrigation_method", irrigation_method) if farm else irrigation_method
        if hasattr(method_str, "value"):
            method_str = method_str.value
        method_str = str(method_str).lower()

        calc_result = irrigation_engine.calculate_plan(
            crop_name=crop_name,
            planting_date=planting_date,
            area_acres=area_acres,
            soil_type=soil_type,
            irrigation_method=method_str,
            reference_et0_mm=et0,
            forecast_rain_24h_mm=rain_24h,
            forecast_rain_48h_mm=rain_48h,
        )

        plan = IrrigationPlan(
            status="WORKING",
            message="FAO-56 crop water requirement evaluated",
            irrigate=calc_result["should_irrigate"],
            water_depth_mm=calc_result["gross_depth_mm"],
            litres_needed=calc_result["litres_needed"],
            litres_saved=calc_result["litres_saved"],
            recommendation_text=calc_result["recommendation_text"],
            rain_skip_triggered=calc_result["rain_skip_triggered"],
            foliar_wetness_caution=foliar_wetness_caution,
            confidence=0.88,
            growth_stage=calc_result["growth_stage"],
            days_after_sowing=calc_result["days_after_sowing"],
            kc=calc_result["kc"],
            reference_et0_mm=calc_result["reference_et0_mm"],
            etc_today_mm=calc_result["etc_today_mm"],
            effective_rain_today_mm=calc_result["effective_rain_today_mm"],
            net_depth_mm=calc_result["net_depth_mm"],
            gross_depth_mm=calc_result["gross_depth_mm"],
            next_irrigation_date=calc_result["next_irrigation_date"],
            taw_mm=calc_result["taw_mm"],
            raw_mm=calc_result["raw_mm"],
            depletion_today_mm=calc_result["depletion_today_mm"],
            daily_forecast_balance=calc_result["daily_forecast_balance"],
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "crop_name": crop_name,
                "growth_stage": calc_result["growth_stage"],
                "kc": calc_result["kc"],
                "soil_type": soil_type,
                "irrigation_method": method_str,
                "area_acres": area_acres,
                "reference_et0_mm": et0,
                "rain_forecast_24h_mm": rain_24h,
            },
            outputs=plan.model_dump(),
            confidence=0.88 if not is_degraded else 0.50,
            warnings=warnings,
        )
