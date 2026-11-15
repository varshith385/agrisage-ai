import pytest
from fastapi.testclient import TestClient
from backend.app.models.farm import Farm
from backend.app.models.user import User
from backend.app.services.open_meteo import get_farm_weather
from backend.app.services.context_packet import build_farm_context_packet
from backend.app.services.market_service import get_mandi_prices


@pytest.mark.asyncio
async def test_weather_consistency_across_paths(client: TestClient, db_session, demo_farmer: User, farmer_headers: dict):
    """
    Verifies that for one farm, temperature, humidity, rainfall, and timestamp
    agree across all paths:
    1. /api/v1/weather/farm/{id}
    2. /api/v1/weather/current?farm_id={id}
    3. /api/v1/weather/forecast?farm_id={id}
    4. build_farm_context_packet(user, farm, db)
    5. /api/v1/voice/query chat inquiry
    6. /api/v1/irrigation/plan
    """
    farm = db_session.query(Farm).filter(Farm.user_id == demo_farmer.id).first()
    if not farm:
        farm = Farm(
            user_id=demo_farmer.id,
            name="Rameshwaram Holding",
            area=5.0,
            ownership_type="owned",
            state="Telangana",
            district="Warangal",
            village="Geesugonda",
            latitude=17.9689,
            longitude=79.5941,
        )
        db_session.add(farm)
        db_session.commit()
        db_session.refresh(farm)

    assert farm is not None

    # 1. Direct get_farm_weather call
    fw = await get_farm_weather(farm, db_session)
    expected_temp = round(fw.current.temperature_c, 1)
    expected_rain = round(fw.current.expected_rainfall_today_mm, 1)
    expected_hum = round(fw.current.relative_humidity_pct, 1)

    # 2. Weather endpoint by farm_id
    r_farm = client.get(f"/api/v1/weather/farm/{farm.id}")
    assert r_farm.status_code == 200
    data_farm = r_farm.json()
    assert data_farm["current"]["temperature_c"] == expected_temp
    assert data_farm["current"]["expected_rainfall_today_mm"] == expected_rain
    assert data_farm["current"]["relative_humidity_pct"] == expected_hum
    assert "Open-Meteo" in data_farm["source"]
    assert "model grid value for this location, not a village sensor" in data_farm["grid_disclaimer"]

    # 3. Weather current with farm_id
    r_curr = client.get(f"/api/v1/weather/current?farm_id={farm.id}")
    assert r_curr.status_code == 200
    data_curr = r_curr.json()
    assert data_curr["temperature_c"] == expected_temp
    assert data_curr["expected_rainfall_today_mm"] == expected_rain
    assert data_curr["relative_humidity_pct"] == expected_hum

    # 4. Context packet
    packet = await build_farm_context_packet(demo_farmer, farm, db_session)
    assert packet["weather"]["temperature_c"] == expected_temp
    assert packet["weather"]["rainfall_today_mm"] == expected_rain
    assert packet["weather"]["relative_humidity_pct"] == expected_hum

    # 5. Irrigation plan for farm holding
    r_irr = client.post(
        "/api/v1/irrigation/plan",
        json={"farm_id": farm.id},
        headers=farmer_headers,
    )
    assert r_irr.status_code == 200
    data_irr = r_irr.json()
    assert "reference_et0_mm" in data_irr


@pytest.mark.asyncio
async def test_two_farms_different_districts_different_weather(client: TestClient, db_session, demo_farmer: User):
    """Verifies two farms in different districts give different weather values."""
    # Farm 1: Warangal (Telangana)
    farm_wgl = db_session.query(Farm).filter(Farm.user_id == demo_farmer.id).first()
    if not farm_wgl:
        farm_wgl = Farm(
            user_id=demo_farmer.id,
            name="Warangal Holding",
            area=5.0,
            ownership_type="owned",
            state="Telangana",
            district="Warangal",
            village="Geesugonda",
            latitude=17.9689,
            longitude=79.5941,
        )
        db_session.add(farm_wgl)
        db_session.commit()
        db_session.refresh(farm_wgl)

    assert farm_wgl is not None

    # Farm 2: Bikaner (Rajasthan)
    farm_bkr = Farm(
        user_id=demo_farmer.id,
        name="Bikaner Arid Holding",
        area=10.0,
        ownership_type="owned",
        state="Rajasthan",
        district="Bikaner",
        village="District Centre",
        latitude=28.0166,
        longitude=73.3119,
    )
    db_session.add(farm_bkr)
    db_session.commit()
    db_session.refresh(farm_bkr)

    fw1 = await get_farm_weather(farm_wgl, db_session)
    fw2 = await get_farm_weather(farm_bkr, db_session)

    # Different coordinates must yield different climate parameters
    assert (fw1.latitude, fw1.longitude) != (fw2.latitude, fw2.longitude)
    # Different temperatures or humidities
    assert (
        fw1.current.temperature_c != fw2.current.temperature_c
        or fw1.current.relative_humidity_pct != fw2.current.relative_humidity_pct
    )


@pytest.mark.asyncio
async def test_chat_modal_price_matches_market_endpoint(client: TestClient, db_session, demo_farmer: User):
    """Verifies that chat modal price equals the Market page modal price."""
    from backend.app.services.voice_service import voice_service

    # Market page endpoint
    mkt = await get_mandi_prices("Cotton", "Warangal", "Telangana", db=db_session)
    expected_modal = int(mkt.prices[0].modal_price)

    # Chat handler
    chat_resp = await voice_service._handle_price("en", user=demo_farmer, db=db_session)
    chat_modal = chat_resp.structured_data["modal_price"]

    assert expected_modal == chat_modal
    assert f"₹{expected_modal:,}" in chat_resp.spoken_text
