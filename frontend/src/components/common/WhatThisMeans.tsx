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
      className={`rounded-2xl border p-4 sm:p-4.5 bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white border-[#DA9A4C]/35 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DA9A4C]/20 text-[#7A553A] flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-[#DA9A4C]" />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-[#7A553A] tracking-wider block">
              {t('common.what_this_means', { defaultValue: 'What this means for you' })}
            </span>
            <p className="mt-1 text-base font-medium text-[#1A2421] leading-relaxed">
              {message}
            </p>
            {confidenceNote && (
              <p className="mt-1 text-xs text-[#7A553A] italic">
                {confidenceNote}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <ReadAloudButton text={fullTextToRead} />
        </div>
      </div>
    </div>
  );
};
