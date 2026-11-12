import React from 'react';
import { Sprout } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white/70 border border-agri-soil-200/60 rounded-2xl shadow-warm ${className}`}
    >
      <div className="w-14 h-14 mb-4 rounded-2xl bg-agri-green-50 text-agri-green-700 flex items-center justify-center shadow-subtle">
        {icon || <Sprout className="w-7 h-7" />}
      </div>
      <h3 className="font-display text-lg font-bold text-stone-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 max-w-sm mb-5 leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

