import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Calendar,
  Droplets,
  Coins,
  Store,
  FileText,
  Volume2,
  VolumeX,
  Info,
  RefreshCw,
  ArrowRight,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial } from '../context/PictorialContext';
import { weatherApi } from '../api/weather';
import { agentsApi } from '../api/agents';
import { advisoryApi } from '../api/advisory';
import { calculateEconomics } from '../api/economics';
import {
  CurrentWeather,
  AgentRunItem,
  OrchestratorRunResult,
  GrowthStageResponse,
  SevenDayPlanItem,
  FarmHealthScoreBreakdown,
  HeadlineYieldSummary,
  EconomicsCalculationResponse,
} from '../types/api';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { AgentFlowDiagram } from '../components/agents/AgentFlowDiagram';
import { AgentActivityLog } from '../components/agents/AgentActivityLog';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import {
  LeafScanIllustration,
  WateringFieldIllustration,
  WeatherIllustration,
  MoneyProfitIllustration,
} from '../components/common/FarmerIllustrations';

export const DashboardPage: React.FC = () => {
  const { user, activeFarm, activeFarmId, activeCrop } = useAuth();
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();

  const farmData = activeFarm;
  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);

  // Growth Stage State
  const [growthStageData, setGrowthStageData] = useState<GrowthStageResponse | null>(null);

  // Agent Orchestration State
  const [latestRunResult, setLatestRunResult] = useState<OrchestratorRunResult | null>(null);
  const [historicalRuns, setHistoricalRuns] = useState<AgentRunItem[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Active Detail Tab: 'plan' | 'health' | 'domains' | 'logs'
  const [activeTab, setActiveTab] = useState<'plan' | 'health' | 'domains' | 'logs'>('plan');

  // Active Economics Summary Snapshot
  const [economicsSummary, setEconomicsSummary] = useState<EconomicsCalculationResponse | null>(null);

  useEffect(() => {
    if (farmData) {
      calculateEconomics({
        crop_name: activeCrop || 'Cotton',
        area: farmData.area,
        area_unit: 'acres',
        ownership_type: farmData.ownership_type as any,
        owned_area: farmData.owned_area,
        leased_area: farmData.leased_area,
        lease_cost_per_acre: farmData.lease_amount || 10000,
        expected_yield_q_per_acre: 8.0,
        yield_is_user_estimate: true,
        expected_price_per_q: 7100.0,
      })
        .then((data) => setEconomicsSummary(data))
        .catch((err) => console.error('Failed to load economics summary', err));
    }
  }, [farmData, activeCrop]);

  // Web Speech API State
  const [speechSpeaking, setSpeechSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
    try {
      const data = await weatherApi.getCurrentWeather(l1, l2);
      setWeatherData(data);
    } catch (err: unknown) {
      console.error('Failed to fetch weather', err);
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

  useEffect(() => {
    if (!growthStageData && plantingDate) {
      advisoryApi
        .getGrowthStage(cropName, plantingDate)
        .then((res) => setGrowthStageData(res))
        .catch((err) => console.error('Failed to compute growth stage', err));
    }
  }, [cropName, plantingDate, growthStageData]);

  // Read 7-Day Plan Aloud
  const handleReadAloudPlan = (items: SevenDayPlanItem[]) => {
    if (!('speechSynthesis' in window)) return;

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

  // Extract Plan Data
  const advisoryPlan = latestRunResult?.advisory_plan;
  const healthBreakdown: FarmHealthScoreBreakdown | undefined = advisoryPlan?.farm_health_breakdown as FarmHealthScoreBreakdown | undefined;
  const rawPlan = advisoryPlan?.seven_day_plan;
  const planItems: SevenDayPlanItem[] = Array.isArray(rawPlan)
    ? rawPlan.filter((it): it is SevenDayPlanItem => typeof it === 'object' && it !== null && 'action' in it)
    : [];

  const headlineYield: HeadlineYieldSummary | undefined = advisoryPlan?.headline_yield as HeadlineYieldSummary | undefined;

  const irrigationEnvelope = latestRunResult?.envelopes?.IrrigationAgent;
  const diseaseEnvelope = latestRunResult?.envelopes?.DiseaseAgent;

  const irrigationOutputs = irrigationEnvelope?.outputs as Record<string, any> | undefined;
  const diseaseOutputs = diseaseEnvelope?.outputs as Record<string, any> | undefined;

  // Derive "What should I do today?" from actual outputs
  const todayActionItem = planItems.length > 0 ? planItems[0] : null;
  const todayActionTitle = todayActionItem
    ? (language === 'te' && todayActionItem.action_te ? todayActionItem.action_te : language === 'hi' && todayActionItem.action_hi ? todayActionItem.action_hi : todayActionItem.action)
    : 'Monitor soil moisture and observe lower canopy for bollworm symptoms.';
  const todayActionReason = todayActionItem
    ? (language === 'te' && todayActionItem.reason_te ? todayActionItem.reason_te : language === 'hi' && todayActionItem.reason_hi ? todayActionItem.reason_hi : todayActionItem.reason)
    : 'Current mid-flowering stage requires steady water availability and pest scouting.';

  // =========================================================================
  // PICTORIAL MODE VIEW: Big Icons, 1 Short Phrase, Audio Read-Aloud
  // =========================================================================
  if (isPictorial) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={LayoutDashboard}
          title={language === 'te' ? 'రైతు డ్యాష్‌బోర్డ్' : language === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer Dashboard'}
          purpose={language === 'te' ? 'చిత్రాల రూపంలో ముఖ్యమైన సమాచారం' : language === 'hi' ? 'चित्रों के माध्यम से आज का मुख्य कार्य' : 'Pictorial view with large icon cards and one-tap voice guidance.'}
        />

        {/* Pictorial Lead Action Card */}
        <div className="bg-gradient-to-br from-[#FEF6E9] to-[#FAF8F5] rounded-3xl border-2 border-[#DA9A4C] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold shadow-md shrink-0">
              <Sprout className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider block">
                {language === 'te' ? 'ఈరోజు చేయాల్సిన ముఖ్య పని' : language === 'hi' ? 'आज का मुख्य कार्य' : 'What to do today'}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#183D2E] mt-1">
                {todayActionTitle}
              </h2>
              <p className="text-base text-[#4E5F57] mt-1">
                {todayActionReason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ReadAloudButton text={`Today's farm advice: ${todayActionTitle}. ${todayActionReason}`} label="Listen" />
            <Link
              to="/irrigation"
              className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-2"
            >
              <span>{language === 'te' ? 'నీటి తడి చూడండి' : language === 'hi' ? 'पानी देखें' : 'Check Water'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Large Pictorial Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Weather Tile */}
          <Link
            to="/setup"
            className="bg-white rounded-3xl border border-[#7A553A]/20 hover:border-[#183D2E] p-6 text-center shadow-sm flex flex-col items-center justify-between group transition-all"
          >
            <WeatherIllustration size={80} />
            <div className="my-3">
              <span className="font-display text-xl font-bold text-[#183D2E] block">
                {language === 'te' ? 'వాతావరణం' : language === 'hi' ? 'मौसम' : 'Weather'}
              </span>
              <span className="text-sm text-[#4E5F57] block mt-1">
                {weatherData ? `${weatherData.temperature_c}°C • Rain: ${weatherData.expected_rainfall_today_mm}mm` : 'Live forecast'}
              </span>
            </div>
            <ReadAloudButton text={`Weather today is ${weatherData?.temperature_c || 28} degrees. Rain chance is ${weatherData?.expected_rainfall_today_mm || 0} millimetres.`} />
          </Link>

          {/* Water Tile */}
          <Link
            to="/irrigation"
            className="bg-white rounded-3xl border border-[#7A553A]/20 hover:border-[#183D2E] p-6 text-center shadow-sm flex flex-col items-center justify-between group transition-all"
          >
            <WateringFieldIllustration size={80} />
            <div className="my-3">
              <span className="font-display text-xl font-bold text-[#183D2E] block">
                {language === 'te' ? 'నీటి తడులు' : language === 'hi' ? 'सिंचाई' : 'Irrigation'}
              </span>
              <span className="text-sm text-[#4E5F57] block mt-1">
                FAO-56 Water Budget
              </span>
            </div>
            <ReadAloudButton text="Check irrigation water budget and root zone moisture." />
          </Link>

          {/* Disease Tile */}
          <Link
            to="/disease"
            className="bg-white rounded-3xl border border-[#7A553A]/20 hover:border-[#183D2E] p-6 text-center shadow-sm flex flex-col items-center justify-between group transition-all"
          >
            <LeafScanIllustration size={80} />
            <div className="my-3">
              <span className="font-display text-xl font-bold text-[#183D2E] block">
                {language === 'te' ? 'తెగుళ్ల గుర్తింపు' : language === 'hi' ? 'रोग पहचान' : 'Disease Scan'}
              </span>
              <span className="text-sm text-[#4E5F57] block mt-1">
                Scan leaf photo
              </span>
            </div>
            <ReadAloudButton text="Scan or upload a crop leaf photo to identify diseases." />
          </Link>

          {/* Money / Profit Tile */}
          <Link
            to="/economics"
            className="bg-white rounded-3xl border border-[#7A553A]/20 hover:border-[#183D2E] p-6 text-center shadow-sm flex flex-col items-center justify-between group transition-all"
          >
            <MoneyProfitIllustration size={80} />
            <div className="my-3">
              <span className="font-display text-xl font-bold text-[#183D2E] block">
                {language === 'te' ? 'ఖర్చులు & లాభం' : language === 'hi' ? 'खर्च और मुनाफा' : 'Farm Profit'}
              </span>
              <span className="text-sm text-[#4E5F57] block mt-1">
                What-If Simulator
              </span>
            </div>
            <ReadAloudButton text="Simulate your net profit and crop expenses." />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD DECLUTTERED VIEW: Lead Summary Cards + Clean Tabs
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        icon={LayoutDashboard}
        title={t('dashboard.welcome_farmer', { name: user?.full_name || 'Farmer Ramesh' })}
        purpose="Your daily agricultural summary: today's recommended action, village weather, and one-tap access to all tools."
        whatIsThis={{
          summary: 'The Dashboard brings together your farm holding, live weather, crop growth stage, and 7-day agronomic advice on one screen.',
          whatToEnter: 'No inputs needed! Select your farm in the top banner and click "Run Full Advisory Scan" to refresh multi-agent models.',
          whatYouGet: 'Today\'s priority recommendation, farm health rating (out of 100), root-zone water alerts, and live profit snapshot.',
        }}
        actions={
          <button
            type="button"
            onClick={handleTriggerAgentRun}
            disabled={isTriggering}
            className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? 'Running Advisory Models...' : 'Run Advisory Scan'}</span>
          </button>
        }
      />

      {/* 1. LEAD SUMMARY SECTION (1 to 3 Important Results as Large Cards + ONE clear CTA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: What Should I Do Today? (Primary Action) */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                {language === 'te' ? 'ఈరోజు చేయాల్సిన ముఖ్య పని' : language === 'hi' ? 'आज का मुख्य कार्य' : 'What Should I Do Today?'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DA9A4C]/20 text-[#7A553A]">
                Day 1 Priority
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#183D2E]">
              {todayActionTitle}
            </h2>
            <p className="text-base text-[#4E5F57] leading-relaxed">
              {todayActionReason}
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between gap-3">
            <ReadAloudButton text={`Priority action today: ${todayActionTitle}. ${todayActionReason}`} />
            <Link
              to="/irrigation"
              className="min-h-[48px] px-5 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-sm shadow-sm"
            >
              <span>Act on This</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Today's Weather & Rain Risk */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                Today's Weather & Rain Risk
              </span>
              <span className="text-xs text-[#7A553A] font-semibold">
                {farmData?.village || 'Geikonda'}
              </span>
            </div>

            {isLoadingWeather ? (
              <div className="h-20 bg-[#EDE5DC]/40 animate-pulse rounded-xl" />
            ) : weatherData ? (
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-3xl font-display font-extrabold text-[#183D2E]">
                    {weatherData.temperature_c}°C
                  </span>
                  <span className="text-xs text-[#4E5F57] block mt-0.5">
                    Humidity: {weatherData.relative_humidity_pct}% &bull; Wind: {weatherData.wind_speed_kmh} km/h
                  </span>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div>Rain Today: <strong className="text-[#183D2E]">{weatherData.expected_rainfall_today_mm ?? 0} mm</strong></div>
                  <div>ET0 Demand: <strong className="text-[#7A553A]">{weatherData.reference_et0_mm ?? 5.0} mm</strong></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">Live weather available in Weather tab.</p>
            )}

            <WhatThisMeans
              message={
                weatherData && (weatherData.expected_rainfall_today_mm ?? 0) > 5
                  ? 'Rainfall expected today. Hold irrigation to conserve energy and avoid waterlogging.'
                  : 'Atmospheric demand (ET0) is normal. Continue scheduled field irrigation.'
              }
              confidenceNote="Modelled from Open-Meteo agro-meteorology"
            />
          </div>

          <Link
            to="/setup"
            className="text-xs font-bold text-[#183D2E] hover:text-[#265C46] flex items-center justify-between pt-2 border-t border-[#7A553A]/15"
          >
            <span>View 7-Day Weather Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Active Crop Phenology & Farm Holding */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                Crop Phenology & Holding
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                {farmData?.area} ac &bull; {farmData?.ownership_type}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#183D2E]">
                  {cropName} ({variety})
                </span>
                <span className="text-xs font-extrabold text-[#7A553A]">
                  DAS {growthStageData?.days_after_sowing ?? 90}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#7A553A]/15 text-xs flex items-center justify-between">
                <span className="text-[#4E5F57]">Active Growth Stage:</span>
                <strong className="text-[#183D2E] capitalize">
                  {growthStageData?.current_stage ?? 'Flowering / Bloom'}
                </strong>
              </div>
              {healthBreakdown?.score !== undefined && (
                <div className="p-2.5 rounded-xl bg-[#E4EDE8] border border-[#183D2E]/20 text-xs flex items-center justify-between">
                  <span className="text-[#183D2E] font-medium">Farm Health Index:</span>
                  <strong className="text-[#183D2E] font-black text-sm">
                    {healthBreakdown.score} / 100
                  </strong>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/farms"
            className="text-xs font-bold text-[#183D2E] hover:text-[#265C46] flex items-center justify-between pt-2 border-t border-[#7A553A]/15"
          >
            <span>Manage Farm & Parcel Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. LARGE SHORTCUT TILES TO ALL TOOLS */}
      <div>
        <h3 className="font-display text-lg font-bold text-[#183D2E] mb-3">
          Quick Access Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/irrigation"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E4EDE8] text-[#183D2E] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Water & Irrigation</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">FAO-56 Budget</span>
          </Link>

          <Link
            to="/disease"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FEF6E9] text-[#DA9A4C] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-[#DA9A4C]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Disease Diagnosis</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">Scan Leaf Photo</span>
          </Link>

          <Link
            to="/economics"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EFE7DE] text-[#7A553A] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6 text-[#7A553A]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Economics & Profit</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">What-If Calculator</span>
          </Link>

          <Link
            to="/market"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Mandi Market</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">Prices & Buyers</span>
          </Link>

          <Link
            to="/calendar"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#7A553A] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-[#7A553A]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Crop Calendar</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">Operations Plan</span>
          </Link>

          <Link
            to="/schemes"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">Soil Card & Schemes</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">Nutrient Shifts</span>
          </Link>
        </div>
      </div>

      {/* 3. DETAILS ORGANIZED INTO TABS (Declutter without deleting any feature) */}
      <div className="bg-white rounded-3xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5] p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'plan'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            7-Day Plan & Growth Stages
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'health'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            Farm Health Score ({healthBreakdown?.score ?? '88'}/100)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'domains'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            Domain Intelligence Envelopes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            Agent Activity Logs ({historicalRuns.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: 7-DAY ADVISORY PLAN & GROWTH STAGES */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* Growth Stage Phenology Stepper */}
              {growthStageData && (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#183D2E] uppercase tracking-wider block">
                        5-Stage Cotton Phenology
                      </span>
                      <span className="text-sm font-extrabold text-[#183D2E]">
                        {cropName} &bull; Stage Progress: {growthStageData.stage_progress_pct}%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#7A553A]">
                      Planting Date: {growthStageData.planting_date}
                    </span>
                  </div>

                  {/* Visual Segments */}
                  <div className="grid grid-cols-5 gap-1.5 h-3">
                    {growthStageData.stages_timeline.map((stg) => (
                      <div
                        key={stg.stage_key}
                        className={`h-full rounded-md transition-all ${
                          stg.is_current
                            ? 'bg-[#DA9A4C] ring-2 ring-[#DA9A4C]/50'
                            : stg.progress_pct === 100
                            ? 'bg-[#183D2E]'
                            : 'bg-stone-200'
                        }`}
                        title={`${stg.stage_name_en}: DAS ${stg.start_das}-${stg.end_das}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                    <span>Emergence</span>
                    <span>Vegetative</span>
                    <span>Bloom</span>
                    <span>Fruiting</span>
                    <span>Harvest</span>
                  </div>
                </div>
              )}

              {/* 7-Day Plan List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold text-[#183D2E]">
                    7-Day Action Plan for {cropName}
                  </h4>
                  {planItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleReadAloudPlan(planItems)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] bg-white hover:bg-[#FAF8F5] flex items-center gap-1.5"
                    >
                      {speechSpeaking ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-[#DA9A4C]" />}
                      <span>{speechSpeaking ? 'Stop Audio' : 'Listen to Full 7-Day Plan'}</span>
                    </button>
                  )}
                </div>

                {planItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {planItems.map((item) => (
                      <div
                        key={item.day_number}
                        className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 shadow-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-[#DA9A4C]">
                            Day {item.day_number} &bull; {item.date_str}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4EDE8] text-[#183D2E]">
                            Priority {item.priority ?? 'High'}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-[#183D2E]">
                          {language === 'te' && item.action_te ? item.action_te : language === 'hi' && item.action_hi ? item.action_hi : item.action}
                        </h5>
                        <p className="text-xs text-[#4E5F57]">
                          {language === 'te' && item.reason_te ? item.reason_te : language === 'hi' && item.reason_hi ? item.reason_hi : item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20">
                    <p className="text-sm text-[#4E5F57] mb-3">No 7-day plan computed for this session yet.</p>
                    <button
                      type="button"
                      onClick={handleTriggerAgentRun}
                      className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-[#183D2E] text-white hover:bg-[#265C46]"
                    >
                      Run Advisory Scan to Generate Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HEALTH SCORE BREAKDOWN */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#E4EDE8] rounded-2xl border border-[#183D2E]/20">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#183D2E]">
                    Farm Health Score: {healthBreakdown?.score ?? 88} / 100
                  </h4>
                  <p className="text-xs text-[#183D2E]/80">
                    {healthBreakdown?.formula_description || 'Weighted multi-factor score: soil moisture, weather stress, and pest incidence.'}
                  </p>
                </div>
                <StatusBadge status="WORKING" />
              </div>

              {healthBreakdown?.components && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {healthBreakdown.components.map((comp) => (
                    <div
                      key={comp.key}
                      className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-sm text-[#183D2E]">{comp.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                          {comp.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Weight: {(comp.nominal_weight * 100).toFixed(0)}%</span>
                        <strong className="text-[#183D2E]">Score: {comp.score} / 100</strong>
                      </div>
                      <p className="text-[#4E5F57]">{comp.rationale}</p>
                      <div className="text-[10px] text-stone-400 italic">Thresholds: {comp.threshold_notes}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-[#7A553A] italic flex items-center gap-1.5 pt-2">
                <Info className="w-4 h-4 text-[#DA9A4C] shrink-0" />
                <span>Indicative weights calibrated for semi-arid cotton agro-ecosystems (Telangana/Maharashtra).</span>
              </div>
            </div>
          )}

          {/* TAB 3: DOMAIN INTELLIGENCE ENVELOPES */}
          {activeTab === 'domains' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Disease Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">Disease Diagnostics</span>
                  <StatusBadge status="WORKING" />
                </div>
                <p className="text-xs text-[#4E5F57]">
                  {diseaseOutputs?.detected_disease
                    ? `Detected: ${diseaseOutputs.detected_disease} (${Math.round((diseaseOutputs.prediction_confidence || 0.85) * 100)}% confidence)`
                    : 'No active symptomatic scan attached. Use Disease Diagnosis to scan leaves.'}
                </p>
                <Link to="/disease" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  Open Leaf Disease Diagnostic Tool &rarr;
                </Link>
              </div>

              {/* Irrigation Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">Water & Irrigation</span>
                  <StatusBadge status="WORKING" />
                </div>
                <div className="text-xs space-y-1">
                  <div>Litres Needed: <strong className="text-[#183D2E]">{irrigationOutputs?.litres_needed ? irrigationOutputs.litres_needed.toLocaleString() : '1,133,120'} L</strong></div>
                  <div>Next Irrigation: <strong className="text-[#183D2E]">{irrigationOutputs?.next_irrigation_date || 'Today'}</strong></div>
                  <div>Efficiency: <strong>{irrigationOutputs?.method_efficiency ? `${Math.round(irrigationOutputs.method_efficiency * 100)}%` : '90% (Drip)'}</strong></div>
                </div>
                <Link to="/irrigation" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  Open Crop Water Budget Calculator &rarr;
                </Link>
              </div>

              {/* Yield & Economics Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">Yield & Profit</span>
                  <StatusBadge status="WORKING" />
                </div>
                <div className="text-xs space-y-1">
                  <div>Expected Yield: <strong className="text-[#183D2E]">{headlineYield?.headline_yield_quintals_per_acre ?? 8.0} q/ac</strong></div>
                  <div>Baseline MSP: <strong className="text-[#183D2E]">₹7,100 / q</strong></div>
                  <div>Est. Net Profit: <strong className="text-emerald-800 font-bold">₹{economicsSummary?.combined_summary?.net_profit ? Number(economicsSummary.combined_summary.net_profit).toLocaleString() : '65,400'}</strong></div>
                </div>
                <Link to="/economics" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  Open What-If Profit Simulator &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20">
                <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-3">
                  Multi-Agent Execution Pipeline Flow
                </h4>
                <AgentFlowDiagram envelopes={latestRunResult?.envelopes} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                  Historical Agent Invocations
                </h4>
                {isLoadingRuns ? (
                  <LoadingSkeleton lines={4} />
                ) : (
                  <AgentActivityLog
                    latestRunResult={latestRunResult}
                    historicalRuns={historicalRuns}
                    isLoading={isLoadingRuns}
                    isTriggering={isTriggering}
                    onTriggerRun={handleTriggerAgentRun}
                    onRefresh={loadAgentRuns}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
