import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useTranslation } from '../context/LanguageContext';
import { ReadAloudButton } from '../components/common/ReadAloudButton';

export const WatchHowToPage: React.FC = () => {
  const { language } = useTranslation();
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
              Your browser does not support HTML5 video.
            </video>
          ) : (
            <div className="p-8 sm:p-12 text-center text-[#FAF8F5] flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-16 h-16 rounded-3xl bg-[#DA9A4C]/20 border border-[#DA9A4C] text-[#DA9A4C] flex items-center justify-center mb-4 shadow-sm">
                <Video className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider block mb-1">
                Walkthrough Slot
              </span>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Video Coming Soon
              </h2>
              <p className="text-sm text-[#FAF8F5]/80 max-w-md mx-auto mb-6 leading-relaxed">
                Video coming soon. Please follow the written steps below.
              </p>
              <Link
                to="/how-to"
                className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Read Illustrated Written Steps</span>
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
            Quick Summary of Steps
          </h2>
          <ReadAloudButton
            text="Grow2Gain walkthrough steps: Step 1. Select your preferred language from top bar. Step 2. Select your registered farm holding. Step 3. Check live weather and rainfall forecast. Step 4. Run the FAO-56 crop water budget to check if you need to irrigate. Step 5. Take a leaf photo to diagnose plant diseases. Step 6. Use the What-If slider in Economics to calculate profit. Step 7. Speak with the voice assistant in Telugu, Hindi or English."
            label="Listen to summary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 1 &bull; Language & Farm</span>
            <p className="text-base text-[#1A2421]">Select your preferred language (English, Telugu, Hindi) and verify your registered farm holding in the banner.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 2 &bull; Weather & Rain</span>
            <p className="text-base text-[#1A2421]">Check whether rainfall is expected today. High rainfall forecasts trigger rain-skips to save pump electricity.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 3 &bull; Water Budget</span>
            <p className="text-base text-[#1A2421]">Compute water budget to see root-zone moisture depletion and required irrigation depth in millimetres and litres.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 4 &bull; Disease Diagnosis</span>
            <p className="text-base text-[#1A2421]">Upload a leaf photo. AI models identify leaf spots or blight with confidence percentage and IPM treatments.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 5 &bull; Profit What-If</span>
            <p className="text-base text-[#1A2421]">Adjust expected yield and mandi market price sliders to see live impact on net profit and operational margins.</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 shadow-sm">
            <span className="text-xs font-black uppercase text-[#DA9A4C] block mb-1">Step 6 &bull; Voice Assistant</span>
            <p className="text-base text-[#1A2421]">Speak naturally with voice assistant in Telugu, Hindi or English for instant answers linked to the exact screens.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
