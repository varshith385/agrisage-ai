import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { ActiveFarmBanner } from '../../components/common/ActiveFarmBanner';
import { farmsApi } from '../../api/farms';
import { Farm } from '../../types/api';

vi.mock('../../api/farms');

const mockFarmA: Farm = {
  id: 101,
  user_id: 1,
  name: 'Rameshwaram Holding',
  area: 5.0,
  ownership_type: 'mixed',
  owned_area: 3.0,
  leased_area: 2.0,
  lease_amount: 10000,
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

const mockFarmB: Farm = {
  id: 102,
  user_id: 1,
  name: 'Krishna Valley Farm',
  area: 8.0,
  ownership_type: 'owned',
  owned_area: 8.0,
  leased_area: 0.0,
  lease_amount: 0,
  soil_type: 'Red Loam',
  water_source: 'Canal',
  irrigation_method: 'sprinkler',
  village: 'Dharmasagar',
  district: 'Warangal',
  state: 'Telangana',
  latitude: 18.05,
  longitude: 79.45,
  budget: 90000,
  created_at: '2026-08-20T00:00:00Z',
  current_crop_cycles: [
    {
      id: 2,
      crop_name: 'Rice',
      variety: 'BPT 5204',
      planting_date: '2026-08-01',
      current_stage: 'vegetative',
      is_active: true,
      created_at: '2026-08-20T00:00:00Z',
    },
  ],
};

describe('BUG 3: Global Farm State & Synchronization Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('agrisage_token', 'mock_jwt_token');
    localStorage.setItem(
      'agrisage_user',
      JSON.stringify({
        id: 1,
        email: 'ramesh@example.com',
        full_name: 'Ramesh Kumar',
        role: 'Farmer',
        preferred_language: 'en',
      })
    );

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.spyOn(farmsApi, 'getFarms').mockResolvedValue([mockFarmA, mockFarmB]);
    vi.spyOn(farmsApi, 'getFarmById').mockImplementation(async (id: number) => {
      if (id === 101) return mockFarmA;
      if (id === 102) return mockFarmB;
      throw new Error('Farm not found');
    });
  });

  it('renders active farm holding in banner and synchronizes across switcher and reload', async () => {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <ActiveFarmBanner />
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Initial load: defaults to Farm A
    await waitFor(() => {
      expect(screen.getByText('Rameshwaram Holding')).toBeInTheDocument();
      expect(screen.getAllByText(/Geikonda/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Cotton/i)).toBeInTheDocument();
    });

    // Switch farm to Farm B using the selector dropdown
    const select = screen.getByRole('combobox', { name: /switch farm/i });
    fireEvent.change(select, { target: { value: '102' } });

    // Verify banner updates immediately to Farm B
    await waitFor(() => {
      expect(screen.getByText('Krishna Valley Farm')).toBeInTheDocument();
      expect(screen.getAllByText(/Dharmasagar/i).length).toBeGreaterThanOrEqual(1);
    });

    // Check that localStorage persisted the activeFarmId
    expect(localStorage.getItem('agrisage_active_farm_id')).toBe('102');

    // Simulate page hard refresh: unmount and remount component with persistent localStorage
    unmount();

    const freshQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={freshQueryClient}>
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <ActiveFarmBanner />
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // After refresh, Farm B is restored from localStorage and verified against query
    await waitFor(() => {
      expect(screen.getByText('Krishna Valley Farm')).toBeInTheDocument();
      expect(screen.getAllByText(/Dharmasagar/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
