import React from 'react';
import { Image as ImageIcon, BookOpen, Volume2 } from 'lucide-react';
import { usePictorial } from '../../context/PictorialContext';
import { useTranslation } from '../../context/LanguageContext';
import { Language } from '../../types/api';
import { speakText, SupportedLanguage } from '../../services/speech';

export const ModeToggleHero: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isPictorial, setPictorial } = usePictorial();
  const { language, setLanguage } = useTranslation();

  const handleLanguageClick = (lang: Language) => {
    setLanguage(lang);
    if (lang === 'te') {
      speakText('నమస్కారం! అగ్రిసేజ్ కి స్వాగతం.', 'te' as SupportedLanguage);
    } else if (lang === 'hi') {
      speakText('नमस्ते! एग्रीसेज में आपका स्वागत है.', 'hi' as SupportedLanguage);
    } else {
      speakText('Welcome to AgriSage AI.', 'en' as SupportedLanguage);
    }
  };

  return (
    <div
      data-testid="mode-toggle-hero"
      className={`bg-white rounded-3xl border-2 border-[#D9D4C7] p-5 sm:p-6 shadow-sm space-y-5 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Two Giant Buttons for Mode Selection */}
        <div className="space-y-2">
          <span className="text-[14px] font-bold text-[#4A5750] uppercase tracking-wider block">
            {language === 'te' ? 'చూపు విధానం ఎంచుకోండి' : language === 'hi' ? 'दृश्य मोड चुनें' : 'Choose How to View'}
          </span>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {/* Pictures Button */}
            <button
              type="button"
              onClick={() => setPictorial(true)}
              aria-pressed={isPictorial}
              data-testid="mode-btn-pictures"
              className={`min-h-[64px] px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 text-[18px] ${
                isPictorial
                  ? 'bg-[#1B5E3B] text-white border-[#1B5E3B] shadow-md ring-2 ring-[#1B5E3B]/20 scale-[1.02]'
                  : 'bg-[#FFFDF8] text-[#1F2A24] border-[#D9D4C7] hover:border-[#1B5E3B]'
              }`}
            >
              <ImageIcon className="w-6 h-6 shrink-0 text-[#F2B01E]" />
              <div className="text-left">
                <span className="block font-black leading-tight">
                  {language === 'te' ? 'చిత్రాలు' : language === 'hi' ? 'चित्र' : 'Pictures'}
                </span>
                <span className="text-[13px] opacity-80 block font-normal">
                  {language === 'te' ? 'సులభ రూపం' : language === 'hi' ? 'सरल दृश्य' : 'Simple Visual'}
                </span>
              </div>
            </button>

            {/* Words Button */}
            <button
              type="button"
              onClick={() => setPictorial(false)}
              aria-pressed={!isPictorial}
              data-testid="mode-btn-words"
              className={`min-h-[64px] px-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border-2 text-[18px] ${
                !isPictorial
                  ? 'bg-[#1B5E3B] text-white border-[#1B5E3B] shadow-md ring-2 ring-[#1B5E3B]/20 scale-[1.02]'
                  : 'bg-[#FFFDF8] text-[#1F2A24] border-[#D9D4C7] hover:border-[#1B5E3B]'
              }`}
            >
              <BookOpen className="w-6 h-6 shrink-0 text-[#F2B01E]" />
              <div className="text-left">
                <span className="block font-black leading-tight">
                  {language === 'te' ? 'అక్షరాలు' : language === 'hi' ? 'शब्द' : 'Words'}
                </span>
                <span className="text-[13px] opacity-80 block font-normal">
                  {language === 'te' ? 'పూర్తి వివరాలు' : language === 'hi' ? 'पूर्ण विवरण' : 'Full Detail'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Large Language Selection Buttons */}
        <div className="space-y-2">
          <span className="text-[14px] font-bold text-[#4A5750] uppercase tracking-wider block">
            {language === 'te' ? 'మీ భాష' : language === 'hi' ? 'अपनी भाषा चुनें' : 'Your Language'}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'en', label: 'English' },
            ].map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => handleLanguageClick(code as Language)}
                aria-pressed={language === code}
                data-testid={`lang-btn-${code}`}
                className={`min-h-[56px] px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 border-2 transition-all text-[17px] ${
                  language === code
                    ? 'bg-[#F2B01E] text-[#1F2A24] border-[#9E5B00] shadow-sm scale-[1.02]'
                    : 'bg-[#FFFDF8] text-[#1F2A24] border-[#D9D4C7] hover:border-[#1B5E3B]'
                }`}
              >
                <span>{label}</span>
                <Volume2 className="w-4 h-4 opacity-70" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeToggleHero;
