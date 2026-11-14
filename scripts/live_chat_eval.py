"""
Live Chat Query Evaluation across real LLM providers and rule engines in en, te, and hi.
Tests 8 diverse agricultural queries across both Groq and Gemini and records exact raw output.
"""

import asyncio
from backend.app.config import settings
from backend.app.database.session import SessionLocal
from backend.app.models.farm import Farm
from backend.app.models.user import User
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.services.voice_service import voice_service
from backend.app.services.llm_client import call_gemini_chat, call_groq_chat


async def main():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "ramesh@agrisage.demo").first()
    if not user:
        user = db.query(User).first()
    farm = db.query(Farm).filter(Farm.user_id == user.id).first()

    test_queries = [
        {"query": "Will it rain today?", "lang": "en", "category": "Weather (EN)"},
        {"query": "ఈరోజు వర్షం పడుతుందా?", "lang": "te", "category": "Weather (TE)"},
        {"query": "क्या आज बारिश होगी?", "lang": "hi", "category": "Weather (HI)"},
        {"query": "ఈరోజు నా పత్తి పంటకు నీరు పెట్టాలా?", "lang": "te", "category": "Irrigation (TE)"},
        {"query": "వరంగల్ మార్కెట్లో పత్తి ధర ఎంత?", "lang": "te", "category": "Mandi Price (TE)"},
        {"query": "పత్తిలో గులాబీ రంగు పురుగు నివారణకు ఏం చేయాలి?", "lang": "te", "category": "Crop Advice / Pest Management (TE)"},
        {"query": "మార్కెట్ తెరవండి", "lang": "te", "category": "Open Market / Navigation (TE)"},
        {"query": "రేపు ఉదయం 6 గంటలకు పురుగుల తనిఖీ చేయాలని గుర్తుచేయి", "lang": "te", "category": "Reminders (TE)"},
    ]

    print("=" * 80)
    print("LIVE CHAT EVALUATION REPORT (Phase 3)")
    print(f"Configured LLM Provider Order: {settings.LLM_PROVIDER_ORDER}")
    print(f"Groq Model: {settings.GROQ_MODEL} | Gemini Model: {settings.GEMINI_MODEL}")
    print("=" * 80)

    for item in test_queries:
        req = VoiceQueryRequest(
            query=item["query"],
            language=item["lang"],
            farm_id=farm.id if farm else None,
        )
        print(f"\n------------------------------------------------------------")
        print(f"[Category]: {item['category']}")
        print(f"Query: \"{item['query']}\" (Selected Language: {item['lang']})")

        try:
            res = await voice_service.process_query(req, user, db)
            provider = "N/A (Rule/Engine)"
            if res.structured_data and "provider" in res.structured_data:
                provider = f"{res.structured_data['provider']} ({res.structured_data.get('model', '')})"
            elif res.sources:
                provider = ", ".join(res.sources)

            print(f"Resolved Intent: {res.intent} (Confidence: {res.confidence}, Type: {res.confidence_type})")
            print(f"Mode: {res.mode} | Provider/Source: {provider}")
            print(f"Upstream Status: {res.upstream_status}")
            print(f"Action: link={res.action_link}, label=\"{res.action_label}\", type={res.action_type}")
            print(f"Raw Response Text:\n{res.spoken_text}")
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {str(e)}")

    # Also test Gemini directly on Telugu to evaluate Telugu quality comparison
    print("\n" + "=" * 80)
    print("DIRECT GEMINI PROVIDER CHECK (Telugu Agronomic Chat)")
    print("=" * 80)
    try:
        gemini_res = await call_gemini_chat(
            system_instruction=(
                "You are Grow2Gain, an agronomic assistant for smallholder Indian farmers.\n"
                "MANDATORY LANGUAGE REQUIREMENT: You MUST write your ENTIRE reply in Telugu (తెలుగు script).\n"
                "Do NOT mix any English words, except the brand name 'Grow2Gain', numbers, and standard metric units.\n"
                "Strictly NEVER prescribe chemical dosages or banned pesticides. Keep to 1-2 spoken sentences."
            ),
            user_prompt="పత్తిలో గులాబీ రంగు పురుగు నివారణకు ఏం చేయాలి?",
            timeout=8.0,
        )
        if gemini_res:
            print(f"Provider: {gemini_res.provider} ({gemini_res.model})")
            print(f"Status: {gemini_res.status_label}")
            print(f"Raw Response Text:\n{gemini_res.text}")
        else:
            print("Gemini response was empty or timed out.")
    except Exception as exc:
        print(f"Gemini direct check error: {exc}")

    db.close()


if __name__ == "__main__":
    asyncio.run(main())
