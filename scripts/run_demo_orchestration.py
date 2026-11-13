"""
Demonstration Script: Execute Full Orchestrated Multi-Agent Run for Farmer Ramesh
"""
import json
import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_orchestration():
    print("=== Step 1: Login as Demo Farmer Ramesh ===")
    auth_resp = httpx.post(f"{BASE_URL}/api/v1/auth/demo-login")
    if auth_resp.status_code != 200:
        print(f"Demo login failed: {auth_resp.status_code} - {auth_resp.text}")
        return
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully. Access token obtained.")

    print("\n=== Step 2: Fetch Ramesh's Farm ===")
    farms_resp = httpx.get(f"{BASE_URL}/api/v1/farms", headers=headers)
    farms = farms_resp.json()
    farm = farms[0]
    print(f"Farm: {farm['name']}, ID: {farm['id']}, Crop: Cotton (Warangal, Telangana)")

    print("\n=== Step 3: Trigger Multi-Agent Orchestrator Run ===")
    image_fixture = "backend/tests/fixtures/tomato_early_blight.jpg"
    payload = {
        "farm_id": farm["id"],
        "image_path": image_fixture,
    }
    run_resp = httpx.post(f"{BASE_URL}/api/v1/agents/run", headers=headers, json=payload, timeout=60.0)
    if run_resp.status_code != 200:
        print(f"Orchestration failed: {run_resp.status_code} - {run_resp.text}")
        return

    data = run_resp.json()
    print(f"Run ID: {data['run_id']}")
    print(f"Status: {data['status']}")
    print(f"Total Duration: {data['duration_ms']:.2f} ms")

    print("\n--- Agent Execution Summary ---")
    for agent_name, env in data["envelopes"].items():
        conf = env.get("confidence", 0.0)
        warns = len(env.get("warnings", []))
        print(f"  • {agent_name.upper():12}: status={env['status']} (conf={conf:.2f}, warnings={warns})")

    print("\n--- Inter-Agent Handoff Records ---")
    for h in data["handoffs"]:
        print(f"  • {h['from_agent']} -> {h['to_agent']}: {h['message']}")

    print("\n--- Conflict Resolutions ---")
    if data["conflicts"]:
        for c in data["conflicts"]:
            print(f"  • Conflict between {c['agent_a']} & {c['agent_b']}: {c['issue']}")
            print(f"    Resolution: {c['resolution']}")
            print(f"    Rationale: {c['rationale']}")
    else:
        print("  None detected.")

    advisory = data.get("advisory_plan")
    if advisory:
        print("\n=== Advisory Coordinator Output ===")
        print(f"Summary: {advisory.get('summary')}")
        
        # Growth Stage
        gs = advisory.get("growth_stage")
        if gs:
            print(f"\nGrowth Stage Info:\n{json.dumps(gs, indent=2)}")

        # Farm Health Score
        fhs = advisory.get("farm_health_breakdown")
        if fhs:
            print(f"\nFarm Health Score Breakdown:\n{json.dumps(fhs, indent=2)}")
        
        # Headline Yield
        hy = advisory.get("headline_yield")
        if hy:
            print(f"\nHeadline Yield:\n{json.dumps(hy, indent=2)}")

        # 7-Day Action Plan
        plan = advisory.get("seven_day_plan", [])
        print(f"\n7-Day Action Plan ({len(plan)} items):")
        for item in plan:
            print(f"  Day {item.get('day_number')} ({item.get('date_str')}) [{item.get('priority', '').upper()}]: {item.get('action')}")
            print(f"    Telugu:  {item.get('action_te')}")
            print(f"    Because: {item.get('reason')}")
            print(f"    Source:  {item.get('source')}")

if __name__ == "__main__":
    run_orchestration()
