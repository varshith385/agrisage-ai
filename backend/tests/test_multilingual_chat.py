"""
Unit and integration tests for Multilingual Chat and Voice Assistant (Telugu, Hindi, English).
Phase 3 Verification:
- Checks script consistency (Telugu Unicode range \u0C00-\u0C7F, Hindi Devanagari range \u0900-\u097F).
- Asserts that Telugu and Hindi responses do not leak unexpected English text.
- Validates that DEMO DATA tags are localized in rule-based price and weather replies.
- Validates zero chemical dosage prescriptions across all languages.
- Validates that language auto-detection follows what was typed when distinct from selected language.
"""

import re
import pytest
from fastapi.testclient import TestClient

from backend.app.database.session import Base, SessionLocal, engine
from backend.app.main import app
from backend.app.models.farm import CropStage, CurrentCropCycle, Farm, IrrigationMethod, OwnershipType
from backend.app.models.user import Language, User, UserRole
from backend.app.security.auth import create_access_token, hash_password
from backend.app.services.voice_service import (
    CHEMICAL_DOSAGE_REGEX,
    CHEMICAL_NAMES_REGEX,
    resolve_response_language,
    voice_service,
)
from backend.app.schemas.voice import VoiceQueryRequest


@pytest.fixture(scope="module")
def multilingual_client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    email = "multilingual_farmer@grow2gain.internal"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("FarmerTestPass@2026"),
            full_name="Multilingual Test Farmer",
            phone_number="9876500009",
            role=UserRole.FARMER,
            preferred_language=Language.TE,
            is_active=True,
            is_demo_account=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    if not farm:
        farm = Farm(
            user_id=user.id,
            name="Telangana Test Holding",
            area=5.0,
            ownership_type=OwnershipType.OWNED,
            owned_area=5.0,
            leased_area=0.0,
            lease_amount=0.0,
            soil_type="black clay",
            water_source="borewell",
            irrigation_method=IrrigationMethod.DRIP,
            budget=150000.0,
            village="Geesugonda",
            district="Warangal",
            state="Telangana",
            latitude=17.9689,
            longitude=79.5941,
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        cycle = CurrentCropCycle(
            farm_id=farm.id,
            crop_name="cotton",
            variety="Bt Cotton",
            planting_date=farm.created_at.date(),
            current_stage=CropStage.VEGETATIVE,
        )
        db.add(cycle)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    client = TestClient(app)
    client.headers = {"Authorization": f"Bearer {token}"}
    yield client, user, farm
    db.close()


def count_script_chars(text: str, script_range: str) -> int:
    return len(re.findall(rf"[{script_range}]", text))


def extract_english_words(text: str) -> list[str]:
    """Finds Latin alphabet words excluding numbers and brand/technical allowlist."""
    allowlist = {
        "grow2gain", "agmarknet", "apmc", "fao", "56", "imd", "kvk", "cpu", "cnn", "live", "demo", "data",
        "cached", "open", "meteo", "faq", "mm", "kg", "c", "ha", "in", "am", "pm", "asia", "kolkata", "utc"
    }
    words = re.findall(r"[A-Za-z]+", text)
    return [w for w in words if w.lower() not in allowlist]


def test_language_resolution():
    # User selected Telugu, typed Telugu -> stays te
    assert resolve_response_language("ఈరోజు వర్షం పడుతుందా?", "te") == "te"

    # User selected English, typed Telugu script -> switches to te
    assert resolve_response_language("ఈరోజు వర్షం పడుతుందా?", "en") == "te"

    # User selected English, typed Hindi script -> switches to hi
    assert resolve_response_language("क्या आज बारिश होगी?", "en") == "hi"

    # User selected Telugu, typed 3+ English words -> follows typed English
    assert resolve_response_language("Will it rain today in Warangal?", "te") == "en"

    # User selected Hindi, typed 3+ English words -> follows typed English
    assert resolve_response_language("Should I irrigate my farm today?", "hi") == "en"

    # Fallback to selected when ambiguous
    assert resolve_response_language("12345", "te") == "te"
    assert resolve_response_language("12345", "hi") == "hi"


def test_telugu_rule_based_weather(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "ఈరోజు వర్షం పడుతుందా?", "language": "te", "farm_id": farm.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "weather"
    text = data["spoken_text"]

    # Verify Telugu script dominates
    te_count = count_script_chars(text, r"\u0C00-\u0C7F")
    assert te_count > 20, f"Expected Telugu script, got: {text}"

    # Verify no leaked English paragraphs (only allowed units/brand/DEMO DATA)
    leaked = extract_english_words(text)
    assert len(leaked) <= 2, f"Unexpected English words leaked in Telugu weather: {leaked} in '{text}'"


def test_telugu_rule_based_irrigation(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "ఈరోజు నా పంటకు నీరు పెట్టాలా?", "language": "te", "farm_id": farm.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "irrigation"
    text = data["spoken_text"]

    te_count = count_script_chars(text, r"\u0C00-\u0C7F")
    assert te_count > 20, f"Expected Telugu script, got: {text}"
    leaked = extract_english_words(text)
    assert len(leaked) <= 3, f"Unexpected English words leaked in Telugu irrigation: {leaked} in '{text}'"


def test_telugu_rule_based_mandi_price(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "పత్తి మార్కెట్ ధర ఎంత?", "language": "te"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "price"
    text = data["spoken_text"]

    # Verify Telugu script
    te_count = count_script_chars(text, r"\u0C00-\u0C7F")
    assert te_count > 20, f"Expected Telugu script, got: {text}"

    # Verify translated DEMO DATA label
    assert "డెమో డేటా" in text or "డెమో" in text

    # Verify zero MSP invention
    assert "msp: 10000" not in text.lower()


def test_telugu_rule_based_navigation(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "మార్కెట్ తెరవండి", "language": "te"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["action_type"] == "navigate"
    assert data["action_link"] == "/market"

    # Spoken text, action label, and confirmation chip in Telugu
    assert count_script_chars(data["spoken_text"], r"\u0C00-\u0C7F") > 10
    if data.get("action_label"):
        assert count_script_chars(data["action_label"], r"\u0C00-\u0C7F") > 3
    if data.get("confirmation_chip"):
        assert count_script_chars(data["confirmation_chip"], r"\u0C00-\u0C7F") > 3


def test_hindi_rule_based_weather(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "क्या आज बारिश होगी?", "language": "hi", "farm_id": farm.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "weather"
    text = data["spoken_text"]

    hi_count = count_script_chars(text, r"\u0900-\u097F")
    assert hi_count > 20, f"Expected Devanagari script, got: {text}"
    leaked = extract_english_words(text)
    assert len(leaked) <= 2, f"Unexpected English words leaked in Hindi weather: {leaked} in '{text}'"


def test_hindi_rule_based_irrigation(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "क्या आज फसल को पानी देना चाहिए?", "language": "hi", "farm_id": farm.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "irrigation"
    text = data["spoken_text"]

    hi_count = count_script_chars(text, r"\u0900-\u097F")
    assert hi_count > 20, f"Expected Devanagari script, got: {text}"
    leaked = extract_english_words(text)
    assert len(leaked) <= 3, f"Unexpected English words leaked in Hindi irrigation: {leaked} in '{text}'"


def test_hindi_rule_based_mandi_price(multilingual_client):
    client, user, farm = multilingual_client
    resp = client.post("/api/v1/voice/query", json={"query": "कपास का मंडी भाव क्या है?", "language": "hi"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "price"
    text = data["spoken_text"]

    hi_count = count_script_chars(text, r"\u0900-\u097F")
    assert hi_count > 20, f"Expected Devanagari script, got: {text}"
    assert "डेमो डेटा" in text or "डेमो" in text


def test_zero_chemical_dosages_prescribed(multilingual_client):
    client, user, farm = multilingual_client
    # Test pest/disease advice across en, te, hi
    queries = [
        ("What chemical should I spray for cotton bollworm?", "en"),
        ("పత్తిలో పురుగుల నివారణకు ఏ రసాయనం స్ప్రే చేయాలి?", "te"),
        ("कपास में कीट नियंत्रण के लिए कौन सी रासायनिक दवा छिड़कें?", "hi"),
    ]
    for q, lang in queries:
        resp = client.post("/api/v1/voice/query", json={"query": q, "language": lang})
        assert resp.status_code == 200
        text = resp.json()["spoken_text"]
        assert not CHEMICAL_DOSAGE_REGEX.search(text), f"Prescribed chemical dosage in {lang}: {text}"
        assert not CHEMICAL_NAMES_REGEX.search(text), f"Prescribed banned chemical in {lang}: {text}"


def test_telugu_reminder_workflow(multilingual_client):
    client, user, farm = multilingual_client
    # 1. Ask to schedule a reminder
    resp1 = client.post("/api/v1/voice/query", json={
        "query": "రేపు పొలం తనిఖీ చేయాలని గుర్తుచేయి",
        "language": "te"
    })
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["intent"] == "reminder_confirm"
    prompt_text = data1["spoken_text"]
    assert count_script_chars(prompt_text, r"\u0C00-\u0C7F") > 20
    assert "నిర్ధారణ" in prompt_text or "గుర్తుచేయ" in prompt_text or "జ్ఞాపిక" in prompt_text

    # 2. Confirm with "అవును"
    history = [
        {"role": "user", "content": "రేపు పొలం తనిఖీ చేయాలని గుర్తుచేయి"},
        {"role": "assistant", "content": prompt_text},
    ]
    resp2 = client.post("/api/v1/voice/query", json={
        "query": "అవును",
        "language": "te",
        "history": history
    })
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["intent"] == "reminder_saved"
    saved_text = data2["spoken_text"]
    assert count_script_chars(saved_text, r"\u0C00-\u0C7F") > 15
    assert "భద్రపరచబడింది" in saved_text
