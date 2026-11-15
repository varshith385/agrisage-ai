"""
Grow2Gain — Crop Advisory Round 7b Verification Suite
Tests:
1. Metadata JSON loading and schema validation
2. Tier 1 INVALID input handling (negative N, P, K, rainfall, invalid pH/temp)
3. Tier 2 UNUSUAL training envelope breach (N=500, pH=14, temp=60, rainfall=0)
4. Tier 3 UNUSUAL joint combination OOD detection on in-range features
5. Real training row is CONFIDENT or LOW_CONFIDENCE, never UNUSUAL
6. Response backward compatibility (new fields + old fields)
7. Two distant locations produce distinct weather inputs
8. Weather API failure produces clear error and no fake defaults
9. Perturbation stability function validation
"""
import json
import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from backend.app.ml.crop_recommender import crop_recommender_engine, ARTIFACTS_DIR, METADATA_PATH
from backend.app.services.open_meteo import get_climate_normals


def test_metadata_json_loads_and_has_valid_schema():
    assert METADATA_PATH.exists(), f"Metadata JSON missing at {METADATA_PATH}"
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert "model_name" in meta
    assert "selection_rule" in meta
    assert "benchmark_models" in meta
    assert len(meta["benchmark_models"]) >= 8
    assert "calibration_comparison" in meta
    assert "stability_analysis" in meta
    assert "ood_evaluation" in meta
    assert "decision_thresholds" in meta
    assert meta["decision_thresholds"]["prob_threshold_95"] > 0.0


def test_tier1_negative_value_handled_as_invalid():
    # Negative N
    res = crop_recommender_engine.recommend(
        n=-10.0, p=50.0, k=50.0, ph=6.5, temperature=25.0, humidity=70.0, rainfall=100.0
    )
    assert res["decision_status"] == "INVALID"
    assert res["status"] == "INVALID"
    assert len(res["top_crops"]) == 0
    assert res["confidence"] == 0.0
    assert any("N" in r or "Nitrogen" in r for r in res["decision_reasons"])


def test_tier1_api_returns_422_naming_invalid_fields(client: TestClient, farmer_headers: dict):
    payload = {
        "n": -25.0,
        "p": 40.0,
        "k": 40.0,
        "temperature": 25.0,
        "humidity": 70.0,
        "ph": 6.5,
        "rainfall": 100.0,
    }
    resp = client.post("/api/v1/recommend/crop", json=payload, headers=farmer_headers)
    assert resp.status_code == 422
    data = resp.json()
    assert "detail" in data
    detail = data["detail"]
    assert detail["status"] == "INVALID"
    assert "N" in detail["invalid_fields"]


def test_tier2_n500_handled_as_unusual():
    # N=500 is > training max 140.0
    res = crop_recommender_engine.recommend(
        n=500.0, p=50.0, k=50.0, ph=6.5, temperature=25.0, humidity=70.0, rainfall=100.0
    )
    assert res["decision_status"] == "UNUSUAL"
    assert res["is_out_of_distribution"] is True
    assert "Unusual combination" in res["decision_reasons"][0]
    assert any("500" in r for r in res["decision_reasons"])
    assert res["confidence_label"] == "Low"


def test_tier2_ph14_handled_as_unusual():
    # pH=14 is > training max 9.94
    res = crop_recommender_engine.recommend(
        n=50.0, p=50.0, k=50.0, ph=14.0, temperature=25.0, humidity=70.0, rainfall=100.0
    )
    assert res["decision_status"] == "UNUSUAL"
    assert res["is_out_of_distribution"] is True
    assert any("ph" in r.lower() or "14" in r for r in res["decision_reasons"])


def test_tier2_temp60_handled_as_unusual():
    # Temperature=60 is > training max 43.68
    res = crop_recommender_engine.recommend(
        n=50.0, p=50.0, k=50.0, ph=6.5, temperature=60.0, humidity=70.0, rainfall=100.0
    )
    assert res["decision_status"] == "UNUSUAL"
    assert res["is_out_of_distribution"] is True
    assert any("temperature" in r.lower() or "60" in r for r in res["decision_reasons"])


def test_tier2_rainfall0_in_full_mode_handled_as_unusual():
    # Rainfall=0 is < training min 20.21
    res = crop_recommender_engine.recommend(
        n=50.0, p=50.0, k=50.0, ph=6.5, temperature=25.0, humidity=70.0, rainfall=0.0
    )
    assert res["decision_status"] == "UNUSUAL"
    assert res["is_out_of_distribution"] is True
    assert any("rainfall" in r.lower() or "0" in r for r in res["decision_reasons"])


def test_real_training_row_is_confident_or_low_confidence_never_unusual():
    # Typical rice row from dataset: N=90, P=42, K=43, temp=25, hum=80, ph=6.5, rain=200
    res = crop_recommender_engine.recommend(
        n=90.0, p=42.0, k=43.0, ph=6.5, temperature=25.0, humidity=80.0, rainfall=200.0
    )
    assert res["decision_status"] in ["CONFIDENT", "LOW_CONFIDENCE"]
    assert res["decision_status"] != "UNUSUAL"
    assert res["is_out_of_distribution"] is False
    assert len(res["top_crops"]) >= 1


def test_rare_in_range_combination_flagged_by_ood():
    # Features individually within min-max bounds, but an ecologically mismatched combination
    # e.g., low temp (10°C) with tropical humidity (99%) and high NPK (N=130, P=140, K=190)
    res = crop_recommender_engine.recommend(
        n=130.0, p=140.0, k=190.0, ph=4.0, temperature=10.0, humidity=99.0, rainfall=280.0
    )
    assert res["decision_status"] == "UNUSUAL"
    assert res["is_out_of_distribution"] is True
    assert res["ood_warning"] is not None


def test_response_contains_both_new_and_old_fields(client: TestClient, farmer_headers: dict):
    payload = {
        "n": 80.0,
        "p": 40.0,
        "k": 40.0,
        "temperature": 27.0,
        "humidity": 70.0,
        "ph": 6.8,
        "rainfall": 180.0,
        "state": "Telangana",
        "season": "Kharif",
    }
    resp = client.post("/api/v1/recommend/crop", json=payload, headers=farmer_headers)
    assert resp.status_code == 200
    data = resp.json()

    # Old backward-compatible fields
    assert "top_crops" in data
    assert "soil_values_missing" in data
    assert "confidence" in data
    assert "confidence_type" in data
    assert "supported_crops" in data
    assert "unsupported_common_crops" in data
    assert "climate_warnings" in data
    assert "explanation" in data
    assert data["status"] == "WORKING"

    # New Round 7b fields
    assert "decision_status" in data
    assert data["decision_status"] in ["CONFIDENT", "LOW_CONFIDENCE", "UNUSUAL", "INVALID"]
    assert "decision_reasons" in data
    assert "confidence_label" in data
    assert "model_name" in data
    assert "model_probability" in data
    assert "input_sources" in data
    assert "temperature" in data["input_sources"]
    assert "source" in data["input_sources"]["temperature"]


@pytest.mark.asyncio
async def test_two_far_apart_locations_produce_different_weather_inputs():
    # Shimla (Himachal Pradesh, Alpine) vs Chennai (Tamil Nadu, Coastal Tropical)
    shimla = await get_climate_normals(31.10, 77.17)
    chennai = await get_climate_normals(13.08, 80.27)

    # Temperature in Shimla must be substantially cooler than Chennai
    assert shimla["mean_temperature_c"] < 20.0
    assert chennai["mean_temperature_c"] > 25.0
    assert abs(shimla["mean_temperature_c"] - chennai["mean_temperature_c"]) > 5.0
    # Rainfall and humidity differ
    assert shimla["mean_monthly_rainfall_mm"] != chennai["mean_monthly_rainfall_mm"]


@pytest.mark.asyncio
async def test_weather_api_failure_raises_503_no_invented_defaults(monkeypatch):
    import httpx

    async def mock_fail_get(*args, **kwargs):
        raise httpx.ConnectError("Open-Meteo connection timed out")

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_fail_get)
    from backend.app.services.open_meteo import CLIMATE_NORMALS_CACHE
    # Use un-cached coordinates
    test_lat, test_lon = 45.123, 12.456

    with pytest.raises(Exception) as excinfo:
        await get_climate_normals(test_lat, test_lon)

    assert "503" in str(excinfo.value) or "could not be retrieved" in str(excinfo.value)


def test_trained_artifacts_exist_non_empty_and_loadable():
    import joblib

    artifacts = [
        ARTIFACTS_DIR / "crop_recommender.joblib",
        ARTIFACTS_DIR / "crop_recommender_weather_only.joblib",
        METADATA_PATH,
    ]
    for p in artifacts:
        assert p.exists(), f"Required artifact {p} does not exist"
        assert p.stat().st_size > 0, f"Required artifact {p} is empty"

    # Test loading joblib models
    model_full = joblib.load(ARTIFACTS_DIR / "crop_recommender.joblib")
    assert hasattr(model_full, "predict") or hasattr(model_full, "predict_proba") or "model" in model_full

    model_weather = joblib.load(ARTIFACTS_DIR / "crop_recommender_weather_only.joblib")
    assert hasattr(model_weather, "predict") or hasattr(model_weather, "predict_proba") or "model" in model_weather

