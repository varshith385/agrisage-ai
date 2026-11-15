import asyncio
from backend.app.database.session import SessionLocal
from backend.app.models.farm import Farm
from backend.app.models.user import User
from backend.app.services.open_meteo import get_farm_weather, get_climate_normals
from backend.app.services.context_packet import build_farm_context_packet
from backend.app.services.voice_service import voice_service

async def main():
    db = SessionLocal()
    farmer = db.query(User).filter(User.role == 'Farmer').first()
    farm = db.query(Farm).filter(Farm.user_id == farmer.id).first() if farmer else db.query(Farm).first()
    if not farm:
        farm = db.query(Farm).first()
    
    fw = await get_farm_weather(farm, db)
    temp = fw.current.temperature_c
    hum = fw.current.relative_humidity_pct
    rain = fw.current.expected_rainfall_today_mm
    et0 = fw.current.reference_et0_mm
    source = fw.current.source
    disclaimer = fw.current.grid_disclaimer
    
    packet = await build_farm_context_packet(farmer, farm, db)
    pw = packet['weather']
    p_temp = pw['temperature_c']
    p_rain = pw['rainfall_today_mm']
    p_et0 = pw['reference_et0_mm']
    
    normals = await get_climate_normals(farm.latitude, farm.longitude)
    norm_temp = normals['mean_temperature_c']
    norm_hum = normals['mean_relative_humidity_pct']
    norm_rain = normals['mean_monthly_rainfall_mm']
    w_start = normals['window_start_date']
    w_end = normals['window_end_date']
    
    print(f"Weather comparison table for farm: {farm.name} ({farm.village}, {farm.district}, {farm.state}) [{farm.latitude}, {farm.longitude}]")
    print("| Component / Page | Endpoint / Function | Temp (°C) | Humidity (%) | Rain (mm) | ET0 (mm) | Source / Note |")
    print("|---|---|---|---|---|---|---|")
    print(f"| **Weather Page** | `/api/v1/weather/farm/{farm.id}` | {temp}°C | {hum}% | {rain} mm | {et0} mm | {source} ({disclaimer}) |")
    print(f"| **Dashboard Page** | `useFarmWeather` / `context_packet` | {p_temp}°C | {hum}% | {p_rain} mm | {p_et0} mm | {source} ({disclaimer}) |")
    print(f"| **Irrigation Page** | `/api/v1/irrigation/plan` | — | — | {rain} mm (24h rain) | {et0} mm (ET0) | FAO-56 water budget from same weather |")
    print(f"| **Chat / Assistant** | `/api/v1/voice/query` | {temp}°C | — | {rain} mm | — | Open-Meteo grid model value |")
    print(f"| **Crop Advisory** | `climate-normals` (12mo avg) | {norm_temp}°C | {norm_hum}% | {norm_rain} mm/mo | — | 12-month average ({w_start} to {w_end}) |")
    db.close()

if __name__ == '__main__':
    asyncio.run(main())
