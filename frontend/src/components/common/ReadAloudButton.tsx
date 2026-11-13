import React, { useState } from 'react';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import {
  speakText,
  isSpeechSynthesisSupported,
  findVoiceForLanguage,
  loadVoices,
  SupportedLanguage,
} from '../../services/speech';
import { useTranslation } from '../../context/LanguageContext';

interface ReadAloudButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  className = '',
  label,
}) => {
  const { language, t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<{ cancel: () => void } | null>(null);

  const handleSpeak = async () => {
    if (isPlaying && currentSpeech) {
      currentSpeech.cancel();
      setIsPlaying(false);
      setCurrentSpeech(null);
      return;
    }

    if (!isSpeechSynthesisSupported()) {
      setWarning(t('voice.tts_unsupported', { defaultValue: 'Voice playback is not supported in this browser.' }));
      setTimeout(() => setWarning(null), 4000);
      return;
    }

    const voices = await loadVoices();
    const voice = findVoiceForLanguage(language as SupportedLanguage, voices);

    if (!voice && language !== 'en') {
      const langName = language === 'te' ? 'Telugu' : 'Hindi';
      setWarning(`Voice pack for ${langName} is not installed on your device. Audio cannot be read in the wrong language.`);
      setTimeout(() => setWarning(null), 5000);
      return;
    }

    const speech = speakText(text, language as SupportedLanguage, {
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
        setCurrentSpeech(null);
      },
      onError: () => {
        setIsPlaying(false);
        setCurrentSpeech(null);
      },
    });

    setCurrentSpeech(speech);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSpeak}
        aria-label={isPlaying ? 'Stop read-aloud' : (label || 'Read aloud in current language')}
        title={isPlaying ? 'Stop read-aloud' : (label || 'Listen to this explanation')}
        className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
          isPlaying
            ? 'bg-[#DA9A4C] text-[#0E241B] border-[#DA9A4C] animate-pulse'
            : 'bg-[#FAF8F5] text-[#183D2E] border-[#7A553A]/25 hover:bg-[#EFE7DE] hover:border-[#183D2E]/40'
        } ${className}`}
      >
        {isPlaying ? (
          <>
            <VolumeX className="w-5 h-5 text-[#0E241B]" />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-[#183D2E]" />
            <span className="hidden sm:inline">{label || 'Listen'}</span>
          </>
        )}
      </button>

      {warning && (
        <div
          role="alert"
          className="absolute left-0 top-full mt-2 z-50 w-72 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl shadow-lg text-xs leading-relaxed animate-fadeIn flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>{warning}</div>
        </div>
      )}
    </div>
  );
};
