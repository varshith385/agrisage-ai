"""
AgriSage AI — Crop Recommender Inference Engine
Loads trained multi-class crop classification models and evaluates:
1. Full model (N, P, K, temperature, humidity, ph, rainfall) when soil tests exist.
2. Weather-only variant (temperature, humidity, rainfall) when soil values are missing,
   with lower confidence and an explicit disclaimer (strictly no invented soil data).
3. Rule-based climate suitability filter protecting against agro-climatically absurd
   recommendations (e.g. Apple or Coffee in semi-arid southern plains).
4. Graceful degradation: returns status DEMO with zero synthetic numbers if artifacts are absent.
"""
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ARTIFACTS_DIR = PROJECT_ROOT / "model_artifacts"
FULL_MODEL_PATH = ARTIFACTS_DIR / "crop_recommender.joblib"
WEATHER_MODEL_PATH = ARTIFACTS_DIR / "crop_recommender_weather_only.joblib"
METRICS_PATH = ARTIFACTS_DIR / "crop_recommender_metrics.json"

SUPPORTED_CROPS = [
    "apple", "banana", "blackgram", "chickpea", "coconut", "coffee", "cotton",
    "grapes", "jute", "kidneybeans", "lentil", "maize", "mango", "mothbeans",
    "mungbean", "muskmelon", "orange", "papaya", "pigeonpeas", "pomegranate",
    "rice", "watermelon"
]

UNSUPPORTED_COMMON_CROPS = [
    "wheat", "groundnut", "chilli", "tomato", "sugarcane", "soybean", "mustard", "onion"
]

# Rule-based climate / regional suitability constraints
CLIMATE_RULES = {
    "apple": {
        "max_temperature": 24.0,
        "disallowed_states": ["TELANGANA", "ANDHRA PRADESH", "TAMIL NADU", "KARNATAKA", "MAHARASHTRA", "GUJARAT", "RAJASTHAN", "MADHYA PRADESH"],
        "reason": "Apple requires temperate chilling hours (<7°C) and high altitude (>1500 m). Unsuitable for tropical or semi-arid plains.",
    },
    "coffee": {
        "min_rainfall": 120.0,
        "disallowed_states": ["TELANGANA", "MAHARASHTRA", "GUJARAT", "RAJASTHAN", "HARYANA", "PUNJAB", "UTTAR PRADESH", "BIHAR"],
        "reason": "Coffee requires highland hill plantation microclimates (Western/Eastern Ghats) and high seasonal rainfall.",
    },
    "jute": {
        "min_rainfall": 120.0,
        "disallowed_states": ["RAJASTHAN", "GUJARAT", "TELANGANA", "MAHARASHTRA"],
        "reason": "Jute requires heavy alluvial wetland monsoon inundation; unsuitable in dry or semi-arid zones.",
    },
    "muskmelon": {
        "disallowed_seasons": ["KHARIF"],
        "reason": "Muskmelons are highly prone to fungal rot and waterlogging during monsoon; best grown in Summer / Zaid.",
    },
    "watermelon": {
        "disallowed_seasons": ["KHARIF"],
        "reason": "Watermelons require warm, dry sunny weather during fruiting; high rainfall damages fruit quality.",
    },
}


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


class CropRecommenderEngine:
    _instance = None

    def __init__(self):
        self.full_bundle: Optional[Dict[str, Any]] = None
        self.weather_bundle: Optional[Dict[str, Any]] = None
        self.metrics: Optional[Dict[str, Any]] = None
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self._load_artifacts()

    @classmethod
    def get_instance(cls) -> "CropRecommenderEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_artifacts(self):
        if not FULL_MODEL_PATH.exists() or not WEATHER_MODEL_PATH.exists():
            self.load_error = (
                f"Model artifacts missing in {ARTIFACTS_DIR}. "
                "Run 'python scripts/train_crop_recommender.py' to generate artifacts."
            )
            self.is_loaded = False
            return

        try:
            # Load metrics if available to verify SHA
            if METRICS_PATH.exists():
                with open(METRICS_PATH, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)

            self.full_bundle = joblib.load(FULL_MODEL_PATH)
            self.weather_bundle = joblib.load(WEATHER_MODEL_PATH)
            self.is_loaded = True
            self.load_error = None
        except Exception as e:
            self.load_error = f"Failed to load crop recommender artifacts: {e}"
            self.is_loaded = False

    def evaluate_climate_suitability(
        self, crop_name: str, state: str, season: str, temperature: float, rainfall: float
    ) -> Tuple[bool, Optional[str]]:
        c_clean = crop_name.lower().strip()
        s_upper = state.upper().strip()
        season_upper = season.upper().strip()

        if c_clean in CLIMATE_RULES:
            rule = CLIMATE_RULES[c_clean]
            if "disallowed_states" in rule and s_upper in rule["disallowed_states"]:
                return False, rule["reason"]
            if "disallowed_seasons" in rule and season_upper in rule["disallowed_seasons"]:
                return False, rule["reason"]
            if "max_temperature" in rule and temperature > rule["max_temperature"]:
                return False, rule["reason"]
            if "min_rainfall" in rule and rainfall < rule["min_rainfall"]:
                return False, rule["reason"]

        return True, "Agro-climatically suitable for local region and season."

    def recommend(
        self,
        n: Optional[float] = None,
        p: Optional[float] = None,
        k: Optional[float] = None,
        ph: Optional[float] = None,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None,
        state: str = "Telangana",
        district: str = "Warangal",
        season: str = "Kharif",
    ) -> Dict[str, Any]:
        """
        Runs crop recommendation.
        If soil values (n, p, k, ph) are missing, evaluates weather-only model
        with lower confidence and transparent disclaimers.
        """
        # 1. Graceful Degradation Guard
        if not self.is_loaded or self.full_bundle is None or self.weather_bundle is None:
            return {
                "top_crops": [],
                "soil_values_missing": True,
                "fallback_used": "missing_artifact_demo",
                "confidence": 0.0,
                "confidence_type": "heuristic",
                "supported_crops": SUPPORTED_CROPS,
                "unsupported_common_crops": UNSUPPORTED_COMMON_CROPS,
                "climate_warnings": [],
                "explanation": {
                    "value": "Crop recommendation unavailable (model artifact missing).",
                    "confidence": 0.0,
                    "confidence_type": "heuristic",
                    "reasons": [self.load_error or "Model artifact not loaded."],
                    "sources": ["Kaggle Crop Recommendation Dataset copy (to verify)"],
                    "status": "DEMO",
                    "limitations": ["Model weights have not been generated on this host."],
                },
                "status": "DEMO",
            }

        # Defaults for environmental variables if omitted
        t_val = float(temperature) if temperature is not None else 28.0
        h_val = float(humidity) if humidity is not None else 70.0
        r_val = float(rainfall) if rainfall is not None else 100.0

        soil_provided = (n is not None) and (p is not None) and (k is not None) and (ph is not None)

        if soil_provided:
            # Full model inference
            model = self.full_bundle["model"]
            classes = self.full_bundle["classes"]
            features = np.array([[float(n), float(p), float(k), t_val, h_val, float(ph), r_val]])
            probs = model.predict_proba(features)[0]
            soil_missing = False
            fallback_used = "none_full_features"
            base_confidence = 0.88
            conf_type = "model_metric"
        else:
            # Weather-only model inference
            model = self.weather_bundle["model"]
            classes = self.weather_bundle["classes"]
            features = np.array([[t_val, h_val, r_val]])
            probs = model.predict_proba(features)[0]
            soil_missing = True
            fallback_used = "weather_only_model (soil N, P, K, pH not provided)"
            # Lower confidence when soil data is missing
            base_confidence = 0.50
            conf_type = "heuristic"

        # Get top-3 candidate predictions
        top_indices = np.argsort(probs)[::-1][:3]
        top_crops = []
        climate_warnings = []

        for idx in top_indices:
            crop_name = classes[idx]
            raw_prob = float(probs[idx])
            suitable, note = self.evaluate_climate_suitability(crop_name, state, season, t_val, r_val)

            reasons = [
                f"Model probability (uncalibrated): {raw_prob * 100:.1f}%.",
                f"Ambient temperature ({t_val:.1f}°C) and seasonal rainfall ({r_val:.1f} mm) match vegetative requirements.",
            ]
            if not suitable:
                reasons.append(f"WARNING: {note}")
                climate_warnings.append(f"{crop_name.capitalize()}: {note}")

            top_crops.append({
                "crop_name": crop_name.capitalize(),
                "probability": round(raw_prob, 4),
                "reasons": reasons,
                "climate_suitable": suitable,
                "suitability_note": note,
            })

        # Explainability reasons
        expl_reasons = [
            f"Evaluated candidate crops using {'full soil + weather parameters' if soil_provided else 'weather-only model (soil parameters omitted)'}.",
            f"Local agro-climate context: {state} ({district}), {season} season, {t_val:.1f}°C, {r_val:.1f} mm precipitation.",
            f"Top match: {top_crops[0]['crop_name']} ({top_crops[0]['probability'] * 100:.1f}% uncalibrated model probability).",
        ]
        if soil_missing:
            expl_reasons.append(
                "Soil nutrients (N, P, K, pH) were not provided; confidence is reduced. Soil testing is strongly recommended."
            )

        limitations = [
            "Dataset is clean/augmented benchmark data; probabilities reflect benchmark fit, not field accuracy.",
            f"Model does NOT cover {', '.join(UNSUPPORTED_COMMON_CROPS)}. Consult your local KVK for unlisted crops.",
        ]

        return {
            "top_crops": top_crops,
            "soil_values_missing": soil_missing,
            "fallback_used": fallback_used,
            "confidence": round(base_confidence, 2),
            "confidence_type": conf_type,
            "supported_crops": SUPPORTED_CROPS,
            "unsupported_common_crops": UNSUPPORTED_COMMON_CROPS,
            "climate_warnings": climate_warnings,
            "explanation": {
                "value": f"Recommended: {', '.join([c['crop_name'] for c in top_crops])}",
                "confidence": round(base_confidence, 2),
                "confidence_type": conf_type,
                "reasons": expl_reasons,
                "sources": [
                    {"title": "Kaggle Crop Recommendation Dataset copy (to verify)", "url": "to verify"}
                ],
                "status": "WORKING",
                "limitations": limitations,
            },
            "status": "WORKING",
        }


crop_recommender_engine = CropRecommenderEngine.get_instance()
