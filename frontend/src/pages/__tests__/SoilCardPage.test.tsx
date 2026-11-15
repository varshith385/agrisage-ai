import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { SchemesPage } from '../SchemesPage';
import * as soilCardApi from '../../api/soil_card';

// Mock URL.createObjectURL for jsdom
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'blob:test-preview');
}

vi.mock('../../utils/imageCompressor', () => ({
  validateImageFile: vi.fn(() => ({ valid: true })),
  compressImage: vi.fn(async (file: File) => file),
}));

// Mock active farm state that can be mutated in tests
let mockActiveFarm: any = {
  id: 101,
  name: 'Farm Alpha',
  village: 'Geesugonda',
  district: 'Warangal',
  state: 'Telangana',
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, full_name: 'Ramesh Kumar', phone: '9876543210' },
    activeFarm: mockActiveFarm,
    activeFarmId: mockActiveFarm?.id ?? 101,
    farms: [mockActiveFarm],
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

describe('SoilCardPage (SchemesPage) — Photo Reading & Farm Saving Flow', () => {
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
    };

    // Default API mocks
    vi.spyOn(soilCardApi, 'getOcrEngines').mockResolvedValue({
      engine_detected: 'gemini_vision',
      available_engines: ['gemini_vision', 'manual'],
      install_instructions: {},
      powershell_help: {},
      status: 'active',
    });

    vi.spyOn(soilCardApi, 'getSoilImpact').mockResolvedValue({
      farm_id: 101,
      crop_name: 'Rice',
      has_confirmed_soil_card: false,
      soil_values: null,
      without_soil_card: {
        top_crops: [{ crop_name: 'Rice', probability: 0.82 }],
        confidence: 0.65,
        fallback_used: 'weather_only',
        expected_yield_q_acre: 18.5,
      },
      with_soil_card: {
        top_crops: [{ crop_name: 'Rice', probability: 0.94 }],
        confidence: 0.91,
        fallback_used: 'full_soil',
        expected_yield_q_acre: 22.0,
      },
      impact_summary: ['Nitrogen precision increases recommendation accuracy by 26%'],
      integration_scope_note: '',
      disclaimer: 'Agronomic advisory purposes only',
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <SchemesPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('1. Upload photo fills the form with badges and confidence', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: false,
      card: null,
    });

    const mockExtraction: soilCardApi.SoilCardExtractionResponse = {
      engine_detected: 'gemini_vision',
      available_engines: ['gemini_vision'],
      install_instructions: {},
      nitrogen: { value: 275.5, confidence: 0.95, unit: 'kg/ha', status: 'HIGH' },
      phosphorus: { value: 24.2, confidence: 0.92, unit: 'kg/ha', status: 'HIGH' },
      potassium: { value: 310.0, confidence: 0.88, unit: 'kg/ha', status: 'HIGH' },
      ph: { value: 7.1, confidence: 0.96, unit: 'pH', status: 'HIGH' },
      organic_carbon: { value: 0.55, confidence: 0.85, unit: '%', status: 'HIGH' },
      electrical_conductivity: { value: null, confidence: 0.0, unit: 'dS/m', status: 'UNAVAILABLE' },
      overall_confidence: 0.92,
      language: 'en',
      status: 'WORKING',
      is_soil_health_card: true,
      notes: [],
    };

    const extractSpy = vi.spyOn(soilCardApi, 'extractSoilCard').mockResolvedValue(mockExtraction);

    renderComponent();

    // Find file input and simulate selecting a photo
    const fileInput = screen.getByTestId('soil-card-file-input');
    const fakeFile = new File(['fake-image-bytes'], 'soil_test_card.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // Wait for file to be processed and extract button to be enabled
    const extractBtn = screen.getByRole('button', { name: /Extract Soil Parameters|Parse & Calibrate/i });
    await waitFor(() => {
      expect(extractBtn).toBeEnabled();
    });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(extractSpy).toHaveBeenCalledTimes(1);
    });

    // Check that form inputs are auto-filled with extracted numbers
    await waitFor(() => {
      const nInput = screen.getByPlaceholderText('e.g. 280.5') as HTMLInputElement;
      expect(nInput.value).toBe('275.5');

      const pInput = screen.getByPlaceholderText('e.g. 18.2') as HTMLInputElement;
      expect(pInput.value).toBe('24.2');

      const kInput = screen.getByPlaceholderText('e.g. 310.0') as HTMLInputElement;
      expect(kInput.value).toBe('310');

      const phInput = screen.getByPlaceholderText('e.g. 7.2') as HTMLInputElement;
      expect(phInput.value).toBe('7.1');
    });

    // Badges: "Read from your card • 95%" should appear for read fields
    expect(screen.getByText(/Read from your card • 95%/i)).toBeInTheDocument();

    // For unreadable EC field, highlight badge should appear
    expect(screen.getByText(/Not detected — enter manually/i)).toBeInTheDocument();
  });

  it('2. Farmer can edit fields then confirm calls save to this farm', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: false,
      card: null,
    });

    const confirmSpy = vi.spyOn(soilCardApi, 'confirmSoilCard').mockResolvedValue({
      success: true,
      message: 'Soil card confirmed and saved to this farm!',
      card_id: 10,
      farm_id: 101,
      confirmed_values: { nitrogen_kg_ha: 320.0, ph: 7.4 },
      created_at: '2026-11-15T12:00:00Z',
    });

    renderComponent();

    // Type manual values
    const nInput = screen.getByPlaceholderText('e.g. 280.5');
    fireEvent.change(nInput, { target: { value: '320.0' } });

    const phInput = screen.getByPlaceholderText('e.g. 7.2');
    fireEvent.change(phInput, { target: { value: '7.4' } });

    // Click "Confirm and save to this farm"
    const confirmBtn = screen.getByRole('button', { name: /Confirm and save to this farm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          farm_id: 101,
          nitrogen_kg_ha: 320.0,
          ph: 7.4,
          source: 'typed by farmer',
        })
      );
    });
  });

  it('3. Errors show friendly error message on failure', async () => {
    vi.spyOn(soilCardApi, 'getLatestSoilCard').mockResolvedValue({
      has_card: false,
      card: null,
    });

    vi.spyOn(soilCardApi, 'extractSoilCard').mockRejectedValue(
      new Error('AI provider connection timeout (8s).')
    );

    renderComponent();

    const fileInput = screen.getByTestId('soil-card-file-input');
    const fakeFile = new File(['fake-bytes'], 'card.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    const extractBtn = screen.getByRole('button', { name: /Extract Soil Parameters|Parse & Calibrate/i });
    await waitFor(() => {
      expect(extractBtn).toBeEnabled();
    });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(screen.getByText(/AI provider connection timeout/i)).toBeInTheDocument();
    });
  });

  it('4. Switching active farm switches displayed soil values', async () => {
    // Farm 101 has card with N=280
    // Farm 202 has card with N=190
    const getLatestSpy = vi.spyOn(soilCardApi, 'getLatestSoilCard').mockImplementation(async (fId: number) => {
      if (fId === 101) {
        return {
          has_card: true,
          card: {
            id: 1,
            farm_id: 101,
            nitrogen_kg_ha: 280,
            phosphorus_kg_ha: 20,
            potassium_kg_ha: 300,
            ph: 7.2,
            organic_carbon_pct: 0.5,
            electrical_conductivity_ds_m: 0.4,
            soil_texture: 'Sandy Clay Loam',
            source: 'photo read by AI',
            is_confirmed: true,
            created_at: '2026-11-14T00:00:00Z',
          },
        };
      } else {
        return {
          has_card: true,
          card: {
            id: 2,
            farm_id: 202,
            nitrogen_kg_ha: 190,
            phosphorus_kg_ha: 15,
            potassium_kg_ha: 210,
            ph: 6.5,
            organic_carbon_pct: 0.4,
            electrical_conductivity_ds_m: 0.3,
            soil_texture: 'Red Sandy Loam',
            source: 'typed by farmer',
            is_confirmed: true,
            created_at: '2026-11-15T00:00:00Z',
          },
        };
      }
    });

    const { rerender } = renderComponent();

    // Farm 101 is loaded first
    await waitFor(() => {
      expect(getLatestSpy).toHaveBeenCalledWith(101);
      expect(screen.getByText('280')).toBeInTheDocument();
    });

    // Switch active farm to 202
    mockActiveFarm = {
      id: 202,
      name: 'Farm Beta',
      village: 'Dharmasagar',
      district: 'Warangal',
      state: 'Telangana',
    };

    rerender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <SchemesPage />
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getLatestSpy).toHaveBeenCalledWith(202);
      expect(screen.getByText('190')).toBeInTheDocument();
    });
  });
});
