import React, { useState } from 'react';
import { Volume2, VolumeX, AlertCircle, X } from 'lucide-react';
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
  const [voiceNotice, setVoiceNotice] = useState<{
    lang: string;
    isMissingVoice: boolean;
    message: string;
  } | null>(null);
  const [currentSpeech, setCurrentSpeech] = useState<{ cancel: () => void } | null>(null);

  const handleSpeak = async () => {
    if (isPlaying && currentSpeech) {
      currentSpeech.cancel();
      setIsPlaying(false);
      setCurrentSpeech(null);
      return;
    }

    if (!isSpeechSynthesisSupported()) {
      setVoiceNotice({
        lang: language,
        isMissingVoice: false,
        message: t('voice.tts_unsupported', { defaultValue: 'Speech synthesis is not supported in this browser.' }),
      });
      return;
    }

    const voices = await loadVoices();
    const voice = findVoiceForLanguage(language as SupportedLanguage, voices);

    if (!voice && language !== 'en') {
      const isTe = language === 'te';
      setVoiceNotice({
        lang: isTe ? 'Telugu' : 'Hindi',
        isMissingVoice: true,
        message: isTe
          ? 'Telugu (తెలుగు) speech voice is not installed in this browser. To enable audio: 1) In Windows Settings > Time & Language > Speech, install the Telugu speech voice pack, or 2) Open AgriSage AI in Microsoft Edge (which includes built-in Natural voices for Telugu). The text remains visible on screen.'
          : 'Hindi (हिन्दी) speech voice is not installed in this browser. To enable audio: 1) In Windows Settings > Time & Language > Speech, install the Hindi speech voice pack, or 2) Open AgriSage AI in Microsoft Edge. The text remains visible on screen.',
      });
      return;
    }

    setVoiceNotice(null);
    const speech = speakText(text, language as SupportedLanguage, {
      onStart: () => setIsPlaying(true),
      onEnd: () => {
        setIsPlaying(false);
        setCurrentSpeech(null);
      },
      onError: (err) => {
        setIsPlaying(false);
        setCurrentSpeech(null);
        if (String(err?.message || '').includes('NO_VOICE_FOR_LANG')) {
          setVoiceNotice({
            lang: language === 'te' ? 'Telugu' : 'Hindi',
            isMissingVoice: true,
            message: 'Browser voice pack not installed. Please add voice pack in Windows Speech settings or try Microsoft Edge.',
          });
        }
      },
    });

    setCurrentSpeech(speech);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSpeak}
        aria-label={isPlaying ? 'Stop browser voice playback' : (label || 'Listen to advisory text using browser voice')}
        title={isPlaying ? 'Stop voice playback' : (label || 'Listen to this explanation')}
        className={`min-h-[46px] px-3.5 py-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
          isPlaying
            ? 'bg-[#F2B01E] text-[#1F2A24] border-[#F2B01E] animate-pulse shadow-xs'
            : 'bg-white dark:bg-[#18241E] text-[#1B5E3B] dark:text-[#F2B01E] border-[#D9D4C7] dark:border-[#273B30] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-[#1B5E3B]/40'
        } ${className}`}
      >
        {isPlaying ? (
          <>
            <VolumeX className="w-4 h-4 text-[#1F2A24]" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
            <span>{label || 'Listen'}</span>
          </>
        )}
      </button>

      {/* Missing Voice How-To Dialog Card */}
      {voiceNotice && (
        <div
          role="alert"
          className="absolute left-0 bottom-full mb-2 z-50 w-80 sm:w-96 p-4 bg-white dark:bg-[#18241E] border-2 border-[#F2B01E] text-[#1F2A24] dark:text-[#F2F5F3] rounded-2xl shadow-xl text-xs leading-relaxed animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-[#9E5B00] dark:text-[#FBBF24]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Voice Setup Required ({voiceNotice.lang})</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[#4A5750] dark:text-[#9EB0A5] mb-2">{voiceNotice.message}</p>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
            <span>Honesty: Text never read in wrong accent.</span>
            <span className="font-semibold text-[#1B5E3B] dark:text-[#F2B01E]">AgriSage Speech</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadAloudButton;
