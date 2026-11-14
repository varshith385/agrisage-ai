import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { useTranslation } from '../../context/LanguageContext';

export interface StepItem {
  stepNumber: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  bgColor?: string;
}

export interface StepFlowProps {
  heading: string;
  steps: StepItem[];
  spokenText?: string;
  className?: string;
}

export const StepFlow: React.FC<StepFlowProps> = ({
  heading,
  steps,
  spokenText,
  className = '',
}) => {
  const { language } = useTranslation();
  const defaultSpoken = spokenText || `${heading}: ${steps.map((s) => `Step ${s.stepNumber}. ${s.title}: ${s.desc}`).join('. ')}`;
  const listenLabel = language === 'te' ? 'దశలు వినండి' : language === 'hi' ? 'कदम सुनें' : 'Listen to steps';

  return (
    <div
      data-testid="step-flow"
      className={`bg-white rounded-3xl border-2 border-[#D9D4C7] p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[20px] font-bold text-[#1B5E3B]">
          {heading}
        </h3>
        <ReadAloudButton text={defaultSpoken} label={listenLabel} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.stepNumber}
              className="bg-[#FFFDF8] rounded-2xl border border-[#D9D4C7] p-4 flex flex-col items-center text-center space-y-2.5 relative"
            >
              {/* Step Number Badge */}
              <div className="w-7 h-7 rounded-full bg-[#1B5E3B] text-white font-extrabold text-[14px] flex items-center justify-center shrink-0">
                {step.stepNumber}
              </div>

              {/* Icon Circle */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                  step.bgColor || 'bg-[#FFF8E1] border-[#F2B01E]/40'
                }`}
              >
                <Icon className={`w-8 h-8 ${step.iconColor || 'text-[#1F2A24]'}`} />
              </div>

              {/* Step Title & Short Explanation */}
              <h4 className="font-bold text-[17px] text-[#1F2A24] leading-snug">
                {step.title}
              </h4>
              <p className="text-[14px] text-[#4A5750] leading-relaxed max-w-[220px]">
                {step.desc}
              </p>

              {/* Arrow Indicator (hidden on mobile, visible on desktop) */}
              {!isLast && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-[#D9D4C7] shadow-xs flex items-center justify-center text-[#7A553A]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepFlow;
