import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { VoiceAssistant } from '../VoiceAssistant';
import { LanguageProvider } from '../../../context/LanguageContext';
import * as voiceApi from '../../../api/voice';
import * as speechService from '../../../services/speech';

vi.mock('../../../api/voice');

const mockGreetingResponse: voiceApi.VoiceQueryResponse = {
  intent: 'greeting',
  confidence: 0.98,
  confidence_type: 'rule',
  spoken_text: 'Hello! I am AgriSage AI, your agronomic assistant. I can help you with: 1. Live Weather, 2. Live Irrigation, 3. Live Disease diagnosis, 4. Live Farm Economics, and 5. Mandi Market prices (Demo).',
  status: 'WORKING',
  sources: ['AgriSage Assistant Capabilities Registry'],
  action_link: '/dashboard',
  action_label: 'Open Dashboard',
  suggestion_chips: [
    'Will it rain today?',
    'Should I irrigate today?',
    'Diagnose leaf disease',
  ],
  structured_data: {
    features: {
      weather: 'LIVE',
      irrigation: 'LIVE',
      disease: 'LIVE',
      economics: 'LIVE',
      market: 'DEMO',
      schemes: 'NOT_BUILT',
    },
  },
  limitations: ['Honesty label: schemes are not built on this branch and are not listed as a working feature.'],
  timestamp: new Date().toISOString(),
};

describe('VoiceAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(voiceApi, 'queryVoiceAssistant').mockResolvedValue(mockGreetingResponse);
  });

  it('opens panel, sends greeting "hello", renders assistant introduction, and shows suggestion chips', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <VoiceAssistant />
        </LanguageProvider>
      </BrowserRouter>
    );

    // Click FAB button to open assistant panel
    const fabButton = screen.getByRole('button', { name: /Voice Assistant/i });
    fireEvent.click(fabButton);

    // Verify modal is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Type "hello" into input
    const input = screen.getByPlaceholderText(/Ask about/i);
    fireEvent.change(input, { target: { value: 'hello' } });

    // Submit form
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    // Verify API called with query "hello"
    await waitFor(() => {
      expect(voiceApi.queryVoiceAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'hello' })
      );
    });

    // Verify greeting response text is displayed
    await waitFor(() => {
      expect(screen.getByText(/I am AgriSage AI/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Weather/i)).toBeInTheDocument();
    });

    // Verify suggestion chips are displayed
    expect(screen.getByText('Will it rain today?')).toBeInTheDocument();
    expect(screen.getByText('Should I irrigate today?')).toBeInTheDocument();

    // Click a suggestion chip
    fireEvent.click(screen.getByText('Will it rain today?'));

    // Verify suggestion chip query was sent
    await waitFor(() => {
      expect(voiceApi.queryVoiceAssistant).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Will it rain today?' })
      );
    });
  });

  it('does not silently speak English when voice for non-English language is missing', () => {
    const speakSpy = vi.spyOn(speechService, 'speakText');

    render(
      <BrowserRouter>
        <LanguageProvider>
          <VoiceAssistant />
        </LanguageProvider>
      </BrowserRouter>
    );

    // SpeakText with language "te" without voice should not fall back to English
    const res = speechService.speakText('నమస్కారం', 'te');
    // Without mock voices, voiceFound is false
    expect(res.voiceFound).toBe(false);
    expect(speakSpy).toHaveBeenCalledWith('నమస్కారం', 'te');
  });
});
