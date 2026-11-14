import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  X,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
  Compass,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePictorial } from '../../context/PictorialContext';
import { queryVoiceAssistant, VoiceQueryResponse } from '../../api/voice';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startSpeechRecognition,
  speakText,
  getAvailableVoices,
  loadVoices,
  findVoicesForLanguage,
  findVoiceForLanguage,
  SupportedLanguage,
  LANGUAGE_LOCALE_MAP,
  LANGUAGE_DISPLAY_NAMES,
} from '../../services/speech';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseData?: VoiceQueryResponse;
}

export const VoiceAssistant: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { setTheme } = useTheme();
  const { setPictorial } = usePictorial();
  const navigate = useNavigate();
  const currentLang = (language as SupportedLanguage) || 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Assistant operational mode: 'basic' or 'ai'
  const [assistantMode, setAssistantMode] = useState<'basic' | 'ai'>('basic');
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null);

  // Capability & voice states
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [synthesisSupported, setSynthesisSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [voiceAvailableForLang, setVoiceAvailableForLang] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [matchingVoices, setMatchingVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [missingVoiceNotice, setMissingVoiceNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRecognizerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  // Capability detection & voiceschanged handler
  useEffect(() => {
    const hasRec = isSpeechRecognitionSupported();
    const hasSyn = isSpeechSynthesisSupported();
    setRecognitionSupported(hasRec);
    setSynthesisSupported(hasSyn);

    if (hasSyn) {
      const updateVoices = () => {
        const voices = getAvailableVoices();
        setAvailableVoices(voices);
        const matched = findVoicesForLanguage(currentLang, voices);
        setMatchingVoices(matched);
        const defaultVoice = findVoiceForLanguage(currentLang, voices);
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          setVoiceAvailableForLang(true);
        } else {
          setSelectedVoiceName('');
          setVoiceAvailableForLang(currentLang === 'en');
        }
      };

      updateVoices();
      loadVoices().then(updateVoices);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
        return () => {
          window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        };
      }
    }
  }, [currentLang]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isLoading]);

  // Clean up speech recognition & synthesis when unmounting
  useEffect(() => {
    return () => {
      if (activeRecognizerRef.current) {
        activeRecognizerRef.current.abort();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleActionDispatch = (res: VoiceQueryResponse) => {
    if (!res.action_type) return;

    if (res.action_type === 'navigate' && res.action_link) {
      // Delay slightly so the user sees the confirmation chip in chat
      setTimeout(() => {
        navigate(res.action_link!);
      }, 600);
    } else if (res.action_type === 'start_tour') {
      window.dispatchEvent(new CustomEvent('agrisage:start-tour'));
    } else if (res.action_type === 'set_lang:te') {
      setLanguage('te');
    } else if (res.action_type === 'set_lang:hi') {
      setLanguage('hi');
    } else if (res.action_type === 'set_lang:en') {
      setLanguage('en');
    } else if (res.action_type === 'set_theme:dark') {
      setTheme('dark');
    } else if (res.action_type === 'set_theme:light') {
      setTheme('light');
    } else if (res.action_type === 'set_pictorial:true') {
      setPictorial(true);
    } else if (res.action_type === 'set_pictorial:false') {
      setPictorial(false);
    }
  };

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isLoading) return;

    setMissingVoiceNotice(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setInterimTranscript('');
    setIsLoading(true);

    try {
      const res = await queryVoiceAssistant({
        query: text,
        language: currentLang,
      });

      if (res.mode === 'ai') {
        setAssistantMode('ai');
        setPrivacyNotice(res.privacy_notice || 'Farm context is securely sent to Google to generate tailored answers.');
      } else {
        setAssistantMode('basic');
        setPrivacyNotice(null);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.spoken_text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseData: res,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute in-app navigation or settings action if detected
      handleActionDispatch(res);

      // Automatically speak the response if speech synthesis is supported
      if (synthesisSupported && res.spoken_text) {
        playTTS(assistantMsg.id, res.spoken_text);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, unable to process your voice query. Please verify network connectivity or sign in again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (!recognitionSupported) {
      return;
    }

    // Cancel any playing speech before recording
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
    }

    setMicPermissionDenied(false);
    setInterimTranscript('');
    setIsListening(true);

    const recognizer = startSpeechRecognition({
      lang: currentLang,
      onTranscript: (transcript, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          setInterimTranscript('');
          handleSendQuery(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (errType) => {
        setIsListening(false);
        setInterimTranscript('');
        if (errType === 'not-allowed') {
          setMicPermissionDenied(true);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    activeRecognizerRef.current = recognizer;
  };

  const stopListening = () => {
    if (activeRecognizerRef.current) {
      activeRecognizerRef.current.stop();
      activeRecognizerRef.current = null;
    }
    setIsListening(false);
  };

  const playTTS = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
      return;
    }

    // Honest Telugu/Hindi voice validation: never read Telugu/Hindi with an English voice
    if (!voiceAvailableForLang && currentLang !== 'en') {
      const notice = currentLang === 'te'
        ? 'ఈ పరికరంలో తెలుగు వాయిస్ ప్యాక్ లేదు. ఆడియో వినడానికి Windows Telugu Speech Pack లేదా Edge బ్రౌజర్ ఉపయోగించండి.'
        : 'इस डिवाइस पर हिन्दी वॉयस पैक नहीं है। ऑडियो के लिए Windows Hindi Speech Pack या Edge ब्राउज़र का उपयोग करें।';
      setMissingVoiceNotice(notice);
      return;
    }

    setCurrentlySpeakingId(msgId);
    const chosenVoice = availableVoices.find((v) => v.name === selectedVoiceName) || null;
    speakText(text, currentLang, {
      customVoice: chosenVoice,
      onEnd: () => setCurrentlySpeakingId(null),
      onError: () => setCurrentlySpeakingId(null),
    });
  };

  const clearHistory = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
    setMessages([]);
    setMissingVoiceNotice(null);
  };

  const quickChips = [
    { label: t('voice.chip_weather'), query: currentLang === 'te' ? 'ఈరోజు వర్షం పడుతుందా?' : currentLang === 'hi' ? 'क्या आज बारिश होगी?' : 'Will it rain today?' },
    { label: t('voice.chip_irrigation'), query: currentLang === 'te' ? 'ఈరోజు నా పంటకు నీరు పెట్టాలా?' : currentLang === 'hi' ? 'क्या आज फसल को पानी देना चाहिए?' : 'Should I irrigate my crop today?' },
    { label: t('voice.chip_disease'), query: currentLang === 'te' ? 'ఆకు తెగులు ఎలా గుర్తించాలి?' : currentLang === 'hi' ? 'पत्ती रोग की पहचान कैसे करें?' : 'How to diagnose crop leaf disease?' },
    { label: t('voice.chip_cost'), query: currentLang === 'te' ? 'ఎకరాకు పత్తి సాగు ఖర్చు ఎంత?' : currentLang === 'hi' ? 'प्रति एकड़ कपास खेती लागत कितनी है?' : 'What is the cultivation cost per acre for cotton?' },
    { label: t('voice.chip_scheme'), query: currentLang === 'te' ? 'ప్రభుత్వ వ్యవసాయ పథకాల వివరాలు ఏమిటి?' : currentLang === 'hi' ? 'सरकारी कृषि योजनाओं की क्या जानकारी है?' : 'What government agriculture schemes are available?' },
    { label: t('voice.chip_price'), query: currentLang === 'te' ? 'పత్తి మార్కెట్ ధర ఎంత?' : currentLang === 'hi' ? 'कपास का मंडी भाव क्या है?' : 'What is the cotton mandi price today?' },
  ];

  return (
    <>
      {/* 1. Global Floating Voice Button (FAB) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`pointer-events-auto relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-agri-green-500/50 ${
          isOpen
            ? 'bg-stone-800 text-white rotate-90 scale-105'
            : isListening
            ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400'
            : currentlySpeakingId
            ? 'bg-amber-600 text-white ring-4 ring-amber-400 animate-bounce'
            : 'bg-agri-green-700 hover:bg-agri-green-800 text-white hover:scale-110 active:scale-95'
        }`}
        aria-label={t('voice.fab_label')}
        title={t('voice.fab_label')}
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : isListening ? (
          <Mic className="w-7 h-7 animate-pulse" />
        ) : currentlySpeakingId ? (
          <Volume2 className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}

        {/* Pulse ring when listening */}
        {isListening && (
          <span className="absolute -inset-1 rounded-full bg-rose-500 opacity-75 animate-ping pointer-events-none" />
        )}
      </button>

      {/* 2. Slide-out Voice Assistant Drawer / Modal */}
      {isOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-label={t('voice.panel_title')}
        >
          <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#121A15] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-stone-200 dark:border-stone-800 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-agri-green-900 to-agri-green-800 dark:from-[#0E1B13] dark:to-[#172E21] text-white border-b border-agri-green-700/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-agri-green-200" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white tracking-tight">{t('voice.panel_title')}</h2>
                    <span
                      className="px-2 py-0.5 text-[11px] font-semibold bg-white/15 text-white rounded-full border border-white/20"
                      title={LANGUAGE_DISPLAY_NAMES[currentLang]}
                    >
                      {LANGUAGE_LOCALE_MAP[currentLang]}
                    </span>
                  </div>
                  {/* Status chip: AI connected vs Basic mode */}
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {assistantMode === 'ai' ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>AI connected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-stone-300 bg-stone-800/80 px-2 py-0.5 rounded-full border border-stone-600/50">
                        <Info className="w-3 h-3 text-stone-300" />
                        <span>Basic mode (no AI key)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {synthesisSupported && matchingVoices.length > 0 && (
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="bg-agri-green-950/80 text-white text-[11px] font-medium rounded-lg px-2 py-1 border border-agri-green-600 focus:ring-1 focus:ring-white max-w-[130px] truncate"
                    title="Select voice"
                    aria-label="Voice picker"
                  >
                    {matchingVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title={t('voice.clear_history')}
                    aria-label={t('voice.clear_history')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={t('voice.close_panel')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Privacy notice banner (only when AI connected) */}
            {assistantMode === 'ai' && privacyNotice && (
              <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                <span>{privacyNotice}</span>
              </div>
            )}

            {/* Telugu Voice Missing Guidance Card */}
            {currentLang === 'te' && !voiceAvailableForLang && (
              <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-amber-950 dark:text-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>తెలుగు వాయిస్ ప్యాక్ లేదు (Telugu voice not installed on this device)</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  ఈ పరికరంలో సహజమైన తెలుగు ఆడియో వినడానికి Windows Settings &gt; Time &amp; Language &gt; Speech లో "Telugu Speech Pack" ఇన్‌స్టాల్ చేయండి లేదా Microsoft Edge బ్రౌజర్ ఉపయోగించండి. సమాధానాలు స్క్రీన్ పై స్పష్టంగా కనిపిస్తాయి.
                </p>
              </div>
            )}

            {/* General Capability Advisories */}
            {(!recognitionSupported || micPermissionDenied) && (
              <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {!recognitionSupported && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('voice.mic_unsupported_title')}</p>
                      <p className="text-[11px]">{t('voice.mic_unsupported_desc')}</p>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px] font-medium">{t('voice.browser_recommendation')}</p>
                    </div>
                  </div>
                )}

                {recognitionSupported && micPermissionDenied && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-800 dark:text-rose-300">{t('voice.mic_denied_title')}</p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-400">{t('voice.mic_denied_desc')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ephemeral Notice for Missing Voice */}
            {missingVoiceNotice && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{missingVoiceNotice}</span>
                </div>
                <button
                  onClick={() => setMissingVoiceNotice(null)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Conversation Transcript Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-stone-50 dark:bg-[#0D1410]">
              {messages.length === 0 ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-agri-green-100 dark:bg-agri-green-950/60 flex items-center justify-center text-agri-green-800 dark:text-agri-green-300 shadow-inner">
                    <Mic className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                      {currentLang === 'te'
                        ? 'వ్యవసాయ ప్రశ్నను మాట్లాడండి లేదా టైప్ చేయండి'
                        : currentLang === 'hi'
                        ? 'कृषि प्रश्न बोलें या टाइप करें'
                        : 'Ask your farming questions by voice or text'}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                      {t('voice.browser_recommendation')}
                    </p>
                  </div>

                  {/* Navigation Commands Help Notice */}
                  <div className="bg-white dark:bg-[#15211B] border border-stone-200 dark:border-stone-800 rounded-xl p-3 max-w-md mx-auto text-left shadow-sm">
                    <p className="text-xs font-semibold text-agri-green-800 dark:text-agri-green-300 flex items-center space-x-1 mb-1">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Instant Voice Commands</span>
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Try saying: <span className="font-medium text-stone-900 dark:text-stone-200">"open irrigation"</span>, <span className="font-medium text-stone-900 dark:text-stone-200">"take me to market"</span>, <span className="font-medium text-stone-900 dark:text-stone-200">"switch to Telugu"</span>, <span className="font-medium text-stone-900 dark:text-stone-200">"turn on dark mode"</span>, or <span className="font-medium text-stone-900 dark:text-stone-200">"start the tour"</span>.
                    </p>
                  </div>

                  {/* Quick Suggestions Chips */}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">{t('voice.quick_chips_title')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendQuery(chip.query)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1A2620] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-agri-green-600 hover:text-agri-green-800 dark:hover:text-agri-green-300 hover:bg-agri-green-50 dark:hover:bg-agri-green-950/40 shadow-sm transition-all"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-agri-green-700 text-white rounded-br-none'
                          : 'bg-white dark:bg-[#17241D] text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-bl-none'
                      }`}
                    >
                      {/* Action confirmation chip if present */}
                      {msg.responseData?.confirmation_chip && (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 mb-2 rounded-full text-xs font-medium bg-agri-green-100 text-agri-green-900 dark:bg-agri-green-950 dark:text-agri-green-300 border border-agri-green-300 dark:border-agri-green-800">
                          <Check className="w-3 h-3 text-agri-green-700 dark:text-agri-green-400" />
                          <span>{msg.responseData.confirmation_chip}</span>
                        </div>
                      )}

                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* Assistant Response Actions & Badges */}
                      {msg.role === 'assistant' && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {synthesisSupported && (
                              <button
                                onClick={() => playTTS(msg.id, msg.text)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  currentlySpeakingId === msg.id
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                    : 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                                }`}
                              >
                                {currentlySpeakingId === msg.id ? (
                                  <>
                                    <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                    <span>{t('voice.stop_speaking')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5 text-agri-green-700 dark:text-agri-green-400" />
                                    <span>{t('voice.read_aloud')}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {msg.responseData?.action_link && (
                              <Link
                                to={msg.responseData.action_link}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-agri-green-50 text-agri-green-800 dark:bg-agri-green-950/60 dark:text-agri-green-300 border border-agri-green-200 dark:border-agri-green-800 hover:bg-agri-green-100 dark:hover:bg-agri-green-900/50 transition-colors"
                              >
                                <span>{msg.responseData.action_label || 'View in Farm Portal'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}

                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{t('voice.safety_badge')}</span>
                            </span>
                          </div>

                          {/* Explainability & Upstream Telemetry Footer */}
                          {msg.responseData && (
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 space-y-0.5">
                              {msg.responseData.upstream_status && (
                                <p className="text-amber-800 dark:text-amber-300 font-medium">
                                  Status: {msg.responseData.upstream_status}
                                </p>
                              )}
                              <p>
                                <span className="font-semibold">{t('voice.source_label')}:</span>{' '}
                                {msg.responseData.sources.join(', ')}
                              </p>
                              <p>
                                <span className="font-semibold">{t('voice.confidence_label')}:</span>{' '}
                                {Math.round(msg.responseData.confidence * 100)}% ({msg.responseData.confidence_type})
                              </p>
                            </div>
                          )}

                          {/* Tappable Suggestion Chips */}
                          {msg.responseData?.suggestion_chips && msg.responseData.suggestion_chips.length > 0 && (
                            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5">
                              {msg.responseData.suggestion_chips.map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSendQuery(chip)}
                                  className="text-[11px] font-medium bg-[#F6F3EC] dark:bg-[#1E2E25] hover:bg-[#EAE4D7] dark:hover:bg-[#25392E] text-stone-800 dark:text-stone-200 border border-stone-300/60 dark:border-stone-700 px-2.5 py-1 rounded-full transition-all hover:scale-[1.02] active:scale-95 text-left"
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))
              )}

              {/* Interim Real-Time Speech Recognition Transcript */}
              {isListening && interimTranscript && (
                <div className="flex flex-col items-end animate-pulse">
                  <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-agri-green-700 text-white shadow-sm opacity-90">
                    <p className="text-sm italic">{interimTranscript} ...</p>
                  </div>
                  <span className="text-[10px] text-agri-green-700 dark:text-agri-green-400 mt-1 font-medium">
                    {t('voice.listening_status')}
                  </span>
                </div>
              )}

              {/* Animated Thinking Skeleton */}
              {isLoading && (
                <div className="flex items-center space-x-2 text-stone-600 dark:text-stone-300 text-xs py-2 px-3 bg-white dark:bg-[#17241D] border border-stone-200 dark:border-stone-800 rounded-xl w-fit shadow-sm animate-pulse">
                  <Sparkles className="w-4 h-4 text-agri-green-600 dark:text-agri-green-400 animate-spin" />
                  <span className="font-medium">
                    {assistantMode === 'ai' ? 'Thinking... analyzing real farm telemetry with Gemini' : 'Analyzing farm telemetry...'}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Listening Live Status Bar */}
            {isListening && (
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-bold">{t('voice.listening_status')}</span>
                </div>
                <button
                  onClick={stopListening}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  {t('voice.stop_listening')}
                </button>
              </div>
            )}

            {/* Input Controls (Mic + Typed Input Fallback) */}
            <div className="p-3 sm:p-4 bg-white dark:bg-[#121A15] border-t border-stone-200 dark:border-stone-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery(inputText);
                }}
                className="flex items-center space-x-2"
              >
                {/* Large Tactile Microphone Button */}
                <button
                  type="button"
                  onClick={startListening}
                  disabled={!recognitionSupported || micPermissionDenied}
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    !recognitionSupported || micPermissionDenied
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                      : isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                      : 'bg-agri-green-700 hover:bg-agri-green-800 text-white shadow-md active:scale-95'
                  }`}
                  aria-label={isListening ? t('voice.stop_listening') : t('voice.start_listening')}
                  title={
                    !recognitionSupported
                      ? t('voice.mic_unsupported_title')
                      : micPermissionDenied
                      ? t('voice.mic_denied_title')
                      : isListening
                      ? t('voice.stop_listening')
                      : t('voice.start_listening')
                  }
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Typed Fallback Input Box */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('voice.input_placeholder')}
                  className="flex-1 px-4 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-agri-green-500 focus:border-transparent text-sm bg-stone-50 dark:bg-[#1B2720] text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-[#1B2720] transition-all"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="flex-shrink-0 w-11 h-11 rounded-full bg-agri-green-700 hover:bg-agri-green-800 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                  aria-label={t('voice.send_btn')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
