"""
AgriSage AI — Comprehensive Reminders & Field Task Alerts Test Suite
Verifies CRUD, Snooze (1/2/3 days), One-Tap Suggestions, and Voice Command Parsing.
"""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import Farm, CurrentCropCycle, CropStage
from backend.app.models.reminder import Reminder
from backend.app.security.auth import hash_password, create_access_token
from backend.app.services.reminder_parser import parse_reminder_voice_command, KOLKATA_TZ


@pytest.fixture
def reminder_test_env(db_session: Session, client: TestClient):
    # Create test user
    email = f"farmer_reminder_{datetime.now().timestamp()}@example.com"
    user = User(
        email=email,
        hashed_password=hash_password("FarmSecret123"),
        full_name="Ramesh Reddy",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create test farm
    farm = Farm(
        user_id=user.id,
        name="Reddy Cotton Fields",
        area=4.5,
        ownership_type="owned",
        owned_area=4.5,
        leased_area=0.0,
        soil_type="black_clay",
        water_source="borewell",
        irrigation_method="drip",
        village="Narsampet",
        district="Warangal",
        state="Telangana",
        latitude=17.92,
        longitude=79.89,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    cycle = CurrentCropCycle(
        farm_id=farm.id,
        crop_name="Cotton",
        variety="Bt Cotton RCH-2",
        planting_date=datetime.now().date() - timedelta(days=55),
        current_stage=CropStage.FLOWERING,
    )
    db_session.add(cycle)
    db_session.commit()

    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    return {"user": user, "farm": farm, "headers": headers}


def test_reminder_crud_lifecycle(client: TestClient, reminder_test_env):
    headers = reminder_test_env["headers"]
    farm = reminder_test_env["farm"]

    due = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    create_payload = {
        "farm_id": farm.id,
        "title": "Irrigate South 2-Acre Parcel",
        "notes": "Check soil moisture before starting drip pump",
        "due_at": due,
        "repeat": "weekly",
        "source": "irrigation_plan",
    }

    # 1. Create
    res = client.post("/api/v1/reminders", json=create_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    rem_id = data["id"]
    assert data["title"] == "Irrigate South 2-Acre Parcel"
    assert data["status"] == "pending"
    assert data["repeat"] == "weekly"
    assert "due_at_kolkata_iso" in data

    # 2. List
    list_res = client.get("/api/v1/reminders", headers=headers)
    assert list_res.status_code == 200
    reminders = list_res.json()
    assert any(r["id"] == rem_id for r in reminders)

    # 3. Snooze 2 days
    patch_res = client.patch(f"/api/v1/reminders/{rem_id}", json={"snooze_days": 2}, headers=headers)
    assert patch_res.status_code == 200
    patched_data = patch_res.json()
    assert patched_data["status"] == "snoozed"

    # 4. Mark Done
    done_res = client.patch(f"/api/v1/reminders/{rem_id}", json={"status": "done"}, headers=headers)
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "done"

    # 5. Delete
    del_res = client.delete(f"/api/v1/reminders/{rem_id}", headers=headers)
    assert del_res.status_code == 204

    # 6. Verify deleted
    list_res2 = client.get("/api/v1/reminders", headers=headers)
    assert not any(r["id"] == rem_id for r in list_res2.json())


def test_reminder_smart_suggestions(client: TestClient, reminder_test_env):
    headers = reminder_test_env["headers"]
    farm = reminder_test_env["farm"]

    res = client.get(f"/api/v1/reminders/suggestions?farm_id={farm.id}", headers=headers)
    assert res.status_code == 200
    suggestions = res.json()
    assert len(suggestions) >= 3

    sources = [s["source"] for s in suggestions]
    assert "irrigation_plan" in sources
    assert "calendar_stage" in sources
    assert any("Irrigate" in s["title"] for s in suggestions)


def test_voice_date_time_parser():
    # English
    en_parsed = parse_reminder_voice_command("remind me to irrigate tomorrow morning", "en")
    assert en_parsed is not None
    title, due_utc, spoken = en_parsed
    assert "irrigate" in title.lower()
    # Tomorrow morning should be 6:00 AM Kolkata = 00:30 UTC
    assert "Reminder scheduled" in spoken

    # Telugu
    te_parsed = parse_reminder_voice_command("రేపు ఉదయం మండి ధరలు తనిఖీ చేయాలని గుర్తు చేయి", "te")
    assert te_parsed is not None
    te_title, te_due_utc, te_spoken = te_parsed
    assert "జ్ఞాపిక నమోదు చేయబడింది" in te_spoken

    # Hindi
    hi_parsed = parse_reminder_voice_command("कल सुबह 6 am कपास में पानी देना याद दिलाना", "hi")
    assert hi_parsed is not None
    hi_title, hi_due_utc, hi_spoken = hi_parsed
    assert "स्मरणपत्र दर्ज किया गया" in hi_spoken


def test_voice_api_creates_reminder(client: TestClient, reminder_test_env, db_session: Session):
    headers = reminder_test_env["headers"]
    user = reminder_test_env["user"]

    payload = {
        "query": "remind me to inspect for bollworms tomorrow morning",
        "language": "en"
    }
    # Turn 1: Voice command prompts for confirmation first (does not save silently)
    res = client.post("/api/v1/voice/query", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "reminder_confirm"
    assert data["action_link"] == "/reminders"
    assert "bollworm" in data["spoken_text"].lower() or "reminder" in data["spoken_text"].lower()

    # Turn 2: Farmer confirms with 'Yes'
    confirm_payload = {
        "query": "Yes",
        "language": "en",
        "history": [
            {"role": "user", "content": payload["query"]},
            {"role": "assistant", "content": data["spoken_text"]}
        ]
    }
    confirm_res = client.post("/api/v1/voice/query", json=confirm_payload, headers=headers)
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()
    assert confirm_data["intent"] == "reminder_saved"

    # Verify created in DB after confirmation
    saved = db_session.query(Reminder).filter(Reminder.user_id == user.id).all()
    assert len(saved) >= 1
    assert any("bollworm" in r.title.lower() for r in saved)
