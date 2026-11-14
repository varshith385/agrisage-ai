import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

  const fullTextToRead = confidenceNote
    ? `What this means for you: ${message}. Note: ${confidenceNote}`
    : `What this means for you: ${message}`;

  const hasExtra = Boolean(confidenceNote || message.length > 90);

  return (
    <div
      className={`w-full rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-amber-50/70 via-[#FFFDF8] to-emerald-50/30 dark:from-[#232014] dark:via-[#18241E] dark:to-[#142B1D] border-[#D9D4C7] dark:border-[#273B30] shadow-2xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#F2B01E]/20 text-[#9E5B00] dark:text-[#F2B01E] flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-[#9E5B00] dark:text-[#F2B01E]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E5B00] dark:text-[#F2B01E] shrink-0">
                {t('common.what_this_means', { defaultValue: 'What this means' })}:
              </span>
              <p className={`text-[13px] sm:text-[14px] text-[#1F2A24] dark:text-[#F2F5F3] font-medium leading-snug ${!expanded && hasExtra ? 'line-clamp-1' : ''}`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {hasExtra && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="text-[11px] font-bold text-[#1B5E3B] dark:text-[#F2B01E] hover:underline flex items-center gap-0.5"
            >
              <span>{expanded ? 'Less' : 'Details'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <ReadAloudButton text={fullTextToRead} className="min-h-[32px] py-1 px-2.5 text-[11px]" />
        </div>
      </div>

      {expanded && confidenceNote && (
        <div className="mt-2 pt-2 border-t border-[#D9D4C7]/60 dark:border-[#273B30] text-[12px] text-[#4A5750] dark:text-[#9EB0A5] italic">
          {confidenceNote}
        </div>
      )}
    </div>
  );
};

export default WhatThisMeans;
