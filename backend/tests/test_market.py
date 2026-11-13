import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.main import app
from backend.app.models.market import MarketplaceInquiry, MarketplaceListing
from backend.app.models.user import User, UserRole
from backend.app.security.auth import create_access_token
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.services.market_service import (
    haversine_distance,
    get_msp_comparison,
    get_net_realization_ranking,
    get_price_trends_and_forecast,
    get_nearby_warehouses,
)
from backend.app.services.voice_service import VoiceAssistantService


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def farmer_token(db: Session):
    farmer = db.query(User).filter(User.role == UserRole.FARMER).first()
    assert farmer is not None
    return create_access_token({"sub": str(farmer.id), "role": farmer.role.value}), farmer


@pytest.fixture
def buyer_token(db: Session):
    buyer = db.query(User).filter(User.role == UserRole.BUYER).first()
    assert buyer is not None
    return create_access_token({"sub": str(buyer.id), "role": buyer.role.value}), buyer


@pytest.fixture
def admin_token(db: Session):
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    assert admin is not None
    return create_access_token({"sub": str(admin.id), "role": admin.role.value}), admin


# -----------------------------------------------------------------------------
# 1. Net Realization Math & Haversine Distance Tests
# -----------------------------------------------------------------------------
def test_haversine_distance_calculation():
    # Distance between Warangal (17.9689, 79.5941) and Khammam (17.2473, 80.1514)
    dist = haversine_distance(17.9689, 79.5941, 17.2473, 80.1514)
    assert 95.0 < dist < 105.0  # Around ~100 km

    # Distance to identical coordinate is 0.0
    dist_zero = haversine_distance(17.9689, 79.5941, 17.9689, 79.5941)
    assert dist_zero == 0.0


@pytest.mark.asyncio
async def test_net_realization_math_and_ranking():
    qty = 20.0
    rate = 2.50
    fee_pct = 1.0
    lat, lon = 17.9689, 79.5941  # Farmer Ramesh in Geikonda, Warangal

    res = await get_net_realization_ranking(
        crop="Cotton",
        quantity_quintals=qty,
        lat=lat,
        lon=lon,
        transport_rate=rate,
        market_fee_pct=fee_pct,
    )

    assert res.crop == "Cotton"
    assert res.quantity_quintals == 20.0
    assert len(res.rankings) > 0

    # Verify mathematical formula on every ranking item
    for item in res.rankings:
        expected_gross = item.modal_price * qty
        expected_transport = item.distance_km * rate * qty
        expected_fee = (fee_pct / 100.0) * expected_gross
        expected_net = expected_gross - expected_transport - expected_fee

        assert abs(item.gross_revenue - expected_gross) < 0.01
        assert abs(item.transport_cost - expected_transport) < 0.01
        assert abs(item.market_fee - expected_fee) < 0.01
        assert abs(item.net_realization - expected_net) < 0.01
        assert "Gross ₹" in item.reasoning
        assert "transport" in item.reasoning.lower()
        assert "Net take-home" in item.reasoning

    # Verify descending sort order by net realization
    for i in range(len(res.rankings) - 1):
        assert res.rankings[i].net_realization >= res.rankings[i + 1].net_realization
        assert res.rankings[i].rank == i + 1


# -----------------------------------------------------------------------------
# 2. MSP Comparison & Official Citations Tests
# -----------------------------------------------------------------------------
def test_msp_comparison_cotton_unverified():
    res = get_msp_comparison(crop="Cotton", expected_price=7200.0)
    assert res.msp_verified is False
    assert res.status_label == "msp_not_verified"
    assert "MSP not verified" in res.explanation
    assert res.last_verified is None


def test_msp_comparison_paddy_unverified():
    res = get_msp_comparison(crop="Paddy", expected_price=2450.0)
    assert res.msp_verified is False
    assert res.status_label == "msp_not_verified"
    assert "MSP not verified" in res.explanation
    assert res.last_verified is None


def test_msp_comparison_unverified_horticultural_crop():
    # Chilli and Tomato have no central Government MSP
    res_chilli = get_msp_comparison(crop="Chilli", expected_price=16000.0)
    assert res_chilli.msp_verified is False
    assert res_chilli.benchmark is None
    assert res_chilli.status_label == "msp_not_verified"
    assert "MSP not verified" in res_chilli.explanation

    res_tomato = get_msp_comparison(crop="Tomato", expected_price=1500.0)
    assert res_tomato.msp_verified is False
    assert res_tomato.status_label == "msp_not_verified"


# -----------------------------------------------------------------------------
# 3. Mandi Price Service API & Fallback Tests
# -----------------------------------------------------------------------------
def test_mandi_prices_api_endpoint(client: TestClient):
    response = client.get("/api/v1/market/prices?crop=Cotton")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Cotton"
    assert "prices" in data
    assert len(data["prices"]) > 0
    assert "source" in data
    assert "fetched_at" in data
    assert "demo" in data  # demo=True when key is missing or AGMARKNET fails

    record = data["prices"][0]
    assert "modal_price" in record
    assert "min_price" in record
    assert "max_price" in record
    assert "arrival_date" in record
    assert "mandi" in record


def test_net_realization_ranking_api_endpoint(client: TestClient):
    response = client.get("/api/v1/market/ranking?crop=Cotton&quantity=15&transport_rate=3.0&market_fee_pct=1.5")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Cotton"
    assert data["quantity_quintals"] == 15.0
    assert data["transport_rate_assumption"] == 3.0
    assert data["market_fee_pct_assumption"] == 1.5
    assert len(data["rankings"]) > 0
    assert data["rankings"][0]["rank"] == 1


def test_price_trends_and_warehouses_api_endpoints(client: TestClient):
    # Trends endpoint
    res_trends = client.get("/api/v1/market/trends?crop=Cotton")
    assert res_trends.status_code == 200
    data_trends = res_trends.json()
    assert data_trends["crop"] == "Cotton"
    assert len(data_trends["historical_prices"]) > 0
    assert len(data_trends["forecast_prices"]) > 0
    assert "best_time_to_sell_hint" in data_trends
    assert data_trends.get("error_margin_pct") is None
    assert data_trends["demo"] is True

    # Warehouses endpoint
    res_warehouses = client.get("/api/v1/market/warehouses?lat=17.9689&lon=79.5941")
    assert res_warehouses.status_code == 200
    data_warehouses = res_warehouses.json()
    assert len(data_warehouses["warehouses"]) > 0
    assert data_warehouses["demo"] is True
    assert data_warehouses["warehouses"][0]["distance_km"] is not None


# -----------------------------------------------------------------------------
# 4. Farmer-to-Buyer Marketplace Permissions & Privacy Tests
# -----------------------------------------------------------------------------
def test_marketplace_listing_crud_and_owner_permissions(client: TestClient, farmer_token, buyer_token):
    f_token, farmer = farmer_token
    b_token, buyer = buyer_token

    # 1. Farmer creates listing
    create_payload = {
        "crop_name": "Maize",
        "variety": "Yellow Hybrid",
        "quantity_quintals": 50.0,
        "expected_price_per_q": 2250.0,
        "state": "Telangana",
        "district": "Warangal",
        "village": "Geikonda",
        "harvest_date": "2027-02-10",
        "description": "Clean dry maize grain, moisture 12%.",
    }
    res_create = client.post(
        "/api/v1/marketplace/listings",
        json=create_payload,
        headers={"Authorization": f"Bearer {f_token}"},
    )
    assert res_create.status_code == 201
    listing_id = res_create.json()["id"]

    # 2. Buyer attempts to edit farmer's listing -> MUST return 403 Forbidden
    update_payload = {"expected_price_per_q": 1900.0}
    res_illegal_edit = client.put(
        f"/api/v1/marketplace/listings/{listing_id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_illegal_edit.status_code == 403
    assert "Permission denied" in res_illegal_edit.json()["detail"]

    # 3. Farmer owner edits listing -> MUST succeed
    res_legal_edit = client.put(
        f"/api/v1/marketplace/listings/{listing_id}",
        json={"expected_price_per_q": 2300.0},
        headers={"Authorization": f"Bearer {f_token}"},
    )
    assert res_legal_edit.status_code == 200
    assert res_legal_edit.json()["expected_price_per_q"] == 2300.0

    # 4. Buyer attempts to delete farmer's listing -> MUST return 403 Forbidden
    res_illegal_del = client.delete(
        f"/api/v1/marketplace/listings/{listing_id}",
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_illegal_del.status_code == 403

    # 5. Farmer owner deletes listing -> MUST succeed
    res_legal_del = client.delete(
        f"/api/v1/marketplace/listings/{listing_id}",
        headers={"Authorization": f"Bearer {f_token}"},
    )
    assert res_legal_del.status_code == 200


def test_marketplace_buyer_privacy_and_contact_unlock_workflow(
    client: TestClient, farmer_token, buyer_token, db: Session
):
    f_token, farmer = farmer_token
    b_token, buyer = buyer_token

    # Create a fresh isolated listing owned by Farmer
    fresh_listing = MarketplaceListing(
        farmer_id=farmer.id,
        crop_name="Turmeric",
        variety="Salem",
        quantity_quintals=25.0,
        expected_price_per_q=9500.0,
        state="Telangana",
        district="Warangal",
        village="Geikonda",
        harvest_date="2027-03-01",
        description="Fresh organic turmeric.",
        status="active",
        is_verified_seller=False,
    )
    db.add(fresh_listing)
    db.commit()
    db.refresh(fresh_listing)
    listing = fresh_listing

    # 1. Buyer views listings: farmer contact details MUST be hidden (contact_unlocked=False, farmer_contact=None)
    res_view = client.get(
        f"/api/v1/marketplace/listings/{listing.id}",
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_view.status_code == 200
    listing_data = res_view.json()
    assert listing_data["contact_unlocked"] is False
    assert listing_data["farmer_contact"] is None

    # 2. Buyer submits inquiry
    inq_payload = {
        "listing_id": listing.id,
        "offered_price_per_q": 7150.0,
        "quantity_quintals": 20.0,
        "message": "Interested in bulk procurement at farm gate.",
    }
    res_inq = client.post(
        "/api/v1/marketplace/inquiries",
        json=inq_payload,
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_inq.status_code == 201
    inquiry_id = res_inq.json()["id"]

    # In pending state, buyer STILL cannot see farmer contact details!
    assert res_inq.json()["contact_unlocked"] is False
    assert res_inq.json()["farmer_contact"] is None

    # 3. Another user (e.g. buyer themselves) attempts to accept the inquiry -> MUST return 403 Forbidden
    res_illegal_accept = client.put(
        f"/api/v1/marketplace/inquiries/{inquiry_id}/status",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_illegal_accept.status_code == 403

    # 4. Farmer owner accepts the inquiry -> MUST succeed and unlock contact details
    res_legal_accept = client.put(
        f"/api/v1/marketplace/inquiries/{inquiry_id}/status",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {f_token}"},
    )
    assert res_legal_accept.status_code == 200
    assert res_legal_accept.json()["status"] == "accepted"
    assert res_legal_accept.json()["contact_unlocked"] is True
    assert res_legal_accept.json()["farmer_contact"] is not None
    assert res_legal_accept.json()["farmer_contact"]["full_name"] == farmer.full_name

    # 5. Buyer now checks their inquiries: contact is now UNLOCKED!
    res_buyer_inquiries = client.get(
        "/api/v1/marketplace/inquiries",
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert res_buyer_inquiries.status_code == 200
    buyer_inqs = res_buyer_inquiries.json()
    matched_inq = next((i for i in buyer_inqs if i["id"] == inquiry_id), None)
    assert matched_inq is not None
    assert matched_inq["contact_unlocked"] is True
    assert matched_inq["farmer_contact"] is not None
    assert matched_inq["farmer_contact"]["phone_number"] == farmer.phone_number


def test_admin_verified_seller_badge_workflow(
    client: TestClient, farmer_token, buyer_token, admin_token, db: Session
):
    f_token, farmer = farmer_token
    b_token, buyer = buyer_token
    a_token, admin = admin_token

    listing = db.query(MarketplaceListing).filter(MarketplaceListing.farmer_id == farmer.id).first()
    assert listing is not None

    # 1. Non-admin (buyer or farmer) tries to grant verification badge -> 403 Forbidden
    res_unauth = client.put(
        f"/api/v1/marketplace/farmers/{farmer.id}/verify",
        json={"verified": True},
        headers={"Authorization": f"Bearer {f_token}"},
    )
    assert res_unauth.status_code == 403

    # 2. Admin grants verified badge -> 200 OK
    res_admin = client.put(
        f"/api/v1/marketplace/farmers/{farmer.id}/verify",
        json={"verified": True},
        headers={"Authorization": f"Bearer {a_token}"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["verified"] is True

    # Check listing reflection
    res_check = client.get(f"/api/v1/marketplace/listings/{listing.id}")
    assert res_check.status_code == 200
    assert res_check.json()["is_verified_seller"] is True


# -----------------------------------------------------------------------------
# 5. Voice Assistant Price Intent Test
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_voice_assistant_price_intent(db: Session):
    service = VoiceAssistantService()
    user = db.query(User).filter(User.role == UserRole.FARMER).first()

    # Telugu query
    res_te = await service.process_query(
        VoiceQueryRequest(query="పత్తి ధర ఎంత ఉంది?", language="te"), user=user, db=db
    )
    assert res_te.intent == "price"
    assert "ఎనుమాముల" in res_te.spoken_text or "ధర" in res_te.spoken_text
    assert res_te.action_link == "/market"
    assert res_te.structured_data.get("market_data_available") is True

    # English query
    res_en = await service.process_query(
        VoiceQueryRequest(query="What is the current mandi market price for cotton?", language="en"),
        user=user,
        db=db,
    )
    assert res_en.intent == "price"
    assert "Enumamula" in res_en.spoken_text or "mandi price" in res_en.spoken_text
    assert res_en.action_link == "/market"

    # Hindi query
    res_hi = await service.process_query(
        VoiceQueryRequest(query="कपास का मंडी भाव क्या है?", language="hi"), user=user, db=db
    )
    assert res_hi.intent == "price"
    assert "मंडी" in res_hi.spoken_text or "भाव" in res_hi.spoken_text
    assert res_hi.action_link == "/market"
