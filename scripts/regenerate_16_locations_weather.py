import asyncio
import json
import httpx
from datetime import datetime, timedelta, timezone
from pathlib import Path

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

now_utc = datetime.now(timezone.utc)
end_date_dt = (now_utc - timedelta(days=1)).date()
start_date_dt = end_date_dt - timedelta(days=364)
start_date = start_date_dt.strftime("%Y-%m-%d")
end_date = end_date_dt.strftime("%Y-%m-%d")

print(f"Fetching Open-Meteo 12-month archive window: {start_date} to {end_date} (365 complete days)")

async def fetch_location(client, name, state, lat, lon):
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lon}&"
        f"start_date={start_date}&end_date={end_date}&"
        f"daily=temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&"
        f"timezone=auto"
    )
    for attempt in range(3):
        try:
            resp = await client.get(url, timeout=15.0)
            resp.raise_for_status()
            data = resp.json()
            daily = data.get("daily", {})
            temps = [t for t in daily.get("temperature_2m_mean", []) if t is not None]
            hums = [h for h in daily.get("relative_humidity_2m_mean", []) if h is not None]
            rains = [r for r in daily.get("precipitation_sum", []) if r is not None]
            if len(temps) < 300:
                raise ValueError(f"Insufficient daily series: {len(temps)} days")

            mean_temp = round(float(sum(temps) / len(temps)), 1)
            mean_hum = round(float(sum(hums) / len(hums)), 1)
            annual_rain = round(float(sum(rains)), 1)
            monthly_rain = round(float(sum(rains) / 12.0), 1)

            print(f"  [OK] {name:15s} ({state}): T={mean_temp}°C, H={mean_hum}%, R={monthly_rain} mm/mo (Days: {len(temps)})")
            return name, {
                "lat": lat,
                "lon": lon,
                "state": state,
                "temp": mean_temp,
                "humidity": mean_hum,
                "rainfall_monthly": monthly_rain,
                "rainfall_annual": annual_rain,
                "window_start_date": start_date,
                "window_end_date": end_date,
                "days": len(temps),
                "source": "Open-Meteo Historical Archive API (trailing 12 months)",
            }
        except Exception as e:
            if attempt == 2:
                print(f"  [FAIL] {name}: {e}")
                raise
            await asyncio.sleep(1.0)

async def main():
    async with httpx.AsyncClient() as client:
        results = {}
        for city, state, lat, lon in LOCATIONS:
            name, info = await fetch_location(client, city, state, lat, lon)
            results[name] = info
            await asyncio.sleep(0.3)

    out_path = Path("model_artifacts/weather_16_locations.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved updated 16 locations weather data to {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
