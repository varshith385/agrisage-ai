import asyncio
from backend.app.database.session import SessionLocal
from backend.app.models.user import User
from backend.app.models.farm import Farm
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.services.voice_service import voice_service

QUERIES = [
    # 8 Telugu
    ("te", "ఈరోజు నా పొలానికి నీరు పెట్టాలా?"),
    ("te", "ఈరోజు వర్షం పడుతుందా?"),
    ("te", "పత్తి మార్కెట్ ధర ఎంత?"),
    ("te", "నా పొలానికి ఏ పంట వేయాలి?"),
    ("te", "ఆకు మచ్చలు కనిపిస్తున్నాయి ఏం చేయాలి?"),
    ("te", "రేపు ఉదయం 6 గంటలకు పత్తికి నీరు పెట్టాలని గుర్తు చేయండి"),
    ("te", "ప్రభుత్వ సబ్సిడీ పథకాలు ఏమున్నాయి?"),
    ("te", "నమస్కారం, మీరు ఎవరు?"),
    # 4 Hindi
    ("hi", "क्या आज कपास में पानी देना चाहिए?"),
    ("hi", "आज मौसम कैसा रहेगा और क्या बारिश होगी?"),
    ("hi", "कपास का मंडी भाव क्या है?"),
    ("hi", "कल सुबह 6 बजे कपास में पानी देने का स्मरण कराएं"),
    # 4 English
    ("en", "Should I irrigate my cotton holding today?"),
    ("en", "What is today's weather forecast?"),
    ("en", "What is the modal mandi price for cotton?"),
    ("en", "remind me tomorrow 6 am to water"),
]

async def main():
    db = SessionLocal()
    farmer = db.query(User).filter(User.role == "Farmer").first()
    farm = db.query(Farm).filter(Farm.user_id == farmer.id).first() if farmer else db.query(Farm).first()

    print("================================================================================")
    print("16 LIVE CHAT QUERIES EVALUATION (8 Telugu, 4 Hindi, 4 English)")
    print(f"Active Farmer: {farmer.email if farmer else 'Demo'} | Active Farm: {farm.name if farm else 'None'}")
    print("================================================================================\n")

    for i, (lang, q) in enumerate(QUERIES, 1):
        req = VoiceQueryRequest(query=q, preferred_language=lang, farm_id=farm.id if farm else None)
        resp = await voice_service.process_query(req, farmer, db)
        provider = resp.upstream_status or "Deterministic Engine"
        
        print(f"QUERY {i} [{lang.upper()}]: \"{q}\"")
        print(f"  Intent         : {resp.intent}")
        print(f"  Provider Used  : {provider}")
        print(f"  Status         : {resp.status}")
        print(f"  Raw Spoken Text: \"{resp.spoken_text}\"")
        if lang == "te":
            print(f"  Language Review: needs native review")
        print("-" * 80)

    db.close()

if __name__ == "__main__":
    asyncio.run(main())
