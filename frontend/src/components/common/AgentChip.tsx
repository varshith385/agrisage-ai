import React from 'react';
import { Bot, CloudRain, Droplets, Bug, TrendingUp, Compass } from 'lucide-react';
import { FeatureStatus } from '../../types/api';
import { StatusBadge } from './StatusBadge';

interface AgentChipProps {
  name: string;
  status: FeatureStatus;
  roleDescription?: string;
  className?: string;
}

export const AgentChip: React.FC<AgentChipProps> = ({
  name,
  status,
  roleDescription,
  className = '',
}) => {
  const getIcon = () => {
    switch (name.toLowerCase()) {
      case 'weather':
        return <CloudRain className="w-4 h-4 text-sky-600" />;
      case 'irrigation':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'disease':
        return <Bug className="w-4 h-4 text-emerald-600" />;
      case 'yield':
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      case 'advisory':
        return <Compass className="w-4 h-4 text-purple-600" />;
      default:
        return <Bot className="w-4 h-4 text-agri-green-700" />;
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 bg-white border border-stone-200/80 rounded-xl shadow-subtle hover:border-agri-green-600/40 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-stone-100 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <h5 className="text-xs font-bold text-stone-900 capitalize">{name} Agent</h5>
          {roleDescription && (
            <p className="text-[11px] text-stone-500 line-clamp-1">{roleDescription}</p>
          )}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
};

