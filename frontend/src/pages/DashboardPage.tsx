import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Sun,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial, useShowListen } from '../context/PictorialContext';
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
import { speakText, SupportedLanguage } from '../services/speech';
import { translateBackendString } from '../utils/safeTranslation';
import { parseSafeNumber, formatCurrency } from '../utils/numberUtils';
import {
  LeafScanIllustration,
  WateringCanIllustration,
  WaterDropsGauge,
  ThermometerGauge,
  CoinStackGauge,
  FarmHealthMeter,
  NoDataIllustration,
} from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StepFlow } from '../components/common/StepFlow';

export const DashboardPage: React.FC = () => {
  const { user, activeFarm, activeFarmId, activeCrop } = useAuth();
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();
  const showListen = useShowListen();

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
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speechSpeaking) {
      window.speechSynthesis.cancel();
      setSpeechSpeaking(false);
      return;
    }

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

    const fullScript = `Grow2Gain Farm Advisory Plan for ${cropName}. ` + spokenLines.join('. ');

    const speech = speakText(fullScript, language as SupportedLanguage, {
      customVoice: matchedVoice,
      onStart: () => setSpeechSpeaking(true),
      onEnd: () => setSpeechSpeaking(false),
      onError: () => setSpeechSpeaking(false),
    });

    if (!speech.voiceFound && language !== 'en') {
      setSpeechSpeaking(false);
    }
  };

  // Extract Plan Data
  const advisoryPlan = latestRunResult?.advisory_plan;
  const rawHealth = advisoryPlan?.farm_health_breakdown || (typeof advisoryPlan?.farm_health_score === 'object' ? advisoryPlan.farm_health_score : null);
  const healthBreakdown: FarmHealthScoreBreakdown | undefined = (
    rawHealth && typeof rawHealth === 'object'
      ? rawHealth
      : undefined
  ) as FarmHealthScoreBreakdown | undefined;
  const isInsufficientHealthData = Boolean(
    (rawHealth as any)?.status === 'INSUFFICIENT_DATA' || (healthBreakdown?.score == null && Boolean(advisoryPlan))
  );
  const rawPlan = advisoryPlan?.seven_day_plan;
  const planItems: SevenDayPlanItem[] = Array.isArray(rawPlan)
    ? rawPlan.filter((it): it is SevenDayPlanItem => typeof it === 'object' && it !== null && 'action' in it)
    : [];

  const headlineYield: HeadlineYieldSummary | undefined = advisoryPlan?.headline_yield as HeadlineYieldSummary | undefined;

  const irrigationEnvelope = latestRunResult?.envelopes?.IrrigationAgent;
  const diseaseEnvelope = latestRunResult?.envelopes?.DiseaseAgent;

  const irrigationOutputs = irrigationEnvelope?.outputs as Record<string, any> | undefined;
  const diseaseOutputs = diseaseEnvelope?.outputs as Record<string, any> | undefined;

  // Derive "What should I do today?" strictly from actual outputs
  const todayActionItem = planItems.length > 0 ? planItems[0] : null;

  // Real advisory fields or honest awaiting run state - NO invented thresholds
  const hasIrrigationBackend = irrigationOutputs != null && typeof irrigationOutputs.irrigate_now === 'boolean';
  const isIrrigateNow = Boolean(irrigationOutputs?.irrigate_now);
  const recDepthMm = Number(irrigationOutputs?.recommended_depth_mm ?? 0);

  let todayActionTitle = language === 'te'
    ? 'ఈరోజు సలహా ఇంకా సిద్ధం కాలేదు'
    : language === 'hi'
    ? 'आज की सलाह अभी उपलब्ध नहीं है'
    : 'No Advisory Generated Yet';

  let todayActionReason = language === 'te'
    ? 'ఈరోజు పనుల ప్రణాళిక పొందడానికి మల్టీ-ఏజెంట్ అడ్వైజరీని రన్ చేయండి.'
    : language === 'hi'
    ? 'आज की व्यक्तिगत कार्य योजना के लिए Multi-Agent सलाह चलाएं।'
    : 'Click Run Advisory below to analyze live field conditions and generate today\'s action.';

  if (todayActionItem && hasIrrigationBackend) {
    todayActionTitle = language === 'te' && todayActionItem.action_te
      ? todayActionItem.action_te
      : language === 'hi' && todayActionItem.action_hi
      ? todayActionItem.action_hi
      : todayActionItem.action;

    todayActionReason = language === 'te' && todayActionItem.reason_te
      ? todayActionItem.reason_te
      : language === 'hi' && todayActionItem.reason_hi
      ? todayActionItem.reason_hi
      : todayActionItem.reason;

    // Resolve any contradiction strictly using backend irrigate_now and recommended_depth_mm
    if (!isIrrigateNow && todayActionTitle.toLowerCase().includes('irrigate')) {
      todayActionTitle = language === 'te'
        ? 'నేలలో తేమను పరిశీలించండి'
        : language === 'hi'
        ? 'मिट्टी की नमी का निरीक्षण करें'
        : 'Inspect soil moisture (adequate reserves)';
      todayActionReason = language === 'te'
        ? `నేలలో తేమ సరిపడా ఉంది (సిఫార్సు లోతు: ${recDepthMm} మి.మీ). ఈరోజు నీరు పెట్టవలసిన అవసరం లేదు.`
        : language === 'hi'
        ? `मिट्टी में नमी पर्याप्त है (सिफारिश गहराई: ${recDepthMm} मिमी)। आज सिंचाई की आवश्यकता नहीं है।`
        : `Backend irrigation model indicates no watering needed today (${recDepthMm} mm recommended depth).`;
    }
  }

  // =========================================================================
  // PICTORIAL MODE VIEW: Big Icons, 1 Short Phrase, Audio Read-Aloud
  // =========================================================================
  if (isPictorial) {
    const hasWeather = Boolean(weatherData && weatherData.temperature_c != null);
    const weatherTemp = weatherData?.temperature_c;
    const weatherRain = weatherData?.expected_rainfall_today_mm ?? 0;

    const hasIrrigation = Boolean(irrigationOutputs && (irrigationOutputs.root_zone_depletion_mm != null || irrigationOutputs.recommended_depth_mm != null));
    const effectiveWaterDepth = irrigationOutputs?.root_zone_depletion_mm ?? (irrigationOutputs?.recommended_depth_mm ?? 0);

    const hasDiseaseData = Boolean(diseaseOutputs && diseaseOutputs.detected !== undefined);
    const hasDisease = Boolean(diseaseOutputs?.detected);

    const parsedProfit = parseSafeNumber(economicsSummary?.combined_summary?.net_profit, null);
    const hasEconomics = parsedProfit !== null && economicsSummary != null;
    const estProfit = parsedProfit ?? 0;

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={LayoutDashboard}
          title={language === 'te' ? 'రైతు డ్యాష్‌బోర్డ్' : language === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer Dashboard'}
          purpose={language === 'te' ? 'చిత్రాల రూపంలో ముఖ్యమైన సమాచారం' : language === 'hi' ? 'चित्रों के माध्यम से आज का मुख्य कार्य' : 'Pictorial view with large icon cards and one-tap voice guidance.'}
        />

        {/* Lead "Do This Today" Picture Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#FFF8E1] border-2 border-[#F2B01E] flex items-center justify-center shrink-0 shadow-sm">
              {todayActionItem && hasIrrigationBackend ? (
                isIrrigateNow ? <WateringCanIllustration size={64} /> : <LeafScanIllustration size={64} />
              ) : (
                <NoDataIllustration size={64} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {language === 'te' ? 'ఈరోజు చేయాల్సిన పని' : language === 'hi' ? 'आज का मुख्य कार्य' : 'Do This Today'}
                </span>
                <StatusBadge
                  status={todayActionItem && hasIrrigationBackend ? 'warning' : 'nodata'}
                  label={todayActionItem && hasIrrigationBackend ? (language === 'te' ? 'ముఖ్యమైన పని' : language === 'hi' ? 'प्राथमिकता' : 'Priority Action') : (language === 'te' ? 'సలహా పెండింగ్' : language === 'hi' ? 'लंबित' : 'Awaiting Run')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug">
                {todayActionTitle}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {todayActionReason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <ReadAloudButton
              text={`${todayActionTitle}. ${todayActionReason}`}
              label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
            />
            {todayActionItem && hasIrrigationBackend ? (
              <Link
                to={isIrrigateNow ? '/irrigation' : '/disease'}
                className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all"
              >
                <span>{isIrrigateNow ? (language === 'te' ? 'నీటి తడి చూడండి' : language === 'hi' ? 'पानी देखें' : 'Check Water') : (language === 'te' ? 'వివరాలు చూడండి' : language === 'hi' ? 'विवरण देखें' : 'View Action')}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleTriggerAgentRun}
                disabled={isTriggering}
                className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all disabled:opacity-60"
              >
                <Sparkles className={`w-5 h-5 ${isTriggering ? 'animate-spin' : 'text-[#F2B01E]'}`} />
                <span>{isTriggering ? (language === 'te' ? 'విశ్లేషిస్తోంది...' : language === 'hi' ? 'विश्लेषण जारी...' : 'Analyzing...') : (language === 'te' ? 'సలహా ప్రారంభించండి' : language === 'hi' ? 'सलाह शुरू करें' : 'Run Advisory')}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Large Pictorial Tiles with REAL-Value Gauges or Grey No-Data Fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-start">
          {/* Tile 1: Weather & Temperature */}
          <PictorialTile
            title={language === 'te' ? 'వాతావరణం' : language === 'hi' ? 'मौसम' : 'Weather'}
            phrase={hasWeather ? `${weatherTemp}°C • ${weatherRain > 0 ? `${weatherRain}mm Rain` : (language === 'te' ? 'ఎండగా ఉంది' : language === 'hi' ? 'मौसम साफ' : 'Clear Sky')}` : (language === 'te' ? 'వాతావరణ వివరాలు లేవు' : language === 'hi' ? 'मौसम डेटा उपलब्ध नहीं' : 'No weather data yet')}
            illustration={hasWeather ? <ThermometerGauge tempC={weatherTemp!} /> : <NoDataIllustration size={80} />}
            status={hasWeather ? (weatherRain > 0 ? 'info' : 'success') : 'nodata'}
            statusWord={hasWeather ? (weatherRain > 0 ? (language === 'te' ? 'వర్ష సూచన' : language === 'hi' ? 'बारिश संभव' : 'Rain Likely') : (language === 'te' ? 'ఎండ & పొడి' : language === 'hi' ? 'धूप और साफ' : 'Dry & Warm')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasWeather ? `Weather is ${weatherTemp} degrees celsius. Rain forecast is ${weatherRain} millimetres.` : 'No weather forecast data loaded yet.'}
            detailsLink="/setup"
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 2: Water Demand */}
          <PictorialTile
            title={language === 'te' ? 'నీటి తడులు' : language === 'hi' ? 'सिंचाई' : 'Irrigation'}
            phrase={hasIrrigation ? (isIrrigateNow ? (language === 'te' ? 'పొలానికి నీరు పెట్టాలి' : language === 'hi' ? 'सिंचाई की आवश्यकता है' : 'Irrigate today') : (language === 'te' ? 'నేలలో తగినంత తేమ ఉంది' : language === 'hi' ? 'मिट्टी में पर्याप्त नमी है' : 'Moisture is adequate')) : (language === 'te' ? 'నీటి లెక్కలు ఇంకా చేయలేదు' : language === 'hi' ? 'सिंचाई गणना उपलब्ध नहीं' : 'No irrigation run yet')}
            illustration={hasIrrigation ? <WaterDropsGauge dropsCount={effectiveWaterDepth > 25 ? 4 : effectiveWaterDepth > 15 ? 3 : 2} /> : <NoDataIllustration size={80} />}
            status={hasIrrigation ? (isIrrigateNow ? 'warning' : 'success') : 'nodata'}
            statusWord={hasIrrigation ? (isIrrigateNow ? (language === 'te' ? 'నీరు అవసరం' : language === 'hi' ? 'पानी चाहिए' : 'Water Soon') : (language === 'te' ? 'తేమ సరిపోయింది' : language === 'hi' ? 'नमी पर्याप्त' : 'Moist Soil')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasIrrigation ? `Irrigation water depletion is ${effectiveWaterDepth} millimetres. ${isIrrigateNow ? 'Watering is required.' : 'Soil moisture is currently adequate.'}` : 'No irrigation calculation yet. Run multi-agent advisory to compute water balance.'}
            detailsLink="/irrigation"
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 3: Leaf & Crop Health */}
          <PictorialTile
            title={language === 'te' ? 'పంట ఆరోగ్యం' : language === 'hi' ? 'फसल स्वास्थ्य' : 'Crop Health'}
            phrase={hasDiseaseData ? (hasDisease ? (language === 'te' ? 'తెగులు గుర్తించబడింది' : language === 'hi' ? 'कीट या रोग पाया गया' : 'Pest spots observed') : (language === 'te' ? 'ఆకు ఆరోగ్యంగా ఉంది' : language === 'hi' ? 'पत्ती स्वस्थ है' : 'Canopy green & healthy')) : (language === 'te' ? 'ఆకు ఫోటో ఇంకా తీయలేదు' : language === 'hi' ? 'पत्ती का फोटो अभी नहीं लिया' : 'No leaf scanned yet')}
            illustration={hasDiseaseData ? <LeafScanIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasDiseaseData ? (hasDisease ? 'danger' : 'success') : 'nodata'}
            statusWord={hasDiseaseData ? (hasDisease ? (language === 'te' ? 'తెగులు హెచ్చరిక' : language === 'hi' ? 'रोग चेतावनी' : 'Pest Alert') : (language === 'te' ? 'ఆరోగ్యకరం' : language === 'hi' ? 'स्वस्थ' : 'Clean Canopy')) : (language === 'te' ? 'స్కాన్ లేదు' : language === 'hi' ? 'स्कैन नहीं' : 'No scan yet')}
            spokenText={hasDiseaseData ? (hasDisease ? 'Pest detected. Open disease scanner for organic IPM treatment.' : 'Canopy is healthy with no disease symptoms detected.') : 'No crop leaf has been scanned yet. Tap to take or upload a leaf photo.'}
            detailsLink="/disease"
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 4: Farm Economics / Profit */}
          <PictorialTile
            title={language === 'te' ? 'ఖర్చులు & లాభం' : language === 'hi' ? 'खर्च और मुनाफा' : 'Farm Profit'}
            phrase={hasEconomics ? `Net: ${formatCurrency(estProfit, 'No data yet')}` : (language === 'te' ? 'ఆదాయం వివరాలు లేవు' : language === 'hi' ? 'मुनाफा डेटा नहीं है' : 'No profit loaded')}
            illustration={hasEconomics ? <CoinStackGauge netProfit={estProfit} /> : <NoDataIllustration size={80} />}
            status={hasEconomics ? (estProfit >= 0 ? 'success' : 'danger') : 'nodata'}
            statusWord={hasEconomics ? (language === 'te' ? 'నమూనా లెక్క' : language === 'hi' ? 'मॉडल किया गया' : 'Modelled') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasEconomics ? `Estimated net profit is rupees ${Math.round(estProfit)}. Modelled calculation based on yield and market price.` : 'No profit estimate loaded yet.'}
            detailsLink="/economics"
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>

        {/* Real Farm Health Meter or Honest Awaiting Run Placeholder */}
        <div className="bg-white rounded-3xl border-2 border-[#D9D4C7] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="font-display text-[20px] font-bold text-[#1B5E3B]">
                {language === 'te' ? 'మొత్తం పొలం రేటింగ్' : language === 'hi' ? 'खेत समग्र स्कोर' : 'Overall Farm Health'}
              </h3>
              <StatusBadge
                status={healthBreakdown?.score != null ? 'info' : 'nodata'}
                label={
                  isInsufficientHealthData
                    ? 'INSUFFICIENT_DATA'
                    : healthBreakdown?.score != null
                    ? (language === 'te' ? 'బహుళ-కారక అంచనా' : language === 'hi' ? 'बहु-घटक मूल्यांकित' : 'Multi-Agent Evaluated')
                    : (language === 'te' ? 'సలహా పెండింగ్' : language === 'hi' ? 'लंबित' : 'Awaiting Run')
                }
                size="sm"
              />
            </div>
            <p className="text-[16px] text-[#4A5750]">
              {healthBreakdown?.score != null
                ? `Health Score: ${healthBreakdown.score}/100 (Advisory model)`
                : isInsufficientHealthData
                ? (language === 'te' ? 'డేటా చాలదు (కనీసం 3 కొలతలు అవసరం)' : language === 'hi' ? 'डेटा अपर्याप्त (न्यूनतम 3 घटक आवश्यक)' : 'INSUFFICIENT_DATA (Requires >= 3 telemetry components)')
                : (language === 'te' ? 'సమగ్ర స్కోరు ఇంకా సిద్ధం కాలేదు (సలహాను రన్ చేయండి)' : language === 'hi' ? 'समग्र स्कोर अभी उपलब्ध नहीं (सलाह चलाएं)' : 'No score yet (Run advisory to calculate)')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {healthBreakdown?.score != null ? (
              <FarmHealthMeter score={healthBreakdown.score} />
            ) : (
              <NoDataIllustration size={64} />
            )}
            <ReadAloudButton
              text={healthBreakdown?.score != null
                ? `Farm health score is ${healthBreakdown.score} out of 100.`
                : isInsufficientHealthData
                ? 'Insufficient telemetry data to calculate farm health score. Minimum three components required.'
                : 'Farm health score has not been evaluated yet. Run the multi-agent advisory to compute score.'}
              label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
            />
          </div>
        </div>

        {/* 3-Step Daily Routine Flow */}
        <StepFlow
          heading={language === 'te' ? 'ఈరోజు అనుసరించాల్సిన 3 దశలు' : language === 'hi' ? 'आज के 3 सरल कदम' : '3 Simple Steps for Your Farm Today'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'వాతావరణం చూడండి' : language === 'hi' ? 'मौसम जांचें' : 'Check Weather',
              desc: language === 'te' ? 'ఉష్ణోగ్రత మరియు వర్షం సూచన గమనించండి' : language === 'hi' ? 'तापमान और बारिश का पूर्वानुमान देखें' : 'Review rain and temperature forecast',
              icon: Sun,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'ఆకులను గమనించండి' : language === 'hi' ? 'पत्तियों की जांच' : 'Inspect Leaves',
              desc: language === 'te' ? 'తెగుళ్లు లేదా మచ్చలు కనిపిస్తే ఫోటో తీయండి' : language === 'hi' ? 'कीट या धब्बे दिखने पर फोटो लें' : 'Look for pest spots or dry canopy',
              icon: Leaf,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'సరిపడా నీరు ఇవ్వండి' : language === 'hi' ? 'जरूरत अनुसार पानी' : 'Irrigate if Dry',
              desc: language === 'te' ? 'సిఫార్సు ప్రకారం తడులు ఇవ్వండి' : language === 'hi' ? 'सिफारिश के अनुसार पानी दें' : 'Apply water only when irrigation model indicates root stress',
              icon: Droplets,
            },
          ]}
        />
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
        purpose={
          language === 'te'
            ? 'మీ రోజువారీ వ్యవసాయ సారాంశం: నేటి సిఫార్సు చేయబడిన పని, గ్రామ వాతావరణం, మరియు అన్ని సాధనాలు.'
            : language === 'hi'
            ? 'आपका दैनिक कृषि सारांश: आज की अनुशंसित कार्रवाई, मौसम पूर्वानुमान, और सभी उपकरण।'
            : "Your daily agricultural summary: today's recommended action, village weather, and one-tap access to all tools."
        }
        whatIsThis={{
          summary:
            language === 'te'
              ? 'డ్యాష్‌బోర్డ్ మీ పొలం వివరాలు, ప్రత్యక్ష వాతావరణం, పంట ఎదుగుదల దశ మరియు 7-రోజుల వ్యవసాయ సలహాలను ఒకే చోట అందిస్తుంది.'
              : language === 'hi'
              ? 'डैशबोर्ड आपके खेत के विवरण, मौसम, फसल वृद्धि चरण और 7-दिवसीय कृषि सलाह को एक स्थान पर लाता है।'
              : 'The Dashboard brings together your farm holding, live weather, crop growth stage, and 7-day agronomic advice on one screen.',
          whatToEnter:
            language === 'te'
              ? 'ఎలాంటి నమోదు అవసరం లేదు! పై బ్యానర్‌లో మీ పొలాన్ని ఎంచుకుని, "పూర్తి అడ్వైజరీ స్కాన్" బటన్‌పై నొక్కండి.'
              : language === 'hi'
              ? 'किसी इनपुट की आवश्यकता नहीं! ऊपर बैनर में अपना खेत चुनें और "सलाहकार स्कैन चलाएं" पर क्लिक करें।'
              : 'No inputs needed! Select your farm in the top banner and click "Run Full Advisory Scan" to refresh multi-agent models.',
          whatYouGet:
            language === 'te'
              ? 'నేటి ప్రాధాన్యత సిఫార్సు, పొలం ఆరోగ్య రేటింగ్ (100 కి), నీటి హెచ్చరికలు మరియు లాభాల నమూనా.'
              : language === 'hi'
              ? 'आज की प्राथमिकता सिफारिश, खेत स्वास्थ्य स्कोर (100 में से), जल तनाव अलर्ट और अनुमानित लाभ।'
              : "Today's priority recommendation, farm health rating (out of 100), root-zone water alerts, and live profit snapshot.",
        }}
        actions={
          <button
            type="button"
            onClick={handleTriggerAgentRun}
            disabled={isTriggering}
            className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? (language === 'te' ? 'మోడల్స్ నడుస్తున్నాయి...' : language === 'hi' ? 'मॉडल चल रहे हैं...' : 'Running Advisory Models...') : (language === 'te' ? 'అడ్వైజరీ స్కాన్' : language === 'hi' ? 'सलाहकार स्कैन चलाएं' : 'Run Advisory Scan')}</span>
          </button>
        }
      />

      {/* 1. LEAD SUMMARY SECTION (1 to 3 Important Results as Large Cards + ONE clear CTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: What Should I Do Today? (Primary Action) */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                {language === 'te' ? 'ఈరోజు చేయాల్సిన ముఖ్య పని' : language === 'hi' ? 'आज का मुख्य कार्य' : 'What Should I Do Today?'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                todayActionItem && hasIrrigationBackend ? 'bg-[#DA9A4C]/20 text-[#7A553A]' : 'bg-stone-200 text-stone-700'
              }`}>
                {todayActionItem && hasIrrigationBackend ? (language === 'te' ? 'రోజు 1 ప్రాధాన్యత' : language === 'hi' ? 'दिन 1 प्राथमिकता' : 'Day 1 Priority') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
              </span>
            </div>
            <h2 className="font-display text-[20px] sm:text-[22px] font-bold text-[#183D2E]">
              {todayActionTitle}
            </h2>
            <p className="text-[14px] sm:text-[15px] text-[#4E5F57] leading-relaxed">
              {todayActionReason}
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between gap-3">
            <ReadAloudButton text={`Priority action today: ${todayActionTitle}. ${todayActionReason}`} />
            <Link
              to="/irrigation"
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs sm:text-sm shadow-sm"
            >
              <span>{t('dashboard.act_on_this', { defaultValue: 'Act on This' })}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Today's Weather & Rain Risk */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('dashboard.weather_rain_risk_title', { defaultValue: "Today's Weather & Rain Risk" })}
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
                  <span className="text-2xl sm:text-[26px] font-display font-extrabold text-[#183D2E]">
                    {weatherData.temperature_c}°C
                  </span>
                  <span className="text-xs text-[#4E5F57] block mt-0.5">
                    {t('dashboard.humidity_label', { defaultValue: 'Humidity:' })} {weatherData.relative_humidity_pct}% &bull; {t('dashboard.wind_label', { defaultValue: 'Wind:' })} {weatherData.wind_speed_kmh} km/h
                  </span>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div>{t('dashboard.rain_today_label', { defaultValue: 'Rain Today:' })} <strong className="text-[#183D2E]">{weatherData.expected_rainfall_today_mm ?? 0} mm</strong></div>
                  <div>{t('dashboard.et0_demand_label', { defaultValue: 'ET0 Demand:' })} <strong className="text-[#7A553A]">{weatherData.reference_et0_mm ?? 5.0} mm</strong></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">{t('dashboard.live_weather_tab_note', { defaultValue: 'Live weather available in Weather tab.' })}</p>
            )}

            <WhatThisMeans
              message={
                weatherData && (weatherData.expected_rainfall_today_mm ?? 0) > 5
                  ? (language === 'te' ? 'ఈరోజు వర్షం పడే అవకాశం ఉంది. భూగర్భ జలాలను ఆదా చేయడానికి నీటి తడిని వాయిదా వేయండి.' : language === 'hi' ? 'आज बारिश का पूर्वानुमान है। भूजल बचाने और जलभराव से बचने हेतु सिंचाई स्थगित करें।' : 'Rainfall expected today. Hold irrigation to conserve energy and avoid waterlogging.')
                  : (language === 'te' ? 'వాతావరణ డిమాండ్ (ET0) సాధారణంగా ఉంది. షెడ్యూల్ ప్రకారం నీటి తడి అందించండి.' : language === 'hi' ? 'वायुमंडलीय मांग (ET0) सामान्य है। निर्धारित खेत सिंचाई जारी रखें।' : 'Atmospheric demand (ET0) is normal. Continue scheduled field irrigation.')
              }
              confidenceNote={language === 'te' ? 'Open-Meteo ఆగ్రో-వాతావరణ నమూనా' : language === 'hi' ? 'Open-Meteo मौसम मॉडल से अनुमानित' : 'Modelled from Open-Meteo agro-meteorology'}
            />
          </div>

          <Link
            to="/setup"
            className="text-xs font-bold text-[#183D2E] hover:text-[#265C46] flex items-center justify-between pt-2 border-t border-[#7A553A]/15"
          >
            <span>{t('dashboard.view_forecast_link', { defaultValue: 'View 7-Day Weather Forecast' })}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Active Crop Phenology & Farm Holding */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('dashboard.crop_phenology_holding_title', { defaultValue: 'Crop Phenology & Holding' })}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                {farmData?.area} ac &bull; {translateBackendString(farmData?.ownership_type, language)}
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
                <span className="text-[#4E5F57]">{t('dashboard.active_growth_stage_label', { defaultValue: 'Active Growth Stage:' })}</span>
                <strong className="text-[#183D2E] capitalize">
                  {translateBackendString(growthStageData?.current_stage ?? 'Flowering / Bloom', language)}
                </strong>
              </div>
              {healthBreakdown?.score !== undefined && (
                <div className="p-2.5 rounded-xl bg-[#E4EDE8] border border-[#183D2E]/20 text-xs flex items-center justify-between">
                  <span className="text-[#183D2E] font-medium">{t('dashboard.farm_health_index_label', { defaultValue: 'Farm Health Index:' })}</span>
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
            <span>{t('dashboard.manage_farm_link', { defaultValue: 'Manage Farm & Parcel Profile' })}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. LARGE SHORTCUT TILES TO ALL TOOLS */}
      <div>
        <h3 className="font-display text-lg font-bold text-[#183D2E] mb-3">
          {t('dashboard.quick_access_tools', { defaultValue: 'Quick Access Tools' })}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/irrigation"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E4EDE8] text-[#183D2E] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.irrigation', { defaultValue: 'Water & Irrigation' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{language === 'te' ? 'FAO-56 బడ్జెట్' : language === 'hi' ? 'FAO-56 बजट' : 'FAO-56 Budget'}</span>
          </Link>

          <Link
            to="/disease"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FEF6E9] text-[#DA9A4C] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-[#DA9A4C]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.disease', { defaultValue: 'Disease Diagnosis' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{language === 'te' ? 'ఆకు ఫోటో స్కాన్' : language === 'hi' ? 'पत्ती फोटो स्कैन' : 'Scan Leaf Photo'}</span>
          </Link>

          <Link
            to="/economics"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EFE7DE] text-[#7A553A] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6 text-[#7A553A]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.economics', { defaultValue: 'Economics & Profit' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{language === 'te' ? 'లాభాల కాలిక్యులేటర్' : language === 'hi' ? 'लाभ कैलकुलेटर' : 'What-If Calculator'}</span>
          </Link>

          <Link
            to="/market"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.market', { defaultValue: 'Mandi Market' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{language === 'te' ? 'ధరలు & కొనుగోలుదారులు' : language === 'hi' ? 'दाम और खरीदार' : 'Prices & Buyers'}</span>
          </Link>

          <Link
            to="/calendar"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#7A553A] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-[#7A553A]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.calendar', { defaultValue: 'Crop Calendar' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{language === 'te' ? 'కార్యకలాపాల ప్రణాళిక' : language === 'hi' ? 'कार्य योजना' : 'Operations Plan'}</span>
          </Link>

          <Link
            to="/schemes"
            className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 hover:border-[#183D2E] shadow-sm flex flex-col items-center text-center transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-[#183D2E]" />
            </div>
            <span className="text-sm font-bold text-[#183D2E] block">{t('nav.schemes', { defaultValue: 'Soil Card & Schemes' })}</span>
            <span className="text-[11px] text-[#4E5F57] mt-0.5">{t('dashboard.nutrient_shifts', { defaultValue: 'Nutrient Shifts' })}</span>
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
            {t('dashboard.tab_plan', { defaultValue: '7-Day Plan & Growth Stages' })}
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
            {t('dashboard.tab_health', { defaultValue: 'Farm Health Score' })} ({healthBreakdown?.score != null ? `${healthBreakdown.score}/100` : isInsufficientHealthData ? 'INSUFFICIENT_DATA' : t('common.no_data_yet', { defaultValue: 'No data yet' })})
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
            {t('dashboard.tab_tool_summary', { defaultValue: 'Tool summary' })}
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
            {t('dashboard.tab_activity_log', { defaultValue: 'Activity log' })} ({historicalRuns.length})
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
                        {t('dashboard.phenology_title', { defaultValue: '5-Stage Cotton Phenology' })}
                      </span>
                      <span className="text-sm font-extrabold text-[#183D2E]">
                        {cropName} &bull; {t('dashboard.stage_progress', { defaultValue: 'Stage Progress' })}: {growthStageData.stage_progress_pct}%
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#7A553A]">
                      {t('dashboard.planting_date_label', { defaultValue: 'Planting Date' })}: {growthStageData.planting_date}
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
                    <span>{t('dashboard.stage_emergence', { defaultValue: 'Emergence' })}</span>
                    <span>{t('dashboard.stage_vegetative', { defaultValue: 'Vegetative' })}</span>
                    <span>{t('dashboard.stage_bloom', { defaultValue: 'Bloom' })}</span>
                    <span>{t('dashboard.stage_fruiting', { defaultValue: 'Fruiting' })}</span>
                    <span>{t('dashboard.stage_harvest', { defaultValue: 'Harvest' })}</span>
                  </div>
                </div>
              )}

              {/* 7-Day Plan List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold text-[#183D2E]">
                    {t('dashboard.seven_day_plan_title', { defaultValue: '7-Day Action Plan' })} - {cropName}
                  </h4>
                  {planItems.length > 0 && showListen && (
                    <button
                      type="button"
                      onClick={() => handleReadAloudPlan(planItems)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] bg-white hover:bg-[#FAF8F5] flex items-center gap-1.5"
                    >
                      {speechSpeaking ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-[#DA9A4C]" />}
                      <span>{speechSpeaking ? t('dashboard.stop_audio', { defaultValue: 'Stop Audio' }) : t('dashboard.read_plan_aloud', { defaultValue: 'Listen to Full 7-Day Plan' })}</span>
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
                            {t('dashboard.day', { defaultValue: 'Day' })} {item.day_number} &bull; {item.date_str}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4EDE8] text-[#183D2E]">
                            {t('common.priority', { defaultValue: 'Priority' })} {translateBackendString(item.priority || 'High', language)}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-[#183D2E]">
                          {language === 'te' && item.action_te ? item.action_te : language === 'hi' && item.action_hi ? item.action_hi : translateBackendString(item.action, language)}
                        </h5>
                        <p className="text-xs text-[#4E5F57]">
                          {language === 'te' && item.reason_te ? item.reason_te : language === 'hi' && item.reason_hi ? item.reason_hi : translateBackendString(item.reason, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20">
                    <p className="text-sm text-[#4E5F57] mb-3">{t('dashboard.no_plan_yet', { defaultValue: 'No 7-day plan computed for this session yet.' })}</p>
                    <button
                      type="button"
                      onClick={handleTriggerAgentRun}
                      className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-[#183D2E] text-white hover:bg-[#265C46]"
                    >
                      {t('dashboard.run_advisory_scan', { defaultValue: 'Run Advisory Scan to Generate Plan' })}
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
                    {t('dashboard.tab_health', { defaultValue: 'Farm Health Score' })}: {healthBreakdown?.score != null ? `${healthBreakdown.score} / 100` : isInsufficientHealthData ? 'INSUFFICIENT_DATA' : t('dashboard.awaiting_run', { defaultValue: 'Awaiting Run (No score yet)' })}
                  </h4>
                  <p className="text-xs text-[#183D2E]/80">
                    {isInsufficientHealthData
                      ? (language === 'te' ? 'ఆరోగ్య స్కోరు లెక్కించడానికి కనీసం 3 విభాగాలు (వాతావరణం, నీరు, తెగుళ్లు మొదలైనవి) అవసరం. ప్రస్తుతం తగినంత డేటా లేదు.' : language === 'hi' ? 'स्वास्थ्य स्कोर की गणना के लिए न्यूनतम 3 घटकों (मौसम, सिंचाई, कीट आदि) का डेटा आवश्यक है। वर्तमान में अपर्याप्त डेटा है।' : 'INSUFFICIENT_DATA: Composite farm health scoring requires telemetry from a minimum of 3 components. Insufficient telemetry received.')
                      : healthBreakdown?.formula_description ? translateBackendString(healthBreakdown.formula_description, language) : (language === 'te' ? 'మోడల్ బహుళ-కారక సూచిక: నేల తేమ, వాతావరణ ఒత్తిడి, మరియు తెగుళ్ల ప్రభావం (వివరాలు ధృవీకరించాలి).' : language === 'hi' ? 'मॉडल बहु-कारक संकेतक: मिट्टी की नमी, मौसम तनाव, और कीट प्रभाव (विवरण सत्यापित करें)।' : 'Modelled multi-factor indicator: soil moisture, weather stress, and pest incidence (details to verify).')}
                  </p>
                </div>
                <StatusBadge status={healthBreakdown?.score != null ? 'WORKING' : 'nodata'} label={isInsufficientHealthData ? 'INSUFFICIENT_DATA' : undefined} />
              </div>

              {healthBreakdown?.components && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {healthBreakdown.components.map((comp) => (
                    <div
                      key={comp.key}
                      className="p-4 rounded-2xl bg-white border border-[#7A553A]/20 shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-sm text-[#183D2E]">{translateBackendString(comp.name, language)}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                          {translateBackendString(comp.status, language)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{t('dashboard.weight_label', { defaultValue: 'Weight:' })} {(comp.nominal_weight * 100).toFixed(0)}%</span>
                        <strong className="text-[#183D2E]">{t('dashboard.score_label', { defaultValue: 'Score:' })} {comp.score} / 100</strong>
                      </div>
                      <p className="text-[#4E5F57]">{translateBackendString(comp.rationale, language)}</p>
                      <div className="text-[10px] text-stone-400 italic">{t('dashboard.thresholds_label', { defaultValue: 'Thresholds:' })} {translateBackendString(comp.threshold_notes, language)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-[#7A553A] italic flex items-center gap-1.5 pt-2">
                <Info className="w-4 h-4 text-[#DA9A4C] shrink-0" />
                <span>{t('dashboard.cotton_phenology_calibrated', { defaultValue: 'Indicative weights calibrated for semi-arid cotton agro-ecosystems (Telangana/Maharashtra).' })}</span>
              </div>
            </div>
          )}

          {/* TAB 3: DOMAIN INTELLIGENCE ENVELOPES / TOOL SUMMARY */}
          {activeTab === 'domains' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Disease Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">{t('dashboard.tool_summary_disease_title', { defaultValue: 'Disease Diagnostics' })}</span>
                  <StatusBadge status="WORKING" />
                </div>
                <p className="text-xs text-[#4E5F57]">
                  {diseaseOutputs?.detected_disease
                    ? `${language === 'te' ? 'గుర్తించబడింది' : language === 'hi' ? 'पहचाना गया' : 'Detected'}: ${translateBackendString(diseaseOutputs.detected_disease, language)} (${Math.round((diseaseOutputs.prediction_confidence || 0.85) * 100)}% ${language === 'te' ? 'విశ్వసనీయత' : language === 'hi' ? 'विश्वसनीयता' : 'confidence'})`
                    : t('dashboard.no_active_scan', { defaultValue: 'No active symptomatic scan attached. Use Disease Diagnosis to scan leaves.' })}
                </p>
                <Link to="/disease" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  {t('dashboard.open_disease_tool', { defaultValue: 'Open Leaf Disease Diagnostic Tool →' })}
                </Link>
              </div>

              {/* Irrigation Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">{t('dashboard.tool_summary_water_title', { defaultValue: 'Water & Irrigation' })}</span>
                  <StatusBadge status="WORKING" />
                </div>
                <div className="text-xs space-y-1.5">
                  <div>
                    <span>{t('dashboard.litres_needed', { defaultValue: 'Litres Needed:' })} </span>
                    <strong className="text-[#183D2E]">
                      {isIrrigateNow && irrigationOutputs?.litres_needed != null
                        ? `${Math.round(Number(irrigationOutputs.litres_needed)).toLocaleString()} L`
                        : (language === 'te' ? 'ఈరోజు నీరు అవసరం లేదు (0 L)' : language === 'hi' ? 'आज सिंचाई की आवश्यकता नहीं (0 L)' : 'No watering needed today (0 L)')}
                    </strong>
                    {isIrrigateNow && (
                      <div className="text-[10px] text-[#4E5F57] bg-white p-1.5 rounded-lg border border-[#7A553A]/15 mt-1 font-mono">
                        {language === 'te' ? 'లెక్కింపు విధానం:' : language === 'hi' ? 'गणना सूत्र:' : 'Derivation:'} depth ({Number(irrigationOutputs?.gross_depth_mm ?? irrigationOutputs?.water_depth_mm ?? 25).toFixed(1)} mm) × 4,046.86 L/(mm·ac) × area ({farmData?.area ?? activeFarm?.area ?? 4.5} ac)
                      </div>
                    )}
                  </div>
                  <div>
                    {t('dashboard.next_irrigation', { defaultValue: 'Next Irrigation:' })}{' '}
                    <strong className="text-[#183D2E]">
                      {irrigationOutputs?.next_irrigation_date
                        ? translateBackendString(irrigationOutputs.next_irrigation_date, language)
                        : (isIrrigateNow
                            ? (language === 'te' ? 'ఈరోజు' : language === 'hi' ? 'आज' : 'Today')
                            : t('common.no_data_yet', { defaultValue: 'No data yet' }))}
                    </strong>
                  </div>
                  <div>
                    {t('dashboard.efficiency_label', { defaultValue: 'Efficiency:' })}{' '}
                    <strong>
                      {irrigationOutputs?.method_efficiency
                        ? `${Math.round(irrigationOutputs.method_efficiency * 100)}%`
                        : (language === 'te' ? '90% (డ్రిప్)' : language === 'hi' ? '90% (ड्रिप)' : '90% (Drip)')}
                    </strong>
                  </div>
                </div>
                <Link to="/irrigation" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  {t('dashboard.open_water_tool', { defaultValue: 'Open Crop Water Budget Calculator →' })}
                </Link>
              </div>

              {/* Yield & Economics Envelope */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
                  <span className="text-xs font-black uppercase text-[#183D2E]">{t('dashboard.tool_summary_profit_title', { defaultValue: 'Yield & Profit' })}</span>
                  <StatusBadge status="WORKING" />
                </div>
                <div className="text-xs space-y-1">
                  <div>{t('dashboard.expected_yield_label', { defaultValue: 'Expected Yield:' })} <strong className="text-[#183D2E]">{headlineYield?.headline_yield_quintals_per_acre ?? 8.0} q/ac</strong></div>
                  <div>{t('dashboard.assumed_price_label', { defaultValue: 'Assumed price (editable, demo):' })} <strong className="text-[#183D2E]">₹7,100 / q</strong> (DEMO DATA &bull; {language === 'te' ? 'వివరాలు ధృవీకరించాలి' : language === 'hi' ? 'विवरण सत्यापित करें' : 'details to verify'})</div>
                  <div>{t('dashboard.est_net_profit_label', { defaultValue: 'Est. Net Profit:' })} <strong className="text-emerald-800 font-bold">{formatCurrency(economicsSummary?.combined_summary?.net_profit, '65,400 (DEMO DATA)')}</strong></div>
                </div>
                <Link to="/economics" className="text-xs font-bold text-[#183D2E] hover:underline block pt-2">
                  {t('dashboard.open_profit_tool', { defaultValue: 'Open What-If Profit Simulator →' })}
                </Link>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20">
                <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-3">
                  {t('dashboard.multi_agent_flow', { defaultValue: 'Multi-Agent Execution Pipeline Flow' })}
                </h4>
                <AgentFlowDiagram envelopes={latestRunResult?.envelopes} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                  {t('dashboard.historical_invocations', { defaultValue: 'Historical Agent Invocations' })}
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
