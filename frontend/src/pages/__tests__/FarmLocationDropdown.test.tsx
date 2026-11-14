import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';
import { AuthProvider } from '../../context/AuthContext';
import { FarmRegistrationPage } from '../FarmRegistrationPage';
import { farmsApi } from '../../api/farms';
import { Farm } from '../../types/api';

vi.mock('../../api/farms');

const mockExistingFarm: Farm = {
  id: 42,
  user_id: 1,
  name: 'Demo Warangal Holding',
  area: 5.0,
  ownership_type: 'owned',
  owned_area: 5.0,
  leased_area: 0.0,
  lease_amount: 0,
  soil_type: 'Black Cotton',
  water_source: 'Canal',
  irrigation_method: 'drip',
  village: 'Dharmasagar',
  district: 'Warangal',
  state: 'Telangana',
  latitude: 17.9689,
  longitude: 79.5941,
  budget: 40000,
  created_at: '2026-08-15T00:00:00Z',
  current_crop_cycles: [],
};

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <PictorialProvider>
            <AuthProvider>
              <FarmRegistrationPage />
            </AuthProvider>
          </PictorialProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Phase 5: State & District Cascading Dropdowns with Verified Coordinates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('agrisage_pictorial_mode', 'words');
    vi.mocked(farmsApi.getFarms).mockResolvedValue([mockExistingFarm]);
    vi.mocked(farmsApi.createFarm).mockResolvedValue({
      ...mockExistingFarm,
      id: 43,
      name: 'New Registered Farm',
    });
    vi.mocked(farmsApi.updateFarm).mockResolvedValue(mockExistingFarm);
  });

  it('renders Step 3 with State and District dropdowns and read-only coordinates with approximate label', async () => {
    renderWithProviders();

    // Directly click Step 3 tab in wizard
    const step3Btn = await screen.findByRole('button', { name: /3\. Location & GPS/i });
    fireEvent.click(step3Btn);

    // Verify State select and District select are present
    const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
    const districtSelect = screen.getByLabelText(/district/i) as HTMLSelectElement;
    expect(stateSelect).toBeInTheDocument();
    expect(districtSelect).toBeInTheDocument();

    // Verify default state is Telangana and default district is Warangal
    expect(stateSelect.value).toBe('Telangana');
    expect(districtSelect.value).toBe('Warangal');

    // Verify coordinates are read-only and marked with approximate district centre
    const latInput = screen.getByLabelText(/latitude/i) as HTMLInputElement;
    const lonInput = screen.getByLabelText(/longitude/i) as HTMLInputElement;

    expect(latInput).toHaveAttribute('readonly');
    expect(lonInput).toHaveAttribute('readonly');
    expect(parseFloat(latInput.value)).toBeCloseTo(17.9689, 2);
    expect(parseFloat(lonInput.value)).toBeCloseTo(79.5941, 2);

    // Check for "approximate district centre" label
    const approxBadges = screen.getAllByText(/approximate district centre/i);
    expect(approxBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('changing state resets district to the first district of the new state and updates coordinates', async () => {
    renderWithProviders();

    // Jump to Step 3
    fireEvent.click(await screen.findByRole('button', { name: /3\. Location & GPS/i }));

    const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
    const districtSelect = screen.getByLabelText(/district/i) as HTMLSelectElement;
    const latInput = screen.getByLabelText(/latitude/i) as HTMLInputElement;
    const lonInput = screen.getByLabelText(/longitude/i) as HTMLInputElement;

    // Change state to Andhra Pradesh
    fireEvent.change(stateSelect, { target: { value: 'Andhra Pradesh' } });

    expect(stateSelect.value).toBe('Andhra Pradesh');
    // First district in Andhra Pradesh dataset
    expect(districtSelect.value).toBe('Alluri Sitharama Raju');

    // Coordinates update automatically for Alluri Sitharama Raju (lat: ~17.8226, lon: ~82.2722)
    expect(parseFloat(latInput.value)).toBeCloseTo(17.8226, 2);
    expect(parseFloat(lonInput.value)).toBeCloseTo(82.2722, 2);
  });

  it('selecting a specific district updates coordinates automatically and preserves them in submission payload', async () => {
    renderWithProviders();

    // Jump to Step 3
    fireEvent.click(await screen.findByRole('button', { name: /3\. Location & GPS/i }));

    const stateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
    const districtSelect = screen.getByLabelText(/district/i) as HTMLSelectElement;
    const latInput = screen.getByLabelText(/latitude/i) as HTMLInputElement;
    const lonInput = screen.getByLabelText(/longitude/i) as HTMLInputElement;

    // Select Telangana -> Karimnagar
    fireEvent.change(stateSelect, { target: { value: 'Telangana' } });
    fireEvent.change(districtSelect, { target: { value: 'Karimnagar' } });

    expect(districtSelect.value).toBe('Karimnagar');
    // Centroid of Karimnagar (~18.43, ~79.13)
    expect(parseFloat(latInput.value)).toBeGreaterThan(18.0);
    expect(parseFloat(lonInput.value)).toBeGreaterThan(78.5);

    // Submit farm registration
    const submitBtn = screen.getByRole('button', { name: /save & register holding/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(farmsApi.createFarm).toHaveBeenCalledTimes(1);
    });

    const calledPayload = vi.mocked(farmsApi.createFarm).mock.calls[0][0];
    expect(calledPayload.state).toBe('Telangana');
    expect(calledPayload.district).toBe('Karimnagar');
    expect(calledPayload.latitude).toBe(parseFloat(latInput.value));
    expect(calledPayload.longitude).toBe(parseFloat(lonInput.value));
  });

  it('existing farm holdings display saved coordinates unchanged and allow editing via modal', async () => {
    renderWithProviders();

    // Switch to Holdings tab
    const holdingsTabBtn = await screen.findByRole('button', { name: /registered holdings/i });
    fireEvent.click(holdingsTabBtn);

    // Existing farm card should render with original coordinates
    expect(await screen.findByText('Demo Warangal Holding')).toBeInTheDocument();
    expect(screen.getByText(/17.97, 79.59/)).toBeInTheDocument();

    // Click Edit Parcel button
    const editBtn = screen.getByRole('button', { name: /edit parcel/i });
    fireEvent.click(editBtn);

    // Modal opens with existing values
    expect(screen.getByText('Edit Farm Parcel')).toBeInTheDocument();
    const editStateSelect = screen.getByLabelText(/state/i) as HTMLSelectElement;
    const editDistrictSelect = screen.getByLabelText(/district/i) as HTMLSelectElement;
    expect(editStateSelect.value).toBe('Telangana');
    expect(editDistrictSelect.value).toBe('Warangal');

    // Change district in edit modal to Khammam
    fireEvent.change(editDistrictSelect, { target: { value: 'Khammam' } });
    expect(editDistrictSelect.value).toBe('Khammam');

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(farmsApi.updateFarm).toHaveBeenCalledWith(42, expect.objectContaining({
        state: 'Telangana',
        district: 'Khammam',
      }));
    });
  });
});
