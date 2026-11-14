"""
Tests for Phase C: Smart Chatbot, Context Packet, Grounded LLM, and Intent Router
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.database.session import Base, SessionLocal, engine
from backend.app.main import app
from backend.app.models.farm import CropStage, CurrentCropCycle, Farm, IrrigationMethod, OwnershipType
from backend.app.models.user import Language, User, UserRole
from backend.app.security.auth import create_access_token, hash_password
from backend.app.services.context_packet import build_farm_context_packet, format_context_for_prompt
from backend.app.services.intent_router import route_navigation_or_action, route_smalltalk


@pytest.fixture(scope="module")
def setup_chatbot_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    email = "chatbot_tester@agrisage.internal"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("Pass@12345"),
            full_name="Chatbot Tester Farmer",
            phone_number="9876543299",
            role=UserRole.FARMER,
            preferred_language=Language.EN,
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
            name="Chatbot Verified Farm",
            area=6.0,
            ownership_type=OwnershipType.OWNED,
            owned_area=6.0,
            leased_area=0.0,
            lease_amount=0.0,
            soil_type="Black Cotton",
            water_source="borewell",
            irrigation_method=IrrigationMethod.DRIP,
            budget=250000.0,
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
    yield {"user": user, "farm": farm, "token": token, "db": db}
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


# 1. Deterministic Intent & Navigation Router Tests
def test_intent_router_navigation():
    # English Navigation
    res = route_navigation_or_action("open irrigation", "en")
    assert res is not None
    assert res.intent == "navigation"
    assert res.action_link == "/irrigation"
    assert "Opening Irrigation" in res.confirmation_chip

    # Telugu Navigation
    res_te = route_navigation_or_action("వాతావరణం చూపించు", "te")
    assert res_te is not None
    assert res_te.action_link == "/setup"
    assert "Opening Weather" in res_te.confirmation_chip

    # Hindi Navigation
    res_hi = route_navigation_or_action("मंडी खोलो", "hi")
    assert res_hi is not None
    assert res_hi.action_link == "/market"
    assert "Opening Mandi Market" in res_hi.confirmation_chip

    # Action: Dark Mode
    res_dm = route_navigation_or_action("turn on dark mode", "en")
    assert res_dm is not None
    assert res_dm.action_type == "set_theme:dark"

    # Action: Switch Language
    res_lang = route_navigation_or_action("switch to Telugu", "en")
    assert res_lang is not None
    assert res_lang.action_type == "set_lang:te"

    # Action: Start Guided Tour
    res_tour = route_navigation_or_action("start the tour", "en")
    assert res_tour is not None
    assert res_tour.action_type == "start_tour"


# 2. Conversational Small Talk Tests (no lazy 'I don't know' for 'okay')
def test_smalltalk_router():
    # "okay" / "ok"
    res_ok = route_smalltalk("okay", "en")
    assert res_ok is not None
    assert res_ok.intent == "smalltalk"
    assert "Glad to help" in res_ok.spoken_text
    assert "I don't know" not in res_ok.spoken_text

    # Telugu "సరే"
    res_te = route_smalltalk("సరే", "te")
    assert res_te is not None
    assert "సంతోషం" in res_te.spoken_text

    # "who are you"
    res_who = route_smalltalk("who are you", "en")
    assert res_who is not None
    assert res_who.intent == "about"
    assert "Grow2Gain" in res_who.spoken_text

    # "help"
    res_help = route_smalltalk("help", "en")
    assert res_help is not None
    assert res_help.intent == "help"
    assert "weather" in res_help.spoken_text.lower()


# 3. Real Context Packet Grounding Tests
@pytest.mark.asyncio
async def test_context_packet_grounding(setup_chatbot_db):
    user = setup_chatbot_db["user"]
    farm = setup_chatbot_db["farm"]
    db = setup_chatbot_db["db"]

    packet = await build_farm_context_packet(user, farm, db)

    # Check that real farm fields are present and tagged
    assert packet["farm_profile"]["status"] == "LIVE"
    assert packet["farm_profile"]["name"] == "Chatbot Verified Farm"
    assert packet["farm_profile"]["area_acres"] == 6.0
    assert packet["farm_profile"]["soil_type"] == "Black Cotton"
    assert packet["farm_profile"]["crop"] == "Cotton"

    # Weather marked LIVE
    assert packet["weather"]["status"] == "LIVE"
    assert "temperature_c" in packet["weather"]

    # Irrigation marked LIVE
    assert packet["irrigation"]["status"] == "LIVE"
    assert "irrigate_now" in packet["irrigation"]
    assert "recommended_depth_mm" in packet["irrigation"]

    # Mandi market marked DEMO DATA
    assert packet["market"]["status"] == "DEMO DATA"

    # Format text prompt
    prompt_str = format_context_for_prompt(packet)
    assert "REAL FARM CONTEXT PACKET" in prompt_str
    assert "Chatbot Verified Farm" in prompt_str
    assert "DEMO DATA" in prompt_str


# 4. Mocked Grounded LLM Response Test
@pytest.mark.asyncio
async def test_grounded_llm_with_mock(client, setup_chatbot_db, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "fake_test_gemini_api_key_123")
    monkeypatch.setattr(settings, "GROQ_API_KEY", "")
    headers = {"Authorization": f"Bearer {setup_chatbot_db['token']}"}

    mock_llm_json = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Based on your Warangal farm telemetry, soil moisture is adequate today. No irrigation is needed."}
                    ]
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_llm_json

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        payload = {
            "query": "Should I irrigate my cotton field today?",
            "language": "en",
            "history": [
                {"role": "user", "content": "Hello AgriSage"},
                {"role": "assistant", "content": "Hello farmer!"}
            ]
        }
        res = client.post("/api/v1/voice/query", json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["mode"] == "ai"
        assert data["upstream_status"] == "AI connected (Gemini)"
        assert "adequate" in data["spoken_text"]
        assert data["privacy_notice"] is not None

        # Confirm context packet was included in prompt sent to Gemini
        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        sent_payload = call_kwargs.get("json", {})
        parts = sent_payload["contents"][-1]["parts"][0]["text"]
        assert "REAL FARM CONTEXT PACKET" in parts
        assert "Chatbot Verified Farm" in parts


# 5. Basic Mode when No Key is Set
def test_no_key_fallback_mode_chip(client, setup_chatbot_db, monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "GROQ_API_KEY", "")
    headers = {"Authorization": f"Bearer {setup_chatbot_db['token']}"}

    payload = {"query": "What is the rain forecast today?", "language": "en"}
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "basic"
    assert "Basic mode" in data["upstream_status"]
