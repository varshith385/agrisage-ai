import React from 'react';
import { Lightbulb } from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { useTranslation } from '../../context/LanguageContext';

export interface WhatThisMeansProps {
  message: string;
  confidence?: 'high' | 'medium' | 'low' | 'modelled';
  confidenceNote?: string;
  className?: string;
}

export const WhatThisMeans: React.FC<WhatThisMeansProps> = ({
  message,
  confidenceNote,
  className = '',
}) => {
  const { t } = useTranslation();

  const fullTextToRead = confidenceNote
    ? `What this means for you: ${message}. Note: ${confidenceNote}`
    : `What this means for you: ${message}`;

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 bg-gradient-to-r from-amber-50/80 via-[#FFFDF8] to-emerald-50/40 dark:from-[#232014] dark:via-[#18241E] dark:to-[#142B1D] border-[#D9D4C7] dark:border-[#273B30] shadow-xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#F2B01E]/20 text-[#1F2A24] dark:text-[#F2B01E] flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-[#9E5B00] dark:text-[#F2B01E]" />
          </div>
          <div className="min-w-0">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#9E5B00] dark:text-[#F2B01E] block">
              {t('common.what_this_means', { defaultValue: 'What this means for you' })}
            </span>
            <p className="mt-1 text-[15px] sm:text-[16px] font-medium text-[#1F2A24] dark:text-[#F2F5F3] leading-[1.5] break-words">
              {message}
            </p>
            {confidenceNote && (
              <p className="mt-1 text-[13px] text-[#4A5750] dark:text-[#9EB0A5] italic">
                {confidenceNote}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <ReadAloudButton text={fullTextToRead} />
        </div>
      </div>
    </div>
  );
};

export default WhatThisMeans;
