import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';

vi.mock('../../context/PictorialContext', () => ({
  usePictorial: () => ({ isPictorial: false }),
  useShowListen: () => false,
  PictorialProvider: ({ children }: any) => <>{children}</>,
}));

const { mockFarm, mockWeather } = vi.hoisted(() => {
  const mockFarm = {
    id: 1,
    user_id: 1,
    name: 'Rameshwaram Holding Consistency',
    area: 3.0,
    ownership_type: 'owned',
    owned_area: 3.0,
    leased_area: 0.0,
    lease_amount: 0,
    soil_type: 'Black Cotton',
    water_source: 'Borewell',
    irrigation_method: 'drip',
    village: 'Geesugonda',
    district: 'Warangal',
    state: 'Telangana',
    latitude: 17.9689,
    longitude: 79.5941,
    budget: 50000,
    created_at: '2026-08-15T00:00:00Z',
    current_crop_cycles: [
      {
        id: 1,
        crop_name: 'Cotton',
        variety: 'Bollgard II',
        planting_date: '2026-08-15',
        expected_harvest_date: '2027-01-15',
        stage: 'flowering',
        health_status: 'good',
      },
    ],
  };

  const mockWeather = {
    temperature_c: 29.0,
    relative_humidity_pct: 40.0,
    wind_speed_kmh: 8.5,
    weather_code: 0,
    expected_rainfall_today_mm: 0.0,
    reference_et0_mm: 4.6,
    is_day: 1,
    place_name: 'Geesugonda, Warangal, Telangana',
    grid_disclaimer: 'model grid value for this location, not a village sensor',
    stale_age_seconds: 45,
    stale_label: 'Fresh (<1m ago)',
    fetched_at: '2026-11-15T06:00:00Z',
    source: 'Open-Meteo',
  };

  return { mockFarm, mockWeather };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Ramesh' },
    activeFarm: mockFarm,
    activeCrop: 'Cotton',
    language: 'en',
    isAuthenticated: true,
  }),
}));

vi.mock('../../hooks/useFarmWeather', () => ({
  useFarmWeather: () => ({
    weather: mockWeather,
    forecast: { current: mockWeather, daily: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    placeName: 'Geesugonda, Warangal, Telangana',
    latitude: 17.9689,
    longitude: 79.5941,
    gridDisclaimer: 'model grid value for this location, not a village sensor',
  }),
}));

vi.mock('../../api/agents', () => ({
  agentsApi: {
    listRuns: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../api/advisory', () => ({
  advisoryApi: {
    getGrowthStage: vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      stage_name: 'flowering',
      das: 92,
      progress_pct: 60,
      description: 'Flowering stage',
      stages_timeline: [],
    }),
  },
}));

vi.mock('../../api/economics', () => ({
  calculateEconomics: vi.fn().mockResolvedValue({
    owned_tenure: { net_profit_per_acre: 21800, margin_pct: 38.38 },
  }),
}));

describe('Dashboard Weather Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders farm weather telemetry and model grid disclaimer on dashboard', async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <PictorialProvider>
              <DashboardPage />
            </PictorialProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/29°C/)).toBeInTheDocument();
    });

    expect(container.textContent).toContain('model grid value for this location, not a village sensor');
  });
});
