import React from 'react';
import { ExplainabilitySchema } from '../../types/api';
import { ConfidenceMeter } from './ConfidenceMeter';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '../../context/LanguageContext';
import { HelpCircle, CheckCircle2, BookOpen, AlertTriangle } from 'lucide-react';

interface ExplainCardProps {
  title?: string;
  data: ExplainabilitySchema;
  className?: string;
}

export const ExplainCard: React.FC<ExplainCardProps> = ({
  title,
  data,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-agri-cream-50 border border-agri-soil-200/80 rounded-2xl p-5 shadow-warm space-y-4 ${className}`}
    >
      {/* Header & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-agri-green-100 text-agri-green-700 rounded-lg">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-stone-900">
              {title || t('explain.title')}
            </h4>
            <p className="text-xs text-stone-500 font-medium">
              {data.value}
            </p>
          </div>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Confidence Meter */}
      <div className="bg-white/80 p-3 rounded-xl border border-stone-200/60">
        <ConfidenceMeter value={data.confidence} type={data.confidence_type} />
      </div>

      {/* Reasons ("Because...") */}
      {data.reasons && data.reasons.length > 0 && (
        <div className="space-y-1.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-agri-soil-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-agri-green-600" />
            {t('explain.reasons_heading')}
          </h5>
          <ul className="space-y-1 pl-1">
            {data.reasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                <span className="text-agri-gold-500 font-bold">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-stone-200/60">
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-stone-400" />
            {t('explain.sources_heading')}
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {data.sources.map((src, idx) => {
              const label = typeof src === 'string' ? src : src.title || src.name || src.url || 'Source';
              const link = typeof src === 'object' && src.url && src.url !== 'to verify' ? src.url : null;
              return link ? (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-agri-green-800 rounded text-[11px] font-medium border border-stone-200 underline"
                >
                  {label}
                </a>
              ) : (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] font-medium border border-stone-200"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Operational Limitations */}
      {data.limitations && data.limitations.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-stone-200/60">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {t('explain.limitations_heading')}
          </h5>
          <ul className="space-y-1 pl-1">
            {data.limitations.map((lim, idx) => (
              <li key={idx} className="text-[11px] text-amber-900/90 leading-normal">
                • {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[11px] text-stone-400 italic pt-1 text-center">
        {t('explain.disclaimer')}
      </div>
    </div>
  );
};

