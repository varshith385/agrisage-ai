import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


MOCK_OPEN_METEO_SUCCESS = {
    "latitude": 17.38,
    "longitude": 78.48,
    "current": {
        "temperature_2m": 26.5,
        "relative_humidity_2m": 65.0,
        "precipitation": 0.0,
        "wind_speed_10m": 12.4,
    },
    "daily": {
        "time": ["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"],
        "temperature_2m_max": [31.2, 32.0, 30.5, 29.8, 31.0, 31.5, 30.0],
        "temperature_2m_min": [19.5, 20.0, 19.0, 18.5, 19.2, 19.8, 19.0],
        "precipitation_sum": [0.0, 5.2, 12.0, 0.0, 0.0, 2.5, 0.0],
        "precipitation_probability_max": [10, 45, 75, 15, 10, 30, 5],
        "et0_fao_evapotranspiration": [4.6, 4.4, 4.2, 4.8, 4.7, 4.5, 4.6],
    },
}


@pytest.mark.asyncio
async def test_weather_success_and_caching(client: TestClient):
    with patch("backend.app.services.open_meteo.fetch_open_meteo_raw", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = MOCK_OPEN_METEO_SUCCESS

        res = client.get("/api/v1/weather/forecast?lat=17.38&lon=78.48")
        assert res.status_code == 200
        data = res.json()
        assert data["stale"] is False
        assert data["current"]["temperature_c"] == 26.5
        assert len(data["daily"]) == 7
        assert data["daily"][0]["temp_max_c"] == 31.2
        assert data["daily"][0]["reference_et0_mm"] == 4.6
        assert mock_fetch.call_count == 1

        # Second request within 30 mins hits cache, mock_fetch is NOT called again
        res_cached = client.get("/api/v1/weather/forecast?lat=17.38&lon=78.48")
        assert res_cached.status_code == 200
        assert res_cached.json()["stale"] is False
        assert mock_fetch.call_count == 1


@pytest.mark.asyncio
async def test_weather_failure_with_stale_cache_fallback(client: TestClient):
    # 1. Prime cache with success
    with patch("backend.app.services.open_meteo.fetch_open_meteo_raw", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = MOCK_OPEN_METEO_SUCCESS
        client.get("/api/v1/weather/forecast?lat=18.50&lon=79.20")

    # 2. Simulate API failure on subsequent request after cache expiry
    with patch("backend.app.services.open_meteo.fetch_open_meteo_raw", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = Exception("Open-Meteo connection timeout")

        # Manually query: since cached entry exists, it falls back to stale=true
        res = client.get("/api/v1/weather/forecast?lat=18.50&lon=79.20")
        assert res.status_code == 200
        data = res.json()
        # Stale cache returned with warning
        assert data["current"]["temperature_c"] == 26.5


@pytest.mark.asyncio
async def test_weather_failure_without_cache_returns_503(client: TestClient):
    # Query uncharted coordinates where no cache exists
    with patch("backend.app.services.open_meteo.fetch_open_meteo_raw", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.side_effect = Exception("Network unreachable")

        res = client.get("/api/v1/weather/forecast?lat=25.99&lon=85.99")
        assert res.status_code == 503
        assert "temporarily unreachable" in res.json()["detail"]


@pytest.mark.asyncio
async def test_crop_suitability_explainability_schema(client: TestClient):
    with patch("backend.app.services.open_meteo.fetch_open_meteo_raw", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = MOCK_OPEN_METEO_SUCCESS

        res = client.get("/api/v1/weather/suitability?crop=cotton&lat=17.38&lon=78.48")
        assert res.status_code == 200
        data = res.json()
        assert data["crop"] == "cotton"
        assert data["confidence_type"] == "rule"
        assert data["status"] == "WORKING"
        assert isinstance(data["reasons"], list)
        assert len(data["reasons"]) >= 1
        assert isinstance(data["sources"], list)
        assert any("Open-Meteo" in s for s in data["sources"])
        assert isinstance(data["limitations"], list)
        assert any("approximate village centroid" in lim for lim in data["limitations"])

