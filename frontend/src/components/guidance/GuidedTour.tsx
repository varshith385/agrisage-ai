import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Layers,
  CloudSun,
  Droplets,
  Leaf,
  Coins,
  Mic,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';
import {
  LeafScanIllustration,
  WateringFieldIllustration,
  WeatherIllustration,
  MoneyProfitIllustration,
} from '../common/FarmerIllustrations';
import { ReadAloudButton } from '../common/ReadAloudButton';

const TOUR_STORAGE_KEY = 'agrisage_tour_completed_v1';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  actionText?: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'language',
      title: 'Step 1: Choose Your Language (భాష / भाषा)',
      description:
        'Switch between English, Telugu (తెలుగు), and Hindi (हिन्दी) anytime from the top bar. All recommendations and audio read-aloud support your local language.',
      icon: Globe,
      actionText: 'Next: Farm Setup',
    },
    {
      id: 'farm',
      title: 'Step 2: Choose or Add Your Farm Parcel',
      description:
        'Select your active farm parcel or add a new one. Enter whether land is owned or leased so irrigation and profit models reflect your true costs.',
      icon: Layers,
      route: '/farms',
      actionText: 'View My Farms',
    },
    {
      id: 'weather',
      title: 'Step 3: Check Agro-Weather & 7-Day Forecast',
      description:
        'View live weather conditions and rainfall forecasts calibrated to your village. See daily reference evapotranspiration (ET0) for crop water demand.',
      icon: CloudSun,
      route: '/setup',
      actionText: 'View Weather',
    },
    {
      id: 'water',
      title: 'Step 4: Crop Water Budget & Irrigation Advice',
      description:
        'Know exactly when and how much to water your field using FAO-56 agro-meteorological models. Avoid water wastage and protect root zones.',
      icon: Droplets,
      route: '/irrigation',
      actionText: 'Check Water Budget',
    },
    {
      id: 'disease',
      title: 'Step 5: Scan Crop Leaf for Disease Diagnosis',
      description:
        'Upload or take a photo of a crop leaf to identify diseases with confidence ratings, symptoms, and organic or chemical treatment advice.',
      icon: Leaf,
      route: '/disease',
      actionText: 'Diagnose Leaf',
    },
    {
      id: 'economics',
      title: 'Step 6: Understand Farm Costs & Live Profit',
      description:
        'Calculate operating expenses, compare crops, and use the interactive What-If slider to estimate your net profit under changing yields and mandi prices.',
      icon: Coins,
      route: '/economics',
      actionText: 'See Economics',
    },
    {
      id: 'voice',
      title: 'Step 7: Ask the Voice Assistant Anytime',
      description:
        'Tap the Voice button to speak in Telugu, Hindi, or English. Ask questions like "Will it rain today?", "Should I irrigate?", or "What is the mandi price?".',
      icon: Mic,
      route: '/dashboard',
      actionText: 'Go to Dashboard',
    },
  ];

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (steps[nextIndex].route) {
        navigate(steps[nextIndex].route!);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (steps[prevIndex].route) {
        navigate(steps[prevIndex].route!);
      }
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  if (!isOpen) return null;

  const StepIcon = currentStep.icon;
  const readText = `${currentStep.title}. ${currentStep.description}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AgriSage Guided Tour"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleComplete}
    >
      <div
        className="bg-[#FAF8F5] rounded-3xl border-2 border-[#183D2E] shadow-elevated max-w-lg w-full p-6 sm:p-7 relative text-[#1A2421] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Close */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#7A553A]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-[#183D2E]">
              AgriSage Quick Tour ({currentStepIndex + 1} of {steps.length})
            </span>
          </div>
          <button
            type="button"
            onClick={handleComplete}
            aria-label="Skip guided tour"
            className="w-10 h-10 rounded-full bg-white border border-[#7A553A]/25 text-[#183D2E] flex items-center justify-center hover:bg-[#EFE7DE] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Visual & Content */}
        <div className="text-center py-2">
          {/* Step Illustration */}
          <div className="mb-4 flex justify-center">
            {currentStep.id === 'water' ? (
              <WateringFieldIllustration size={88} />
            ) : currentStep.id === 'disease' ? (
              <LeafScanIllustration size={88} />
            ) : currentStep.id === 'weather' ? (
              <WeatherIllustration size={88} />
            ) : currentStep.id === 'economics' ? (
              <MoneyProfitIllustration size={88} />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center shadow-subtle mx-auto">
                <StepIcon className="w-10 h-10" />
              </div>
            )}
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#183D2E] mb-2">
            {currentStep.title}
          </h3>

          <p className="text-base text-[#4E5F57] leading-relaxed mb-6 max-w-md mx-auto">
            {currentStep.description}
          </p>

          <div className="flex justify-center mb-6">
            <ReadAloudButton text={readText} label="Listen to this step" />
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6" role="tablist">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Jump to ${s.title}`}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  if (s.route) navigate(s.route);
                }}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-8 bg-[#183D2E]'
                    : idx < currentStepIndex
                    ? 'w-2.5 bg-[#DA9A4C]'
                    : 'w-2.5 bg-[#7A553A]/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#7A553A]/20">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`min-h-[48px] px-4 py-2.5 rounded-xl font-semibold text-sm border flex items-center gap-1.5 transition-all ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-transparent border-stone-200 text-stone-400'
                : 'bg-white border-[#7A553A]/30 text-[#183D2E] hover:bg-[#EFE7DE]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-semibold text-[#7A553A] hover:text-[#183D2E] px-2"
          >
            Skip Tour
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold text-sm bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <span>{currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
