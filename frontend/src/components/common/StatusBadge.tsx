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
  | 'planned'
  | 'nodata'
  | 'no_data'
  | 'empty';

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
    styleClasses = 'bg-[#E8F5E9] dark:bg-[#1B3825] text-[#2E7D32] dark:text-[#4ADE80] border-[#2E7D32]/35 dark:border-[#4ADE80]/30';
  } else if (normStatus === 'PARTIAL' || normStatus === 'WARNING') {
    shapeName = 'triangle-warning';
    IconComponent = AlertTriangle;
    defaultWord = normStatus === 'PARTIAL' ? 'Partial' : 'Monitor';
    styleClasses = 'bg-[#FFF8E1] dark:bg-[#34270B] text-[#9E5B00] dark:text-[#FBBF24] border-[#9E5B00]/40 dark:border-[#FBBF24]/30';
  } else if (normStatus === 'DANGER' || normStatus === 'CRITICAL') {
    shapeName = 'octagon-cross';
    IconComponent = AlertOctagon;
    defaultWord = 'Critical Action';
    styleClasses = 'bg-[#FFEBEE] dark:bg-[#3A1414] text-[#B3261E] dark:text-[#F87171] border-[#B3261E]/40 dark:border-[#F87171]/30';
  } else if (normStatus === 'DEMO' || normStatus === 'INFO') {
    shapeName = 'circle-info';
    IconComponent = Info;
    defaultWord = normStatus === 'DEMO' ? 'Demo Data' : 'Info';
    styleClasses = 'bg-[#E3F2FD] dark:bg-[#122B3F] text-[#1565A8] dark:text-[#60A5FA] border-[#1565A8]/40 dark:border-[#60A5FA]/30';
  } else if (normStatus === 'NODATA' || normStatus === 'NO_DATA' || normStatus === 'EMPTY' || normStatus === 'NONE') {
    shapeName = 'circle-clock';
    IconComponent = Clock;
    defaultWord = 'No data yet';
    styleClasses = 'bg-[#F5F5F4] dark:bg-stone-800 text-[#78716C] dark:text-[#9EB0A5] border-[#D6D3D1] dark:border-stone-700';
  } else {
    shapeName = 'circle-clock';
    IconComponent = Clock;
    defaultWord = 'Planned / Verify';
    styleClasses = 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';
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
