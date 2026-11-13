import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something could not load',
  message,
  onRetry,
  className = '',
}) => (
  <div
    role="alert"
    className={`bg-[#FEF6E9] rounded-3xl border border-[#DA9A4C]/40 p-6 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm ${className}`}
  >
    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#DA9A4C] flex items-center justify-center mb-3">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="font-display text-lg font-bold text-[#7A553A] mb-1">
      {title}
    </h3>
    <p className="text-base text-[#543924] leading-relaxed mb-5 max-w-md">
      {message}
    </p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] transition-all flex items-center gap-2 shadow-sm"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);
