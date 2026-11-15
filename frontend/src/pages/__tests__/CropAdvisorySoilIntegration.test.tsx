import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { CropRecommendationPage } from '../CropRecommendationPage';
import { SchemesPage } from '../SchemesPage';
import * as clientApi from '../../api/client';
import * as soilCardApi from '../../api/soil_card';
import * as weatherApiModule from '../../api/weather';

let mockActiveFarm: any = {
  id: 101,
  name: 'Farm Alpha',
  village: 'Geesugonda',
  district: 'Warangal',
  state: 'Telangana',
  latitude: 17.98,
  longitude: 79.6,
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, full_name: 'Ramesh Kumar' },
    activeFarm: mockActiveFarm,
    activeFarmId: mockActiveFarm?.id ?? 101,
    farms: [mockActiveFarm],
    activeCrop: 'Cotton',
    setActiveFarm: vi.fn((farm) => { mockActiveFarm = farm; }),
    setActiveFarmId: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../context/PictorialContext', () => ({
  usePictorial: () => ({
    isPictorial: false,
    mode: 'words',
    setMode: vi.fn(),
    setPictorial: vi.fn(),
    alwaysShowListen: false,
    setAlwaysShowListen: vi.fn(),
    togglePictorial: vi.fn(),
    toggleAlwaysShowListen: vi.fn(),
  }),
  useShowListen: () => false,
  PictorialProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../api/economics', () => ({
  getRotationRecommendations: vi.fn().mockResolvedValue({
    previous_crop: 'Cotton',
    recommended_rotations: [
      { crop_name: 'Pulses', family: 'Fabaceae', rationale: 'Fixes atmospheric nitrogen into depleted soils' },
    ],
  }),
}));

describe('Crop Advisory Soil Integration & Missing Red Link (Phase 5)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    mockActiveFarm = {
      id: 101,
      name: 'Farm Alpha',
      village: 'Geesugonda',
      district: 'Warangal',
      state: 'Telangana',
      latitude: 17.98,
      longitude: 79.6,
    };

    vi.spyOn(weatherApiModule.weatherApi, 'getClimateNormals').mockResolvedValue({
      mean_temperature_c: 26.5,
      mean_relative_humidity_pct: 68.0,
      mean_monthly_rainfall_mm: 110.0,
      window_start_date: '2025-11-01',
      window_end_date: '2026-10-31',
      source: 'Measured (weather API, trailing 12mo)',
    } as any);

    vi.spyOn(soilCardApi, 'getOcrEngines').mockResolvedValue({
      engine_detected: 'gemini_vision',
      available_engines: ['gemini_vision'],
      install_instructions: {},
      powershell_help: {},
      status: 'active',
    });

    vi.spyOn(soilCardApi, 'getSoilImpact').mockResolvedValue({
      farm_id: 101,
      crop_name: 'Rice',
      has_confirmed_soil_card: false,
      without_soil_card: {
        top_crops: [{ crop_name: 'Rice', probability: 0.8 }],
        confidence: 0.6,
        fallback_used: 'weather_only',
      },
      with_soil_card: {
        top_crops: [{ crop_name: 'Rice', probability: 0.95 }],
        confidence: 0.92,
        fallback_used: 'full_soil',
      },
      impact_summary: [],
      integration_scope_note: '',
      disclaimer: '',
    });
  });

  it('1. Missing soil values show the RED alert link with icon and words', async () => {
    // Farm has no confirmed card
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: false,
      card: null,
    });

    vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      recommended_crop: 'Rice',
      model_probability: 0.62,
      decision_status: 'LOW_CONFIDENCE',
      soil_values_missing: true,
      top_crops: [{ crop_name: 'Rice', probability: 0.62, reasons: ['Suitable temperature'] }],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <CropRecommendationPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Assert RED message banner appears with words and calibrate soil link
    await waitFor(() => {
      const missingBanners = screen.getAllByText(/Soil values missing\. Add them from your Soil Card for the best crop recommendation/i);
      expect(missingBanners.length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('button', { name: /Calibrate Soil/i })).toBeInTheDocument();
  });

  it('2. Present soil values hide the RED alert link and show real attribution', async () => {
    // Farm has confirmed soil card
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: true,
      card: {
        id: 5,
        farm_id: 101,
        nitrogen_kg_ha: 85.0,
        phosphorus_kg_ha: 42.0,
        potassium_kg_ha: 55.0,
        ph: 6.8,
        organic_carbon_pct: 0.6,
        electrical_conductivity_ds_m: 0.4,
        soil_texture: 'Sandy Clay Loam',
        source: 'photo read by AI',
        test_date: '2026-10-15',
        is_confirmed: true,
      },
    });

    vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      recommended_crop: 'Cotton',
      model_probability: 0.94,
      decision_status: 'CONFIDENT',
      soil_values_missing: false,
      top_crops: [{ crop_name: 'Cotton', probability: 0.94, reasons: ['Optimal NPK balance'] }],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <CropRecommendationPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cotton/i)).toBeInTheDocument();
    });

    // RED alert message should NOT be in document
    const missingMessage = screen.queryByText(/Soil values missing\. Add them from your Soil Card/i);
    expect(missingMessage).toBeNull();

    // Source attribution shows "Soil card, tested 2026-10-15"
    await waitFor(() => {
      expect(screen.getAllByText(/Soil card, tested 2026-10-15/i).length).toBeGreaterThan(0);
    });
  });

  it('3. Saved card values prefill inputs and the recommendation request sent to /recommend/crop contains them', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: true,
      card: {
        id: 5,
        farm_id: 101,
        nitrogen_kg_ha: 92.5,
        phosphorus_kg_ha: 38.0,
        potassium_kg_ha: 60.0,
        ph: 7.2,
        organic_carbon_pct: 0.55,
        electrical_conductivity_ds_m: 0.45,
        soil_texture: 'Black Cotton',
        source: 'typed by farmer',
        is_confirmed: true,
      },
    });

    const apiRequestSpy = vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      recommended_crop: 'Cotton',
      model_probability: 0.91,
      decision_status: 'CONFIDENT',
      soil_values_missing: false,
      top_crops: [{ crop_name: 'Cotton', probability: 0.91, reasons: ['Good soil chemistry'] }],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <CropRecommendationPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify /api/v1/recommend/crop was called with the 4 prefilled soil features
    await waitFor(() => {
      expect(apiRequestSpy).toHaveBeenCalledWith(
        '/api/v1/recommend/crop',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"n":92.5'),
        })
      );
    });

    const lastCall = apiRequestSpy.mock.calls[apiRequestSpy.mock.calls.length - 1];
    const callPayload = JSON.parse((lastCall[1] as any).body);
    expect(callPayload.n).toBe(92.5);
    expect(callPayload.p).toBe(38.0);
    expect(callPayload.k).toBe(60.0);
    expect(callPayload.ph).toBe(7.2);
    expect(callPayload.soil_source).toBe('Typed by farmer');
  });

  it('4. Switching active farm changes prefilled soil values in advisory', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockImplementation(async (fId: number) => {
      if (fId === 101) {
        return {
          has_card: true,
          card: {
            id: 1,
            farm_id: 101,
            nitrogen_kg_ha: 80,
            phosphorus_kg_ha: 30,
            potassium_kg_ha: 40,
            ph: 6.5,
            source: 'photo read by AI',
            is_confirmed: true,
          },
        };
      } else {
        return {
          has_card: true,
          card: {
            id: 2,
            farm_id: 202,
            nitrogen_kg_ha: 130,
            phosphorus_kg_ha: 60,
            potassium_kg_ha: 75,
            ph: 7.5,
            source: 'typed by farmer',
            is_confirmed: true,
          },
        };
      }
    });

    const apiRequestSpy = vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      recommended_crop: 'Rice',
      model_probability: 0.9,
      decision_status: 'CONFIDENT',
      soil_values_missing: false,
      top_crops: [{ crop_name: 'Rice', probability: 0.9, reasons: ['Optimal'] }],
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <CropRecommendationPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Initial farm 101 call
    await waitFor(() => {
      const calls = apiRequestSpy.mock.calls;
      const lastCall = calls[calls.length - 1];
      const payload = JSON.parse((lastCall[1] as any).body);
      expect(payload.n).toBe(80);
    });

    // Switch farm to 202
    mockActiveFarm = {
      id: 202,
      name: 'Farm Beta',
      village: 'Dharmasagar',
      district: 'Warangal',
      state: 'Telangana',
      latitude: 17.95,
      longitude: 79.55,
    };

    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <CropRecommendationPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Switched farm 202 call receives updated soil values
    await waitFor(() => {
      const calls = apiRequestSpy.mock.calls;
      const lastCall = calls[calls.length - 1];
      const payload = JSON.parse((lastCall[1] as any).body);
      expect(payload.n).toBe(130);
      expect(payload.p).toBe(60);
      expect(payload.k).toBe(75);
      expect(payload.ph).toBe(7.5);
    });
  });

  it('5. SchemesPage strictly validates returnTo and rejects external URLs', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: true,
      card: {
        id: 1,
        farm_id: 101,
        nitrogen_kg_ha: 80,
        phosphorus_kg_ha: 30,
        potassium_kg_ha: 40,
        ph: 6.5,
        source: 'photo read by AI',
        is_confirmed: true,
      },
    });

    // Render SchemesPage with an external returnTo parameter
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/schemes?tab=upload&returnTo=https://evil.com']}>
          <LanguageProvider>
            <SchemesPage />
          </LanguageProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for saved card state to render
    await waitFor(() => {
      expect(screen.getByText(/Saved soil values active for this farm/i)).toBeInTheDocument();
    });

    // Because 'https://evil.com' is not in ALLOWED_RETURN_PATHS, returnTo is null.
    // The button shows standard "Go to Crop Advisory", NOT "Back to Crop Advisory"
    expect(screen.getByRole('button', { name: /Go to Crop Advisory/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Back to Crop Advisory/i })).toBeNull();
  });
});
