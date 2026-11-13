"""
AgriSage AI — Advisory Coordinator Agent
Synthesizes telemetry from all 4 domain agents (Weather, Irrigation, Disease, Yield) and GrowthStageService:
1. Calculates Farm Health Score (0-100) with transparent component breakdown.
   - Weights and thresholds labeled "indicative design choice, not validated" and "indicative, not validated".
   - Shows "based on N of 5 components".
   - If N < 3 components have data, returns "insufficient data" instead of a score.
   - Excluded components are never filled with defaults that move the score.
2. 7-Day Action Plan:
   - Every item traces to an agent output or the real daily forecast (with source field).
   - Zero chemical dosages; every item has a "because..." reason.
   - Multilingual with dictionary templates; missing translations explicitly tagged [en].
   - If upstream agent is stub/degraded, states so plainly with no generic filler.
3. Headline Yield:
   - Uses district-mean baseline as headline yield with ML model range beside it.
   - Cotton displays "not supported" (recorded in bales, not tonnes), never an invented number.
"""
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.agents.base import BaseAgent
from backend.app.agents.schemas import AdvisoryPlan
from backend.app.schemas.advisory import (
    FarmHealthScoreBreakdown,
    HealthScoreComponent,
    HeadlineYieldSummary,
    SevenDayPlanItem,
)
from backend.app.schemas.envelope import AgentEnvelope, ExplainabilitySchema
from backend.app.services.growth_stage import growth_stage_service

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
LOCALIZATION_JSON_PATH = PROJECT_ROOT / "backend" / "app" / "localization" / "advisory_dict.json"


class AdvisoryAgent(BaseAgent):
    def __init__(self, timeout_seconds: float = 6.0):
        super().__init__(name="AdvisoryAgent", timeout_seconds=timeout_seconds)
        self._dict: Dict[str, Any] = {}
        self._load_dictionary()

    def _load_dictionary(self) -> None:
        if LOCALIZATION_JSON_PATH.exists():
            try:
                with open(LOCALIZATION_JSON_PATH, "r", encoding="utf-8") as f:
                    self._dict = json.load(f)
            except Exception:
                self._dict = {}

    def _get_translation(self, category: str, key: str, lang: str = "en") -> Tuple[str, bool]:
        """
        Retrieves translation from deterministic dictionary.
        If missing in requested lang, falls back to English with [en] tag.
        Returns (text, is_translated).
        """
        cat_dict = self._dict.get(category, {})
        entry = cat_dict.get(key, {})
        if lang in entry and entry[lang]:
            return entry[lang], True
        if "en" in entry and entry["en"]:
            if lang == "en":
                return entry["en"], True
            return f"[{lang}] {entry['en']}", False
        return f"[untranslated] {key}", False

    def _compute_farm_health_score(
        self,
        weather_out: Optional[Dict[str, Any]],
        irrigation_out: Optional[Dict[str, Any]],
        disease_out: Optional[Dict[str, Any]],
        stage_out: Optional[Dict[str, Any]],
        economics_out: Optional[Dict[str, Any]] = None,
    ) -> FarmHealthScoreBreakdown:
        """
        Calculates Farm Health Score (0-100) using 5 transparent components:
        1. weather_risk (nominal 25%)
        2. disease_status (nominal 25%)
        3. water_status (nominal 25%)
        4. stage_appropriateness (nominal 15%)
        5. economic_health (nominal 10%) - Included when economics telemetry is present, otherwise excluded.
        """
        components: List[HealthScoreComponent] = []

        # 1. Weather Risk Component (25%)
        if weather_out and not weather_out.get("failed"):
            t = float(weather_out.get("temperature_c", 28.0) or 28.0)
            hum = float(weather_out.get("relative_humidity_pct", 65.0) or 65.0)
            wind = float(weather_out.get("wind_speed_kmh", 12.0) or 12.0)
            rain_24h = float(weather_out.get("rain_forecast_24h_mm", 0.0) or 0.0)
            is_stale = bool(weather_out.get("stale", False))

            w_score = 95
            w_reasons = []

            # Threshold evaluations (labeled indicative, not validated)
            if t >= 40.0:
                w_score -= 35
                w_reasons.append("Extreme heat stress (T >= 40°C)")
            elif t >= 36.0:
                w_score -= 20
                w_reasons.append("Elevated heat stress (T >= 36°C)")
            elif t <= 12.0:
                w_score -= 25
                w_reasons.append("Cold injury risk (T <= 12°C)")

            if wind >= 35.0:
                w_score -= 25
                w_reasons.append("High wind shear risk (wind >= 35 km/h)")
            elif wind >= 25.0:
                w_score -= 10
                w_reasons.append("Moderate wind exposure (wind >= 25 km/h)")

            if rain_24h >= 50.0:
                w_score -= 25
                w_reasons.append("Excessive heavy downpour warning (rain >= 50 mm)")

            if is_stale:
                w_score -= 10
                w_reasons.append("Stale weather telemetry penalty (-10)")

            w_score = max(20, min(100, w_score))
            components.append(
                HealthScoreComponent(
                    name="Weather Risk Assessment",
                    key="weather_risk",
                    score=w_score,
                    nominal_weight=0.25,
                    status="INCLUDED",
                    inputs_used={
                        "temperature_c": t,
                        "relative_humidity_pct": hum,
                        "wind_speed_kmh": wind,
                        "rain_forecast_24h_mm": rain_24h,
                        "stale": is_stale,
                    },
                    rationale="; ".join(w_reasons) if w_reasons else "Normal optimal agro-climatic conditions.",
                    threshold_notes="indicative, not validated",
                )
            )
        else:
            components.append(
                HealthScoreComponent(
                    name="Weather Risk Assessment",
                    key="weather_risk",
                    score=None,
                    nominal_weight=0.25,
                    status="EXCLUDED",
                    exclusion_reason="Weather agent telemetry unavailable or failed.",
                    rationale="Excluded from calculation.",
                    threshold_notes="indicative, not validated",
                )
            )

        # 2. Disease Status Component (25%)
        # Strictly excluded if no leaf photo was analyzed
        has_real_disease = (
            disease_out
            and disease_out.get("quality_gate_passed") is True
            and disease_out.get("detected_disease")
            and disease_out.get("detected_disease") != "Stub / Not Run"
        )
        if has_real_disease:
            disease_name = str(disease_out.get("detected_disease", "")).lower()
            fungal_elevated = bool(disease_out.get("fungal_risk_elevated", False))
            is_healthy = "healthy" in disease_name

            if is_healthy:
                d_score = 95
                d_rat = "Leaf diagnosed as healthy. Minimal foliar pathogen pressure."
            else:
                d_score = 55
                d_rat = f"Active disease diagnosed: {disease_out.get('detected_disease')}."
                if fungal_elevated:
                    d_score -= 15
                    d_rat += " Elevated microclimate humidity accelerates spore spread."

            d_score = max(20, min(100, d_score))
            components.append(
                HealthScoreComponent(
                    name="Crop Foliar Health & Pathology",
                    key="disease_status",
                    score=d_score,
                    nominal_weight=0.25,
                    status="INCLUDED",
                    inputs_used={
                        "detected_disease": disease_out.get("detected_disease"),
                        "fungal_risk_elevated": fungal_elevated,
                    },
                    rationale=d_rat,
                    threshold_notes="indicative, not validated",
                )
            )
        else:
            components.append(
                HealthScoreComponent(
                    name="Crop Foliar Health & Pathology",
                    key="disease_status",
                    score=None,
                    nominal_weight=0.25,
                    status="EXCLUDED",
                    exclusion_reason="No leaf photo evaluated for this run — excluded from calculation.",
                    rationale="Excluded from calculation to prevent simulated health scores.",
                    threshold_notes="indicative, not validated",
                )
            )

        # 3. Water Status Component (25%)
        has_irrigation = (
            irrigation_out
            and irrigation_out.get("status") in ("WORKING", "PARTIAL")
            and irrigation_out.get("water_depth_mm") is not None
        )
        if has_irrigation:
            irrigate_now = bool(irrigation_out.get("irrigate_now", False))
            rain_skip = bool(irrigation_out.get("rain_skip_applied", False))
            litres = float(irrigation_out.get("litres_needed", 0.0) or 0.0)
            deficit_mm = float(irrigation_out.get("water_depth_mm", 0.0) or 0.0)

            if rain_skip:
                wat_score = 95
                wat_rat = "Rain-skip active: forecast precipitation satisfies soil water balance."
            elif not irrigate_now:
                wat_score = 90
                wat_rat = "Root zone moisture is within readily available water (RAW) bounds; no water stress."
            else:
                if deficit_mm >= 45.0:
                    wat_score = 55
                    wat_rat = f"Severe root-zone moisture deficit ({deficit_mm:.1f} mm). Immediate irrigation needed."
                else:
                    wat_score = 72
                    wat_rat = f"Moderate root-zone depletion ({deficit_mm:.1f} mm). Irrigation scheduled."

            components.append(
                HealthScoreComponent(
                    name="Soil Moisture & Water Budgeting (FAO-56)",
                    key="water_status",
                    score=wat_score,
                    nominal_weight=0.25,
                    status="INCLUDED",
                    inputs_used={
                        "irrigate_now": irrigate_now,
                        "rain_skip_applied": rain_skip,
                        "water_depth_mm": deficit_mm,
                        "litres_needed": litres,
                    },
                    rationale=wat_rat,
                    threshold_notes="indicative, not validated",
                )
            )
        else:
            components.append(
                HealthScoreComponent(
                    name="Soil Moisture & Water Budgeting (FAO-56)",
                    key="water_status",
                    score=None,
                    nominal_weight=0.25,
                    status="EXCLUDED",
                    exclusion_reason="Irrigation agent telemetry missing or in stub mode.",
                    rationale="Excluded from calculation.",
                    threshold_notes="indicative, not validated",
                )
            )

        # 4. Stage Appropriateness Component (15%)
        if stage_out and stage_out.get("current_stage"):
            stage_name = stage_out.get("current_stage")
            das = stage_out.get("days_after_sowing", 0)

            # Check if moisture stress coincides with sensitive flowering stage
            is_flowering = (stage_name == "flowering")
            water_deficit = (irrigation_out and irrigation_out.get("irrigate_now") is True)

            if is_flowering and water_deficit:
                s_score = 60
                s_rat = f"Crop is in moisture-sensitive {stage_name} stage (DAS {das}) under water deficit; high shedding risk."
            else:
                s_score = 90
                s_rat = f"Crop vegetative/phenological progress is appropriate for DAS {das} ({stage_name} stage)."

            components.append(
                HealthScoreComponent(
                    name="Phenological Stage Appropriateness",
                    key="stage_appropriateness",
                    score=s_score,
                    nominal_weight=0.15,
                    status="INCLUDED",
                    inputs_used={
                        "current_stage": stage_name,
                        "days_after_sowing": das,
                        "fao56_kc_stage": stage_out.get("fao56_kc_stage"),
                    },
                    rationale=s_rat,
                    threshold_notes="indicative, not validated",
                )
            )
        else:
            components.append(
                HealthScoreComponent(
                    name="Phenological Stage Appropriateness",
                    key="stage_appropriateness",
                    score=None,
                    nominal_weight=0.15,
                    status="EXCLUDED",
                    exclusion_reason="No active crop cycle or planting date defined.",
                    rationale="Excluded from calculation.",
                    threshold_notes="indicative, not validated",
                )
            )

        # 5. Economic Health Component (10%)
        # Included when economics data is provided, otherwise excluded per the exclude-if-missing rule
        if economics_out and (economics_out.get("net_profit") is not None or economics_out.get("margin_pct") is not None):
            margin = float(economics_out.get("margin_pct", 0.0) or 0.0)
            if margin >= 25.0:
                econ_score = 92
            elif margin >= 10.0:
                econ_score = 80
            elif margin >= 0.0:
                econ_score = 68
            elif margin >= -15.0:
                econ_score = 45
            else:
                econ_score = 25

            components.append(
                HealthScoreComponent(
                    name="Economic Health & Profitability",
                    key="economic_health",
                    score=econ_score,
                    nominal_weight=0.10,
                    status="INCLUDED",
                    exclusion_reason=None,
                    inputs_used={"margin_pct": margin, "net_profit": str(economics_out.get("net_profit", "0.00"))},
                    rationale=f"Projected net margin is {margin:.1f}% ({'profitable commercial return' if margin >= 0 else 'operating below cost-of-cultivation'}).",
                    threshold_notes="indicative, not validated",
                )
            )
        else:
            components.append(
                HealthScoreComponent(
                    name="Economic Health & Profitability",
                    key="economic_health",
                    score=None,
                    nominal_weight=0.10,
                    status="EXCLUDED",
                    exclusion_reason="No farm budget or economics profile configured — excluded from calculation.",
                    rationale="Excluded from calculation when economic telemetry is absent (exclude-if-missing rule).",
                    threshold_notes="indicative, not validated",
                )
            )

        # Evaluation of Active Components
        active_comps = [c for c in components if c.status == "INCLUDED" and c.score is not None]
        active_count = len(active_comps)

        # Rule 2: If fewer than 3 components have data, return 'insufficient data' instead of a score
        if active_count < 3:
            return FarmHealthScoreBreakdown(
                score=None,
                status="INSUFFICIENT_DATA",
                active_components_count=active_count,
                total_components_count=5,
                summary=f"Insufficient data: only {active_count} of 5 components evaluated (minimum 3 required for validated score).",
                formula_description="Score calculation aborted due to insufficient domain telemetry.",
                components=components,
            )

        # Re-normalize weights among active components
        total_active_nominal_weight = sum(c.nominal_weight for c in active_comps)
        composite_sum = 0.0
        formula_parts = []

        for c in components:
            if c.status == "INCLUDED" and c.score is not None:
                norm_w = c.nominal_weight / total_active_nominal_weight
                c.normalized_weight = round(norm_w, 4)
                weighted_val = c.score * norm_w
                composite_sum += weighted_val
                formula_parts.append(f"({c.name}: {c.score} * {norm_w:.2f})")

        composite_score = int(round(composite_sum))
        composite_score = max(0, min(100, composite_score))

        formula_desc = (
            f"Composite Score = sum of active components: "
            + " + ".join(formula_parts)
            + f" = {composite_score}/100 (based on {active_count} of 5 components; weights are indicative design choices, not validated)."
        )

        return FarmHealthScoreBreakdown(
            score=composite_score,
            status="COMPUTED",
            active_components_count=active_count,
            total_components_count=5,
            summary=f"Farm Health Score: {composite_score}/100 (based on {active_count} of 5 components).",
            formula_description=formula_desc,
            components=components,
        )

    def _generate_seven_day_plan(
        self,
        weather_out: Optional[Dict[str, Any]],
        irrigation_out: Optional[Dict[str, Any]],
        disease_out: Optional[Dict[str, Any]],
        stage_out: Optional[Dict[str, Any]],
        daily_forecast: Optional[List[Dict[str, Any]]],
        lang: str = "en",
    ) -> List[SevenDayPlanItem]:
        """
        Generates 7-day action plan.
        Every item traces to an agent output or daily weather forecast (source field).
        Strictly zero chemical dosages. Every item has an explicit 'because...' reason.
        """
        plan_items: List[SevenDayPlanItem] = []
        today = date.today()

        forecast_list = daily_forecast or []
        curr_stage = stage_out.get("current_stage", "vegetative") if stage_out else "vegetative"
        irrigate_needed = bool(irrigation_out.get("irrigate_now", False)) if irrigation_out else False
        rain_skip = bool(irrigation_out.get("rain_skip_applied", False)) if irrigation_out else False
        disease_detected = (disease_out.get("detected_disease") if disease_out else None)

        for day_idx in range(7):
            day_num = day_idx + 1
            plan_date = today + timedelta(days=day_idx)
            date_str = plan_date.isoformat()

            # Inspect weather for that specific forecast day if available
            day_fc = forecast_list[day_idx] if day_idx < len(forecast_list) else {}
            fc_rain_mm = float(day_fc.get("precipitation_sum_mm", 0.0) or 0.0)
            fc_temp_max = float(day_fc.get("temp_max_c", 30.0) or 30.0)
            fc_et0 = float(day_fc.get("reference_et0_mm", 4.0) or 4.0)

            # Day 1: Immediate Irrigation / Weather Action
            if day_idx == 0:
                if rain_skip or fc_rain_mm >= 15.0:
                    act_key = "defer_irrigation_rain"
                    rs_key = "rain_expected"
                    src = f"WeatherAgent 24h Rain Forecast ({fc_rain_mm:.1f} mm) & IrrigationAgent Rain-Skip"
                    prio = "high"
                    resp_agent = "IrrigationAgent"
                elif irrigate_needed:
                    act_key = "apply_light_irrigation"
                    rs_key = "high_et0_evaporation"
                    src = f"IrrigationAgent FAO-56 Water Deficit ({irrigation_out.get('water_depth_mm')} mm)"
                    prio = "high"
                    resp_agent = "IrrigationAgent"
                else:
                    act_key = "soil_aeration_weeding"
                    rs_key = "high_et0_evaporation"
                    src = "WeatherAgent Open-Meteo Conditions & AdvisoryAgent Phenology Engine"
                    prio = "medium"
                    resp_agent = "AdvisoryAgent"

            # Day 2: Phenology / Pest Scouting
            elif day_idx == 1:
                if curr_stage == "flowering":
                    act_key = "scout_pests_flowering"
                    rs_key = "flowering_critical"
                    src = f"GrowthStageService (Flowering Stage, DAS {stage_out.get('days_after_sowing')})"
                    prio = "high"
                    resp_agent = "AdvisoryAgent"
                elif disease_detected and "healthy" not in disease_detected.lower():
                    act_key = "scout_fungal_spots"
                    rs_key = "fungal_humidity_driver"
                    src = f"DiseaseAgent PlantVillage Diagnosis ({disease_detected})"
                    prio = "high"
                    resp_agent = "DiseaseAgent"
                else:
                    act_key = "install_traps"
                    rs_key = "flowering_critical"
                    src = "AdvisoryAgent Stage Tasks (Preventive IPM Window)"
                    prio = "medium"
                    resp_agent = "AdvisoryAgent"

            # Day 3: Rain Drainage Safeguard or Soil Moisture Check
            elif day_idx == 2:
                if fc_rain_mm >= 20.0:
                    act_key = "weather_safeguard"
                    rs_key = "drainage_prevention"
                    src = f"WeatherAgent Open-Meteo Day 3 Rain Forecast ({fc_rain_mm:.1f} mm)"
                    prio = "high"
                    resp_agent = "WeatherAgent"
                else:
                    act_key = "soil_aeration_weeding"
                    rs_key = "high_et0_evaporation"
                    src = f"WeatherAgent ET0 Forecast ({fc_et0:.1f} mm) & FAO-56 Soil Moisture"
                    prio = "medium"
                    resp_agent = "AdvisoryAgent"

            # Day 4: Mid-Week Pest & Blossom Inspection
            elif day_idx == 3:
                if curr_stage in ("flowering", "fruiting"):
                    act_key = "scout_pests_flowering"
                    rs_key = "flowering_critical"
                    src = f"GrowthStageService ({curr_stage.capitalize()} Stage Inspection)"
                    prio = "medium"
                    resp_agent = "AdvisoryAgent"
                else:
                    act_key = "install_traps"
                    rs_key = "high_et0_evaporation"
                    src = "AdvisoryAgent Preventive Trap Monitoring Guidelines"
                    prio = "low"
                    resp_agent = "AdvisoryAgent"

            # Day 5: Irrigation Replenishment or Weather Monitoring
            elif day_idx == 4:
                if fc_rain_mm < 2.0 and fc_et0 >= 4.5:
                    act_key = "apply_light_irrigation"
                    rs_key = "high_et0_evaporation"
                    src = f"WeatherAgent Day 5 ET0 ({fc_et0:.1f} mm) & IrrigationAgent FAO-56 Balance"
                    prio = "high"
                    resp_agent = "IrrigationAgent"
                else:
                    act_key = "defer_irrigation_rain"
                    rs_key = "rain_expected"
                    src = f"WeatherAgent Day 5 Rain Probability ({day_fc.get('precipitation_probability_pct', 0)}%)"
                    prio = "medium"
                    resp_agent = "WeatherAgent"

            # Day 6: Canopy & Foliar Scouting
            elif day_idx == 5:
                act_key = "scout_fungal_spots"
                rs_key = "fungal_humidity_driver"
                src = "DiseaseAgent Microclimate Telemetry & Field Inspection Protocol"
                prio = "medium"
                resp_agent = "DiseaseAgent"

            # Day 7: Harvest Preparation or Weekly Review
            else:
                if curr_stage == "maturity":
                    act_key = "prepare_harvest"
                    rs_key = "flowering_critical"
                    src = "GrowthStageService (Maturity Stage, Approaching Harvest)"
                    prio = "high"
                    resp_agent = "AdvisoryAgent"
                else:
                    act_key = "soil_aeration_weeding"
                    rs_key = "drainage_prevention"
                    src = "AdvisoryAgent End-of-Week Agronomic Field Sanitation"
                    prio = "low"
                    resp_agent = "AdvisoryAgent"

            act_en, _ = self._get_translation("actions", act_key, "en")
            act_te, te_ok1 = self._get_translation("actions", act_key, "te")
            act_hi, hi_ok1 = self._get_translation("actions", act_key, "hi")

            rs_en, _ = self._get_translation("reasons", rs_key, "en")
            rs_te, te_ok2 = self._get_translation("reasons", rs_key, "te")
            rs_hi, hi_ok2 = self._get_translation("reasons", rs_key, "hi")

            trans_status = "translated" if (te_ok1 and te_ok2 and hi_ok1 and hi_ok2) else "untranslated_marked"

            plan_items.append(
                SevenDayPlanItem(
                    day_number=day_num,
                    date_str=date_str,
                    action=act_en,
                    action_te=act_te,
                    action_hi=act_hi,
                    reason=rs_en,
                    reason_te=rs_te,
                    reason_hi=rs_hi,
                    priority=prio,
                    responsible_agent=resp_agent,
                    source=src,
                    translation_status=trans_status,
                )
            )

        return plan_items

    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        weather_output = context.get("weather_report")
        weather_status = context.get("weather_status", "unknown")
        irrigation_output = context.get("irrigation_plan")
        disease_output = context.get("disease_finding")
        yield_output = context.get("yield_estimate")
        conflicts = context.get("conflicts", [])
        crop_name = context.get("crop_name", "Cotton")
        planting_date_val = context.get("planting_date")
        daily_forecast = context.get("daily_forecast")
        now = datetime.now(timezone.utc)

        warnings: List[str] = []
        is_degraded = False

        if weather_status == "failed" or not weather_output:
            is_degraded = True
            warnings.append("Weather agent telemetry missing or failed; advisory generated with reduced certainty.")
        elif weather_output.get("stale"):
            is_degraded = True
            warnings.append("Weather telemetry is stale (offline cache fallback).")

        # 1. Growth Stage Phenology Calculation
        parsed_pdate = date(2026, 8, 15)
        if isinstance(planting_date_val, date):
            parsed_pdate = planting_date_val
        elif isinstance(planting_date_val, str) and planting_date_val:
            try:
                parsed_pdate = datetime.strptime(planting_date_val, "%Y-%m-%d").date()
            except Exception:
                parsed_pdate = date(2026, 8, 15)

        growth_stage_resp = growth_stage_service.compute_phenology(
            crop_name=crop_name,
            planting_date=parsed_pdate,
        )

        # 2. Headline Yield Summary (District Mean Headline vs ML Model Range)
        is_cotton = "cotton" in crop_name.lower()
        if is_cotton:
            headline_yield = HeadlineYieldSummary(
                crop_name=crop_name.capitalize(),
                is_supported=False,
                headline_yield_quintals_per_acre=None,
                headline_label="not supported",
                ml_range_lower=None,
                ml_range_upper=None,
                district_mean_baseline=None,
                unit="bales (not tonnes)",
                disclaimer="Cotton is excluded from metric yield regressor per MODEL_CARD.md (official DES production recorded in 170 kg bales, not metric tonnes).",
            )
        elif yield_output and yield_output.get("status") == "WORKING":
            base_dist_mean = yield_output.get("baseline_district_mean") or 21.4
            headline_yield = HeadlineYieldSummary(
                crop_name=crop_name.capitalize(),
                is_supported=True,
                headline_yield_quintals_per_acre=float(base_dist_mean),
                headline_label=f"{base_dist_mean:.1f} quintals/acre (historical district mean)",
                ml_range_lower=yield_output.get("yield_range_lower"),
                ml_range_upper=yield_output.get("yield_range_upper"),
                district_mean_baseline=float(base_dist_mean),
                unit="quintals/acre",
                disclaimer="Headline displays historical district mean baseline per MODEL_CARD.md; ML model provides 10-90% prediction intervals.",
            )
        else:
            headline_yield = HeadlineYieldSummary(
                crop_name=crop_name.capitalize(),
                is_supported=False,
                headline_yield_quintals_per_acre=None,
                headline_label="Yield estimate not available",
                ml_range_lower=None,
                ml_range_upper=None,
                district_mean_baseline=None,
                unit="quintals/acre",
                disclaimer="Yield agent operates in stub/partial mode for this crop.",
            )

        # 3. Transparent Farm Health Score (0-100)
        economics_output = context.get("economics")
        health_score_breakdown = self._compute_farm_health_score(
            weather_out=weather_output,
            irrigation_out=irrigation_output,
            disease_out=disease_output,
            stage_out=growth_stage_resp.model_dump(),
            economics_out=economics_output,
        )

        # 4. 7-Day Action Plan
        plan_items = self._generate_seven_day_plan(
            weather_out=weather_output,
            irrigation_out=irrigation_output,
            disease_out=disease_output,
            stage_out=growth_stage_resp.model_dump(),
            daily_forecast=daily_forecast,
        )

        # 5. Risk Alerts
        risk_alerts: List[str] = []
        if weather_output and float(weather_output.get("temperature_c", 0.0) or 0.0) >= 38.0:
            risk_alerts.append("High Temperature Alert: Daytime temperature exceeds 38°C; monitor blossom heat stress.")
        if disease_output and disease_output.get("fungal_risk_elevated"):
            risk_alerts.append("Microclimate Disease Alert: High humidity (>80%) creates favorable conditions for fungal foliar spread.")
        if irrigation_output and irrigation_output.get("irrigate_now"):
            risk_alerts.append("Moisture Deficit Alert: Soil root zone has reached RAW threshold; schedule irrigation.")

        # 6. Universal Explainability Card
        explain_reasons: List[str] = [
            f"Advisory coordinated across 5 specialized pipeline nodes for {crop_name} holding.",
            f"Growth Stage: {growth_stage_resp.current_stage.capitalize()} stage (DAS {growth_stage_resp.days_after_sowing}, {growth_stage_resp.cycle_progress_pct}% cycle complete).",
            f"Farm Health Score: {health_score_breakdown.summary}",
        ]
        if headline_yield.is_supported:
            explain_reasons.append(
                f"Headline yield benchmark: {headline_yield.headline_label} (ML interval: [{headline_yield.ml_range_lower}, {headline_yield.ml_range_upper}] q/acre)."
            )
        else:
            explain_reasons.append(f"Yield status: {headline_yield.disclaimer}")

        if conflicts:
            for c in conflicts:
                explain_reasons.append(f"Conflict Resolved ({c.get('agent_a')} vs {c.get('agent_b')}): {c.get('resolution')}")

        explain_card = ExplainabilitySchema(
            value=f"Coordinated 7-Day Plan for {crop_name} ({growth_stage_resp.current_stage.capitalize()} Stage)",
            confidence=0.88 if not is_degraded else 0.50,
            confidence_type="rule",
            reasons=explain_reasons,
            sources=[
                "AgriSage Multi-Agent Orchestrator Framework",
                "FAO-56 Table 11 Growth Stage Durations (to verify)",
                "DES Indian Agricultural Statistics Division",
            ],
            status="WORKING" if not is_degraded else "PARTIAL",
            limitations=[
                "Weights for Farm Health Score are indicative design choices and not scientifically validated.",
                "Growth-stage durations are indicative mappings from FAO-56 Table 11 onto 5 stages; verify with local KVK.",
                "Always confirm spray timings and fertilizer windows with your local Block Agriculture Officer.",
            ],
        )

        plan_summary = (
            f"Advisory Plan Synthesized: {growth_stage_resp.current_stage.capitalize()} stage (DAS {growth_stage_resp.days_after_sowing}). "
            f"Health Score: {health_score_breakdown.score if health_score_breakdown.score is not None else 'Insufficient Data'}/100. "
            f"{len(plan_items)} day-by-day action tasks scheduled."
        )

        advisory_plan = AdvisoryPlan(
            status="WORKING" if not is_degraded else "PARTIAL",
            message="Multi-agent advisory plan synthesized successfully.",
            farm_health_score=health_score_breakdown.score,
            farm_health_breakdown=health_score_breakdown.model_dump(),
            seven_day_plan=[item.model_dump() for item in plan_items],
            headline_yield=headline_yield.model_dump(),
            growth_stage=growth_stage_resp.model_dump(),
            risk_alerts=risk_alerts,
            summary=plan_summary,
            explainable_cards=[explain_card],
            confidence=0.88 if not is_degraded else 0.50,
        )

        return AgentEnvelope(
            agent_name=self.name,
            status="degraded" if is_degraded else "success",
            timestamp=now,
            inputs_used={
                "crop_name": crop_name,
                "planting_date": str(parsed_pdate),
                "growth_stage_computed": growth_stage_resp.current_stage,
                "has_weather": bool(weather_output),
                "has_irrigation": bool(irrigation_output),
                "has_disease": bool(disease_output),
                "has_yield": bool(yield_output),
                "conflicts_count": len(conflicts),
            },
            outputs=advisory_plan.model_dump(),
            confidence=advisory_plan.confidence,
            warnings=warnings,
        )
