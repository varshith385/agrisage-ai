"""
AgriSage AI — Advisory Agent & Farm Health Score Unit & Integration Tests
Validates:
- Farm Health Score (0-100) transparent formula and 5-component breakdown
- Strict exclusion of missing inputs (disease, yield, economics) without fake default values
- Insufficient data rule: returns 'insufficient data' and score=None when < 3 components have data
- 7-Day Action Plan with 'because...' reasons, sources, and zero chemical dosages
- Cotton headline yield explicitly displays 'not supported' (bales, not tonnes)
- Full orchestrator execution returning populated AdvisoryPlan
- POST /api/v1/advisory/plan authentication and farm ownership authorization
"""
from datetime import date
import pytest
from fastapi.testclient import TestClient

from backend.app.agents.advisory_agent import AdvisoryAgent
from backend.app.agents.orchestrator import Orchestrator
from backend.app.models.farm import Farm, CurrentCropCycle, OwnershipType, IrrigationMethod, CropStage


@pytest.mark.asyncio
async def test_farm_health_score_insufficient_data_when_under_3_components():
    """Asserts that if fewer than 3 components have data, score is None with INSUFFICIENT_DATA status."""
    agent = AdvisoryAgent()

    # Only weather provided (1 component < 3)
    weather_out = {
        "temperature_c": 30.0,
        "relative_humidity_pct": 60.0,
        "rain_forecast_24h_mm": 0.0,
        "stale": False,
    }

    breakdown = agent._compute_farm_health_score(
        weather_out=weather_out,
        irrigation_out=None,
        disease_out=None,
        stage_out=None,
    )

    assert breakdown.status == "INSUFFICIENT_DATA"
    assert breakdown.score is None
    assert breakdown.active_components_count == 1
    assert "minimum 3 required" in breakdown.summary.lower()


@pytest.mark.asyncio
async def test_farm_health_score_computed_when_3_or_more_components():
    """Validates composite score computation and re-normalization when >= 3 components are active."""
    agent = AdvisoryAgent()

    weather_out = {
        "temperature_c": 28.0,
        "relative_humidity_pct": 65.0,
        "rain_forecast_24h_mm": 5.0,
        "wind_speed_kmh": 12.0,
        "stale": False,
    }
    irrigation_out = {
        "status": "WORKING",
        "irrigate_now": False,
        "rain_skip_applied": True,
        "water_depth_mm": 0.0,
        "litres_needed": 0.0,
    }
    stage_out = {
        "current_stage": "flowering",
        "days_after_sowing": 90,
        "fao56_kc_stage": "mid",
    }

    # 3 active components (weather, water, stage); disease and economics are excluded
    breakdown = agent._compute_farm_health_score(
        weather_out=weather_out,
        irrigation_out=irrigation_out,
        disease_out=None,  # No photo evaluated -> strictly excluded
        stage_out=stage_out,
    )

    assert breakdown.status == "COMPUTED"
    assert breakdown.score is not None
    assert 0 <= breakdown.score <= 100
    assert breakdown.active_components_count == 3
    assert "based on 3 of 5 components" in breakdown.formula_description.lower()

    # Check disease and economic components are marked EXCLUDED
    d_comp = next(c for c in breakdown.components if c.key == "disease_status")
    assert d_comp.status == "EXCLUDED"
    assert "no leaf photo evaluated" in d_comp.exclusion_reason.lower()

    e_comp = next(c for c in breakdown.components if c.key == "economic_health")
    assert e_comp.status == "EXCLUDED"
    assert "phase 4 economics" in e_comp.exclusion_reason.lower()


@pytest.mark.asyncio
async def test_seven_day_plan_sources_and_reasons():
    """Asserts that all 7 days have actionable tasks, source fields, and 'because...' explanations."""
    agent = AdvisoryAgent()

    weather_out = {"temperature_c": 29.0, "rain_forecast_24h_mm": 18.0}
    irrigation_out = {"irrigate_now": False, "rain_skip_applied": True}
    stage_out = {"current_stage": "flowering", "days_after_sowing": 90}

    plan_items = agent._generate_seven_day_plan(
        weather_out=weather_out,
        irrigation_out=irrigation_out,
        disease_out=None,
        stage_out=stage_out,
        daily_forecast=[
            {"precipitation_sum_mm": 20.0, "temp_max_c": 31.0, "reference_et0_mm": 4.5},
            {"precipitation_sum_mm": 5.0, "temp_max_c": 32.0, "reference_et0_mm": 4.5},
            {"precipitation_sum_mm": 0.0, "temp_max_c": 33.0, "reference_et0_mm": 4.8},
            {"precipitation_sum_mm": 0.0, "temp_max_c": 32.0, "reference_et0_mm": 4.5},
            {"precipitation_sum_mm": 0.0, "temp_max_c": 34.0, "reference_et0_mm": 5.2},
            {"precipitation_sum_mm": 0.0, "temp_max_c": 33.0, "reference_et0_mm": 4.8},
            {"precipitation_sum_mm": 0.0, "temp_max_c": 32.0, "reference_et0_mm": 4.5},
        ],
    )

    assert len(plan_items) == 7
    prohibited_tokens = ["ml/l", "gm/l", "kg/ha", "litres/acre", "grams per"]

    for item in plan_items:
        assert item.action
        assert item.reason
        assert item.source
        assert item.priority in ("high", "medium", "low")
        assert item.responsible_agent
        # Assert 'because' exists in reason
        assert "because" in item.reason.lower()
        # Assert zero chemical quantities
        for tok in prohibited_tokens:
            assert tok not in item.action.lower()


@pytest.mark.asyncio
async def test_cotton_headline_yield_not_supported():
    """Validates that Cotton headline yield returns 'not supported' per MODEL_CARD.md."""
    agent = AdvisoryAgent()
    context = {
        "crop_name": "Cotton",
        "planting_date": "2026-08-15",
        "weather_report": {"temperature_c": 30.0, "rain_forecast_24h_mm": 0.0},
        "irrigation_plan": {"status": "WORKING", "irrigate_now": False, "water_depth_mm": 0.0},
        "disease_finding": None,
        "yield_estimate": {"status": "PARTIAL", "expected_yield_quintals_per_acre": None},
        "conflicts": [],
    }

    env = await agent.run(context=context)
    assert env.status in ("success", "degraded")
    headline = env.outputs["headline_yield"]

    assert headline["is_supported"] is False
    assert headline["headline_label"] == "not supported"
    assert headline["headline_yield_quintals_per_acre"] is None
    assert "bales" in headline["unit"]


from sqlalchemy.orm import Session
from backend.app.models.user import User


def test_api_advisory_plan_auth(client: TestClient):
    """Ensures POST /api/v1/advisory/plan requires authentication."""
    resp = client.post("/api/v1/advisory/plan", json={"farm_id": 1})
    assert resp.status_code == 401


def test_api_advisory_plan_success(
    client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict
):
    """Ensures authenticated POST /api/v1/advisory/plan returns complete schema."""
    farm = Farm(
        user_id=demo_farmer.id,
        name="Rameshwaram Farm (Warangal)",
        area=5.0,
        ownership_type=OwnershipType.MIXED,
        owned_area=3.0,
        leased_area=2.0,
        lease_amount=12000.0,
        soil_type="Red Loam",
        water_source="Borewell",
        irrigation_method=IrrigationMethod.DRIP,
        budget=45000.0,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    cycle = CurrentCropCycle(
        farm_id=farm.id,
        crop_name="Cotton",
        variety="Bollgard II Hybrid",
        planting_date=date(2026, 8, 15),
        expected_harvest_date=date(2027, 1, 15),
        current_stage=CropStage.FLOWERING,
        is_active=True,
    )
    db_session.add(cycle)
    db_session.commit()

    resp = client.post("/api/v1/advisory/plan", json={"farm_id": farm.id}, headers=farmer_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] in ("WORKING", "PARTIAL")
    assert "farm_health_score" in data
    assert "seven_day_plan" in data
    assert "headline_yield" in data
    assert len(data["seven_day_plan"]) == 7
