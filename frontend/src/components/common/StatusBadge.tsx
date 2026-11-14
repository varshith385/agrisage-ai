import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
} from 'lucide-react';

export type StatusType =
  | 'WORKING'
  | 'PARTIAL'
  | 'DEMO'
  | 'NOT STARTED'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'planned';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  size = 'md',
}) => {
  const normStatus = (status || '').toUpperCase();

  let shapeName = 'circle-tick';
  let IconComponent = CheckCircle2;
  let defaultWord = 'Healthy / Active';
  let styleClasses = 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/35';

  if (normStatus === 'WORKING' || normStatus === 'SUCCESS') {
    shapeName = 'circle-tick';
    IconComponent = CheckCircle2;
    defaultWord = normStatus === 'WORKING' ? 'Working' : 'Optimal';
    styleClasses = 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/35';
  } else if (normStatus === 'PARTIAL' || normStatus === 'WARNING') {
    shapeName = 'triangle-warning';
    IconComponent = AlertTriangle;
    defaultWord = normStatus === 'PARTIAL' ? 'Partial' : 'Monitor';
    styleClasses = 'bg-[#FFF8E1] text-[#9E5B00] border-[#9E5B00]/40';
  } else if (normStatus === 'DANGER' || normStatus === 'CRITICAL') {
    shapeName = 'octagon-cross';
    IconComponent = AlertOctagon;
    defaultWord = 'Critical Action';
    styleClasses = 'bg-[#FFEBEE] text-[#B3261E] border-[#B3261E]/40';
  } else if (normStatus === 'DEMO' || normStatus === 'INFO') {
    shapeName = 'circle-info';
    IconComponent = Info;
    defaultWord = normStatus === 'DEMO' ? 'Demo Data' : 'Info';
    styleClasses = 'bg-[#E3F2FD] text-[#1565A8] border-[#1565A8]/40';
  } else {
    shapeName = 'circle-clock';
    IconComponent = Clock;
    defaultWord = 'Planned / Verify';
    styleClasses = 'bg-stone-100 text-stone-700 border-stone-300';
  }

  const displayWord = label || defaultWord;
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textClass = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[16px]' : 'text-[14px]';

  return (
    <span
      data-testid="status-indicator"
      data-shape={shapeName}
      data-word={displayWord}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border shadow-xs transition-colors ${textClass} ${styleClasses} ${className}`}
    >
      <IconComponent className={`${iconSize} shrink-0`} aria-hidden="true" />
      <span>{displayWord}</span>
    </span>
  );
};

export default StatusBadge;
