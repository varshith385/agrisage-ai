import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import { PictorialProvider } from '../../context/PictorialContext';
import { RemindersPage } from '../RemindersPage';
import * as remindersApi from '../../api/reminders';

vi.mock('../../api/reminders', async () => {
  const actual = await vi.importActual<typeof import('../../api/reminders')>('../../api/reminders');
  return {
    ...actual,
    getReminders: vi.fn(),
    createReminder: vi.fn(),
    updateReminder: vi.fn(),
    deleteReminder: vi.fn(),
    getReminderSuggestions: vi.fn(),
    downloadIcsCalendarFile: vi.fn(),
  };
});

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'farmer@example.com', full_name: 'Farmer Ramesh' },
    currentFarm: { id: 101, name: 'Cotton Parcel 1', area: 4.5 },
    isAuthenticated: true,
  }),
}));

describe('RemindersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);

    const mockReminders: remindersApi.Reminder[] = [
      {
        id: 1,
        user_id: 1,
        farm_id: 101,
        title: 'Irrigate South Drip Line',
        notes: 'Check soil moisture before starting pump',
        due_at: futureDate.toISOString(),
        repeat: 'weekly',
        status: 'pending',
        source: 'irrigation_plan',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockSuggestions: remindersApi.ReminderSuggestion[] = [
      {
        id: 'sugg-1',
        farm_id: 101,
        title: 'Irrigate in 2 days (water budget)',
        notes: 'FAO-56 water budget threshold reached',
        due_at: futureDate.toISOString(),
        repeat: 'none',
        source: 'irrigation_plan',
        reason: 'FAO-56 Water Balance',
        badge_label: 'Irrigation Plan',
      },
    ];

    (remindersApi.getReminders as any).mockResolvedValue(mockReminders);
    (remindersApi.getReminderSuggestions as any).mockResolvedValue(mockSuggestions);
  });

  it('renders tabs, reminders, and delivery limitation notice', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <PictorialProvider>
            <RemindersPage />
          </PictorialProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    // 1. Verify Header & Tabs
    expect(screen.getByText('Reminders & Field Alerts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overdue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();

    // 2. Verify Delivery limitation notice
    expect(screen.getByText(/Delivery Limitation Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Reminders trigger when you open the app or enable browser notifications/i)).toBeInTheDocument();

    // 3. Verify reminder item is rendered
    await waitFor(() => {
      expect(screen.getByText('Irrigate South Drip Line')).toBeInTheDocument();
    });

    // 4. Verify 1-tap suggestion is rendered
    expect(screen.getByText('Irrigate in 2 days (water budget)')).toBeInTheDocument();
  });

  it('allows adding a suggestion in 1-tap', async () => {
    (remindersApi.createReminder as any).mockResolvedValue({
      id: 2,
      user_id: 1,
      farm_id: 101,
      title: 'Irrigate in 2 days (water budget)',
      notes: 'FAO-56 water budget threshold reached',
      due_at: new Date().toISOString(),
      repeat: 'none',
      status: 'pending',
      source: 'irrigation_plan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <LanguageProvider>
          <PictorialProvider>
            <RemindersPage />
          </PictorialProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Irrigate in 2 days (water budget)')).toBeInTheDocument();
    });

    const addBtns = screen.getAllByText('Add to Reminders');
    fireEvent.click(addBtns[0]);

    await waitFor(() => {
      expect(remindersApi.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Irrigate in 2 days (water budget)',
        })
      );
    });
  });

  it('allows exporting to phone calendar (.ics)', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <PictorialProvider>
            <RemindersPage />
          </PictorialProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Irrigate South Drip Line')).toBeInTheDocument();
    });

    const calBtn = screen.getByLabelText('Add to Phone Calendar');
    fireEvent.click(calBtn);

    expect(remindersApi.downloadIcsCalendarFile).toHaveBeenCalled();
  });
});
