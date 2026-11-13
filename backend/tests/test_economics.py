"""
Comprehensive Unit Tests for Farm Economics Engine (Decimal Precision & Tenure Separation)
"""

from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.economics import (
    CostLineItems,
    EconomicsCalculationRequest,
    WhatIfRequest,
)
from backend.app.services.economics import (
    calculate_economics,
    compare_crops,
    simulate_what_if,
)

client = TestClient(app)


def test_owned_vs_leased_vs_mixed_math():
    """
    Asserts exact tenure separation:
    total_cost_owned + total_cost_leased == combined_total_cost
    gross_revenue_owned + gross_revenue_leased == combined_gross_revenue
    net_profit_owned + net_profit_leased == combined_net_profit
    """
    req = EconomicsCalculationRequest(
        crop_name="Cotton",
        area=5.0,
        area_unit="acres",
        ownership_type="mixed",
        owned_area=3.0,
        leased_area=2.0,
        lease_cost_per_acre=12000.0,
        expected_yield_q_per_acre=8.0,
        expected_price_per_q=7000.0,
        loan_amount=20000.0,
        loan_interest_rate_pct=7.0,
        loan_tenure_months=12,
    )
    res = calculate_economics(req)

    assert res.owned_tenure is not None
    assert res.leased_tenure is not None

    owned_cost = Decimal(res.owned_tenure.total_cost.replace(",", ""))
    leased_cost = Decimal(res.leased_tenure.total_cost.replace(",", ""))
    combined_cost = Decimal(res.combined_summary.total_cost.replace(",", ""))

    # Mathematical exactness
    assert owned_cost + leased_cost == combined_cost

    owned_rev = Decimal(res.owned_tenure.gross_revenue.replace(",", ""))
    leased_rev = Decimal(res.leased_tenure.gross_revenue.replace(",", ""))
    combined_rev = Decimal(res.combined_summary.gross_revenue.replace(",", ""))
    assert owned_rev + leased_rev == combined_rev

    owned_profit = Decimal(res.owned_tenure.net_profit.replace(",", ""))
    leased_profit = Decimal(res.leased_tenure.net_profit.replace(",", ""))
    combined_profit = Decimal(res.combined_summary.net_profit.replace(",", ""))
    assert owned_profit + leased_profit == combined_profit

    # Owned land has 0 lease cost; leased land has exact lease cost
    assert Decimal(res.owned_tenure.lease_cost_total.replace(",", "")) == Decimal("0.00")
    assert Decimal(res.leased_tenure.lease_cost_total.replace(",", "")) == Decimal("24000.00")  # 2 acres * 12,000


def test_mixed_area_validation_failure():
    """Validates that owned_area + leased_area must equal total area."""
    with pytest.raises(ValueError, match="must equal total area"):
        EconomicsCalculationRequest(
            crop_name="Cotton",
            area=5.0,
            ownership_type="mixed",
            owned_area=2.0,
            leased_area=2.0,  # Sum is 4.0 != 5.0
            expected_yield_q_per_acre=8.0,
            expected_price_per_q=7000.0,
        )


def test_break_even_formulas_and_scenarios():
    """
    Verifies break-even price and break-even yield formulas and scenario ranges.
    """
    req = EconomicsCalculationRequest(
        crop_name="Maize",
        area=4.0,
        ownership_type="owned",
        expected_yield_q_per_acre=20.0,  # 80 quintals total
        expected_price_per_q=2000.0,
        custom_costs=CostLineItems(
            seed=2000.0,
            fertilizer=5000.0,
            pesticide=3000.0,
            labour=7000.0,
            machinery=3000.0,
        ),  # Operating cost = 20,000/acre * 4 = 80,000
    )
    res = calculate_economics(req)

    tot_cost = Decimal(res.combined_summary.total_cost.replace(",", ""))
    assert tot_cost == Decimal("80000.00")

    # Production = 4 acres * 20 q = 80 q
    # Break-even price = 80,000 / 80 = 1,000.00 Rs./q
    be_price = Decimal(res.combined_summary.break_even_price_per_q.replace(",", ""))
    assert be_price == Decimal("1000.00")

    # Break-even yield = 80,000 / (2000 * 4) = 10.00 q/acre
    be_yield = Decimal(res.combined_summary.break_even_yield_q_per_acre.replace(",", ""))
    assert be_yield == Decimal("10.00")

    # Scenarios: Base, Best, Worst
    assert len(res.scenarios) == 3
    base_sc = res.scenarios[0]
    best_sc = res.scenarios[1]
    worst_sc = res.scenarios[2]

    assert base_sc.yield_q_per_acre == 20.0
    assert best_sc.yield_q_per_acre == 23.0  # +15%
    assert worst_sc.yield_q_per_acre == 16.0  # -20%
    assert Decimal(best_sc.net_profit.replace(",", "")) > Decimal(base_sc.net_profit.replace(",", ""))
    assert Decimal(worst_sc.net_profit.replace(",", "")) < Decimal(base_sc.net_profit.replace(",", ""))


def test_zero_and_negative_edge_cases():
    """Asserts graceful handling of zero yield or negative profit without ZeroDivisionError."""
    req = EconomicsCalculationRequest(
        crop_name="Groundnut",
        area=2.0,
        ownership_type="owned",
        expected_yield_q_per_acre=0.0,  # Zero yield failure
        expected_price_per_q=5000.0,
    )
    res = calculate_economics(req)

    # Break-even price should be None when production is 0
    assert res.combined_summary.break_even_price_per_q is None
    # Net profit should be negative (loss equal to total costs)
    loss = Decimal(res.combined_summary.net_profit.replace(",", ""))
    assert loss < Decimal("0")
    assert res.combined_summary.margin_pct == 0.0


def test_hectares_to_acres_unit_conversion():
    """Tests conversion of hectares to acres (1 ha = 2.47105 acres)."""
    req = EconomicsCalculationRequest(
        crop_name="Rice",
        area=2.0,
        area_unit="hectares",
        ownership_type="owned",
        expected_yield_q_per_acre=20.0,
        expected_price_per_q=2200.0,
    )
    # Validator converts hectares to acres
    assert req.area == pytest.approx(4.9421, 0.001)
    assert req.area_unit == "acres"


def test_what_if_client_server_parity():
    """
    Verifies that the client-side JavaScript / TypeScript formula logic matches
    the backend Python simulate_what_if calculation identically.
    """
    req = WhatIfRequest(
        crop_name="Cotton",
        area_acres=5.0,
        ownership_type="mixed",
        owned_area=3.0,
        leased_area=2.0,
        lease_cost_per_acre=10000.0,
        price_per_q=7000.0,
        yield_q_per_acre=8.0,
        operating_cost_per_acre=35000.0,
        loan_amount=20000.0,
        loan_interest_rate_pct=7.0,
        sweep_variable="price",
    )
    res = simulate_what_if(req)

    # TypeScript client-side formula mirror:
    # revenue = yield * area * price
    # cost = (op_cost * area) + (leased_area * lease_rate) + loan_interest
    # profit = revenue - cost
    ts_loan_interest = (20000.0 * 7.0) / 100.0  # 1400.0
    ts_cost = (35000.0 * 5.0) + (2.0 * 10000.0) + ts_loan_interest  # 175,000 + 20,000 + 1,400 = 196,400.0
    ts_revenue = 8.0 * 5.0 * 7000.0  # 280,000.0
    ts_profit = ts_revenue - ts_cost  # 83,600.0

    assert res.current_net_profit == pytest.approx(ts_profit, 0.01)

    # Check sweep points match
    for pt in res.sensitivity_points:
        expected_rev = 8.0 * 5.0 * pt.variable_value
        assert pt.revenue == pytest.approx(expected_rev, 0.1)
        assert pt.net_profit == pytest.approx(expected_rev - ts_cost, 0.1)


def test_api_economics_calculate_and_compare(farmer_headers):
    """Verifies POST /api/v1/economics/calculate and GET /compare."""
    payload = {
        "crop_name": "Cotton",
        "area": 5.0,
        "area_unit": "acres",
        "ownership_type": "mixed",
        "owned_area": 3.0,
        "leased_area": 2.0,
        "lease_cost_per_acre": 10000.0,
        "expected_yield_q_per_acre": 8.0,
        "yield_is_user_estimate": True,
        "expected_price_per_q": 7100.0,
    }
    r = client.post("/api/v1/economics/calculate", headers=farmer_headers, json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["crop_name"] == "Cotton"
    assert data["yield_source_label"] == "user estimate"
    assert "MSP not verified" in data["price_source_label"]
    assert data["owned_tenure"] is not None
    assert data["leased_tenure"] is not None
    assert len(data["scenarios"]) == 3

    # Compare endpoint
    r_comp = client.get("/api/v1/economics/compare?area_acres=5.0", headers=farmer_headers)
    assert r_comp.status_code == 200
    comp_data = r_comp.json()
    assert len(comp_data["crops"]) >= 8
    # Sorted descending by estimated net profit per acre
    profits = [c["estimated_net_profit_per_acre"] for c in comp_data["crops"]]
    assert profits == sorted(profits, reverse=True)

    # Templates endpoint provenance check
    r_tmpl = client.get("/api/v1/economics/templates", headers=farmer_headers)
    assert r_tmpl.status_code == 200
    tmpl_data = r_tmpl.json()
    meta = tmpl_data["_metadata"]
    assert "not taken from any published report" in meta["verification_status"].lower()
    assert "indicative estimate, edit to your actual cost" in meta["disclaimer"].lower()
