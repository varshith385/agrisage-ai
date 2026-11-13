"""
Unit and integration tests for Voice Assistant Module 21: /api/v1/voice
Tests:
- 5 sample utterances per language (en, te, hi) verifying intent classification & domain routing
- Market price intent availability notice
- No-key LLM fallback: returns 'I don't know, please consult an agriculture officer'
- Authentication requirement (401 on unauthenticated requests)
- Safe agricultural prescriptions: strictly zero chemical dosages or banned pesticides
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.database.session import Base, SessionLocal, engine
from backend.app.main import app
from backend.app.models.farm import CropStage, CurrentCropCycle, Farm, IrrigationMethod, OwnershipType
from backend.app.models.user import Language, User, UserRole
from backend.app.security.auth import create_access_token, hash_password
from backend.app.services.voice_service import (
    CHEMICAL_DOSAGE_REGEX,
    CHEMICAL_NAMES_REGEX,
    classify_intent,
    sanitize_agronomic_speech,
)


@pytest.fixture(scope="module")
def setup_voice_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Create test user
    email = "voice_farmer@agrisage.internal"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("FarmerTestPass@2026"),
            full_name="Voice Test Farmer",
            phone_number="9876500001",
            role=UserRole.FARMER,
            preferred_language=Language.EN,
            is_active=True,
            is_demo_account=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create test farm
    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    if not farm:
        farm = Farm(
            user_id=user.id,
            name="Voice Test Farm",
            area=5.0,
            ownership_type=OwnershipType.OWNED,
            owned_area=5.0,
            leased_area=0.0,
            lease_amount=0.0,
            soil_type="sandy loam",
            water_source="borewell",
            irrigation_method=IrrigationMethod.FLOOD,
            budget=200000.0,
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
            variety="Bt Cotton RCH-2",
            planting_date=farm.created_at.date(),
            current_stage=CropStage.VEGETATIVE,
            is_active=True,
        )
        db.add(cycle)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    yield {"user": user, "farm": farm, "token": token}
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


# 1. 5 Sample Utterances per Language for Intent Classification
SAMPLE_UTTERANCES_EN = [
    ("Will it rain today in my field?", "weather"),
    ("Should I irrigate my cotton crop today?", "irrigation"),
    ("My tomato leaves have yellow spots and blight", "disease"),
    ("What is my total cultivation cost for 5 acres?", "cost"),
    ("What government subsidies and schemes am I eligible for?", "scheme"),
]

SAMPLE_UTTERANCES_TE = [
    ("ఈరోజు మా ఊరిలో వర్షం పడుతుందా?", "weather"),
    ("నా పత్తి పంటకు ఈరోజు నీరు పెట్టాలా?", "irrigation"),
    ("ఆకులపై తెగులు మచ్చలు ఉన్నాయి ఏం చేయాలి?", "disease"),
    ("ఎకరాకు పత్తి సాగు ఖర్చు ఎంత అవుతుంది?", "cost"),
    ("రైతు బంధు పథకం వివరాలు ఏమిటి?", "scheme"),
]

SAMPLE_UTTERANCES_HI = [
    ("क्या आज हमारे खेत में बारिश होगी?", "weather"),
    ("क्या मुझे अपनी फसल में आज पानी देना चाहिए?", "irrigation"),
    ("टमाटर के पत्तों पर पीले धब्बे और रोग दिख रहे हैं", "disease"),
    ("खेती की कुल लागत और खर्च कितना आएगा?", "cost"),
    ("पीएम किसान सम्मान निधि योजना की क्या जानकारी है?", "scheme"),
]


@pytest.mark.parametrize("query,expected_intent", SAMPLE_UTTERANCES_EN)
def test_intent_classification_english(query: str, expected_intent: str):
    intent, conf = classify_intent(query)
    assert intent == expected_intent, f"Query '{query}' classified as {intent}, expected {expected_intent}"
    assert conf >= 0.70


@pytest.mark.parametrize("query,expected_intent", SAMPLE_UTTERANCES_TE)
def test_intent_classification_telugu(query: str, expected_intent: str):
    intent, conf = classify_intent(query)
    assert intent == expected_intent, f"Telugu query '{query}' classified as {intent}, expected {expected_intent}"
    assert conf >= 0.70


@pytest.mark.parametrize("query,expected_intent", SAMPLE_UTTERANCES_HI)
def test_intent_classification_hindi(query: str, expected_intent: str):
    intent, conf = classify_intent(query)
    assert intent == expected_intent, f"Hindi query '{query}' classified as {intent}, expected {expected_intent}"
    assert conf >= 0.70


# 2. Integration Tests: API /api/v1/voice/query across all 3 languages
def test_voice_api_weather_english(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    payload = {"query": "What is the weather forecast and rain status?", "language": "en"}
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "weather"
    assert data["status"] in ["WORKING", "DEMO"]
    assert "°C" in data["spoken_text"] or "temperature" in data["spoken_text"].lower() or "weather" in data["spoken_text"].lower()
    assert data["action_link"] == "/weather"
    assert len(data["sources"]) > 0


def test_voice_api_irrigation_telugu(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    payload = {"query": "ఈరోజు నా పత్తి పంటకు నీరు పెట్టాలా?", "language": "te"}
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "irrigation"
    assert "నీరు" in data["spoken_text"]
    assert data["action_link"] == "/irrigation"
    assert "FAO-56" in data["sources"][0]


def test_voice_api_cost_hindi(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    payload = {"query": "मेरी 5 एकड़ कपास में खेती की लागत और खर्च कितना आएगा?", "language": "hi"}
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "cost"
    assert "लागत" in data["spoken_text"] or "₹" in data["spoken_text"]
    assert data["action_link"] == "/economics"
    assert "not taken from any published report" in data["sources"][0]


def test_voice_api_scheme_intent_honesty(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}

    # English: no specific scheme names, amounts, or eligibility from memory
    payload_en = {"query": "What government subsidies and schemes am I eligible for?", "language": "en"}
    res_en = client.post("/api/v1/voice/query", json=payload_en, headers=headers)
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["intent"] == "scheme"
    assert data_en["status"] == "PARTIAL"
    spoken_en = data_en["spoken_text"].lower()
    assert "not built yet" in spoken_en
    assert "mandal" in spoken_en
    assert "details to verify" in spoken_en
    assert "rythu bandhu" not in spoken_en
    assert "pm-kisan" not in spoken_en
    assert "6000" not in spoken_en and "6,000" not in spoken_en
    assert "details to verify" in data_en["sources"][0].lower()

    # Telugu: details to verify, no memory scheme amounts
    payload_te = {"query": "ప్రభుత్వ వ్యవసాయ పథకాల వివరాలు ఏమిటి?", "language": "te"}
    res_te = client.post("/api/v1/voice/query", json=payload_te, headers=headers)
    assert res_te.status_code == 200
    data_te = res_te.json()
    assert data_te["intent"] == "scheme"
    assert "మారుతుంటాయి" in data_te["spoken_text"]
    assert "details to verify" in data_te["spoken_text"].lower()
    assert "రైతు బంధు" not in data_te["spoken_text"]

    # Hindi: details to verify, no memory scheme amounts
    payload_hi = {"query": "सरकारी कृषि योजनाओं की क्या जानकारी है?", "language": "hi"}
    res_hi = client.post("/api/v1/voice/query", json=payload_hi, headers=headers)
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["intent"] == "scheme"
    assert "बदलते रहते हैं" in data_hi["spoken_text"]
    assert "details to verify" in data_hi["spoken_text"].lower()
    assert "पीएम किसान" not in data_hi["spoken_text"]


# 3. Market Price Query Handling (Mandi data not yet integrated)
def test_voice_api_market_price_notice(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    payload = {"query": "What is the cotton mandi price today?", "language": "en"}
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "price"
    assert "mandi price" in data["spoken_text"].lower() or "enumamula" in data["spoken_text"].lower()
    assert data["action_link"] == "/market"
    assert data["structured_data"]["market_data_available"] is True


# 4. No-Key LLM Fallback Test
def test_voice_api_no_key_fallback(client, setup_voice_db, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    
    # English
    payload_en = {"query": "Can you compose a poem about tractors and rainbows?", "language": "en"}
    res_en = client.post("/api/v1/voice/query", json=payload_en, headers=headers)
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["intent"] == "general"
    assert data_en["spoken_text"] == "I don't know, please consult an agriculture officer."
    assert data_en["status"] == "DEMO"
    assert data_en["confidence"] <= 0.20

    # Telugu fallback
    payload_te = {"query": "ట్రాక్టర్ల గురించి ఒక కవిత చెప్పండి", "language": "te"}
    res_te = client.post("/api/v1/voice/query", json=payload_te, headers=headers)
    assert res_te.status_code == 200
    assert "నాకు ఈ విషయం తెలియదు, దయచేసి మీ స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి." in res_te.json()["spoken_text"]

    # Hindi fallback
    payload_hi = {"query": "ट्रैक्टर और चाँद-सितारों पर एक सुंदर कविता सुनाओ", "language": "hi"}
    res_hi = client.post("/api/v1/voice/query", json=payload_hi, headers=headers)
    assert res_hi.status_code == 200
    assert "मुझे इसकी जानकारी नहीं है, कृपया अपने स्थानीय कृषि अधिकारी से संपर्क करें।" in res_hi.json()["spoken_text"]


# 5. Authentication Enforcement (Login Required)
def test_voice_api_requires_authentication(client):
    res = client.post("/api/v1/voice/query", json={"query": "Will it rain today?"})
    assert res.status_code in [401, 403], f"Expected 401 or 403, got {res.status_code}"


# 6. Safety Gate: Strictly Zero Chemical Dosages & No Guarantees
def test_voice_safety_gate_no_chemical_dosages(client, setup_voice_db):
    headers = {"Authorization": f"Bearer {setup_voice_db['token']}"}
    payload = {
        "query": "How many ml per liter of monocrotophos or chlorpyrifos should I spray on my cotton?",
        "language": "en",
    }
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    spoken = data["spoken_text"]
    
    # Assert regex catches NO dosages and NO chemical names in output
    assert not CHEMICAL_DOSAGE_REGEX.search(spoken), f"Chemical dosage found in output: {spoken}"
    assert not CHEMICAL_NAMES_REGEX.search(spoken), f"Chemical name found in output: {spoken}"
    assert "zero chemical dosages" in spoken.lower() or "non-chemical" in spoken.lower() or "safety policy" in spoken.lower()


def test_sanitize_agronomic_speech_direct():
    unsafe_text = "Spray 2.5 ml/L of Monocrotophos to guarantee 100% yield kill."
    sanitized = sanitize_agronomic_speech(unsafe_text)
    assert "Zero chemical dosages are prescribed per safety policy" in sanitized
    assert "Monocrotophos" not in sanitized
    assert "guarantee" not in sanitized
