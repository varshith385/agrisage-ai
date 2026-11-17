from datetime import datetime, timedelta, timezone
import logging
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database.session import SessionLocal
from backend.app.main import app
from backend.app.models.market import MarketplaceInquiry, MarketplaceListing
from backend.app.models.user import User, UserRole
from backend.app.security.auth import create_access_token
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.services.market_service import (
    DATA_GOV_CONNECT_TIMEOUT,
    DATA_GOV_READ_TIMEOUT,
    DATA_GOV_TIMEOUT,
    DATA_GOV_USER_AGENT,
    LIVE_MANDI_FAILURE_CACHE_TTL_SECONDS,
    MAX_LIVE_AGE_DAYS,
    _LIVE_MANDI_CACHE,
    _LIVE_MANDI_FAILURE_CACHE,
    clear_live_mandi_cache,
    fetch_agmarknet_prices,
    haversine_distance,
    get_msp_comparison,
    get_net_realization_ranking,
    get_price_trends_and_forecast,
    get_nearby_warehouses,
)
from backend.app.services.voice_service import VoiceAssistantService


@pytest.fixture(autouse=True)
def clean_live_mandi_cache():
    clear_live_mandi_cache()
    yield
    clear_live_mandi_cache()


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

    # English query (what is the cotton price)
    res_en_price = await service.process_query(
        VoiceQueryRequest(query="what is the cotton price", language="en"), user=user, db=db
    )
    assert res_en_price.intent == "price"
    assert "Enumamula" in res_en_price.spoken_text or "mandi price" in res_en_price.spoken_text.lower()
    assert res_en_price.action_link == "/market"
    assert res_en_price.structured_data.get("market_data_available") is True

    # Hindi query (कपास का भाव क्या है)
    res_hi_price = await service.process_query(
        VoiceQueryRequest(query="कपास का भाव क्या है", language="hi"), user=user, db=db
    )
    assert res_hi_price.intent == "price"
    assert "मंडी" in res_hi_price.spoken_text or "भाव" in res_hi_price.spoken_text
    assert res_hi_price.action_link == "/market"
    assert res_hi_price.structured_data.get("market_data_available") is True

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


# -----------------------------------------------------------------------------
# 6. Data.gov.in Live API, User-Agent, Timeout, Logging & Cache Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_sends_custom_user_agent_and_timeout(monkeypatch):
    """Verifies that fetch_agmarknet_prices sends the custom User-Agent and configured timeouts."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7000,
                "max_price": 7500,
                "modal_price": 7250,
            }
        ]
    }

    captured_client_kwargs = {}

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            captured_client_kwargs.update(kwargs)

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")

    # Verify custom User-Agent header and Timeout on AsyncClient
    headers = captured_client_kwargs.get("headers", {})
    assert headers.get("User-Agent") == "Grow2Gain/1.0 (+https://github.com/varshith385/agrisage-ai)"
    assert headers.get("User-Agent") == DATA_GOV_USER_AGENT

    timeout_arg = captured_client_kwargs.get("timeout")
    assert timeout_arg == DATA_GOV_TIMEOUT
    assert timeout_arg.read == 8.0
    assert timeout_arg.connect == 4.0
    assert DATA_GOV_CONNECT_TIMEOUT == 4.0
    assert DATA_GOV_READ_TIMEOUT == 8.0

    assert is_demo is False
    assert len(records) == 1
    assert records[0].modal_price == 7250.0
    assert records[0].arrival_date == "2026-11-17"
    assert source == "AGMARKNET (api.data.gov.in / OGD India)"


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_logs_reason_without_secrets_on_exception(monkeypatch, caplog):
    """Verifies that exception logs only the exception class name without key, params, or URL, falling back to demo."""
    dummy_key = "super_secret_test_api_key_12345"
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", dummy_key)

    class FailingAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            raise httpx.ConnectTimeout("Connection timed out to external API")

    monkeypatch.setattr(httpx, "AsyncClient", FailingAsyncClient)

    with caplog.at_level(logging.WARNING):
        records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")

    # Must fall back honestly to demo data
    assert is_demo is True
    assert source == "Demo data (datasets/demo/mandi_prices.csv)"
    assert len(records) > 0

    # Verify log output: logs only exception class name, never the key, url, headers, or params
    log_text = caplog.text
    assert "AGMARKNET fallback: ConnectTimeout" in log_text
    assert dummy_key not in log_text
    assert "api-key" not in log_text
    assert "filters[" not in log_text
    assert "api.data.gov.in" not in log_text


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_logs_status_without_secrets_on_http_error(monkeypatch, caplog):
    """Verifies that non-200 HTTP response logs status code without secrets and falls back to demo."""
    dummy_key = "secret_key_http_error_test"
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", dummy_key)

    mock_resp = MagicMock()
    mock_resp.status_code = 503

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    with caplog.at_level(logging.WARNING):
        records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")

    assert is_demo is True
    assert source == "Demo data (datasets/demo/mandi_prices.csv)"
    log_text = caplog.text
    assert "AGMARKNET fallback: HTTP 503" in log_text
    assert dummy_key not in log_text
    assert "api-key" not in log_text


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_filters_mismatched_commodity(monkeypatch, caplog):
    """Verifies that mismatched commodities are dropped and falls through to demo if no matching records remain."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7000,
                "max_price": 7500,
                "modal_price": 7250,
            },
            {
                "market": "Khammam",
                "district": "Khammam",
                "state": "Telangana",
                "commodity": "Maize",
                "variety": "Yellow",
                "arrival_date": "17/11/2026",
                "min_price": 2000,
                "max_price": 2300,
                "modal_price": 2150,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    # 1. Fetching Cotton keeps Cotton and drops Maize
    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo is False
    assert len(records) == 1
    assert records[0].commodity == "Cotton"

    # 2. Fetching Potato when only Cotton and Maize returned drops all records and falls through to demo
    clear_live_mandi_cache()
    with caplog.at_level(logging.WARNING):
        records_potato, is_demo_potato, source_potato = await fetch_agmarknet_prices(
            "Potato", district="Warangal", state="Telangana"
        )
    assert is_demo_potato is True
    assert source_potato == "Demo data (datasets/demo/mandi_prices.csv)"
    assert "AGMARKNET fallback: no records" in caplog.text


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_uses_mapped_crop_name(monkeypatch):
    """Verifies that app crop names (e.g. Paddy (Dhan)) use mapped API commodity in filter and matching."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    captured_params = {}
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Paddy(Common)",
                "variety": "BPT 5204",
                "arrival_date": "17/11/2026",
                "min_price": 2200,
                "max_price": 2400,
                "modal_price": 2320,
            },
            {
                "market": "Suryapet",
                "district": "Suryapet",
                "state": "Telangana",
                "commodity": "Paddy(Fine/Superfine/Grade A)",
                "variety": "Grade A",
                "arrival_date": "16/11/2026",
                "min_price": 2300,
                "max_price": 2500,
                "modal_price": 2420,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            captured_params.update(params or {})
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Paddy (Dhan)", district="Warangal", state="Telangana")

    # Mapped commodity was sent in API filter
    assert captured_params.get("filters[commodity]") == "Paddy(Common)"
    assert is_demo is False
    # Both Paddy varieties are matched and kept
    assert len(records) == 2
    assert records[0].commodity == "Paddy(Common)"
    assert records[1].commodity == "Paddy(Fine/Superfine/Grade A)"


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_in_memory_cache(monkeypatch):
    """Verifies that second call within 15 minutes uses in-memory cache and makes only one HTTP call."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    http_call_count = 0
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7000,
                "max_price": 7500,
                "modal_price": 7250,
            }
        ]
    }

    class CountingAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            nonlocal http_call_count
            http_call_count += 1
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", CountingAsyncClient)

    # First call - triggers HTTP get
    records1, is_demo1, source1 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo1 is False
    assert http_call_count == 1
    assert len(records1) == 1

    # Second call - within 15 minutes, returns cached result without making HTTP get
    records2, is_demo2, source2 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo2 is False
    assert http_call_count == 1
    assert len(records2) == 1
    assert records2[0].modal_price == 7250.0

    # Clearing cache forces next call to fetch via HTTP
    clear_live_mandi_cache()
    records3, is_demo3, source3 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo3 is False
    assert http_call_count == 2


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_demo_results_never_cached(monkeypatch):
    """Verifies that demo fallback results are never stored in the live in-memory cache."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    class FailingAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            raise httpx.ConnectTimeout("Down")

    monkeypatch.setattr(httpx, "AsyncClient", FailingAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo is True
    assert source == "Demo data (datasets/demo/mandi_prices.csv)"

    # Live cache must remain completely empty
    assert len(_LIVE_MANDI_CACHE) == 0


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_dates_converted_and_sorted(monkeypatch):
    """Verifies date conversion from DD/MM/YYYY to YYYY-MM-DD, newest-first sorting, and skipping bad date rows."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Mandi Older",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "12/11/2026",
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": 7000,
            },
            {
                "market": "Mandi Newest",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7100,
                "max_price": 7600,
                "modal_price": 7350,
            },
            {
                "market": "Mandi Invalid Date",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "corrupted-date-string",
                "min_price": 6500,
                "max_price": 7000,
                "modal_price": 6750,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo is False
    # Bad row with corrupted-date-string is skipped; remaining 2 rows are kept and sorted newest-first
    assert len(records) == 2

    assert records[0].mandi == "Mandi Newest"
    assert records[0].arrival_date == "2026-11-17"

    assert records[1].mandi == "Mandi Older"
    assert records[1].arrival_date == "2026-11-12"


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_rice_never_accepts_paddy(monkeypatch):
    """Verifies that requesting Rice strictly matches Rice and never accepts Paddy commodities."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Paddy(Common)",
                "variety": "Common",
                "arrival_date": "17/11/2026",
                "min_price": 2200,
                "max_price": 2400,
                "modal_price": 2300,
            },
            {
                "market": "Miryalaguda",
                "district": "Nalgonda",
                "state": "Telangana",
                "commodity": "Rice",
                "variety": "Sona Masuri",
                "arrival_date": "17/11/2026",
                "min_price": 3500,
                "max_price": 3800,
                "modal_price": 3650,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Rice", district="Nalgonda", state="Telangana")
    assert is_demo is False
    assert len(records) == 1
    assert records[0].commodity == "Rice"
    assert records[0].mandi == "Miryalaguda"


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_chilli_dry_never_accepts_green_chilli(monkeypatch):
    """Verifies that chilli (dry) accepts only Dry Chillies and never Green Chilli."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Warangal Mandi",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Green Chilli",
                "variety": "Local",
                "arrival_date": "17/11/2026",
                "min_price": 3000,
                "max_price": 3500,
                "modal_price": 3200,
            },
            {
                "market": "Khammam Mandi",
                "district": "Khammam",
                "state": "Telangana",
                "commodity": "Dry Chillies",
                "variety": "Teja",
                "arrival_date": "17/11/2026",
                "min_price": 18000,
                "max_price": 21000,
                "modal_price": 19500,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("chilli (dry)", district="Khammam", state="Telangana")
    assert is_demo is False
    assert len(records) == 1
    assert records[0].commodity == "Dry Chillies"
    assert records[0].modal_price == 19500


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_unmapped_crops_zero_http_calls_and_demo(monkeypatch, caplog):
    """Verifies that unmapped or ambiguous crops (plain chilli, banana, groundnut) make zero HTTP calls and return demo."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    http_calls = 0

    class NonCallingAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            nonlocal http_calls
            http_calls += 1
            raise AssertionError("HTTP call must not be made for unmapped crops!")

    monkeypatch.setattr(httpx, "AsyncClient", NonCallingAsyncClient)

    unmapped_crops = ["chilli", "banana", "groundnut", "dragonfruit", "papaya"]
    for crop in unmapped_crops:
        caplog.clear()
        with caplog.at_level(logging.WARNING):
            records, is_demo, source = await fetch_agmarknet_prices(crop, district="Warangal", state="Telangana")

        assert is_demo is True
        assert source == "Demo data (datasets/demo/mandi_prices.csv)"
        assert len(records) > 0
        assert "AGMARKNET skipped: crop not mapped" in caplog.text

    assert http_calls == 0


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_loose_filter_response_keeps_only_allowed(monkeypatch):
    """Verifies that loose API filter response mixing commodities keeps only the allowed ones."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Dry Chillies",
                "variety": "Guntur",
                "arrival_date": "17/11/2026",
                "min_price": 17000,
                "max_price": 20000,
                "modal_price": 18500,
            },
            {
                "market": "Mandi 2",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Dry Fodder",
                "variety": "Common",
                "arrival_date": "17/11/2026",
                "min_price": 500,
                "max_price": 800,
                "modal_price": 650,
            },
            {
                "market": "Mandi 3",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Ginger(Dry)",
                "variety": "Common",
                "arrival_date": "17/11/2026",
                "min_price": 12000,
                "max_price": 15000,
                "modal_price": 13500,
            },
            {
                "market": "Mandi 4",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Peas(Dry)",
                "variety": "Common",
                "arrival_date": "17/11/2026",
                "min_price": 4000,
                "max_price": 5000,
                "modal_price": 4500,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("dry chilli", district="Warangal", state="Telangana")
    assert is_demo is False
    assert len(records) == 1
    assert records[0].commodity == "Dry Chillies"
    assert records[0].modal_price == 18500


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_skips_bad_rows_without_losing_others(monkeypatch):
    """Verifies that rows with missing arrival_date or non-numeric prices are skipped without losing valid rows."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Mandi Valid 1",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7000,
                "max_price": 7500,
                "modal_price": 7250,
            },
            {
                "market": "Mandi Bad Date 1",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": None,
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": 7000,
            },
            {
                "market": "Mandi Bad Date 2",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "",
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": 7000,
            },
            {
                "market": "Mandi Bad Price Non-Numeric",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": "N/A",
                "max_price": 7200,
                "modal_price": 7000,
            },
            {
                "market": "Mandi Bad Price Modal None",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": None,
            },
            {
                "market": "Mandi Valid 2",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "16/11/2026",
                "min_price": 6900,
                "max_price": 7400,
                "modal_price": 7150,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo is False
    assert len(records) == 2
    assert records[0].mandi == "Mandi Valid 1"
    assert records[0].arrival_date == "2026-11-17"
    assert records[1].mandi == "Mandi Valid 2"
    assert records[1].arrival_date == "2026-11-16"


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_drops_old_records(monkeypatch, caplog):
    """Verifies that records older than MAX_LIVE_AGE_DAYS (14 days) are dropped, and logs 'no recent records' if none remain."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    now = datetime.now(timezone.utc)
    recent_date_str = (now - timedelta(days=3)).strftime("%d/%m/%Y")
    old_date_str = (now - timedelta(days=20)).strftime("%d/%m/%Y")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Recent Mandi",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": recent_date_str,
                "min_price": 7100,
                "max_price": 7600,
                "modal_price": 7350,
            },
            {
                "market": "Old Mandi",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": old_date_str,
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": 7000,
            },
        ]
    }

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            return mock_resp

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    # 1. Recent record kept, old record dropped
    records, is_demo, source = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo is False
    assert len(records) == 1
    assert records[0].mandi == "Recent Mandi"

    # 2. When all records are older than MAX_LIVE_AGE_DAYS, none remain -> logs 'no recent records' and returns demo fallback
    clear_live_mandi_cache()
    mock_resp.json.return_value = {
        "records": [
            {
                "market": "Old Mandi Only",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": old_date_str,
                "min_price": 6800,
                "max_price": 7200,
                "modal_price": 7000,
            }
        ]
    }

    with caplog.at_level(logging.WARNING):
        records_old, is_demo_old, source_old = await fetch_agmarknet_prices(
            "Cotton", district="Warangal", state="Telangana"
        )
    assert is_demo_old is True
    assert source_old == "Demo data (datasets/demo/mandi_prices.csv)"
    assert "AGMARKNET fallback: no recent records" in caplog.text


@pytest.mark.asyncio
async def test_fetch_agmarknet_prices_short_failure_cache_and_later_success(monkeypatch):
    """Verifies failure is cached for 120s (preventing repeated 8s waits), and a later success is not blocked."""
    monkeypatch.setattr(settings, "DATA_GOV_IN_API_KEY", "dummy_test_api_key")

    http_call_count = 0
    should_fail = True

    mock_success_resp = MagicMock()
    mock_success_resp.status_code = 200
    mock_success_resp.json.return_value = {
        "records": [
            {
                "market": "Enumamula",
                "district": "Warangal",
                "state": "Telangana",
                "commodity": "Cotton",
                "variety": "FAQ",
                "arrival_date": "17/11/2026",
                "min_price": 7000,
                "max_price": 7500,
                "modal_price": 7250,
            }
        ]
    }

    class FlakyAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def get(self, url, params=None, **kwargs):
            nonlocal http_call_count
            http_call_count += 1
            if should_fail:
                raise httpx.ReadTimeout("Simulated API timeout")
            return mock_success_resp

    monkeypatch.setattr(httpx, "AsyncClient", FlakyAsyncClient)

    # Call 1: fails and stores failure in failure cache
    records1, is_demo1, source1 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo1 is True
    assert source1 == "Demo data (datasets/demo/mandi_prices.csv)"
    assert http_call_count == 1
    cache_key = ("cotton", "warangal", "telangana")
    assert cache_key in _LIVE_MANDI_FAILURE_CACHE

    # Call 2: within 120 seconds, immediately goes to demo fallback WITHOUT making HTTP get
    records2, is_demo2, source2 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo2 is True
    assert source2 == "Demo data (datasets/demo/mandi_prices.csv)"
    assert http_call_count == 1  # No additional HTTP call made

    # Call 3: after cache clear, when API recovers, HTTP call is made and later success is NOT blocked
    clear_live_mandi_cache()
    assert cache_key not in _LIVE_MANDI_FAILURE_CACHE

    should_fail = False
    records3, is_demo3, source3 = await fetch_agmarknet_prices("Cotton", district="Warangal", state="Telangana")
    assert is_demo3 is False
    assert source3 == "AGMARKNET (api.data.gov.in / OGD India)"
    assert http_call_count == 2
    assert len(records3) == 1
    assert records3[0].modal_price == 7250
    assert cache_key not in _LIVE_MANDI_FAILURE_CACHE
    assert cache_key in _LIVE_MANDI_CACHE

