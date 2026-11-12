import json
import logging
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
import io

from backend.app.config import settings

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).resolve().parent / "fao56_crop_coefficients.json"

# Acre to m2 conversion constant: 1 acre = 4046.8564224 m2
# 1 mm of water depth over 1 acre = 4046.8564224 * 0.001 m3 = 4046.8564224 litres
LITRES_PER_ACRE_MM = 4046.8564224

CROP_ALIASES: Dict[str, str] = {
    "rice": "rice",
    "paddy": "rice",
    "vari": "rice",
    "dhan": "rice",
    "wheat": "wheat",
    "godhuma": "wheat",
    "gehu": "wheat",
    "maize": "maize",
    "corn": "maize",
    "makka": "maize",
    "makkajonna": "maize",
    "cotton": "cotton",
    "prathi": "cotton",
    "kapas": "cotton",
    "groundnut": "groundnut",
    "peanut": "groundnut",
    "verusenaga": "groundnut",
    "moongphali": "groundnut",
    "chilli": "chilli",
    "chili": "chilli",
    "pepper": "chilli",
    "mirchi": "chilli",
    "tomato": "tomato",
    "tamata": "tomato",
    "tamatar": "tomato",
    "sugarcane": "sugarcane",
    "cheruku": "sugarcane",
    "ganna": "sugarcane",
    "soybean": "soybean",
    "soya": "soybean",
    "pulses": "pulses",
    "pulse": "pulses",
    "chickpea": "pulses",
    "gram": "pulses",
    "pigeon pea": "pulses",
    "red gram": "pulses",
    "kandi": "pulses",
    "arhar": "pulses",
    "tur": "pulses",
    "chana": "pulses",
}

SOIL_ALIASES: Dict[str, str] = {
    "sandy": "Sandy",
    "sand": "Sandy",
    "sandy loam": "Sandy Loam",
    "loam": "Loam",
    "alluvial": "Alluvial",
    "red loam": "Red Loam",
    "red soil": "Red Loam",
    "clay loam": "Clay Loam",
    "black cotton": "Black Cotton",
    "black soil": "Black Cotton",
    "regur": "Black Cotton",
    "clay": "Clay",
    "heavy clay": "Clay",
}

METHOD_EFFICIENCIES: Dict[str, float] = {
    "drip": 0.90,
    "sprinkler": 0.75,
    "furrow": 0.60,
    "flood": 0.50,
}


class FAO56IrrigationEngine:
    _instance: Optional["FAO56IrrigationEngine"] = None

    def __init__(self):
        self.crop_data = {}
        self.soil_data = {}
        self.method_data = {}
        self.metadata = {}
        self._load_data()

    @classmethod
    def get_instance(cls) -> "FAO56IrrigationEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_data(self):
        if not DATA_FILE.exists():
            raise FileNotFoundError(f"FAO-56 data file missing at {DATA_FILE}")
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.metadata = data.get("_metadata", {})
        self.crop_data = data.get("crops", {})
        self.soil_data = data.get("soils", {})
        self.method_data = data.get("irrigation_methods", {})

    def normalize_crop_name(self, crop_name: str) -> str:
        clean = crop_name.strip().lower()
        return CROP_ALIASES.get(clean, clean)

    def get_crop_info(self, crop_name: str) -> Dict[str, Any]:
        norm = self.normalize_crop_name(crop_name)
        if norm in self.crop_data:
            return self.crop_data[norm]
        # Fallback to cotton / standard general crop if unknown
        return self.crop_data.get("cotton", {})

    def determine_growth_stage(
        self,
        crop_name: str,
        planting_date: date,
        current_date: Optional[date] = None,
    ) -> Tuple[str, float, int]:
        """
        Determines current growth stage (initial, development, mid, late),
        linearly interpolates Kc according to standard FAO-56 single Kc methodology,
        and returns (stage_name, current_kc, days_after_sowing).
        """
        if current_date is None:
            current_date = date.today()

        das = max(0, (current_date - planting_date).days)
        crop = self.get_crop_info(crop_name)
        lengths = crop.get("stage_lengths_days", {"initial": 30, "development": 40, "mid": 50, "late": 30})

        l_init = lengths.get("initial", 30)
        l_dev = lengths.get("development", 40)
        l_mid = lengths.get("mid", 50)
        l_late = lengths.get("late", 30)

        kc_init = crop.get("kc_init", 0.35)
        kc_mid = crop.get("kc_mid", 1.15)
        kc_late = crop.get("kc_late", 0.60)

        if das <= l_init:
            stage = "initial"
            kc = kc_init
        elif das <= l_init + l_dev:
            stage = "development"
            frac = (das - l_init) / max(1, l_dev)
            kc = kc_init + frac * (kc_mid - kc_init)
        elif das <= l_init + l_dev + l_mid:
            stage = "mid"
            kc = kc_mid
        elif das <= l_init + l_dev + l_mid + l_late:
            stage = "late"
            frac = (das - (l_init + l_dev + l_mid)) / max(1, l_late)
            kc = kc_mid + frac * (kc_late - kc_mid)
        else:
            stage = "late"
            kc = kc_late

        return stage, round(float(kc), 3), das

    @staticmethod
    def calculate_effective_rainfall(precipitation_mm: float) -> float:
        """
        Calculates daily effective rainfall (P_eff) using standard FAO / USDA-SCS daily empirical formulation:
        - Rain <= 5.0 mm is lost to canopy interception and surface evaporation (P_eff = 0.0 mm).
        - Rain between 5.0 mm and 50.0 mm: P_eff = 0.8 * (P - 5.0).
        - Rain > 50.0 mm: high surface runoff occurs; P_eff = 36.0 + 0.1 * (P - 50.0).
        """
        p = max(0.0, float(precipitation_mm))
        if p <= 5.0:
            return 0.0
        elif p <= 50.0:
            return round(0.8 * (p - 5.0), 2)
        else:
            return round(36.0 + 0.1 * (p - 50.0), 2)

    def get_soil_awc(self, soil_type: str) -> float:
        """Available Water Capacity in mm/m soil depth."""
        clean = soil_type.strip().lower()
        key = SOIL_ALIASES.get(clean, "Loam")
        return self.soil_data.get(key, {}).get("awc_mm_per_m", 140.0)

    @staticmethod
    def get_method_efficiency(method: str) -> float:
        clean = method.strip().lower()
        return METHOD_EFFICIENCIES.get(clean, 0.75)

    def calculate_plan(
        self,
        crop_name: str,
        planting_date: date,
        area_acres: float,
        soil_type: str = "Black Cotton",
        irrigation_method: str = "drip",
        current_date: Optional[date] = None,
        reference_et0_mm: float = 4.5,
        forecast_rain_24h_mm: float = 0.0,
        forecast_rain_48h_mm: float = 0.0,
        daily_forecast: Optional[List[Dict[str, Any]]] = None,
        current_depletion_mm: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes FAO-56 water budget calculation over current day and 7-day forecast.
        Outputs exact net/gross depth (mm), volume in litres, next irrigation date,
        rain-skip litres saved, and full explainability metadata.
        """
        if current_date is None:
            current_date = date.today()

        crop_info = self.get_crop_info(crop_name)
        stage, kc, das = self.determine_growth_stage(crop_name, planting_date, current_date)

        # 1. Soil and Root-Zone Water Holding Parameters
        awc_mm_m = self.get_soil_awc(soil_type)
        root_depth_m = float(crop_info.get("root_depth_m", 0.8))
        # Total Available Water (mm)
        taw_mm = round(awc_mm_m * root_depth_m, 2)
        depletion_fraction_p = float(crop_info.get("depletion_fraction_p", 0.50))
        # Readily Available Water (mm) - Management Allowed Depletion threshold
        raw_mm = round(taw_mm * depletion_fraction_p, 2)

        # 2. Daily Evapotranspiration and Effective Rainfall for today
        etc_today_mm = round(kc * reference_et0_mm, 2)
        peff_today_mm = self.calculate_effective_rainfall(forecast_rain_24h_mm)

        # 3. Root zone depletion simulation (bucket model)
        # If current_depletion_mm is not provided, start from a nominal midpoint or accumulate
        if current_depletion_mm is None:
            # By default, assume soil has accumulated depletion reaching towards threshold
            current_depletion_mm = round(raw_mm * 0.90, 2)

        # Update depletion today: D_r = D_r_prev + ETc - P_eff
        depletion_today = max(0.0, min(taw_mm, current_depletion_mm + etc_today_mm - peff_today_mm))

        # Check whether soil depletion required irrigation before considering rain
        potential_depletion = current_depletion_mm + etc_today_mm
        irrigation_due_without_rain = (potential_depletion >= raw_mm) or (current_depletion_mm >= raw_mm)

        # Rain-skip check: if forecasted rain in 24h >= 15mm or 48h >= 20mm
        rain_skip_triggered = (
            forecast_rain_24h_mm >= settings.RAIN_CONFLICT_THRESHOLD_MM
            or forecast_rain_48h_mm >= (settings.RAIN_CONFLICT_THRESHOLD_MM + 5.0)
        )

        efficiency = self.get_method_efficiency(irrigation_method)

        # Depth calculations
        if irrigation_due_without_rain and rain_skip_triggered:
            should_irrigate = False
            net_depth_mm = round(min(taw_mm, max(raw_mm, potential_depletion)), 2)
            gross_depth_mm = round(net_depth_mm / efficiency, 2)
            litres_needed = round(gross_depth_mm * area_acres * LITRES_PER_ACRE_MM, 0)
            litres_saved = litres_needed
            next_irrigation_date = (current_date + timedelta(days=3)).isoformat()
        elif depletion_today >= raw_mm and not rain_skip_triggered:
            should_irrigate = True
            net_depth_mm = round(depletion_today, 2)
            gross_depth_mm = round(net_depth_mm / efficiency, 2)
            litres_needed = round(gross_depth_mm * area_acres * LITRES_PER_ACRE_MM, 0)
            litres_saved = 0.0
            next_irrigation_date = current_date.isoformat()
        else:
            should_irrigate = False
            net_depth_mm = 0.0
            gross_depth_mm = 0.0
            litres_needed = 0.0
            litres_saved = 0.0
            # Project days until depletion reaches RAW
            daily_deficit = max(0.5, etc_today_mm - peff_today_mm)
            remaining_to_raw = max(0.0, raw_mm - depletion_today)
            days_until_next = max(1, int(round(remaining_to_raw / daily_deficit)))
            next_irrigation_date = (current_date + timedelta(days=days_until_next)).isoformat()

        # 4. Multi-day 7-Day Simulation Balance Table
        daily_balances: List[Dict[str, Any]] = []
        sim_depletion = depletion_today if not should_irrigate else 0.0  # refill if irrigated today

        forecast_list = daily_forecast or []
        for i in range(7):
            d_date = current_date + timedelta(days=i)
            # Fetch day data if available, or project
            if i < len(forecast_list):
                d_item = forecast_list[i]
                d_et0 = float(d_item.get("reference_et0_mm", reference_et0_mm))
                d_rain = float(d_item.get("precipitation_sum_mm", 0.0))
            else:
                d_et0 = reference_et0_mm
                d_rain = forecast_rain_24h_mm if i == 0 else (forecast_rain_48h_mm if i == 1 else 0.0)

            # Re-evaluate stage and Kc for forward day
            _, d_kc, _ = self.determine_growth_stage(crop_name, planting_date, d_date)
            d_etc = round(d_kc * d_et0, 2)
            d_peff = self.calculate_effective_rainfall(d_rain)

            # Update bucket depletion
            if i > 0:
                sim_depletion = max(0.0, min(taw_mm, sim_depletion + d_etc - d_peff))

            d_irrig_required = sim_depletion >= raw_mm
            d_rain_skip = d_rain >= settings.RAIN_CONFLICT_THRESHOLD_MM

            daily_balances.append({
                "date": d_date.isoformat(),
                "day_index": i,
                "kc": d_kc,
                "et0_mm": d_et0,
                "etc_mm": d_etc,
                "rain_mm": d_rain,
                "effective_rain_mm": d_peff,
                "root_zone_depletion_mm": round(sim_depletion, 2),
                "taw_mm": taw_mm,
                "raw_mm": raw_mm,
                "moisture_stress_risk": d_irrig_required,
                "rain_skip_potential": d_rain_skip,
            })

            # If water was applied in projection, reset depletion to field capacity
            if d_irrig_required and not d_rain_skip:
                sim_depletion = 0.0

        # Construct explainability and recommendation text
        reasons = [
            f"Evaluated FAO-56 Single Kc model: {crop_info.get('name', crop_name)} is at DAS {das} ({stage.capitalize()} stage) with Kc = {kc:.2f}.",
            f"Daily crop water requirement ETc = {kc:.2f} * {reference_et0_mm:.1f} mm = {etc_today_mm:.2f} mm.",
            f"Soil water balance on {soil_type} (AWC: {awc_mm_m:.0f} mm/m, root depth: {root_depth_m:.1f} m) gives TAW = {taw_mm:.1f} mm and RAW = {raw_mm:.1f} mm.",
            f"Irrigation efficiency for {irrigation_method.capitalize()} method is {efficiency * 100:.0f}%.",
        ]

        if rain_skip_triggered:
            reasons.append(
                f"Rain-skip triggered: Forecast of {forecast_rain_24h_mm:.1f} mm in 24h exceeds the {settings.RAIN_CONFLICT_THRESHOLD_MM:.0f} mm safety threshold, conserving {litres_saved:,.0f} litres."
            )
            rec_text = (
                f"Skip irrigation today. Forecast indicates {forecast_rain_24h_mm:.1f} mm of rainfall within 24h. "
                f"Conserving {litres_saved:,.0f} litres of water. Next tentative irrigation scheduled on {next_irrigation_date}."
            )
        elif should_irrigate:
            reasons.append(
                f"Root zone depletion ({depletion_today:.1f} mm) has reached Readily Available Water (RAW: {raw_mm:.1f} mm). Irrigation is recommended to prevent plant water stress."
            )
            rec_text = (
                f"Irrigate today. Root zone depletion ({depletion_today:.1f} mm) has reached the management depletion threshold. "
                f"Apply {gross_depth_mm:.1f} mm gross depth ({litres_needed:,.0f} litres total for {area_acres:.1f} acres via {irrigation_method})."
            )
        else:
            reasons.append(
                f"Soil moisture is currently adequate: root zone depletion ({depletion_today:.1f} mm) remains safely below RAW ({raw_mm:.1f} mm)."
            )
            rec_text = (
                f"No irrigation required today. Soil water reserve is adequate. "
                f"Next scheduled watering date is {next_irrigation_date}."
            )

        sources = [
            {"title": "FAO Irrigation and Drainage Paper No. 56", "url": "https://www.fao.org/land-water/databases-and-software/crop-information/en/"},
            {"title": "ICAR Water Technology Centre Crop Water Coefficients", "url": "to verify"},
        ]

        limitations = [
            "Assumes uniform field soil texture and root distribution across the parcel.",
            "Water balance bucket model does not account for shallow capillary water table upflux.",
            "Weather rainfall is based on Open-Meteo forecasts; local convective showers may cause localized deviations.",
        ]

        return {
            "crop_name": crop_info.get("name", crop_name),
            "growth_stage": stage,
            "days_after_sowing": das,
            "kc": kc,
            "reference_et0_mm": reference_et0_mm,
            "etc_today_mm": etc_today_mm,
            "effective_rain_today_mm": peff_today_mm,
            "should_irrigate": should_irrigate,
            "net_depth_mm": net_depth_mm,
            "gross_depth_mm": gross_depth_mm,
            "litres_needed": litres_needed,
            "litres_saved": litres_saved,
            "rain_skip_triggered": rain_skip_triggered,
            "next_irrigation_date": next_irrigation_date,
            "irrigation_method": irrigation_method,
            "method_efficiency": efficiency,
            "soil_type": soil_type,
            "awc_mm_per_m": awc_mm_m,
            "taw_mm": taw_mm,
            "raw_mm": raw_mm,
            "depletion_today_mm": depletion_today,
            "daily_forecast_balance": daily_balances,
            "recommendation_text": rec_text,
            "explanation": {
                "value": rec_text,
                "confidence": 0.88,
                "confidence_type": "rule_based",
                "reasons": reasons,
                "sources": sources,
                "status": "WORKING",
                "limitations": limitations,
            },
        }


# =====================================================================
# Irrigation Problem Diagnostician (Text Rule-based + Image Visual Cues)
# =====================================================================

ISSUE_CATEGORIES = [
    "waterlogging",
    "water_stress",
    "salinity",
    "uneven_distribution",
    "source_scarcity",
]

KEYWORDS_BY_CATEGORY: Dict[str, Dict[str, List[str]]] = {
    "waterlogging": {
        "en": ["water stagnat", "standing water", "drainage poor", "logged", "overflow", "stagnation", "stagnat", "waterlog", "marshy", "flooded", "root rot", "yellowing lower leaves", "ponding"],
        "te": ["నీరు నిలవడం", "ముంపు", "నీరు నిలబడడం", "డ్రైనేజీ", "మురుగు నీరు", "ముంపునకు గురికావడం", "నీరు తగ్గడం లేదు", "కుళ్ళిపోవడం"],
        "hi": ["जलभराव", "पानी ठहरना", "पानी जमा", "निकासी खराब", "दलदल", "अत्यधिक पानी", "जड़ सड़न", "पानी भरा"],
    },
    "water_stress": {
        "en": ["wilt", "curling", "dry soil", "afternoon droop", "curling up", "cracked soil", "leaf rolling", "shrivel", "drooping", "thirsty"],
        "te": ["ఆకులు వాడిపోవడం", "ఎండిపోవడం", "మధ్యాహ్నం వాలిపోవడం", "బీటలు", "నీటి ఎద్దడి", "ఆకులు ముడుచుకుపోవడం"],
        "hi": ["मुरझाना", "पत्तियां सूखना", "दोपहर में मुरझाना", "सूखी मिट्टी", "दरारें", "पानी की कमी", "पत्तियां मुड़ना"],
    },
    "salinity": {
        "en": ["white crust", "white patches", "salty", "salinity", "leaf burn", "tip scorch", "white powder", "salt deposits", "crust on soil"],
        "te": ["చౌడు", "ఉప్పు నేల", "తెల్లటి పొర", "ఉప్పదనం", "ఆకుల చివర్లు మాడటం", "తెల్లటి మచ్చలు"],
        "hi": ["सफेद परत", "खारापन", "लवणता", "पत्तियों के किनारे जलना", "ऊसर", "रेह", "सफेद पाउडर"],
    },
    "uneven_distribution": {
        "en": ["uneven", "dry patch", "one side wet", "clogged dripper", "nozzle blocked", "low pressure", "leak", "unequal watering", "clog"],
        "te": ["అసమాన నీరు", "ఒకవైపు తడి", "డ్రిప్పర్ జామ్", "నాజిల్ బ్లాక్", "ప్రెషర్ తక్కువ", "పైపు లీక్"],
        "hi": ["असमान फैलाव", "एक तरफ सूखा", "ड्रिपर चोक", "नोजल बंद", "कम दबाव", "पाइप लीकेज"],
    },
    "source_scarcity": {
        "en": ["borewell dry", "low water level", "pump air", "canal closed", "dry well", "electricity cut", "motor trip", "water finished", "water dried"],
        "te": ["బోరు ఎండిపోయింది", "నీరు తగ్గింది", "మోటార్ గాలి లాగడం", "కాలువ బంద్", "కరెంట్ కోత", "నీరు లేదు"],
        "hi": ["बोरवेल सूख गया", "जलस्तर नीचे", "मोटर हवा ले रही", "नहर बंद", "पानी खत्म", "बिजली कटौती"],
    },
}

REMEDIATIONS: Dict[str, Dict[str, Any]] = {
    "waterlogging": {
        "title": "Soil Waterlogging & Hypoxia Risk",
        "severity": "HIGH",
        "description": "Standing water deprives crop roots of oxygen, leading to root asphyxiation, nutrient block, and Pythium/Phytophthora root rot.",
        "suggestions": [
            "Dig immediate perimeter drainage furrows or surface trenches to evacuate standing pond water.",
            "Suspend all irrigation cycles immediately until top 10 cm of soil surface dries.",
            "Once drained, aerate soil crust lightly with shallow inter-cultivation to restore root respiration.",
            "Do NOT apply nitrogen fertilizers immediately to waterlogged soil as denitrification causes ammonia leaf scorch.",
        ],
    },
    "water_stress": {
        "title": "Vegetative Water Deficit Stress",
        "severity": "HIGH",
        "description": "Crop leaves are losing turgor pressure due to transpiration exceeding root water uptake, inducing stomatal closure.",
        "suggestions": [
            "Schedule immediate evening or early morning irrigation to refill root-zone readily available water.",
            "Check soil moisture with the finger test (2–3 inches depth) to distinguish drought stress from nematode root knotting.",
            "Apply straw or crop residue mulch along crop rows to suppress surface soil moisture evaporation.",
            "Prioritize drip irrigation directly around the active root feeder zone to minimize conveyance loss.",
        ],
    },
    "salinity": {
        "title": "Soil / Water Salinity & Osmotic Scorch",
        "severity": "MEDIUM",
        "description": "Accumulation of soluble salts creates osmotic tension, causing physiological drought and characteristic marginal leaf tip necrosis.",
        "suggestions": [
            "Get irrigation borewell water tested for Electrical Conductivity (EC) and Sodium Adsorption Ratio (SAR).",
            "Apply gypsum (calcium sulfate) if soil is sodic/alkaline, followed by deep flushing irrigation with low-salinity water.",
            "Incorporate organic farmyard manure (FYM) or green manure (Dhaincha) to improve soil structure and salt buffering.",
            "Avoid light, frequent overhead sprinklers that leave salt deposits on foliage; switch to root-zone drip.",
        ],
    },
    "uneven_distribution": {
        "title": "Irrigation Uniformity & Pressure Imbalance",
        "severity": "MEDIUM",
        "description": "Clogged emitters, inadequate system pressure, or uneven field grading produces over-watered and drought-stressed patches.",
        "suggestions": [
            "Flush lateral irrigation lines and clean screen / disc filters at the pump head.",
            "Treat clogged drip emitters using dilute organic acid (citric acid or agricultural acid rinse under expert supervision).",
            "Verify operating pressure with a line pressure gauge (typical drip requires 1.0 to 1.5 kg/cm²).",
            "Check lateral slopes and inspect for pipe punctures, rodent damage, or loose connector grommets.",
        ],
    },
    "source_scarcity": {
        "title": "Water Source Exhaustion / Inadequate Supply",
        "severity": "CRITICAL",
        "description": "Declining aquifer water tables or canal scheduling curtailment prevents meeting peak crop evapotranspiration demand.",
        "suggestions": [
            "Adopt Deficit Irrigation (Alternate Furrow Irrigation or Skip-Row watering) to protect the crop during critical stages.",
            "Prioritize moisture allocation strictly to the critical reproductive/flowering stage over vegetative stages.",
            "Apply foliar anti-transpirant sprays (e.g. kaolin clay 5% suspension or organic neem oil) to curtail water loss.",
            "Explore community water-pooling or mobile water tanker support under drought assistance schemes.",
        ],
    },
}

FINGER_TEST_GUIDE = {
    "title": "In-Field Finger Moisture Test Guide",
    "notice": "Visual observation from a photo is an indicative cue only. Confirm actual soil water status using this direct touch method:",
    "steps": [
        {"step": 1, "title": "Insertion", "instruction": "Insert your clean index finger 5 to 8 cm (2 to 3 inches) deep into the root-zone soil under the crop canopy."},
        {"step": 2, "title": "Dry & Crumbly", "condition": "Soil feels dry, hard, dusty, or crumbles without clinging.", "status": "WATER STRESS", "action": "Irrigation required immediately."},
        {"step": 3, "title": "Moist & Pliable", "condition": "Soil feels cool, damp, clings lightly, and can be squeezed into a loose ball without releasing free water.", "status": "ADEQUATE", "action": "Moisture is sufficient. Do not irrigate today."},
        {"step": 4, "title": "Wet & Muddy", "condition": "Soil leaves glistening mud on skin or squeezes out free water droplets.", "status": "WATERLOGGED", "action": "Soil is saturated. Halt watering and improve drainage."},
    ],
}


class IrrigationDiagnostician:
    @classmethod
    def classify_text_issue(cls, query: str) -> Dict[str, Any]:
        """
        Rule-based keyword classifier supporting English, Telugu, and Hindi.
        """
        q = query.lower().strip()
        matched_scores: Dict[str, int] = {cat: 0 for cat in ISSUE_CATEGORIES}

        for cat, lang_dict in KEYWORDS_BY_CATEGORY.items():
            for lang, kw_list in lang_dict.items():
                for kw in kw_list:
                    if kw in q:
                        matched_scores[cat] += 1

        best_category = max(matched_scores, key=matched_scores.get)
        best_score = matched_scores[best_category]

        if best_score == 0:
            best_category = "water_stress"  # default cautious fallback
            confidence = 0.40
            match_type = "heuristic_fallback"
        else:
            confidence = min(0.92, 0.65 + best_score * 0.10)
            match_type = "rule_keyword_match"

        rem = REMEDIATIONS.get(best_category, REMEDIATIONS["water_stress"])

        return {
            "category": best_category,
            "title": rem["title"],
            "severity": rem["severity"],
            "confidence": round(confidence, 2),
            "match_type": match_type,
            "description": rem["description"],
            "suggestions": rem["suggestions"],
        }

    @classmethod
    def evaluate_visual_cues(cls, image_bytes: bytes) -> Dict[str, Any]:
        """
        Inspects visual clues from field/leaf photo.
        HONESTY RULE: DO NOT claim a photo measures soil moisture.
        This provides surface visual indicators only (e.g. drooping leaves, chlorosis, mud pooling)
        and explicitly prompts the farmer to perform the tactile Finger Test.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_small = img.resize((128, 128))
            arr = np.array(img_small, dtype=np.float32)

            r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
            mean_luminance = float(np.mean(0.299 * r + 0.587 * g + 0.114 * b))

            # Detect deep dark saturated tones (potential water reflection / mud) vs bright dry soil
            dark_pixel_ratio = float(np.mean((r < 40) & (g < 40) & (b < 40)))
            # Pale yellow chlorosis ratio (R > 140, G > 140, B < 100)
            chlorosis_ratio = float(np.mean((r > 130) & (g > 130) & (b < 100)))

            if dark_pixel_ratio > 0.15:
                visual_cue = "dark_water_pooling"
                cue_desc = "Surface shadows or dark pooling detected. Possible soil saturation, mud, or standing water."
                inferred_category = "waterlogging"
            elif chlorosis_ratio > 0.12 or mean_luminance > 180:
                visual_cue = "foliar_wilting_chlorosis"
                cue_desc = "Foliar chlorosis / pale leaf coloration detected. Possible moisture deficit stress or root nutrient blockage."
                inferred_category = "water_stress"
            else:
                visual_cue = "general_canopy"
                cue_desc = "Canopy foliage visualised. Surface moisture cannot be accurately quantified from 2D pixel telemetry."
                inferred_category = "water_stress"

            return {
                "visual_cue_detected": visual_cue,
                "cue_description": cue_desc,
                "inferred_category": inferred_category,
                "mean_luminance": round(mean_luminance, 1),
                "visual_indicator_disclaimer": "Visual indication only, not a soil moisture measurement. Please confirm via physical finger test.",
                "status": "PARTIAL",
            }
        except Exception as e:
            logger.warning(f"Failed to inspect image visual cues: {e}")
            return {
                "visual_cue_detected": "inspection_failed",
                "cue_description": "Image format could not be parsed for surface optical inspection.",
                "inferred_category": "water_stress",
                "visual_indicator_disclaimer": "Visual indication only, not a soil moisture measurement. Please confirm via physical finger test.",
                "status": "PARTIAL",
            }

    @classmethod
    def diagnose(
        cls,
        text_query: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Combined diagnostic service for irrigation issues.
        """
        text_res = None
        if text_query and text_query.strip():
            text_res = cls.classify_text_issue(text_query.strip())

        visual_res = None
        if image_bytes and len(image_bytes) > 0:
            visual_res = cls.evaluate_visual_cues(image_bytes)

        if text_res and visual_res:
            category = text_res["category"]
            confidence = text_res["confidence"]
            title = text_res["title"]
            severity = text_res["severity"]
            description = f"{text_res['description']} Surface observation: {visual_res['cue_description']}"
            suggestions = text_res["suggestions"]
        elif text_res:
            category = text_res["category"]
            confidence = text_res["confidence"]
            title = text_res["title"]
            severity = text_res["severity"]
            description = text_res["description"]
            suggestions = text_res["suggestions"]
        elif visual_res:
            category = visual_res["inferred_category"]
            rem = REMEDIATIONS.get(category, REMEDIATIONS["water_stress"])
            confidence = 0.50  # honest modest confidence for visual-only cues
            title = rem["title"]
            severity = rem["severity"]
            description = f"{visual_res['cue_description']} (Visual indication only)."
            suggestions = rem["suggestions"]
        else:
            category = "water_stress"
            rem = REMEDIATIONS["water_stress"]
            confidence = 0.30
            title = "Inconclusive Observation"
            severity = "LOW"
            description = "No query text or specimen image provided for diagnosis."
            suggestions = rem["suggestions"]

        return {
            "category": category,
            "title": title,
            "severity": severity,
            "confidence": confidence,
            "description": description,
            "suggestions": suggestions,
            "visual_cues": visual_res,
            "finger_test_guide": FINGER_TEST_GUIDE,
            "status": "PARTIAL",
        }


# Singleton export
irrigation_engine = FAO56IrrigationEngine.get_instance()
