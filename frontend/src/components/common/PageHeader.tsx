import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight } from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { ExplainGuideIllustration } from './FarmerIllustrations';
import { useTranslation } from '../../context/LanguageContext';

export interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  purpose: string;
  whatIsThis?: {
    summary: string;
    whatToEnter: string;
    whatYouGet: string;
  };
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  purpose,
  whatIsThis,
  actions,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Full explanation text for read-aloud
  const explanationToRead = whatIsThis
    ? `${title}. ${purpose}. About this page: ${whatIsThis.summary}. What to enter: ${whatIsThis.whatToEnter}. What you get: ${whatIsThis.whatYouGet}.`
    : `${title}. ${purpose}.`;

  return (
    <header className="mb-5 pb-4 border-b border-[#D9D4C7] dark:border-[#273B30]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left: Icon, Title, and Subtitle */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#1B5E3B] dark:bg-[#18241E] text-[#F2B01E] flex items-center justify-center shrink-0 shadow-xs border border-[#164E30] dark:border-[#273B30] mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1B5E3B] dark:text-[#F2F5F3] tracking-tight leading-snug break-words">
                {title}
              </h1>
              {whatIsThis && (
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  aria-label={`What is this: ${title}`}
                  className="min-h-[36px] px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-[#18241E] text-[#1B5E3B] dark:text-[#F2B01E] border border-[#D9D4C7] dark:border-[#273B30] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#9E5B00] dark:text-[#F2B01E]" />
                  <span>{t('common.what_is_this', { defaultValue: 'What is this?' })}</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-[14px] sm:text-[15px] text-[#4A5750] dark:text-[#9EB0A5] leading-[1.5] max-w-3xl break-words">
              {purpose}
            </p>
          </div>
        </div>

        {/* Right Actions (if provided) */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* "What is this?" Explanatory Modal Dialog */}
      {isOpen && whatIsThis && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="what-is-this-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#18241E] rounded-3xl border-2 border-[#1B5E3B] dark:border-[#273B30] shadow-2xl max-w-lg w-full p-5 sm:p-6 relative text-[#1F2A24] dark:text-[#F2F5F3] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close explanation"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 border border-[#D9D4C7] dark:border-[#273B30] text-[#1F2A24] dark:text-[#F2F5F3] flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with original SVG illustration */}
            <div className="flex items-center gap-3.5 mb-4 pr-8">
              <ExplainGuideIllustration size={56} className="shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[#9E5B00] dark:text-[#F2B01E] uppercase tracking-wider block">
                  Quick Farmer Guide
                </span>
                <h2 id="what-is-this-title" className="font-display text-lg sm:text-xl font-bold text-[#1B5E3B] dark:text-[#F2F5F3]">
                  {title}
                </h2>
              </div>
            </div>

            {/* Read Aloud in Modal */}
            <div className="mb-4 pb-3 border-b border-[#D9D4C7] dark:border-[#273B30] flex items-center justify-between">
              <span className="text-xs text-[#4A5750] dark:text-[#9EB0A5]">Listen in your selected language:</span>
              <ReadAloudButton text={explanationToRead} />
            </div>

            {/* 3 Step Breakdown */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-[#232014] border border-[#F2B01E]/40">
                <span className="text-xs font-bold text-[#9E5B00] dark:text-[#F2B01E] uppercase tracking-wider block mb-1">
                  1. What is this page for?
                </span>
                <p className="text-[14px] text-[#1F2A24] dark:text-[#F2F5F3] leading-relaxed">
                  {whatIsThis.summary}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-[#D9D4C7] dark:border-[#273B30]">
                <span className="text-xs font-bold text-[#4A5750] dark:text-[#9EB0A5] uppercase tracking-wider block mb-1">
                  2. What should I enter?
                </span>
                <p className="text-[14px] text-[#1F2A24] dark:text-[#F2F5F3] leading-relaxed">
                  {whatIsThis.whatToEnter}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-[#142B1D] border border-[#1B5E3B]/30 dark:border-[#1B5E3B]/60">
                <span className="text-xs font-bold text-[#1B5E3B] dark:text-[#4ADE80] uppercase tracking-wider block mb-1">
                  3. What output will I get?
                </span>
                <p className="text-[14px] text-[#1F2A24] dark:text-[#F2F5F3] leading-relaxed">
                  {whatIsThis.whatYouGet}
                </p>
              </div>
            </div>

            {/* Got It Button */}
            <div className="mt-5 pt-3 border-t border-[#D9D4C7] dark:border-[#273B30]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full min-h-[46px] rounded-xl bg-[#1B5E3B] hover:bg-[#154E30] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>Understood, continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PageHeader;
