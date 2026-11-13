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
    <header className="mb-6 pb-4 border-b border-[#7A553A]/15">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Icon, Title, and Subtitle */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center shrink-0 shadow-sm border border-[#183D2E]/80 mt-0.5">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183D2E] tracking-tight">
                {title}
              </h1>
              {whatIsThis && (
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  aria-label={`What is this: ${title}`}
                  className="min-h-[44px] px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/30 hover:bg-[#EFE7DE] hover:border-[#183D2E]/50 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <HelpCircle className="w-4 h-4 text-[#DA9A4C]" />
                  <span>{t('common.what_is_this', { defaultValue: 'What is this?' })}</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-base text-[#4E5F57] leading-relaxed max-w-3xl">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#FAF8F5] rounded-3xl border-2 border-[#183D2E] shadow-elevated max-w-lg w-full p-6 sm:p-7 relative text-[#1A2421] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close explanation"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white border border-[#7A553A]/25 text-[#183D2E] flex items-center justify-center hover:bg-[#EFE7DE] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with original SVG illustration */}
            <div className="flex items-center gap-4 mb-5 pr-8">
              <ExplainGuideIllustration size={64} className="shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#DA9A4C] uppercase tracking-wider block">
                  {t('common.farmer_guide', { defaultValue: 'Farmer Guide' })}
                </span>
                <h2 id="what-is-this-title" className="font-display text-xl font-bold text-[#183D2E]">
                  {title}
                </h2>
              </div>
            </div>

            {/* Content Cards */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#7A553A]/15 shadow-sm">
                <h3 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-1">
                  1. {t('common.what_this_does', { defaultValue: 'What this tool does' })}
                </h3>
                <p className="text-base text-[#1A2421] leading-relaxed">
                  {whatIsThis.summary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#7A553A]/15 shadow-sm">
                <h3 className="text-xs font-black uppercase text-[#7A553A] tracking-wider mb-1">
                  2. {t('common.what_to_enter', { defaultValue: 'What you need to provide' })}
                </h3>
                <p className="text-base text-[#1A2421] leading-relaxed">
                  {whatIsThis.whatToEnter}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#7A553A]/15 shadow-sm">
                <h3 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-1">
                  3. {t('common.what_you_get', { defaultValue: 'What result you will get' })}
                </h3>
                <p className="text-base text-[#1A2421] leading-relaxed">
                  {whatIsThis.whatYouGet}
                </p>
              </div>
            </div>

            {/* Footer with Read-Aloud Button & Close */}
            <div className="mt-6 pt-4 border-t border-[#7A553A]/20 flex items-center justify-between gap-3">
              <ReadAloudButton text={explanationToRead} label={t('common.listen_guide', { defaultValue: 'Listen in audio' })} />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] transition-all flex items-center gap-1.5"
              >
                <span>{t('common.got_it', { defaultValue: 'Understood' })}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
