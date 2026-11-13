from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class CostLineItems(BaseModel):
    seed: float = Field(default=0.0, ge=0.0, description="Seed or planting material cost per acre (Rs.)")
    fertilizer: float = Field(default=0.0, ge=0.0, description="Fertilizers and soil nutrients cost per acre (Rs.)")
    pesticide: float = Field(default=0.0, ge=0.0, description="Plant protection chemicals/organic biocides cost per acre (Rs.)")
    labour: float = Field(default=0.0, ge=0.0, description="Human labour costs for weeding, sowing, picking per acre (Rs.)")
    machinery: float = Field(default=0.0, ge=0.0, description="Tractor, rotavator, or machine hire charges per acre (Rs.)")
    irrigation: float = Field(default=0.0, ge=0.0, description="Pump operation, electricity, or canal cess per acre (Rs.)")
    fuel: float = Field(default=0.0, ge=0.0, description="Diesel and fuel expenses for on-farm equipment per acre (Rs.)")
    transport: float = Field(default=0.0, ge=0.0, description="Post-harvest transportation to mandi/market per acre (Rs.)")
    storage: float = Field(default=0.0, ge=0.0, description="Warehouse or godown storage charges per acre (Rs.)")
    other: float = Field(default=0.0, ge=0.0, description="Miscellaneous farming consumables per acre (Rs.)")


class EconomicsCalculationRequest(BaseModel):
    crop_name: str = Field(..., description="Target crop name (e.g. Cotton, Rice, Maize)")
    area: float = Field(..., gt=0.0, description="Cultivated land area")
    area_unit: Literal["acres", "hectares"] = Field(default="acres", description="Land measurement unit")
    ownership_type: Literal["owned", "leased", "mixed"] = Field(default="owned", description="Land ownership structure")
    owned_area: Optional[float] = Field(default=None, ge=0.0, description="Acreage owned by farmer (for mixed holdings)")
    leased_area: Optional[float] = Field(default=None, ge=0.0, description="Acreage leased by farmer (for mixed holdings)")
    lease_cost_per_acre: Optional[float] = Field(default=None, ge=0.0, description="Annual cash lease rent per acre (Rs.)")
    irrigation_method: Optional[str] = Field(default="drip", description="Irrigation system used (drip, sprinkler, furrow, flood)")
    expected_yield_q_per_acre: float = Field(..., ge=0.0, description="Expected harvest yield in quintals per acre")
    yield_is_user_estimate: bool = Field(default=False, description="Whether yield is farmer estimate (mandatory True for cotton)")
    expected_price_per_q: float = Field(..., ge=0.0, description="Expected mandi sales price in Rs. per quintal")
    custom_costs: Optional[CostLineItems] = Field(default=None, description="Custom per-acre cost overrides")
    loan_amount: float = Field(default=0.0, ge=0.0, description="Total institutional crop loan amount borrowed (Rs.)")
    loan_interest_rate_pct: float = Field(default=0.0, ge=0.0, description="Annual crop loan interest rate percentage (e.g. 7.0 for KCC)")
    loan_tenure_months: int = Field(default=12, ge=1, le=60, description="Crop loan duration in months")

    @model_validator(mode="after")
    def validate_tenure_and_area(self):
        # Convert hectares to acres if needed: 1 hectare = 2.47105 acres
        if self.area_unit == "hectares":
            self.area = round(self.area * 2.47105, 4)
            if self.owned_area is not None:
                self.owned_area = round(self.owned_area * 2.47105, 4)
            if self.leased_area is not None:
                self.leased_area = round(self.leased_area * 2.47105, 4)
            self.area_unit = "acres"

        if self.ownership_type == "owned":
            self.owned_area = self.area
            self.leased_area = 0.0
            self.lease_cost_per_acre = 0.0
        elif self.ownership_type == "leased":
            self.leased_area = self.area
            self.owned_area = 0.0
            if self.lease_cost_per_acre is None:
                self.lease_cost_per_acre = 10000.0  # Indicative default
        elif self.ownership_type == "mixed":
            o = self.owned_area or 0.0
            l = self.leased_area or 0.0
            if abs((o + l) - self.area) > 0.05:
                raise ValueError(
                    f"Owned area ({o:.2f} ac) + Leased area ({l:.2f} ac) must equal total area ({self.area:.2f} ac)"
                )
            if self.lease_cost_per_acre is None:
                self.lease_cost_per_acre = 10000.0
        return self


class TenureEconomicsDetail(BaseModel):
    area_acres: float
    operating_cost_total: str
    operating_cost_per_acre: str
    lease_cost_total: str
    loan_interest_total: str
    total_cost: str
    total_cost_per_acre: str
    gross_revenue: str
    gross_profit: str
    net_profit: str
    margin_pct: float
    break_even_price_per_q: Optional[str] = None
    break_even_yield_q_per_acre: Optional[str] = None


class ScenarioOutcome(BaseModel):
    name: str
    description: str
    yield_q_per_acre: float
    price_per_q: float
    gross_revenue: str
    total_cost: str
    net_profit: str
    margin_pct: float
    is_profitable: bool


class EconomicsCalculationResponse(BaseModel):
    crop_name: str
    crop_name_te: Optional[str] = None
    crop_name_hi: Optional[str] = None
    area_acres: float
    ownership_type: str
    owned_area_acres: float
    leased_area_acres: float
    expected_yield_q_per_acre: float
    yield_source_label: str
    expected_price_per_q: float
    price_source_label: str = "price: your estimate (MSP not verified)"
    itemized_costs_per_acre: Dict[str, float]
    owned_tenure: Optional[TenureEconomicsDetail] = None
    leased_tenure: Optional[TenureEconomicsDetail] = None
    combined_summary: TenureEconomicsDetail
    scenarios: List[ScenarioOutcome]
    disclaimer: str = (
        "indicative estimate, edit to your actual cost; monetary calculations use Decimal arithmetic"
    )
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"


class CropComparisonItem(BaseModel):
    crop_name: str
    crop_name_te: str
    crop_name_hi: str
    typical_duration_days: int
    water_need_mm: float
    risk_level: str
    estimated_cost_per_acre: float
    estimated_yield_q_per_acre: float
    estimated_price_per_q: float
    estimated_revenue_per_acre: float
    estimated_net_profit_per_acre: float
    margin_pct: float
    break_even_price_per_q: float
    break_even_yield_q_per_acre: float


class CropComparisonResponse(BaseModel):
    area_acres: float
    ownership_type: str
    crops: List[CropComparisonItem]
    disclaimer: str = (
        "Comparative economics matrix is based on indicative default cost templates; edit actual values on the economics page."
    )
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"


class WhatIfRequest(BaseModel):
    crop_name: str = "Cotton"
    area_acres: float = Field(default=5.0, gt=0.0)
    ownership_type: Literal["owned", "leased", "mixed"] = "mixed"
    owned_area: float = Field(default=3.0, ge=0.0)
    leased_area: float = Field(default=2.0, ge=0.0)
    lease_cost_per_acre: float = Field(default=10000.0, ge=0.0)
    price_per_q: float = Field(default=7100.0, ge=0.0)
    yield_q_per_acre: float = Field(default=8.0, ge=0.0)
    operating_cost_per_acre: float = Field(default=35000.0, ge=0.0)
    loan_amount: float = Field(default=0.0, ge=0.0)
    loan_interest_rate_pct: float = Field(default=0.0, ge=0.0)
    sweep_variable: Literal["price", "yield", "area", "lease_cost"] = "price"
    sweep_range_pct: float = Field(default=30.0, ge=5.0, le=75.0)


class WhatIfPoint(BaseModel):
    variable_value: float
    revenue: float
    total_cost: float
    net_profit: float
    margin_pct: float


class WhatIfResponse(BaseModel):
    current_net_profit: float
    current_margin_pct: float
    break_even_price_per_q: Optional[float] = None
    break_even_yield_q_per_acre: Optional[float] = None
    sweep_variable: str
    sensitivity_points: List[WhatIfPoint]
    formula_used: str = (
        "Net Profit = (Yield * Area * Price) - (Operating Cost * Area) - (Leased Area * Lease Rate) - Loan Interest"
    )
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
