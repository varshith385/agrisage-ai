import React from 'react';
import { CloudRain, Droplets, Bug, TrendingUp, Compass, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { AgentEnvelope } from '../../types/api';

interface AgentFlowDiagramProps {
  envelopes?: Record<string, AgentEnvelope>;
  isRunning?: boolean;
  activeAgentIndex?: number;
}

export const AgentFlowDiagram: React.FC<AgentFlowDiagramProps> = ({
  envelopes = {},
  isRunning = false,
  activeAgentIndex,
}) => {
  const { t } = useTranslation();

  const agents = [
    {
      id: 'WeatherAgent',
      name: t('agents.weather_agent_name'),
      desc: t('agents.weather_agent_desc'),
      icon: CloudRain,
      color: 'sky',
      bgLight: 'bg-sky-50',
      borderLight: 'border-sky-200',
      textAccent: 'text-sky-700',
      iconColor: 'text-sky-600',
    },
    {
      id: 'IrrigationAgent',
      name: t('agents.irrigation_agent_name'),
      desc: t('agents.irrigation_agent_desc'),
      icon: Droplets,
      color: 'blue',
      bgLight: 'bg-blue-50',
      borderLight: 'border-blue-200',
      textAccent: 'text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      id: 'DiseaseAgent',
      name: t('agents.disease_agent_name'),
      desc: t('agents.disease_agent_desc'),
      icon: Bug,
      color: 'emerald',
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-200',
      textAccent: 'text-emerald-700',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'YieldAgent',
      name: t('agents.yield_agent_name'),
      desc: t('agents.yield_agent_desc'),
      icon: TrendingUp,
      color: 'amber',
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-200',
      textAccent: 'text-amber-700',
      iconColor: 'text-amber-600',
    },
    {
      id: 'AdvisoryAgent',
      name: t('agents.advisory_agent_name'),
      desc: t('agents.advisory_agent_desc'),
      icon: Compass,
      color: 'purple',
      bgLight: 'bg-purple-50',
      borderLight: 'border-purple-200',
      textAccent: 'text-purple-700',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-subtle mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-agri-green-600 motion-safe:animate-pulse motion-reduce:animate-none" />
            {t('agents.flow_title')}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">{t('agents.subtitle')}</p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 motion-safe:animate-ping motion-reduce:animate-none" />
            {t('agents.running_pipeline')}
          </div>
        )}
      </div>

      {/* Grid of Agent Nodes with connectors */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 relative">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const env = envelopes[agent.id];
          const isCurrentActive = isRunning && activeAgentIndex === index;
          const status = env?.status;

          return (
            <React.Fragment key={agent.id}>
              <div
                className={`flex flex-col p-3 rounded-xl border relative transition-all motion-reduce:transition-none ${
                  isCurrentActive
                    ? 'ring-2 ring-agri-green-600 border-agri-green-500 bg-emerald-50/50 motion-safe:scale-[1.02]'
                    : status === 'failed'
                    ? 'border-red-300 bg-red-50/50'
                    : status === 'degraded'
                    ? 'border-amber-300 bg-amber-50/30'
                    : env
                    ? `${agent.bgLight} ${agent.borderLight}`
                    : 'bg-stone-50/60 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      env ? agent.bgLight : 'bg-white'
                    } ${agent.iconColor} border border-stone-100`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {env && (
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        status === 'success'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : status === 'degraded'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {status}
                    </span>
                  )}
                  {!env && (
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">
                      Phase {index + 1}
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs text-stone-900">{agent.name}</div>
                <div className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                  {agent.desc}
                </div>

                {env && (
                  <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
                    <span className="flex items-center gap-1">
                      {status === 'failed' ? (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      )}
                      {Math.round((env.confidence || 0) * 100)}% conf
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile/Desktop connector arrow indicator */}
              {index < agents.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 z-10"
                  style={{ left: `calc(${(index + 1) * 20}% - 12px)` }}
                >
                  <ArrowRight
                    className={`w-4 h-4 ${
                      isRunning
                        ? 'text-agri-green-600 motion-safe:animate-pulse motion-reduce:animate-none'
                        : 'text-stone-300'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
