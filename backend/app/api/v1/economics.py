from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.economics import (
    CropComparisonResponse,
    EconomicsCalculationRequest,
    EconomicsCalculationResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from backend.app.security.auth import get_current_user
from backend.app.services.economics import (
    calculate_economics,
    compare_crops,
    load_cost_templates,
    simulate_what_if,
)

router = APIRouter(prefix="/economics", tags=["Economics"])


@router.post("/calculate", response_model=EconomicsCalculationResponse)
def calculate_crop_economics(
    payload: EconomicsCalculationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Calculate comprehensive cost-of-cultivation, revenue, gross/net profit,
    and break-even metrics using exact Decimal arithmetic.
    Computes owned vs leased tenure separately and aggregates for mixed holdings.
    """
    try:
        return calculate_economics(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing economics: {str(e)}",
        )


@router.get("/templates")
def get_cost_templates(
    current_user: User = Depends(get_current_user),
):
    """
    Returns default per-acre cost templates across 10 major crops.
    All templates are explicitly marked 'indicative estimate, edit to your actual cost'.
    """
    return load_cost_templates()


@router.get("/compare", response_model=CropComparisonResponse)
def get_crop_comparison(
    area_acres: float = Query(5.0, gt=0.0, description="Cultivated land area in acres"),
    ownership_type: str = Query("mixed", description="Ownership type: owned, leased, or mixed"),
    leased_ratio: float = Query(0.4, ge=0.0, le=1.0, description="Ratio of leased land if mixed"),
    lease_cost_per_acre: float = Query(10000.0, ge=0.0, description="Annual lease cost per acre (Rs.)"),
    current_user: User = Depends(get_current_user),
):
    """
    Compare top candidate crops side-by-side (duration, water needs, costs, revenue, profit, margins).
    """
    return compare_crops(
        area_acres=area_acres,
        ownership_type=ownership_type,
        leased_ratio=leased_ratio,
        lease_cost_per_acre=lease_cost_per_acre,
    )


@router.post("/what-if", response_model=WhatIfResponse)
def run_what_if_simulation(
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Interactive sensitivity simulation across Price, Yield, Area, or Lease Cost.
    Client-side slider formulas are verified against this exact backend logic.
    """
    return simulate_what_if(payload)
