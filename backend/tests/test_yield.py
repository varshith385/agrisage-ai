"""
AgriSage AI — Yield Prediction Model & YieldAgent Unit & Integration Tests
Validates:
- Multi-quantile yield regressor inference (expected yield, 10-90% prediction intervals)
- Non-tonne crop exclusions (Coconut, Cotton, Jute, Mesta, Sannhamp)
- Telangana district name mapping (e.g. Hanamkonda -> Warangal)
- District fallback to state average with lower confidence
- Transparent heuristic adjustments labeled 'indicative assumption, no source'
- Missing artifact DEMO fallback with zero invented numbers
- Authorization checks on POST /api/v1/yield/predict
- YieldAgent execution within the orchestrator
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.app.ml.yield_model import YieldModelEngine, yield_model_engine
from backend.app.agents.yield_agent import YieldAgent


def test_yield_engine_point_and_interval_prediction():
    """Validates point prediction (q/acre) and 10-90% quantile prediction intervals for supported crops."""
    res = yield_model_engine.predict_yield(
        crop_name="Rice",
        state="Telangana",
        district="Warangal",
        season="Kharif",
        area_acres=2.5,
    )

    assert res["status"] == "WORKING"
    assert res["expected_yield_quintals_per_acre"] is not None
    assert res["yield_range_lower"] is not None
    assert res["yield_range_upper"] is not None
    assert res["yield_range_lower"] <= res["expected_yield_quintals_per_acre"] <= res["yield_range_upper"]
    assert res["expected_total_quintals"] == round(res["expected_yield_quintals_per_acre"] * 2.5, 1)
    assert res["explanation"]["confidence"] >= 0.70


def test_yield_engine_non_tonne_crop_exclusion():
    """Validates that crops measured in nuts or bales are excluded from metric yield regressor."""
    res_coconut = yield_model_engine.predict_yield(
        crop_name="Coconut",
        state="Telangana",
        district="Warangal",
        season="Whole Year",
    )
    assert res_coconut["status"] == "PARTIAL"
    assert res_coconut["expected_yield_quintals_per_acre"] is None
    assert "nuts or bales" in res_coconut["explanation"]["value"]

    res_cotton = yield_model_engine.predict_yield(
        crop_name="Cotton(lint)",
        state="Telangana",
        district="Warangal",
        season="Kharif",
    )
    assert res_cotton["status"] == "PARTIAL"
    assert res_cotton["expected_yield_quintals_per_acre"] is None
    assert "nuts or bales" in res_cotton["explanation"]["value"]


def test_yield_engine_telangana_district_mapping():
    """Validates that newly bifurcated Telangana districts are mapped to parent districts."""
    res = yield_model_engine.predict_yield(
        crop_name="Maize",
        state="Telangana",
        district="Hanamkonda",
        season="Kharif",
    )
    assert res["status"] == "WORKING"
    assert res["district"].lower() == "warangal"
    assert res["district_fallback_used"] is False


def test_yield_engine_unknown_district_fallback():
    """Validates that an unrecognized district falls back to state-level baseline with lower confidence."""
    res = yield_model_engine.predict_yield(
        crop_name="Maize",
        state="Telangana",
        district="NonExistentDistrictXYZ",
        season="Kharif",
    )
    assert res["status"] == "WORKING"
    assert res["district_fallback_used"] is True
    assert res["explanation"]["confidence"] <= 0.65
    assert "state-level baseline" in res["district_fallback_message"]


def test_yield_engine_heuristic_adjustments():
    """Validates visible heuristic adjustments with explicit 'indicative assumption, no source' labels."""
    baseline = yield_model_engine.predict_yield(
        crop_name="Rice",
        state="Telangana",
        district="Warangal",
        season="Kharif",
        fungal_disease_present=False,
        moisture_stress_present=False,
    )

    stressed = yield_model_engine.predict_yield(
        crop_name="Rice",
        state="Telangana",
        district="Warangal",
        season="Kharif",
        fungal_disease_present=True,
        moisture_stress_present=True,
    )

    assert stressed["expected_yield_quintals_per_acre"] < baseline["expected_yield_quintals_per_acre"]
    factors = stressed["adjustment_factors"]
    assert len(factors) == 2

    for factor in factors:
        assert factor["citation"] == "indicative assumption, no source"
        assert factor["adjustment_pct"] < 0


def test_yield_engine_missing_artifact_demo_fallback():
    """Validates DEMO fallback with null predictions when model file is missing."""
    fresh_engine = YieldModelEngine()
    fresh_engine.is_loaded = False
    fresh_engine.bundle = None

    res = fresh_engine.predict_yield(
        crop_name="Rice",
        state="Telangana",
        district="Warangal",
    )
    assert res["status"] == "DEMO"
    assert res["expected_yield_quintals_per_acre"] is None
    assert res["yield_range_lower"] is None
    assert res["yield_range_upper"] is None
    assert res["explanation"]["confidence"] == 0.0


@pytest.mark.asyncio
async def test_yield_agent_with_crop():
    """Validates that YieldAgent executes inference and returns populated envelope when crop is set."""
    agent = YieldAgent()
    context = {
        "crop_name": "Rice",
        "state": "Telangana",
        "district": "Warangal",
        "season": "Kharif",
        "area_acres": 2.0,
        "weather_report": {
            "stale": False,
            "rain_forecast_24h_mm": 5.0,
            "reference_et0_mm": 4.0,
        },
        "disease_finding": {
            "detected_disease": "Healthy",
        },
    }

    env = await agent.run(context=context)
    assert env.status == "success"
    assert env.outputs["status"] == "WORKING"
    assert env.outputs["expected_yield_quintals_per_acre"] is not None
    assert env.outputs["yield_range_lower"] is not None
    assert env.outputs["yield_range_upper"] is not None


@pytest.mark.asyncio
async def test_yield_agent_without_crop_stub():
    """Validates that YieldAgent returns stub with null predictions when no crop is active."""
    agent = YieldAgent()
    context = {
        "crop_name": None,
        "weather_report": {"stale": False},
    }

    env = await agent.run(context=context)
    assert env.outputs["status"] == "stub"
    assert env.outputs["expected_yield_quintals_per_acre"] is None
    assert env.outputs["yield_range_lower"] is None
    assert env.outputs["yield_range_upper"] is None


def test_yield_api_auth(client: TestClient):
    """Ensures POST /api/v1/yield/predict requires authentication."""
    resp = client.post("/api/v1/yield/predict", json={})
    assert resp.status_code == 401


def test_yield_api_success(client: TestClient, farmer_headers: dict):
    """Ensures authenticated yield prediction endpoint returns 200 with typed schema."""
    payload = {
        "crop_name": "Rice",
        "state": "Telangana",
        "district": "Warangal",
        "season": "Kharif",
        "area_acres": 3.0,
    }
    resp = client.post("/api/v1/yield/predict", json=payload, headers=farmer_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "WORKING"
    assert data["crop_name"].lower() == "rice"
    assert data["expected_yield_quintals_per_acre"] is not None
    assert data["yield_range_lower"] is not None
    assert data["yield_range_upper"] is not None
    assert data["expected_total_quintals"] > 0
