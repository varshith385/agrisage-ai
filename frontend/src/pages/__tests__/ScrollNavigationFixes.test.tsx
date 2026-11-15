import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { CommunityPage } from '../CommunityPage';
import { CropRecommendationPage } from '../CropRecommendationPage';
import { EconomicsPage } from '../EconomicsPage';
import { CalendarPage } from '../CalendarPage';
import { LocationWeatherPage } from '../LocationWeatherPage';
import { FarmRegistrationPage } from '../FarmRegistrationPage';
import { MarketPage } from '../MarketPage';
import { SchemesPage } from '../SchemesPage';
import * as scrollHelper from '../../utils/scrollToSection';

// Spy on scrollToSection
const scrollToSectionSpy = vi.spyOn(scrollHelper, 'scrollToSection');

const { mockFarm } = vi.hoisted(() => {
  const farm = {
    id: 101,
    user_id: 1,
    name: 'Rameshwaram Farm',
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
      { id: 1, crop_name: 'Cotton', variety: 'Bollgard II', planting_date: '2026-08-15', is_active: true },
    ],
  };
  return { mockFarm: farm };
});

vi.mock('../../context/PictorialContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../context/PictorialContext')>();
  return {
    ...actual,
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
  };
});

// Mock auth & external APIs
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Ramesh', preferred_language: 'en' },
    activeFarmId: 101,
    activeFarm: mockFarm,
    activeCrop: 'Cotton',
    location: { village: 'Geikonda', district: 'Warangal', state: 'Telangana', lat: 17.98, lon: 79.6 },
    farms: [mockFarm],
    setActiveFarmId: vi.fn(),
    setLocation: vi.fn(),
    refreshFarms: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../api/farms', () => ({
  farmsApi: {
    getFarms: vi.fn().mockResolvedValue([mockFarm]),
    getFarmById: vi.fn().mockResolvedValue(mockFarm),
    createFarm: vi.fn().mockResolvedValue(mockFarm),
    updateFarm: vi.fn().mockResolvedValue(mockFarm),
  },
  getFarms: vi.fn().mockResolvedValue([mockFarm]),
  getFarmById: vi.fn().mockResolvedValue(mockFarm),
  createFarm: vi.fn().mockResolvedValue(mockFarm),
  updateFarm: vi.fn().mockResolvedValue(mockFarm),
}));

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

vi.mock('../../api/economics', () => ({
  calculateEconomics: vi.fn().mockResolvedValue({
    combined_summary: {
      margin_pct: 37.5,
      net_profit: 45000,
      gross_revenue: 120000,
      total_cost: 75000,
      break_even_price_per_q: 5200,
      break_even_yield_q_per_acre: 6.5,
    },
    scenarios: [],
  }),
  compareCrops: vi.fn().mockResolvedValue({
    comparison_table: [],
    best_crop: 'Cotton',
  }),
  simulateWhatIf: vi.fn().mockResolvedValue({
    net_profit: 45000,
    margin_pct: 37.5,
    break_even_price_per_q: 5200,
  }),
  getRotationRecommendations: vi.fn().mockResolvedValue({
    previous_crop: 'Cotton',
    recommended_rotations: [{ crop_name: 'Pulses', rationale: 'Nitrogen fixation' }],
    avoid_crops: ['Cotton'],
  }),
  getCropCalendar: vi.fn().mockResolvedValue({
    crop_name: 'Cotton',
    current_stage: { stage_name_en: 'Vegetative' },
    events: [],
    lifecycle_stages: [
      {
        stage_id: 1,
        stage_name: 'Vegetative',
        start_das: 1,
        end_das: 30,
        start_date: '2026-08-15',
        end_date: '2026-09-15',
        is_active: true,
        kc_value: 0.7,
        water_sensitivity: 'medium',
        key_activities: ['Weeding', 'Scouting'],
      },
    ],
  }),
  getSeasonalAwareness: vi.fn().mockResolvedValue({
    current_season: 'Kharif',
    season_period: 'June to October',
    climate_expectations: {
      temperature: '25-35°C',
      rainfall: 'Moderate',
      humidity: '60-70%',
    },
    typical_crops: ['Cotton', 'Groundnut'],
    primary_risks: ['Pest outbreak during flowering'],
  }),
  getCostTemplates: vi.fn().mockResolvedValue({
    cotton: { items: { seeds: 2000, fertilizer: 5000 } },
  }),
  getMultiCropComparison: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../api/weather', () => ({
  weatherApi: {
    getClimateNormals: vi.fn().mockResolvedValue({
      mean_temperature_c: 27.5,
      mean_relative_humidity_pct: 65,
      mean_monthly_rainfall_mm: 110,
      window_start_date: '2025-11-01',
      window_end_date: '2026-10-31',
      source: 'Open-Meteo climate normals (trailing 12mo)',
    }),
    getForecast: vi.fn().mockResolvedValue({
      latitude: 17.98,
      longitude: 79.6,
      current: {
        temperature_c: 28,
        relative_humidity_pct: 60,
        precipitation_mm: 0,
        wind_speed_kmh: 12,
        expected_rainfall_today_mm: 0,
        reference_et0_mm: 4.8,
        stale: false,
        fetched_at: '2026-11-15T10:00:00Z',
        source: 'Open-Meteo',
      },
      daily: [
        {
          date: '2026-11-15',
          temp_max_c: 32,
          temp_min_c: 20,
          relative_humidity_pct: 60,
          precipitation_sum_mm: 5,
          reference_et0_mm: 4.8,
          wind_speed_kmh: 12,
          weather_condition: 'partly_cloudy',
        },
      ],
      stale: false,
      fetched_at: '2026-11-15T10:00:00Z',
      source: 'Open-Meteo',
    }),
    getFarmWeather: vi.fn().mockResolvedValue({
      latitude: 17.98,
      longitude: 79.6,
      current: {
        temperature_c: 28,
        relative_humidity_pct: 60,
        precipitation_mm: 0,
        wind_speed_kmh: 12,
        expected_rainfall_today_mm: 0,
        reference_et0_mm: 4.8,
        stale: false,
        fetched_at: '2026-11-15T10:00:00Z',
        source: 'Open-Meteo',
      },
      daily: [
        {
          date: '2026-11-15',
          temp_max_c: 32,
          temp_min_c: 20,
          relative_humidity_pct: 60,
          precipitation_sum_mm: 5,
          reference_et0_mm: 4.8,
          wind_speed_kmh: 12,
          weather_condition: 'partly_cloudy',
        },
      ],
      stale: false,
      fetched_at: '2026-11-15T10:00:00Z',
      source: 'Open-Meteo',
    }),
    getCurrentWeather: vi.fn().mockResolvedValue({
      temperature_c: 28,
      relative_humidity_pct: 60,
      wind_speed_kmh: 12,
      reference_et0_mm: 4.8,
      expected_rainfall_today_mm: 0,
      precipitation_mm: 0,
      stale: false,
      fetched_at: '2026-11-15T10:00:00Z',
      source: 'Open-Meteo',
    }),
    getHistoricalNormals: vi.fn().mockResolvedValue({}),
    getCropSuitability: vi.fn().mockResolvedValue({}),
  },
  getCurrentWeather: vi.fn().mockResolvedValue({
    temperature_c: 28,
    relative_humidity_pct: 60,
    wind_speed_kmh: 12,
    reference_et0_mm: 4.8,
  }),
  getDailyForecast: vi.fn().mockResolvedValue({ daily: [] }),
  getCropSuitability: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/client', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    top_crops: [
      { crop_name: 'Cotton', probability: 0.88, reasons: ['Optimal temperature'] },
      { crop_name: 'Groundnut', probability: 0.75, reasons: ['Good soil drainage'] },
      { crop_name: 'Maize', probability: 0.62, reasons: ['Moderate water requirement'] },
    ],
    decision_status: 'CONFIDENT',
  }),
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
  calculateTransportCostSplit: vi.fn().mockResolvedValue({
    total_cost: 5000,
    splits: [],
  }),
  getMachineryGuide: vi.fn().mockResolvedValue({ rates: [] }),
  searchMachineryListings: vi.fn().mockResolvedValue([]),
  getMachineryListings: vi.fn().mockResolvedValue([]),
  createMachineryListing: vi.fn().mockResolvedValue({}),
  bookMachinery: vi.fn().mockResolvedValue({}),
  createMachineryBooking: vi.fn().mockResolvedValue({}),
  getUserBookings: vi.fn().mockResolvedValue([]),
  updateBookingStatus: vi.fn().mockResolvedValue({}),
  getOutbreakMap: vi.fn().mockResolvedValue({
    alerts: [],
    clusters: [],
    summary: { unique_villages_displayed: 0, total_reports: 0, high_severity_villages: 0 },
  }),
  getDistrictOfficerSummary: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/market', () => ({
  getNetRealizationRanking: vi.fn().mockResolvedValue({
    rankings: [
      {
        mandi: 'Warangal APMC',
        net_realization: 75000,
        net_realization_per_q: 3750,
        distance_km: 15,
        modal_price: 7200,
        transport_cost: 1500,
        market_fee: 150,
        rank: 1,
      },
    ],
  }),
  getMSPComparison: vi.fn().mockResolvedValue({}),
  getPriceTrends: vi.fn().mockResolvedValue({
    trends: [],
    trend_direction: 'stable',
    modal_price_today: 7200,
    price_change_7d_pct: 0,
    historical_prices: [],
    forecast_prices: [],
    projected_prices: [],
  }),
  getNearbyWarehouses: vi.fn().mockResolvedValue({ warehouses: [] }),
  getMarketplaceListings: vi.fn().mockResolvedValue([]),
  getMarketplaceInquiries: vi.fn().mockResolvedValue([]),
  createMarketplaceListing: vi.fn().mockResolvedValue({}),
  deleteMarketplaceListing: vi.fn().mockResolvedValue({}),
  submitBuyerInquiry: vi.fn().mockResolvedValue({}),
  updateInquiryStatus: vi.fn().mockResolvedValue({}),
  verifyFarmer: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/soil_card', () => ({
  getOcrEngines: vi.fn().mockResolvedValue({
    tesseract_available: true,
    gemini_vision_available: false,
    easyocr_available: false,
  }),
  getLatestSoilCard: vi.fn().mockResolvedValue({ has_card: false, card: null }),
  getSoilImpact: vi.fn().mockResolvedValue({
    with_soil_card: { confidence: 0.85 },
    without_soil_card: { confidence: 0.52 },
  }),
  extractSoilCard: vi.fn().mockResolvedValue({}),
  confirmSoilCard: vi.fn().mockResolvedValue({}),
}));

function renderPage(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

describe('Phase 1: In-Page Navigation Scroll Fixes', () => {
  beforeEach(() => {
    scrollToSectionSpy.mockClear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe('CommunityPage shortcut navigation', () => {
    it('Browse Machinery switches to machinery tab and scrolls to tabs section', async () => {
      renderPage(<CommunityPage />);
      const browseBtn = screen.getByRole('button', { name: /Browse Machinery/i });
      fireEvent.click(browseBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('community-tabs-section');
    });

    it('View Groups switches to groups tab and scrolls to tabs section', async () => {
      renderPage(<CommunityPage />);
      const viewGroupsBtn = screen.getByRole('button', { name: /View Groups/i });
      fireEvent.click(viewGroupsBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('community-tabs-section');
    });

    it('Open Split Calculator switches to calculator tab and scrolls to tabs section', async () => {
      renderPage(<CommunityPage />);
      const calcBtn = screen.getByRole('button', { name: /Open Split Calculator/i });
      fireEvent.click(calcBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('community-tabs-section');
    });

    it('Open Outbreak Map switches to outbreak tab and scrolls to tabs section', async () => {
      renderPage(<CommunityPage />);
      const mapBtn = screen.getByRole('button', { name: /Open Outbreak Map/i });
      fireEvent.click(mapBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('community-tabs-section');
    });
  });

  describe('CropRecommendationPage shortcut navigation', () => {
    it('See Top 3 switches to candidates tab and scrolls to candidates section', async () => {
      renderPage(<CropRecommendationPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /See Top 3/i })).toBeInTheDocument();
      });

      const top3Btn = screen.getByRole('button', { name: /See Top 3/i });
      fireEvent.click(top3Btn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('crop-candidates-section');
    });

    it('Adjust Inputs switches to inputs tab and scrolls with focusFirstEmptyInput', async () => {
      renderPage(<CropRecommendationPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Adjust Inputs/i })).toBeInTheDocument();
      });

      const adjustBtn = screen.getByRole('button', { name: /Adjust Inputs/i });
      fireEvent.click(adjustBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('crop-inputs-section', { focusFirstEmptyInput: true });
    });
  });

  describe('EconomicsPage shortcut navigation', () => {
    it('Simulate What-If switches to whatif tab and scrolls to economics tabs section', async () => {
      renderPage(<EconomicsPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Simulate What-If/i })).toBeInTheDocument();
      });

      const whatIfBtn = screen.getByRole('button', { name: /Simulate What-If/i });
      fireEvent.click(whatIfBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('economics-tabs-section');
    });
  });

  describe('CalendarPage shortcut navigation', () => {
    it('View 7 Stages switches to stages tab and scrolls to calendar tabs section', async () => {
      renderPage(<CalendarPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View 7 Stages/i })).toBeInTheDocument();
      });

      const stagesBtn = screen.getByRole('button', { name: /View 7 Stages/i });
      fireEvent.click(stagesBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('calendar-tabs-section');
    });

    it('Season Details switches to season tab and scrolls to calendar tabs section', async () => {
      renderPage(<CalendarPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Season Details/i })).toBeInTheDocument();
      });

      const seasonBtn = screen.getByRole('button', { name: /Season Details/i });
      fireEvent.click(seasonBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('calendar-tabs-section');
    });
  });

  describe('LocationWeatherPage shortcut navigation', () => {
    it('7-Day Outlook switches to forecast tab and scrolls to weather tabs section', async () => {
      renderPage(<LocationWeatherPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /7-Day Outlook/i })).toBeInTheDocument();
      });

      const outlookBtn = screen.getByRole('button', { name: /7-Day Outlook/i });
      fireEvent.click(outlookBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('weather-tabs-section');
    });

    it('Change Village switches to location tab and scrolls to weather tabs section', async () => {
      renderPage(<LocationWeatherPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change (Mandal|Village|Taluk)/i })).toBeInTheDocument();
      });

      const changeVillageBtn = screen.getByRole('button', { name: /Change (Mandal|Village|Taluk)/i });
      fireEvent.click(changeVillageBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('weather-tabs-section');
    });
  });

  describe('FarmRegistrationPage shortcut navigation', () => {
    it('View All Holdings switches to holdings tab and scrolls to farms tabs section', async () => {
      renderPage(<FarmRegistrationPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View All Holdings/i })).toBeInTheDocument();
      });

      const holdingsBtn = screen.getByRole('button', { name: /View All Holdings/i });
      fireEvent.click(holdingsBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('farms-tabs-section');
    });

    it('Register Another Parcel switches to register tab and scrolls to farms tabs section', async () => {
      renderPage(<FarmRegistrationPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Register Another Parcel/i })).toBeInTheDocument();
      });

      const regBtn = screen.getByRole('button', { name: /Register Another Parcel/i });
      fireEvent.click(regBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('farms-tabs-section');
    });
  });

  describe('MarketPage shortcut navigation', () => {
    it('View All Mandis switches to mandi tab and scrolls to market tabs section', async () => {
      renderPage(<MarketPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View All Mandis/i })).toBeInTheDocument();
      });

      const mandisBtn = screen.getByRole('button', { name: /View All Mandis/i });
      fireEvent.click(mandisBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('market-tabs-section');
    });
  });

  describe('SchemesPage shortcut navigation', () => {
    it('Calibrate Soil switches to upload tab and scrolls to soil card section', async () => {
      renderPage(<SchemesPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Calibrate Soil$/i })).toBeInTheDocument();
      });

      const calibBtn = screen.getByRole('button', { name: /^Calibrate Soil$/i });
      fireEvent.click(calibBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('soil-card-upload');
    });

    it('View Advisory Notice switches to schemes tab and scrolls to soil card section', async () => {
      renderPage(<SchemesPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View Advisory Notice/i })).toBeInTheDocument();
      });

      const noticeBtn = screen.getByRole('button', { name: /View Advisory Notice/i });
      fireEvent.click(noticeBtn);

      expect(scrollToSectionSpy).toHaveBeenCalledWith('soil-card-upload');
    });
  });
});
