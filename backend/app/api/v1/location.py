from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from backend.app.services.location_data import get_states, get_districts, get_villages
from backend.app.services.geocoding import geocode_location

router = APIRouter(prefix="/location", tags=["Location"])


@router.get("/states", response_model=List[str])
def list_states():
    return get_states()


@router.get("/districts", response_model=List[str])
def list_districts(state: str = Query(..., description="Indian State name")):
    districts = get_districts(state)
    if not districts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"State '{state}' not found in location directory. Supported states include Telangana, Andhra Pradesh, Karnataka, Maharashtra.",
        )
    return districts


@router.get("/villages")
def list_villages(
    state: str = Query(..., description="State name"),
    district: str = Query(..., description="District name"),
):
    villages = get_villages(state, district)
    return {
        "state": state,
        "district": district,
        "is_partial": True,
        "note": "Village list is a representative sample for hackathon demonstration. Additional villages can be geocoded.",
        "villages": villages,
    }


@router.get("/geocode")
async def geocode(query: str = Query(..., min_length=2, description="Village, District or Mandal query")):
    result = await geocode_location(query)
    if result.get("latitude") is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Could not resolve geographic coordinates for location query '{query}'.",
        )
    return result

