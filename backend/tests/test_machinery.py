from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import Farm, OwnershipType
from backend.app.models.machinery import MachineryListing, MachineryBooking
from backend.app.security.auth import hash_password, create_access_token
from backend.app.services.machinery_service import haversine_distance


def test_machinery_guide_and_source_citation(client: TestClient):
    res = client.get("/api/v1/machinery/guide?crop=Cotton")
    assert res.status_code == 200
    data = res.json()
    assert data["crop"] == "Cotton"
    assert data["total_stages"] >= 4
    assert len(data["stages"]) >= 4

    # Verify stage content and indicative citation
    prep_stage = data["stages"][0]
    assert prep_stage["stage"] == "Land Preparation"
    assert "Tractor" in prep_stage["recommended_machinery"]
    assert "Indicative, to verify. Not from a published source." in prep_stage["source_note"] or "Indicative, to verify. Not from a published source." in data["source_citation"]

    # Test all crops overview
    all_res = client.get("/api/v1/machinery/guide")
    assert all_res.status_code == 200
    assert "Cotton" in all_res.json()["supported_crops"]


def test_haversine_distance_precision():
    # Geikonda (17.9689, 79.5941) to Dharmasagar (17.9944, 79.4589)
    # Expected approx 14.5 - 15.0 km
    dist = haversine_distance(17.9689, 79.5941, 17.9944, 79.4589)
    assert 14.0 <= dist <= 15.5

    # Same location must be 0.0
    zero_dist = haversine_distance(17.9689, 79.5941, 17.9689, 79.5941)
    assert zero_dist == 0.0


def test_machinery_listing_and_distance_ranked_search(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    # Register Geikonda Farm for Ramesh so default reference coord is (17.9689, 79.5941)
    farm = Farm(
        user_id=demo_farmer.id,
        name="Ramesh Farm",
        area=5.0,
        ownership_type=OwnershipType.OWNED,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
    )
    db_session.add(farm)

    # Create Owner 2 in Dharmasagar (~14.5 km away)
    owner2 = User(
        email="owner2@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Bikshapathi R.",
        phone_number="+919876544444",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(owner2)

    # Create Owner 3 in Wardhannapet (~22.5 km away)
    owner3 = User(
        email="owner3@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Rajeshwar T.",
        phone_number="+919876545555",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(owner3)
    db_session.commit()

    # Listing 1 in Dharmasagar
    l1 = MachineryListing(
        owner_id=owner2.id,
        name="Shaktiman Rotavator 6ft",
        category="rotavator",
        hourly_rate=400.0,
        daily_rate=2800.0,
        village="Dharmasagar",
        district="Warangal",
        state="Telangana",
        latitude=17.9944,
        longitude=79.4589,
        is_available=True,
        contact_phone_opt_in=True,
        is_demo=True,
    )
    # Listing 2 in Wardhannapet (Farther)
    l2 = MachineryListing(
        owner_id=owner3.id,
        name="Preet Combine Harvester",
        category="harvester",
        hourly_rate=1800.0,
        daily_rate=14000.0,
        village="Wardhannapet",
        district="Warangal",
        state="Telangana",
        latitude=17.7667,
        longitude=79.6000,
        is_available=True,
        contact_phone_opt_in=False,
        is_demo=True,
    )
    db_session.add_all([l1, l2])
    db_session.commit()

    # Search from Ramesh's location
    res = client.get("/api/v1/machinery/listings?lat=17.9689&lon=79.5941", headers=farmer_headers)
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) >= 2

    # Verify ascending distance sorting
    distances = [item["distance_km"] for item in listings if item["distance_km"] is not None]
    assert distances == sorted(distances)

    # Check contact phone opt-in boundary
    rotavator = next(x for x in listings if x["id"] == l1.id)
    harvester = next(x for x in listings if x["id"] == l2.id)

    assert rotavator["contact_phone_opt_in"] is True
    assert rotavator["owner_phone"] == "+919876544444"

    assert harvester["contact_phone_opt_in"] is False
    assert harvester["owner_phone"] is None  # Scrubbed


def test_machinery_booking_lifecycle(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    # Create Owner with tractor
    owner = User(
        email="tractorowner@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Satyanarayana G.",
        phone_number="+919876546666",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(owner)
    db_session.commit()

    owner_token = create_access_token({"sub": str(owner.id), "role": owner.role.value})
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    tractor = MachineryListing(
        owner_id=owner.id,
        name="John Deere 5050D Tractor",
        category="tractor",
        hourly_rate=700.0,
        daily_rate=5000.0,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9689,
        longitude=79.5941,
        is_available=True,
        contact_phone_opt_in=True,
    )
    db_session.add(tractor)
    db_session.commit()

    # 1. Ramesh books tractor for 2 days (daily rate: 5000 * 2 = 10000)
    today = date.today()
    booking_payload = {
        "listing_id": tractor.id,
        "start_date": today.isoformat(),
        "end_date": (today + timedelta(days=1)).isoformat(),
        "rate_type": "daily",
        "crop_purpose": "Cotton Land Prep",
        "notes": "Need tractor with 3-bottom MB plough.",
    }
    b_res = client.post("/api/v1/machinery/bookings", json=booking_payload, headers=farmer_headers)
    assert b_res.status_code == 201
    booking_data = b_res.json()
    assert booking_data["status"] == "PENDING"
    assert booking_data["estimated_total"] == 10000.0
    assert "no online payments" in booking_data["booking_note"]

    # 2. Owner inspects bookings and approves
    owner_bookings = client.get("/api/v1/machinery/bookings?role=owner", headers=owner_headers)
    assert owner_bookings.status_code == 200
    assert len(owner_bookings.json()) >= 1

    approve_res = client.put(
        f"/api/v1/machinery/bookings/{booking_data['id']}/status",
        json={"status": "APPROVED"},
        headers=owner_headers,
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 3. Prevent booking own listing
    self_book = client.post(
        "/api/v1/machinery/bookings",
        json=booking_payload,
        headers=owner_headers,  # Owner booking own listing
    )
    assert self_book.status_code == 400
    assert "cannot book your own" in self_book.json()["detail"]

