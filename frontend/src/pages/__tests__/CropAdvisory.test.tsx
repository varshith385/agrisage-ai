import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';
import { CropRecommendationPage } from '../CropRecommendationPage';
import * as clientModule from '../../api/client';

const { mockFarm } = vi.hoisted(() => {
  const farm = {
    id: 101,
    user_id: 1,
    name: 'Warangal Parcel',
    area: 3.5,
    ownership_type: 'mixed',
    soil_type: 'Black Cotton',
    village: 'Geikonda',
    district: 'Warangal',
    state: 'Telangana',
    latitude: 17.9689,
    longitude: 79.5941,
    created_at: '2026-08-15T00:00:00Z',
  };
  return { mockFarm: farm };
});

vi.mock('../../api/weather', () => ({
  weatherApi: {
    getForecast: vi.fn().mockResolvedValue({
      latitude: 17.9689,
      longitude: 79.5941,
      current: {
        temperature_c: 24.5,
        relative_humidity_pct: 68.0,
        expected_rainfall_today_mm: 8.5,
      },
      daily: [
        { precipitation_sum_mm: 8.5 },
        { precipitation_sum_mm: 0.0 },
      ],
    }),
  },
}));

vi.mock('../../api/economics', () => ({
  getRotationRecommendations: vi.fn().mockResolvedValue({
    previous_crop: 'Cotton',
    primary_agronomic_risks: ['Soil nutrient depletion', 'Pest cycle persistence'],
    avoid_crops: ['Cotton', 'Chilli'],
    avoid_reason: 'Continuous Malvaceae/Solanaceae crops promote wilt diseases.',
    recommended_rotations: [
      {
        crop_name: 'Pigeonpeas',
        crop_family: 'Fabaceae',
        benefit_category: 'nitrogen_fixation',
        rationale: 'Fixes atmospheric nitrogen into depleted soil.',
        precaution: 'Ensure well-drained soil.',
        suitable_seasons: ['Kharif'],
        agronomic_source: 'ICAR Pulse Advisory',
      },
    ],
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Ramesh' },
    activeFarm: mockFarm,
    activeFarmId: 101,
    activeCrop: 'Cotton',
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../api/client', () => ({
  apiRequest: vi.fn(),
}));

describe('Phase 6: Crop Advisory Rebuild & Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('agrisage_pictorial_mode', 'words');
    localStorage.setItem('agrisage_lang', 'en');
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [
        {
          crop_name: 'Maize',
          probability: 0.656,
          reasons: [
            'Model probability (uncalibrated model score): 65.6%.',
            'Ambient temperature (24.5°C) and seasonal rainfall (85.0 mm) match vegetative requirements.',
          ],
          climate_suitable: true,
          suitability_note: 'Agro-climatically suitable for local region and season.',
        },
      ],
      soil_values_missing: true,
      fallback_used: 'weather_only_model (soil N, P, K, pH not provided)',
      confidence: 0.50,
      confidence_type: 'heuristic',
      supported_crops: ['maize', 'cotton', 'rice'],
      unsupported_common_crops: ['wheat', 'groundnut'],
      climate_warnings: [],
      is_out_of_distribution: false,
      explanation: {
        value: 'Recommended: Maize',
        confidence: 0.50,
        reasons: ['Evaluated candidate crops using weather-only model (soil parameters omitted).'],
      },
      status: 'WORKING',
    });
  });

  const renderComponent = (lang: 'en' | 'te' | 'hi' = 'en') => {
    localStorage.setItem('agrisage_lang', lang);
    return render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <PictorialProvider>
            <BrowserRouter>
              <CropRecommendationPage />
            </BrowserRouter>
          </PictorialProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  };

  it('renders Crop Advisory title properly in English, Telugu, and Hindi', async () => {
    const { unmount } = renderComponent('en');
    expect(await screen.findByRole('heading', { level: 1, name: /Crop Advisory/i })).toBeInTheDocument();
    unmount();

    const { unmount: unmountTe } = renderComponent('te');
    expect(await screen.findByRole('heading', { level: 1, name: /పంట సలహా/i })).toBeInTheDocument();
    unmountTe();

    renderComponent('hi');
    expect(await screen.findByRole('heading', { level: 1, name: /फसल सलाह/i })).toBeInTheDocument();
  });

  it('initializes with Soil not provided badge and calls API without soil params', async () => {
    renderComponent('en');

    await waitFor(() => {
      const recommendCall = (clientModule.apiRequest as any).mock.calls.find((c: any[]) => c[0] === '/api/v1/recommend/crop');
      expect(recommendCall).toBeDefined();
    });

    const recommendCall = (clientModule.apiRequest as any).mock.calls.find((c: any[]) => c[0] === '/api/v1/recommend/crop');
    const callPayload = JSON.parse(recommendCall[1].body);
    expect(callPayload.n).toBeUndefined();
    expect(callPayload.p).toBeUndefined();
    expect(callPayload.k).toBeUndefined();
    expect(callPayload.ph).toBeUndefined();
    expect(callPayload.state).toBe('Telangana');
    expect(callPayload.district).toBe('Warangal');

    expect(await screen.findByText(/Soil not provided/i)).toBeInTheDocument();
  });

  it('allows user to enter measured soil data and sends full NPK/pH payload', async () => {
    renderComponent('en');

    // Switch to inputs tab
    const inputsTabBtn = screen.getByRole('button', { name: /Nutrient & Climate Parameters/i });
    fireEvent.click(inputsTabBtn);

    // Toggle measured soil checkbox
    const soilCheckbox = screen.getByRole('checkbox');
    expect(soilCheckbox).not.toBeChecked();

    fireEvent.click(soilCheckbox);
    expect(soilCheckbox).toBeChecked();

    await waitFor(() => {
      // Should have re-called API with soil parameters
      const lastCallPayload = JSON.parse((clientModule.apiRequest as any).mock.calls.at(-1)[1].body);
      expect(lastCallPayload.n).toBeDefined();
      expect(lastCallPayload.p).toBeDefined();
      expect(lastCallPayload.k).toBeDefined();
      expect(lastCallPayload.ph).toBeDefined();
    });

    expect(screen.getByText(/Mode: Full Soil \+ Weather/i)).toBeInTheDocument();
  });

  it('renders Out-of-Distribution notice when backend flags is_out_of_distribution', async () => {
    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [],
      soil_values_missing: false,
      fallback_used: 'none_full_features',
      confidence: 0.40,
      supported_crops: [],
      unsupported_common_crops: [],
      climate_warnings: [],
      is_out_of_distribution: true,
      ood_warning: 'Extreme test coordinates: Telemetry falls outside training distribution.',
      explanation: { value: '', confidence: 0.40, reasons: [] },
      status: 'WORKING',
    });

    renderComponent('en');

    expect(await screen.findByText(/Out-of-Distribution Input Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Extreme test coordinates: Telemetry falls outside training distribution./i)).toBeInTheDocument();
  });
});
