"""
AgriSage AI — Crop Recommendation Engine Unit & Integration Tests
Validates:
- Multi-crop recommendation using trained RandomForest classifier
- Weather-only variant fallback when soil parameters (N, P, K, pH) are missing (confidence=0.50)
- Rule-based climate suitability filter (e.g. apple / coffee flagged in southern plains)
- Disclosure of unsupported common crops (wheat, chilli, tomato, etc.)
- Missing artifact DEMO fallback
- POST /api/v1/recommend/crop API endpoint authorization and payload validation
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.app.ml.crop_recommender import CropRecommenderEngine, crop_recommender_engine


def test_crop_recommender_full_features():
    """Validates top-3 crop recommendations when all soil and weather features are provided."""
    res = crop_recommender_engine.recommend(
        n=90.0,
        p=42.0,
        k=43.0,
        ph=6.5,
        temperature=25.0,
        humidity=80.0,
        rainfall=200.0,
        state="Telangana",
        season="Kharif",
    )

    assert res["status"] == "WORKING"
    assert res["soil_values_missing"] is False
    assert res["confidence"] >= 0.85
    assert len(res["top_crops"]) == 3

    top1 = res["top_crops"][0]
    assert "crop_name" in top1
    assert "probability" in top1
    assert "reasons" in top1
    assert 0.0 <= top1["probability"] <= 1.0

    # Probability sum for top-3 is positive and realistic
    total_prob = sum(r["probability"] for r in res["top_crops"])
    assert total_prob > 0.5

    # Check unsupported common crops declaration
    assert "wheat" in res["unsupported_common_crops"]
    assert "chilli" in res["unsupported_common_crops"]
    assert "tomato" in res["unsupported_common_crops"]


def test_crop_recommender_missing_soil_weather_only():
    """Validates fallback to weather-only model variant with lower confidence when soil test is absent."""
    res = crop_recommender_engine.recommend(
        n=None,
        p=None,
        k=None,
        ph=None,
        temperature=26.0,
        humidity=75.0,
        rainfall=150.0,
        state="Telangana",
        season="Kharif",
    )

    assert res["status"] == "WORKING"
    assert res["soil_values_missing"] is True
    assert res["confidence"] == 0.50
    assert "weather_only_model" in res["fallback_used"]
    assert len(res["top_crops"]) >= 1


def test_climate_suitability_filter_unsuitable_crop():
    """Validates that temperate / high-elevation crops (e.g. apple, coffee) are marked unsuitable in tropical plains."""
    is_suitable, note = crop_recommender_engine.evaluate_climate_suitability(
        crop_name="apple",
        state="Telangana",
        season="Kharif",
        temperature=32.0,
        rainfall=60.0,
    )
    assert is_suitable is False
    assert "Apple requires temperate" in note

    # Test coffee in hot dry plains
    is_suitable_coffee, note_coffee = crop_recommender_engine.evaluate_climate_suitability(
        crop_name="coffee",
        state="Telangana",
        season="Kharif",
        temperature=36.0,
        rainfall=40.0,
    )
    assert is_suitable_coffee is False
    assert "Coffee requires highland hill plantation" in note_coffee


def test_climate_suitability_filter_suitable_crop():
    """Validates that staple crops are marked climate suitable."""
    is_suitable, note = crop_recommender_engine.evaluate_climate_suitability(
        crop_name="rice",
        state="Telangana",
        season="Kharif",
        temperature=28.0,
        rainfall=180.0,
    )
    assert is_suitable is True
    assert "Agro-climatically suitable" in note


def test_missing_model_artifact_fallback():
    """Validates graceful DEMO fallback when model artifacts are missing or unreadable."""
    fresh_engine = CropRecommenderEngine()
    fresh_engine.is_loaded = False
    fresh_engine.full_bundle = None
    fresh_engine.weather_bundle = None

    res = fresh_engine.recommend(
        n=50.0,
        p=50.0,
        k=50.0,
        ph=6.5,
        temperature=25.0,
        humidity=60.0,
        rainfall=100.0,
    )
    assert res["status"] == "DEMO"
    assert res["confidence"] == 0.0
    assert len(res["top_crops"]) == 0
    assert "missing" in res["explanation"]["value"].lower() or "not loaded" in res["explanation"]["value"].lower()


def test_crop_recommendation_api_auth(client: TestClient):
    """Ensures POST /api/v1/recommend/crop requires authentication."""
    resp = client.post("/api/v1/recommend/crop", json={})
    assert resp.status_code == 401


def test_crop_recommendation_api_success(client: TestClient, farmer_headers: dict):
    """Ensures authenticated crop recommendation endpoint returns 200 with typed schema."""
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

    assert data["status"] == "WORKING"
    assert data["soil_values_missing"] is False
    assert len(data["top_crops"]) >= 1
    assert "crop_name" in data["top_crops"][0]
    assert "probability" in data["top_crops"][0]
    assert "unsupported_common_crops" in data
