import io
import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.ml.disease_model import disease_model
from backend.app.models.disease_prediction import DiseasePrediction
from backend.app.models.farm import Farm, IrrigationMethod, OwnershipType
from backend.app.models.user import User, UserRole, Language
from backend.app.security.auth import create_access_token, hash_password
from backend.app.agents.disease_agent import DiseaseAgent

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture
def auth_headers(demo_farmer: User) -> dict:
    token = create_access_token({"sub": str(demo_farmer.id), "role": demo_farmer.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_farm(db_session: Session, demo_farmer: User) -> Farm:
    farm = Farm(
        user_id=demo_farmer.id,
        name="Tomato Patch Farm",
        area=2.0,
        ownership_type=OwnershipType.OWNED,
        owned_area=2.0,
        leased_area=0.0,
        lease_amount=0.0,
        soil_type="Red Sandy Loam",
        water_source="Borewell",
        irrigation_method=IrrigationMethod.DRIP,
        budget=30000.0,
        village="Khammam Rural",
        district="Khammam",
        state="Telangana",
        latitude=17.25,
        longitude=80.15,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm


def create_test_image_bytes(
    mode: str = "RGB",
    size: tuple = (224, 224),
    color: tuple = (100, 160, 50),
    fmt: str = "JPEG",
) -> bytes:
    buf = io.BytesIO()
    img = Image.new(mode, size, color)
    img.save(buf, format=fmt)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Test 1 & 2: Valid diseased leaf image inference, quality gate, and safe IPM
# ---------------------------------------------------------------------------
def test_predict_valid_diseased_leaf(client: TestClient, auth_headers: dict):
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    assert fixture_path.exists(), f"Fixture missing: {fixture_path}"

    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("tomato_early_blight.jpg", img_bytes, "image/jpeg")},
        data={"crop_hint": "tomato"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["quality_gate"]["passed"] is True
    assert data["predicted_crop"] == "Tomato"
    assert "Early Blight" in data["predicted_disease"]
    assert data["prediction_confidence"] > 0.50
    assert data["confidence_type"] == "prediction confidence (uncalibrated)"
    assert len(data["top3_predictions"]) == 3
    assert len(data["safe_ipm_steps"]) > 0

    # Strict IPM safety check: Verify NO chemical dosages (e.g. no "ml/L" or "g/acre")
    for step in data["safe_ipm_steps"]:
        lower_step = step.lower()
        assert "ml/l" not in lower_step
        assert "gm/l" not in lower_step
        assert "kg/ha" not in lower_step
        assert "grams per" not in lower_step


# ---------------------------------------------------------------------------
# Test 3: Dark image rejected by quality gate
# ---------------------------------------------------------------------------
def test_quality_gate_rejects_dark_image(client: TestClient, auth_headers: dict):
    # Mean luminance = 5.0 < 20.0
    dark_bytes = create_test_image_bytes(color=(5, 5, 5))
    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("dark.jpg", dark_bytes, "image/jpeg")},
    )
    # Pitch black image is rejected either by domain gate (422) or quality gate (200)
    assert response.status_code in (200, 422)
    if response.status_code == 422:
        assert (
            "doesn't look like a farm or crop photo" in response.json()["detail"]
            or "Low colour variety" in response.json()["detail"]
        )
    else:
        data = response.json()
        assert data["success"] is False
        assert data["quality_gate"]["passed"] is False
        assert "too dark" in data["error"].lower()
        assert data["quality_gate"]["metrics"]["mean_luminance"] < settings.QUALITY_GATE_MIN_LUMINANCE

    # Direct unit test of quality gate for dark images
    dark_img = Image.new("RGB", (224, 224), color=(5, 5, 5))
    gate_res = disease_model.evaluate_quality_gate(dark_img)
    assert gate_res.passed is False
    assert "too dark" in gate_res.reason.lower()
    assert gate_res.metrics["mean_luminance"] < settings.QUALITY_GATE_MIN_LUMINANCE


# ---------------------------------------------------------------------------
# Test 4: Blurry / flat image rejected by quality gate
# ---------------------------------------------------------------------------
def test_quality_gate_rejects_blurry_flat_image(client: TestClient, auth_headers: dict):
    # Constant flat green color has Laplacian variance = 0 < 60.0
    flat_bytes = create_test_image_bytes(color=(80, 150, 40))
    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("blurry.jpg", flat_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["quality_gate"]["passed"] is False
    assert "blurry" in data["error"].lower()


# ---------------------------------------------------------------------------
# Test 5: Non-leaf image rejected by quality gate
# ---------------------------------------------------------------------------
def test_quality_gate_rejects_non_leaf_image(client: TestClient, auth_headers: dict):
    # Sharp high-contrast blue/cyan textured pattern:
    # R=20, G=60, B checkerboard 180/240
    # Mean luminance ~65 (passes), Sharpness > 500 (passes),
    # Foliar chromaticity: (R+G)=80 < 1.2*180=216 -> 0.0 foliar ratio (fails < 0.20)
    arr = np.zeros((224, 224, 3), dtype=np.uint8)
    arr[:, :, 0] = 20
    arr[:, :, 1] = 60
    arr[::2, ::2, 2] = 240
    arr[1::2, 1::2, 2] = 180
    non_leaf_img = Image.fromarray(arr)
    buf = io.BytesIO()
    non_leaf_img.save(buf, format="JPEG")
    blue_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("blue_screen.jpg", blue_bytes, "image/jpeg")},
    )
    assert response.status_code in (200, 422)
    if response.status_code == 422:
        assert "doesn't look like a farm or crop photo" in response.json()["detail"]
    else:
        data = response.json()
        assert data["success"] is False
        assert data["quality_gate"]["passed"] is False
        assert "not appear to contain plant leaves" in data["error"]


# ---------------------------------------------------------------------------
# Test 6: Supported crops endpoint
# ---------------------------------------------------------------------------
def test_supported_crops_endpoint(client: TestClient):
    response = client.get("/api/v1/disease/supported-crops")
    assert response.status_code == 200
    data = response.json()
    assert len(data["supported_crops"]) == 14
    assert "Tomato" in data["supported_crops"]
    assert "Apple" in data["supported_crops"]
    assert "Cotton" in data["unsupported_examples"]
    assert "Chilli" in data["unsupported_examples"]
    assert "Rice" in data["unsupported_examples"]
    assert "Wheat" in data["unsupported_examples"]


# ---------------------------------------------------------------------------
# Test 7: Unsupported crop hint (Cotton, Chilli, Rice, Wheat) returns warning
# ---------------------------------------------------------------------------
def test_unsupported_crop_hint_returns_clear_warning(client: TestClient, auth_headers: dict):
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("leaf.jpg", img_bytes, "image/jpeg")},
        data={"crop_hint": "cotton"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop_supported"] is False
    # Verify clear warning message about Cotton not being in PlantVillage
    has_unsupported_warning = any("not supported by the plantvillage" in w.lower() for w in data["warnings"])
    assert has_unsupported_warning is True


# ---------------------------------------------------------------------------
# Test 8: Crop mismatch warning (user specified apple, model sees tomato)
# ---------------------------------------------------------------------------
def test_crop_mismatch_warning(client: TestClient, auth_headers: dict):
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("leaf.jpg", img_bytes, "image/jpeg")},
        data={"crop_hint": "apple"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop_supported"] is True
    # Verify mismatch warning
    has_mismatch_warning = any("possible crop mismatch" in w.lower() for w in data["warnings"])
    assert has_mismatch_warning is True


# ---------------------------------------------------------------------------
# Test 9: PNG renamed to .jpg decodes correctly via Pillow
# ---------------------------------------------------------------------------
def test_png_renamed_to_jpg_decodes_successfully(client: TestClient, auth_headers: dict):
    # Take real fixture, convert to PNG in memory, send with .jpg filename
    fixture_path = FIXTURES_DIR / "apple_black_rot.jpg"
    img = Image.open(fixture_path)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("fake_apple.jpg", png_bytes, "image/jpeg")},
        data={"crop_hint": "apple"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["predicted_crop"] == "Apple"


# ---------------------------------------------------------------------------
# Test 10: Decompression bomb guard
# ---------------------------------------------------------------------------
def test_decompression_bomb_guard(client: TestClient, auth_headers: dict):
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    # Temporarily set MAX_IMAGE_PIXELS to 100 pixels to trigger DecompressionBombError
    with patch("PIL.Image.MAX_IMAGE_PIXELS", 100):
        response = client.post(
            "/api/v1/disease/predict",
            headers=auth_headers,
            files={"file": ("bomb.jpg", img_bytes, "image/jpeg")},
        )
        assert response.status_code in (200, 422)
        if response.status_code == 422:
            assert "decompression" in response.json()["detail"].lower()
        else:
            data = response.json()
            assert data["success"] is False
            assert "decompression" in data["error"].lower()


# ---------------------------------------------------------------------------
# Test 11: Oversized file (>15MB) rejected with 413
# ---------------------------------------------------------------------------
def test_oversized_file_rejected_with_413(client: TestClient, auth_headers: dict):
    fake_huge = b"A" * (settings.MAX_IMAGE_FILE_SIZE_BYTES + 1024)
    response = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("huge.jpg", fake_huge, "image/jpeg")},
    )
    assert response.status_code == 413
    assert "exceeds maximum allowed limit" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Test 12: Privacy & Outbreak Telemetry Opt-in (Default False vs True)
# ---------------------------------------------------------------------------
def test_privacy_and_outbreak_opt_in(
    client: TestClient,
    auth_headers: dict,
    sample_farm: Farm,
    db_session: Session,
):
    fixture_path = FIXTURES_DIR / "corn_common_rust.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    count_before = db_session.query(DiseasePrediction).count()

    # Case A: Default (report_to_outbreak=False)
    resp1 = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("corn.jpg", img_bytes, "image/jpeg")},
        data={"crop_hint": "corn", "farm_id": sample_farm.id, "report_to_outbreak": False},
    )
    assert resp1.status_code == 200
    assert resp1.json()["reported_to_outbreak"] is False
    assert db_session.query(DiseasePrediction).count() == count_before

    # Case B: Opt-in (report_to_outbreak=True)
    resp2 = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("corn.jpg", img_bytes, "image/jpeg")},
        data={"crop_hint": "corn", "farm_id": sample_farm.id, "report_to_outbreak": True},
    )
    assert resp2.status_code == 200
    assert resp2.json()["reported_to_outbreak"] is True
    assert db_session.query(DiseasePrediction).count() == count_before + 1

    # Verify stored record: ONLY village centroid is stored, NO image path
    saved = db_session.query(DiseasePrediction).order_by(DiseasePrediction.id.desc()).first()
    assert saved.image_path is None
    assert saved.village == sample_farm.village
    assert saved.district == sample_farm.district
    assert saved.reported_to_outbreak is True


# ---------------------------------------------------------------------------
# Test 13: Weather fungal risk factor is separate from model confidence
# ---------------------------------------------------------------------------
def test_weather_fungal_risk_separate_from_confidence(
    client: TestClient,
    auth_headers: dict,
    sample_farm: Farm,
):
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    # Mock get_weather_forecast to return 90% humidity
    with patch("backend.app.api.v1.disease.get_weather_forecast") as mock_weather:
        from unittest.mock import MagicMock
        mock_resp = MagicMock()
        mock_resp.current.relative_humidity_pct = 92.0
        mock_item = MagicMock()
        mock_item.precipitation_sum = 20.0
        mock_resp.daily = [mock_item]
        mock_weather.return_value = mock_resp

        response = client.post(
            "/api/v1/disease/predict",
            headers=auth_headers,
            files={"file": ("leaf.jpg", img_bytes, "image/jpeg")},
            data={"crop_hint": "tomato", "farm_id": sample_farm.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["weather_fungal_risk"]["elevated"] is True
        assert data["weather_fungal_risk"]["relative_humidity_pct"] == 92.0
        # Model confidence remains the raw uncalibrated prediction
        assert data["prediction_confidence"] > 0.80


# ---------------------------------------------------------------------------
# Test 14: DiseaseAgent runs with real image bytes and updates finding
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_disease_agent_with_real_image():
    fixture_path = FIXTURES_DIR / "tomato_early_blight.jpg"
    with open(fixture_path, "rb") as f:
        img_bytes = f.read()

    agent = DiseaseAgent()
    context = {
        "image_bytes": img_bytes,
        "crop_name": "Tomato",
        "weather_report": {
            "relative_humidity_pct": 85.0,
            "rain_forecast_24h_mm": 10.0,
        },
        "weather_status": "success",
    }
    env = await agent.run(context)
    assert env.status == "success"
    outputs = env.outputs
    assert outputs["status"] == "WORKING"
    assert "Early Blight" in outputs["detected_disease"]
    assert outputs["confidence"] > 0.50
    assert outputs["fungal_risk_elevated"] is True
    assert outputs["weather_fungal_risk_factor"] is not None
    assert len(outputs["safe_ipm_steps"]) > 0
