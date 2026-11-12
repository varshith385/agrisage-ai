import pytest
from fastapi.testclient import TestClient
from backend.app.config import settings


def test_user_registration_and_login(client: TestClient):
    # 1. Register new user
    reg_payload = {
        "email": "farmer_test@agrisage.com",
        "password": "SecurePassword123!",
        "full_name": "Test Farmer",
        "phone_number": "+919988776655",
        "role": "Farmer",
        "preferred_language": "te",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["email"] == reg_payload["email"]
    assert reg_data["role"] == "Farmer"
    assert "password" not in reg_data

    # 2. Duplicate registration fails
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Successful login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": reg_payload["email"], "password": reg_payload["password"]},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 4. Access /auth/me with bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == reg_payload["email"]

    # 5. Invalid password fails
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": reg_payload["email"], "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401


def test_demo_login_endpoint(client: TestClient):
    # One-click demo login provisions Ramesh
    res = client.post("/api/v1/auth/demo-login")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Farmer"
    assert "Ramesh" in data["user"]["full_name"]
    assert data["farm"] is not None
    assert data["farm"]["ownership_type"] == "mixed"
    assert data["farm"]["area"] == 5.0
    assert data["farm"]["owned_area"] == 3.0
    assert data["farm"]["leased_area"] == 2.0


def test_demo_login_disabled_when_flag_off(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    res = client.post("/api/v1/auth/demo-login")
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"]

