import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import Farm, OwnershipType, IrrigationMethod
from backend.app.models.community import FarmerGroup, GroupMember, CommunityRequest, RequestParticipant
from backend.app.security.auth import hash_password, create_access_token
from backend.app.services.cost_split import calculate_cost_split, ParticipantInput


# ==============================================================================
# 1. Cost-Splitting Arithmetic & Formula Tests
# ==============================================================================

def test_cost_split_weight_share_math():
    participants = [
        ParticipantInput(name_or_alias="Ramesh", weight_quintals=25.0, pickup_distance_km=30.0),
        ParticipantInput(name_or_alias="Mallesh", weight_quintals=15.0, pickup_distance_km=30.0),
        ParticipantInput(name_or_alias="Kavitha", weight_quintals=10.0, pickup_distance_km=30.0),
    ]
    # Truck: base 3000 + 35 * 30 = 4050
    # Solo: base 1200 + 25 * 30 = 1950 per farmer -> Total solo = 5850
    result = calculate_cost_split(
        base_truck_cost=3000.0,
        rate_per_km=35.0,
        total_distance_km=30.0,
        participants=participants,
        solo_tempo_base=1200.0,
        solo_rate_per_km=25.0,
        split_method="weight_share",
    )

    assert result.total_truck_cost == 4050.0
    assert result.total_solo_cost == 5850.0
    assert result.total_savings == 1800.0
    assert result.total_savings_percentage == 30.8

    # Ramesh: 25/50 = 50% -> 2025.0
    # Mallesh: 15/50 = 30% -> 1215.0
    # Kavitha: 10/50 = 20% -> 810.0
    r_split = result.participants[0]
    assert r_split.name_or_alias == "Ramesh"
    assert r_split.share_percentage == 50.0
    assert r_split.allocated_cost == 2025.0
    assert r_split.solo_cost == 1950.0

    k_split = result.participants[2]
    assert k_split.name_or_alias == "Kavitha"
    assert k_split.share_percentage == 20.0
    assert k_split.allocated_cost == 810.0
    assert k_split.savings == 1140.0
    assert k_split.savings_percentage == 58.5

    assert "Transparent Cost-Splitting Formula" in result.formula_breakdown
    assert "Example: 3 Farmers Pooling 50 Quintals Cotton" in result.example_breakdown["title"]


def test_cost_split_ton_km_math():
    participants = [
        ParticipantInput(name_or_alias="Farmer A", weight_quintals=20.0, pickup_distance_km=10.0),  # 200 ton-km
        ParticipantInput(name_or_alias="Farmer B", weight_quintals=20.0, pickup_distance_km=30.0),  # 600 ton-km
    ]
    # Total ton-km = 800. A = 25%, B = 75%
    result = calculate_cost_split(
        base_truck_cost=1000.0,
        rate_per_km=20.0,
        total_distance_km=30.0,
        participants=participants,
        split_method="ton_km",
    )
    # Total truck = 1000 + 600 = 1600
    assert result.total_truck_cost == 1600.0
    assert result.participants[0].share_percentage == 25.0
    assert result.participants[0].allocated_cost == 400.0
    assert result.participants[1].share_percentage == 75.0
    assert result.participants[1].allocated_cost == 1200.0


def test_cost_split_api_endpoint(client: TestClient, farmer_headers: dict):
    payload = {
        "base_truck_cost": 3000.0,
        "rate_per_km": 35.0,
        "total_distance_km": 30.0,
        "solo_tempo_base": 1200.0,
        "solo_rate_per_km": 25.0,
        "split_method": "weight_share",
        "participants": [
            {"name_or_alias": "Ramesh", "weight_quintals": 25.0, "pickup_distance_km": 30.0},
            {"name_or_alias": "Mallesh", "weight_quintals": 15.0, "pickup_distance_km": 30.0},
        ],
    }
    res = client.post("/api/v1/community/transport/cost-split", json=payload, headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_truck_cost"] == 4050.0
    assert len(data["participants"]) == 2
    assert "formula_breakdown" in data


# ==============================================================================
# 2. Farmer Group Creation, Membership & Explicit Consent Tests
# ==============================================================================

def test_create_and_list_farmer_group(client: TestClient, farmer_headers: dict):
    payload = {
        "name": "Geikonda Progressive Planters",
        "description": "Cotton and chilli growers collective in Geikonda.",
        "village": "Geikonda",
        "district": "Warangal",
        "state": "Telangana",
        "crop_focus": "Cotton",
        "consent_share_contact": True,
    }
    res = client.post("/api/v1/community/groups", json=payload, headers=farmer_headers)
    assert res.status_code == 201
    group_data = res.json()
    assert group_data["name"] == payload["name"]
    assert group_data["is_member"] is True
    assert group_data["user_has_consented"] is True

    # List groups
    list_res = client.get("/api/v1/community/groups", headers=farmer_headers)
    assert list_res.status_code == 200
    groups = list_res.json()
    found = next((g for g in groups if g["id"] == group_data["id"]), None)
    assert found is not None
    assert found["member_count"] >= 1


def test_join_and_leave_farmer_group(client: TestClient, db_session: Session, farmer_headers: dict):
    # Create a user B (Mallesh)
    user_b = User(
        email="mallesh.test@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Mallesh Goud",
        phone_number="+919876543333",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    token_b = create_access_token({"sub": str(user_b.id), "role": user_b.role.value})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Ramesh creates a group
    c_res = client.post(
        "/api/v1/community/groups",
        json={"name": "Warangal Agro Club", "village": "Geikonda", "district": "Warangal", "consent_share_contact": True},
        headers=farmer_headers,
    )
    assert c_res.status_code == 201
    group_id = c_res.json()["id"]

    # Mallesh joins with consent_share_contact = False
    join_res = client.post(
        f"/api/v1/community/groups/{group_id}/join",
        json={"consent_share_contact": False},
        headers=headers_b,
    )
    assert join_res.status_code == 200
    assert join_res.json()["is_member"] is True
    assert join_res.json()["user_has_consented"] is False

    # Mallesh leaves group
    leave_res = client.delete(f"/api/v1/community/groups/{group_id}/leave", headers=headers_b)
    assert leave_res.status_code == 200
    assert leave_res.json()["message"] == "Successfully left the group."


def test_consent_revocation_and_timestamp(client: TestClient, farmer_headers: dict):
    c_res = client.post(
        "/api/v1/community/groups",
        json={"name": "Consent Test Group", "village": "Geikonda", "district": "Warangal", "consent_share_contact": True},
        headers=farmer_headers,
    )
    group_id = c_res.json()["id"]

    # Revoke consent
    revoke_res = client.put(
        f"/api/v1/community/groups/{group_id}/consent",
        json={"consent_share_contact": False},
        headers=farmer_headers,
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["consent_share_contact"] is False
    assert revoke_res.json()["consent_at"] is None

    # Re-grant consent
    grant_res = client.put(
        f"/api/v1/community/groups/{group_id}/consent",
        json={"consent_share_contact": True},
        headers=farmer_headers,
    )
    assert grant_res.status_code == 200
    assert grant_res.json()["consent_share_contact"] is True
    assert grant_res.json()["consent_at"] is not None


# ==============================================================================
# 3. Strict Permission Boundary & Contact Privacy Tests
# ==============================================================================

def test_permission_boundary_strict_phone_scrubbing(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    """
    CRITICAL PRIVACY TEST:
    1. Ramesh (User A) is in Group 1 with consent = True (+919876543210).
    2. Mallesh (User B) is in Group 1 with consent = False (+919876543999).
    3. Kavitha (User C) is in Group 1 with consent = True (+919876543888).
    
    Verifies:
    - User A (consented) sees User C's phone number, but CANNOT see User B's phone number!
    - User B sees only aliases and villages, and User A's/User C's phone numbers NEVER appear anywhere in User B's payload.
    - A user who has not consented must never receive a phone number from any endpoint.
    """
    # 0. Ensure demo_farmer has a valid phone number
    demo_farmer.phone_number = "+919876543210"
    db_session.commit()

    # 1. Create User B (Mallesh - unconsented)
    user_b = User(
        email="mallesh.boundary@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Mallesh Goud",
        phone_number="+919876543999",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(user_b)

    # 2. Create User C (Kavitha - consented)
    user_c = User(
        email="kavitha.boundary@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Kavitha Reddy",
        phone_number="+919876543888",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(user_c)
    db_session.commit()

    token_b = create_access_token({"sub": str(user_b.id), "role": user_b.role.value})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    token_c = create_access_token({"sub": str(user_c.id), "role": user_c.role.value})
    headers_c = {"Authorization": f"Bearer {token_c}"}

    # Ramesh creates group with consent_share_contact = True
    c_res = client.post(
        "/api/v1/community/groups",
        json={"name": "Privacy Boundary Circle", "village": "Geikonda", "district": "Warangal", "consent_share_contact": True},
        headers=farmer_headers,
    )
    group_id = c_res.json()["id"]

    # Mallesh joins with consent = False
    client.post(f"/api/v1/community/groups/{group_id}/join", json={"consent_share_contact": False}, headers=headers_b)

    # Kavitha joins with consent = True
    client.post(f"/api/v1/community/groups/{group_id}/join", json={"consent_share_contact": True}, headers=headers_c)

    # --- Test Case 1: Caller is Ramesh (User A, consented) ---
    res_a = client.get(f"/api/v1/community/groups/{group_id}/members", headers=farmer_headers)
    assert res_a.status_code == 200
    members_a = res_a.json()

    # Find each member in Ramesh's view
    m_ramesh = next(m for m in members_a if m["user_id"] == demo_farmer.id)
    m_mallesh = next(m for m in members_a if m["user_id"] == user_b.id)
    m_kavitha = next(m for m in members_a if m["user_id"] == user_c.id)

    # Ramesh sees own phone
    assert m_ramesh["phone_number"] == demo_farmer.phone_number

    # Mallesh has NOT consented -> Ramesh sees alias and village only; phone must be None!
    assert m_mallesh["alias_or_name"] == "Mallesh G."
    assert m_mallesh["phone_number"] is None
    assert "+919876543999" not in str(res_a.json())

    # Kavitha HAS consented -> Ramesh sees full name and phone number
    assert m_kavitha["alias_or_name"] == "Kavitha Reddy"
    assert m_kavitha["phone_number"] == "+919876543888"

    # --- Test Case 2: Caller is Mallesh (User B, has NOT consented) ---
    res_b = client.get(f"/api/v1/community/groups/{group_id}/members", headers=headers_b)
    assert res_b.status_code == 200
    members_b = res_b.json()

    # In Mallesh's view:
    m_ramesh_from_b = next(m for m in members_b if m["user_id"] == demo_farmer.id)
    m_kavitha_from_b = next(m for m in members_b if m["user_id"] == user_c.id)
    m_mallesh_from_b = next(m for m in members_b if m["user_id"] == user_b.id)

    # Mallesh sees own phone
    assert m_mallesh_from_b["phone_number"] == "+919876543999"

    # Mallesh has NOT consented -> MUST NEVER receive Ramesh's or Kavitha's phone number!
    assert m_ramesh_from_b["phone_number"] is None
    assert m_ramesh_from_b["alias_or_name"] == "Ramesh K."

    assert m_kavitha_from_b["phone_number"] is None
    assert m_kavitha_from_b["alias_or_name"] == "Kavitha R."

    # String verification across entire payload: neither phone appears anywhere
    raw_b_text = res_b.text
    assert demo_farmer.phone_number not in raw_b_text
    assert "+919876543888" not in raw_b_text


def test_nearby_farmers_village_privacy(client: TestClient, db_session: Session, demo_farmer: User, farmer_headers: dict):
    # Register a farm for another user
    other_user = User(
        email="neighbor@agrisage.demo",
        hashed_password=hash_password("Pass@123"),
        full_name="Narasimha Rao",
        phone_number="+919876543777",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
    )
    db_session.add(other_user)
    db_session.commit()

    other_farm = Farm(
        user_id=other_user.id,
        name="Narasimha Farm",
        area=3.0,
        ownership_type=OwnershipType.OWNED,
        owned_area=3.0,
        leased_area=0.0,
        lease_amount=0.0,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.9699,
        longitude=79.5955,
    )
    db_session.add(other_farm)
    db_session.commit()

    res = client.get("/api/v1/community/nearby-farmers?village=Geikonda", headers=farmer_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1

    neighbor = next((n for n in data if n["user_id"] == other_user.id), None)
    assert neighbor is not None
    assert neighbor["alias_or_name"] == "Narasimha R."  # Alias only
    assert neighbor["village"] == "Geikonda"
    assert neighbor["phone_number"] is None             # Phone scrubbed
    assert "latitude" not in str(data)                  # Exact coordinates never exposed
    assert "longitude" not in str(data)


# ==============================================================================
# 4. Community Requests: Transport, Input Purchase & Pooled Sale
# ==============================================================================

def test_community_requests_transport_input_sale(client: TestClient, farmer_headers: dict):
    # Create transport request
    req_payload = {
        "request_type": "transport",
        "title": "Pooled Cotton Truck to Mandi",
        "description": "Sharing freight for 50 quintals.",
        "village": "Geikonda",
        "district": "Warangal",
        "state": "Telangana",
        "destination": "Enumamula Mandi",
        "total_capacity_quintals": 100.0,
        "base_truck_cost": 3000.0,
        "rate_per_km": 35.0,
        "distance_km": 28.0,
        "creator_quantity_or_weight": 25.0,
        "creator_distance_km": 28.0,
    }
    create_res = client.post("/api/v1/community/requests", json=req_payload, headers=farmer_headers)
    assert create_res.status_code == 201
    req_data = create_res.json()
    assert req_data["request_type"] == "transport"
    assert req_data["current_weight_quintals"] == 25.0
    assert len(req_data["participants"]) == 1

    # Join request
    join_res = client.post(
        f"/api/v1/community/requests/{req_data['id']}/join",
        json={"quantity_or_weight": 15.0, "distance_km": 28.0, "notes": "Additional load"},
        headers=farmer_headers,
    )
    assert join_res.status_code == 200
    req_list = client.get("/api/v1/community/requests", headers=farmer_headers).json()
    found = next(r for r in req_list if r["id"] == req_data["id"])
    assert found["current_weight_quintals"] == 40.0
