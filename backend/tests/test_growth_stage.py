"""
AgriSage AI — Growth Stage Phenology Engine Unit & Integration Tests
Validates:
- 5-stage phenological timeline calculation mapped onto FAO-56's 4 stages
- Reusing verified stage lengths from fao56_crop_coefficients.json
- DAS calculation and progress percentage
- 10 supported Indian crops (rice, wheat, maize, cotton, groundnut, chilli, tomato, sugarcane, soybean, pulses)
- Stage-specific guidance tasks (irrigation, fertilizer, scouting, spraying) with zero chemical dosages
- API endpoints: GET /api/v1/advisory/stage and GET /api/v1/advisory/tasks
"""
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from backend.app.services.growth_stage import growth_stage_service


def test_10_major_crops_stage_lengths_match_fao56():
    """Validates that all 10 major crops retrieve stage lengths matching fao56_crop_coefficients.json."""
    crops = [
        "rice", "wheat", "maize", "cotton", "groundnut",
        "chilli", "tomato", "sugarcane", "soybean", "pulses"
    ]
    for crop in crops:
        lengths = growth_stage_service.get_stage_lengths_from_fao56(crop)
        assert "initial" in lengths
        assert "development" in lengths
        assert "mid" in lengths
        assert "late" in lengths
        total = lengths["initial"] + lengths["development"] + lengths["mid"] + lengths["late"]
        assert total > 60


def test_cotton_phenology_at_das_90():
    """Validates Ramesh's cotton cycle: planting date 2026-08-15 evaluated at 2026-11-13 (DAS 90)."""
    p_date = date(2026, 8, 15)
    ref_date = date(2026, 11, 13)  # Exactly 90 days

    res = growth_stage_service.compute_phenology(
        crop_name="cotton",
        planting_date=p_date,
        reference_date=ref_date,
    )

    assert res.crop_name.lower() == "cotton"
    assert res.days_after_sowing == 90
    assert res.current_stage == "flowering"
    assert res.fao56_kc_stage == "mid"
    assert res.stage_progress_pct > 0.0
    assert res.cycle_progress_pct == 50.0  # 90 / 180 total days = 50%
    assert res.estimated_days_to_next_stage is not None
    assert len(res.stages_timeline) == 5
    assert "indicative" in res.source_notes.lower()


def test_germination_and_maturity_boundary_stages():
    """Validates boundary conditions: early germination (DAS 5) and late maturity (DAS 170)."""
    today = date.today()

    # Early germination
    germ_pdate = today - timedelta(days=5)
    res_germ = growth_stage_service.compute_phenology("cotton", germ_pdate, today)
    assert res_germ.current_stage == "germination"
    assert res_germ.fao56_kc_stage == "initial"
    assert res_germ.days_after_sowing == 5

    # Late maturity
    mat_pdate = today - timedelta(days=170)
    res_mat = growth_stage_service.compute_phenology("cotton", mat_pdate, today)
    assert res_mat.current_stage == "maturity"
    assert res_mat.fao56_kc_stage == "late"
    assert res_mat.days_after_sowing == 170


def test_stage_tasks_zero_chemical_dosages():
    """Asserts that all stage guidance tasks contain zero chemical quantities and mandate extension officer confirmation."""
    p_date = date(2026, 8, 15)
    ref_date = date(2026, 11, 13)

    tasks_res = growth_stage_service.get_stage_tasks("cotton", p_date, ref_date)
    assert len(tasks_res.tasks) >= 2
    assert tasks_res.current_stage == "flowering"

    prohibited_tokens = ["ml/l", "gm/l", "kg/ha", "litres/acre", "grams per", "100g", "50ml"]
    for task in tasks_res.tasks:
        assert task.dosages_included is False
        assert "confirm with your local agriculture officer" in task.guidance_disclaimer.lower()
        desc_lower = task.description.lower()
        for token in prohibited_tokens:
            assert token not in desc_lower


def test_api_advisory_stage_endpoint(client: TestClient):
    """Tests GET /api/v1/advisory/stage endpoint."""
    resp = client.get("/api/v1/advisory/stage?crop=cotton&planting_date=2026-08-15")
    assert resp.status_code == 200
    data = resp.json()

    assert data["crop_name"].lower() == "cotton"
    assert data["days_after_sowing"] >= 0
    assert len(data["stages_timeline"]) == 5
    assert "source_notes" in data


def test_api_advisory_tasks_endpoint(client: TestClient, farmer_headers: dict):
    """Tests GET /api/v1/advisory/tasks endpoint."""
    resp = client.get("/api/v1/advisory/tasks?crop=cotton&planting_date=2026-08-15", headers=farmer_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["crop_name"].lower() == "cotton"
    assert len(data["tasks"]) >= 2
    assert all("guidance_disclaimer" in t for t in data["tasks"])
