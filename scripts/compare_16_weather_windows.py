import asyncio
import json
import httpx

LOCATIONS = [
    ("Warangal", "Telangana", 17.97, 79.59),
    ("Rajkot", "Gujarat", 22.30, 70.80),
    ("Jaipur", "Rajasthan", 26.91, 75.79),
    ("Kolkata", "West Bengal", 22.57, 88.36),
    ("Chennai", "Tamil Nadu", 13.08, 80.27),
    ("Shimla", "Himachal Pradesh", 31.10, 77.17),
    ("Guwahati", "Assam", 26.14, 91.74),
    ("Kochi", "Kerala", 9.93, 76.27),
    ("Nagpur", "Maharashtra", 21.15, 79.08),
    ("Ludhiana", "Punjab", 30.90, 75.85),
    ("Patna", "Bihar", 25.60, 85.14),
    ("Bhubaneswar", "Odisha", 20.30, 85.82),
    ("Pune", "Maharashtra", 18.52, 73.86),
    ("Coimbatore", "Tamil Nadu", 11.02, 76.96),
    ("Srinagar", "Jammu & Kashmir", 34.08, 74.80),
    ("Bikaner", "Rajasthan", 28.02, 73.31),
]

async def check():
    async with httpx.AsyncClient(timeout=25.0) as client:
        print(f"{'City':15s} | {'2023-11-15..2024-11-14':26s} | {'2025-11-15..2026-11-14':26s} | {'Rain Diff':10s}")
        print("-" * 85)
        for name, st, lat, lon in LOCATIONS:
            u_old = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date=2023-11-15&end_date=2024-11-14&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&timezone=auto"
            u_new = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date=2025-11-15&end_date=2026-11-14&daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&timezone=auto"
            
            resp_old = await client.get(u_old)
            resp_new = await client.get(u_new)
            
            r_old = resp_old.json().get('daily', {})
            r_new = resp_new.json().get('daily', {})
            
            p_old = sum(x for x in r_old.get('precipitation_sum', []) if x is not None) / 12.0
            t_old = sum(x for x in r_old.get('temperature_2m_mean', []) if x is not None) / max(1, len(r_old.get('temperature_2m_mean', [])))
            h_old = sum(x for x in r_old.get('relative_humidity_2m_mean', []) if x is not None) / max(1, len(r_old.get('relative_humidity_2m_mean', [])))
            
            p_new = sum(x for x in r_new.get('precipitation_sum', []) if x is not None) / 12.0
            t_new = sum(x for x in r_new.get('temperature_2m_mean', []) if x is not None) / max(1, len(r_new.get('temperature_2m_mean', [])))
            h_new = sum(x for x in r_new.get('relative_humidity_2m_mean', []) if x is not None) / max(1, len(r_new.get('relative_humidity_2m_mean', [])))
            
            diff = p_new - p_old
            print(f"{name:15s} | {t_old:4.1f}°C, {h_old:4.1f}%, {p_old:5.1f}mm | {t_new:4.1f}°C, {h_new:4.1f}%, {p_new:5.1f}mm | {diff:+5.1f}mm")
            await asyncio.sleep(0.3)

if __name__ == "__main__":
    asyncio.run(check())
