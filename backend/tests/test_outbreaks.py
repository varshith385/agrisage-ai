from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.database.session import utc_now
from backend.app.models.user import User
from backend.app.models.farm import Farm, OwnershipType
from backend.app.models.disease_prediction import DiseasePrediction


def test_outbreak_map_aggregation_and_privacy_threshold(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    # Register farm
    farm = Farm(
        user_id=demo_farmer.id,
        name="Outbreak Test Farm",
        area=5.0,
        ownership_type=OwnershipType.OWNED,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
    )
    db_session.add(farm)
    db_session.commit()

    now = utc_now()

    # 1. Geikonda: 4 reports of Tomato Early Blight (Meets threshold >= 3 -> MUST DISPLAY)
    for _ in range(4):
        db_session.add(
            DiseasePrediction(
                farm_id=farm.id,
                user_id=demo_farmer.id,
                crop_hint="Tomato",
                predicted_disease="Tomato___Early_blight",
                confidence=0.88,
                top3_json="[]",
                village="Geikonda",
                district="Warangal",
                state="Telangana",
                reported_to_outbreak=True,
                created_at=now - timedelta(days=2),
            )
        )

    # 2. Dharmasagar: 3 reports of Potato Early Blight (Meets threshold >= 3 -> MUST DISPLAY)
    for _ in range(3):
        db_session.add(
            DiseasePrediction(
                farm_id=farm.id,
                user_id=demo_farmer.id,
                crop_hint="Potato",
                predicted_disease="Potato___Early_blight",
                confidence=0.84,
                top3_json="[]",
                village="Dharmasagar",
                district="Warangal",
                state="Telangana",
                reported_to_outbreak=True,
                created_at=now - timedelta(days=3),
            )
        )

    # 3. Atmakur: 1 report of Bacterial Spot (Below threshold < 3 -> MUST BE SUPPRESSED)
    db_session.add(
        DiseasePrediction(
            farm_id=farm.id,
            user_id=demo_farmer.id,
            crop_hint="Chilli",
            predicted_disease="Pepper__bell___Bacterial_spot",
            confidence=0.75,
            top3_json="[]",
            village="Atmakur",
            district="Warangal",
            state="Telangana",
            reported_to_outbreak=True,
            created_at=now - timedelta(days=1),
        )
    )

    # 4. Inavolu: 2 reports of Tomato Early Blight (Below threshold < 3 -> MUST BE SUPPRESSED)
    for _ in range(2):
        db_session.add(
            DiseasePrediction(
                farm_id=farm.id,
                user_id=demo_farmer.id,
                crop_hint="Tomato",
                predicted_disease="Tomato___Early_blight",
                confidence=0.80,
                top3_json="[]",
                village="Inavolu",
                district="Warangal",
                state="Telangana",
                reported_to_outbreak=True,
                created_at=now - timedelta(days=4),
            )
        )

    db_session.commit()

    # Query Outbreak Map with default threshold of 3
    res = client.get("/api/v1/outbreaks/map?district=Warangal&days=14&min_threshold=3", headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()

    clusters = data["clusters"]
    villages_displayed = [c["village"] for c in clusters]

    # Geikonda and Dharmasagar MUST be visible
    assert "Geikonda" in villages_displayed
    assert "Dharmasagar" in villages_displayed

    # Atmakur (1 report) and Inavolu (2 reports) MUST NOT be visible
    assert "Atmakur" not in villages_displayed
    assert "Inavolu" not in villages_displayed

    # Verify summary counts
    assert data["summary"]["suppressed_clusters_count"] >= 2
    assert data["summary"]["privacy_guard_enforced"] is True


def test_outbreak_map_crop_filter(client: TestClient, farmer_headers: dict):
    res = client.get("/api/v1/outbreaks/map?district=Warangal&crop=Tomato", headers=farmer_headers)
    assert res.status_code == 200
    clusters = res.json()["clusters"]
    for c in clusters:
        assert "tomato" in c["crop"].lower() or "tomato" in c["predicted_disease"].lower()


@pytest.fixture
def expert_headers(db_session: Session) -> dict:
    from backend.app.models.user import UserRole, Language
    from backend.app.api.v1.auth import create_access_token, hash_password
    expert = User(
        email="test_expert@agrisage.demo",
        hashed_password=hash_password("ExpertDemo@2026"),
        full_name="Dr. Ananya Rao (Expert)",
        role=UserRole.EXPERT,
        preferred_language=Language.EN,
        is_active=True,
        is_demo_account=True,
    )
    db_session.add(expert)
    db_session.commit()
    db_session.refresh(expert)
    token = create_access_token({"sub": str(expert.id), "role": expert.role.value})
    return {"Authorization": f"Bearer {token}"}


def test_district_officer_summary_role_guards(client: TestClient, farmer_headers: dict, expert_headers: dict, admin_headers: dict):
    # 1. Farmer Ramesh must be rejected with HTTP 403 Forbidden
    farmer_res = client.get("/api/v1/outbreaks/district-summary?district=Warangal", headers=farmer_headers)
    assert farmer_res.status_code == 403
    assert "restricted to Expert and Admin" in farmer_res.json()["detail"]

    # 2. Expert must be granted access
    expert_res = client.get("/api/v1/outbreaks/district-summary?district=Warangal", headers=expert_headers)
    assert expert_res.status_code == 200
    expert_data = expert_res.json()
    assert expert_data["district"] == "Warangal"
    assert "disease_breakdown" in expert_data
    assert "weekly_trends" in expert_data
    assert "hotspot_villages" in expert_data
    assert "officer_action_advisories" in expert_data
    assert len(expert_data["officer_action_advisories"]) >= 1

    # 3. Admin must also be granted access
    admin_res = client.get("/api/v1/outbreaks/district-summary?district=Warangal", headers=admin_headers)
    assert admin_res.status_code == 200
