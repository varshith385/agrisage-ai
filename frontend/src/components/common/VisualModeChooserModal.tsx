import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, BookOpen, Sparkles, Check } from 'lucide-react';
import { usePictorial } from '../../context/PictorialContext';
import { useTranslation } from '../../context/LanguageContext';

const CHOOSER_STORAGE_KEY = 'agrisage_visual_choice_v1';

export const VisualModeChooserModal: React.FC = () => {
  const { setPictorial } = usePictorial();
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const chosen = localStorage.getItem(CHOOSER_STORAGE_KEY);
      if (!chosen) {
        // Delay slightly for smooth initial entrance
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const handleSelectMode = (mode: 'pictures' | 'words') => {
    setPictorial(mode === 'pictures');
    try {
      localStorage.setItem(CHOOSER_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-chooser-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#14201A] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-7 space-y-6 text-center">
        {/* Top Decorative Sparkle Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-agri-green-600 to-agri-green-800 text-white flex items-center justify-center shadow-md">
          <Sparkles className="w-7 h-7 text-[#F2B01E]" />
        </div>

        <div className="space-y-2">
          <h2
            id="visual-chooser-title"
            className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight"
          >
            {language === 'te'
              ? 'Grow2Gain ని ఎలా చూడాలనుకుంటున్నారు?'
              : language === 'hi'
              ? 'आप Grow2Gain को कैसे देखना चाहते हैं?'
              : 'How would you like to see Grow2Gain?'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xs mx-auto">
            {language === 'te'
              ? 'మీరు ఎప్పుడైనా పై భాగంలో మార్చుకోవచ్చు (You can switch anytime).'
              : language === 'hi'
              ? 'आप इसे कभी भी बदल सकते हैं (You can switch anytime).'
              : 'Choose your default experience. You can switch anytime.'}
          </p>
        </div>

        {/* Two Big Tactile Choice Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Pictures Option (Recommended) */}
          <button
            type="button"
            onClick={() => handleSelectMode('pictures')}
            className="p-4 sm:p-5 rounded-2xl border-2 border-agri-green-700 bg-agri-green-50/70 dark:bg-agri-green-950/50 hover:bg-agri-green-100 dark:hover:bg-agri-green-900/60 text-stone-900 dark:text-stone-100 flex flex-col items-center justify-between space-y-3 shadow-md hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-agri-green-700 text-[#F2B01E] flex items-center justify-center shadow-xs">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                {language === 'te' ? 'చిత్రాలు' : language === 'hi' ? 'चित्र' : 'Pictures'}
              </span>
              <span className="text-[11px] text-stone-600 dark:text-stone-300 block mt-0.5">
                {language === 'te' ? 'రంగులు & బొమ్మలు' : language === 'hi' ? 'सरल दृश्य' : 'Recommended for Farmers'}
              </span>
            </div>
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              <Check className="w-3 h-3" />
              <span>{t('pictorial.recommended_badge', { defaultValue: 'Recommended' })}</span>
            </span>
          </button>

          {/* Words Option */}
          <button
            type="button"
            onClick={() => handleSelectMode('words')}
            className="p-4 sm:p-5 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1A2620] hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-900 dark:text-stone-100 flex flex-col items-center justify-between space-y-3 hover:scale-[1.02] active:scale-95 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200">
                {language === 'te' ? 'వివరాలు' : language === 'hi' ? 'शब्द' : 'Words'}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                {language === 'te' ? 'పూర్తి టెక్స్ట్' : language === 'hi' ? 'विस्तृत टेक्स्ट' : 'Detailed Tables & Specs'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-medium">{t('pictorial.standard_badge', { defaultValue: 'Standard' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
