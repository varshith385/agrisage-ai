import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';
import { StatusBadge, StatusType } from './StatusBadge';

export interface PictorialTileProps {
  title: string;
  phrase: string;
  illustration: React.ReactNode;
  status: StatusType | string;
  statusWord?: string;
  spokenText?: string;
  onOpenDetails?: () => void;
  detailsLink?: string;
  detailsLabel?: string;
  className?: string;
}

export const PictorialTile: React.FC<PictorialTileProps> = ({
  title,
  phrase,
  illustration,
  status,
  statusWord,
  spokenText,
  onOpenDetails,
  detailsLink,
  detailsLabel = 'See Details',
  className = '',
}) => {
  const fullSpoken = spokenText || `${title}. ${phrase}. Status: ${statusWord || status}.`;

  return (
    <div
      data-testid="pictorial-tile"
      className={`bg-white dark:bg-[#18241E] rounded-3xl border-2 border-[#D9D4C7] dark:border-[#273B30] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#1B5E3B]/40 dark:hover:border-[#F2B01E]/40 transition-all ${className}`}
    >
      {/* Top Header: Tile Title & Big Status Shape */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-[#1B5E3B] dark:text-[#F2B01E] truncate">
          {title}
        </h3>
        <StatusBadge status={status} label={statusWord} size="md" />
      </div>

      {/* Central Big Illustration or Real-Value Gauge */}
      <div className="flex items-center justify-center py-2 sm:py-3 min-h-[110px]">
        {illustration}
      </div>

      {/* ONE Short Phrase (max ~12 words) */}
      <p className="text-[17px] sm:text-[18px] font-bold text-[#1F2A24] dark:text-[#F2F5F3] text-center leading-snug">
        {phrase}
      </p>

      {/* Bottom Controls: Big Speaker Button & "Details" Button */}
      <div className="pt-2 border-t border-[#D9D4C7] dark:border-[#273B30] flex items-center justify-between gap-3">
        <ReadAloudButton text={fullSpoken} label="Listen" />

        {onOpenDetails ? (
          <button
            type="button"
            onClick={onOpenDetails}
            data-testid="tile-details-btn"
            className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold bg-[#FFFDF8] dark:bg-[#121B16] text-[#1B5E3B] dark:text-[#F2B01E] border-2 border-[#1B5E3B] dark:border-[#F2B01E] hover:bg-[#1B5E3B]/10 dark:hover:bg-[#F2B01E]/10 flex items-center gap-2 text-[15px] transition-all active:scale-[0.98]"
          >
            <span>{detailsLabel}</span>
            <ChevronRight className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
          </button>
        ) : detailsLink ? (
          <a
            href={detailsLink}
            data-testid="tile-details-link"
            className="min-h-[50px] px-5 py-2.5 rounded-2xl font-bold bg-[#FFFDF8] dark:bg-[#121B16] text-[#1B5E3B] dark:text-[#F2B01E] border-2 border-[#1B5E3B] dark:border-[#F2B01E] hover:bg-[#1B5E3B]/10 dark:hover:bg-[#F2B01E]/10 flex items-center gap-2 text-[15px] transition-all active:scale-[0.98]"
          >
            <span>{detailsLabel}</span>
            <ChevronRight className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default PictorialTile;
