import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center bg-rose-50/70 border border-rose-200/80 rounded-2xl ${className}`}
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="font-display text-base font-bold text-stone-900 mb-1">
        {title || t('common.error_heading')}
      </h4>
      <p className="text-xs text-stone-600 max-w-md mb-4 leading-relaxed">
        {message || 'An error occurred while communicating with the agricultural service.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white rounded-xl text-xs font-semibold shadow transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};

