import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useTranslation } from '../context/LanguageContext';
import { ReadAloudButton } from '../components/common/ReadAloudButton';

export const WatchHowToPage: React.FC = () => {
  const { language, t } = useTranslation();
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        icon={Video}
        title={language === 'te' ? 'Grow2Gain వీడియో గైడ్' : language === 'hi' ? 'Grow2Gain वीडियो गाइड' : 'Watch How to Use Grow2Gain'}
        purpose={
          language === 'te'
            ? 'రైతుల కోసం సులభమైన వీడియో మరియు అంచెలవారీ సూచనలు'
            : language === 'hi'
            ? 'किसानों के लिए 3 मिनट का सरल वीडियो और चरणबद्ध लिखित मार्गदर्शन'
            : 'A 3-minute practical walkthrough showing how to manage water, diagnose diseases, and track profit.'
        }
      />

      {/* Video Container Area */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/90 rounded-3xl overflow-hidden shadow-elevated border-2 border-[#183D2E]">
          {!videoError ? (
            <video
              controls
              poster=""
              preload="metadata"
              onError={() => setVideoError(true)}
              className="w-full aspect-video bg-black"
            >
              <source src="/videos/how-to-use.mp4" type="video/mp4" />
              {t('howto.video_not_supported', { defaultValue: 'Your browser does not support HTML5 video.' })}
            </video>
          ) : (
            <div className="p-8 sm:p-12 text-center text-[#FAF8F5] flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-16 h-16 rounded-3xl bg-[#DA9A4C]/20 border border-[#DA9A4C] text-[#DA9A4C] flex items-center justify-center mb-4 shadow-sm">
                <Video className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider block mb-1">
                {t('howto.walkthrough_slot', { defaultValue: 'Walkthrough Slot' })}
              </span>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                {t('howto.video_coming_soon', { defaultValue: 'Video Coming Soon' })}
              </h2>
              <p className="text-sm text-[#FAF8F5]/80 max-w-md mx-auto mb-6 leading-relaxed">
                {t('howto.video_fallback_desc', { defaultValue: 'Video coming soon. Please follow the written steps below.' })}
              </p>
              <Link
                to="/how-to"
                className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] transition-all flex items-center gap-2 shadow-sm"
              >
                <span>{t('howto.read_illustrated_steps', { defaultValue: 'Read Illustrated Written Steps' })}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Written Steps Section beneath the video */}
      <div className="max-w-4xl mx-auto space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#183D2E]">
            {t('howto.quick_summary_title', { defaultValue: 'Quick Summary of Steps' })}
          </h2>
          <ReadAloudButton
            text={
              language === 'te'
                ? 'Grow2Gain సహాయక దశలు: దశ 1. పై భాగంలో భాషను ఎంచుకోండి. దశ 2. మీ వ్యవసాయ క్షేత్రాన్ని ఎంచుకోండి. దశ 3. ప్రత్యక్ష వాతావరణం మరియు వర్ష సూచనను తనిఖీ చేయండి. దశ 4. నీటి తడి అవసరమా కాదా తెలుసుకోవడానికి FAO-56 నీటి బడ్జెట్ చూడండి. దశ 5. తెగుళ్లను గుర్తించడానికి ఆకు ఫోటో తీయండి. దశ 6. లాభాలను లెక్కించడానికి ఎకనామిక్స్ స్లైడర్ ఉపయోగించండి. దశ 7. తెలుగు, హిందీ లేదా ఇంగ్లీషులో వాయిస్ అసిస్టెంట్‌తో మాట్లాడండి.'
                : language === 'hi'
                ? 'Grow2Gain उपयोग चरण: चरण 1. शीर्ष बार से अपनी भाषा चुनें। चरण 2. अपना पंजीकृत खेत चुनें। चरण 3. लाइव मौसम और बारिश का पूर्वानुमान देखें। चरण 4. FAO-56 जल बजट से देखें कि क्या सिंचाई की आवश्यकता है। चरण 5. पत्ती का फोटो लेकर रोग पहचानें। चरण 6. लाभ गणना के लिए अर्थशास्त्र स्लाइडर का उपयोग करें। चरण 7. तेलुगु, हिन्दी या अंग्रेजी में वॉयस असिस्टेंट से बात करें।'
                : 'Grow2Gain walkthrough steps: Step 1. Select your preferred language from top bar. Step 2. Select your registered farm holding. Step 3. Check live weather and rainfall forecast. Step 4. Run the FAO-56 crop water budget to check if you need to irrigate. Step 5. Take a leaf photo to diagnose plant diseases. Step 6. Use the What-If slider in Economics to calculate profit. Step 7. Speak with the voice assistant in Telugu, Hindi or English.'
            }
            label={t('howto.listen_summary', { defaultValue: 'Listen to summary' })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step1_title', { defaultValue: 'Step 1 • Language & Farm' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step1_desc', { defaultValue: 'Select your preferred language (English, Telugu, Hindi) and verify your registered farm holding in the banner.' })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step2_title', { defaultValue: 'Step 2 • Weather & Rain' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step2_desc', { defaultValue: 'Check whether rainfall is expected today. High rainfall forecasts trigger rain-skips to save pump electricity.' })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step3_title', { defaultValue: 'Step 3 • Water Budget' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step3_desc', { defaultValue: 'Compute water budget to see root-zone moisture depletion and required irrigation depth in millimetres and litres.' })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step4_title', { defaultValue: 'Step 4 • Disease Diagnosis' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step4_desc', { defaultValue: 'Upload a leaf photo. AI models identify leaf spots or blight with confidence percentage and IPM treatments.' })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step5_title', { defaultValue: 'Step 5 • Profit What-If' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step5_desc', { defaultValue: 'Adjust expected yield and mandi market price sliders to see live impact on net profit and operational margins.' })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">{t('howto.step6_title', { defaultValue: 'Step 6 • Voice Assistant' })}</span>
            <p className="text-base text-[#1A2421]">{t('howto.step6_desc', { defaultValue: 'Speak naturally with voice assistant in Telugu, Hindi or English for instant answers linked to the exact screens.' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
