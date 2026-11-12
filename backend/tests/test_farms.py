import pytest
from fastapi.testclient import TestClient


def test_create_farm_mixed_tenure_success(client: TestClient, farmer_headers: dict):
    payload = {
        "name": "Krishna River Holding",
        "area": 10.0,
        "ownership_type": "mixed",
        "owned_area": 6.0,
        "leased_area": 4.0,
        "lease_amount": 24000.0,
        "soil_type": "Black Cotton",
        "water_source": "Canal",
        "irrigation_method": "drip",
        "budget": 75000.0,
        "village": "Dharmasagar",
        "district": "Warangal",
        "state": "Telangana",
        "latitude": 17.9944,
        "longitude": 79.4589,
    }
    res = client.post("/api/v1/farms", json=payload, headers=farmer_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == payload["name"]
    assert data["ownership_type"] == "mixed"
    assert data["area"] == 10.0
    assert data["owned_area"] == 6.0
    assert data["leased_area"] == 4.0


def test_create_farm_mixed_tenure_validation_failure(client: TestClient, farmer_headers: dict):
    # Sum of owned (5.0) and leased (4.0) is 9.0 != total area (10.0) -> must fail
    bad_payload = {
        "name": "Inconsistent Tenure Farm",
        "area": 10.0,
        "ownership_type": "mixed",
        "owned_area": 5.0,
        "leased_area": 4.0,
        "lease_amount": 15000.0,
        "village": "Geikonda",
        "district": "Warangal",
        "state": "Telangana",
        "latitude": 17.9689,
        "longitude": 79.5941,
    }
    res = client.post("/api/v1/farms", json=bad_payload, headers=farmer_headers)
    assert res.status_code == 422
    assert "owned_area" in res.json()["detail"] or "must equal total area" in res.json()["detail"]


def test_create_farm_negative_area_failure(client: TestClient, farmer_headers: dict):
    bad_payload = {
        "name": "Zero Area Farm",
        "area": 0.0,
        "ownership_type": "owned",
        "village": "Geikonda",
        "district": "Warangal",
        "state": "Telangana",
        "latitude": 17.9689,
        "longitude": 79.5941,
    }
    res = client.post("/api/v1/farms", json=bad_payload, headers=farmer_headers)
    assert res.status_code == 422


def test_list_and_get_farms(client: TestClient, farmer_headers: dict):
    # 1. Create a farm
    payload = {
        "name": "Sunrise Farm",
        "area": 4.0,
        "ownership_type": "owned",
        "owned_area": 4.0,
        "leased_area": 0.0,
        "village": "Parkal",
        "district": "Warangal",
        "state": "Telangana",
        "latitude": 18.2000,
        "longitude": 79.7167,
    }
    create_res = client.post("/api/v1/farms", json=payload, headers=farmer_headers)
    assert create_res.status_code == 201
    farm_id = create_res.json()["id"]

    # 2. List farms
    list_res = client.get("/api/v1/farms", headers=farmer_headers)
    assert list_res.status_code == 200
    farms = list_res.json()
    assert len(farms) >= 1
    assert any(f["id"] == farm_id for f in farms)

    # 3. Get single farm
    get_res = client.get(f"/api/v1/farms/{farm_id}", headers=farmer_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Sunrise Farm"

