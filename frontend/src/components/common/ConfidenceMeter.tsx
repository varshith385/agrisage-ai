import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

interface ConfidenceMeterProps {
  value: number; // 0.0 to 1.0 or 0 to 100
  type?: 'model_metric' | 'heuristic' | 'rule' | 'prediction_confidence';
  showLabel?: boolean;
  className?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  value,
  type = 'prediction_confidence',
  showLabel = true,
  className = '',
}) => {
  const { t } = useTranslation();
  // Normalize to percentage 0..100
  const pct = value <= 1.0 ? Math.round(value * 100) : Math.round(value);

  const getTypeLabel = () => {
    switch (type) {
      case 'model_metric':
        return t('explain.confidence_model_metric');
      case 'rule':
        return t('explain.confidence_rule');
      case 'heuristic':
        return 'Heuristic Estimate';
      case 'prediction_confidence':
      default:
        return t('explain.confidence_prediction');
    }
  };

  const getColor = () => {
    if (pct >= 80) return 'bg-emerald-600 text-emerald-700';
    if (pct >= 55) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-500 text-rose-700';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-stone-600 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            {getTypeLabel()}
          </span>
          <span className="font-bold text-stone-900">{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor().split(' ')[0]}`}
          style={{ width: `${Math.min(Math.max(pct, 4), 100)}%` }}
        />
      </div>
    </div>
  );
};
