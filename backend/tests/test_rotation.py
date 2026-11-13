"""
Unit Tests for Rule-Based Crop Rotation Planner Service
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.rotation import recommend_rotations

client = TestClient(app)


def test_cotton_rotation_rules():
    """Verifies that cotton rotation recommends legumes, breaks bollworm cycles, and avoids Malvaceae."""
    res = recommend_rotations("Cotton")
    assert res.previous_crop == "Cotton"
    assert res.previous_crop_family == "Malvaceae"
    assert any("pink bollworm" in r.lower() for r in res.primary_agronomic_risks)

    # Avoids monoculture cotton and okra
    assert any("cotton" in a.lower() for a in res.avoid_crops)

    # Recommended crops must include legumes (Groundnut or Pulses)
    crops = [c.crop_name.lower() for c in res.recommended_rotations]
    assert any("groundnut" in c for c in crops)
    assert any("pulses" in c for c in crops)

    for item in res.recommended_rotations:
        assert item.is_rule_based is True
        assert item.agronomic_source is not None
        assert "to verify" in item.agronomic_source.lower()
        assert len(item.rationale) > 20


def test_rice_rotation_rules():
    """Verifies rice rotation avoids continuous wet paddy and recommends rice-fallow pulses."""
    res = recommend_rotations("Rice")
    assert res.previous_crop == "Rice"
    assert any("wet rice" in a.lower() for a in res.avoid_crops)
    crops = [c.crop_name.lower() for c in res.recommended_rotations]
    assert any("blackgram" in c or "pulses" in c for c in crops)


def test_solanaceae_wilt_and_nematode_disruption():
    """Verifies chilli and tomato avoid all Solanaceae to break bacterial wilt and nematodes."""
    res = recommend_rotations("Chilli")
    assert res.previous_crop_family == "Solanaceae"
    # Must avoid all other Solanaceae (Tomato, Brinjal, Potato)
    avoid_str = " ".join(res.avoid_crops).lower()
    assert "tomato" in avoid_str
    assert "brinjal" in avoid_str
    # Recommends Maize or Sunnhemp
    rec_str = " ".join(c.crop_name.lower() for c in res.recommended_rotations)
    assert "maize" in rec_str or "sunnhemp" in rec_str


def test_api_rotation_recommend(farmer_headers):
    """Verifies GET /api/v1/rotation/recommend endpoint."""
    r = client.get("/api/v1/rotation/recommend?previous_crop=Cotton", headers=farmer_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["previous_crop"] == "Cotton"
    assert len(data["recommended_rotations"]) >= 2
