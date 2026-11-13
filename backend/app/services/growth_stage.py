"""
AgriSage AI — Growth Stage Phenology Engine
Calculates:
1. Days After Sowing (DAS) from planting_date.
2. 5 phenological stages mapped onto FAO-56's 4 stages using lengths from fao56_crop_coefficients.json:
   - Germination & Emergence (FAO-56 initial)
   - Vegetative Growth (FAO-56 development)
   - Flowering (FAO-56 mid stage, first half)
   - Fruiting / Grain Filling (FAO-56 mid stage, second half)
   - Maturity / Harvest (FAO-56 late)
   Labelled explicitly: "indicative mapping onto FAO-56 4-stage model, to verify".
3. Stage-specific tasks & guidance (irrigation sensitivity, fertilizer windows, scouting, spraying safety).
   Labelled: "general guidance, confirm with your local agriculture officer", strictly zero quantities.
"""
from datetime import date, datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.schemas.advisory import (
    AgronomicTaskItem,
    GrowthStageResponse,
    PhenologicalStageInfo,
    StageTasksResponse,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
FAO56_JSON_PATH = PROJECT_ROOT / "backend" / "app" / "ml" / "fao56_crop_coefficients.json"
LOCALIZATION_JSON_PATH = PROJECT_ROOT / "backend" / "app" / "localization" / "advisory_dict.json"

# Fallback in case localization json is unavailable
STAGE_NAMES_DEFAULT = {
    "germination": {
        "en": "Germination & Emergence",
        "te": "మొలకెత్తడం మరియు నాటుకొనడం",
        "hi": "अंकुरण और स्थापना",
    },
    "vegetative": {
        "en": "Vegetative Growth",
        "te": "శాఖా ఎదుగుదల దశ",
        "hi": "वानस्पतिक वृद्धि",
    },
    "flowering": {
        "en": "Flowering & Blossom",
        "te": "పూత దశ",
        "hi": "फूल आने की अवस्था",
    },
    "fruiting": {
        "en": "Fruiting / Boll / Grain Filling",
        "te": "కాయ / గింజ నిండే దశ",
        "hi": "फल / दाना भरने की अवस्था",
    },
    "maturity": {
        "en": "Maturity & Harvest",
        "te": "పక్వత మరియు కోత దశ",
        "hi": "परिपक्वता और कटाई",
    },
}

# General Stage Guidance (Strictly zero chemical quantities per Honesty Rules)
STAGE_GUIDANCE_TEMPLATES = {
    "germination": {
        "irrigation_sensitivity": "Maintain light, uniform surface moisture to assist seed emergence. Avoid crusting and water stagnation.",
        "fertilizer_window": "Basal application at sowing time as per soil test report. Confirm with your local agriculture officer.",
        "scouting_focus": "Check germination percentage at 7-10 DAS. Inspect for damping-off or early cutworm damage.",
        "spraying_window": "Spraying generally not recommended at emergence. Only light bio-seedling drench if damping-off occurs.",
        "guidance_disclaimer": "general guidance, confirm with your local agriculture officer; no quantities",
    },
    "vegetative": {
        "irrigation_sensitivity": "Moderate moisture requirement. Soil should be moist but not waterlogged. Encourage deep root establishment.",
        "fertilizer_window": "Split top-dressing during active tillering / branching stage before flowering begins.",
        "scouting_focus": "Scout lower leaves for early sucking pests (aphids, thrips, jassids) and chewers. Install yellow sticky traps.",
        "spraying_window": "Prefer calm morning hours (7:00 AM - 10:00 AM) or late evening (4:30 PM - 6:30 PM). Avoid spraying in high wind (>15 km/h).",
        "guidance_disclaimer": "general guidance, confirm with your local agriculture officer; no quantities",
    },
    "flowering": {
        "irrigation_sensitivity": "CRITICAL STAGE: Moisture stress or severe water deficit causes heavy flower drop and square shedding. Ensure adequate moisture.",
        "fertilizer_window": "Foliar nutrient booster or secondary split application at early flower initiation if recommended by soil test.",
        "scouting_focus": "Scout blossoms daily for flower-feeding pests (bollworm, midge, thrips) and early fungal spore spots on lower bracts.",
        "spraying_window": "Strictly avoid mid-day spraying to safeguard beneficial pollinators (bees). Spray late afternoon after pollinator activity ceases.",
        "guidance_disclaimer": "general guidance, confirm with your local agriculture officer; no quantities",
    },
    "fruiting": {
        "irrigation_sensitivity": "HIGH SENSITIVITY: Maintain continuous adequate soil moisture for boll/pod elongation and grain filling. Avoid alternate drying and soaking.",
        "fertilizer_window": "Late-stage foliar spray (potassium/micronutrient) can assist boll/grain development if deficiencies appear.",
        "scouting_focus": "Inspect developing pods/bolls for internal entry holes, larval presence, and fruit rots.",
        "spraying_window": "Early morning before temperature exceeds 32°C. Ensure thorough canopy penetration.",
        "guidance_disclaimer": "general guidance, confirm with your local agriculture officer; no quantities",
    },
    "maturity": {
        "irrigation_sensitivity": "Gradually taper off and cease irrigation 10-15 days prior to harvest to promote uniform ripening and prevent mold.",
        "fertilizer_window": "Fertilizer application ceases. No top-dressing during senescence.",
        "scouting_focus": "Monitor field drying, boll opening, and grain moisture content. Inspect for storage pests.",
        "spraying_window": "Observe mandatory Pre-Harvest Intervals (PHI). No chemical spraying within 14 days of harvest.",
        "guidance_disclaimer": "general guidance, confirm with your local agriculture officer; no quantities",
    },
}


class GrowthStageService:
    def __init__(self):
        self._fao_data: Dict[str, Any] = {}
        self._localization_data: Dict[str, Any] = {}
        self._load_data()

    def _load_data(self) -> None:
        if FAO56_JSON_PATH.exists():
            with open(FAO56_JSON_PATH, "r", encoding="utf-8") as f:
                self._fao_data = json.load(f)
        if LOCALIZATION_JSON_PATH.exists():
            with open(LOCALIZATION_JSON_PATH, "r", encoding="utf-8") as f:
                self._localization_data = json.load(f)

    def _normalize_crop(self, crop: str) -> str:
        c = crop.strip().lower()
        if "cotton" in c:
            return "cotton"
        if "rice" in c or "paddy" in c:
            return "rice"
        if "wheat" in c:
            return "wheat"
        if "maize" in c or "corn" in c:
            return "maize"
        if "groundnut" in c or "peanut" in c:
            return "groundnut"
        if "chilli" in c or "chili" in c or "pepper" in c:
            return "chilli"
        if "tomato" in c:
            return "tomato"
        if "sugarcane" in c:
            return "sugarcane"
        if "soybean" in c or "soya" in c:
            return "soybean"
        if "pulse" in c or "gram" in c or "dal" in c:
            return "pulses"
        return c

    def get_stage_lengths_from_fao56(self, crop_key: str) -> Dict[str, int]:
        """
        Reuses verified stage lengths from fao56_crop_coefficients.json.
        Returns the 4 FAO-56 stage lengths in days.
        """
        crops = self._fao_data.get("crops", {})
        norm = self._normalize_crop(crop_key)
        if norm in crops:
            return crops[norm].get("stage_lengths_days", {
                "initial": 30,
                "development": 40,
                "mid": 50,
                "late": 30,
            })
        # Default fallback if unlisted
        return {"initial": 25, "development": 35, "mid": 45, "late": 25}

    def compute_phenology(
        self,
        crop_name: str,
        planting_date: date,
        reference_date: Optional[date] = None,
    ) -> GrowthStageResponse:
        """
        Computes 5-stage phenological timeline and current stage from planting_date.
        5 stages mapped onto FAO-56 4 stages:
        1. Germination (initial)
        2. Vegetative (development)
        3. Flowering (first half of mid)
        4. Fruiting / Grain Filling (second half of mid)
        5. Maturity / Harvest (late)
        """
        ref_d = reference_date or date.today()
        das = max(0, (ref_d - planting_date).days)

        norm_crop = self._normalize_crop(crop_name)
        fao_stages = self.get_stage_lengths_from_fao56(norm_crop)

        l_init = fao_stages.get("initial", 30)
        l_dev = fao_stages.get("development", 40)
        l_mid = fao_stages.get("mid", 50)
        l_late = fao_stages.get("late", 30)

        # Map mid into 2 halves for flowering and fruiting
        l_flowering = max(10, l_mid // 2)
        l_fruiting = l_mid - l_flowering

        # Calculate DAS intervals
        t_germ_end = l_init
        t_veg_end = t_germ_end + l_dev
        t_flowering_end = t_veg_end + l_flowering
        t_fruiting_end = t_flowering_end + l_fruiting
        t_maturity_end = t_fruiting_end + l_late
        total_duration = t_maturity_end

        stage_defs = [
            ("germination", 0, t_germ_end, l_init, "initial"),
            ("vegetative", t_germ_end, t_veg_end, l_dev, "development"),
            ("flowering", t_veg_end, t_flowering_end, l_flowering, "mid"),
            ("fruiting", t_flowering_end, t_fruiting_end, l_fruiting, "mid"),
            ("maturity", t_fruiting_end, t_maturity_end, l_late, "late"),
        ]

        # Determine current stage
        curr_key = "maturity"
        curr_fao = "late"
        stage_start = t_fruiting_end
        stage_end = t_maturity_end
        stage_len = l_late

        for s_key, s_start, s_end, s_len, fao_map in stage_defs:
            if das <= s_end:
                curr_key = s_key
                curr_fao = fao_map
                stage_start = s_start
                stage_end = s_end
                stage_len = s_len
                break

        # Progress within stage
        stage_das_done = max(0, min(das - stage_start, stage_len))
        stage_prog = round((stage_das_done / max(1, stage_len)) * 100.0, 1)

        # Overall cycle progress
        cycle_prog = round(min(100.0, (das / max(1, total_duration)) * 100.0), 1)

        # Days to next stage
        days_to_next = None
        next_stage_name = None
        for i, (s_key, _, s_end, _, _) in enumerate(stage_defs):
            if s_key == curr_key:
                if i + 1 < len(stage_defs):
                    next_stage_name = stage_defs[i + 1][0]
                    days_to_next = max(0, s_end - das)
                else:
                    days_to_next = 0
                    next_stage_name = "Harvest Complete"
                break

        # Build timeline info
        loc_stages = self._localization_data.get("stages", STAGE_NAMES_DEFAULT)
        timeline_info: List[PhenologicalStageInfo] = []
        for s_key, s_start, s_end, s_len, fao_map in stage_defs:
            names = loc_stages.get(s_key, STAGE_NAMES_DEFAULT.get(s_key, {}))
            is_curr = (s_key == curr_key)
            if das > s_end:
                p_pct = 100.0
            elif das < s_start:
                p_pct = 0.0
            else:
                p_pct = stage_prog

            timeline_info.append(
                PhenologicalStageInfo(
                    stage_key=s_key,
                    stage_name_en=names.get("en", s_key.capitalize()),
                    stage_name_te=names.get("te", s_key.capitalize()),
                    stage_name_hi=names.get("hi", s_key.capitalize()),
                    start_das=s_start,
                    end_das=s_end,
                    duration_days=s_len,
                    fao56_kc_stage=fao_map,
                    is_current=is_curr,
                    progress_pct=p_pct,
                )
            )

        curr_names = loc_stages.get(curr_key, STAGE_NAMES_DEFAULT.get(curr_key, {}))
        guidance = STAGE_GUIDANCE_TEMPLATES.get(curr_key, STAGE_GUIDANCE_TEMPLATES["vegetative"])

        return GrowthStageResponse(
            crop_name=crop_name.capitalize(),
            planting_date=planting_date,
            days_after_sowing=das,
            current_stage=curr_key,
            current_stage_te=curr_names.get("te", curr_key),
            current_stage_hi=curr_names.get("hi", curr_key),
            fao56_kc_stage=curr_fao,
            stage_progress_pct=stage_prog,
            cycle_progress_pct=cycle_prog,
            estimated_days_to_next_stage=days_to_next,
            next_stage_name=next_stage_name,
            total_crop_duration_days=total_duration,
            stages_timeline=timeline_info,
            stage_guidance=guidance,
            source_notes="Indicative mapping onto FAO-56 4-stage model (Table 11 lengths); to verify",
        )

    def get_stage_tasks(
        self,
        crop_name: str,
        planting_date: date,
        reference_date: Optional[date] = None,
    ) -> StageTasksResponse:
        """
        Generates stage-specific tasks for a crop and planting date.
        Strictly zero chemical quantities or dosages per Honesty Rules.
        """
        pheno = self.compute_phenology(crop_name, planting_date, reference_date)
        stage_key = pheno.current_stage
        das = pheno.days_after_sowing
        disclaimer = "general guidance, confirm with your local agriculture officer; no quantities"

        tasks: List[AgronomicTaskItem] = []

        if stage_key == "germination":
            tasks.append(
                AgronomicTaskItem(
                    id="task_germ_1",
                    title="Monitor Seedling Emergence",
                    category="scouting",
                    description="Count emerged seedlings across representative row segments. Check for missing gaps.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_germ_2",
                    title="Light Surface Soil Aeration",
                    category="irrigation",
                    description="Keep soil surface moist but avoid crust formation that prevents seedling emergence.",
                    criticality="medium",
                    guidance_disclaimer=disclaimer,
                )
            )
        elif stage_key == "vegetative":
            tasks.append(
                AgronomicTaskItem(
                    id="task_veg_1",
                    title="Interculture Weeding & Soil Aeration",
                    category="cultural",
                    description="Perform hand-weeding or shallow blade harrowing between crop rows to preserve moisture.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_veg_2",
                    title="Sucking Pest Scouting & Trap Setup",
                    category="scouting",
                    description="Install yellow sticky traps (5-8 per acre) to monitor aphids, thrips, and whiteflies.",
                    criticality="medium",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_veg_3",
                    title="Vegetative Top-Dressing Window",
                    category="fertilizer",
                    description="Schedule vegetative split application before flower initiation. Confirm with local officer.",
                    criticality="medium",
                    guidance_disclaimer=disclaimer,
                )
            )
        elif stage_key == "flowering":
            tasks.append(
                AgronomicTaskItem(
                    id="task_flow_1",
                    title="Critical Moisture Stress Prevention",
                    category="irrigation",
                    description="CRITICAL: Avoid soil drying during peak bloom. Water deficit causes severe square and flower shedding.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_flow_2",
                    title="Blossom & Lower Canopy Scouting",
                    category="scouting",
                    description="Inspect open flowers and lower leaves for early fungal leaf spots and bollworm larvae.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_flow_3",
                    title="Calm-Hour Spraying Window Observance",
                    category="spraying",
                    description="If bio-protectant is recommended, spray strictly during late afternoon to protect bee pollinators.",
                    criticality="medium",
                    guidance_disclaimer=disclaimer,
                )
            )
        elif stage_key == "fruiting":
            tasks.append(
                AgronomicTaskItem(
                    id="task_fruit_1",
                    title="Boll & Pod Moisture Maintenance",
                    category="irrigation",
                    description="Maintain consistent root moisture for seed and fiber filling; avoid severe wet-dry cycles.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_fruit_2",
                    title="Fruit Borer & Rot Inspection",
                    category="scouting",
                    description="Check developing fruits/bolls for internal entry holes, premature drop, and wet rots.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
        else:  # maturity
            tasks.append(
                AgronomicTaskItem(
                    id="task_mat_1",
                    title="Taper Off Irrigation Ahead of Harvest",
                    category="irrigation",
                    description="Gradually stop water applications to allow uniform boll burst and grain drying.",
                    criticality="high",
                    guidance_disclaimer=disclaimer,
                )
            )
            tasks.append(
                AgronomicTaskItem(
                    id="task_mat_2",
                    title="Harvest Readiness & Moisture Check",
                    category="cultural",
                    description="Check grain/lint maturity. Harvest during dry weather and store in clean, moisture-free bags.",
                    criticality="medium",
                    guidance_disclaimer=disclaimer,
                )
            )

        return StageTasksResponse(
            crop_name=crop_name.capitalize(),
            current_stage=stage_key,
            days_after_sowing=das,
            tasks=tasks,
            source_notes=disclaimer,
        )


growth_stage_service = GrowthStageService()
