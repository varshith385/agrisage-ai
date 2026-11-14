import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PictorialProvider, PICTORIAL_STORAGE_KEY, ALWAYS_SHOW_LISTEN_KEY } from '../../../context/PictorialContext';
import { LanguageProvider } from '../../../context/LanguageContext';
import { DashboardPage } from '../../../pages/DashboardPage';
import { CalendarPage } from '../../../pages/CalendarPage';
import { IrrigationPage } from '../../../pages/IrrigationPage';
import { RemindersPage } from '../../../pages/RemindersPage';

// Mocks
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Farmer Ramesh' },
    activeFarmId: 101,
    farms: [
      {
        id: 101,
        name: 'Cotton Parcel 1',
        area: 4.5,
        area_acres: 4.5,
        ownership_type: 'owned',
        owned_area: 4.5,
        leased_area: 0,
        lease_amount: 0,
        village: 'Warangal Rural',
        soil_type: 'Black Cotton',
        irrigation_type: 'drip',
        current_crop_cycles: [
          {
            id: 1,
            crop_name: 'Cotton',
            planting_date: '2026-08-15',
            variety: 'Bollgard II Hybrid',
            is_active: true,
          },
        ],
      },
    ],
    activeFarm: {
      id: 101,
      name: 'Cotton Parcel 1',
      area: 4.5,
      area_acres: 4.5,
      ownership_type: 'owned',
      owned_area: 4.5,
      leased_area: 0,
      lease_amount: 0,
      village: 'Warangal Rural',
      soil_type: 'Black Cotton',
      irrigation_type: 'drip',
      current_crop_cycles: [
        {
          id: 1,
          crop_name: 'Cotton',
          planting_date: '2026-08-15',
          variety: 'Bollgard II Hybrid',
          is_active: true,
        },
      ],
    },
    activeCrop: 'Cotton',
    isAuthenticated: true,
  }),
}));

vi.mock('../../../api/weather', () => ({
  weatherApi: {
    getCurrentWeather: vi.fn().mockResolvedValue({
      temperature_c: 31,
      humidity: 55,
      wind_speed_kmh: 8,
      condition: 'Sunny',
      rain_forecast_mm: 0,
      timestamp: new Date().toISOString(),
    }),
  },
}));

vi.mock('../../../api/agents', () => ({
  agentsApi: {
    getWorkflowStatus: vi.fn().mockResolvedValue({
      is_running: false,
      step: 'idle',
      last_run: new Date().toISOString(),
      logs: [],
    }),
    listRuns: vi.fn().mockResolvedValue([]),
    triggerRun: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../../api/advisory', () => ({
  advisoryApi: {
    getAdvisoryPlan: vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      growth_stage: 'flowering',
      days_after_sowing: 65,
      irrigate_now: true,
      recommended_depth_mm: 20,
      farm_health_score: 82,
      today_action: {
        title: 'Check bollworm traps',
        reason: 'Pheromone trap count threshold reached',
      },
      plan_items: [
        { day_number: 1, date_str: 'Today', action: 'Inspect field', reason: 'Routine' },
      ],
    }),
    getGrowthStage: vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      planting_date: '2026-08-15',
      days_after_sowing: 65,
      stage_number: 3,
      stage_name: 'Flowering & Blossom',
      stage_name_te: 'పూత దశ',
      stage_name_hi: 'फूल आने की अवस्था',
      kc: 1.15,
      moisture_sensitivity: 'high',
      guidance_en: 'Critical water period.',
      guidance_te: 'కీలక నీటి అవసర సమయం.',
      guidance_hi: 'अत्यंत संवेदनशील जल अवस्था।',
      actions: [],
      stages_timeline: [],
    }),
  },
}));

vi.mock('../../../api/economics', () => ({
  calculateEconomics: vi.fn().mockResolvedValue({
    total_cost: 45000,
    expected_revenue: 85000,
    net_profit: 40000,
    roi_percentage: 88.8,
  }),
  getCropCalendar: vi.fn().mockResolvedValue({
    crop_name: 'Cotton',
    planting_date: '2026-08-15',
    days_after_sowing: 65,
    current_stage: 'flowering',
    total_duration_days: 160,
    lifecycle_stages: [
      {
        stage_name: 'flowering',
        stage_name_en: 'Flowering Stage',
        start_day: 50,
        end_day: 90,
        is_active: true,
        key_activities: ['Pest scouting'],
        moisture_sensitivity: 'high',
        fertilizer_guidelines: [],
      },
    ],
    events: [
      {
        event_id: 'evt-1',
        stage: 'flowering',
        title: 'Scout for bollworms',
        due_date: '2026-11-20',
        day_number: 65,
        event_type: 'pest',
        status: 'pending',
        priority: 'high',
        notes: 'Use pheromone traps',
      },
    ],
    status: 'MODELLED',
  }),
  getSeasonalAwareness: vi.fn().mockResolvedValue({
    season: 'Kharif',
    recommendations: ['Monitor soil moisture'],
  }),
}));

vi.mock('../../../api/irrigation', () => ({
  getIrrigationPlan: vi.fn().mockResolvedValue({
    crop_name: 'Cotton',
    growth_stage: 'mid',
    days_after_sowing: 65,
    kc: 1.15,
    reference_et0_mm: 5.2,
    etc_today_mm: 6.0,
    effective_rain_today_mm: 0,
    should_irrigate: true,
    net_depth_mm: 22.0,
    gross_depth_mm: 25.0,
    litres_needed: 450000,
    litres_saved: 0,
    rain_skip_triggered: false,
    next_irrigation_date: '2026-11-15',
    irrigation_method: 'drip',
    method_efficiency: 0.9,
    soil_type: 'Black Cotton',
    recommendation_text: 'Irrigate 25 mm today using drip.',
    explanation: {
      value: 'Irrigate',
      confidence: 0.9,
      confidence_type: 'rule_based',
      reasons: ['Depletion exceeded threshold.'],
      limitations: [],
    },
    weather_used: {
      temperature_c: 31,
      humidity: 55,
      is_forecast: true,
      data_age_hours: 1,
    },
  }),
}));

vi.mock('../../../api/reminders', () => ({
  getReminders: vi.fn().mockResolvedValue([
    {
      id: 1,
      user_id: 1,
      farm_id: 101,
      title: 'Inspect South field',
      notes: 'Check traps',
      due_at: new Date(Date.now() + 86400000).toISOString(),
      repeat: 'none',
      status: 'pending',
      source: 'manual',
    },
  ]),
  getReminderSuggestions: vi.fn().mockResolvedValue([]),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  downloadIcsCalendarFile: vi.fn(),
}));

describe('Listen Button Visibility Rules across Core Pages', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderWithProviders = (ui: React.ReactElement, pictorial: boolean, alwaysListen: boolean) => {
    localStorage.setItem(PICTORIAL_STORAGE_KEY, pictorial ? 'pictures' : 'words');
    localStorage.setItem(ALWAYS_SHOW_LISTEN_KEY, alwaysListen ? 'true' : 'false');

    return render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <PictorialProvider>
            <BrowserRouter>{ui}</BrowserRouter>
          </PictorialProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  };

  const pages = [
    { name: 'Dashboard', component: <DashboardPage /> },
    { name: 'Calendar', component: <CalendarPage /> },
    { name: 'Irrigation', component: <IrrigationPage /> },
    { name: 'Reminders', component: <RemindersPage /> },
  ];

  pages.forEach(({ name, component }) => {
    describe(`${name} Page`, () => {
      it('(1) Words mode: does NOT render any Listen button', async () => {
        renderWithProviders(component, false, false);
        const listenButtons = screen.queryAllByRole('button', { name: /listen/i });
        expect(listenButtons.length).toBe(0);
      });

      it('(2) Pictures mode: DOES render Listen buttons', async () => {
        renderWithProviders(component, true, false);
        const listenButtons = await screen.findAllByRole('button', { name: /listen/i });
        expect(listenButtons.length).toBeGreaterThan(0);
      });

      it('(3) Words mode with alwaysShowListen ON: DOES render Listen buttons', async () => {
        renderWithProviders(component, false, true);
        const listenButtons = await screen.findAllByRole('button', { name: /listen/i });
        expect(listenButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
