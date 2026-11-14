import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { speakText, SupportedLanguage } from '../../services/speech';

interface PictorialLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PictorialLegendModal: React.FC<PictorialLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useTranslation();
  const currentLang = (language as SupportedLanguage) || 'en';
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  if (!isOpen) return null;

  const handlePlaySample = () => {
    setIsPlayingSample(true);
    const sampleText = {
      te: 'నమస్కారం! ఆకుపచ్చ వృత్తం అంటే అంతా బాగుంది. పసుపు చతురస్రం అంటే శ్రద్ధ వహించండి. ఎరుపు త్రికోణం అంటే తక్షణ చర్య అవసరం. బూడిద వృత్తం అంటే డేటా వేచి ఉంది.',
      hi: 'नमस्ते! हरा गोला सुरक्षित दर्शाता है। पीला चौकोर ध्यान देने को कहता है। लाल त्रिकोण तुरंत कार्रवाई को कहता है। धूसर गोला डेटा की प्रतीक्षा दर्शाता है।',
      en: 'Welcome! Green circle means safe and good to go. Amber square means pay attention. Red triangle means urgent action needed. Grey circle means awaiting field data.',
    }[currentLang];

    speakText(sampleText, currentLang, {
      onEnd: () => setIsPlayingSample(false),
      onError: () => setIsPlayingSample(false),
    });
  };

  const legendItems = [
    {
      shape: (
        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
          ●
        </span>
      ),
      badge: 'Green Circle',
      meaning: {
        te: 'సురక్షితం / అంతా బాగుంది / కొనసాగించండి',
        hi: 'सुरक्षित / सब ठीक / आगे बढ़ें',
        en: 'Safe / Good to go / Proceed',
      }[currentLang],
      desc: {
        te: 'పంట ఆరోగ్యంగా ఉంది, తేమ సరిపోతుంది, ఎలాంటి హానికర సమస్య లేదు.',
        hi: 'फसल स्वस्थ है, नमी पर्याप्त है, कोई हानिकारक समस्या नहीं है।',
        en: 'Optimal soil moisture, healthy canopy, or favourable market conditions.',
      }[currentLang],
    },
    {
      shape: (
        <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
          ■
        </span>
      ),
      badge: 'Amber Square',
      meaning: {
        te: 'శ్రద్ధ వహించండి / వివరాలు తనిఖీ చేయండి',
        hi: 'ध्यान दें / विवरण की जांच करें',
        en: 'Attention / Check Details',
      }[currentLang],
      desc: {
        te: 'నీరు లేదా ఎరువులు త్వరలో అవసరం కావచ్చు లేదా వాతావరణ మార్పు రానుంది.',
        hi: 'जल्द ही पानी या खाद की जरूरत हो सकती है या मौसम बदलने वाला है।',
        en: 'Moisture depleting, rain arriving within 48h, or price volatility detected.',
      }[currentLang],
    },
    {
      shape: (
        <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 rotate-45">
          ▲
        </span>
      ),
      badge: 'Red Triangle',
      meaning: {
        te: 'తక్షణ చర్య అవసరం / ఆగండి / అధికారిని సంప్రదించండి',
        hi: 'तुरंत कार्रवाई / रुकें / अधिकारी से सलाह लें',
        en: 'Urgent Action / Stop / Consult Officer',
      }[currentLang],
      desc: {
        te: 'తీవ్రమైన తెగులు లేదా అధిక నీటి కొరత; వెంటనే పరిష్కార చర్యలు చేపట్టండి.',
        hi: 'गंभीर रोग या अत्यधिक जल तनाव; तुरंत सुधारात्मक कदम उठाएं।',
        en: 'High pest infection risk or critical water stress requiring intervention.',
      }[currentLang],
    },
    {
      shape: (
        <span className="w-8 h-8 rounded-full border-2 border-dashed border-stone-400 dark:border-stone-500 bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center font-bold text-sm shrink-0">
          ○
        </span>
      ),
      badge: 'Grey Dashed Circle',
      meaning: {
        te: 'డేటా ఇంకా అందలేదు / వేచి ఉంది',
        hi: 'डेटा प्रतीक्षित / अभी उपलब्ध नहीं',
        en: 'Awaiting Data / Unmeasured',
      }[currentLang],
      desc: {
        te: 'ఇంకా ఫోటో తీయలేదు లేదా పాత రికార్డు; అంచనాలు కల్పించబడవు.',
        hi: 'अभी कोई स्कैन नहीं या अप्रमाणित रिकॉर्ड; कोई काल्पनिक डेटा नहीं।',
        en: 'No leaf scanned yet or unverified soil record. We never invent fake numbers.',
      }[currentLang],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pictorial-legend-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#14201A] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-agri-green-100 dark:bg-agri-green-950/60 flex items-center justify-center text-agri-green-800 dark:text-agri-green-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="pictorial-legend-title"
                className="text-base font-bold text-stone-900 dark:text-stone-100"
              >
                {language === 'te'
                  ? 'ఈ స్క్రీన్‌ను ఎలా చదవాలి? (చిహ్నాల వివరణ)'
                  : language === 'hi'
                  ? 'इस स्क्रीन को कैसे समझें? (संकेत गाइड)'
                  : 'How to Read This Screen (Visual Legend)'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {language === 'te'
                  ? 'రైతుల కోసం సులభమైన రంగులు మరియు ఆకారాలు'
                  : 'Universal shape and color standard for Indian farmers'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close legend"
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend Shape Table */}
        <div className="space-y-3">
          {legendItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-stone-50 dark:bg-[#1B2720] rounded-2xl border border-stone-200/80 dark:border-stone-800 flex items-start space-x-3.5"
            >
              {item.shape}
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {item.meaning}
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono">{item.badge}</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 1-Click Audio Sample Test Button */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePlaySample}
            disabled={isPlayingSample}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-agri-green-50 text-agri-green-800 dark:bg-agri-green-950/60 dark:text-agri-green-300 border border-agri-green-300 dark:border-agri-green-800 rounded-xl text-xs font-semibold hover:bg-agri-green-100 dark:hover:bg-agri-green-900/40 transition-all active:scale-95"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingSample ? 'animate-pulse text-amber-600' : ''}`} />
            <span>
              {isPlayingSample
                ? 'Playing audio sample...'
                : language === 'te'
                ? 'నమూనా ఆడియో వినండి (Hear sample audio)'
                : language === 'hi'
                ? 'नमूना ऑडियो सुनें (Hear sample audio)'
                : 'Hear sample audio'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            {language === 'te' ? 'అర్థమైంది' : language === 'hi' ? 'समझ गया' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
