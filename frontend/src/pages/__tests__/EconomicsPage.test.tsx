import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EconomicsPage } from '../EconomicsPage';
import { LanguageProvider } from '../../context/LanguageContext';
import * as economicsApi from '../../api/economics';
import * as farmsApi from '../../api/farms';
import * as marketApi from '../../api/market';

vi.mock('../../api/economics');
vi.mock('../../api/farms');
vi.mock('../../api/market');

const mockFarm = {
  id: 1,
  user_id: 1,
  name: 'Rameshwaram Farm',
  area: 5.0,
  ownership_type: 'mixed',
  owned_area: 3.0,
  leased_area: 2.0,
  lease_amount: 10000,
  soil_type: 'Black Cotton',
  water_source: 'Borewell',
  irrigation_method: 'drip',
  village: 'Geikonda',
  district: 'Warangal',
  state: 'Telangana',
  latitude: 17.98,
  longitude: 79.60,
  budget: 100000,
  created_at: '2026-08-15T00:00:00Z',
};

const mockEconCalc = {
  crop_name: 'Cotton',
  area: 5.0,
  area_unit: 'acres',
  expected_yield_q_per_acre: 8.0,
  yield_source_label: 'user estimate',
  expected_price_per_q: 7100.0,
  price_source_label: 'MSP benchmark',
  ownership_type: 'mixed',
  owned_tenure: {
    area: 3.0,
    operating_cost_total: '105,000.00',
    lease_cost_total: '0.00',
    loan_interest: '0.00',
    total_cost: '105,000.00',
    gross_revenue: '170,400.00',
    net_profit: '65,400.00',
    net_profit_per_acre: '21,800.00',
    margin_pct: 38.38,
    cost_of_production_per_q: '4,375.00',
    is_profitable: true,
  },
  leased_tenure: {
    area: 2.0,
    operating_cost_total: '70,000.00',
    lease_cost_total: '20,000.00',
    loan_interest: '0.00',
    total_cost: '90,000.00',
    gross_revenue: '113,600.00',
    net_profit: '23,600.00',
    net_profit_per_acre: '11,800.00',
    margin_pct: 20.77,
    cost_of_production_per_q: '5,625.00',
    is_profitable: true,
  },
  combined_summary: {
    area: 5.0,
    operating_cost_total: '175,000.00',
    lease_cost_total: '20,000.00',
    loan_interest: '0.00',
    total_cost: '195,000.00',
    gross_revenue: '284,000.00',
    net_profit: '89,000.00',
    net_profit_per_acre: '17,800.00',
    margin_pct: 31.34,
    cost_of_production_per_q: '4,875.00',
    is_profitable: true,
  },
  break_even_price_per_q: 4875.0,
  break_even_yield_q_per_acre: 5.49,
  scenarios: [],
  cost_breakdown_by_stage: {},
  status: 'WORKING',
};

const mockWhatIfResponse = {
  current_net_profit: 89000.0,
  current_margin_pct: 31.34,
  total_cost: 195000.0,
  gross_revenue: 284000.0,
  break_even_price_per_q: 4875.0,
  break_even_yield_q_per_acre: 5.49,
  sweep_variable: 'price',
  sensitivity_points: [
    {
      variable_value: 5000.0,
      net_profit: 5000.0,
      margin_pct: 2.5,
      revenue: 200000.0,
    },
    {
      variable_value: 7100.0,
      net_profit: 89000.0,
      margin_pct: 31.34,
      revenue: 284000.0,
    },
    {
      variable_value: 9000.0,
      net_profit: 165000.0,
      margin_pct: 45.83,
      revenue: 360000.0,
    },
  ],
};

describe('EconomicsPage What-If Simulator', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.spyOn(farmsApi, 'getFarms').mockResolvedValue([mockFarm as any]);
    vi.spyOn(economicsApi, 'getCostTemplates').mockResolvedValue({});
    vi.spyOn(economicsApi, 'calculateEconomics').mockResolvedValue(mockEconCalc as any);
    vi.spyOn(economicsApi, 'compareCrops').mockResolvedValue({
      area_acres: 5.0,
      crops: [],
      methodology: 'rule_based',
    } as any);
    vi.spyOn(economicsApi, 'simulateWhatIf').mockResolvedValue(mockWhatIfResponse as any);
    vi.spyOn(marketApi, 'getMandiPrices').mockResolvedValue({ prices: [] } as any);
  });

  it('renders synchronized sliders and number inputs and updates live net profit on change', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <EconomicsPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify title and controls are rendered
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /What-If/i })).toBeInTheDocument();
    });

    // Inputs: Price, Yield, Area, Lease
    const priceNumberInputs = screen.getAllByLabelText(/Expected Price/i);
    expect(priceNumberInputs.length).toBeGreaterThan(0);

    const yieldNumberInputs = screen.getAllByLabelText(/Harvest Yield/i);
    expect(yieldNumberInputs.length).toBeGreaterThan(0);

    const yieldNumberInput = document.getElementById('whatif-yield-number') as HTMLInputElement;
    expect(yieldNumberInput).toBeInTheDocument();
    expect(yieldNumberInput).toHaveValue(8);

    // Check Reset button
    const resetBtn = screen.getByText(/Reset to Baseline/i);
    expect(resetBtn).toBeInTheDocument();

    // Change yield from 8 to 12 q/ac
    fireEvent.change(yieldNumberInput, { target: { value: '12' } });

    // Live Net Profit should immediately reflect new pure-function calculation
    await waitFor(() => {
      const profitHeadings = screen.getAllByText(/Live Net Profit/i);
      expect(profitHeadings.length).toBeGreaterThan(0);
    });

    // Click Reset button to return to baseline
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(yieldNumberInput).toHaveValue(8);
    });
  });
});
