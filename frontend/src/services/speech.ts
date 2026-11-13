/**
 * AgriSage AI — Speech Recognition (STT) & Speech Synthesis (TTS) Service
 * Web Speech API with multilingual support for en-IN, te-IN, hi-IN
 */

export type SupportedLanguage = 'en' | 'te' | 'hi';

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  en: 'English (India)',
  te: 'తెలుగు (Telugu)',
  hi: 'हिन्दी (Hindi)',
};

/**
 * Checks if Web Speech Recognition is available in current browser environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Checks if Web Speech Synthesis is available in current browser environment.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Returns available synthesis voices.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Finds best-matching voice for language preference (e.g. te-IN > te > default).
 */
export function findVoiceForLanguage(
  lang: SupportedLanguage,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const targetCode = LANGUAGE_LOCALE_MAP[lang].toLowerCase(); // e.g. "te-in"
  const prefix = lang.toLowerCase(); // e.g. "te"

  // 1. Exact locale match (e.g. te-IN)
  const exact = voices.find((v) => v.lang.toLowerCase() === targetCode || v.lang.toLowerCase().replace('_', '-') === targetCode);
  if (exact) return exact;

  // 2. Language prefix match (e.g. te)
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // 3. Fallback for English only if language is English
  if (lang === 'en') {
    const enFallback = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (enFallback) return enFallback;
  }

  return null;
}

/**
 * Reads aloud text via SpeechSynthesis with preferred voice matching.
 */
export function speakText(
  text: string,
  lang: SupportedLanguage,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { cancel: () => void; voiceFound: boolean; voiceName?: string } {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error('SpeechSynthesis not supported in this browser environment.'));
    return { cancel: () => {}, voiceFound: false };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = findVoiceForLanguage(lang, voices);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGE_LOCALE_MAP[lang];
  utterance.rate = 0.95; // Slightly slower for clarity in rural agriculture advisory
  utterance.pitch = 1.0;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (e) => options?.onError?.(e);

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => window.speechSynthesis.cancel(),
    voiceFound: selectedVoice !== null,
    voiceName: selectedVoice?.name,
  };
}

/**
 * Initializes and starts Web Speech Recognition for voice queries.
 */
export function startSpeechRecognition(options: {
  lang: SupportedLanguage;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorType: 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'other', message: string) => void;
  onEnd: () => void;
}): { stop: () => void; abort: () => void } {
  if (!isSpeechRecognitionSupported()) {
    options.onError('unsupported', 'Speech recognition is not supported in this browser. Please use typed input.');
    return { stop: () => {}, abort: () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new SpeechRecognitionConstructor();

  recognition.lang = LANGUAGE_LOCALE_MAP[options.lang];
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const trans = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += trans;
      } else {
        interim += trans;
      }
    }

    if (final) {
      options.onTranscript(final.trim(), true);
    } else if (interim) {
      options.onTranscript(interim.trim(), false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    const err = event.error || 'other';
    let userMsg = 'An error occurred during speech recognition.';
    if (err === 'not-allowed' || err === 'permission-denied') {
      userMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings or use typed input.';
    } else if (err === 'no-speech') {
      userMsg = 'No speech was detected. Please tap the microphone and speak clearly.';
    } else if (err === 'network') {
      userMsg = 'Speech network connectivity issue. Please check your internet connection or use typed input.';
    }
    options.onError(err, userMsg);
  };

  recognition.onend = () => {
    options.onEnd();
  };

  try {
    recognition.start();
  } catch (err: any) {
    options.onError('other', err.message || 'Failed to start speech recognition.');
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Ignore if already stopped
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {
        // Ignore if already aborted
      }
    },
  };
}

