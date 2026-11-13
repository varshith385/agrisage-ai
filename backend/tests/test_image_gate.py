from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from PIL import Image
import io

from backend.app.config import settings
from backend.app.models.user import User, Language
from backend.app.models.farm import Farm, OwnershipType, IrrigationMethod
from backend.app.security.auth import create_access_token
from backend.app.ml.image_gate import image_domain_gate

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture
def auth_headers(demo_farmer: User) -> dict:
    token = create_access_token({"sub": str(demo_farmer.id), "role": demo_farmer.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_farm(db_session: Session, demo_farmer: User) -> Farm:
    farm = Farm(
        user_id=demo_farmer.id,
        name="Test Gate Farm",
        area=3.0,
        ownership_type=OwnershipType.OWNED,
        owned_area=3.0,
        leased_area=0.0,
        lease_amount=0.0,
        soil_type="Red Sandy Loam",
        water_source="Borewell",
        irrigation_method=IrrigationMethod.DRIP,
        budget=35000.0,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.96,
        longitude=79.59,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm


# ---------------------------------------------------------------------------
# Test 1: Disease endpoint rejects non-crop fixtures with HTTP 422 and translated messages
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "fixture_name,expected_label",
    [
        ("code_screenshot.png", "code"),
        ("text_document.png", "document"),
        ("person_portrait.png", "person"),
    ],
)
def test_disease_predict_rejects_non_crop_fixtures_with_422(
    client: TestClient,
    auth_headers: dict,
    fixture_name: str,
    expected_label: str,
):
    path = FIXTURES_DIR / fixture_name
    assert path.exists(), f"Fixture missing: {path}"

    with open(path, "rb") as f:
        img_bytes = f.read()

    # Test English rejection
    resp_en = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": (fixture_name, img_bytes, "image/png")},
        data={"language": "en"},
    )
    assert resp_en.status_code == 422, f"Failed for {fixture_name}: {resp_en.text}"
    assert "This doesn't look like a farm or crop photo" in resp_en.json()["detail"]
    # Ensure NO diagnosis or prediction is returned
    assert "predicted_disease" not in resp_en.json()

    # Test Telugu rejection
    resp_te = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": (fixture_name, img_bytes, "image/png")},
        data={"language": "te"},
    )
    assert resp_te.status_code == 422
    assert "ఇది పొలం లేదా పంట ఫోటోలా లేదు" in resp_te.json()["detail"]

    # Test Hindi rejection
    resp_hi = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": (fixture_name, img_bytes, "image/png")},
        data={"language": "hi"},
    )
    assert resp_hi.status_code == 422
    assert "यह किसी खेत या फसल का फोटो नहीं लग रहा है" in resp_hi.json()["detail"]


# ---------------------------------------------------------------------------
# Test 2: Irrigation diagnose rejects non-crop fixtures with HTTP 422
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "fixture_name",
    ["code_screenshot.png", "text_document.png", "person_portrait.png"],
)
def test_irrigation_diagnose_rejects_non_crop_fixtures_with_422(
    client: TestClient,
    auth_headers: dict,
    fixture_name: str,
):
    path = FIXTURES_DIR / fixture_name
    with open(path, "rb") as f:
        img_bytes = f.read()

    resp = client.post(
        "/api/v1/irrigation/diagnose",
        headers=auth_headers,
        files={"file": (fixture_name, img_bytes, "image/png")},
        data={"language": "en"},
    )
    assert resp.status_code == 422, f"Failed for {fixture_name}: {resp.text}"
    assert "This doesn't look like a farm or crop photo" in resp.json()["detail"]
    assert "category" not in resp.json()


# ---------------------------------------------------------------------------
# Test 3: Disease endpoint accepts leaf photo fixture
# ---------------------------------------------------------------------------
def test_disease_predict_accepts_leaf_fixture(client: TestClient, auth_headers: dict):
    path = FIXTURES_DIR / "tomato_early_blight.jpg"
    assert path.exists(), f"Fixture missing: {path}"

    with open(path, "rb") as f:
        img_bytes = f.read()

    resp = client.post(
        "/api/v1/disease/predict",
        headers=auth_headers,
        files={"file": ("tomato_early_blight.jpg", img_bytes, "image/jpeg")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert data["predicted_crop"] == "Tomato"
    assert "Early Blight" in data["predicted_disease"]
    assert data["domain_gate"]["passed"] is True


# ---------------------------------------------------------------------------
# Test 4: Irrigation endpoint accepts field photo fixture
# ---------------------------------------------------------------------------
def test_irrigation_diagnose_accepts_field_fixture(client: TestClient, auth_headers: dict):
    path = FIXTURES_DIR / "field_photo.jpg"
    assert path.exists(), f"Fixture missing: {path}"

    with open(path, "rb") as f:
        img_bytes = f.read()

    resp = client.post(
        "/api/v1/irrigation/diagnose",
        headers=auth_headers,
        files={"file": ("field_photo.jpg", img_bytes, "image/jpeg")},
        data={"text_query": "check field soil status"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "category" in data
    assert data["status"] == "PARTIAL"
    assert "visual_indicator_disclaimer" in data["visual_cues"]
    assert "Visual indication only, not a soil moisture measurement" in data["visual_cues"]["visual_indicator_disclaimer"]


# ---------------------------------------------------------------------------
# Test 5: Borderline image confirmation flow
# ---------------------------------------------------------------------------
def test_borderline_image_confirmation_flow(monkeypatch):
    # Mock evaluate_clip to return a borderline score (0.45 in [0.35, 0.55))
    monkeypatch.setattr(
        image_domain_gate,
        "evaluate_clip",
        lambda img, domain: (0.45, "a photo of an agricultural field, farm dirt, or soil"),
    )

    # Valid green/brown image that passes heuristics
    img = Image.new("RGB", (100, 100), color=(100, 140, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw = buf.getvalue()

    # 1. Unconfirmed should raise HTTP 422 with borderline detail
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        image_domain_gate.verify_image(raw, domain="leaf", confirmed=False)
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["borderline"] is True

    # 2. Confirmed should pass with warning
    res = image_domain_gate.verify_image(raw, domain="leaf", confirmed=True)
    assert res["passed"] is True
    assert res["borderline_confirmed"] is True
    assert "Visual indication only" in res["warning"]


# ---------------------------------------------------------------------------
# Test 6: Heuristic fallback when CLIP is disabled
# ---------------------------------------------------------------------------
def test_heuristic_fallback_when_clip_disabled(monkeypatch):
    # Disable CLIP in settings
    monkeypatch.setattr(settings, "IMAGE_GATE_USE_CLIP", False)

    # Non-crop code screenshot should be rejected by heuristics
    path = FIXTURES_DIR / "code_screenshot.png"
    with open(path, "rb") as f:
        img_bytes = f.read()

    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        image_domain_gate.verify_image(img_bytes, domain="leaf")
    assert exc_info.value.status_code == 422

    # Green crop/field image should pass heuristic fallback
    with open(FIXTURES_DIR / "field_photo.jpg", "rb") as f:
        field_bytes = f.read()
    res = image_domain_gate.verify_image(field_bytes, domain="irrigation")
    assert res["passed"] is True
    assert res["mode"] == "heuristic_fallback"
