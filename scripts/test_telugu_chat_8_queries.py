import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8030"

QUERIES = [
    {
        "domain": "Weather (వాతావరణం)",
        "prompt": "ఈ రోజు వర్షం పడుతుందా?",
        "lang": "te"
    },
    {
        "domain": "Irrigation (నీటిపారుదల)",
        "prompt": "నేను ఈ రోజు నా పత్తి పంటకు నీరు పెట్టాలా?",
        "lang": "te"
    },
    {
        "domain": "Market Price (మార్కెట్ ధర)",
        "prompt": "వరంగల్ మార్కెట్లో పత్తి ధర ఎంత ఉంది?",
        "lang": "te"
    },
    {
        "domain": "Crop Advisory (పంట సిఫార్సు)",
        "prompt": "నా నేలకు ఏ పంట బాగా సరిపోతుంది?",
        "lang": "te"
    },
    {
        "domain": "Open Market / Buyer (ఓపెన్ మార్కెట్ / కొనుగోలుదారులు)",
        "prompt": "వరంగల్ దగ్గర పత్తి కొనుగోలుదారులు ఎవరైనా ఉన్నారా?",
        "lang": "te"
    },
    {
        "domain": "Reminders (గుర్తుచేసేవి)",
        "prompt": "నా పత్తి పంటకు ఎరువులు ఎప్పుడు వేయాలి?",
        "lang": "te"
    },
    {
        "domain": "Disease Diagnosis (తెగుళ్ల నిర్ధారణ)",
        "prompt": "పత్తి ఆకులపై మచ్చలు వస్తే ఏం చేయాలి?",
        "lang": "te"
    },
    {
        "domain": "Cultivation Cost (సాగు వ్యయం)",
        "prompt": "ఎకరాకు పత్తి సాగు ఖర్చు ఎంత అవుతుంది?",
        "lang": "te"
    }
]

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Demo login
        login_res = await client.post(f"{BASE_URL}/api/v1/auth/demo-login")
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("=" * 80)
        print("TELUGU CHAT VERIFICATION — 8 VARIED DOMAIN QUERIES")
        print("=" * 80)

        results = []
        for i, q in enumerate(QUERIES, 1):
            res = await client.post(
                f"{BASE_URL}/api/v1/voice/query",
                json={"query": q["prompt"], "language": q["lang"], "farm_id": 4},
                headers=headers
            )
            data = res.json()
            results.append({
                "num": i,
                "domain": q["domain"],
                "prompt": q["prompt"],
                "status_code": res.status_code,
                "intent": data.get("intent"),
                "spoken_text": data.get("spoken_text"),
                "sources": data.get("sources"),
                "confidence": data.get("confidence"),
                "action_link": data.get("action_link")
            })

            print(f"\n[{i}] DOMAIN: {q['domain']}")
            print(f"PROMPT (TE): {q['prompt']}")
            print(f"INTENT: {data.get('intent')} (Confidence: {data.get('confidence')})")
            print(f"SOURCES: {', '.join(data.get('sources', []))}")
            print(f"RESPONSE (TE): {data.get('spoken_text')}")
            print(f"ACTION LINK: {data.get('action_link')}")
            print("-" * 60)

        with open("model_artifacts/telugu_chat_8_results.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(main())
