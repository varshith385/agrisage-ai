import React from 'react';
import { EmptyPlotIllustration } from './FarmerIllustrations';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  action,
  className = '',
  icon,
}) => (
  <div
    className={`bg-[#FAF8F5] rounded-3xl border border-[#7A553A]/20 p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm ${className}`}
  >
    <div className="mb-4">
      {icon || <EmptyPlotIllustration size={96} />}
    </div>
    <h3 className="font-display text-xl font-bold text-[#183D2E] mb-2">
      {title}
    </h3>
    <p className="text-base text-[#4E5F57] leading-relaxed mb-6 max-w-md">
      {description}
    </p>
    {action ? (
      <div className="flex justify-center">{action}</div>
    ) : actionText && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] transition-all shadow-sm active:scale-[0.98]"
      >
        {actionText}
      </button>
    ) : null}
  </div>
);
