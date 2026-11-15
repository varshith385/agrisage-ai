"""
AgriSage AI — Comprehensive Tests for Soil Health Card OCR, Pluggable Backends,
Confirmation Screen Guard, Privacy Opt-In, and Recommendation/Yield Impact.
Module 20: /api/v1/soil-card
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from backend.app.models.farm import Farm
from backend.app.models.soil_card import SoilHealthCard
from backend.app.services.soil_card_ocr import (
    analyze_soil_impact,
    detect_ocr_engines,
    generate_image_thumbnail_base64,
    parse_soil_card_text,
)


# ---------------------------------------------------------
# Test Card Transcripts
# ---------------------------------------------------------

SAMPLE_CARD_ENGLISH = """
GOVERNMENT OF INDIA - MINISTRY OF AGRICULTURE & FARMERS WELFARE
SOIL HEALTH CARD (DEPARTMENT OF AGRICULTURE & COOPERATION)
Farmer Name: Ramesh Kumar
Village: Geesugonda, District: Warangal, State: Telangana

TEST RESULTS & NUTRIENT STATUS:
1. Available Nitrogen (N): 280.5 kg/ha  [Medium]
2. Available Phosphorus (P): 18.2 kg/ha  [Medium]
3. Available Potassium (K): 310.0 kg/ha  [High]
4. Soil Reaction (pH): 7.2  [Neutral]
5. Organic Carbon (OC): 0.54 %  [Medium]
6. Electrical Conductivity (EC): 0.42 dS/m  [Normal]
Soil Texture: Sandy Clay Loam
"""

SAMPLE_CARD_TELANGANA_TELUGU = """
తెలంగాణ ప్రభుత్వం - వ్యవసాయ శాఖ
నేల ఆరోగ్య పత్రం (Soil Health Card)
రైతు పేరు: రమేష్ కుమార్, గ్రామం: ధర్మసాగర్, జిల్లా: వరంగల్

విశ్లేషణ వివరాలు:
నత్రజని (N): 245.0 kg/ha [సాధారణం]
భాస్వరం (P): 22.0 kg/ha [మధ్యస్థం]
పొటాష్ (K): 285.0 kg/ha [ఎక్కువ]
పీహెచ్ (pH): 7.4 [తటస్థం]
సేంద్రీయ కర్బనం: 0.48 %
విద్యుత్ వాహకత (EC): 0.35 dS/m
భూమి రకం: నల్ల రేగడి నేల (Black Soil)
"""

SAMPLE_CARD_HINDI = """
कृषि एवं किसान कल्याण मंत्रालय - भारत सरकार
मृदा स्वास्थ्य कार्ड
किसान का नाम: रमेश कुमार, राज्य: तेलंगाना

मृदा परीक्षण परिणाम:
नाइट्रोजन (N): 260.0 kg/ha (मध्यम)
फास्फोरस (P): 19.5 kg/ha (मध्यम)
पोटाश (K): 270.0 kg/ha (उच्च)
पीएच (pH): 6.8 (सामान्य)
जैविक कार्बन: 0.52 % (मध्यम)
विद्युत चालकता (EC): 0.38 dS/m (सामान्य)
मृदा प्रकार: दोमट मिट्टी
"""

SAMPLE_CARD_OUT_OF_BOUNDS = """
Available Nitrogen (N): 9999.0 kg/ha
Soil pH: 18.5
Organic Carbon (OC): 25.0 %
"""


# ---------------------------------------------------------
# 1. OCR Engine Detection & PowerShell Instructions Tests
# ---------------------------------------------------------

def test_detect_ocr_engines_structure():
    active_engine, available, missing_instructions = detect_ocr_engines()
    assert isinstance(available, list)
    assert isinstance(missing_instructions, dict)
    # Ensure PowerShell install instructions exist for missing engines
    for engine, cmd in missing_instructions.items():
        assert "py -3.12" in cmd or "winget" in cmd or "GEMINI_API_KEY" in cmd


def test_engines_api_endpoint(client: TestClient):
    res = client.get("/api/v1/soil-card/engines")
    assert res.status_code == 200
    data = res.json()
    assert "available_engines" in data
    assert "install_instructions" in data
    assert "powershell_help" in data
    assert "easyocr" in data["powershell_help"]
    assert "tesseract" in data["powershell_help"]


# ---------------------------------------------------------
# 2. Card Parsing & Pluggable Label Extraction Tests
# ---------------------------------------------------------

def test_parse_english_card():
    res = parse_soil_card_text(SAMPLE_CARD_ENGLISH, requested_lang="en")
    assert res.nitrogen.value == 280.5
    assert res.nitrogen.confidence >= 0.85
    assert res.phosphorus.value == 18.2
    assert res.potassium.value == 310.0
    assert res.ph.value == 7.2
    assert res.organic_carbon.value == 0.54
    assert res.electrical_conductivity.value == 0.42
    assert res.overall_confidence >= 0.85
    assert res.status == "WORKING"
    assert "Nothing is saved to your farm profile" in res.notes[-1]


def test_parse_telugu_card_marks_partial():
    res = parse_soil_card_text(SAMPLE_CARD_TELANGANA_TELUGU, requested_lang="te")
    assert res.nitrogen.value == 245.0
    assert res.phosphorus.value == 22.0
    assert res.potassium.value == 285.0
    assert res.ph.value == 7.4
    assert res.organic_carbon.value == 0.48
    assert res.electrical_conductivity.value == 0.35
    assert res.language == "te"
    assert res.status == "PARTIAL"
    assert any("Telugu/Hindi text detected" in n for n in res.notes)


def test_parse_hindi_card_marks_partial():
    res = parse_soil_card_text(SAMPLE_CARD_HINDI, requested_lang="hi")
    assert res.nitrogen.value == 260.0
    assert res.phosphorus.value == 19.5
    assert res.potassium.value == 270.0
    assert res.ph.value == 6.8
    assert res.organic_carbon.value == 0.52
    assert res.electrical_conductivity.value == 0.38
    assert res.language == "hi"
    assert res.status == "PARTIAL"


def test_parse_out_of_bounds_downgrades_confidence():
    res = parse_soil_card_text(SAMPLE_CARD_OUT_OF_BOUNDS)
    assert res.nitrogen.confidence < 0.50
    assert res.nitrogen.status == "LOW"
    assert "out of expected range" in res.nitrogen.raw_match
    assert res.ph.confidence < 0.50
    assert res.ph.status == "LOW"


def test_ocr_api_endpoint_with_text(client: TestClient):
    res = client.post("/api/v1/soil-card/ocr", data={"raw_text": SAMPLE_CARD_ENGLISH, "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["nitrogen"]["value"] == 280.5
    assert data["ph"]["value"] == 7.2
    assert data["status"] == "WORKING"


# ---------------------------------------------------------
# 3. Image Thumbnail & Upload Tests
# ---------------------------------------------------------

def test_thumbnail_generation():
    img = Image.new("RGB", (1000, 800), color=(200, 220, 240))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    thumb_b64 = generate_image_thumbnail_base64(img_bytes, max_dim=400)
    assert thumb_b64 is not None
    assert thumb_b64.startswith("data:image/jpeg;base64,")


def test_ocr_endpoint_with_multipart_image(client: TestClient):
    img = Image.new("RGB", (200, 200), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_card.jpg", buf, "image/jpeg")}
    data = {"raw_text": "Available Nitrogen: 250 kg/ha\npH: 6.9"}
    res = client.post("/api/v1/soil-card/ocr", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["preview_image_base64"] is not None
    assert res_data["nitrogen"]["value"] == 250.0
    assert res_data["ph"]["value"] == 6.9


# ---------------------------------------------------------
# 4. Confirmation Screen Guard & Privacy Protection Tests
# ---------------------------------------------------------

@pytest.fixture
def test_farm(db_session: Session, demo_farmer) -> Farm:
    farm = Farm(
        user_id=demo_farmer.id,
        name="Soil Test Plot",
        area=3.0,
        ownership_type="owned",
        owned_area=3.0,
        leased_area=0.0,
        village="Geesugonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm


def test_unconfirmed_card_never_saves_to_profile(client: TestClient, farmer_headers: dict, test_farm: Farm, db_session: Session):
    # Simply calling OCR endpoint should NOT touch database
    _ = client.post("/api/v1/soil-card/ocr", data={"raw_text": SAMPLE_CARD_ENGLISH})
    
    # Query database
    cards = db_session.query(SoilHealthCard).filter(SoilHealthCard.farm_id == test_farm.id).all()
    assert len(cards) == 0

    # Query latest endpoint
    res = client.get(f"/api/v1/soil-card/latest?farm_id={test_farm.id}", headers=farmer_headers)
    assert res.status_code == 200
    assert res.json()["has_card"] is False


def test_confirm_requires_authentication(client: TestClient, test_farm: Farm):
    payload = {
        "farm_id": test_farm.id,
        "nitrogen_kg_ha": 280.0,
        "phosphorus_kg_ha": 18.0,
        "potassium_kg_ha": 310.0,
        "ph": 7.2,
    }
    res = client.post("/api/v1/soil-card/confirm", json=payload)
    assert res.status_code == 401


def test_confirm_flow_and_privacy_opt_out(client: TestClient, farmer_headers: dict, test_farm: Farm, db_session: Session):
    payload = {
        "farm_id": test_farm.id,
        "nitrogen_kg_ha": 280.0,
        "phosphorus_kg_ha": 18.0,
        "potassium_kg_ha": 310.0,
        "ph": 7.2,
        "organic_carbon_pct": 0.54,
        "electrical_conductivity_ds_m": 0.42,
        "soil_texture": "Sandy Loam",
        "store_image_opt_in": False,
        "extraction_method": "manual",
    }
    res = client.post("/api/v1/soil-card/confirm", json=payload, headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["confirmed_values"]["nitrogen_kg_ha"] == 280.0
    assert data["confirmed_values"]["image_stored"] is False

    # Verify Farm soil_type was updated
    db_session.refresh(test_farm)
    assert test_farm.soil_type == "Sandy Loam"

    # Verify latest card endpoint
    latest_res = client.get(f"/api/v1/soil-card/latest?farm_id={test_farm.id}", headers=farmer_headers)
    assert latest_res.status_code == 200
    assert latest_res.json()["has_card"] is True
    assert latest_res.json()["card"]["nitrogen_kg_ha"] == 280.0
    assert latest_res.json()["card"]["image_stored"] is False


def test_confirm_privacy_opt_in_with_image(client: TestClient, farmer_headers: dict, test_farm: Farm):
    dummy_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
    payload = {
        "farm_id": test_farm.id,
        "nitrogen_kg_ha": 290.0,
        "ph": 7.1,
        "store_image_opt_in": True,
        "image_base64": dummy_b64,
        "extraction_method": "easyocr",
    }
    res = client.post("/api/v1/soil-card/confirm", json=payload, headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["confirmed_values"]["image_stored"] is True


# ---------------------------------------------------------
# 5. Recommendation & Yield Impact Analysis Tests
# ---------------------------------------------------------

def test_impact_analysis_shows_before_and_after_shift():
    # Without soil card vs With soil card
    impact = analyze_soil_impact(
        farm_id=1,
        state="Telangana",
        district="Warangal",
        area_acres=3.0,
        crop_name="Rice",
        n=280.0,
        p=20.0,
        k=300.0,
        ph=7.2,
        oc=0.55,
        ec=0.40,
    )

    assert impact.has_confirmed_soil_card is True
    assert impact.without_soil_card["confidence"] < impact.with_soil_card["confidence"]
    assert impact.without_soil_card["fallback_used"] == "weather_only_model (soil N, P, K, pH not provided)"
    assert impact.with_soil_card["fallback_used"] == "none_full_features"
    assert len(impact.impact_summary) >= 2
    assert "Indicative agronomic modeling" in impact.disclaimer


def test_impact_no_hardcoded_yield_adjustment_and_scope_note():
    """
    Point 1: Ensures NO hardcoded pH 6.2-7.8 (+4.0%) or arbitrary fertility factor adjustments are applied.
    Point 3: Ensures integration_scope_note explicitly states values are comparison-only.
    """
    impact = analyze_soil_impact(
        farm_id=1,
        state="Telangana",
        district="Warangal",
        area_acres=3.0,
        crop_name="Rice",
        n=280.0,
        p=20.0,
        k=300.0,
        ph=7.2,
        oc=0.55,
        ec=0.40,
    )

    # 1. Zero unvalidated yield adjustment
    assert impact.with_soil_card["yield_adjustment_applied"] is False
    assert impact.without_soil_card["expected_yield_q_acre"] == impact.with_soil_card["expected_yield_q_acre"]
    # Ensure no "+4.0%" or hardcoded fertility percentage
    assert not any("+4.0%" in s for s in impact.impact_summary)
    assert not any("Fertility Factor" in s for s in impact.impact_summary)

    # 2. Integration scope note
    assert "Confirmed soil values are evaluated only within this comparison screen" in impact.integration_scope_note
    assert "/api/v1/crop-recommendation" in impact.integration_scope_note


def test_impact_confidence_returns_null_when_model_returns_none(monkeypatch):
    """
    Point 2: Verifies that when recommender model returns None/no confidence,
    it returns None (null) and does NOT fallback to 0.88 or 0.50.
    """
    from backend.app.ml.crop_recommender import crop_recommender_engine

    def mock_recommend(*args, **kwargs):
        return {
            "top_crops": [{"crop_name": "rice", "probability": 0.8}],
            "confidence": None,
            "fallback_used": "missing_artifact_demo",
        }

    monkeypatch.setattr(crop_recommender_engine, "recommend", mock_recommend)

    impact = analyze_soil_impact(
        farm_id=1,
        state="Telangana",
        district="Warangal",
        area_acres=3.0,
        crop_name="Rice",
        n=280.0,
        p=20.0,
        k=300.0,
        ph=7.2,
    )

    # Must be None, NEVER 0.88 or 0.50
    assert impact.without_soil_card["confidence"] is None
    assert impact.with_soil_card["confidence"] is None
    assert "Model confidence is not available." in impact.impact_summary


def test_impact_api_endpoint(client: TestClient, farmer_headers: dict, test_farm: Farm):
    # First confirm a soil card
    confirm_payload = {
        "farm_id": test_farm.id,
        "nitrogen_kg_ha": 275.0,
        "phosphorus_kg_ha": 22.0,
        "potassium_kg_ha": 310.0,
        "ph": 7.0,
        "organic_carbon_pct": 0.60,
        "electrical_conductivity_ds_m": 0.35,
        "soil_texture": "Clay Loam",
        "store_image_opt_in": False,
    }
    client.post("/api/v1/soil-card/confirm", json=confirm_payload, headers=farmer_headers)

    # Call impact endpoint
    res = client.post(
        "/api/v1/soil-card/impact",
        json={"farm_id": test_farm.id, "crop_name": "Rice"},
        headers=farmer_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["has_confirmed_soil_card"] is True
    assert data["soil_values"]["nitrogen_kg_ha"] == 275.0
    assert data["with_soil_card"]["confidence"] > data["without_soil_card"]["confidence"]
    assert len(data["impact_summary"]) > 0
    assert "integration_scope_note" in data
    assert "comparison screen" in data["integration_scope_note"]


# ---------------------------------------------------------
# 6. Round 8 Phase 3 Gemini Vision & Extended Validation Tests
# ---------------------------------------------------------

from backend.app.models.user import User, UserRole
from backend.app.security.auth import create_access_token, hash_password
from backend.app.services.soil_card_ocr import (
    call_gemini_vision,
    convert_nutrient_unit,
    extract_soil_card_from_image,
    validate_soil_metric,
)


def _make_dummy_image_bytes(format: str = "JPEG") -> bytes:
    img = Image.new("RGB", (256, 256), color=(240, 245, 235))
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def test_gemini_vision_success_mocked(client: TestClient, monkeypatch):
    """Test 1: Mocked Gemini Vision extraction of valid Soil Health Card"""
    mock_payload = {
        "is_soil_health_card": True,
        "rejection_reason": None,
        "test_date": "2026-04-10",
        "soil_texture": "Sandy Clay Loam",
        "nitrogen": {"value": 285.0, "unit": "kg/ha", "confidence": 0.95},
        "phosphorus": {"value": 19.5, "unit": "kg/ha", "confidence": 0.92},
        "potassium": {"value": 315.0, "unit": "kg/ha", "confidence": 0.94},
        "ph": {"value": 7.3, "unit": "pH", "confidence": 0.98},
        "organic_carbon": {"value": 0.58, "unit": "%", "confidence": 0.90},
        "electrical_conductivity": {"value": 0.40, "unit": "dS/m", "confidence": 0.88},
    }

    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (mock_payload, None, None),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("soil_card.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["is_soil_health_card"] is True
    assert data["status"] == "WORKING"
    assert data["nitrogen"]["value"] == 285.0
    assert data["ph"]["value"] == 7.3
    assert data["test_date"] == "2026-04-10"
    assert data["source"] == "photo read by AI"
    assert data["overall_confidence"] >= 0.90


def test_gemini_vision_partial_read_some_nulls(client: TestClient, monkeypatch):
    """Test 2: Partial read with null/unreadable values (never guesses)"""
    mock_payload = {
        "is_soil_health_card": True,
        "rejection_reason": None,
        "test_date": None,
        "soil_texture": None,
        "nitrogen": {"value": 240.0, "unit": "kg/ha", "confidence": 0.85},
        "phosphorus": {"value": None, "unit": None, "confidence": 0.0},
        "potassium": {"value": None, "unit": None, "confidence": 0.0},
        "ph": {"value": 6.8, "unit": "pH", "confidence": 0.90},
        "organic_carbon": {"value": None, "unit": None, "confidence": 0.0},
        "electrical_conductivity": {"value": None, "unit": None, "confidence": 0.0},
    }

    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (mock_payload, None, None),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("soil_card_partial.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["nitrogen"]["value"] == 240.0
    assert data["ph"]["value"] == 6.8
    assert data["phosphorus"]["value"] is None
    assert data["phosphorus"]["status"] == "UNAVAILABLE"
    assert data["potassium"]["value"] is None


def test_gemini_vision_non_soil_card_rejected(client: TestClient, monkeypatch):
    """Test 3: Non-soil-card image is rejected with a clear message"""
    mock_payload = {
        "is_soil_health_card": False,
        "rejection_reason": "The uploaded photo depicts machinery, not a Soil Health Card.",
        "test_date": None,
        "nitrogen": None,
        "ph": None,
    }

    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (mock_payload, None, None),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("tractor.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REJECTED_NOT_SOIL_CARD"
    assert data["is_soil_health_card"] is False
    assert data["overall_confidence"] == 0.0
    assert data["nitrogen"]["value"] is None
    assert any("not a Soil Health Card" in n for n in data["notes"])


def test_gemini_vision_429_rate_limit(client: TestClient, monkeypatch):
    """Test 4: HTTP 429 returns graceful status and manual entry note"""
    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (None, "Gemini vision rate limit reached (HTTP 429).", "RATE_LIMIT"),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("card.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "MANUAL_ONLY"
    assert any("rate limit" in n.lower() for n in data["notes"])


def test_gemini_vision_timeout_handling(client: TestClient, monkeypatch):
    """Test 5: Request timeout (8s) returns graceful timeout note"""
    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (None, "Gemini vision request timed out after 8 seconds.", "TIMEOUT"),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("card.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "MANUAL_ONLY"
    assert any("timed out" in n.lower() for n in data["notes"])


def test_gemini_vision_bad_json_handling(client: TestClient, monkeypatch):
    """Test 6: Malformed/bad JSON returns graceful parse error note"""
    monkeypatch.setattr(
        "backend.app.services.soil_card_ocr.call_gemini_vision",
        lambda *args, **kwargs: (None, "Could not parse AI vision response as valid JSON.", "BAD_JSON"),
    )

    img_bytes = _make_dummy_image_bytes()
    files = {"file": ("card.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    res = client.post("/api/v1/soil-card/ocr", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "MANUAL_ONLY"
    assert any("valid json" in n.lower() for n in data["notes"])


def test_unit_conversion_standard_and_unconfirmed():
    """Test 7: Standard unit conversions to kg/ha and unconfirmed handling"""
    # kg/ha -> standard 1.0
    val, unit, is_std = convert_nutrient_unit(280.0, "kg/ha")
    assert val == 280.0
    assert unit == "kg/ha"
    assert is_std is True

    # kg/acre -> converts by 2.47105
    val, unit, is_std = convert_nutrient_unit(100.0, "kg/acre")
    assert abs(val - 247.105) < 0.1
    assert unit == "kg/ha"
    assert is_std is True

    # ppm -> cannot be justified without arbitrary soil density/depth assumptions -> unconfirmed
    val, unit, is_std = convert_nutrient_unit(50.0, "ppm")
    assert val == 50.0
    assert unit == "ppm"
    assert is_std is False

    # lb/acre -> non-standard imperial unit -> unconfirmed
    val, unit, is_std = convert_nutrient_unit(100.0, "lb/ac")
    assert val == 100.0
    assert unit == "lb/ac"
    assert is_std is False

    # q/ha -> converts by 100
    val, unit, is_std = convert_nutrient_unit(2.5, "q/ha")
    assert val == 250.0
    assert unit == "kg/ha"
    assert is_std is True

    # Non-standard / unconfirmed unit -> preserves raw value, flagged as not standard
    val, unit, is_std = convert_nutrient_unit(15.0, "bags/plot")
    assert val == 15.0
    assert unit == "bags/plot"
    assert is_std is False

    # Unspecified unit -> flagged as not standard
    val, unit, is_std = convert_nutrient_unit(300.0, None)
    assert val == 300.0
    assert is_std is False


def test_physical_limits_and_out_of_range_ph():
    """Test 8: Physical limits discard negative values and pH outside 0-14"""
    # Physical pH: outside 0-14 must be discarded (None)
    metric, warns = validate_soil_metric("ph", 16.5, "pH", 0.90)
    assert metric.value is None
    assert metric.status == "LOW"
    assert any("physically impossible" in w for w in warns)

    metric, warns = validate_soil_metric("ph", -0.5, "pH", 0.90)
    assert metric.value is None

    # Negative nutrient discarded
    metric, warns = validate_soil_metric("nitrogen", -20.0, "kg/ha", 0.90)
    assert metric.value is None
    assert any("cannot be negative" in w for w in warns)

    # Extreme arable pH emits warning ceiling but keeps value
    metric, warns = validate_soil_metric("ph", 10.5, "pH", 0.90)
    assert metric.value == 10.5
    assert any("outside typical arable range" in w for w in warns)


def test_ownership_403_enforcement(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    """Test 9: Enforce ownership: 403 Forbidden when accessing another farmer's card"""
    # Create a second farmer
    other_user = User(
        email="suresh@agrisage.demo",
        hashed_password=hash_password("FarmerSuresh@2026"),
        full_name="Suresh Patel",
        role=UserRole.FARMER,
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    # Create a farm owned by the second farmer
    other_farm = Farm(
        user_id=other_user.id,
        name="Suresh Parcel",
        area=5.0,
        ownership_type="owned",
        owned_area=5.0,
        leased_area=0.0,
        village="Warangal",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
    )
    db_session.add(other_farm)
    db_session.commit()
    db_session.refresh(other_farm)

    # Ramesh (demo_farmer) tries to access Suresh's farm
    # 1. GET /latest -> 403
    res_get = client.get(f"/api/v1/soil-card/latest?farm_id={other_farm.id}", headers=farmer_headers)
    assert res_get.status_code == 403

    # 2. POST /confirm -> 403
    res_post = client.post(
        "/api/v1/soil-card/confirm",
        json={"farm_id": other_farm.id, "nitrogen_kg_ha": 250.0, "ph": 7.0},
        headers=farmer_headers,
    )
    assert res_post.status_code == 403

    # 3. DELETE -> 403
    res_del = client.delete(f"/api/v1/soil-card?farm_id={other_farm.id}", headers=farmer_headers)
    assert res_del.status_code == 403

    # 4. POST /impact -> 403
    res_imp = client.post(
        "/api/v1/soil-card/impact",
        json={"farm_id": other_farm.id, "crop_name": "Rice"},
        headers=farmer_headers,
    )
    assert res_imp.status_code == 403


def test_per_farm_separation(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    """Test 10: Farm A card never appears when querying Farm B"""
    farm_a = Farm(user_id=demo_farmer.id, name="Farm Alpha", area=2.0, ownership_type="owned", owned_area=2.0, leased_area=0.0, village="Geesugonda", state="Telangana", district="Warangal", latitude=17.9689, longitude=79.5941)
    farm_b = Farm(user_id=demo_farmer.id, name="Farm Beta", area=3.0, ownership_type="owned", owned_area=3.0, leased_area=0.0, village="Geesugonda", state="Telangana", district="Warangal", latitude=17.9689, longitude=79.5941)
    db_session.add_all([farm_a, farm_b])
    db_session.commit()
    db_session.refresh(farm_a)
    db_session.refresh(farm_b)

    # Save confirmed card for Farm A with N=320.0
    client.post(
        "/api/v1/soil-card/confirm",
        json={"farm_id": farm_a.id, "nitrogen_kg_ha": 320.0, "ph": 7.1, "source": "photo read by AI"},
        headers=farmer_headers,
    )

    # Save confirmed card for Farm B with N=180.0
    client.post(
        "/api/v1/soil-card/confirm",
        json={"farm_id": farm_b.id, "nitrogen_kg_ha": 180.0, "ph": 6.5, "source": "typed by farmer"},
        headers=farmer_headers,
    )

    # Query Farm A
    res_a = client.get(f"/api/v1/soil-card/latest?farm_id={farm_a.id}", headers=farmer_headers)
    assert res_a.status_code == 200
    assert res_a.json()["card"]["nitrogen_kg_ha"] == 320.0
    assert res_a.json()["card"]["farm_id"] == farm_a.id

    # Query Farm B
    res_b = client.get(f"/api/v1/soil-card/latest?farm_id={farm_b.id}", headers=farmer_headers)
    assert res_b.status_code == 200
    assert res_b.json()["card"]["nitrogen_kg_ha"] == 180.0
    assert res_b.json()["card"]["farm_id"] == farm_b.id


def test_latest_confirmed_selection(client: TestClient, db_session: Session, farmer_headers: dict, test_farm: Farm):
    """Test 11: GET /latest returns the most recent CONFIRMED card, ignoring unconfirmed cards"""
    from datetime import datetime, timezone, timedelta
    # Card 1: older confirmed card
    card1 = SoilHealthCard(
        farm_id=test_farm.id,
        nitrogen_kg_ha=200.0,
        ph=6.5,
        is_confirmed=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    # Card 2: unconfirmed card with higher values
    card2 = SoilHealthCard(
        farm_id=test_farm.id,
        nitrogen_kg_ha=999.0,
        ph=8.0,
        is_confirmed=False,
        created_at=datetime.now(timezone.utc) - timedelta(days=2),
    )
    db_session.add_all([card1, card2])
    db_session.commit()

    # Card 3: latest confirmed card committed via confirm endpoint
    client.post(
        "/api/v1/soil-card/confirm",
        json={"farm_id": test_farm.id, "nitrogen_kg_ha": 290.0, "ph": 7.3, "test_date": "2026-05-01"},
        headers=farmer_headers,
    )

    res = client.get(f"/api/v1/soil-card/latest?farm_id={test_farm.id}", headers=farmer_headers)
    assert res.status_code == 200
    card_data = res.json()["card"]
    assert card_data["nitrogen_kg_ha"] == 290.0
    assert card_data["test_date"] == "2026-05-01"


def test_delete_soil_card_for_farm(client: TestClient, farmer_headers: dict, test_farm: Farm):
    """Test 12: DELETE /soil-card?farm_id=X removes saved soil values for a farm"""
    # Confirm a card first
    client.post(
        "/api/v1/soil-card/confirm",
        json={"farm_id": test_farm.id, "nitrogen_kg_ha": 270.0, "ph": 7.0},
        headers=farmer_headers,
    )
    res_before = client.get(f"/api/v1/soil-card/latest?farm_id={test_farm.id}", headers=farmer_headers)
    assert res_before.json()["has_card"] is True

    # Delete soil values for test_farm
    del_res = client.delete(f"/api/v1/soil-card?farm_id={test_farm.id}", headers=farmer_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Query latest -> has_card is now False
    res_after = client.get(f"/api/v1/soil-card/latest?farm_id={test_farm.id}", headers=farmer_headers)
    assert res_after.status_code == 200
    assert res_after.json()["has_card"] is False
    assert res_after.json()["card"] is None

