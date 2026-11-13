from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.market import (
    MandiPriceResponse,
    MSPComparisonResponse,
    NetRealizationRankingResponse,
    PriceTrendResponse,
    WarehouseResponse,
)
from backend.app.services.market_service import (
    get_mandi_prices,
    get_msp_comparison,
    get_nearby_warehouses,
    get_net_realization_ranking,
    get_price_trends_and_forecast,
)

router = APIRouter(prefix="/market", tags=["Market Intelligence"])


@router.get("/prices", response_model=MandiPriceResponse)
async def read_mandi_prices(
    crop: str = Query("Cotton", description="Crop name to look up mandi prices for"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    state: Optional[str] = Query(None, description="Optional state filter"),
    db: Session = Depends(get_db),
):
    """
    Fetches mandi prices: attempts live data.gov.in AGMARKNET API using DATA_GOV_IN_API_KEY.
    Falls back to datasets/demo/mandi_prices.csv labelled DEMO if key is missing or API fails.
    Always returns source, fetched_at, and demo=true/false.
    """
    return await get_mandi_prices(crop=crop, district=district, state=state, db=db)


@router.get("/ranking", response_model=NetRealizationRankingResponse)
async def read_net_realization_ranking(
    crop: str = Query("Cotton", description="Crop commodity name"),
    quantity: float = Query(10.0, gt=0, description="Harvest quantity in quintals"),
    lat: float = Query(17.9689, description="Farmer farm latitude (default Warangal)"),
    lon: float = Query(79.5941, description="Farmer farm longitude (default Warangal)"),
    transport_rate: float = Query(2.50, gt=0, description="User-editable transport rate assumption (₹/km/quintal)"),
    market_fee_pct: float = Query(1.0, ge=0, description="User-editable APMC market fee assumption percentage"),
    db: Session = Depends(get_db),
):
    """
    Computes net realization ranking across nearby APMC mandis:
    net = (modal_price * quantity) - transport_cost - market_fee
    Ranks mandis descending by net realization and returns detailed calculation reasoning.
    """
    return await get_net_realization_ranking(
        crop=crop,
        quantity_quintals=quantity,
        lat=lat,
        lon=lon,
        transport_rate=transport_rate,
        market_fee_pct=market_fee_pct,
        db=db,
    )


@router.get("/msp", response_model=MSPComparisonResponse)
def read_msp_comparison(
    crop: str = Query("Cotton", description="Crop name to compare"),
    expected_price: float = Query(7100.0, description="Farmer expected price (₹/quintal)"),
):
    """
    Compares farmer expected price against official Government of India MSP benchmarks from datasets/msp.csv.
    Crops without official MSP (e.g. Chilli, Tomato) return 'MSP not verified'.
    """
    return get_msp_comparison(crop=crop, expected_price=expected_price)


@router.get("/trends", response_model=PriceTrendResponse)
def read_price_trends(
    crop: str = Query("Cotton", description="Crop commodity"),
    mandi: Optional[str] = Query(None, description="Optional APMC mandi name"),
):
    """
    Returns historical modal prices and indicative seasonal best-time-to-sell advisory.
    Explicitly labelled as an indicative seasonal pattern with historical error bounds; not a guarantee.
    """
    return get_price_trends_and_forecast(crop=crop, mandi_name=mandi)


@router.get("/warehouses", response_model=WarehouseResponse)
def read_nearby_warehouses(
    lat: float = Query(17.9689, description="Latitude coordinate"),
    lon: float = Query(79.5941, description="Longitude coordinate"),
):
    """
    Returns nearby warehouses and cold storages sorted by haversine distance.
    Labelled as demo dataset (demo=true).
    """
    return get_nearby_warehouses(lat=lat, lon=lon)

