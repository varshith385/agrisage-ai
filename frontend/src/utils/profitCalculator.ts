/**
 * Pure function computeProfit(inputs) for AgriSage AI
 * Verified against Python Decimal backend simulate_what_if.
 */

export interface ComputeProfitInputs {
  crop: string;
  area: number;
  irrigation_type: string;
  lease_cost: number;
  yield_per_acre: number;
  price_per_quintal: number;
  editable_costs: Record<string, number | undefined> | any;
  ownership_type?: 'owned' | 'leased' | 'mixed';
  leased_area?: number;
  loan_amount?: number;
  loan_interest_rate_pct?: number;
}

export interface ProfitResult {
  total_operating_cost: number;
  operating_cost_per_acre: number;
  total_lease_cost: number;
  loan_interest: number;
  total_cost: number;
  total_production_q: number;
  gross_revenue: number;
  net_profit: number;
  margin_pct: number;
  break_even_price: number | null;
  break_even_yield: number | null;
}

export function computeProfit(inputs: ComputeProfitInputs): ProfitResult {
  const area = Math.max(0, Number(inputs.area) || 0);
  const yieldPerAcre = Math.max(0, Number(inputs.yield_per_acre) || 0);
  const pricePerQ = Math.max(0, Number(inputs.price_per_quintal) || 0);
  const leaseCostRate = Math.max(0, Number(inputs.lease_cost) || 0);

  const rawCosts = inputs.editable_costs || {};
  let opCostPerAcre = 0;
  for (const [key, val] of Object.entries(rawCosts)) {
    let numVal = Math.max(0, Number(val) || 0);
    if (key.toLowerCase() === 'irrigation' && inputs.irrigation_type) {
      const it = inputs.irrigation_type.toLowerCase();
      const mult = it === 'drip' ? 0.9 : it === 'flood' ? 1.3 : it === 'furrow' ? 1.15 : 1.0;
      numVal = Math.round(numVal * mult);
    }
    opCostPerAcre += numVal;
  }

  const totalOpCost = opCostPerAcre * area;

  // Lease cost
  const ownership = inputs.ownership_type || 'mixed';
  let leasedArea = 0;
  if (ownership === 'leased') {
    leasedArea = area;
  } else if (ownership === 'mixed') {
    if (inputs.leased_area !== undefined) {
      leasedArea = Math.min(area, Math.max(0, Number(inputs.leased_area) || 0));
    } else {
      leasedArea = area * 0.4;
    }
  }
  const totalLeaseCost = leasedArea * leaseCostRate;

  // Loan interest
  const loanAmount = Math.max(0, Number(inputs.loan_amount) || 0);
  const loanRate = Math.max(0, Number(inputs.loan_interest_rate_pct) || 0);
  const loanInterest = (loanAmount * loanRate) / 100;

  const totalCost = totalOpCost + totalLeaseCost + loanInterest;
  const totalProductionQ = yieldPerAcre * area;
  const grossRevenue = totalProductionQ * pricePerQ;
  const netProfit = grossRevenue - totalCost;

  const marginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const breakEvenPrice = totalProductionQ > 0 ? totalCost / totalProductionQ : null;
  const breakEvenYield = pricePerQ * area > 0 ? totalCost / (pricePerQ * area) : null;

  return {
    total_operating_cost: Math.round(totalOpCost * 100) / 100,
    operating_cost_per_acre: Math.round(opCostPerAcre * 100) / 100,
    total_lease_cost: Math.round(totalLeaseCost * 100) / 100,
    loan_interest: Math.round(loanInterest * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    total_production_q: Math.round(totalProductionQ * 100) / 100,
    gross_revenue: Math.round(grossRevenue * 100) / 100,
    net_profit: Math.round(netProfit * 100) / 100,
    margin_pct: Math.round(marginPct * 100) / 100,
    break_even_price: breakEvenPrice !== null ? Math.round(breakEvenPrice * 100) / 100 : null,
    break_even_yield: breakEvenYield !== null ? Math.round(breakEvenYield * 100) / 100 : null,
  };
}
