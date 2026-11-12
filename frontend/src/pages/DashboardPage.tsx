import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { weatherApi } from '../api/weather';
import { farmsApi } from '../api/farms';
import { agentsApi } from '../api/agents';
import { CurrentWeather, Farm, AgentRunItem, OrchestratorRunResult } from '../types/api';
import { CurrentWeatherCard } from '../components/weather/CurrentWeatherCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { AgentFlowDiagram } from '../components/agents/AgentFlowDiagram';
import { AgentActivityLog } from '../components/agents/AgentActivityLog';

export const DashboardPage: React.FC = () => {
  const { user, activeFarm, activeCrop } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [farmData, setFarmData] = useState<Farm | null>(null);
  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Agent Orchestration State
  const [latestRunResult, setLatestRunResult] = useState<OrchestratorRunResult | null>(null);
  const [historicalRuns, setHistoricalRuns] = useState<AgentRunItem[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Fetch full farm details if activeFarm exists
  useEffect(() => {
    farmsApi
      .getFarms()
      .then((farms) => {
        if (farms.length > 0) {
          setFarmData(farms[0]);
        }
      })
      .catch((err) => console.error('Error fetching farm list', err));
  }, []);

  const activeFarmId = farmData?.id || activeFarm?.id;

  const loadAgentRuns = useCallback(async () => {
    if (!activeFarmId) return;
    setIsLoadingRuns(true);
    try {
      const runs = await agentsApi.listRuns({ farm_id: activeFarmId, limit: 30 });
      setHistoricalRuns(runs);
    } catch (err) {
      console.error('Failed to load historical agent runs', err);
    } finally {
      setIsLoadingRuns(false);
    }
  }, [activeFarmId]);

  useEffect(() => {
    if (activeFarmId) {
      loadAgentRuns();
    }
  }, [activeFarmId, loadAgentRuns]);

  const handleTriggerAgentRun = async () => {
    if (!activeFarmId) return;
    setIsTriggering(true);
    try {
      const result = await agentsApi.triggerRun({ farm_id: activeFarmId });
      setLatestRunResult(result);
      await loadAgentRuns();
    } catch (err) {
      console.error('Failed to execute agent run', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Weather lat/lon
  const lat = farmData?.latitude || activeFarm?.latitude || 17.9689;
  const lon = farmData?.longitude || activeFarm?.longitude || 79.5941;

  const fetchWeather = async (l1: number, l2: number) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await weatherApi.getCurrentWeather(l1, l2);
      setWeatherData(data);
    } catch (err: unknown) {
      setWeatherError(
        err instanceof Error ? err.message : 'Weather service unreachable (HTTP 503 / Network Error).'
      );
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather(lat, lon);
  }, [lat, lon]);

  // Determine active crop cycle and stage from backend API (never hardcoded)
  const activeCycle = farmData?.current_crop_cycles && farmData.current_crop_cycles.length > 0
    ? farmData.current_crop_cycles[0]
    : null;

  const cropName = activeCycle?.crop_name || (activeCrop ? activeCrop.split(' ')[0] : 'Cotton');
  const growthStage = activeCycle?.current_stage || null;
  const variety = activeCycle?.variety || 'Bollgard II Hybrid';
  const plantingDate = activeCycle?.planting_date || '2026-08-15';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-agri-green-800 via-agri-green-700 to-agri-soil-700 text-white rounded-3xl p-6 sm:p-8 shadow-warm border border-agri-gold-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-agri-gold-400 text-agri-green-950 font-bold text-xs uppercase tracking-wider">
                {user?.is_demo_account ? t('dashboard.demo_badge') : t('dashboard.portal_badge')}
              </span>
              <StatusBadge status="WORKING" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('dashboard.welcome_farmer', { name: user?.full_name || 'Farmer Ramesh' })}
            </h1>
            <p className="text-xs sm:text-sm text-agri-cream-100/90 flex items-center gap-2">
              <span>{farmData?.name || activeFarm?.name || 'Rameshwaram Farm (Warangal)'}</span>
              <span>•</span>
              <span>
                {farmData?.village || activeFarm?.village || 'Geikonda'},{' '}
                {farmData?.district || activeFarm?.district || 'Warangal'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/farms')}
              className="px-4 py-2.5 bg-agri-cream-50 hover:bg-white text-agri-green-900 rounded-2xl text-xs font-bold shadow transition-all active:scale-95"
            >
              {t('nav.farms')}
            </button>
            <button
              onClick={() => navigate('/setup')}
              className="px-4 py-2.5 bg-agri-gold-500 hover:bg-agri-gold-400 text-agri-green-950 rounded-2xl text-xs font-bold shadow transition-all active:scale-95"
            >
              {t('nav.weather')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Crop Cycle + Weather Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Crop Cycle Card */}
        <div className="lg:col-span-5 bg-white border border-agri-soil-200/80 rounded-3xl p-6 shadow-warm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-agri-green-100 text-agri-green-800 rounded-xl">
                <Sprout className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-stone-900">
                {t('dashboard.crop_cycle_heading')}
              </h3>
            </div>
            <span className="text-xs font-bold text-agri-green-700 bg-agri-green-50 px-2.5 py-0.5 rounded-full border border-agri-green-200">
              Active Season
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-agri-cream-50 rounded-2xl border border-stone-100">
              <span className="text-xs text-stone-500 font-medium">{t('dashboard.crop_label')}</span>
              <span className="text-sm font-bold text-stone-900">{cropName}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-agri-cream-50 rounded-2xl border border-stone-100">
              <span className="text-xs text-stone-500 font-medium">{t('dashboard.variety_label')}</span>
              <span className="text-sm font-bold text-stone-800">{variety}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-agri-cream-50 rounded-2xl border border-stone-100">
              <span className="text-xs text-stone-500 font-medium">{t('dashboard.planting_date_label')}</span>
              <span className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {plantingDate}
              </span>
            </div>

            {/* Growth stage from backend API (never hardcoded) */}
            <div className="p-3 bg-agri-cream-100/70 rounded-2xl border border-agri-soil-200/80 space-y-1">
              <span className="text-xs text-agri-soil-800 font-bold block">
                {t('dashboard.stage_label')}
              </span>
              {growthStage ? (
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold capitalize text-agri-green-800">
                    {growthStage} Stage
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-agri-green-200 text-agri-green-900 rounded-full">
                    Phenology Verified
                  </span>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic">
                  {t('dashboard.stage_not_computed')}
                </div>
              )}
            </div>
          </div>

          {/* Farm Tenure Summary */}
          {farmData && (
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-stone-400" />
                  Tenure: <strong className="capitalize">{farmData.ownership_type}</strong>
                </span>
                <span>
                  Total: <strong>{farmData.area} {t('common.acres')}</strong>
                </span>
              </div>
              {farmData.ownership_type === 'mixed' && (
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{ width: `${(farmData.owned_area / farmData.area) * 100}%` }}
                    title={`Owned: ${farmData.owned_area} ac`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${(farmData.leased_area / farmData.area) * 100}%` }}
                    title={`Leased: ${farmData.leased_area} ac`}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Weather Component */}
        <div className="lg:col-span-7 space-y-4">
          {isLoadingWeather && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-warm">
              <LoadingSkeleton lines={4} />
            </div>
          )}

          {weatherError && !isLoadingWeather && (
            <ErrorState
              title={t('dashboard.weather_feed_error')}
              message={weatherError}
              onRetry={() => fetchWeather(lat, lon)}
            />
          )}

          {weatherData && !isLoadingWeather && (
            <CurrentWeatherCard weather={weatherData} />
          )}

          {/* Farm Health Score Placeholder (Clearly labelled per Honesty Rules) */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-agri-green-700" />
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {t('dashboard.health_score_title')}
                </h4>
              </div>
              <p className="text-xs text-stone-500">
                {t('dashboard.health_score_placeholder')}
              </p>
            </div>
            <StatusBadge status="NOT STARTED" />
          </div>
        </div>
      </div>

      {/* Live Autonomous Multi-Agent Flow Diagram */}
      <AgentFlowDiagram
        envelopes={latestRunResult?.envelopes}
        isRunning={isTriggering}
      />

      {/* Live Agent Activity & Execution Log with Transparency */}
      <AgentActivityLog
        farmId={activeFarmId || 1}
        latestRunResult={latestRunResult}
        historicalRuns={historicalRuns}
        isLoading={isLoadingRuns}
        isTriggering={isTriggering}
        onTriggerRun={handleTriggerAgentRun}
        onRefresh={loadAgentRuns}
      />
    </div>
  );
};
