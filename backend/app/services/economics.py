"""
Economics & Profitability Calculation Engine for AgriSage AI
Uses Python Decimal for all monetary math to prevent floating point drift.
"""

from decimal import Decimal, ROUND_HALF_UP
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.app.schemas.economics import (
    CostLineItems,
    EconomicsCalculationRequest,
    EconomicsCalculationResponse,
    TenureEconomicsDetail,
    ScenarioOutcome,
    CropComparisonItem,
    CropComparisonResponse,
    WhatIfRequest,
    WhatIfResponse,
    WhatIfPoint,
)

TEMPLATES_PATH = Path(__file__).resolve().parent.parent / "data" / "cost_templates.json"

_CACHED_TEMPLATES: Optional[Dict[str, Any]] = None


def load_cost_templates() -> Dict[str, Any]:
    global _CACHED_TEMPLATES
    if _CACHED_TEMPLATES is None:
        if TEMPLATES_PATH.exists():
            with open(TEMPLATES_PATH, "r", encoding="utf-8") as f:
                _CACHED_TEMPLATES = json.load(f)
        else:
            _CACHED_TEMPLATES = {"_metadata": {}, "templates": {}}
    return _CACHED_TEMPLATES


def get_crop_template(crop_name: str) -> Optional[Dict[str, Any]]:
    data = load_cost_templates()
    templates = data.get("templates", {})
    key = crop_name.lower().strip()
    return templates.get(key)


def _fmt(val: Decimal) -> str:
    """Format Decimal to 2 decimal places with comma separation."""
    rounded = val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return f"{rounded:,.2f}"


def _calc_tenure_detail(
    area: Decimal,
    op_cost_per_acre: Decimal,
    lease_cost_per_acre: Decimal,
    loan_interest: Decimal,
    yield_q_per_acre: Decimal,
    price_per_q: Decimal,
) -> TenureEconomicsDetail:
    if area <= Decimal("0"):
        return TenureEconomicsDetail(
            area_acres=0.0,
            operating_cost_total="0.00",
            operating_cost_per_acre="0.00",
            lease_cost_total="0.00",
            loan_interest_total="0.00",
            total_cost="0.00",
            total_cost_per_acre="0.00",
            gross_revenue="0.00",
            gross_profit="0.00",
            net_profit="0.00",
            margin_pct=0.0,
            break_even_price_per_q=None,
            break_even_yield_q_per_acre=None,
        )

    op_total = (op_cost_per_acre * area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    lease_total = (lease_cost_per_acre * area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tot_cost = (op_total + lease_total + loan_interest).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tot_cost_per_acre = (tot_cost / area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    production = (yield_q_per_acre * area).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    revenue = (production * price_per_q).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gross_profit = (revenue - op_total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net_profit = (revenue - tot_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    margin = 0.0
    if revenue > Decimal("0"):
        margin = float(((net_profit / revenue) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    be_price = None
    if production > Decimal("0"):
        be_price = _fmt(tot_cost / production)

    be_yield = None
    if price_per_q > Decimal("0"):
        be_yield = _fmt(tot_cost / (price_per_q * area))

    return TenureEconomicsDetail(
        area_acres=float(area),
        operating_cost_total=_fmt(op_total),
        operating_cost_per_acre=_fmt(op_cost_per_acre),
        lease_cost_total=_fmt(lease_total),
        loan_interest_total=_fmt(loan_interest),
        total_cost=_fmt(tot_cost),
        total_cost_per_acre=_fmt(tot_cost_per_acre),
        gross_revenue=_fmt(revenue),
        gross_profit=_fmt(gross_profit),
        net_profit=_fmt(net_profit),
        margin_pct=margin,
        break_even_price_per_q=be_price,
        break_even_yield_q_per_acre=be_yield,
    )


def calculate_economics(req: EconomicsCalculationRequest) -> EconomicsCalculationResponse:
    template = get_crop_template(req.crop_name) or {}

    # 1. Determine base line items per acre
    default_costs = template.get("costs_per_acre", {
        "seed": 2500.0,
        "fertilizer": 5000.0,
        "pesticide": 4000.0,
        "labour": 10000.0,
        "machinery": 4000.0,
        "irrigation": 2000.0,
        "fuel": 1500.0,
        "transport": 1000.0,
        "storage": 500.0,
        "other": 1000.0,
    })

    costs_dict = default_costs.copy()
    if req.custom_costs:
        custom_dict = req.custom_costs.model_dump()
        costs_dict.update(custom_dict)

    # Operating cost per acre as Decimal
    op_cost_per_acre = sum(Decimal(str(v)) for v in costs_dict.values()).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # 2. Areas and lease cost
    tot_area = Decimal(str(req.area))
    owned_area = Decimal(str(req.owned_area if req.owned_area is not None else req.area))
    leased_area = Decimal(str(req.leased_area if req.leased_area is not None else 0.0))

    lease_rate = Decimal(str(req.lease_cost_per_acre if req.lease_cost_per_acre is not None else 0.0))

    # 3. Loan interest: (P * R * T) / 100
    loan_p = Decimal(str(req.loan_amount))
    loan_r = Decimal(str(req.loan_interest_rate_pct))
    loan_t_years = Decimal(str(req.loan_tenure_months)) / Decimal("12")
    tot_loan_interest = ((loan_p * loan_r / Decimal("100")) * loan_t_years).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Prorate loan interest by area for owned vs leased
    interest_owned = Decimal("0")
    interest_leased = Decimal("0")
    if tot_area > Decimal("0"):
        interest_owned = (tot_loan_interest * (owned_area / tot_area)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        interest_leased = tot_loan_interest - interest_owned

    yield_q = Decimal(str(req.expected_yield_q_per_acre))
    price_q = Decimal(str(req.expected_price_per_q))

    # 4. Compute Owned Tenure
    owned_detail = None
    if owned_area > Decimal("0"):
        owned_detail = _calc_tenure_detail(
            area=owned_area,
            op_cost_per_acre=op_cost_per_acre,
            lease_cost_per_acre=Decimal("0"),
            loan_interest=interest_owned,
            yield_q_per_acre=yield_q,
            price_per_q=price_q,
        )

    # 5. Compute Leased Tenure
    leased_detail = None
    if leased_area > Decimal("0"):
        leased_detail = _calc_tenure_detail(
            area=leased_area,
            op_cost_per_acre=op_cost_per_acre,
            lease_cost_per_acre=lease_rate,
            loan_interest=interest_leased,
            yield_q_per_acre=yield_q,
            price_per_q=price_q,
        )

    # 6. Combined summary (exact sum of owned and leased)
    tot_operating = (op_cost_per_acre * tot_area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tot_lease = (lease_rate * leased_area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tot_cost = (tot_operating + tot_lease + tot_loan_interest).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tot_cost_per_acre = (tot_cost / tot_area).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    tot_production = (yield_q * tot_area).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    gross_revenue = (tot_production * price_q).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gross_profit = (gross_revenue - tot_operating).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net_profit = (gross_revenue - tot_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    combined_margin = 0.0
    if gross_revenue > Decimal("0"):
        combined_margin = float(((net_profit / gross_revenue) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    combined_be_price = None
    if tot_production > Decimal("0"):
        combined_be_price = _fmt(tot_cost / tot_production)

    combined_be_yield = None
    if price_q > Decimal("0"):
        combined_be_yield = _fmt(tot_cost / (price_q * tot_area))

    combined_summary = TenureEconomicsDetail(
        area_acres=float(tot_area),
        operating_cost_total=_fmt(tot_operating),
        operating_cost_per_acre=_fmt(op_cost_per_acre),
        lease_cost_total=_fmt(tot_lease),
        loan_interest_total=_fmt(tot_loan_interest),
        total_cost=_fmt(tot_cost),
        total_cost_per_acre=_fmt(tot_cost_per_acre),
        gross_revenue=_fmt(gross_revenue),
        gross_profit=_fmt(gross_profit),
        net_profit=_fmt(net_profit),
        margin_pct=combined_margin,
        break_even_price_per_q=combined_be_price,
        break_even_yield_q_per_acre=combined_be_yield,
    )

    # 7. Scenarios: Base, Best (+15% yield, +10% price), Worst (-20% yield, -15% price)
    scenarios: List[ScenarioOutcome] = []

    scenario_configs = [
        ("Base Case", "Expected baseline harvest and market price", Decimal("1.0"), Decimal("1.0")),
        ("Best Case", "Favorable weather (+15% yield) and buoyant mandi price (+10%)", Decimal("1.15"), Decimal("1.10")),
        ("Worst Case", "Weather/pest shock (-20% yield) and soft harvest prices (-15%)", Decimal("0.80"), Decimal("0.85")),
    ]

    for name, desc, y_mult, p_mult in scenario_configs:
        sc_yield = (yield_q * y_mult).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sc_price = (price_q * p_mult).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sc_production = (sc_yield * tot_area).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        sc_rev = (sc_production * sc_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sc_net = (sc_rev - tot_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sc_margin = 0.0
        if sc_rev > Decimal("0"):
            sc_margin = float(((sc_net / sc_rev) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

        scenarios.append(
            ScenarioOutcome(
                name=name,
                description=desc,
                yield_q_per_acre=float(sc_yield),
                price_per_q=float(sc_price),
                gross_revenue=_fmt(sc_rev),
                total_cost=_fmt(tot_cost),
                net_profit=_fmt(sc_net),
                margin_pct=sc_margin,
                is_profitable=(sc_net >= Decimal("0")),
            )
        )

    # 8. Labels
    yield_label = "user estimate" if (req.yield_is_user_estimate or req.crop_name.lower() == "cotton") else "district mean baseline / ML range"

    return EconomicsCalculationResponse(
        crop_name=req.crop_name,
        crop_name_te=template.get("crop_name_te"),
        crop_name_hi=template.get("crop_name_hi"),
        area_acres=float(tot_area),
        ownership_type=req.ownership_type,
        owned_area_acres=float(owned_area),
        leased_area_acres=float(leased_area),
        expected_yield_q_per_acre=float(yield_q),
        yield_source_label=yield_label,
        expected_price_per_q=float(price_q),
        price_source_label="price: your estimate (MSP not verified)",
        itemized_costs_per_acre={k: float(v) for k, v in costs_dict.items()},
        owned_tenure=owned_detail,
        leased_tenure=leased_detail,
        combined_summary=combined_summary,
        scenarios=scenarios,
        status="WORKING",
    )


def compare_crops(
    area_acres: float = 5.0,
    ownership_type: str = "mixed",
    leased_ratio: float = 0.4,
    lease_cost_per_acre: float = 10000.0,
) -> CropComparisonResponse:
    """
    Side-by-side comparison matrix for candidate crops across duration, water, costs, revenue, and profits.
    """
    data = load_cost_templates()
    templates = data.get("templates", {})
    results: List[CropComparisonItem] = []

    area_dec = Decimal(str(area_acres))
    leased_area = (area_dec * Decimal(str(leased_ratio))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    lease_rate = Decimal(str(lease_cost_per_acre)) if ownership_type in ["leased", "mixed"] else Decimal("0")

    for key, item in templates.items():
        costs = item.get("costs_per_acre", {})
        op_cost = sum(Decimal(str(v)) for v in costs.values())
        tot_op = op_cost * area_dec
        tot_lease = lease_rate * leased_area if ownership_type == "mixed" else (lease_rate * area_dec if ownership_type == "leased" else Decimal("0"))
        tot_cost = tot_op + tot_lease

        exp_yield = Decimal(str(item.get("default_expected_yield_q_per_acre", 10.0)))
        exp_price = Decimal(str(item.get("default_expected_price_per_q", 3000.0)))

        production = exp_yield * area_dec
        revenue = production * exp_price
        net_profit = revenue - tot_cost
        margin = float(((net_profit / revenue) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if revenue > Decimal("0") else 0.0

        be_price = float((tot_cost / production).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if production > Decimal("0") else 0.0
        be_yield = float((tot_cost / (exp_price * area_dec)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if (exp_price * area_dec) > Decimal("0") else 0.0

        results.append(
            CropComparisonItem(
                crop_name=item.get("crop_name", key.capitalize()),
                crop_name_te=item.get("crop_name_te", ""),
                crop_name_hi=item.get("crop_name_hi", ""),
                typical_duration_days=item.get("typical_duration_days", 120),
                water_need_mm=float(item.get("water_need_mm", 500)),
                risk_level=item.get("risk_level", "medium"),
                estimated_cost_per_acre=float(op_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                estimated_yield_q_per_acre=float(exp_yield),
                estimated_price_per_q=float(exp_price),
                estimated_revenue_per_acre=float((revenue / area_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                estimated_net_profit_per_acre=float((net_profit / area_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                margin_pct=margin,
                break_even_price_per_q=be_price,
                break_even_yield_q_per_acre=be_yield,
            )
        )

    # Sort descending by net profit per acre
    results.sort(key=lambda x: x.estimated_net_profit_per_acre, reverse=True)

    return CropComparisonResponse(
        area_acres=area_acres,
        ownership_type=ownership_type,
        crops=results,
        status="WORKING",
    )


def simulate_what_if(req: WhatIfRequest) -> WhatIfResponse:
    """
    Live slider sensitivity simulator for Price, Yield, Area, or Lease Cost.
    Client-side formulas match this exact logic.
    """
    area_dec = Decimal(str(req.area_acres))
    leased_area_dec = Decimal(str(req.leased_area))
    lease_rate_dec = Decimal(str(req.lease_cost_per_acre))
    price_dec = Decimal(str(req.price_per_q))
    yield_dec = Decimal(str(req.yield_q_per_acre))
    op_cost_per_acre = Decimal(str(req.operating_cost_per_acre))

    loan_p = Decimal(str(req.loan_amount))
    loan_r = Decimal(str(req.loan_interest_rate_pct))
    loan_interest = (loan_p * loan_r / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # Baseline calculation
    base_op_cost = op_cost_per_acre * area_dec
    base_lease_cost = lease_rate_dec * leased_area_dec if req.ownership_type in ["leased", "mixed"] else Decimal("0")
    base_tot_cost = base_op_cost + base_lease_cost + loan_interest

    base_production = yield_dec * area_dec
    base_revenue = base_production * price_dec
    base_net_profit = base_revenue - base_tot_cost

    base_margin = 0.0
    if base_revenue > Decimal("0"):
        base_margin = float(((base_net_profit / base_revenue) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    be_price = float((base_tot_cost / base_production).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if base_production > Decimal("0") else None
    be_yield = float((base_tot_cost / (price_dec * area_dec)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if (price_dec * area_dec) > Decimal("0") else None

    # Sweep sensitivity points: -30%, -20%, -10%, 0%, +10%, +20%, +30%
    points: List[WhatIfPoint] = []
    pct_range = req.sweep_range_pct
    step_pcts = [-pct_range, -pct_range * 0.66, -pct_range * 0.33, 0.0, pct_range * 0.33, pct_range * 0.66, pct_range]

    for delta in step_pcts:
        multiplier = Decimal("1.0") + (Decimal(str(delta)) / Decimal("100"))
        if multiplier < Decimal("0"):
            multiplier = Decimal("0")

        # Adjust variable
        curr_p = price_dec
        curr_y = yield_dec
        curr_a = area_dec
        curr_l_rate = lease_rate_dec

        if req.sweep_variable == "price":
            curr_p = (price_dec * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            var_val = float(curr_p)
        elif req.sweep_variable == "yield":
            curr_y = (yield_dec * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            var_val = float(curr_y)
        elif req.sweep_variable == "area":
            curr_a = (area_dec * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            var_val = float(curr_a)
        elif req.sweep_variable == "lease_cost":
            curr_l_rate = (lease_rate_dec * multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            var_val = float(curr_l_rate)
        else:
            var_val = float(price_dec)

        # Scale leased area proportionally if total area sweeps
        curr_leased_a = leased_area_dec
        if req.sweep_variable == "area" and area_dec > Decimal("0"):
            curr_leased_a = (curr_a * (leased_area_dec / area_dec)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Evaluate
        pt_op = op_cost_per_acre * curr_a
        pt_lease = curr_l_rate * curr_leased_a if req.ownership_type in ["leased", "mixed"] else Decimal("0")
        pt_cost = pt_op + pt_lease + loan_interest
        pt_prod = curr_y * curr_a
        pt_rev = pt_prod * curr_p
        pt_net = pt_rev - pt_cost
        pt_margin = float(((pt_net / pt_rev) * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if pt_rev > Decimal("0") else 0.0

        points.append(
            WhatIfPoint(
                variable_value=var_val,
                revenue=float(pt_rev.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                total_cost=float(pt_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                net_profit=float(pt_net.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                margin_pct=pt_margin,
            )
        )

    return WhatIfResponse(
        current_net_profit=float(base_net_profit.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        current_margin_pct=base_margin,
        break_even_price_per_q=be_price,
        break_even_yield_q_per_acre=be_yield,
        sweep_variable=req.sweep_variable,
        sensitivity_points=points,
        status="WORKING",
    )
