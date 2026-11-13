from typing import List, Optional
from pydantic import BaseModel, Field


class MandiPriceRecord(BaseModel):
    mandi: str
    district: str
    state: str
    commodity: str
    variety: Optional[str] = None
    arrival_date: str
    min_price: float
    max_price: float
    modal_price: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    is_demo: bool = True
    source: str
    last_verified: Optional[str] = None


class MandiPriceResponse(BaseModel):
    crop: str
    district: Optional[str] = None
    state: Optional[str] = None
    prices: List[MandiPriceRecord] = []
    total_records: int
    status: str = "DEMO"
    source: str
    fetched_at: str
    demo: bool


class NetRealizationItem(BaseModel):
    mandi: str
    district: str
    state: str
    modal_price: float
    quantity_quintals: float
    distance_km: float
    transport_rate_per_km_per_q: float
    transport_cost: float
    market_fee_pct: float
    market_fee: float
    gross_revenue: float
    net_realization: float
    net_realization_per_q: float
    rank: int
    reasoning: str
    is_demo: bool
    source: str


class NetRealizationRankingResponse(BaseModel):
    crop: str
    quantity_quintals: float
    farmer_latitude: float
    farmer_longitude: float
    transport_rate_assumption: float
    market_fee_pct_assumption: float
    assumptions_note: str
    rankings: List[NetRealizationItem]
    best_mandi: Optional[NetRealizationItem] = None
    status: str = "DEMO"
    source: str
    fetched_at: str
    demo: bool


class MSPBenchmarkItem(BaseModel):
    crop: str
    variety: str
    season: str
    year: str
    msp_per_quintal: Optional[float] = None
    source_url: str
    source_organization: str
    last_verified: Optional[str] = None


class MSPComparisonResponse(BaseModel):
    crop: str
    expected_price_per_q: float
    msp_verified: bool
    benchmark: Optional[MSPBenchmarkItem] = None
    status_label: str  # "above_msp", "below_msp", "at_msp", "msp_not_verified"
    variance_amount: Optional[float] = None
    variance_pct: Optional[float] = None
    explanation: str
    source_url: Optional[str] = None
    last_verified: Optional[str] = None
    status: str = "PARTIAL"
    demo: bool = False


class HistoricalPricePoint(BaseModel):
    month_year: str
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrivals_tonnes: Optional[float] = None
    is_forecast: bool = False


class PriceTrendResponse(BaseModel):
    crop: str
    mandi: str
    historical_prices: List[HistoricalPricePoint]
    forecast_prices: List[HistoricalPricePoint]
    trend_direction: str  # "rising", "stable", "falling"
    best_time_to_sell_hint: str
    seasonal_pattern_summary: str
    error_margin_pct: Optional[float] = None
    disclaimer: str
    is_indicative: bool = True
    status: str = "DEMO"
    source: str
    demo: bool


class WarehouseItem(BaseModel):
    name: str
    warehouse_type: str
    district: str
    state: str
    distance_km: Optional[float] = None
    capacity_mt: float
    daily_charge_per_quintal: float
    source: str
    demo: bool = True


class WarehouseResponse(BaseModel):
    warehouses: List[WarehouseItem]
    farmer_latitude: Optional[float] = None
    farmer_longitude: Optional[float] = None
    status: str = "DEMO"
    source: str
    demo: bool = True

