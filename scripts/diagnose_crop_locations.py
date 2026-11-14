"""
AgriSage / Grow2Gain — Diagnostic Script for Crop Recommendation Across Locations.
Traces what inputs reach the recommender:
1. When hardcoded frontend defaults are used.
2. When real location weather (Open-Meteo) is used.
Tests 8 diverse locations across India:
- Warangal, Telangana
- Rajkot, Gujarat
- Jaipur, Rajasthan
- Kolkata, West Bengal
- Chennai, Tamil Nadu
- Shimla, Himachal Pradesh
- Guwahati, Assam
- Kochi, Kerala
"""
import sys
import json
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.ml.crop_recommender import crop_recommender_engine

LOCATIONS = [
    {"name": "Warangal", "state": "Telangana", "lat": 17.9689, "lon": 79.5941},
    {"name": "Rajkot", "state": "Gujarat", "lat": 22.3039, "lon": 70.8022},
    {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    {"name": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734},
    {"name": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362},
    {"name": "Kochi", "state": "Kerala", "lat": 9.9312, "lon": 76.2673},
]

def fetch_weather(lat: float, lon: float):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,precipitation&"
        f"daily=precipitation_sum,temperature_2m_max,temperature_2m_min&"
        f"timezone=auto"
    )
    req = urllib.request.urlopen(url, timeout=6)
    data = json.loads(req.read().decode())
    curr = data["current"]
    daily = data["daily"]
    rain_7d = sum(daily.get("precipitation_sum", [0.0]))
    # For annual/seasonal indicative rainfall approximation if dry spell:
    # Open-Meteo current precip or scaled 7-day precip
    return {
        "temperature": float(curr.get("temperature_2m", 25.0)),
        "humidity": float(curr.get("relative_humidity_2m", 60.0)),
        "precip_today": float(curr.get("precipitation", 0.0)),
        "rain_7d": float(rain_7d),
    }

def main():
    print("=" * 80)
    print("STEP 1: ROOT-CAUSE DEMONSTRATION — HARDCODED FRONTEND DEFAULTS")
    print("Earlier frontend CropRecommendationPage sent hardcoded default state:")
    print("  N=50, P=50, K=50, pH=6.5, Temp=28.0°C, Humidity=70.0%, Rainfall=180.0mm")
    print("  Chip displayed: 'Full Soil + Weather' (even when no soil test existed!)")
    print("=" * 80)

    for loc in LOCATIONS:
        # Same hardcoded vector regardless of location
        res = crop_recommender_engine.recommend(
            n=50.0,
            p=50.0,
            k=50.0,
            ph=6.5,
            temperature=28.0,
            humidity=70.0,
            rainfall=180.0,
            state=loc["state"],
            district=loc["name"],
            season="Kharif",
        )
        top3 = [f"{c['crop_name']} ({c['probability']*100:.1f}%)" for c in res["top_crops"]]
        input_vec = "[N=50, P=50, K=50, pH=6.5, Temp=28.0°C, Hum=70.0%, Rain=180.0mm]"
        print(f"Location: {loc['name']:10} ({loc['state']:16}) | Vector: {input_vec}")
        print(f"  --> Top 3 Crops: {', '.join(top3)}")
        print()

    print("=" * 80)
    print("STEP 2: LIVE OPEN-METEO WEATHER FOR EACH LOCATION")
    print("Tracing real temperature & humidity from Open-Meteo for each coordinate")
    print("=" * 80)

    live_weather_data = {}
    for loc in LOCATIONS:
        try:
            w = fetch_weather(loc["lat"], loc["lon"])
            live_weather_data[loc["name"]] = w
            print(f"{loc['name']:10} ({loc['lat']:7.4f}, {loc['lon']:7.4f}): Temp={w['temperature']:5.1f}°C, Hum={w['humidity']:4.1f}%, 7dRain={w['rain_7d']:5.1f}mm")
        except Exception as e:
            print(f"{loc['name']}: Error fetching weather: {e}")

    print("\n" + "=" * 80)
    print("STEP 3: RECOMMENDER WITH REAL WEATHER (SOIL OMITTED / 'soil not provided')")
    print("Evaluating weather-only model variant (N, P, K, pH = None) with real location weather")
    print("=" * 80)

    for loc in LOCATIONS:
        w = live_weather_data.get(loc["name"])
        if not w:
            continue
        # Use location temperature and humidity; use indicative seasonal rainfall
        # (or 7d rain scaled, or historical benchmark average for the climate zone)
        # In Kaggle dataset, rainfall is seasonal/annual in mm. E.g. Shimla ~ 120mm, Kochi ~ 250mm, Jaipur ~ 45mm, etc.
        # Let's test with real current temperature and humidity:
        res = crop_recommender_engine.recommend(
            n=None,
            p=None,
            k=None,
            ph=None,
            temperature=w["temperature"],
            humidity=w["humidity"],
            rainfall=max(w["rain_7d"] * 10, 40.0), # indicative seasonal rainfall
            state=loc["state"],
            district=loc["name"],
            season="Kharif",
        )
        top3 = [f"{c['crop_name']} ({c['probability']*100:.1f}%)" for c in res["top_crops"]]
        input_vec = f"[Soil=None, Temp={w['temperature']:.1f}°C, Hum={w['humidity']:.1f}%, Rain={max(w['rain_7d'] * 10, 40.0):.1f}mm]"
        print(f"Location: {loc['name']:10} ({loc['state']:16}) | Vector: {input_vec}")
        print(f"  --> Soil Missing: {res['soil_values_missing']}, Confidence: {res['confidence']}")
        print(f"  --> Top 3 Crops: {', '.join(top3)}")
        if res.get("climate_warnings"):
            print(f"  --> Warnings: {res['climate_warnings']}")
        print()

if __name__ == "__main__":
    main()
