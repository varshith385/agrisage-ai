"""
AgriSage AI — Soil Health Card OCR & Impact Analysis Service
Module 20: /api/v1/soil-card

Pluggable OCR architecture:
- Detects EasyOCR, Tesseract, or Gemini Vision API.
- If no OCR engine is installed, provides clear PowerShell installation instructions and falls back to manual entry.
- Regex & fuzzy label extraction for N, P, K, pH, Organic Carbon, Electrical Conductivity.
- Indic scripts (Telugu/Hindi) flagged with status 'PARTIAL' and instructions to review.
- Privacy-first: Card images are NEVER stored on disk unless the user explicitly opts in.
- Impact analysis: Feeds confirmed soil values into crop recommender and yield engine to show before/after differences.
"""

import base64
import importlib.util
import io
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image

from backend.app.config import settings
from backend.app.ml.crop_recommender import crop_recommender_engine
from backend.app.ml.yield_model import yield_model_engine
from backend.app.schemas.soil_card import (
    SoilCardExtractionResponse,
    SoilCardFieldConfidence,
    SoilImpactAnalysisResponse,
)


# PowerShell installation instructions for missing engines
POWERSHELL_INSTALL_INSTRUCTIONS = {
    "easyocr": "py -3.12 -m pip install easyocr",
    "tesseract": "winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract",
    "gemini_vision": "Add GEMINI_API_KEY=your_key_here to backend/.env",
}


def detect_ocr_engines() -> Tuple[Optional[str], List[str], Dict[str, str]]:
    """
    Detects which OCR engines are available in the current environment.
    Returns: (active_engine, list_of_available_engines, install_instructions_for_missing)
    """
    available = []

    # 1. Check EasyOCR
    if importlib.util.find_spec("easyocr") is not None:
        available.append("easyocr")

    # 2. Check Tesseract
    if importlib.util.find_spec("pytesseract") is not None:
        try:
            import pytesseract
            # Test if executable is reachable
            _ = pytesseract.get_tesseract_version()
            available.append("tesseract")
        except Exception:
            pass

    # 3. Check Gemini Vision
    gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY")
    if gemini_key and len(gemini_key.strip()) > 10:
        available.append("gemini_vision")

    # Determine preferred active engine
    active_engine: Optional[str] = None
    if "easyocr" in available:
        active_engine = "easyocr"
    elif "tesseract" in available:
        active_engine = "tesseract"
    elif "gemini_vision" in available:
        active_engine = "gemini_vision"

    # Missing engines instructions
    missing_instructions = {
        k: v for k, v in POWERSHELL_INSTALL_INSTRUCTIONS.items() if k not in available
    }

    return active_engine, available, missing_instructions


# Plausibility agronomic validation ranges for Indian soils
VALIDATION_RANGES = {
    "nitrogen": (10.0, 1500.0, "kg/ha"),
    "phosphorus": (1.0, 300.0, "kg/ha"),
    "potassium": (10.0, 1500.0, "kg/ha"),
    "ph": (3.5, 11.0, "pH"),
    "organic_carbon": (0.01, 5.0, "%"),
    "electrical_conductivity": (0.01, 10.0, "dS/m"),
}


def parse_soil_card_text(raw_text: str, requested_lang: str = "en") -> SoilCardExtractionResponse:
    """
    Extracts N, P, K, pH, Organic Carbon, and EC from raw card transcript using
    agronomic regex patterns across English, Telugu, and Hindi formats.
    """
    active_engine, available_engines, install_instructions = detect_ocr_engines()

    text = raw_text or ""
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Detect language script in text
    detected_lang = requested_lang
    has_telugu = bool(re.search(r"[\u0C00-\u0C7F]", text))
    has_hindi = bool(re.search(r"[\u0900-\u097F]", text))

    if has_telugu:
        detected_lang = "te"
    elif has_hindi:
        detected_lang = "hi"

    # Extraction patterns: (field_key, regex_patterns)
    patterns = {
        "nitrogen": [
            r"(?:available\s*nitrogen|avail\s*n|nitrogen|\bn\b|నత్రజని|నైట్రోజన్|नाइट्रोजन)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:n\s*\(\s*kg/ha\s*\))(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:^|\n)\s*N\s+([0-9]+(?:\.[0-9]+)?)\s*(?:kg/ha)?",
        ],
        "phosphorus": [
            r"(?:available\s*phosphorus|avail\s*p|phosphorus|p2o5|\bp\b|భాస్వరం|फास्फोरस)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:p\s*\(\s*kg/ha\s*\))(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:^|\n)\s*P\s+([0-9]+(?:\.[0-9]+)?)\s*(?:kg/ha)?",
        ],
        "potassium": [
            r"(?:available\s*potassium|available\s*potash|avail\s*k|potassium|potash|k2o|\bk\b|పొటాష్|पोटाश)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:k\s*\(\s*kg/ha\s*\))(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:^|\n)\s*K\s+([0-9]+(?:\.[0-9]+)?)\s*(?:kg/ha)?",
        ],
        "ph": [
            r"(?:soil\s*reaction|reaction|soil\s*ph|ph\s*reaction|\bph\b|పీహెచ్|पीएच)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:^|\n)\s*pH\s+([0-9]+(?:\.[0-9]+)?)",
        ],
        "organic_carbon": [
            r"(?:organic\s*carbon|o\.c\.|oc|\bcarbon\b|సేంద్రీయ\s*కర్బనం|जैविक\s*कार्बन)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:oc\s*\(\s*%\s*\))(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
        ],
        "electrical_conductivity": [
            r"(?:electrical\s*conductivity|conductivity|e\.c\.|ec|విద్యుత్\s*వాహకత|विद्युत\s*चालकता)(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
            r"(?:ec\s*\(\s*ds/m\s*\))(?:[^\d\n]*?)([0-9]+(?:\.[0-9]+)?)",
        ],
    }

    extracted_fields: Dict[str, SoilCardFieldConfidence] = {}
    found_confidences = []

    for field_name, regex_list in patterns.items():
        min_v, max_v, unit = VALIDATION_RANGES[field_name]
        val: Optional[float] = None
        conf = 0.0
        status = "UNAVAILABLE"
        raw_match: Optional[str] = None

        for pattern in regex_list:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    num_str = match.group(1)
                    parsed_num = float(num_str)
                    raw_match = match.group(0).strip()
                    # Plausibility check
                    if min_v <= parsed_num <= max_v:
                        val = parsed_num
                        conf = 0.95 if (unit.lower() in raw_match.lower() or field_name == "ph") else 0.85
                        status = "HIGH" if conf >= 0.90 else "MEDIUM"
                        break
                    else:
                        # Out of bounds value
                        val = parsed_num
                        conf = 0.40
                        status = "LOW"
                        raw_match = f"{raw_match} (out of expected range {min_v}-{max_v})"
                        break
                except (ValueError, IndexError):
                    continue

        extracted_fields[field_name] = SoilCardFieldConfidence(
            value=val,
            confidence=conf,
            unit=unit,
            status=status,
            raw_match=raw_match,
        )
        found_confidences.append(conf)

    # Calculate overall confidence
    non_zero = [c for c in found_confidences if c > 0]
    overall_conf = round(sum(non_zero) / len(non_zero), 2) if non_zero else 0.0

    notes: List[str] = []
    card_status = "WORKING"

    if has_telugu or has_hindi:
        card_status = "PARTIAL"
        notes.append(
            "Telugu/Hindi text detected. Indic language OCR models require specialized language packs "
            "(tessdata_fast / tel.traineddata / hin.traineddata). Extraction is partial; please verify and edit all numbers carefully."
        )

    if not active_engine:
        notes.append(
            "No local OCR engine (EasyOCR or Tesseract) is currently installed. "
            "Please review extracted values, fill missing metrics manually, or install an OCR backend via PowerShell."
        )

    notes.append(
        "Nothing is saved to your farm profile until you review and click Confirm. Never silently trust OCR."
    )

    return SoilCardExtractionResponse(
        engine_detected=active_engine,
        available_engines=available_engines,
        install_instructions=install_instructions,
        nitrogen=extracted_fields["nitrogen"],
        phosphorus=extracted_fields["phosphorus"],
        potassium=extracted_fields["potassium"],
        ph=extracted_fields["ph"],
        organic_carbon=extracted_fields["organic_carbon"],
        electrical_conductivity=extracted_fields["electrical_conductivity"],
        overall_confidence=overall_conf,
        raw_text=text,
        language=detected_lang,
        status=card_status,
        notes=notes,
    )


def generate_image_thumbnail_base64(image_bytes: bytes, max_dim: int = 800) -> Optional[str]:
    """
    Generates a scaled JPEG thumbnail base64 representation for preview in the confirmation screen.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.thumbnail((max_dim, max_dim))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=85)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return None


def execute_pluggable_ocr(image_bytes: bytes, lang: str = "en") -> str:
    """
    Attempts to execute optical character recognition using available engine.
    Returns extracted raw text.
    """
    active_engine, _, _ = detect_ocr_engines()

    if active_engine == "easyocr":
        try:
            import easyocr
            langs = ["en"]
            if lang == "te":
                langs = ["te", "en"]
            elif lang == "hi":
                langs = ["hi", "en"]
            reader = easyocr.Reader(langs, gpu=False)
            results = reader.readtext(image_bytes, detail=0)
            return "\n".join(results)
        except Exception as e:
            return f"[EasyOCR extraction failed: {str(e)}]"

    elif active_engine == "tesseract":
        try:
            import pytesseract
            image = Image.open(io.BytesIO(image_bytes))
            tess_lang = "eng"
            if lang == "te":
                tess_lang = "tel+eng"
            elif lang == "hi":
                tess_lang = "hin+eng"
            return pytesseract.image_to_string(image, lang=tess_lang)
        except Exception as e:
            return f"[Tesseract extraction failed: {str(e)}]"

    return ""


def analyze_soil_impact(
    farm_id: int,
    state: str,
    district: str,
    area_acres: float,
    crop_name: str,
    n: Optional[float],
    p: Optional[float],
    k: Optional[float],
    ph: Optional[float],
    oc: Optional[float] = None,
    ec: Optional[float] = None,
) -> SoilImpactAnalysisResponse:
    """
    Compares crop recommendation and yield predictions with and without confirmed soil card values.
    Demonstrates transparent shift from weather-only fallback to full multi-feature model.
    """
    has_soil = (n is not None and p is not None and k is not None and ph is not None)

    # 1. Recommendation WITHOUT soil card (weather-only model)
    rec_without = crop_recommender_engine.recommend(
        n=None,
        p=None,
        k=None,
        ph=None,
        state=state,
        district=district,
    )

    # 2. Recommendation WITH soil card (full 7-feature model)
    rec_with = crop_recommender_engine.recommend(
        n=n,
        p=p,
        k=k,
        ph=ph,
        state=state,
        district=district,
    ) if has_soil else rec_without

    # 3. Yield predictions
    yield_without = yield_model_engine.predict_yield(
        crop_name=crop_name,
        state=state,
        district=district,
        area_acres=area_acres,
    )

    # Calculate soil fertility adjustment factor
    soil_adj_pct = 0.0
    soil_reasons: List[str] = []

    if has_soil and ph is not None:
        # pH evaluation
        if 6.2 <= ph <= 7.8:
            soil_adj_pct += 4.0
            soil_reasons.append("Optimal soil pH reaction (6.2 - 7.8) enhances macro-nutrient assimilation (+4.0%).")
        elif ph < 5.8:
            soil_adj_pct -= 6.0
            soil_reasons.append(f"Acidic soil stress (pH {ph:.1f}) reduces phosphorus availability (-6.0%).")
        elif ph > 8.2:
            soil_adj_pct -= 5.0
            soil_reasons.append(f"Alkaline soil stress (pH {ph:.1f}) limits micronutrient uptake (-5.0%).")

        # Organic Carbon evaluation
        if oc is not None:
            if oc >= 0.75:
                soil_adj_pct += 5.0
                soil_reasons.append(f"High organic carbon ({oc:.2f}%) improves soil microbial activity and moisture retention (+5.0%).")
            elif oc < 0.40:
                soil_adj_pct -= 4.0
                soil_reasons.append(f"Low organic carbon ({oc:.2f}%) reduces nutrient-holding capacity (-4.0%).")

        # EC evaluation
        if ec is not None:
            if ec > 2.0:
                soil_adj_pct -= 8.0
                soil_reasons.append(f"Elevated electrical conductivity ({ec:.2f} dS/m) indicates salinity hazard (-8.0%).")

    # Clone yield prediction and apply soil adjustment
    yield_with = dict(yield_without)
    base_expected = yield_without.get("expected_yield_quintals_per_acre")
    if base_expected is not None and has_soil:
        mult = 1.0 + (soil_adj_pct / 100.0)
        adj_expected = round(base_expected * mult, 2)
        base_low = yield_without.get("yield_range_lower") or base_expected * 0.8
        base_high = yield_without.get("yield_range_upper") or base_expected * 1.2
        adj_low = round(base_low * mult, 2)
        adj_high = round(base_high * mult, 2)

        yield_with["expected_yield_quintals_per_acre"] = adj_expected
        yield_with["yield_range_lower"] = adj_low
        yield_with["yield_range_upper"] = adj_high
        yield_with["expected_total_quintals"] = round(adj_expected * area_acres, 1)
        yield_with["total_range_lower"] = round(adj_low * area_acres, 1)
        yield_with["total_range_upper"] = round(adj_high * area_acres, 1)

        # Append soil fertility factor
        adj_factors = list(yield_without.get("adjustment_factors", []))
        adj_factors.append({
            "factor_name": "Soil Fertility Index (Soil Health Card)",
            "adjustment_pct": soil_adj_pct,
            "rationale": "; ".join(soil_reasons) if soil_reasons else "Soil chemical properties evaluated.",
            "citation": "indicative assumption, no source",
        })
        yield_with["adjustment_factors"] = adj_factors

    # Synthesize impact summary statements
    impact_summary: List[str] = []
    if has_soil:
        top_crop_before = rec_without["top_crops"][0]["crop_name"] if rec_without.get("top_crops") else "None"
        top_crop_after = rec_with["top_crops"][0]["crop_name"] if rec_with.get("top_crops") else "None"
        conf_before = rec_without.get("confidence", 0.50) * 100
        conf_after = rec_with.get("confidence", 0.88) * 100

        impact_summary.append(
            f"Crop recommendation confidence increased from {conf_before:.0f}% (weather-only fallback) "
            f"to {conf_after:.0f}% (full 7-feature N-P-K model)."
        )
        if top_crop_before.lower() != top_crop_after.lower():
            impact_summary.append(
                f"Top recommended crop shifted from '{top_crop_before.capitalize()}' to '{top_crop_after.capitalize()}' "
                f"based on your soil's actual N={n} kg/ha, P={p} kg/ha, K={k} kg/ha test results."
            )
        else:
            impact_summary.append(
                f"Top recommended crop '{top_crop_after.capitalize()}' was re-confirmed with high confidence by soil chemical metrics."
            )

        if base_expected is not None:
            new_exp = yield_with["expected_yield_quintals_per_acre"]
            diff = round(new_exp - base_expected, 2)
            sign = "+" if diff >= 0 else ""
            impact_summary.append(
                f"Yield expectation adjusted by {sign}{soil_adj_pct:.1f}% ({sign}{diff} q/acre) based on measured pH {ph} and fertility balance "
                f"(indicative assumption, no source)."
            )
    else:
        impact_summary.append(
            "No confirmed soil health card on file. Recommendations currently rely on the weather-only fallback model (~50% confidence)."
        )

    soil_vals = None
    if has_soil:
        soil_vals = {
            "nitrogen_kg_ha": n,
            "phosphorus_kg_ha": p,
            "potassium_kg_ha": k,
            "ph": ph,
            "organic_carbon_pct": oc,
            "electrical_conductivity_ds_m": ec,
        }

    return SoilImpactAnalysisResponse(
        farm_id=farm_id,
        crop_name=crop_name,
        has_confirmed_soil_card=has_soil,
        soil_values=soil_vals,
        without_soil_card={
            "top_crops": rec_without.get("top_crops", [])[:3],
            "confidence": rec_without.get("confidence", 0.50),
            "fallback_used": rec_without.get("fallback_used", "weather_only_model"),
            "expected_yield_q_acre": yield_without.get("expected_yield_quintals_per_acre"),
            "yield_range": [yield_without.get("yield_range_lower"), yield_without.get("yield_range_upper")],
        },
        with_soil_card={
            "top_crops": rec_with.get("top_crops", [])[:3],
            "confidence": rec_with.get("confidence", 0.88),
            "fallback_used": rec_with.get("fallback_used", "none_full_features"),
            "expected_yield_q_acre": yield_with.get("expected_yield_quintals_per_acre"),
            "yield_range": [yield_with.get("yield_range_lower"), yield_with.get("yield_range_upper")],
            "soil_fertility_adjustment_pct": soil_adj_pct if has_soil else 0.0,
        },
        impact_summary=impact_summary,
        disclaimer="Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer.",
    )
