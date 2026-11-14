"""
Unit and integration tests for Irrigation Consistency (Safety & Agronomic Accuracy).
Verifies:
1. Exact agreement across Irrigation Endpoint (/api/v1/irrigation/plan),
   Dashboard Context Packet (build_farm_context_packet), and Voice/Chat Assistant (_handle_irrigation).
2. Mathematical verification of the FAO-56 litres formula:
   litres = gross_depth_mm * area_acres * 4046.8564224
   where gross_depth_mm = net_depth_mm / efficiency.
3. Verification across 3 farm sizes (1.0 ac, 5.0 ac, 10.0 ac) and both Drip (0.90) and Flood (0.50) efficiencies.
4. Rejection of unphysical figures (150,000 L, 1,133,120 L).
"""

from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.database.session import Base, SessionLocal, engine
from backend.app.main import app
from backend.app.ml.irrigation import FAO56IrrigationEngine, LITRES_PER_ACRE_MM
from backend.app.models.farm import CropStage, CurrentCropCycle, Farm, IrrigationMethod, OwnershipType
from backend.app.models.user import Language, User, UserRole
from backend.app.security.auth import create_access_token, hash_password
from backend.app.services.context_packet import build_farm_context_packet
from backend.app.services.voice_service import VoiceAssistantService


@pytest.fixture(scope="module")
def setup_consistency_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    email = "irrigation_consistency@agrisage.internal"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=hash_password("ConsistencyPass@2026"),
            full_name="Consistency Farmer Ramesh",
            phone_number="9876543288",
            role=UserRole.FARMER,
            preferred_language=Language.EN,
            is_active=True,
            is_demo_account=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    if not farm:
        farm = Farm(
            user_id=user.id,
            name="Rameshwaram Holding Consistency",
            area=5.0,
            ownership_type=OwnershipType.OWNED,
            owned_area=5.0,
            leased_area=0.0,
            lease_amount=0.0,
            soil_type="Red Loam",
            water_source="borewell",
            irrigation_method=IrrigationMethod.DRIP,
            budget=250000.0,
            village="Geesugonda",
            district="Warangal",
            state="Telangana",
            latitude=17.9689,
            longitude=79.5941,
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        cycle = CurrentCropCycle(
            farm_id=farm.id,
            crop_name="Cotton",
            variety="Bt Cotton RCH-2",
            planting_date=date.today() - timedelta(days=90),
            current_stage=CropStage.VEGETATIVE,
            is_active=True,
        )
        db.add(cycle)
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    orig_groq = settings.GROQ_API_KEY
    orig_gemini = settings.GEMINI_API_KEY
    settings.GROQ_API_KEY = ""
    settings.GEMINI_API_KEY = ""
    yield {"user": user, "farm": farm, "token": token, "db": db}
    settings.GROQ_API_KEY = orig_groq
    settings.GEMINI_API_KEY = orig_gemini
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


def test_irrigation_litres_formula_farm_sizes_and_efficiencies():
    """
    Verifies that litres calculation strictly follows the physical formula:
    litres = gross_depth_mm * area_acres * 4046.8564224
    where gross_depth_mm = round(net_depth_mm / efficiency, 2)
    across 3 farm sizes and drip vs flood efficiency.
    """
    net_depth_mm = 25.0
    farm_sizes = [1.0, 5.0, 10.0]
    methods = [
        ("drip", 0.90),
        ("flood", 0.50),
    ]

    for area in farm_sizes:
        for method_name, efficiency in methods:
            gross_depth_mm = round(net_depth_mm / efficiency, 2)
            calculated_litres = round(gross_depth_mm * area * LITRES_PER_ACRE_MM, 0)

            # Mathematical check
            assert gross_depth_mm > 0
            assert calculated_litres > 0

            if method_name == "drip":
                # Gross depth: 25.0 / 0.90 = 27.78 mm
                assert gross_depth_mm == 27.78
                if area == 1.0:
                    assert calculated_litres == 112422.0
                elif area == 5.0:
                    assert calculated_litres == 562108.0
                elif area == 10.0:
                    assert calculated_litres == 1124217.0
            elif method_name == "flood":
                # Gross depth: 25.0 / 0.50 = 50.00 mm
                assert gross_depth_mm == 50.00
                if area == 1.0:
                    assert calculated_litres == 202343.0
                elif area == 5.0:
                    assert calculated_litres == 1011714.0
                elif area == 10.0:
                    assert calculated_litres == 2023428.0

            # Verify that neither 150,000 nor 1,133,120 is returned for 5.0 acres
            if area == 5.0:
                assert calculated_litres != 150000
                assert calculated_litres != 1133120


@pytest.mark.asyncio
async def test_irrigation_consistency_across_chat_context_and_endpoint(setup_consistency_db, client):
    """
    Verifies that for the exact same farm holding:
    1. The irrigation endpoint (/api/v1/irrigation/plan)
    2. The dashboard context packet (build_farm_context_packet)
    3. The chat voice assistant response (_handle_irrigation)
    agree on:
    - irrigate decision (should_irrigate / irrigate_now)
    - next irrigation date (next_irrigation_date)
    - gross depth needed today (gross_depth_mm)
    - litres needed today (litres_needed)
    """
    user = setup_consistency_db["user"]
    farm = setup_consistency_db["farm"]
    db = setup_consistency_db["db"]
    token = setup_consistency_db["token"]

    # 1. Irrigation Endpoint
    headers = {"Authorization": f"Bearer {token}"}
    plan_req = {
        "farm_id": farm.id,
        "crop_name": "Cotton",
        "soil_type": "Red Loam",
        "irrigation_method": "drip",
        "area_acres": 5.0,
        "reference_et0_mm": 4.5,
        "rain_forecast_24h_mm": 0.0,
    }
    ep_res = client.post("/api/v1/irrigation/plan", json=plan_req, headers=headers)
    assert ep_res.status_code == 200
    plan_data = ep_res.json()

    # 2. Context Packet (Dashboard source of truth)
    context_packet = await build_farm_context_packet(user, farm, db)
    irr_packet = context_packet["irrigation"]

    # 3. Chat / Voice Assistant
    voice_svc = VoiceAssistantService()
    voice_res_en = await voice_svc._handle_irrigation(user, farm, lang="en", db=db)
    voice_res_te = await voice_svc._handle_irrigation(user, farm, lang="te", db=db)
    voice_res_hi = await voice_svc._handle_irrigation(user, farm, lang="hi", db=db)

    # Verification: Endpoint and Context Packet must EXACTLY agree
    assert plan_data["should_irrigate"] == irr_packet["irrigate_now"]
    assert plan_data["next_irrigation_date"] == irr_packet["next_irrigation_date"]
    assert round(plan_data["gross_depth_mm"], 1) == round(irr_packet["gross_depth_mm"], 1)
    assert round(plan_data["litres_needed"], 0) == round(irr_packet["litres_needed"], 0)

    # Verification: Chat Assistant must agree with Endpoint & Context Packet
    assert voice_res_en.structured_data["irrigate_now"] == plan_data["should_irrigate"]
    assert voice_res_en.structured_data["next_irrigation_date"] == plan_data["next_irrigation_date"]

    if not plan_data["should_irrigate"]:
        # If no watering is needed today:
        # Chat must say "No watering needed today. Next watering is on <date>"
        assert "No watering needed today" in voice_res_en.spoken_text
        assert plan_data["next_irrigation_date"] in voice_res_en.spoken_text
        # Must NOT present depth or litres as if water is needed today!
        assert "Target application depth" not in voice_res_en.spoken_text
        assert "litres" not in voice_res_en.spoken_text

        # Telugu check
        assert "నీరు పెట్టాల్సిన అవసరం లేదు" in voice_res_te.spoken_text
        assert plan_data["next_irrigation_date"] in voice_res_te.spoken_text

        # Hindi check
        assert "सिंचाई की आवश्यकता नहीं है" in voice_res_hi.spoken_text
        assert plan_data["next_irrigation_date"] in voice_res_hi.spoken_text

        # Litres needed today in packet and endpoint must be 0
        assert irr_packet["litres_needed"] == 0.0
        assert plan_data["litres_needed"] == 0.0
        assert irr_packet["gross_depth_mm"] == 0.0
        assert plan_data["gross_depth_mm"] == 0.0
    else:
        # If watering IS needed today:
        assert str(round(plan_data["gross_depth_mm"], 1)) in voice_res_en.spoken_text
        assert f"{int(round(plan_data['litres_needed'])):,}" in voice_res_en.spoken_text
