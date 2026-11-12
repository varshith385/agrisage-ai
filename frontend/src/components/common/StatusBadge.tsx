import React from 'react';
import { FeatureStatus } from '../../types/api';

interface StatusBadgeProps {
  status: FeatureStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'WORKING':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-500/20';
      case 'PARTIAL':
        return 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20';
      case 'DEMO':
        return 'bg-purple-50 text-purple-800 border-purple-300 ring-purple-500/20';
      case 'NOT STARTED':
      default:
        return 'bg-stone-100 text-stone-600 border-stone-300 ring-stone-400/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ring-1 ${getStyles()} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
};

