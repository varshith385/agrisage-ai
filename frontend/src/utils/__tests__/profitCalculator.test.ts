import { describe, it, expect } from 'vitest';
import { computeProfit, ComputeProfitInputs } from '../profitCalculator';

describe('computeProfit pure function', () => {
  it('calculates profit, revenue, cost, margin, and break-even accurately matching backend formula', () => {
    const inputs: ComputeProfitInputs = {
      crop: 'Cotton',
      area: 5.0,
      irrigation_type: 'sprinkler', // multiplier = 1.0
      lease_cost: 10000.0,
      yield_per_acre: 8.0,
      price_per_quintal: 7000.0,
      editable_costs: {
        seed: 2400.0,
        fertilizer: 5500.0,
        pesticide: 4800.0,
        labour: 12000.0,
        machinery: 4000.0,
        irrigation: 2000.0,
        fuel: 1500.0,
        transport: 1200.0,
        storage: 500.0,
        other: 1100.0,
      }, // sum = 35,000 / acre
      ownership_type: 'mixed',
      leased_area: 2.0,
      loan_amount: 20000.0,
      loan_interest_rate_pct: 7.0,
    };

    const res = computeProfit(inputs);

    // Hand calculation:
    // op_cost = 35,000 * 5 = 175,000
    // lease_cost = 2 * 10,000 = 20,000
    // loan_interest = 20,000 * 0.07 = 1,400
    // total_cost = 175,000 + 20,000 + 1,400 = 196,400
    // production = 8 * 5 = 40 quintals
    // revenue = 40 * 7,000 = 280,000
    // net_profit = 280,000 - 196,400 = 83,600
    // margin = (83,600 / 280,000) * 100 = 29.857...% => 29.86%
    // break_even_price = 196,400 / 40 = 4,910.00
    // break_even_yield = 196,400 / (7,000 * 5) = 5.61 q/acre

    expect(res.total_operating_cost).toBe(175000);
    expect(res.total_lease_cost).toBe(20000);
    expect(res.loan_interest).toBe(1400);
    expect(res.total_cost).toBe(196400);
    expect(res.total_production_q).toBe(40);
    expect(res.gross_revenue).toBe(280000);
    expect(res.net_profit).toBe(83600);
    expect(res.margin_pct).toBeCloseTo(29.86, 1);
    expect(res.break_even_price).toBe(4910);
    expect(res.break_even_yield).toBeCloseTo(5.61, 2);
  });

  it('updates result when price or yield changes', () => {
    const baseInputs: ComputeProfitInputs = {
      crop: 'Cotton',
      area: 5.0,
      irrigation_type: 'drip',
      lease_cost: 10000.0,
      yield_per_acre: 8.0,
      price_per_quintal: 7000.0,
      editable_costs: { seed: 10000 },
      ownership_type: 'owned',
    };

    const initial = computeProfit(baseInputs);

    // Change price
    const higherPrice = computeProfit({ ...baseInputs, price_per_quintal: 8000 });
    expect(higherPrice.gross_revenue).toBeGreaterThan(initial.gross_revenue);
    expect(higherPrice.net_profit).toBe(initial.net_profit + (8000 - 7000) * 8 * 5);

    // Change yield
    const higherYield = computeProfit({ ...baseInputs, yield_per_acre: 10 });
    expect(higherYield.gross_revenue).toBeGreaterThan(initial.gross_revenue);
    expect(higherYield.net_profit).toBe(initial.net_profit + (10 - 8) * 5 * 7000);
  });
});

