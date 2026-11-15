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
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx
from PIL import Image

logger = logging.getLogger(__name__)

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

    # Determine preferred active engine: Gemini Vision (preferred if key configured), then EasyOCR, then Tesseract
    active_engine: Optional[str] = None
    if "gemini_vision" in available:
        active_engine = "gemini_vision"
    elif "easyocr" in available:
        active_engine = "easyocr"
    elif "tesseract" in available:
        active_engine = "tesseract"

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


def convert_nutrient_unit(value: Optional[float], unit: Optional[str]) -> Tuple[Optional[float], str, bool]:
    """
    Converts nutrient measurement to kg/ha if unit is known and standard.
    Returns: (converted_value, target_unit, is_confirmed_standard_unit)
    """
    if value is None:
        return None, "kg/ha", True
    if not unit or not str(unit).strip():
        return value, "unspecified", False

    u = str(unit).strip().lower()
    clean_u = re.sub(r"[\s\-_/]+", "", u)

    if clean_u in ("kgha", "kgh", "kgperha", "kgha1", "kgha-1"):
        return round(float(value), 2), "kg/ha", True
    if clean_u in ("kgacre", "kgperacre", "kgac", "kgperac"):
        # 1 ha = 2.47105 acres -> 1 kg/acre = 2.47105 kg/ha
        return round(float(value) * 2.47105, 2), "kg/ha", True
    if clean_u in ("ppm", "mgkg", "mgperkg"):
        # Topsoil furrow slice: 1 ppm = 2.24 kg/ha
        return round(float(value) * 2.24, 2), "kg/ha", True
    if clean_u in ("lbacre", "lbsacre", "lbac", "lbsac"):
        return round(float(value) * 1.12085, 2), "kg/ha", True
    if clean_u in ("qha", "qperha", "quintalha", "quintalsperha"):
        return round(float(value) * 100.0, 2), "kg/ha", True

    return value, str(unit).strip(), False


def validate_soil_metric(
    field_name: str,
    raw_val: Optional[float],
    unit: Optional[str],
    confidence: float = 0.0,
    raw_match: Optional[str] = None,
) -> Tuple[SoilCardFieldConfidence, List[str]]:
    """
    Validates extracted metric against physical limits (pH 0-14, no negatives)
    and agronomic ceilings (warnings, no clamping).
    """
    warnings: List[str] = []
    default_unit = (
        "kg/ha" if field_name in ("nitrogen", "phosphorus", "potassium")
        else ("pH" if field_name == "ph" else ("%" if field_name == "organic_carbon" else "dS/m"))
    )

    if raw_val is None:
        return (
            SoilCardFieldConfidence(
                value=None,
                confidence=0.0,
                unit=unit or default_unit,
                status="UNAVAILABLE",
                raw_match=raw_match,
            ),
            warnings,
        )

    # Physical limits
    if raw_val < 0.0:
        warnings.append(f"{field_name.capitalize()} cannot be negative ({raw_val}). Discarded as physically invalid.")
        return (
            SoilCardFieldConfidence(
                value=None,
                confidence=0.0,
                unit=unit or default_unit,
                status="LOW",
                raw_match=f"{raw_match} (invalid negative)" if raw_match else "invalid negative",
            ),
            warnings,
        )

    if field_name == "ph":
        if raw_val < 0.0 or raw_val > 14.0:
            warnings.append(f"pH value {raw_val} is physically impossible (must be between 0.0 and 14.0). Discarded.")
            return (
                SoilCardFieldConfidence(
                    value=None,
                    confidence=0.0,
                    unit="pH",
                    status="LOW",
                    raw_match=f"{raw_match} (out of 0-14 physical scale)" if raw_match else "out of 0-14 scale",
                ),
                warnings,
            )
        if raw_val < 4.5 or raw_val > 9.5:
            warnings.append(f"Soil pH {raw_val} is outside typical arable range (4.5 to 9.5). Soil may be strongly acidic or alkaline.")

        status = "HIGH" if confidence >= 0.85 else ("MEDIUM" if confidence >= 0.60 else "LOW")
        return (
            SoilCardFieldConfidence(
                value=round(raw_val, 2),
                confidence=confidence,
                unit="pH",
                status=status,
                raw_match=raw_match,
            ),
            warnings,
        )

    if field_name in ("nitrogen", "phosphorus", "potassium"):
        conv_val, target_unit, is_std = convert_nutrient_unit(raw_val, unit)
        if not is_std:
            warnings.append(f"{field_name.capitalize()} printed unit '{unit}' is non-standard or unconfirmed. Stored without silent conversion.")
            return (
                SoilCardFieldConfidence(
                    value=conv_val,
                    confidence=min(confidence, 0.50),
                    unit=target_unit,
                    status="LOW",
                    raw_match=f"{raw_match} (unconfirmed unit '{unit}')" if raw_match else f"unconfirmed unit '{unit}'",
                ),
                warnings,
            )

        ceilings = {"nitrogen": 600.0, "phosphorus": 150.0, "potassium": 600.0}
        max_ceil = ceilings.get(field_name, 600.0)
        if conv_val is not None and conv_val > max_ceil:
            warnings.append(f"{field_name.capitalize()} value ({conv_val} kg/ha) exceeds typical agronomic ceiling ({max_ceil} kg/ha). Please review carefully.")

        status = "HIGH" if confidence >= 0.85 else ("MEDIUM" if confidence >= 0.60 else "LOW")
        return (
            SoilCardFieldConfidence(
                value=conv_val,
                confidence=confidence,
                unit="kg/ha",
                status=status,
                raw_match=raw_match,
            ),
            warnings,
        )

    status = "HIGH" if confidence >= 0.85 else ("MEDIUM" if confidence >= 0.60 else "LOW")
    return (
        SoilCardFieldConfidence(
            value=round(raw_val, 2),
            confidence=confidence,
            unit=unit or default_unit,
            status=status,
            raw_match=raw_match,
        ),
        warnings,
    )


def call_gemini_vision(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    lang: str = "en",
    timeout: float = 8.0,
) -> Tuple[Optional[Dict[str, Any]], Optional[str], Optional[str]]:
    """
    Sends soil health card photo to Gemini Vision API for structured JSON extraction.
    Returns: (extracted_json_dict, error_message, error_code)
    """
    gemini_key = getattr(settings, "GEMINI_API_KEY", None) or os.environ.get("GEMINI_API_KEY")
    if not gemini_key or len(gemini_key.strip()) <= 10:
        return None, "Gemini API key is not configured.", "NO_API_KEY"

    model = os.environ.get("GEMINI_VISION_MODEL") or getattr(settings, "GEMINI_VISION_MODEL", None) or "gemini-3.1-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key.strip()}"

    system_prompt = (
        "You are an expert agricultural document parser specializing in Indian Soil Health Cards (SHC) issued by the Ministry of Agriculture & Farmers Welfare, State Agriculture Departments, or certified agricultural testing laboratories.\n"
        "Analyze the provided image and extract soil test parameters into the following strict JSON schema:\n"
        "{\n"
        '  "is_soil_health_card": boolean,\n'
        '  "rejection_reason": string or null,\n'
        '  "test_date": string or null,\n'
        '  "soil_texture": string or null,\n'
        '  "nitrogen": {"value": float or null, "unit": string or null, "confidence": float},\n'
        '  "phosphorus": {"value": float or null, "unit": string or null, "confidence": float},\n'
        '  "potassium": {"value": float or null, "unit": string or null, "confidence": float},\n'
        '  "ph": {"value": float or null, "unit": "pH" or null, "confidence": float},\n'
        '  "organic_carbon": {"value": float or null, "unit": string or null, "confidence": float},\n'
        '  "electrical_conductivity": {"value": float or null, "unit": string or null, "confidence": float}\n'
        "}\n\n"
        "CRITICAL RULES:\n"
        "- If the image is NOT a Soil Health Card, laboratory soil analysis report, or agricultural soil test document, set is_soil_health_card: false, rejection_reason: 'The uploaded image does not appear to be an official Soil Health Card or laboratory soil test report.', and set all nutrient values to null.\n"
        "- Extract only values clearly visible on the card.\n"
        "- If a value or unit is unreadable, blurred, or missing, return null. NEVER guess, synthesize, or invent numbers.\n"
        "- For confidence, provide a number between 0.0 and 1.0 based on readability and visual clarity.\n"
        "- Return strictly valid JSON."
    )

    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": system_prompt},
                {"inline_data": {
                    "mime_type": mime_type,
                    "data": b64_image,
                }}
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        }
    }

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 429:
                logger.warning("Gemini vision rate limit hit: status=429")
                return None, "Gemini vision service rate limit reached (HTTP 429). Please enter values manually or retry shortly.", "RATE_LIMIT"
            if resp.status_code >= 500:
                logger.warning("Gemini vision server error: status=%s", resp.status_code)
                return None, f"Gemini vision service temporarily unavailable (HTTP {resp.status_code}). Please enter values manually.", "SERVER_ERROR"
            if resp.status_code != 200:
                logger.warning("Gemini vision request failed: status=%s", resp.status_code)
                return None, f"Gemini vision service error (HTTP {resp.status_code}). Please enter values manually.", "HTTP_ERROR"

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning("Gemini vision returned empty candidates")
                return None, "Gemini vision returned an empty reply. Please enter values manually.", "EMPTY_REPLY"

            raw_reply = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not raw_reply or not raw_reply.strip():
                logger.warning("Gemini vision returned blank text content")
                return None, "Gemini vision returned blank response. Please enter values manually.", "EMPTY_REPLY"

            cleaned = raw_reply.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)

            parsed = json.loads(cleaned)
            return parsed, None, None

    except httpx.TimeoutException:
        logger.warning("Gemini vision request timed out: timeout=%ss", timeout)
        return None, f"Gemini vision request timed out after {timeout:.0f} seconds. Please enter values manually or try again.", "TIMEOUT"
    except json.JSONDecodeError as jde:
        logger.warning("Gemini vision invalid JSON response: exception=%s", type(jde).__name__)
        return None, "Could not parse AI vision response as valid JSON. Please enter values manually.", "BAD_JSON"
    except Exception as exc:
        logger.warning("Gemini vision request failed: exception=%s", type(exc).__name__)
        return None, f"Gemini vision request failed ({type(exc).__name__}). Please enter values manually.", "ERROR"


def extract_soil_card_from_image(
    image_bytes: bytes,
    filename: Optional[str] = None,
    lang: str = "en",
) -> SoilCardExtractionResponse:
    """
    Complete Soil Health Card extraction pipeline:
    - Validates file size (<= 10MB)
    - Validates file format (rejects phone HEIC with clear message)
    - Validates image integrity via Pillow
    - Generates preview thumbnail base64
    - Executes preferred engine in order: gemini_vision -> easyocr -> tesseract -> manual
    - Normalizes units to kg/ha with standard conversion factors
    - Applies physical validity checks (pH 0-14, non-negative nutrients)
    - Emits agronomic envelope ceiling warnings (no clamping)
    - Returns structured response with provenance
    """
    active_engine, available_engines, install_instructions = detect_ocr_engines()
    notes: List[str] = []

    # 1. File size check (max 10MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        return SoilCardExtractionResponse(
            engine_detected=active_engine,
            available_engines=available_engines,
            install_instructions=install_instructions,
            nitrogen=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            phosphorus=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            potassium=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            ph=SoilCardFieldConfidence(value=None, confidence=0.0, unit="pH", status="UNAVAILABLE"),
            organic_carbon=SoilCardFieldConfidence(value=None, confidence=0.0, unit="%", status="UNAVAILABLE"),
            electrical_conductivity=SoilCardFieldConfidence(value=None, confidence=0.0, unit="dS/m", status="UNAVAILABLE"),
            overall_confidence=0.0,
            status="MANUAL_ONLY",
            notes=["File size exceeds 10 MB limit. Please compress photo before uploading or enter values manually."],
        )

    # 2. HEIC / HEIF phone format check
    is_heic = False
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext in (".heic", ".heif"):
            is_heic = True
    if len(image_bytes) >= 12:
        magic = image_bytes[4:12].lower()
        if b"ftypheic" in magic or b"ftypmif1" in magic or b"ftypheif" in magic:
            is_heic = True

    if is_heic:
        return SoilCardExtractionResponse(
            engine_detected=active_engine,
            available_engines=available_engines,
            install_instructions=install_instructions,
            nitrogen=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            phosphorus=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            potassium=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            ph=SoilCardFieldConfidence(value=None, confidence=0.0, unit="pH", status="UNAVAILABLE"),
            organic_carbon=SoilCardFieldConfidence(value=None, confidence=0.0, unit="%", status="UNAVAILABLE"),
            electrical_conductivity=SoilCardFieldConfidence(value=None, confidence=0.0, unit="dS/m", status="UNAVAILABLE"),
            overall_confidence=0.0,
            status="MANUAL_ONLY",
            notes=["HEIC format from mobile phones is not supported. Please convert or take photo in JPEG or PNG format, or enter values manually."],
        )

    # 3. Image integrity check
    try:
        test_img = Image.open(io.BytesIO(image_bytes))
        test_img.verify()
    except Exception:
        return SoilCardExtractionResponse(
            engine_detected=active_engine,
            available_engines=available_engines,
            install_instructions=install_instructions,
            nitrogen=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            phosphorus=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            potassium=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
            ph=SoilCardFieldConfidence(value=None, confidence=0.0, unit="pH", status="UNAVAILABLE"),
            organic_carbon=SoilCardFieldConfidence(value=None, confidence=0.0, unit="%", status="UNAVAILABLE"),
            electrical_conductivity=SoilCardFieldConfidence(value=None, confidence=0.0, unit="dS/m", status="UNAVAILABLE"),
            overall_confidence=0.0,
            status="MANUAL_ONLY",
            notes=["Uploaded file appears to be damaged or not a valid image. Please enter values manually or try uploading another photo."],
        )

    preview_b64 = generate_image_thumbnail_base64(image_bytes)

    # Determine MIME type
    mime_type = "image/jpeg"
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext in (".png",):
            mime_type = "image/png"
        elif ext in (".webp",):
            mime_type = "image/webp"

    # 4. Engine execution: Gemini Vision preferred
    if active_engine == "gemini_vision":
        gemini_dict, err_msg, err_code = call_gemini_vision(image_bytes, mime_type=mime_type, lang=lang)
        if gemini_dict is not None:
            # Check if rejected as non-soil-card
            if not gemini_dict.get("is_soil_health_card", True):
                rejection = gemini_dict.get("rejection_reason") or "Uploaded photo does not appear to be an official Soil Health Card or laboratory soil test report."
                return SoilCardExtractionResponse(
                    engine_detected="gemini_vision",
                    available_engines=available_engines,
                    install_instructions=install_instructions,
                    nitrogen=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                    phosphorus=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                    potassium=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                    ph=SoilCardFieldConfidence(value=None, confidence=0.0, unit="pH", status="UNAVAILABLE"),
                    organic_carbon=SoilCardFieldConfidence(value=None, confidence=0.0, unit="%", status="UNAVAILABLE"),
                    electrical_conductivity=SoilCardFieldConfidence(value=None, confidence=0.0, unit="dS/m", status="UNAVAILABLE"),
                    overall_confidence=0.0,
                    preview_image_base64=preview_b64,
                    status="REJECTED_NOT_SOIL_CARD",
                    is_soil_health_card=False,
                    rejection_reason=rejection,
                    source="photo read by AI",
                    notes=[rejection, "Please upload a clear photo of an official Soil Health Card or enter your soil values manually."],
                )

            # Parse each field from Gemini JSON
            extracted_fields = {}
            confidences = []

            for field_name in ["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon", "electrical_conductivity"]:
                item = gemini_dict.get(field_name)
                val = None
                unit = None
                conf = 0.0
                if isinstance(item, dict):
                    val = item.get("value")
                    unit = item.get("unit")
                    conf = float(item.get("confidence") or 0.0)
                elif isinstance(item, (int, float)):
                    val = float(item)
                    conf = 0.85

                metric, field_warns = validate_soil_metric(
                    field_name=field_name,
                    raw_val=val,
                    unit=unit,
                    confidence=conf,
                    raw_match=f"{field_name}: {val} {unit}" if val is not None else None,
                )
                extracted_fields[field_name] = metric
                notes.extend(field_warns)
                if metric.confidence > 0:
                    confidences.append(metric.confidence)

            overall_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
            test_date = gemini_dict.get("test_date")
            soil_texture = gemini_dict.get("soil_texture")

            notes.append("Photo read by AI vision. Values are suggestions — verify each before confirming.")
            notes.append("Nothing is saved to your farm profile until you review and click Confirm.")

            return SoilCardExtractionResponse(
                engine_detected="gemini_vision",
                available_engines=available_engines,
                install_instructions=install_instructions,
                nitrogen=extracted_fields["nitrogen"],
                phosphorus=extracted_fields["phosphorus"],
                potassium=extracted_fields["potassium"],
                ph=extracted_fields["ph"],
                organic_carbon=extracted_fields["organic_carbon"],
                electrical_conductivity=extracted_fields["electrical_conductivity"],
                overall_confidence=overall_conf,
                preview_image_base64=preview_b64,
                raw_text=json.dumps(gemini_dict),
                language=lang,
                status="WORKING" if overall_conf >= 0.60 else "PARTIAL",
                notes=notes,
                is_soil_health_card=True,
                test_date=test_date,
                soil_texture=soil_texture,
                source="photo read by AI",
            )
        else:
            # Gemini call failed -> note error and attempt fallback or manual
            notes.append(err_msg or "AI vision call failed. Falling back to local OCR or manual entry.")
            # Fall back to local OCR if installed
            if "easyocr" in available_engines or "tesseract" in available_engines:
                fallback_text = execute_pluggable_ocr(image_bytes, lang=lang)
                if fallback_text and not fallback_text.startswith("["):
                    parsed_fallback = parse_soil_card_text(fallback_text, requested_lang=lang)
                    parsed_fallback.preview_image_base64 = preview_b64
                    parsed_fallback.notes = notes + parsed_fallback.notes
                    return parsed_fallback

            # Manual entry fallback
            return SoilCardExtractionResponse(
                engine_detected="gemini_vision",
                available_engines=available_engines,
                install_instructions=install_instructions,
                nitrogen=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                phosphorus=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                potassium=SoilCardFieldConfidence(value=None, confidence=0.0, unit="kg/ha", status="UNAVAILABLE"),
                ph=SoilCardFieldConfidence(value=None, confidence=0.0, unit="pH", status="UNAVAILABLE"),
                organic_carbon=SoilCardFieldConfidence(value=None, confidence=0.0, unit="%", status="UNAVAILABLE"),
                electrical_conductivity=SoilCardFieldConfidence(value=None, confidence=0.0, unit="dS/m", status="UNAVAILABLE"),
                overall_confidence=0.0,
                preview_image_base64=preview_b64,
                status="MANUAL_ONLY",
                notes=notes + ["Please fill your soil metrics manually."],
                source="typed by farmer",
            )

    # If local OCR (easyocr/tesseract) is active
    if active_engine in ("easyocr", "tesseract"):
        ocr_text = execute_pluggable_ocr(image_bytes, lang=lang)
        res = parse_soil_card_text(ocr_text, requested_lang=lang)
        res.preview_image_base64 = preview_b64
        res.source = "photo read by OCR"
        return res

    # No automated engine available
    res = parse_soil_card_text("", requested_lang=lang)
    res.preview_image_base64 = preview_b64
    res.status = "MANUAL_ONLY"
    res.source = "typed by farmer"
    return res


def execute_pluggable_ocr(image_bytes: bytes, lang: str = "en") -> str:
    """
    Attempts to execute optical character recognition using available engine.
    Returns extracted raw text.
    """
    active_engine, _, _ = detect_ocr_engines()

    if active_engine == "gemini_vision":
        parsed, err, _ = call_gemini_vision(image_bytes, lang=lang)
        if parsed:
            lines = []
            if parsed.get("test_date"):
                lines.append(f"Test Date: {parsed['test_date']}")
            for k in ["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon", "electrical_conductivity"]:
                item = parsed.get(k)
                if isinstance(item, dict) and item.get("value") is not None:
                    lines.append(f"{k.capitalize()}: {item['value']} {item.get('unit') or ''}")
            return "\n".join(lines) if lines else "[Gemini Vision: No parameters readable on card]"
        return f"[Gemini Vision extraction failed: {err or 'unknown error'}]"

    elif active_engine == "easyocr":
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
    Uses real model outputs from crop_recommender_engine and yield_model_engine with ZERO synthetic adjustments.
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

    # 2. Recommendation WITH soil card (full 7-feature model if soil provided)
    rec_with = crop_recommender_engine.recommend(
        n=n,
        p=p,
        k=k,
        ph=ph,
        state=state,
        district=district,
    ) if has_soil else rec_without

    # 3. Real Yield predictions (zero synthetic yield adjustments)
    yield_res = yield_model_engine.predict_yield(
        crop_name=crop_name,
        state=state,
        district=district,
        area_acres=area_acres,
    )

    # Extract real model confidences without hardcoded fallbacks
    # Returns null (None) if the model returned no confidence
    conf_before: Optional[float] = rec_without.get("confidence")
    conf_after: Optional[float] = rec_with.get("confidence") if has_soil else conf_before

    # Synthesize honest impact summary statements
    impact_summary: List[str] = []
    if has_soil:
        top_crop_before = rec_without["top_crops"][0]["crop_name"] if rec_without.get("top_crops") else None
        top_crop_after = rec_with["top_crops"][0]["crop_name"] if rec_with.get("top_crops") else None

        if conf_before is not None and conf_after is not None:
            impact_summary.append(
                f"Crop recommendation confidence: {conf_before * 100:.0f}% (weather-only model) vs "
                f"{conf_after * 100:.0f}% (full 7-feature N-P-K model)."
            )
        elif conf_after is not None:
            impact_summary.append(f"Full 7-feature N-P-K model confidence: {conf_after * 100:.0f}%.")
        else:
            impact_summary.append("Model confidence is not available.")

        if top_crop_before and top_crop_after:
            if top_crop_before.lower() != top_crop_after.lower():
                impact_summary.append(
                    f"Top recommended crop shifted from '{top_crop_before.capitalize()}' to '{top_crop_after.capitalize()}' "
                    f"based on your soil's actual N={n} kg/ha, P={p} kg/ha, K={k} kg/ha test results."
                )
            else:
                impact_summary.append(
                    f"Top recommended crop '{top_crop_after.capitalize()}' was re-confirmed by soil chemical metrics."
                )

        exp_yield = yield_res.get("expected_yield_quintals_per_acre")
        if exp_yield is not None:
            impact_summary.append(
                f"Expected yield: {exp_yield:.2f} quintals/acre based on historical district/season records. "
                "No arbitrary soil adjustments applied (yield regressor is trained on production data, not soil tests)."
            )
    else:
        impact_summary.append(
            "No confirmed soil health card on file. Recommendations currently evaluate the weather-only fallback model."
        )

    scope_note = (
        "Confirmed soil values are evaluated only within this comparison screen and are not yet passed "
        "to the farm's main recommendation (/api/v1/crop-recommendation) and yield (/api/v1/yield) endpoints."
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
            "confidence": conf_before,
            "fallback_used": rec_without.get("fallback_used", "weather_only_model"),
            "expected_yield_q_acre": yield_res.get("expected_yield_quintals_per_acre"),
            "yield_range": [yield_res.get("yield_range_lower"), yield_res.get("yield_range_upper")],
        },
        with_soil_card={
            "top_crops": rec_with.get("top_crops", [])[:3],
            "confidence": conf_after,
            "fallback_used": rec_with.get("fallback_used", "none_full_features"),
            "expected_yield_q_acre": yield_res.get("expected_yield_quintals_per_acre"),
            "yield_range": [yield_res.get("yield_range_lower"), yield_res.get("yield_range_upper")],
            "yield_adjustment_applied": False,
        },
        impact_summary=impact_summary,
        integration_scope_note=scope_note,
        disclaimer="Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer.",
    )
