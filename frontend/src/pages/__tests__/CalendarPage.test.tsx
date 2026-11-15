import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../context/LanguageContext';
import { CalendarPage } from '../CalendarPage';
import * as economicsApi from '../../api/economics';
import { CropCalendarResponse, SeasonalAwarenessResponse } from '../../types/api';

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

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Farmer Ramesh', preferred_language: 'en' },
    activeFarmId: 101,
    activeFarm: {
      id: 101,
      name: 'Cotton Parcel 1',
      crop_name: 'Cotton',
      current_crop_cycles: [
        { id: 1, crop_name: 'Cotton', variety: 'Bollgard II', planting_date: '2026-08-15', is_active: true },
      ],
    },
    activeCrop: 'Cotton',
    location: { village: 'Geikonda', district: 'Warangal', state: 'Telangana', lat: 17.98, lon: 79.6 },
    farms: [
      {
        id: 101,
        name: 'Cotton Parcel 1',
        crop_name: 'Cotton',
        current_crop_cycles: [
          { id: 1, crop_name: 'Cotton', variety: 'Bollgard II', planting_date: '2026-08-15', is_active: true },
        ],
      },
    ],
    setActiveFarmId: vi.fn(),
  }),
}));

vi.mock('../../api/economics', () => ({
  getCropCalendar: vi.fn(),
  getSeasonalAwareness: vi.fn(),
}));

describe('CalendarPage Component — Phase 2 Verification', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    vi.mocked(economicsApi.getCropCalendar).mockResolvedValue({
      crop_name: 'Cotton',
      planting_date: '2026-08-15',
      days_after_sowing: 15,
      current_stage: 'Vegetative',
      total_duration_days: 150,
      events: [
        {
          event_id: 'evt-1',
          title: 'Apply NPK Fertilizer',
          event_type: 'fertilizer',
          start_date: '2026-08-20',
          growth_stage: 'Vegetative',
          priority: 'high',
          description: 'First split application of urea and DAP',
          notification_text: 'Apply NPK fertilizer today',
        },
      ],
      lifecycle_stages: [
        {
          stage_id: 'stage-1',
          stage_name_en: 'Vegetative',
          start_das: 1,
          end_das: 30,
          start_date: '2026-08-15',
          end_date: '2026-09-15',
          is_active: true,
          key_activities: ['Weeding', 'Scouting'],
        },
      ],
      status: 'WORKING',
    } as unknown as CropCalendarResponse);

    vi.mocked(economicsApi.getSeasonalAwareness).mockResolvedValue({
      current_season: 'Kharif',
      season_name_te: 'ఖరీఫ్',
      season_name_hi: 'खरीफ',
      season_period: 'June to October',
      current_month: 'August',
      climate_expectations: {
        temperature: '25-35°C',
        rainfall: 'Moderate',
        humidity: '60-70%',
      },
      typical_crops: ['Cotton', 'Groundnut'],
      primary_risks: ['Pest outbreak during flowering'],
      general_guidance: 'Monitor soil moisture and bollworm infestation.',
      status: 'WORKING',
    } as unknown as SeasonalAwarenessResponse);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <CalendarPage />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

  it('renders the Crop Calendar page and its core interactive elements', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Crop Lifecycle/i)).toBeInTheDocument();
    });

    // Verify task content rendered from mock
    await waitFor(() => {
      expect(screen.getByText(/Apply NPK Fertilizer/i)).toBeInTheDocument();
    });
  });

  it('proves that Export Calendar button is absent from the page', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Crop Lifecycle/i)).toBeInTheDocument();
    });

    // Assert that no "Export Calendar" button exists in the DOM
    const exportButton = screen.queryByRole('button', { name: /Export Calendar/i });
    expect(exportButton).toBeNull();
  });

  it('proves that ICS export text and descriptions are absent from the page', async () => {
    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Crop Lifecycle/i)).toBeInTheDocument();
    });

    const pageText = container.textContent || '';
    expect(pageText).not.toMatch(/Export Calendar/i);
    expect(pageText).not.toMatch(/calendar\.ics/i);
    expect(pageText).not.toMatch(/RFC 5545/i);
    expect(pageText).not.toMatch(/iCalendar/i);
  });
});
