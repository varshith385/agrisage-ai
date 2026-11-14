import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';
import { DashboardPage } from '../DashboardPage';
import { IrrigationPage } from '../IrrigationPage';
import { CalendarPage } from '../CalendarPage';
import { CropRecommendationPage } from '../CropRecommendationPage';
import { RemindersPage } from '../RemindersPage';
import * as farmsApi from '../../api/farms';
import * as weatherApiModule from '../../api/weather';
import * as advisoryApiModule from '../../api/advisory';
import * as economicsApiModule from '../../api/economics';
import * as irrigationApiModule from '../../api/irrigation';
import * as remindersApiModule from '../../api/reminders';
import * as clientModule from '../../api/client';

// Mock all external API modules
vi.mock('../../api/farms');
vi.mock('../../api/weather');
vi.mock('../../api/advisory');
vi.mock('../../api/economics');
vi.mock('../../api/irrigation');
vi.mock('../../api/reminders');
vi.mock('../../api/client');

const mockFarm = {
  id: 101,
  user_id: 1,
  name: 'రామేశ్వరం క్షేత్రం',
  area: 4.5,
  ownership_type: 'mixed',
  owned_area: 2.5,
  leased_area: 2.0,
  lease_amount: 15000,
  soil_type: 'Black Cotton',
  water_source: 'Borewell',
  irrigation_method: 'drip',
  village: 'Geikonda',
  district: 'Warangal',
  state: 'Telangana',
  latitude: 17.98,
  longitude: 79.6,
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
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'రమేష్' },
    activeFarm: mockFarm,
    currentFarm: mockFarm,
    activeFarmId: 101,
    activeCrop: mockFarm.current_crop_cycles[0],
    farms: [mockFarm],
    isAuthenticated: true,
    setActiveFarmId: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Allowlist of allowed English acronyms, proper nouns, and units
const ALLOWLIST = new Set([
  'agrisage', 'bollgard', 'ii', 'bpt', '5204', 'l', 'mm', 'q/ac', 'et0', 'das',
  'fao-56', 'fao', '56', 'raw', 'taw', 'awc', 'npk', 'ph', 'ha', 'kg', 'ac', 'n', 'p', 'k', 'oc',
  'demo', 'data', 'open-meteo', 'imd', 'kvk', 'des', 'msp', 'pm-kisan', 'rythu', 'bandhu',
  'sms', 'whatsapp', 'url', 'pdf', 'csv', 'json', 'rfc', '5545', 'iso', '8601', 'cpu', 'id', 'api', 'gps',
  'ai', 'pytorch', 'mobilenetv2', 'google', 'gemini', 'groq', 'openai', 'utc', 'ist', 'kharif', 'rabi', 'zaid'
]);

function inspectTextNodes(container: HTMLElement): string[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  const violations: string[] = [];

  while ((node = walker.nextNode())) {
    const rawText = node.textContent?.trim();
    if (!rawText) continue;

    // 1. Check for "[untranslated]" or missing translation fallback markers
    if (rawText.toLowerCase().includes('[untranslated]')) {
      violations.push(`Found "[untranslated]" marker in text node: "${rawText}"`);
    }

    // 2. Tokenize and check for more than 3 consecutive English words outside allowlist
    const words = rawText.split(/\s+/);
    let consecutiveEnglish: string[] = [];

    for (const rawWord of words) {
      // Clean word: strip edge punctuation
      const cleanWord = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
      if (!cleanWord) {
        consecutiveEnglish = [];
        continue;
      }

      // Check allowlist and numeric/percentage tokens
      const isAllowed = ALLOWLIST.has(cleanWord) || /^\d+([.,]\d+)?(%|x)?$/.test(cleanWord);
      if (isAllowed) {
        consecutiveEnglish = [];
        continue;
      }

      // Check if word is ASCII English alphabet of length >= 2
      const isAsciiEnglish = /^[a-z]{2,}$/i.test(cleanWord);
      if (isAsciiEnglish) {
        consecutiveEnglish.push(rawWord);
        if (consecutiveEnglish.length > 3) {
          violations.push(
            `More than 3 consecutive English words [${consecutiveEnglish.join(' ')}] in text: "${rawText}"`
          );
          break;
        }
      } else {
        consecutiveEnglish = [];
      }
    }
  }

  return violations;
}

describe('Phase 4: Multilingual Translation Coverage (te & hi)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Mock farm APIs
    (farmsApi.farmsApi.getFarms as any) = vi.fn().mockResolvedValue([mockFarm]);
    (farmsApi.farmsApi.getFarmById as any) = vi.fn().mockResolvedValue(mockFarm);

    // Mock weather APIs
    (weatherApiModule.weatherApi.getCurrentWeather as any) = vi.fn().mockResolvedValue({
      temperature_c: 31.5,
      relative_humidity_pct: 65,
      wind_speed_kmh: 12,
      condition_text: 'Sunny',
      rainfall_mm_today: 0,
      timestamp: '2026-11-14T12:00:00Z',
    });

    // Mock advisory APIs
    (advisoryApiModule.advisoryApi.getGrowthStage as any) = vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      current_stage: 'flowering',
      days_after_sowing: 75,
      stage_duration_days: 30,
      next_stage: 'fruiting',
      progress_pct: 60,
    });

    (advisoryApiModule.advisoryApi.getAdvisoryPlan as any) = vi.fn().mockResolvedValue({
      status: 'success',
      farm_id: 101,
      today_actions: [
        {
          title: 'Scout pests during flowering',
          action: 'Scout pests during flowering',
          category: 'scouting',
          urgency: 'high',
          rationales: ['Flowering moisture sensitivity'],
        },
      ],
      seven_day_plan: [
        {
          day: '2026-11-14',
          action: 'Scout pests during flowering',
          reason: 'Flowering moisture sensitivity',
          stage: 'flowering',
        },
      ],
      farm_health_score: {
        score: 84,
        status: 'optimal',
        breakdown: [
          { component: 'Soil moisture', score: 85, rationale: 'Adequate root zone moisture' },
          { component: 'Weather stress', score: 80, rationale: 'Mild temperature' },
          { component: 'Pest risk', score: 87, rationale: 'Low pest pressure' },
        ],
      },
    });

    // Mock economics APIs
    (economicsApiModule.calculateEconomics as any) = vi.fn().mockResolvedValue({
      gross_revenue: 125000,
      total_cost: 65000,
      net_profit: 60000,
      break_even_price_per_q: 4482,
      break_even_yield_q_per_ac: 7.2,
      assumed_price: 6800,
    });

    (economicsApiModule.getCropCalendar as any) = vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      sowing_date: '2026-08-15',
      stages: [
        { stage_name: 'flowering', duration_days: 30, start_date: '2026-10-15', end_date: '2026-11-14' },
      ],
      operations: [
        {
          date: '2026-11-16',
          title: 'Scout pests during flowering',
          category: 'scouting',
          stage: 'flowering',
          priority: 'high',
        },
      ],
    });

    (economicsApiModule.getSeasonalAwareness as any) = vi.fn().mockResolvedValue({
      season: 'Kharif',
      state: 'Telangana',
      description: 'Southwest Monsoon cropping season',
    });

    (economicsApiModule.getRotationRecommendations as any) = vi.fn().mockResolvedValue({
      primary_recommendation: {
        crop_name: 'Groundnut',
        botanical_family: 'Fabaceae',
        soil_compatibility: 'optimal',
        pest_break_benefit: 'Breaks cotton bollworm lifecycle',
        confidence_pct: 88,
      },
      alternatives: [],
    });

    // Mock irrigation APIs
    (irrigationApiModule.getIrrigationPlan as any) = vi.fn().mockResolvedValue({
      crop_name: 'Cotton',
      growth_stage: 'flowering',
      days_after_sowing: 75,
      kc: 1.15,
      reference_et0_mm: 5.2,
      etc_today_mm: 6.0,
      effective_rain_today_mm: 0.0,
      should_irrigate: true,
      net_depth_mm: 22.0,
      gross_depth_mm: 25.0,
      litres_needed: 450000,
      litres_saved: 0,
      rain_skip_triggered: false,
      next_irrigation_date: '2026-11-14',
      irrigation_method: 'drip',
      method_efficiency: 0.90,
      soil_type: 'Black Cotton',
      awc_mm_per_m: 190.0,
      taw_mm: 190.0,
      raw_mm: 123.5,
      depletion_today_mm: 125.0,
      daily_forecast_balance: [],
      recommendation_text: 'Apply scheduled light irrigation',
      explanation: {
        value: 'Irrigation Required',
        confidence: 0.92,
        confidence_type: 'rule_based',
        reasons: ['Crop is at peak water demand in mid flowering stage.'],
        limitations: [],
        sources: ['FAO-56 Paper No. 56'],
        status: 'WORKING',
      },
      status: 'WORKING',
    });

    // Mock reminders APIs
    (remindersApiModule.getReminders as any) = vi.fn().mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        farm_id: 101,
        title: 'Scout pests during flowering',
        notes: '',
        due_at: '2026-11-16T10:00:00Z',
        repeat: 'none',
        status: 'pending',
        source: 'manual',
        created_at: '2026-11-14T10:00:00Z',
        updated_at: '2026-11-14T10:00:00Z',
      },
    ]);

    (remindersApiModule.getReminderSuggestions as any) = vi.fn().mockResolvedValue([]);

    // Mock client API
    (clientModule.apiRequest as any) = vi.fn().mockResolvedValue({
      success: true,
      top_candidate: {
        crop_name: 'Cotton',
        confidence: 0.85,
      },
      candidates: [
        { crop_name: 'Cotton', confidence: 0.85 },
        { crop_name: 'Groundnut', confidence: 0.72 },
      ],
      input_features: {
        n: 50, p: 50, k: 50, ph: 6.5, temperature: 28, humidity: 70, rainfall: 180,
      },
    });
  });

  const renderWithLang = (component: React.ReactElement, lang: 'te' | 'hi') => {
    localStorage.setItem('agrisage_lang', lang);
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <PictorialProvider>
              {component}
            </PictorialProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('verifies DashboardPage has no untranslated text or consecutive English words in Telugu and Hindi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<DashboardPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies IrrigationPage has no untranslated text or consecutive English words in Telugu and Hindi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<IrrigationPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies CalendarPage has no untranslated text or consecutive English words in Telugu and Hindi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<CalendarPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies CropRecommendationPage has no untranslated text or consecutive English words in Telugu and Hindi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<CropRecommendationPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies RemindersPage has no untranslated text or consecutive English words in Telugu and Hindi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<RemindersPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });
});
