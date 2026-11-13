import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { IrrigationPage } from '../IrrigationPage';
import { LanguageProvider } from '../../context/LanguageContext';
import { AuthProvider } from '../../context/AuthContext';
import * as irrigationApi from '../../api/irrigation';
import * as farmsApiModule from '../../api/farms';
import { IrrigationPlanResponse } from '../../types/api';

vi.mock('../../api/irrigation');
vi.mock('../../api/farms');

const mockPlan: IrrigationPlanResponse = {
  crop_name: 'Cotton',
  growth_stage: 'mid',
  days_after_sowing: 90,
  kc: 1.20,
  reference_et0_mm: 5.0,
  etc_today_mm: 6.0,
  effective_rain_today_mm: 0.0,
  should_irrigate: true,
  net_depth_mm: 126.0,
  gross_depth_mm: 140.0,
  litres_needed: 1133120,
  litres_saved: 0,
  rain_skip_triggered: false,
  next_irrigation_date: '2026-11-14',
  irrigation_method: 'drip',
  method_efficiency: 0.90,
  soil_type: 'Black Cotton',
  awc_mm_per_m: 190.0,
  taw_mm: 190.0,
  raw_mm: 123.5,
  depletion_today_mm: 126.0,
  daily_forecast_balance: [
    {
      date: '2026-11-14',
      day_index: 0,
      kc: 1.20,
      et0_mm: 5.0,
      etc_mm: 6.0,
      rain_mm: 0.0,
      effective_rain_mm: 0.0,
      root_zone_depletion_mm: 126.0,
      taw_mm: 190.0,
      raw_mm: 123.5,
      moisture_stress_risk: true,
      rain_skip_potential: false,
    },
  ],
  recommendation_text: 'Irrigation required today. Soil water depletion has reached RAW threshold.',
  explanation: {
    value: 'Irrigation Required',
    confidence: 0.95,
    confidence_type: 'rule_based',
    reasons: ['Crop is at peak water demand in mid flowering stage.'],
    limitations: [],
    sources: ['FAO-56 Paper No. 56'],
    status: 'WORKING',
  },
  status: 'WORKING',
};

describe('IrrigationPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(farmsApiModule.farmsApi, 'getFarms').mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        name: 'Ramesh Farm',
        area: 2.5,
        ownership_type: 'owned',
        owned_area: 2.5,
        leased_area: 0,
        lease_amount: 0,
        soil_type: 'Black Cotton',
        water_source: 'Borewell',
        irrigation_method: 'drip',
        village: 'Geikonda',
        district: 'Warangal',
        state: 'Telangana',
        latitude: 17.98,
        longitude: 79.60,
        budget: 50000,
        created_at: '2026-08-15T00:00:00Z',
        current_crop_cycles: [
          {
            id: 1,
            crop_name: 'Cotton',
            variety: 'Bollgard II',
            planting_date: '2026-08-15',
            current_stage: 'flowering',
            is_active: true,
            created_at: '2026-08-15T00:00:00Z',
          },
        ],
      },
    ]);

    vi.spyOn(irrigationApi, 'getIrrigationPlan').mockResolvedValue(mockPlan);
  });

  it('renders water budget plan results below the button after click', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <IrrigationPage />
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Find the compute budget button
    const computeBtn = await screen.findByRole('button', {
      name: /Compute Crop Water Budget/i,
    });
    expect(computeBtn).toBeInTheDocument();

    // Click compute button
    fireEvent.click(computeBtn);

    // Verify results render below the button
    await waitFor(() => {
      // 1. Honesty note
      expect(
        screen.getByText(/Soil moisture is modelled, not measured/i)
      ).toBeInTheDocument();

      // 2. DAS & stage
      expect(screen.getByText(/DAS 90/i)).toBeInTheDocument();

      // 3. Kc value
      expect(screen.getByText('1.20')).toBeInTheDocument();

      // 4. ET0 value
      expect(screen.getByText(/5.0 mm\/day/i)).toBeInTheDocument();

      // 5. ETc value
      expect(screen.getByText(/6.0 mm\/day/i)).toBeInTheDocument();

      // 6. Litres needed
      expect(screen.getByText(/1.*33.*120/i)).toBeInTheDocument();

      // 7. Trigger & Why line
      expect(
        screen.getAllByText(/Soil water depletion has reached RAW threshold/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
