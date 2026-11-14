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
      className={`bg-white rounded-3xl border-2 border-[#D9D4C7] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#1B5E3B]/40 transition-all ${className}`}
    >
      {/* Top Header: Tile Title & Big Status Shape */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[20px] sm:text-[22px] font-bold text-[#1B5E3B]">
          {title}
        </h3>
        <StatusBadge status={status} label={statusWord} size="md" />
      </div>

      {/* Central Big Illustration or Real-Value Gauge */}
      <div className="flex items-center justify-center py-2 sm:py-3 min-h-[110px]">
        {illustration}
      </div>

      {/* ONE Short Phrase (max ~12 words) */}
      <p className="text-[18px] sm:text-[19px] font-bold text-[#1F2A24] text-center leading-snug">
        {phrase}
      </p>

      {/* Bottom Controls: Big Speaker Button & "Details" Button */}
      <div className="pt-2 border-t border-[#D9D4C7] flex items-center justify-between gap-3">
        <ReadAloudButton text={fullSpoken} label="Listen" />

        {onOpenDetails ? (
          <button
            type="button"
            onClick={onOpenDetails}
            data-testid="tile-details-btn"
            className="min-h-[56px] px-5 py-3 rounded-2xl font-bold bg-[#FFFDF8] text-[#1B5E3B] border-2 border-[#1B5E3B] hover:bg-[#1B5E3B]/10 flex items-center gap-2 text-[16px] transition-all active:scale-[0.98]"
          >
            <span>{detailsLabel}</span>
            <ChevronRight className="w-5 h-5 text-[#1B5E3B]" />
          </button>
        ) : detailsLink ? (
          <a
            href={detailsLink}
            data-testid="tile-details-link"
            className="min-h-[56px] px-5 py-3 rounded-2xl font-bold bg-[#FFFDF8] text-[#1B5E3B] border-2 border-[#1B5E3B] hover:bg-[#1B5E3B]/10 flex items-center gap-2 text-[16px] transition-all active:scale-[0.98]"
          >
            <span>{detailsLabel}</span>
            <ChevronRight className="w-5 h-5 text-[#1B5E3B]" />
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default PictorialTile;
