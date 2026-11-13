import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { weatherApi } from '../api/weather';
import { farmsApi } from '../api/farms';
import { agentsApi } from '../api/agents';
import { advisoryApi } from '../api/advisory';
import {
  CurrentWeather,
  Farm,
  AgentRunItem,
  OrchestratorRunResult,
  GrowthStageResponse,
  SevenDayPlanItem,
  FarmHealthScoreBreakdown,
  HeadlineYieldSummary,
} from '../types/api';
import { CurrentWeatherCard } from '../components/weather/CurrentWeatherCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { AgentFlowDiagram } from '../components/agents/AgentFlowDiagram';
import { AgentActivityLog } from '../components/agents/AgentActivityLog';

export const DashboardPage: React.FC = () => {
  const { user, activeFarm, activeCrop } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [farmData, setFarmData] = useState<Farm | null>(null);
  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Growth Stage State
  const [growthStageData, setGrowthStageData] = useState<GrowthStageResponse | null>(null);
  const [isLoadingStage, setIsLoadingStage] = useState<boolean>(false);

  // Agent Orchestration State
  const [latestRunResult, setLatestRunResult] = useState<OrchestratorRunResult | null>(null);
  const [historicalRuns, setHistoricalRuns] = useState<AgentRunItem[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Health Score Breakdown Expander
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);

  // Web Speech API State
  const [speechSpeaking, setSpeechSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Fetch full farm details
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
      if (result.advisory_plan?.growth_stage) {
        setGrowthStageData(result.advisory_plan.growth_stage);
      }
      await loadAgentRuns();
    } catch (err) {
      console.error('Failed to execute agent run', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Weather Coordinates
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

  // Crop Cycle Information
  const activeCycle = farmData?.current_crop_cycles && farmData.current_crop_cycles.length > 0
    ? farmData.current_crop_cycles[0]
    : null;

  const cropName = activeCycle?.crop_name || (activeCrop ? activeCrop.split(' ')[0] : 'Cotton');
  const plantingDate = activeCycle?.planting_date || '2026-08-15';
  const variety = activeCycle?.variety || 'Bollgard II Hybrid';

  // Fetch Growth Stage from API if not already in run result
  useEffect(() => {
    if (!growthStageData && plantingDate) {
      setIsLoadingStage(true);
      advisoryApi
        .getGrowthStage(cropName, plantingDate)
        .then((res) => setGrowthStageData(res))
        .catch((err) => console.error('Failed to compute growth stage', err))
        .finally(() => setIsLoadingStage(false));
    }
  }, [cropName, plantingDate, growthStageData]);

  // Read 7-Day Plan Aloud
  const handleReadAloudPlan = (items: SevenDayPlanItem[]) => {
    setVoiceNotice(null);
    if (!('speechSynthesis' in window)) {
      setVoiceNotice('Speech synthesis is not supported on this device.');
      return;
    }

    if (speechSpeaking) {
      window.speechSynthesis.cancel();
      setSpeechSpeaking(false);
      return;
    }

    const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    const langPrefix = language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en';

    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const matchedVoice = currentVoices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
    );

    if (!matchedVoice && language !== 'en') {
      setVoiceNotice(
        `No dedicated voice pack installed for ${language.toUpperCase()}. Reading with available default system voice.`
      );
    }

    // Build spoken script
    const spokenLines = items.slice(0, 4).map((item) => {
      const act = language === 'te' && item.action_te ? item.action_te : language === 'hi' && item.action_hi ? item.action_hi : item.action;
      const rsn = language === 'te' && item.reason_te ? item.reason_te : language === 'hi' && item.reason_hi ? item.reason_hi : item.reason;
      return `Day ${item.day_number}: ${act}. ${rsn}`;
    });

    const fullScript = `AgriSage Farm Advisory Plan for ${cropName}. ` + spokenLines.join('. ');

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.lang = langCode;
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.rate = 0.95;
    utterance.onend = () => setSpeechSpeaking(false);
    utterance.onerror = () => setSpeechSpeaking(false);

    setSpeechSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Extract Plan Data from latest run or construct fallback from envelopes
  const advisoryPlan = latestRunResult?.advisory_plan;
  const healthBreakdown: FarmHealthScoreBreakdown | undefined = advisoryPlan?.farm_health_breakdown as FarmHealthScoreBreakdown | undefined;
  const rawPlan = advisoryPlan?.seven_day_plan;
  const planItems: SevenDayPlanItem[] = Array.isArray(rawPlan)
    ? rawPlan.filter((it): it is SevenDayPlanItem => typeof it === 'object' && it !== null && 'action' in it)
    : [];

  const headlineYield: HeadlineYieldSummary | undefined = advisoryPlan?.headline_yield as HeadlineYieldSummary | undefined;

  // Domain Envelope Statuses
  const weatherEnvelope = latestRunResult?.envelopes?.WeatherAgent;
  const irrigationEnvelope = latestRunResult?.envelopes?.IrrigationAgent;
  const diseaseEnvelope = latestRunResult?.envelopes?.DiseaseAgent;

  const irrigationOutputs = irrigationEnvelope?.outputs as Record<string, any> | undefined;
  const diseaseOutputs = diseaseEnvelope?.outputs as Record<string, any> | undefined;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Hero Banner */}
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

      {/* 2. Top Grid: Phenology Progress Bar & Live Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Growth Stage Phenology Progress Card */}
        <div className="lg:col-span-5 bg-white border border-agri-soil-200/80 rounded-3xl p-6 shadow-warm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-agri-green-100 text-agri-green-800 rounded-xl">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-stone-900">
                  {t('dashboard.growth_stage_timeline')}
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  {cropName} ({variety})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status="WORKING" />
              <ConfidenceMeter value={0.88} type="rule" />
            </div>
          </div>

          {isLoadingStage ? (
            <LoadingSkeleton lines={4} />
          ) : growthStageData ? (
            <div className="space-y-4">
              {/* Active Stage & DAS Headline */}
              <div className="flex items-center justify-between p-3.5 bg-agri-green-50/80 rounded-2xl border border-agri-green-200">
                <div>
                  <span className="text-xs text-agri-green-800 font-bold block uppercase tracking-wider">
                    {t('dashboard.stage_label')}
                  </span>
                  <span className="text-base font-extrabold text-agri-green-950 capitalize">
                    {language === 'te'
                      ? growthStageData.current_stage_te
                      : language === 'hi'
                      ? growthStageData.current_stage_hi
                      : growthStageData.stages_timeline.find((s) => s.is_current)?.stage_name_en || growthStageData.current_stage}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 font-medium block">
                    {t('dashboard.days_after_sowing')}
                  </span>
                  <span className="text-base font-extrabold text-agri-soil-800">
                    DAS {growthStageData.days_after_sowing}
                  </span>
                </div>
              </div>

              {/* 5-Stage Stepper Visual */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                  <span>{t('dashboard.stage_progress')}: {growthStageData.stage_progress_pct}%</span>
                  <span>
                    {growthStageData.estimated_days_to_next_stage !== null
                      ? `${growthStageData.estimated_days_to_next_stage} ${t('dashboard.days_to_next')}`
                      : 'Maturity'}
                  </span>
                </div>
                {/* Visual Segments */}
                <div className="grid grid-cols-5 gap-1.5 h-3">
                  {growthStageData.stages_timeline.map((stg) => (
                    <div
                      key={stg.stage_key}
                      className={`h-full rounded-md transition-all ${
                        stg.is_current
                          ? 'bg-agri-gold-500 ring-2 ring-agri-gold-300'
                          : stg.progress_pct === 100
                          ? 'bg-agri-green-700'
                          : 'bg-stone-200'
                      }`}
                      title={`${stg.stage_name_en}: DAS ${stg.start_das}-${stg.end_das}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 font-medium px-0.5">
                  <span>Emergence</span>
                  <span>Vegetative</span>
                  <span>Bloom</span>
                  <span>Fruiting</span>
                  <span>Harvest</span>
                </div>
              </div>

              {/* Sowing Date and Tenure Info */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {t('dashboard.planting_date_label')}: <strong>{growthStageData.planting_date}</strong>
                </span>
                <span className="text-[11px] text-stone-500 italic">
                  {growthStageData.source_notes}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl">
              {t('dashboard.stage_not_computed')}
            </div>
          )}

          {/* Farm Tenure Bar */}
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

        {/* Right: Live Weather Component */}
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

          {/* Weather Alerts Banner */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {t('dashboard.weather_alerts_title')}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={weatherEnvelope?.status === 'degraded' ? 'PARTIAL' : 'WORKING'} />
                <ConfidenceMeter value={weatherEnvelope?.confidence || 0.90} type="rule" />
              </div>
            </div>
            {weatherData?.temperature_c && weatherData.temperature_c >= 38.0 ? (
              <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-2xl text-xs font-medium">
                High Temperature Alert: Daytime peak ({weatherData.temperature_c}°C) exceeds 38°C threshold. Monitor blossom heat stress.
              </div>
            ) : weatherData?.stale ? (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs font-medium">
                Offline Cache Alert: Weather data is from offline cache recorded at {weatherData.fetched_at}. Live forecast temporarily unreachable.
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                {t('dashboard.no_weather_alerts')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Farm Health Score Gauge & Component Breakdown */}
      <div className="bg-white border border-agri-soil-200/80 rounded-3xl p-6 shadow-warm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-stone-900">
                  {t('dashboard.health_score_title')}
                </h3>
                <StatusBadge status={healthBreakdown?.status === 'COMPUTED' ? 'WORKING' : 'PARTIAL'} />
                <ConfidenceMeter value={0.88} type="rule" />
              </div>
              <p className="text-xs text-stone-500">
                {healthBreakdown?.status === 'COMPUTED'
                  ? t('dashboard.based_on_components', { count: healthBreakdown.active_components_count })
                  : t('dashboard.insufficient_data')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {healthBreakdown?.score !== null && healthBreakdown?.score !== undefined ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-2xl font-black text-emerald-900">
                  {healthBreakdown.score}
                </span>
                <span className="text-xs font-bold text-emerald-700">/ 100</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold">
                Insufficient Data
              </div>
            )}
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-bold border border-stone-200 transition-all"
            >
              <span>{showScoreBreakdown ? t('dashboard.hide_breakdown') : t('dashboard.view_breakdown')}</span>
              {showScoreBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Breakdown Modal/View */}
        {showScoreBreakdown && healthBreakdown && (
          <div className="p-4 bg-agri-cream-50 rounded-2xl border border-stone-200 space-y-4">
            <div className="text-xs text-stone-600 font-medium">
              <strong className="text-stone-900">Formula Breakdown:</strong> {healthBreakdown.formula_description}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {healthBreakdown.components.map((comp) => (
                <div
                  key={comp.key}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    comp.status === 'INCLUDED'
                      ? 'bg-white border-emerald-200'
                      : 'bg-stone-100/70 border-stone-200 text-stone-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className={comp.status === 'INCLUDED' ? 'text-stone-900' : 'text-stone-500'}>
                      {comp.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.status === 'INCLUDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span>Nominal Weight: {(comp.nominal_weight * 100).toFixed(0)}%</span>
                    {comp.normalized_weight && (
                      <span className="font-bold text-emerald-700">
                        Active Weight: {(comp.normalized_weight * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {comp.status === 'INCLUDED' ? (
                    <div className="text-sm font-black text-stone-900">
                      Score: {comp.score} / 100
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 italic">
                      {comp.exclusion_reason}
                    </div>
                  )}

                  <p className="text-[11px] text-stone-600 leading-snug">
                    {comp.rationale}
                  </p>
                  <div className="text-[10px] text-stone-400 italic">
                    Thresholds: {comp.threshold_notes}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-stone-500 italic flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{t('dashboard.indicative_weights_notice')}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Domain Intelligence Cards (3-Column Grid): Disease, Irrigation, Yield */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Card A: Crop Protection & Disease */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {t('dashboard.disease_warnings_title')}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status={diseaseOutputs?.status === 'WORKING' ? 'WORKING' : 'PARTIAL'} />
                <ConfidenceMeter value={diseaseOutputs?.confidence || 0.85} type="prediction_confidence" />
              </div>
            </div>

            {diseaseOutputs?.detected_disease ? (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">
                    {diseaseOutputs.detected_disease}
                  </span>
                  <span className="text-stone-600 block text-[11px]">
                    Uncalibrated Confidence: {Math.round((diseaseOutputs.prediction_confidence || 0.85) * 100)}%
                  </span>
                </div>
                {diseaseOutputs.fungal_risk_elevated && (
                  <div className="p-2 bg-red-50 text-red-900 rounded-xl text-[11px] font-medium border border-red-200">
                    Microclimate Fungal Risk: Elevated humidity & rain driver.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                No active leaf disease scan evaluated for this run. Upload a symptomatic leaf photo to test foliar health.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/disease')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-agri-cream-100 hover:bg-agri-cream-200 text-agri-green-900 rounded-2xl text-xs font-bold border border-agri-cream-300 transition-all"
          >
            <span>{t('dashboard.view_disease_tab')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card B: FAO-56 Irrigation Need */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600" />
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {t('dashboard.irrigation_need_title')}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status={irrigationOutputs?.status === 'WORKING' ? 'WORKING' : 'PARTIAL'} />
                <ConfidenceMeter value={irrigationOutputs?.confidence || 0.90} type="rule" />
              </div>
            </div>

            {irrigationOutputs ? (
              <div className="space-y-2 text-xs">
                {irrigationOutputs.rain_skip_applied && (
                  <div className="p-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-bold">
                    {t('dashboard.rain_skip_active')}
                  </div>
                )}
                <div className="flex justify-between p-2.5 bg-sky-50/60 rounded-xl">
                  <span className="text-stone-500 font-medium">{t('dashboard.litres_needed')}:</span>
                  <strong className="text-sky-950 font-bold">
                    {irrigationOutputs.litres_needed ? irrigationOutputs.litres_needed.toLocaleString() : '0'} L
                  </strong>
                </div>
                <div className="flex justify-between p-2.5 bg-sky-50/60 rounded-xl">
                  <span className="text-stone-500 font-medium">{t('dashboard.next_irrigation')}:</span>
                  <strong className="text-stone-800">
                    {irrigationOutputs.next_irrigation_date || 'Today'}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                FAO-56 single Kc water deficit calculation ready. Trigger multi-agent analysis to update soil bucket model.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/irrigation')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-agri-cream-100 hover:bg-agri-cream-200 text-agri-green-900 rounded-2xl text-xs font-bold border border-agri-cream-300 transition-all"
          >
            <span>Open Water Budget</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card C: Headline Yield Projection */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h4 className="font-display text-sm font-bold text-stone-900">
                  {t('dashboard.yield_range_title')}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status="WORKING" />
                <ConfidenceMeter value={0.82} type="heuristic" />
              </div>
            </div>

            {headlineYield ? (
              <div className="space-y-2 text-xs">
                {headlineYield.is_supported ? (
                  <>
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                      <span className="text-[11px] text-stone-500 font-bold block">
                        {t('dashboard.headline_yield')}
                      </span>
                      <span className="text-base font-extrabold text-purple-950 block">
                        {headlineYield.headline_label}
                      </span>
                    </div>
                    {headlineYield.ml_range_lower && headlineYield.ml_range_upper && (
                      <div className="flex justify-between p-2 bg-stone-50 rounded-xl text-[11px]">
                        <span className="text-stone-500">{t('dashboard.ml_range')}:</span>
                        <strong>{headlineYield.ml_range_lower} – {headlineYield.ml_range_upper} q/ac</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-amber-800 block">
                      {t('dashboard.cotton_yield_not_supported')}
                    </span>
                    <p className="text-[11px] text-stone-500">
                      {headlineYield.disclaimer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 italic">
                {t('dashboard.cotton_yield_not_supported')}
              </div>
            )}
          </div>

          <div className="text-[10px] text-stone-400 italic">
            Calibrated on DES Indian crop statistics 1997-2015 per MODEL_CARD.md
          </div>
        </div>
      </div>

      {/* 5. Phase 4 Economics Placeholder Card (Clearly Marked) */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-5 shadow-warm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-stone-400" />
            <h4 className="font-display text-sm font-bold text-stone-900">
              {t('dashboard.economics_title')}
            </h4>
            <StatusBadge status="NOT STARTED" />
          </div>
          <p className="text-xs text-stone-500 max-w-2xl">
            {t('dashboard.economics_placeholder')}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-stone-100 rounded-xl text-xs font-bold text-stone-500 whitespace-nowrap self-start sm:self-auto">
          Phase 4 Feature
        </div>
      </div>

      {/* 6. Coordinated 7-Day Action Plan & Daily Tasks */}
      <div className="bg-white border border-agri-soil-200/80 rounded-3xl p-6 shadow-warm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-agri-gold-100 text-agri-soil-800 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">
                {t('dashboard.seven_day_plan_title')}
              </h3>
              <p className="text-xs text-stone-500">
                Synthesized across Weather, Irrigation, Disease, and Phenology engines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleReadAloudPlan(planItems)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                speechSpeaking
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-agri-cream-100 hover:bg-agri-cream-200 text-agri-green-900 border-agri-cream-300'
              }`}
            >
              {speechSpeaking ? <VolumeX className="w-4 h-4 text-amber-800" /> : <Volume2 className="w-4 h-4 text-agri-green-700" />}
              <span>{speechSpeaking ? t('dashboard.stop_audio') : t('dashboard.read_plan_aloud')}</span>
            </button>
            <StatusBadge status="WORKING" />
            <ConfidenceMeter value={0.88} type="rule" />
          </div>
        </div>

        {voiceNotice && (
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs border border-amber-200">
            {voiceNotice}
          </div>
        )}

        {planItems.length > 0 ? (
          <div className="space-y-3">
            {planItems.map((item) => {
              const localizedAction =
                language === 'te' && item.action_te
                  ? item.action_te
                  : language === 'hi' && item.action_hi
                  ? item.action_hi
                  : item.action;

              const localizedReason =
                language === 'te' && item.reason_te
                  ? item.reason_te
                  : language === 'hi' && item.reason_hi
                  ? item.reason_hi
                  : item.reason;

              return (
                <div
                  key={item.day_number}
                  className="p-4 rounded-2xl border border-stone-200/90 hover:border-agri-gold-400/80 bg-stone-50/50 hover:bg-white transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-agri-green-100 text-agri-green-900 font-extrabold text-xs">
                        {t('dashboard.day')} {item.day_number}
                      </span>
                      <span className="text-xs font-semibold text-stone-500">
                        {item.date_str}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.priority === 'high'
                            ? 'bg-red-100 text-red-900'
                            : item.priority === 'medium'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>Agent: <strong>{item.responsible_agent}</strong></span>
                      {item.translation_status === 'untranslated_marked' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          [en fallback]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-bold text-stone-900">
                    {localizedAction}
                  </div>

                  <div className="p-2.5 bg-agri-cream-50 rounded-xl border border-agri-soil-100/80 text-xs text-agri-soil-900">
                    <strong className="text-agri-green-800">Because:</strong> {localizedReason}
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Source: {item.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-stone-50 rounded-2xl text-center text-xs text-stone-500 space-y-2">
            <p>7-Day coordinated action schedule is ready to synthesize.</p>
            <p>Click "Run Multi-Agent Analysis" below to execute all domain agents and generate today's schedule.</p>
          </div>
        )}

        <div className="text-[11px] text-stone-500 italic p-3 bg-stone-50 rounded-xl">
          {t('dashboard.officer_disclaimer')}
        </div>
      </div>

      {/* 7. Live Autonomous Multi-Agent Flow Diagram */}
      <AgentFlowDiagram
        envelopes={latestRunResult?.envelopes}
        isRunning={isTriggering}
      />

      {/* 8. Live Agent Activity & Execution Log with Transparency */}
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
