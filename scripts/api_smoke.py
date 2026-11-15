"""
Grow2Gain — Comprehensive API Smoke Test Suite
Phase 4: Endpoint verification across all modules.

Logs in as the demo farmer and calls every existing GET and safe POST endpoint.
Prints a formatted table of [Method, Endpoint, HTTP Status, Short Result].
Never hides failures with try/except.
"""

import sys
import os
from pathlib import Path

# Ensure root directory is on PYTHONPATH
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import httpx
from backend.app.config import settings

BASE_URL = os.environ.get("AGRI_BASE_URL", "http://127.0.0.1:8040")


def run_smoke_tests():
    client = httpx.Client(base_url=BASE_URL, timeout=60.0)

    results = []

    def record(method: str, path: str, status_code: int, summary: str, expected_status: tuple = (200, 201, 204)):
        is_pass = status_code in expected_status
        results.append({
            "method": method,
            "path": path,
            "status": status_code,
            "summary": summary,
            "passed": is_pass,
            "expected_status": expected_status,
        })
        status_marker = "PASS" if is_pass else "FAIL"
        print(f"[{status_marker}] {status_code} {method:<4} {path} — {summary}")

    # 1. Health
    r = client.get("/api/v1/health")
    record("GET", "/api/v1/health", r.status_code, r.json().get("status", "unknown"))

    # 2. Demo Login
    r = client.post("/api/v1/auth/demo-login")
    record("POST", "/api/v1/auth/demo-login", r.status_code, "Demo session initialized")
    if r.status_code != 200:
        print(f"CRITICAL: Demo login failed ({r.status_code}): {r.text}")
        sys.exit(1)

    login_data = r.json()
    token = login_data["access_token"]
    farm_info = login_data.get("farm") or {}
    farm_id = farm_info.get("id", 1)

    auth_headers = {"Authorization": f"Bearer {token}"}
    client.headers.update(auth_headers)

    # 3. Auth Me
    r = client.get("/api/v1/auth/me")
    record("GET", "/api/v1/auth/me", r.status_code, f"Farmer {r.json().get('full_name')}")

    # 4. Farms List
    r = client.get("/api/v1/farms")
    farms_list = r.json() if r.status_code == 200 else []
    record("GET", "/api/v1/farms", r.status_code, f"{len(farms_list)} farm(s) returned")

    # 5. Farm Details
    r = client.get(f"/api/v1/farms/{farm_id}")
    record("GET", f"/api/v1/farms/{farm_id}", r.status_code, f"Farm: {r.json().get('name')}")

    # 6. Location: States
    r = client.get("/api/v1/location/states")
    record("GET", "/api/v1/location/states", r.status_code, f"{len(r.json())} states")

    # 7. Location: Districts
    r = client.get("/api/v1/location/districts?state=Telangana")
    record("GET", "/api/v1/location/districts?state=Telangana", r.status_code, f"{len(r.json())} districts in TS")

    # 8. Location: Villages / Mandals
    r = client.get("/api/v1/location/villages?state=Telangana&district=Warangal")
    v_list = r.json().get("villages", [])
    m_count = sum(1 for v in v_list if v.get("type") == "mandal")
    s_count = sum(1 for v in v_list if v.get("type") == "sample_village")
    record("GET", "/api/v1/location/villages?state=Telangana&district=Warangal", r.status_code, f"{m_count} mandals (+ {s_count} sample villages, 1 District Centre)")

    # 9. Location: Geocode
    r = client.get("/api/v1/location/geocode?query=Warangal")
    record("GET", "/api/v1/location/geocode?query=Warangal", r.status_code, f"Lat: {r.json().get('latitude')}, Lon: {r.json().get('longitude')}")

    # 10. Weather Current
    r = client.get("/api/v1/weather/current?lat=17.9689&lon=79.5941")
    record("GET", "/api/v1/weather/current?lat=17.9689&lon=79.5941", r.status_code, f"Temp: {r.json().get('temperature_c')}°C")

    # 11. Weather Forecast
    r = client.get("/api/v1/weather/forecast?lat=17.9689&lon=79.5941")
    record("GET", "/api/v1/weather/forecast?lat=17.9689&lon=79.5941", r.status_code, f"{len(r.json().get('daily', []))} forecast days")

    # 12. Weather Suitability
    r = client.get("/api/v1/weather/suitability?crop=cotton&lat=17.9689&lon=79.5941")
    suit_val = r.json().get("value")
    suit_conf = r.json().get("confidence")
    record("GET", "/api/v1/weather/suitability?crop=cotton&lat=17.9689&lon=79.5941", r.status_code, f"Suitability: {suit_val} (Conf: {suit_conf})")

    # 13. Irrigation Plan (POST)
    irr_payload = {
        "farm_id": farm_id,
        "crop_name": "Cotton",
        "soil_type": "Clay",
        "irrigation_method": "drip",
        "area_acres": 5.0,
        "latitude": 17.9689,
        "longitude": 79.5941,
    }
    r = client.post("/api/v1/irrigation/plan", json=irr_payload)
    record("POST", "/api/v1/irrigation/plan", r.status_code, f"Should irrigate: {r.json().get('should_irrigate')}, Next: {r.json().get('next_irrigation_date')}")

    # 14. Disease Supported Crops
    r = client.get("/api/v1/disease/supported-crops")
    record("GET", "/api/v1/disease/supported-crops", r.status_code, f"{len(r.json().get('supported_crops', []))} supported crops")

    # 15. Disease History
    r = client.get("/api/v1/disease/history")
    record("GET", "/api/v1/disease/history", r.status_code, f"{len(r.json())} past records")

    # 16. Disease Predict (POST with Sample Image)
    sample_img_path = Path("datasets/plantvillage_eval/Tomato___Early_blight_sample.jpg")
    if sample_img_path.exists():
        with open(sample_img_path, "rb") as f:
            files = {"file": ("Tomato___Early_blight_sample.jpg", f, "image/jpeg")}
            data = {"crop_hint": "Tomato", "farm_id": str(farm_id)}
            r = client.post("/api/v1/disease/predict", files=files, data=data)
            dis_res = r.json()
            dis_name = dis_res.get("predicted_disease") or dis_res.get("disease_name")
            dis_conf = dis_res.get("prediction_confidence") or dis_res.get("confidence")
            record("POST", "/api/v1/disease/predict", r.status_code, f"Disease: {dis_name}, Conf: {dis_conf}")
    else:
        record("POST", "/api/v1/disease/predict", 0, "Sample image not found on disk")

    # 17. Crop Recommendation (POST)
    crop_payload = {
        "n": 50.0,
        "p": 50.0,
        "k": 50.0,
        "ph": 6.5,
        "temperature": 28.0,
        "humidity": 65.0,
        "rainfall": 150.0,
        "state": "Telangana",
        "district": "Warangal",
        "season": "Kharif",
        "farm_id": farm_id,
    }
    print(f"\n[INFO] Sending POST /api/v1/recommend/crop with payload: {crop_payload}")
    r = client.post("/api/v1/recommend/crop", json=crop_payload)
    recs = [c["crop_name"] for c in r.json().get("top_crops", [])] if r.status_code == 200 else []
    record("POST", "/api/v1/recommend/crop", r.status_code, f"Top-3: {', '.join(recs)}")

    # 18. Yield Prediction (POST)
    yield_payload = {
        "crop_name": "Rice",
        "state": "Telangana",
        "district": "Warangal",
        "season": "Kharif",
        "area_acres": 5.0,
        "farm_id": farm_id,
    }
    r = client.post("/api/v1/yield/predict", json=yield_payload)
    y_res = r.json()
    exp_yield = y_res.get("expected_yield_quintals_per_acre") or y_res.get("predicted_yield_q_per_acre")
    record("POST", "/api/v1/yield/predict", r.status_code, f"Expected: {exp_yield} q/acre")

    # 19. Advisory Stage
    r = client.get("/api/v1/advisory/stage?crop=cotton&planting_date=2026-08-15")
    record("GET", "/api/v1/advisory/stage?crop=cotton", r.status_code, f"Stage: {r.json().get('current_stage')}, DAS: {r.json().get('days_after_sowing')}")

    # 20. Advisory Tasks
    r = client.get("/api/v1/advisory/tasks?crop=cotton&planting_date=2026-08-15")
    record("GET", "/api/v1/advisory/tasks?crop=cotton", r.status_code, f"{len(r.json().get('tasks', []))} tasks returned")

    # 21. Advisory Plan (POST)
    r = client.post("/api/v1/advisory/plan", json={"farm_id": farm_id})
    score_obj = r.json().get("farm_health_score") or {}
    score_val = score_obj.get("score") if isinstance(score_obj, dict) else score_obj
    record("POST", "/api/v1/advisory/plan", r.status_code, f"Score: {score_val}/100, Plan: {len(r.json().get('plan_days', []))} days")

    # 22. Economics Templates
    r = client.get("/api/v1/economics/templates")
    record("GET", "/api/v1/economics/templates", r.status_code, f"{len(r.json())} crop templates")

    # 23. Economics Compare
    r = client.get("/api/v1/economics/compare?crop1=cotton&crop2=rice")
    record("GET", "/api/v1/economics/compare?crop1=cotton&crop2=rice", r.status_code, f"Comparison matrix status: {r.json().get('status')}")

    # 24. Economics Calculate (POST)
    econ_payload = {
        "crop_name": "Cotton",
        "area": 5.0,
        "area_unit": "acres",
        "ownership_type": "owned",
        "expected_yield_q_per_acre": 8.0,
        "yield_is_user_estimate": True,
        "expected_price_per_q": 7200.0,
    }
    r = client.post("/api/v1/economics/calculate", json=econ_payload)
    record("POST", "/api/v1/economics/calculate", r.status_code, f"Margin: {r.json().get('combined_summary', {}).get('margin_pct')}%")

    # 25. Economics What-If (POST)
    whatif_payload = {
        "crop_name": "Cotton",
        "area_acres": 5.0,
        "ownership_type": "owned",
        "price_per_q": 7100.0,
        "yield_q_per_acre": 8.0,
        "operating_cost_per_acre": 35000.0,
        "sweep_variable": "price",
        "sweep_range_pct": 30.0,
    }
    r = client.post("/api/v1/economics/what-if", json=whatif_payload)
    record("POST", "/api/v1/economics/what-if", r.status_code, f"Breakeven Price: ₹{r.json().get('break_even_price_per_q')}")

    # 26. Rotation Recommend
    r = client.get("/api/v1/rotation/recommend?previous_crop=Cotton")
    rot_list = r.json().get("recommended_rotations") or r.json().get("recommended_successors") or []
    record("GET", "/api/v1/rotation/recommend?previous_crop=Cotton", r.status_code, f"{len(rot_list)} rotation option(s)")

    # 27. Calendar Season
    r = client.get("/api/v1/calendar/season?month=11&lat=17.9689&lon=79.5941")
    season_name = r.json().get("current_season") or r.json().get("season_name")
    record("GET", "/api/v1/calendar/season", r.status_code, f"Season: {season_name}")

    # 28. Calendar Events
    r = client.get("/api/v1/calendar/events?crop_name=Cotton")
    cal_data = r.json()
    stages = cal_data.get("lifecycle_stages") or cal_data.get("milestones") or []
    events = cal_data.get("events") or []
    record("GET", "/api/v1/calendar/events?crop_name=Cotton", r.status_code, f"{len(stages)} stage(s), {len(events)} event(s)")

    # 29. Calendar ICS Export
    r = client.get("/api/v1/calendar/export.ics?crop_name=Cotton")
    record("GET", "/api/v1/calendar/export.ics?crop_name=Cotton", r.status_code, f"{len(r.text)} bytes ICS file")

    # 30. Market Prices
    r = client.get("/api/v1/market/prices?crop=Cotton")
    prices_data = r.json()
    modal_price = prices_data.get("modal_price")
    if modal_price is None and "prices" in prices_data and len(prices_data["prices"]) > 0:
        modal_price = prices_data["prices"][0].get("modal_price")
    record("GET", "/api/v1/market/prices?crop=Cotton", r.status_code, f"Modal price: ₹{modal_price}")

    # 31. Market Ranking
    r = client.get("/api/v1/market/ranking?crop=Cotton&quantity=10&lat=17.9689&lon=79.5941")
    record("GET", "/api/v1/market/ranking", r.status_code, f"{len(r.json().get('rankings', []))} mandi rankings")

    # 32. Market MSP
    r = client.get("/api/v1/market/msp?crop=Cotton&expected_price=7100")
    msp_lbl = r.json().get("status_label") or r.json().get("status")
    record("GET", "/api/v1/market/msp?crop=Cotton", r.status_code, f"Status: {msp_lbl} (verified: {r.json().get('msp_verified')})")

    # 33. Market Trends
    r = client.get("/api/v1/market/trends?crop=Cotton")
    record("GET", "/api/v1/market/trends?crop=Cotton", r.status_code, f"{len(r.json().get('historical_prices', []))} days history")

    # 34. Market Warehouses
    r = client.get("/api/v1/market/warehouses?lat=17.9689&lon=79.5941")
    record("GET", "/api/v1/market/warehouses", r.status_code, f"{len(r.json().get('warehouses', []))} nearby facilities")

    # 35. Soil Card Latest
    r = client.get(f"/api/v1/soil-card/latest?farm_id={farm_id}")
    record("GET", f"/api/v1/soil-card/latest?farm_id={farm_id}", r.status_code, f"Has card: {r.json().get('has_card')}")

    # 36. Soil Card Engines
    r = client.get("/api/v1/soil-card/engines")
    record("GET", "/api/v1/soil-card/engines", r.status_code, f"Engines: {', '.join(r.json().get('available_engines', [])) or 'None'}")

    # 37. Soil Card Impact (POST)
    r = client.post("/api/v1/soil-card/impact", json={"farm_id": farm_id, "crop_name": "Cotton"})
    record("POST", "/api/v1/soil-card/impact", r.status_code, f"Confirmed card: {r.json().get('has_confirmed_soil_card')}")

    # 38. Community Nearby Farmers
    r = client.get("/api/v1/community/nearby-farmers?district=Warangal")
    record("GET", "/api/v1/community/nearby-farmers?district=Warangal", r.status_code, f"{len(r.json())} nearby farmers")

    # 39. Community Groups
    r = client.get("/api/v1/community/groups")
    record("GET", "/api/v1/community/groups", r.status_code, f"{len(r.json())} peer groups")

    # 40. Community Requests
    r = client.get("/api/v1/community/requests")
    record("GET", "/api/v1/community/requests", r.status_code, f"{len(r.json())} pooled requests")

    # 41. Community Transport Cost-Split (POST)
    split_payload = {
        "base_truck_cost": 2500.0,
        "rate_per_km": 30.0,
        "total_distance_km": 40.0,
        "participants": [
            {"name_or_alias": "Ramesh", "weight_quintals": 20.0, "pickup_distance_km": 40.0},
            {"name_or_alias": "Suresh", "weight_quintals": 30.0, "pickup_distance_km": 40.0},
        ],
    }
    r = client.post("/api/v1/community/transport/cost-split", json=split_payload)
    record("POST", "/api/v1/community/transport/cost-split", r.status_code, f"Truck: ₹{r.json().get('total_truck_cost')}, Savings: ₹{r.json().get('total_savings')}")

    # 42. Machinery Listings
    r = client.get("/api/v1/machinery/listings?lat=17.9689&lon=79.5941")
    record("GET", "/api/v1/machinery/listings", r.status_code, f"{len(r.json())} rental listings")

    # 43. Machinery Guide
    r = client.get("/api/v1/machinery/guide?crop=Cotton")
    record("GET", "/api/v1/machinery/guide?crop=Cotton", r.status_code, f"{len(r.json().get('stages', []))} machinery stages")

    # 44. Machinery Bookings
    r = client.get("/api/v1/machinery/bookings")
    record("GET", "/api/v1/machinery/bookings", r.status_code, f"{len(r.json())} user bookings")

    # 45. Outbreaks Map
    r = client.get("/api/v1/outbreaks/map?district=Warangal&state=Telangana")
    record("GET", "/api/v1/outbreaks/map", r.status_code, f"{len(r.json().get('outbreaks', []))} outbreak alerts")

    # 46a. Outbreaks District Summary (Farmer - RBAC Guard)
    r = client.get("/api/v1/outbreaks/district-summary?district=Warangal&state=Telangana")
    record("GET", "/api/v1/outbreaks/district-summary (Farmer)", r.status_code, "403 Forbidden: RBAC guard verified", expected_status=(403,))

    # 46b. Outbreaks District Summary (Expert - Role Telemetry)
    expert_login = client.post("/api/v1/auth/login", json={"email": "expert@agrisage.demo", "password": settings.DEMO_EXPERT_PASSWORD})
    if expert_login.status_code == 200:
        expert_token = expert_login.json()["access_token"]
        expert_headers = {"Authorization": f"Bearer {expert_token}"}
        r = client.get("/api/v1/outbreaks/district-summary?district=Warangal&state=Telangana", headers=expert_headers)
        total_cases = r.json().get("total_cases_in_district", 0)
        record("GET", "/api/v1/outbreaks/district-summary (Expert)", r.status_code, f"Cases in district: {total_cases}")
    else:
        record("GET", "/api/v1/outbreaks/district-summary (Expert)", expert_login.status_code, "Expert login failed")

    # 47. Marketplace Listings
    r = client.get("/api/v1/marketplace/listings")
    record("GET", "/api/v1/marketplace/listings", r.status_code, f"{len(r.json())} buyer listings")

    # 48. Marketplace Inquiries
    r = client.get("/api/v1/marketplace/inquiries")
    record("GET", "/api/v1/marketplace/inquiries", r.status_code, f"{len(r.json())} trade inquiries")

    # 49. Reminders
    r = client.get("/api/v1/reminders")
    record("GET", "/api/v1/reminders", r.status_code, f"{len(r.json())} active reminders")

    # 50. Reminders Suggestions
    r = client.get(f"/api/v1/reminders/suggestions?farm_id={farm_id}")
    record("GET", "/api/v1/reminders/suggestions", r.status_code, f"{len(r.json())} suggested reminders")

    # 51. Voice Query EN (POST)
    r = client.post("/api/v1/voice/query", json={"query": "Will it rain today?", "language": "en", "farm_id": farm_id})
    record("POST", "/api/v1/voice/query (EN)", r.status_code, f"Intent: {r.json().get('intent')}")

    # 52. Voice Query TE (POST)
    r = client.post("/api/v1/voice/query", json={"query": "ఈరోజు వర్షం పడుతుందా?", "language": "te", "farm_id": farm_id})
    record("POST", "/api/v1/voice/query (TE)", r.status_code, f"Intent: {r.json().get('intent')}")

    # 53. Voice Query HI (POST)
    r = client.post("/api/v1/voice/query", json={"query": "क्या आज बारिश होगी?", "language": "hi", "farm_id": farm_id})
    record("POST", "/api/v1/voice/query (HI)", r.status_code, f"Intent: {r.json().get('intent')}")

    # 54. Agent Runs History
    r = client.get(f"/api/v1/agents/runs?farm_id={farm_id}")
    record("GET", f"/api/v1/agents/runs?farm_id={farm_id}", r.status_code, f"{len(r.json())} historical runs")

    # 55. Agent Run Trigger (POST)
    r = client.post("/api/v1/agents/run", json={"farm_id": farm_id})
    agents_res = r.json()
    env_count = len(agents_res.get("envelopes", [])) or len(agents_res.get("agent_runs", []))
    record("POST", "/api/v1/agents/run", r.status_code, f"Status: {agents_res.get('status')}, Agents: {env_count} run")

    # Separate standard endpoints and expected RBAC 403 guard endpoints
    std_endpoints = [r for r in results if 403 not in r.get("expected_status", (200,))]
    rbac_endpoints = [r for r in results if 403 in r.get("expected_status", (200,))]

    print("\n" + "=" * 95)
    print("STANDARD API ENDPOINTS (EXPECTED 200/201/204)")
    print("=" * 95)
    print(f"{'Method':<6} | {'Endpoint':<45} | {'Status':<6} | {'Result Summary':<32}")
    print("-" * 95)
    for item in std_endpoints:
        status_str = str(item["status"])
        assert "None" not in item["summary"], f"Summary for {item['path']} contains unexpected None: {item['summary']}"
        print(f"{item['method']:<6} | {item['path'][:45]:<45} | {status_str:<6} | {item['summary'][:32]:<32}")

    print("\n" + "=" * 95)
    print("ROLE-BASED ACCESS CONTROL (RBAC) GUARDS (EXPECTED 403 FORBIDDEN)")
    print("=" * 95)
    print(f"{'Method':<6} | {'Endpoint':<45} | {'Status':<6} | {'Result Summary':<32}")
    print("-" * 95)
    for item in rbac_endpoints:
        status_str = str(item["status"])
        print(f"{item['method']:<6} | {item['path'][:45]:<45} | {status_str:<6} | {item['summary'][:32]:<32}")
    print("=" * 95)

    failures = [r for r in results if not r.get("passed", False)]
    if failures:
        print(f"\nFAILURE COUNT: {len(failures)} endpoint(s) failed!")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: All {len(results)} tested endpoints passed verification ({len(std_endpoints)} standard + {len(rbac_endpoints)} RBAC guards)!")


if __name__ == "__main__":
    run_smoke_tests()
