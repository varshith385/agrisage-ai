"""
Grow2Gain — 16 Query Chat Evaluation Suite (Round 7c)
Tests 8 Telugu, 4 Hindi, and 4 English queries against /api/v1/voice/query.
Extracts raw response text, provider used, intent, and prints them clearly.
"""
import json
import httpx

BASE_URL = "http://127.0.0.1:8030"

QUERIES = [
    # 8 Telugu Queries
    ("te", "నా పత్తి పంటకు ఈరోజు నీరు పెట్టాలా?", "Irrigation need today?"),
    ("te", "ఈరోజు వాతావరణం ఎలా ఉంది?", "Weather today?"),
    ("te", "మార్కెట్లో పత్తి ధర ఎంత ఉంది?", "Cotton market price?"),
    ("te", "నా పొలానికి ఏ పంట వేయాలి?", "Which crop should I sow?"),
    ("te", "పత్తి ఆకులపై మచ్చలు ఉన్నాయి, ఏమి చేయాలి?", "Spots on cotton leaves?"),
    ("te", "ఎరువులు ఎంత మోతాదులో వాడాలి?", "Fertilizer chemical dosage?"),
    ("te", "నమస్కారం, మీరు ఎవరు?", "Greeting & Who are you?"),
    ("te", "ధన్యవాదాలు", "Thank you"),

    # 4 Hindi Queries
    ("hi", "क्या आज मेरी कपास की फसल को पानी देना चाहिए?", "Irrigation need today?"),
    ("hi", "आज का मौसम कैसा रहेगा?", "Weather today?"),
    ("hi", "कपास का मंडी भाव क्या है?", "Cotton mandi price?"),
    ("hi", "मेरी मिट्टी के लिए कौन सी फसल सही रहेगी?", "Which crop is suitable?"),

    # 4 English Queries
    ("en", "Should I irrigate my cotton field today?", "Irrigation need today?"),
    ("en", "What is today's weather forecast for Warangal?", "Weather today?"),
    ("en", "What is the modal price of cotton in Warangal APMC?", "Cotton mandi price?"),
    ("en", "Which crop do you recommend for my field?", "Which crop is suitable?"),
]


def main():
    client = httpx.Client(base_url=BASE_URL, timeout=25.0)

    # 1. Demo login
    resp = client.post("/api/v1/auth/demo-login")
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    farm_id = resp.json().get("farm", {}).get("id", 4)
    headers = {"Authorization": f"Bearer {token}"}

    print("=" * 100)
    print("GROW2GAIN: 16-QUERY MULTILINGUAL CHAT EVALUATION (ROUND 7c)")
    print("=" * 100)

    results = []
    for lang, q_text, purpose in QUERIES:
        payload = {
            "query": q_text,
            "language": lang,
            "farm_id": farm_id,
        }
        r = client.post("/api/v1/voice/query", json=payload, headers=headers)
        assert r.status_code == 200, f"Query failed ({r.status_code}): {r.text}"
        data = r.json()

        reply = data.get("spoken_text", "")
        intent = data.get("intent", "")
        provider = data.get("upstream_status", "Default Engine")
        sources = data.get("sources", [])

        results.append({
            "lang": lang,
            "query": q_text,
            "purpose": purpose,
            "intent": intent,
            "provider": provider,
            "reply": reply,
            "sources": sources,
        })

        print(f"\n[{lang.upper()}] Query: {q_text} ({purpose})")
        print(f"  Intent:   {intent} | Provider: {provider}")
        print(f"  Reply:    {reply}")
        print(f"  Sources:  {sources}")

    with open("model_artifacts/chat_16_queries_eval.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
