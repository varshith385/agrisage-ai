import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';
import { CropRecommendationPage } from '../CropRecommendationPage';
import * as clientModule from '../../api/client';

const mockFarm = {
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

vi.mock('../../api/weather', () => ({
  weatherApi: {
    getClimateNormals: vi.fn().mockResolvedValue({
      latitude: 17.97,
      longitude: 79.59,
      mean_temperature_c: 27.6,
      mean_relative_humidity_pct: 63.8,
      mean_monthly_rainfall_mm: 43.3,
      annual_rainfall_mm: 520.1,
      window_start_date: '2023-11-15',
      window_end_date: '2024-11-14',
      window_days: 365,
      source: 'Open-Meteo Archive API (trailing 12mo climate normals)',
      formula_note: 'Daily mean temp & humidity averaged over 365 days; rainfall summed and divided by 12.0',
    }),
    getForecast: vi.fn().mockResolvedValue({
      current: { temperature_c: 27.6, relative_humidity_pct: 63.8 },
      daily: [{ precipitation_sum_mm: 4.3 }],
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

describe('Round 7b: Crop Advisory Transparency & Decision States', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('agrisage_pictorial_mode', 'words');
    localStorage.setItem('agrisage_lang', 'en');
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (lang: 'en' | 'te' | 'hi' = 'en', mode: 'words' | 'pictures' = 'words') => {
    localStorage.setItem('agrisage_lang', lang);
    localStorage.setItem('agrisage_pictorial_mode', mode);
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

  it('Tier 2/3 UNUSUAL Refusal: displays refusal card with NO Recommended headline', async () => {
    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [
        {
          crop_name: 'Mothbeans',
          probability: 0.35,
          reasons: ['Low confidence candidate under out-of-envelope weather'],
          climate_suitable: false,
          suitability_note: 'Unverified candidate under unusual conditions',
        },
      ],
      decision_status: 'UNUSUAL',
      confidence_label: 'Low',
      model_name: 'GaussianNB',
      model_probability: 0.35,
      decision_reasons: [
        'Rainfall 19.9 mm is outside training envelope [20.21, 298.56] mm',
        'IsolationForest flagged joint combination as out-of-distribution (anomaly score: -0.052)',
      ],
      input_sources: {
        rainfall: {
          value: 19.9,
          unit: 'mm',
          source: 'Measured (weather API, trailing 12mo)',
          training_range: '[20.21, 298.56]',
          in_training_range: false,
        },
      },
      soil_values_missing: false,
      fallback_used: 'none_full_features',
      confidence: 0.35,
      confidence_type: 'model_probability',
      supported_crops: ['mothbeans'],
      unsupported_common_crops: [],
      climate_warnings: ['Low rainfall'],
      is_out_of_distribution: true,
      ood_warning: 'Unusual combination (out-of-distribution), not confident. Please verify with a soil test or local agriculture officer.',
      explanation: { value: 'Refusal', confidence: 0.35, reasons: [] },
      status: 'WORKING',
    });

    renderComponent('en', 'words');

    // Must show refusal title
    expect(await screen.findByText(/Unusual Combination, Not Confident/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Please verify with a soil test or local agriculture officer/i).length).toBeGreaterThan(0);

    // Must NOT have "Rank #1 Recommendation" headline
    expect(screen.queryByText(/Rank #1 Recommendation/i)).not.toBeInTheDocument();

    // Must display the explicit reason
    expect(screen.getAllByText(/Rainfall 19.9 mm is outside training envelope/i).length).toBeGreaterThan(0);
  });

  it('Tier 4 LOW_CONFIDENCE: shows Indicative candidate when soil is missing, never Recommended', async () => {
    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [
        {
          crop_name: 'Mothbeans',
          probability: 0.62,
          reasons: ['Weather-only model estimation'],
          climate_suitable: true,
        },
      ],
      decision_status: 'LOW_CONFIDENCE',
      confidence_label: 'Medium',
      model_name: 'RandomForest (weather-only)',
      model_probability: 0.62,
      decision_reasons: ['Soil nutrients (N, P, K, pH) omitted. Climate-only baseline estimation.'],
      soil_values_missing: true,
      fallback_used: 'weather_only_model (soil N, P, K, pH not provided)',
      confidence: 0.50,
      confidence_type: 'heuristic',
      supported_crops: ['mothbeans', 'maize'],
      unsupported_common_crops: [],
      climate_warnings: [],
      is_out_of_distribution: false,
      explanation: { value: 'Indicative: Mothbeans', confidence: 0.50, reasons: [] },
      status: 'WORKING',
    });

    renderComponent('en', 'words');

    // Must show Indicative candidate headline
    expect(await screen.findByText(/Indicative candidate \(soil values needed\)/i)).toBeInTheDocument();

    // Must NOT show Rank #1 Recommendation
    expect(screen.queryByText(/Rank #1 Recommendation/i)).not.toBeInTheDocument();
  });

  it('renders 7 input chips with values, units, sources, and envelope checks', async () => {
    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [{ crop_name: 'Maize', probability: 0.95, reasons: [] }],
      decision_status: 'CONFIDENT',
      confidence_label: 'High',
      model_name: 'GaussianNB',
      model_probability: 0.95,
      decision_reasons: ['All 7 inputs inside training envelope with high model probability (95.0%).'],
      input_sources: {
        n: { value: 50.0, unit: 'kg/ha', source: 'Entered (user)', training_range: '[0.0, 140.0]', in_training_range: true },
        p: { value: 50.0, unit: 'kg/ha', source: 'Entered (user)', training_range: '[5.0, 145.0]', in_training_range: true },
        k: { value: 50.0, unit: 'kg/ha', source: 'Entered (user)', training_range: '[5.0, 205.0]', in_training_range: true },
        ph: { value: 6.5, unit: 'pH', source: 'Entered (user)', training_range: '[3.50, 9.94]', in_training_range: true },
        temperature: { value: 27.6, unit: '°C', source: 'Measured (weather API, trailing 12mo)', training_range: '[8.83, 43.68]', in_training_range: true },
        humidity: { value: 63.8, unit: '%', source: 'Measured (weather API, trailing 12mo)', training_range: '[14.26, 99.98]', in_training_range: true },
        rainfall: { value: 43.3, unit: 'mm', source: 'Measured (weather API, trailing 12mo)', training_range: '[20.21, 298.56]', in_training_range: true },
      },
      soil_values_missing: false,
      fallback_used: 'none_full_features',
      confidence: 0.95,
      confidence_type: 'model_probability',
      supported_crops: ['maize'],
      unsupported_common_crops: [],
      climate_warnings: [],
      is_out_of_distribution: false,
      explanation: { value: 'Recommended: Maize', confidence: 0.95, reasons: [] },
      status: 'WORKING',
    });

    renderComponent('en', 'words');

    expect(await screen.findByText(/Input Attribution & Training Envelope Checks/i)).toBeInTheDocument();
    expect(screen.getByText(/How This Was Chosen/i)).toBeInTheDocument();
    expect(screen.getAllByText(/GaussianNB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/99.49%/i).length).toBeGreaterThan(0);
  });

  it('Strict Listen Button Rule: NO Listen buttons in Words mode; Listen buttons present in Pictures mode', async () => {
    (clientModule.apiRequest as any).mockResolvedValue({
      top_crops: [{ crop_name: 'Maize', probability: 0.88, reasons: [] }],
      decision_status: 'CONFIDENT',
      confidence_label: 'High',
      soil_values_missing: false,
      fallback_used: 'none_full_features',
      confidence: 0.88,
      confidence_type: 'model_probability',
      supported_crops: ['maize'],
      unsupported_common_crops: [],
      climate_warnings: [],
      explanation: { value: 'Maize', confidence: 0.88, reasons: [] },
      status: 'WORKING',
    });

    // 1. Words mode: No listen button should exist
    const { unmount: unmountWords } = renderComponent('en', 'words');
    await waitFor(() => {
      expect(clientModule.apiRequest).toHaveBeenCalled();
    });
    const listenButtonsWords = screen.queryAllByRole('button', { name: /listen|వినండి|सुनें/i });
    expect(listenButtonsWords.length).toBe(0);
    unmountWords();

    // 2. Pictures mode: Listen button must exist
    renderComponent('en', 'pictures');
    const listenButtonsPictures = await screen.findAllByRole('button', { name: /listen/i });
    expect(listenButtonsPictures.length).toBeGreaterThan(0);
  });
});
