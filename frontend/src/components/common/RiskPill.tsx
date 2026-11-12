import React from 'react';

interface RiskPillProps {
  level: 'low' | 'med' | 'medium' | 'high';
  label?: string;
  className?: string;
}

export const RiskPill: React.FC<RiskPillProps> = ({ level, label, className = '' }) => {
  const normLevel = level === 'medium' ? 'med' : level;

  const getStyle = () => {
    switch (normLevel) {
      case 'low':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'med':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'high':
        return 'bg-rose-50 text-rose-800 border-rose-300';
    }
  };

  const defaultLabel = normLevel.toUpperCase() + ' RISK';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1 rounded-full bg-current" />
      {label || defaultLabel}
    </span>
  );
};

