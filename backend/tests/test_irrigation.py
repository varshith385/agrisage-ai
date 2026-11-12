import io
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from backend.app.ml.irrigation import (
    FAO56IrrigationEngine,
    IrrigationDiagnostician,
    LITRES_PER_ACRE_MM,
    irrigation_engine,
)
from backend.app.models.farm import Farm, IrrigationMethod, OwnershipType, CurrentCropCycle, CropStage
from backend.app.models.user import User, UserRole, Language
from backend.app.security.auth import create_access_token, hash_password


# =====================================================================
# 1. Hand-Calculated Mathematical Formulation Tests
# =====================================================================

def test_effective_rainfall_hand_calculated():
    """
    Asserts exact values against the FAO/USDA-SCS empirical formula:
    - P <= 5.0 => P_eff = 0.0
    - 5.0 < P <= 50.0 => P_eff = 0.8 * (P - 5.0)
    - P > 50.0 => P_eff = 36.0 + 0.1 * (P - 50.0)
    """
    calc = FAO56IrrigationEngine.calculate_effective_rainfall

    # Case A: Light drizzle (lost to canopy interception)
    assert calc(0.0) == 0.0
    assert calc(3.5) == 0.0
    assert calc(5.0) == 0.0

    # Case B: Moderate rain: P = 25.0 mm => 0.8 * (25.0 - 5.0) = 0.8 * 20.0 = 16.0 mm
    assert calc(25.0) == 16.0

    # Case C: Boundary condition: P = 50.0 mm => 0.8 * 45.0 = 36.0 mm
    assert calc(50.0) == 36.0

    # Case D: Heavy downpour with runoff: P = 70.0 mm => 36.0 + 0.1 * (70.0 - 50.0) = 36.0 + 2.0 = 38.0 mm
    assert calc(70.0) == 38.0

    # Case E: Extreme storm: P = 120.0 mm => 36.0 + 0.1 * 70.0 = 43.0 mm
    assert calc(120.0) == 43.0


def test_kc_growth_stage_interpolation_cotton():
    """
    Hand-calculated verification for Cotton:
    Initial: 30 days, Kc = 0.35
    Development: 50 days (DAS 31-80), interpolates from 0.35 to 1.20
    Mid: 60 days (DAS 81-140), Kc = 1.20
    Late: 40 days (DAS 141-180), interpolates from 1.20 to 0.60
    Total: 180 days
    """
    engine = irrigation_engine
    base_date = date(2026, 6, 1)

    # 1. Day 15 (Initial)
    stage, kc, das = engine.determine_growth_stage("cotton", base_date, base_date + timedelta(days=15))
    assert stage == "initial"
    assert das == 15
    assert kc == 0.35

    # 2. Day 55 (Development): 25 days into 50-day development stage (exactly 50%)
    # Kc = 0.35 + 0.50 * (1.20 - 0.35) = 0.35 + 0.425 = 0.775
    stage, kc, das = engine.determine_growth_stage("cotton", base_date, base_date + timedelta(days=55))
    assert stage == "development"
    assert das == 55
    assert kc == 0.775

    # 3. Day 100 (Mid-season)
    stage, kc, das = engine.determine_growth_stage("cotton", base_date, base_date + timedelta(days=100))
    assert stage == "mid"
    assert das == 100
    assert kc == 1.20

    # 4. Day 160 (Late stage): 20 days into 40-day late stage (exactly 50%)
    # Kc = 1.20 + 0.50 * (0.60 - 1.20) = 1.20 - 0.30 = 0.90
    stage, kc, das = engine.determine_growth_stage("cotton", base_date, base_date + timedelta(days=160))
    assert stage == "late"
    assert das == 160
    assert kc == 0.90

    # 5. Day 190 (Harvest / end of season)
    stage, kc, das = engine.determine_growth_stage("cotton", base_date, base_date + timedelta(days=190))
    assert stage == "late"
    assert kc == 0.60


def test_soil_awc_and_raw_calculation():
    """
    Hand-calculated test for Soil Water Capacity & RAW:
    Black Cotton Soil: AWC = 190 mm/m
    Cotton root depth = 1.0 m => TAW = 190.0 mm
    Cotton depletion fraction p = 0.65 => RAW = 190.0 * 0.65 = 123.5 mm
    """
    engine = irrigation_engine
    crop_info = engine.get_crop_info("cotton")
    awc = engine.get_soil_awc("Black Cotton")
    assert awc == 190.0

    root_depth = crop_info["root_depth_m"]
    taw = awc * root_depth
    assert taw == 190.0

    p = crop_info["depletion_fraction_p"]
    raw = round(taw * p, 2)
    assert raw == 123.5


def test_water_balance_volume_and_method_efficiency():
    """
    Hand-calculated test for gross depth and volume across irrigation methods:
    Given Net Depth = 45.0 mm on 2.5 acres:
    Drip (eta = 0.90): Gross depth = 45.0 / 0.90 = 50.0 mm
    Sprinkler (eta = 0.75): Gross depth = 45.0 / 0.75 = 60.0 mm
    Furrow (eta = 0.60): Gross depth = 45.0 / 0.60 = 75.0 mm
    Flood (eta = 0.50): Gross depth = 45.0 / 0.50 = 90.0 mm

    Volume (litres) = gross_depth_mm * acres * 4046.8564224
    Drip: 50.0 * 2.5 * 4046.8564224 = 505,857 litres
    Flood: 90.0 * 2.5 * 4046.8564224 = 910,543 litres (1.8x more water)
    """
    engine = irrigation_engine
    area = 2.5

    drip_eff = engine.get_method_efficiency("drip")
    assert drip_eff == 0.90
    gross_drip = round(45.0 / drip_eff, 2)
    assert gross_drip == 50.0
    vol_drip = round(gross_drip * area * LITRES_PER_ACRE_MM, 0)
    assert vol_drip == 505857.0

    flood_eff = engine.get_method_efficiency("flood")
    assert flood_eff == 0.50
    gross_flood = round(45.0 / flood_eff, 2)
    assert gross_flood == 90.0
    vol_flood = round(gross_flood * area * LITRES_PER_ACRE_MM, 0)
    assert vol_flood == 910543.0


def test_rain_skip_logic_and_water_conservation():
    """
    When soil depletion triggers irrigation, but forecast rainfall >= 15 mm in 24h,
    the model must trigger rain_skip, set should_irrigate=False, and record litres_saved.
    """
    engine = irrigation_engine
    today = date(2026, 7, 15)
    planting = date(2026, 6, 1)  # 44 days old

    # Scenario 1: Rain forecast = 0 mm (irrigation proceeds)
    plan_dry = engine.calculate_plan(
        crop_name="cotton",
        planting_date=planting,
        area_acres=2.0,
        soil_type="Black Cotton",
        irrigation_method="drip",
        current_date=today,
        reference_et0_mm=5.0,
        forecast_rain_24h_mm=0.0,
        current_depletion_mm=130.0,  # exceeds RAW (123.5)
    )
    assert plan_dry["should_irrigate"] is True
    assert plan_dry["rain_skip_triggered"] is False
    assert plan_dry["litres_saved"] == 0.0
    assert plan_dry["litres_needed"] > 0.0

    # Scenario 2: Rain forecast = 22 mm in 24h (rain-skip triggered!)
    plan_rain = engine.calculate_plan(
        crop_name="cotton",
        planting_date=planting,
        area_acres=2.0,
        soil_type="Black Cotton",
        irrigation_method="drip",
        current_date=today,
        reference_et0_mm=5.0,
        forecast_rain_24h_mm=22.0,
        current_depletion_mm=130.0,
    )
    assert plan_rain["should_irrigate"] is False
    assert plan_rain["rain_skip_triggered"] is True
    assert plan_rain["litres_saved"] > 0.0
    assert plan_rain["litres_saved"] == plan_rain["litres_needed"]
    assert "Skip irrigation today" in plan_rain["recommendation_text"]


def test_10_major_indian_crops_supported():
    """
    Asserts that at least 10 major Indian crops are verified in the Kc data table.
    """
    engine = irrigation_engine
    required_crops = [
        "rice", "wheat", "maize", "cotton", "groundnut",
        "chilli", "tomato", "sugarcane", "soybean", "pulses"
    ]
    for crop in required_crops:
        info = engine.get_crop_info(crop)
        assert info is not None, f"Crop {crop} missing from FAO-56 table"
        assert "kc_init" in info
        assert "kc_mid" in info
        assert "kc_late" in info
        assert "stage_lengths_days" in info
        assert info.get("verified") is True


# =====================================================================
# 2. Irrigation Problem Diagnostician Tests
# =====================================================================

def test_multilingual_text_issue_classifier():
    diag = IrrigationDiagnostician

    # English: waterlogging
    r_en1 = diag.classify_text_issue("water is stagnating in the field after rain")
    assert r_en1["category"] == "waterlogging"
    assert r_en1["severity"] == "HIGH"

    # English: water stress / wilting
    r_en2 = diag.classify_text_issue("leaves wilting in afternoon, soil is dry")
    assert r_en2["category"] == "water_stress"

    # Telugu: waterlogging
    r_te = diag.classify_text_issue("పొలంలో నీరు నిలవడం వల్ల మొక్కలు కుళ్ళిపోతున్నాయి")
    assert r_te["category"] == "waterlogging"

    # Telugu: wilting / water stress
    r_te2 = diag.classify_text_issue("ఎండకి ఆకులు వాడిపోవడం మరియు బీటలు పడ్డాయి")
    assert r_te2["category"] == "water_stress"

    # Hindi: source scarcity
    r_hi = diag.classify_text_issue("बोरवेल सूख गया है और पानी की बहुत कमी है")
    assert r_hi["category"] == "source_scarcity"

    # Salinity
    r_sal = diag.classify_text_issue("white crust on soil surface with leaf tip scorch")
    assert r_sal["category"] == "salinity"

    # Uneven distribution
    r_uneven = diag.classify_text_issue("drip nozzle blocked and uneven watering across rows")
    assert r_uneven["category"] == "uneven_distribution"


def test_visual_cues_and_finger_test_guide():
    """
    Validates image visual cues inspection, finger test guide, and PARTIAL status.
    """
    diag = IrrigationDiagnostician

    # Create dummy 100x100 RGB image
    img = Image.new("RGB", (100, 100), color=(50, 140, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    res = diag.diagnose(text_query="slight droop", image_bytes=img_bytes)
    assert res["status"] == "PARTIAL"
    assert "finger_test_guide" in res
    assert len(res["finger_test_guide"]["steps"]) == 4
    assert res["visual_cues"] is not None
    assert "visual_indicator_disclaimer" in res["visual_cues"]
    assert "Visual indication only" in res["visual_cues"]["visual_indicator_disclaimer"]


# =====================================================================
# 3. HTTP API Endpoints Tests (`/api/v1/irrigation`)
# =====================================================================

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


@pytest.fixture
def irrigation_test_farm(db_session: Session, demo_farmer: User) -> Farm:
    farm = Farm(
        user_id=demo_farmer.id,
        name="Ramesh Irrigation Holding",
        area=3.0,
        ownership_type=OwnershipType.OWNED,
        owned_area=3.0,
        leased_area=0.0,
        lease_amount=0.0,
        soil_type="Black Cotton",
        water_source="Borewell",
        irrigation_method=IrrigationMethod.DRIP,
        budget=60000.0,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.98,
        longitude=79.60,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    crop = CurrentCropCycle(
        farm_id=farm.id,
        crop_name="Cotton",
        variety="Bollgard II",
        planting_date=date(2026, 6, 10),
        current_stage=CropStage.VEGETATIVE,
        is_active=True,
    )
    db_session.add(crop)
    db_session.commit()
    return farm


def test_api_irrigation_plan_with_farm_id(client: TestClient, farmer_headers: dict, irrigation_test_farm: Farm):
    """
    Tests POST /api/v1/irrigation/plan with a registered farm holding.
    """
    payload = {
        "farm_id": irrigation_test_farm.id,
        "reference_et0_mm": 5.2,
        "rain_forecast_24h_mm": 0.0,
    }
    resp = client.post("/api/v1/irrigation/plan", json=payload, headers=farmer_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["crop_name"] == "Cotton"
    assert data["soil_type"] == "Black Cotton"
    assert data["irrigation_method"] == "drip"
    assert data["status"] == "WORKING"
    assert "daily_forecast_balance" in data
    assert len(data["daily_forecast_balance"]) == 7
    assert "explanation" in data
    assert data["explanation"]["confidence_type"] == "rule_based"
    assert data["explanation"]["confidence"] > 0.80


def test_api_irrigation_plan_standalone(client: TestClient, farmer_headers: dict):
    """
    Tests POST /api/v1/irrigation/plan with standalone custom parameters.
    """
    payload = {
        "crop_name": "Tomato",
        "planting_date": "2026-06-01",
        "soil_type": "Red Loam",
        "irrigation_method": "sprinkler",
        "area_acres": 1.5,
        "reference_et0_mm": 4.8,
        "rain_forecast_24h_mm": 0.0,
    }
    resp = client.post("/api/v1/irrigation/plan", json=payload, headers=farmer_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["crop_name"] == "Tomato"
    assert data["soil_type"] == "Red Loam"
    assert data["irrigation_method"] == "sprinkler"
    assert data["method_efficiency"] == 0.75
    assert data["status"] == "WORKING"


def test_api_irrigation_plan_unauthorized_farm(client: TestClient, other_farmer_headers: dict, irrigation_test_farm: Farm):
    """
    Asserts 403 Forbidden when accessing another farmer's holding.
    """
    payload = {"farm_id": irrigation_test_farm.id}
    resp = client.post("/api/v1/irrigation/plan", json=payload, headers=other_farmer_headers)
    assert resp.status_code == 403


def test_api_irrigation_diagnose_text(client: TestClient, farmer_headers: dict):
    """
    Tests POST /api/v1/irrigation/diagnose with text query.
    """
    resp = client.post(
        "/api/v1/irrigation/diagnose",
        data={"text_query": "Water is ponding and not draining from my field"},
        headers=farmer_headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["category"] == "waterlogging"
    assert data["status"] == "PARTIAL"
    assert len(data["suggestions"]) > 0
    assert "finger_test_guide" in data


def test_api_irrigation_diagnose_image_and_text(client: TestClient, farmer_headers: dict):
    """
    Tests POST /api/v1/irrigation/diagnose with image file and text.
    """
    img = Image.new("RGB", (120, 120), color=(180, 160, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("leaf_wilting.jpg", buf, "image/jpeg")}
    data = {"text_query": "leaves drooping in hot sun"}

    resp = client.post(
        "/api/v1/irrigation/diagnose",
        data=data,
        files=files,
        headers=farmer_headers,
    )
    assert resp.status_code == 200, resp.text
    res_data = resp.json()
    assert res_data["category"] == "water_stress"
    assert res_data["status"] == "PARTIAL"
    assert res_data["visual_cues"] is not None
    assert "visual_indicator_disclaimer" in res_data["visual_cues"]
