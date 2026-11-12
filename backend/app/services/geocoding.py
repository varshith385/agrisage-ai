import httpx
from typing import Optional, Dict
from backend.app.services.location_data import find_approx_centroid


async def geocode_location(query: str) -> Dict[str, Optional[float]]:
    """
    Geocodes a location name to lat/lon via Open-Meteo Geocoding API with 5s timeout.
    Falls back to internal static centroid lookup if external API fails or is unreachable.
    """
    clean_query = query.strip()
    if not clean_query:
        return {"name": "", "latitude": None, "longitude": None, "source": "none"}

    url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_query}&count=1&language=en&format=json"
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results")
                if results and len(results) > 0:
                    first = results[0]
                    return {
                        "name": f"{first.get('name')}, {first.get('admin1', '')}, {first.get('country', '')}".strip(", "),
                        "latitude": float(first.get("latitude")),
                        "longitude": float(first.get("longitude")),
                        "source": "Open-Meteo Geocoding API",
                        "approximate": False,
                    }
    except Exception:
        # Fall back gracefully to internal static database
        pass

    fallback = find_approx_centroid(clean_query)
    if fallback:
        return {
            "name": fallback["name"],
            "latitude": fallback["lat"],
            "longitude": fallback["lon"],
            "source": "Local Static Agro-Climatic Dataset (Fallback)",
            "approximate": True,
        }

    return {
        "name": clean_query,
        "latitude": None,
        "longitude": None,
        "source": "not_found",
        "approximate": True,
    }

