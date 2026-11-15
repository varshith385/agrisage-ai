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
import { AuthPage } from '../AuthPage';
import { LocationWeatherPage } from '../LocationWeatherPage';
import { DiseasePage } from '../DiseasePage';
import { EconomicsPage } from '../EconomicsPage';
import { MarketPage } from '../MarketPage';
import { FarmRegistrationPage } from '../FarmRegistrationPage';
import { CommunityPage } from '../CommunityPage';
import { SchemesPage } from '../SchemesPage';
import { HowToPage } from '../HowToPage';
import { WatchHowToPage } from '../WatchHowToPage';

import * as farmsApi from '../../api/farms';
import * as weatherApiModule from '../../api/weather';
import * as advisoryApiModule from '../../api/advisory';
import * as economicsApiModule from '../../api/economics';
import * as irrigationApiModule from '../../api/irrigation';
import * as remindersApiModule from '../../api/reminders';
import * as clientModule from '../../api/client';

// Mock all external API modules
const { mockFarm } = vi.hoisted(() => {
  const farm = {
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
  return { mockFarm: farm };
});

vi.mock('../../api/farms', () => ({
  farmsApi: {
    getFarms: vi.fn().mockResolvedValue([mockFarm]),
    getFarmById: vi.fn().mockResolvedValue(mockFarm),
    createFarm: vi.fn().mockResolvedValue(mockFarm),
  },
  getFarms: vi.fn().mockResolvedValue([mockFarm]),
  getFarmById: vi.fn().mockResolvedValue(mockFarm),
  createFarm: vi.fn().mockResolvedValue(mockFarm),
}));

vi.mock('../../api/weather');
vi.mock('../../api/advisory');
vi.mock('../../api/economics');
vi.mock('../../api/irrigation');
vi.mock('../../api/reminders');

vi.mock('../../api/location', () => ({
  locationApi: {
    getStates: vi.fn().mockResolvedValue(['Telangana', 'Andhra Pradesh']),
    getDistricts: vi.fn().mockResolvedValue(['Warangal']),
    getVillages: vi.fn().mockResolvedValue({
      villages: [{ village: 'Geikonda', lat: 17.98, lon: 79.6 }],
      is_partial: false,
    }),
    geocode: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../api/disease', () => ({
  predictPlantDisease: vi.fn().mockResolvedValue({}),
  getSupportedCrops: vi.fn().mockResolvedValue({ crops: ['Cotton', 'Rice'] }),
  getDiseaseHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/market', () => ({
  getMandiPrices: vi.fn().mockResolvedValue({}),
  getNetRealizationRanking: vi.fn().mockResolvedValue({
    rankings: [
      {
        rank: 1,
        mandi: 'Warangal APMC',
        district: 'Warangal',
        state: 'Telangana',
        distance_km: 15,
        modal_price: 6800,
        transport_cost: 375,
        market_fee: 136,
        net_realization_per_q: 6289,
        net_realization: 125780,
      },
    ],
    crop: 'Cotton',
  }),
  getMSPComparison: vi.fn().mockResolvedValue(null),
  getPriceTrends: vi.fn().mockResolvedValue({ trends: [] }),
  getNearbyWarehouses: vi.fn().mockResolvedValue({ warehouses: [] }),
  getMarketplaceListings: vi.fn().mockResolvedValue([]),
  createMarketplaceListing: vi.fn().mockResolvedValue({}),
  deleteMarketplaceListing: vi.fn().mockResolvedValue({}),
  submitBuyerInquiry: vi.fn().mockResolvedValue({}),
  getMarketplaceInquiries: vi.fn().mockResolvedValue([]),
  updateInquiryStatus: vi.fn().mockResolvedValue({}),
  verifyFarmer: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/community', () => ({
  getNearbyFarmers: vi.fn().mockResolvedValue([]),
  getGroups: vi.fn().mockResolvedValue([]),
  createGroup: vi.fn().mockResolvedValue({}),
  joinGroup: vi.fn().mockResolvedValue({}),
  leaveGroup: vi.fn().mockResolvedValue({}),
  updateGroupConsent: vi.fn().mockResolvedValue({}),
  getGroupMembers: vi.fn().mockResolvedValue([]),
  getRequests: vi.fn().mockResolvedValue([]),
  createCommunityRequest: vi.fn().mockResolvedValue({}),
  joinCommunityRequest: vi.fn().mockResolvedValue({}),
  calculateTransportCostSplit: vi.fn().mockResolvedValue({}),
  getMachineryGuide: vi.fn().mockResolvedValue({}),
  searchMachineryListings: vi.fn().mockResolvedValue([]),
  createMachineryListing: vi.fn().mockResolvedValue({}),
  createMachineryBooking: vi.fn().mockResolvedValue({}),
  getUserBookings: vi.fn().mockResolvedValue([]),
  updateBookingStatus: vi.fn().mockResolvedValue({}),
  getOutbreakMap: vi.fn().mockResolvedValue({ alerts: [] }),
  getDistrictOfficerSummary: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/soil_card', () => ({
  getOcrEngines: vi.fn().mockResolvedValue({
    tesseract_available: true,
    paddleocr_available: false,
    easyocr_available: false,
  }),
  getLatestSoilCard: vi.fn().mockResolvedValue({ has_card: false, card: null }),
  getSoilImpact: vi.fn().mockResolvedValue({
    with_soil_card: { confidence: 0.85 },
    without_soil_card: { confidence: 0.52 },
  }),
}));

vi.mock('../../api/auth', () => ({
  authApi: {
    demoLogin: vi.fn().mockResolvedValue({
      access_token: 'fake-demo-token',
      user: { id: 1, email: 'farmer@example.com', full_name: 'రమేష్', preferred_language: 'te' },
    }),
    login: vi.fn().mockResolvedValue({
      access_token: 'fake-token',
      user: { id: 1, email: 'farmer@example.com', full_name: 'రమేష్', preferred_language: 'te' },
    }),
    register: vi.fn().mockResolvedValue({
      access_token: 'fake-token',
      user: { id: 1, email: 'farmer@example.com', full_name: 'రమేష్', preferred_language: 'te' },
    }),
  },
}));

vi.mock('../../api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'రమేష్' },
    activeFarm: mockFarm,
    currentFarm: mockFarm,
    activeFarmId: 101,
    activeCrop: 'Cotton',
    farms: [mockFarm],
    isAuthenticated: true,
    setActiveFarmId: vi.fn(),
    setSession: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Allowlist of allowed English acronyms, proper nouns, and units
const ALLOWLIST = new Set([
  'grow2gain', 'bollgard', 'ii', 'bpt', '5204', 'l', 'mm', 'q/ac', 'et0', 'das',
  'fao-56', 'fao', '56', 'raw', 'taw', 'awc', 'npk', 'ph', 'ha', 'kg', 'ac', 'n', 'p', 'k', 'oc', 'ec',
  'demo', 'data', 'open-meteo', 'imd', 'kvk', 'des', 'msp', 'pm-kisan', 'rythu', 'bandhu', 'apmc', 'wdra',
  'sms', 'whatsapp', 'url', 'pdf', 'csv', 'json', 'rfc', '5545', 'iso', '8601', 'cpu', 'id', 'api', 'gps',
  'ai', 'pytorch', 'mobilenetv2', 'google', 'gemini', 'groq', 'openai', 'utc', 'ist', 'kharif', 'rabi', 'zaid',
  'insufficient_data', 'insufficient', 'derivation', 'depth', 'area', 'efficiency', 'uncalibrated',
  'cotton', 'rice', 'wheat', 'maize', 'chilli', 'groundnut', 'warangal', 'geikonda', 'telangana', 'andhra', 'pradesh',
  'ramesh', 'kumar', 'farmer@example.com', 'english', 'esc', 'ctrl+k', 'ctrl', 'html5', 'mp4', 'am', 'pm', 'rh', 'km/h', 'km',
  'acres', 'acre', 'min', 'max'
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
      const cleanWord = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
      if (!cleanWord) {
        consecutiveEnglish = [];
        continue;
      }

      const isAllowed = ALLOWLIST.has(cleanWord) || /^\d+([.,]\d+)?(%|x|°c|c)?$/i.test(cleanWord);
      if (isAllowed) {
        consecutiveEnglish = [];
        continue;
      }

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

    // 3. Single stray English UI word check on standalone UI nodes (buttons, tabs, badges, headers)
    if (words.length === 1) {
      const cleanWord = words[0].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
      const isAsciiEnglish = /^[a-z]{2,}$/i.test(cleanWord);
      const isAllowed = ALLOWLIST.has(cleanWord) || /^\d+([.,]\d+)?(%|x|°c|c)?$/i.test(cleanWord);
      if (isAsciiEnglish && !isAllowed) {
        violations.push(`Single stray English UI word [${words[0]}] in text node: "${rawText}"`);
      }
    }
  }

  return violations;
}

describe('Phase 2: Complete Multilingual Translation Coverage Across All 15 Pages (te & hi)', () => {
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
    const mockCurrentWeather = {
      temperature_c: 31.5,
      relative_humidity_pct: 65,
      humidity: 65,
      wind_speed_kmh: 12,
      condition_text: 'Sunny',
      rainfall_mm_today: 0,
      expected_rainfall_today_mm: 0,
      reference_et0_mm: 5.2,
      weather_code: 0,
      is_day: 1,
      place_name: 'Warangal Centroid',
      grid_disclaimer: 'model grid value for this location, not a village sensor',
      timestamp: '2026-11-14T12:00:00Z',
      fetched_at: '2026-11-15T07:00:00Z',
      source: 'Open-Meteo',
    };
    const mockForecastData = {
      latitude: 17.9689,
      longitude: 79.5941,
      current: mockCurrentWeather,
      daily: [],
      place_name: 'Warangal Centroid',
      grid_disclaimer: 'model grid value for this location, not a village sensor',
      fetched_at: '2026-11-15T07:00:00Z',
      source: 'Open-Meteo',
    };
    (weatherApiModule.weatherApi.getCurrentWeather as any) = vi.fn().mockResolvedValue(mockCurrentWeather);
    (weatherApiModule.weatherApi.getForecast as any) = vi.fn().mockResolvedValue(mockForecastData);
    (weatherApiModule.weatherApi.getFarmWeather as any) = vi.fn().mockResolvedValue(mockForecastData);
    (weatherApiModule.weatherApi.getCropSuitability as any) = vi.fn().mockResolvedValue({
      crop: 'Cotton',
      suitability_score: 85,
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
      break_even_price: 4482,
      break_even_yield: 7.2,
      margin_pct: 48.0,
    });

    (economicsApiModule.getCostTemplates as any) = vi.fn().mockResolvedValue({});

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

    (economicsApiModule.compareCrops as any) = vi.fn().mockResolvedValue([]);
    (economicsApiModule.simulateWhatIf as any) = vi.fn().mockResolvedValue({
      current_net_profit: 60000,
      current_margin_pct: 48.0,
      total_cost: 65000,
      gross_revenue: 125000,
      break_even_price_per_q: 4482,
      break_even_yield_q_per_acre: 7.2,
      sweep_variable: 'price',
      sensitivity_points: [],
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

    // API mocks are established via vi.mock with factories above
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

  it('verifies DashboardPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<DashboardPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies IrrigationPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<IrrigationPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies CalendarPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<CalendarPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies CropRecommendationPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<CropRecommendationPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies RemindersPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<RemindersPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies AuthPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<AuthPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies LocationWeatherPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<LocationWeatherPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies DiseasePage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<DiseasePage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies EconomicsPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<EconomicsPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies MarketPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<MarketPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies FarmRegistrationPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<FarmRegistrationPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies CommunityPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<CommunityPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies SchemesPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<SchemesPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies HowToPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<HowToPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });

  it('verifies WatchHowToPage in te and hi', async () => {
    for (const lang of ['te', 'hi'] as const) {
      const { container, unmount } = renderWithLang(<WatchHowToPage />, lang);
      await waitFor(() => {
        const violations = inspectTextNodes(container);
        expect(violations).toEqual([]);
      });
      unmount();
    }
  });
});
