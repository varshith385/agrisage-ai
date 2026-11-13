import asyncio
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.agents.advisory_agent import AdvisoryAgent
from backend.app.agents.base import BaseAgent
from backend.app.agents.conflict_rules import detect_and_resolve_conflicts
from backend.app.agents.disease_agent import DiseaseAgent
from backend.app.agents.irrigation_agent import IrrigationAgent
from backend.app.agents.orchestrator import Orchestrator
from backend.app.agents.schemas import WeatherReport
from backend.app.agents.weather_agent import WeatherAgent
from backend.app.agents.yield_agent import YieldAgent
from backend.app.models.agent_run import AgentRun
from backend.app.models.farm import Farm, IrrigationMethod, OwnershipType, CurrentCropCycle, CropStage
from backend.app.models.user import User, UserRole, Language
from backend.app.schemas.envelope import AgentEnvelope
from backend.app.security.auth import hash_password, create_access_token


@pytest.fixture
def test_farm(db_session: Session, demo_farmer: User) -> Farm:
    farm = Farm(
        user_id=demo_farmer.id,
        name="Ramesh Nalgonda Farm",
        area=4.5,
        ownership_type=OwnershipType.OWNED,
        owned_area=4.5,
        leased_area=0.0,
        lease_amount=0.0,
        soil_type="Black Cotton",
        water_source="Borewell",
        irrigation_method=IrrigationMethod.SPRINKLER,
        budget=50000.0,
        village="Miryalaguda",
        district="Nalgonda",
        state="Telangana",
        latitude=16.87,
        longitude=79.56,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    crop = CurrentCropCycle(
        farm_id=farm.id,
        crop_name="Cotton",
        variety="BT Cotton",
        planting_date=date(2026, 6, 15),
        current_stage=CropStage.VEGETATIVE,
        is_active=True,
    )
    db_session.add(crop)
    db_session.commit()
    return farm


@pytest.fixture
def other_farmer(db_session: Session) -> User:
    user = User(
        email="other@agrisage.demo",
        hashed_password=hash_password("OtherFarmer@2026"),
        full_name="Other Farmer",
        role=UserRole.FARMER,
        preferred_language=Language.EN,
        is_active=True,
        is_demo_account=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_farmer_headers(other_farmer: User) -> dict:
    token = create_access_token({"sub": str(other_farmer.id), "role": other_farmer.role.value})
    return {"Authorization": f"Bearer {token}"}


class SlowAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="SlowAgent", timeout_seconds=0.1)

    async def _execute(self, context):
        await asyncio.sleep(0.5)
        return AgentEnvelope(
            agent_name=self.name,
            status="success",
            timestamp=datetime.now(),
            inputs_used={},
            outputs={"result": "too late"},
            confidence=1.0,
        )


class CrashingAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="CrashingAgent", timeout_seconds=2.0)

    async def _execute(self, context):
        raise RuntimeError("Severe ML inference failure in worker thread")


def test_stubs_return_no_invented_numbers(db_session: Session, test_farm: Farm):
    """
    Directly assert that all 4 non-weather stubs return null/None for every numeric prediction
    field, with status 'stub' and message 'not implemented yet'.
    """
    context = {
        "weather_report": {
            "temperature_c": 32.0,
            "relative_humidity_pct": 75.0,
            "expected_rainfall_today_mm": 5.0,
            "rain_forecast_24h_mm": 5.0,
            "rain_forecast_48h_mm": 10.0,
            "reference_et0_mm": 4.5,
            "wind_speed_kmh": 12.0,
            "stale": False,
        },
        "weather_status": "success",
        "irrigation_method": "drip",
        "image_path": None,
    }

    # 1. IrrigationAgent
    irrig_agent = IrrigationAgent()
    irrig_env = asyncio.run(irrig_agent.run(context))
    assert irrig_env.status == "success"
    irrig_out = irrig_env.outputs
    assert irrig_out["status"] == "stub"
    assert irrig_out["message"] == "not implemented yet"
    assert irrig_out["water_depth_mm"] is None
    assert irrig_out["litres_needed"] is None
    assert irrig_out["litres_saved"] is None
    assert irrig_out["irrigate"] is None
    assert irrig_out["recommendation_text"] is None
    assert irrig_out["confidence"] == 0.0

    # 2. DiseaseAgent
    disease_agent = DiseaseAgent()
    disease_env = asyncio.run(disease_agent.run(context))
    assert disease_env.status == "success"
    disease_out = disease_env.outputs
    assert disease_out["status"] == "stub"
    assert disease_out["message"] == "not implemented yet"
    assert disease_out["detected_disease"] is None
    assert disease_out["risk_level"] is None
    assert disease_out["confidence"] == 0.0
    assert disease_out["image_provided"] is False

    # 3. YieldAgent
    yield_agent = YieldAgent()
    yield_env = asyncio.run(yield_agent.run(context))
    assert yield_env.status == "success"
    yield_out = yield_env.outputs
    assert yield_out["status"] == "stub"
    assert yield_out["message"] == "not implemented yet"
    assert yield_out["expected_yield_quintals_per_acre"] is None
    assert yield_out["yield_range_lower"] is None
    assert yield_out["yield_range_upper"] is None
    assert yield_out["confidence"] == 0.0

    # 4. AdvisoryAgent
    advisory_agent = AdvisoryAgent()
    adv_context = {
        "weather_report": context["weather_report"],
        "weather_status": "success",
        "irrigation_plan": irrig_out,
        "disease_finding": disease_out,
        "yield_estimate": yield_out,
        "conflicts": [],
    }
    adv_env = asyncio.run(advisory_agent.run(adv_context))
    assert adv_env.status == "success"
    adv_out = adv_env.outputs
    assert adv_out["status"] in ("WORKING", "PARTIAL")
    # Health score is None because upstream stubs provide fewer than 3 active components (no invented scores)
    assert adv_out["farm_health_score"] is None
    assert len(adv_out["explainable_cards"]) >= 1


def test_base_agent_timeout_isolation():
    """Verify that an agent timeout does not raise an exception and records status='failed'."""
    agent = SlowAgent()
    envelope = asyncio.run(agent.run({"sample": "data"}))
    assert envelope.status == "failed"
    assert "timed out" in envelope.outputs.get("error", "").lower()
    assert envelope.confidence == 0.0
    assert len(envelope.warnings) > 0


def test_base_agent_failure_isolation():
    """Verify that an agent exception does not raise and records status='failed'."""
    agent = CrashingAgent()
    envelope = asyncio.run(agent.run({"sample": "data"}))
    assert envelope.status == "failed"
    assert "inference failure" in envelope.outputs.get("error", "").lower()
    assert envelope.confidence == 0.0


def test_conflict_detection_rain_and_fungal():
    """Verify Rule 1 (rain skip >= 15mm) and Rule 2 (humidity >= 80% + sprinkler/overhead)."""
    # Test case 1: Rain conflict triggered
    weather_rainy = {
        "rain_forecast_24h_mm": 18.5,
        "relative_humidity_pct": 70.0,
    }
    conflicts_rain = detect_and_resolve_conflicts(
        weather_report=weather_rainy,
        irrigation_plan={},
        disease_finding={},
        farm_context={"irrigation_method": "drip"},
    )
    assert len(conflicts_rain) == 1
    assert conflicts_rain[0].agent_a == "IrrigationAgent"
    assert conflicts_rain[0].agent_b == "WeatherAgent"
    assert "18.5 mm rain" in conflicts_rain[0].issue
    assert "Defer scheduled irrigation" in conflicts_rain[0].resolution
    assert conflicts_rain[0].rule_type == "rule_based"

    # Test case 2: Fungal humidity conflict triggered (high humidity + sprinkler)
    weather_humid = {
        "rain_forecast_24h_mm": 5.0,
        "relative_humidity_pct": 88.0,
    }
    conflicts_humid = detect_and_resolve_conflicts(
        weather_report=weather_humid,
        irrigation_plan={},
        disease_finding={},
        farm_context={"irrigation_method": "sprinkler"},
    )
    assert len(conflicts_humid) == 1
    assert conflicts_humid[0].agent_a == "DiseaseAgent"
    assert conflicts_humid[0].agent_b == "IrrigationAgent"
    assert "88.0%" in conflicts_humid[0].issue
    assert "Recommendation" in conflicts_humid[0].resolution
    assert conflicts_humid[0].rule_type == "heuristic"

    # Test case 3: Both triggered
    weather_both = {
        "rain_forecast_24h_mm": 20.0,
        "relative_humidity_pct": 85.0,
    }
    conflicts_both = detect_and_resolve_conflicts(
        weather_report=weather_both,
        irrigation_plan={},
        disease_finding={},
        farm_context={"irrigation_method": "overhead"},
    )
    assert len(conflicts_both) == 2


def test_orchestrator_pipeline_flow_and_persistence(client: TestClient, farmer_headers: dict, test_farm: Farm, db_session: Session):
    """
    Test full orchestrator pipeline via POST /api/v1/agents/run:
    - Verifies handoffs
    - Verifies shared run_id in database
    - Verifies no invented numbers in returned advisory_plan
    """
    mock_weather_output = {
        "temperature_c": 31.5,
        "relative_humidity_pct": 82.0,
        "expected_rainfall_today_mm": 2.0,
        "rain_forecast_24h_mm": 16.5,
        "rain_forecast_48h_mm": 22.0,
        "reference_et0_mm": 4.8,
        "wind_speed_kmh": 14.0,
        "stale": False,
        "source": "Open-Meteo Global Meteorological Forecast",
        "fetched_at": "2026-11-13T00:00:00Z",
        "status": "WORKING",
    }

    with patch.object(
        WeatherAgent,
        "_execute",
        new=AsyncMock(
            return_value=AgentEnvelope(
                agent_name="WeatherAgent",
                status="success",
                timestamp=datetime.now(),
                inputs_used={"lat": 16.87, "lon": 79.56},
                outputs=mock_weather_output,
                confidence=0.92,
            )
        ),
    ):
        resp = client.post(
            "/api/v1/agents/run",
            json={"farm_id": test_farm.id},
            headers=farmer_headers,
        )

    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["farm_id"] == test_farm.id
    run_id = data["run_id"]
    assert len(run_id) >= 32

    # Check handoffs exist and match spec format
    handoffs = data["handoffs"]
    assert len(handoffs) >= 4
    messages = [h["message"] for h in handoffs]
    assert any("Weather agent passed rain_in_48h=" in m for m in messages)
    assert any("Weather agent passed humidity=" in m for m in messages)
    assert any("Irrigation agent passed water sufficiency plan" in m for m in messages)

    # Check conflicts were detected: rain is 16.5mm (>=15mm) and humidity 82% (>=80%) with sprinkler
    conflicts = data["conflicts"]
    assert len(conflicts) >= 2

    # Check advisory plan returned adheres strictly to Honesty rules (no invented numbers)
    adv = data["advisory_plan"]
    assert adv["status"] in ("WORKING", "PARTIAL")
    assert adv["farm_health_score"] is not None
    assert len(adv["seven_day_plan"]) == 7

    # Verify persistence: check rows in db sharing the exact run_id
    rows = db_session.query(AgentRun).filter(AgentRun.run_id == run_id).all()
    agent_names = {r.agent_name for r in rows}
    assert "WeatherAgent" in agent_names
    assert "IrrigationAgent" in agent_names
    assert "DiseaseAgent" in agent_names
    assert "YieldAgent" in agent_names
    assert "AdvisoryAgent" in agent_names
    assert "orchestrator" in agent_names


def test_farm_ownership_authorization(client: TestClient, test_farm: Farm, other_farmer_headers: dict):
    """
    Test access controls:
    - 401 on unauthenticated call
    - 403 when User B tries to run agent or read logs for Farm of User A
    - 404 for non-existent farm
    """
    # 1. Unauthenticated request
    unauth_resp = client.post("/api/v1/agents/run", json={"farm_id": test_farm.id})
    assert unauth_resp.status_code == 401

    # 2. Authenticated as other user -> 403 Forbidden
    forbidden_resp = client.post(
        "/api/v1/agents/run",
        json={"farm_id": test_farm.id},
        headers=other_farmer_headers,
    )
    assert forbidden_resp.status_code == 403
    assert "forbidden" in forbidden_resp.json()["detail"].lower()

    # 3. Non-existent farm -> 404 Not Found
    not_found_resp = client.post(
        "/api/v1/agents/run",
        json={"farm_id": 999999},
        headers=other_farmer_headers,
    )
    assert not_found_resp.status_code == 404

    # 4. Listing runs for other user's farm -> 403
    list_forbidden = client.get(
        f"/api/v1/agents/runs?farm_id={test_farm.id}",
        headers=other_farmer_headers,
    )
    assert list_forbidden.status_code == 403


def test_agent_runs_list_and_detail(client: TestClient, farmer_headers: dict, other_farmer_headers: dict, test_farm: Farm, db_session: Session):
    """Test GET /api/v1/agents/runs and GET /api/v1/agents/runs/{run_id}."""
    run_record = AgentRun(
        run_id="test-uuid-12345",
        farm_id=test_farm.id,
        agent_name="WeatherAgent",
        trigger_type="orchestrator",
        status="success",
        duration_ms=120,
        inputs_json='{"lat": 16.87}',
        outputs_json='{"temp": 30.5}',
        warnings_json='["test warning"]',
    )
    db_session.add(run_record)
    db_session.commit()

    # List runs
    resp = client.get(f"/api/v1/agents/runs?farm_id={test_farm.id}", headers=farmer_headers)
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) >= 1
    assert runs[0]["run_id"] == "test-uuid-12345"
    assert runs[0]["agent_name"] == "WeatherAgent"
    assert runs[0]["duration_ms"] == 120
    assert runs[0]["inputs"]["lat"] == 16.87

    # Run detail by run_id
    detail_resp = client.get("/api/v1/agents/runs/test-uuid-12345", headers=farmer_headers)
    assert detail_resp.status_code == 200
    details = detail_resp.json()
    assert len(details) == 1
    assert details[0]["run_id"] == "test-uuid-12345"

    # Detail access control: other user -> 403
    other_detail_resp = client.get("/api/v1/agents/runs/test-uuid-12345", headers=other_farmer_headers)
    assert other_detail_resp.status_code == 403


def test_stale_weather_propagation(client: TestClient, farmer_headers: dict, test_farm: Farm):
    """
    Verify that when weather is marked stale, downstream agents are marked degraded
    and do not fabricate substitute numbers.
    """
    mock_stale_weather = {
        "temperature_c": 28.0,
        "relative_humidity_pct": 82.0,
        "expected_rainfall_today_mm": 0.0,
        "rain_forecast_24h_mm": 0.0,
        "rain_forecast_48h_mm": 0.0,
        "reference_et0_mm": 4.0,
        "wind_speed_kmh": 10.0,
        "stale": True,
        "source": "Open-Meteo Cache (Offline Fallback)",
        "fetched_at": "2026-11-12T12:00:00Z",
        "status": "PARTIAL",
    }

    with patch.object(
        WeatherAgent,
        "_execute",
        new=AsyncMock(
            return_value=AgentEnvelope(
                agent_name="WeatherAgent",
                status="degraded",
                timestamp=datetime.now(timezone.utc),
                inputs_used={"lat": 16.87, "lon": 79.56},
                outputs=mock_stale_weather,
                confidence=0.5,
                warnings=["Weather data is served from stale offline cache."],
            )
        ),
    ):
        resp = client.post(
            "/api/v1/agents/run",
            json={"farm_id": test_farm.id},
            headers=farmer_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "degraded"
    envelopes = data["envelopes"]
    assert envelopes["WeatherAgent"]["status"] == "degraded"
    assert envelopes["IrrigationAgent"]["status"] == "degraded"
    assert envelopes["DiseaseAgent"]["status"] == "degraded"
    assert envelopes["YieldAgent"]["status"] == "degraded"
    assert envelopes["AdvisoryAgent"]["status"] == "degraded"


def test_weather_failure_isolation(client: TestClient, farmer_headers: dict, test_farm: Farm):
    """
    Verify that when WeatherAgent fails, the orchestrator does NOT crash.
    Downstream agents handle the failure gracefully with degraded statuses.
    """
    with patch.object(
        WeatherAgent,
        "_execute",
        new=AsyncMock(
            return_value=AgentEnvelope(
                agent_name="WeatherAgent",
                status="failed",
                timestamp=datetime.now(timezone.utc),
                inputs_used={"lat": 16.87, "lon": 79.56},
                outputs={"error": "503 Service Unavailable: Open-Meteo endpoint unreachable"},
                confidence=0.0,
                warnings=["Upstream meteorological service offline."],
            )
        ),
    ):
        resp = client.post(
            "/api/v1/agents/run",
            json={"farm_id": test_farm.id},
            headers=farmer_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["failed", "degraded"]
    envelopes = data["envelopes"]
    assert envelopes["WeatherAgent"]["status"] == "failed"
    assert envelopes["IrrigationAgent"]["status"] == "degraded"
    assert envelopes["DiseaseAgent"]["status"] == "degraded"


def test_partial_run_no_image(client: TestClient, farmer_headers: dict, test_farm: Farm):
    """
    Verify that when no disease image is provided, DiseaseAgent runs in partial mode
    with image_provided=False, and no failure occurs.
    """
    mock_weather = {
        "temperature_c": 30.0,
        "relative_humidity_pct": 60.0,
        "expected_rainfall_today_mm": 0.0,
        "rain_forecast_24h_mm": 0.0,
        "rain_forecast_48h_mm": 0.0,
        "reference_et0_mm": 4.5,
        "wind_speed_kmh": 12.0,
        "stale": False,
        "source": "Open-Meteo Global Meteorological Forecast",
        "fetched_at": "2026-11-13T00:00:00Z",
        "status": "WORKING",
    }

    with patch.object(
        WeatherAgent,
        "_execute",
        new=AsyncMock(
            return_value=AgentEnvelope(
                agent_name="WeatherAgent",
                status="success",
                timestamp=datetime.now(timezone.utc),
                inputs_used={},
                outputs=mock_weather,
                confidence=0.9,
            )
        ),
    ):
        resp = client.post(
            "/api/v1/agents/run",
            json={"farm_id": test_farm.id, "image_path": None},
            headers=farmer_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    disease_env = data["envelopes"]["DiseaseAgent"]
    assert disease_env["outputs"]["image_provided"] is False
    assert any("partial mode" in w.lower() for w in disease_env["warnings"])

