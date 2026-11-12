import React, { useState } from 'react';
import {
  Play,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  GitCompare,
  Code2,
  Info,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { AgentRunItem, OrchestratorRunResult } from '../../types/api';
import { ExplainCard } from '../common/ExplainCard';

interface AgentActivityLogProps {
  farmId?: number;
  latestRunResult: OrchestratorRunResult | null;
  historicalRuns: AgentRunItem[];
  isLoading: boolean;
  isTriggering: boolean;
  onTriggerRun: () => void;
  onRefresh: () => void;
}

export const AgentActivityLog: React.FC<AgentActivityLogProps> = ({
  latestRunResult,
  historicalRuns,
  isLoading,
  isTriggering,
  onTriggerRun,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const hasRuns = latestRunResult !== null || historicalRuns.length > 0;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-subtle mt-6">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
            <Layers className="w-5 h-5 text-agri-green-700" />
            {t('agents.activity_log_title')}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">{t('agents.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading || isTriggering}
            className="p-2 border border-stone-200 hover:border-stone-300 rounded-xl text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50"
            title={t('common.retry')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'motion-safe:animate-spin motion-reduce:animate-none' : ''}`} />
          </button>

          <button
            onClick={onTriggerRun}
            disabled={isTriggering || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            {isTriggering ? (
              <>
                <RefreshCw className="w-4 h-4 motion-safe:animate-spin motion-reduce:animate-none" />
                {t('agents.running_pipeline')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {t('agents.run_pipeline_btn')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Honesty Rules Stub Disclaimer */}
      <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          {t('agents.stub_disclaimer')}
        </p>
      </div>

      {/* Empty State when no runs exist */}
      {!hasRuns && !isLoading && !isTriggering && (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-stone-800">
            {t('agents.activity_log_title')}
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-5">
            {t('agents.empty_runs')}
          </p>
          <button
            onClick={onTriggerRun}
            className="inline-flex items-center gap-2 px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white text-xs font-semibold rounded-xl shadow-subtle transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            {t('agents.run_pipeline_btn')}
          </button>
        </div>
      )}

      {/* Active / Latest Run Display */}
      {latestRunResult && (
        <div className="mt-5 space-y-4">
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700">{t('agents.run_id_label')}:</span>
                <code className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800">
                  {latestRunResult.run_id}
                </code>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {latestRunResult.duration_ms} ms
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wide border ${
                    latestRunResult.status === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : latestRunResult.status === 'degraded'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {latestRunResult.status}
                </span>
              </div>
            </div>

            {/* Conflicts section if detected */}
            {latestRunResult.conflicts && latestRunResult.conflicts.length > 0 && (
              <div className="mt-4 pt-2">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
                  <GitCompare className="w-4 h-4 text-amber-600" />
                  {t('agents.conflicts_title')} ({latestRunResult.conflicts.length})
                </h4>
                <div className="space-y-2">
                  {latestRunResult.conflicts.map((conflict, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-stone-900">
                          {conflict.agent_a} ↔ {conflict.agent_b}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                            conflict.rule_type === 'rule_based'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {conflict.rule_type === 'rule_based'
                            ? t('agents.conflict_rule_badge')
                            : t('agents.conflict_heuristic_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-medium mb-1">
                        <span className="text-stone-500 font-normal">Issue:</span> {conflict.issue}
                      </p>
                      <div className="text-xs text-emerald-900 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60 mt-1">
                        <span className="font-bold text-emerald-800">
                          {t('agents.conflict_resolution_label')}:
                        </span>{' '}
                        {conflict.resolution}
                      </div>
                      <p className="text-[11px] text-stone-500 italic mt-1.5">
                        <span className="font-semibold text-stone-600">
                          {t('agents.conflict_rationale_label')}:
                        </span>{' '}
                        {conflict.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sequential Handoff Timeline */}
            {latestRunResult.handoffs && latestRunResult.handoffs.length > 0 && (
              <div className="mt-4 pt-2">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-agri-green-700" />
                  {t('agents.handoff_title')}
                </h4>
                <div className="relative pl-4 border-l-2 border-stone-200 space-y-2.5 ml-2">
                  {latestRunResult.handoffs.map((handoff, hIdx) => (
                    <div key={hIdx} className="relative group">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-agri-green-600 ring-2 ring-white" />
                      <div className="text-xs bg-white p-2.5 rounded-lg border border-stone-200/80">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-0.5">
                          <span className="font-bold text-stone-800">
                            {handoff.from_agent} → {handoff.to_agent}
                          </span>
                          <span>{new Date(handoff.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-stone-700 font-sans text-xs">{handoff.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explainability Cards from Advisory Synthesis */}
            {latestRunResult.advisory_plan?.explainable_cards &&
              latestRunResult.advisory_plan.explainable_cards.length > 0 && (
                <div className="mt-4 pt-2">
                  {latestRunResult.advisory_plan.explainable_cards.map((card, cardIdx) => (
                    <ExplainCard key={cardIdx} data={card} className="mt-2" />
                  ))}
                </div>
              )}

            {/* Collapsible Raw JSON Telemetry Inspector */}
            <div className="mt-4 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowJsonInspector(!showJsonInspector)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>
                  {showJsonInspector ? 'Hide Telemetry JSON' : 'Inspect Raw Envelopes JSON'}
                </span>
                {showJsonInspector ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showJsonInspector && (
                <pre className="mt-2 p-3 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72">
                  {JSON.stringify(latestRunResult.envelopes, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Agent Runs List */}
      {historicalRuns.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-100">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
            Recent Agent Execution Records ({historicalRuns.length})
          </h4>
          <div className="space-y-2">
            {historicalRuns.slice(0, 10).map((run) => (
              <div
                key={run.id}
                className="p-3 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(run.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">
                      {run.agent_name || 'Agent'}
                    </span>
                    <code className="text-[10px] text-stone-500 font-mono">
                      {run.run_id ? run.run_id.slice(0, 8) + '...' : `#${run.id}`}
                    </code>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        run.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : run.status === 'degraded'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-stone-500">
                    <span>{run.duration_ms} ms</span>
                    <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                    {expandedLogId === run.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {expandedLogId === run.id && (
                  <div className="mt-3 pt-2 border-t border-stone-100 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-stone-700">{t('agents.inputs_label')}:</span>
                      <pre className="mt-1 p-2 bg-stone-50 rounded border border-stone-200 text-[11px] overflow-x-auto">
                        {JSON.stringify(run.inputs, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">{t('agents.outputs_label')}:</span>
                      <pre className="mt-1 p-2 bg-stone-50 rounded border border-stone-200 text-[11px] overflow-x-auto">
                        {JSON.stringify(run.outputs, null, 2)}
                      </pre>
                    </div>
                    {run.warnings && run.warnings.length > 0 && (
                      <div>
                        <span className="font-semibold text-amber-800">{t('agents.warnings_label')}:</span>
                        <ul className="list-disc pl-4 mt-1 text-amber-900 text-[11px]">
                          {run.warnings.map((w, wIdx) => (
                            <li key={wIdx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
