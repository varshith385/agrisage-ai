import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Droplets,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Info,
  Upload,
  RefreshCw,
  ArrowRight,
  Sprout,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { translateBackendString } from '../utils/safeTranslation';
import { getIrrigationPlan, diagnoseIrrigationIssue } from '../api/irrigation';
import { validateImageFile, compressImage } from '../utils/imageCompressor';
import {
  CurrentCropCycle,
  IrrigationPlanResponse,
  IrrigationDiagnosisResponse,
  IrrigationPlanPayload,
} from '../types/api';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  WateringFieldIllustration,
  WateringCanIllustration,
  WaterDropsGauge,
  NoDataIllustration,
} from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StepFlow } from '../components/common/StepFlow';

const SUPPORTED_CROPS = [
  'Cotton',
  'Rice',
  'Wheat',
  'Maize',
  'Groundnut',
  'Chilli',
  'Tomato',
  'Sugarcane',
  'Soybean',
  'Pulses',
];

const SOIL_TYPES = [
  'Black Cotton',
  'Red Loam',
  'Alluvial',
  'Clay',
  'Sandy Loam',
  'Loam',
];

const IRRIGATION_METHODS = [
  { id: 'drip', name: 'Drip Irrigation', eff: '90%' },
  { id: 'sprinkler', name: 'Sprinkler', eff: '75%' },
  { id: 'furrow', name: 'Furrow', eff: '60%' },
  { id: 'flood', name: 'Flood Irrigation', eff: '50%' },
];

export const IrrigationPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeFarm, activeFarmId } = useAuth();
  const { isPictorial } = usePictorial();

  // Selected parameters synchronized with global activeFarm
  const [cropName, setCropName] = useState<string>('Cotton');
  const [plantingDate, setPlantingDate] = useState<string>(
    new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [soilType, setSoilType] = useState<string>('Black Cotton');
  const [irrigationMethod, setIrrigationMethod] = useState<string>('drip');
  const [areaAcres, setAreaAcres] = useState<number>(2.5);

  // Active Tab for details: 'forecast' | 'params' | 'telemetry' | 'diagnostic'
  const [activeTab, setActiveTab] = useState<'forecast' | 'params' | 'telemetry' | 'diagnostic'>('forecast');

  // Initialize and synchronize parameters from active farm
  useEffect(() => {
    if (activeFarm) {
      setAreaAcres(activeFarm.area || 2.5);
      if (activeFarm.soil_type) setSoilType(activeFarm.soil_type);
      if (activeFarm.irrigation_method) setIrrigationMethod(activeFarm.irrigation_method);

      const activeCycle = activeFarm.current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropName(activeCycle.crop_name);
        if (activeCycle.planting_date) {
          setPlantingDate(activeCycle.planting_date);
        }
      }
    }
  }, [activeFarm]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const [cachedPlan, setCachedPlan] = useState<IrrigationPlanResponse | null>(() => {
    try {
      const stored = localStorage.getItem('agrisage_last_irrigation_plan');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const planPayload: IrrigationPlanPayload = useMemo(() => {
    return {
      farm_id: activeFarmId || activeFarm?.id,
      crop_name: cropName,
      planting_date: plantingDate,
      soil_type: soilType,
      irrigation_method: irrigationMethod,
      area_acres: areaAcres,
    };
  }, [activeFarmId, activeFarm, cropName, plantingDate, soilType, irrigationMethod, areaAcres]);

  const {
    data: planData,
    isLoading: isLoadingPlan,
    isRefetching: isRefetchingPlan,
    refetch: refetchPlan,
  } = useQuery<IrrigationPlanResponse>({
    queryKey: ['irrigationPlan', planPayload],
    queryFn: async () => {
      const res = await getIrrigationPlan(planPayload);
      try {
        localStorage.setItem('agrisage_last_irrigation_plan', JSON.stringify(res));
      } catch {
        // ignore storage errors
      }
      setCachedPlan(res);
      return res;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    enabled: !!cropName,
  });

  const plan = planData || cachedPlan;

  const handleComputeBudget = async () => {
    await refetchPlan();
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Diagnostic Assistant State
  const [problemText, setProblemText] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<IrrigationDiagnosisResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmed] = useState<boolean>(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const val = validateImageFile(file);
      if (!val.valid) {
        setValidationError(val.errorMessage || 'Invalid image file.');
        setPhotoFile(null);
        return;
      }
      setValidationError(null);
      setPhotoFile(file);
      setDiagnosisResult(null);
      diagnoseMutation.reset();
    }
  };

  const diagnoseMutation = useMutation({
    mutationFn: async (confirmOverride?: boolean) => {
      const formData = new FormData();
      if (problemText.trim()) {
        formData.append('text_query', problemText.trim());
      }
      if (photoFile) {
        const compressed = await compressImage(photoFile);
        formData.append('file', compressed);
      }
      if (activeFarmId) {
        formData.append('farm_id', String(activeFarmId));
      }
      formData.append('confirmed', String(confirmOverride ?? isConfirmed));
      formData.append('language', language);
      return diagnoseIrrigationIssue(formData);
    },
    onSuccess: (data) => {
      setDiagnosisResult(data);
    },
    onError: () => {
      setDiagnosisResult(null);
    },
  });

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim() && !photoFile) return;
    diagnoseMutation.mutate();
  };

  // Format 7-day balance chart data
  const chartData = useMemo(() => {
    if (!plan?.daily_forecast_balance) return [];
    return plan.daily_forecast_balance.map((item) => {
      const d = new Date(item.date);
      const dayLabel = d.toLocaleDateString(
        language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
        { weekday: 'short', day: 'numeric' }
      );
      return {
        name: dayLabel,
        rain: item.rain_mm,
        etc: item.etc_mm,
        depletion: item.root_zone_depletion_mm,
        raw: item.raw_mm,
        taw: item.taw_mm,
      };
    });
  }, [plan, language]);

  // Derived plain explanation
  const plainMeaning = plan?.rain_skip_triggered
    ? (language === 'te'
        ? 'వర్ష సూచన పంట అవసరాలకు సరిపోతుంది. విద్యుత్ మరియు మోటారు పనిని ఆదా చేయడానికి ఈరోజు నీటి తడిని ఆపవచ్చు.'
        : language === 'hi'
        ? 'बारिश का पूर्वानुमान फसल की आवश्यकता के लिए पर्याप्त है। बिजली और मोटर बचाने के लिए आज सिंचाई टाल सकते हैं।'
        : 'Rain forecast is sufficient for crop needs. You can skip irrigation today to save electricity and pump wear.')
    : plan?.should_irrigate
    ? (language === 'te'
        ? `వేరు ప్రాంతంలో తేమ ఒత్తిడి స్థాయికి చేరుకుంది. పంటకు తగినంత తేమ అందడానికి సిఫార్సు చేసిన లోతు ${plan.gross_depth_mm.toFixed(0)} mm.`
        : language === 'hi'
        ? `जड़ क्षेत्र की नमी तनाव सीमा तक पहुंच गई है। फसल के लिए अनुशंसित गहराई ${plan.gross_depth_mm.toFixed(0)} mm है।`
        : `Root zone moisture has reached the stress threshold. Recommended depth is ${plan.gross_depth_mm.toFixed(0)} mm to maintain optimal crop transpiration.`)
    : (language === 'te'
        ? `నేలలో తేమ నిల్వలు నేటికి సరిపోతాయి. తదుపరి నీటి తడి తేదీ: ${plan?.next_irrigation_date || 'రానున్న రోజులు'}.`
        : language === 'hi'
        ? `आज के लिए मिट्टी में नमी पर्याप्त है। अगली निर्धारित सिंचाई: ${plan?.next_irrigation_date || 'आगामी दिन'}।`
        : `Soil water reserves are adequate for today. Next scheduled irrigation is on ${plan?.next_irrigation_date || 'upcoming dates'}.`);

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasPlan = Boolean(plan);
    const grossDepth = plan?.gross_depth_mm ?? 0;
    const waterLiters = plan?.litres_needed ?? 0;
    const isWaterNeeded = Boolean(plan?.should_irrigate);
    const isRainSkip = Boolean(plan?.rain_skip_triggered);

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={Droplets}
          title={language === 'te' ? 'నీటి తడుల సమాచారం' : language === 'hi' ? 'सिंचाई और पानी' : 'Water & Irrigation'}
          purpose={language === 'te' ? 'పొలానికి నీరు ఎప్పుడు పెట్టాలో చిత్రాల రూపంలో చూడండి' : language === 'hi' ? 'खेत में पानी कब देना है, सरल रूप में देखें' : 'Pictorial view of crop water budget and irrigation decision.'}
        />

        {/* Lead "Do This Today" Irrigation Decision Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#E1F5FE] border-2 border-[#1565A8] flex items-center justify-center shrink-0 shadow-sm">
              {hasPlan ? <WateringFieldIllustration size={64} /> : <NoDataIllustration size={64} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {language === 'te' ? 'నేటి నిర్ణయం' : language === 'hi' ? 'आज का फैसला' : 'Today\'s Decision'}
                </span>
                <StatusBadge
                  status={hasPlan ? (isRainSkip ? 'info' : isWaterNeeded ? 'warning' : 'success') : 'nodata'}
                  label={hasPlan ? (isRainSkip ? (language === 'te' ? 'వర్షం వల్ల వాయిదా' : language === 'hi' ? 'बारिश के कारण टालें' : 'Rain Skip') : isWaterNeeded ? (language === 'te' ? 'ఈరోజు నీరు పెట్టాలి' : language === 'hi' ? 'सिंचाई करें' : 'Irrigate Today') : (language === 'te' ? 'తేమ సరిపడా ఉంది' : language === 'hi' ? 'नमी पर्याप्त' : 'Water Adequate')) : (language === 'te' ? 'లెక్కించలేదు' : language === 'hi' ? 'गणना नहीं' : 'No Plan Yet')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug">
                {hasPlan
                  ? (isRainSkip
                    ? (language === 'te' ? 'వర్షం వల్ల నీరు పెట్టవద్దు' : language === 'hi' ? 'बारिश के कारण पानी न दें' : 'Skip Irrigation: Rain Expected')
                    : isWaterNeeded
                    ? (language === 'te' ? 'ఈరోజు నీరు పెట్టాలి' : language === 'hi' ? 'आज खेत में पानी दें' : 'Irrigate Today: Root Moisture Low')
                    : (language === 'te' ? 'భూమిలో తేమ సరిపడా ఉంది' : language === 'hi' ? 'मिट्टी में पर्याप्त नमी है' : 'Moisture Adequate: No Water Needed'))
                  : (language === 'te' ? 'నీటి బడ్జెట్ ఇంకా లెక్కించలేదు' : language === 'hi' ? 'जल बजट अभी नहीं निकाला' : 'No Water Budget Calculated Yet')}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {hasPlan
                  ? plainMeaning
                  : (language === 'te' ? 'మీ నేల మరియు పంటకు నీటి బడ్జెట్ లెక్కించడానికి క్రింది బటన్ నొక్కండి.' : language === 'hi' ? 'खेत में पानी की मात्रा निकालने के लिए नीचे दिए गए बटन को दबाएं।' : 'Click Calculate Budget to evaluate FAO-56 daily water balance.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {hasPlan && (
              <ReadAloudButton
                text={plainMeaning}
                label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
              />
            )}
            <button
              type="button"
              onClick={handleComputeBudget}
              disabled={isLoadingPlan || isRefetchingPlan}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 ${isRefetchingPlan ? 'animate-spin' : ''}`} />
              <span>{isRefetchingPlan ? (language === 'te' ? 'లెక్కిస్తోంది...' : language === 'hi' ? 'गणना जारी...' : 'Calculating...') : hasPlan ? (language === 'te' ? 'మళ్లీ లెక్కించండి' : language === 'hi' ? 'फिर से गणना करें' : 'Recalculate Budget') : (language === 'te' ? 'బడ్జెట్ లెక్కించండి' : language === 'hi' ? 'बजट निकालें' : 'Calculate Budget')}</span>
            </button>
          </div>
        </div>

        {/* 3 Large Pictorial Tiles with REAL Values or Honest No-Data Fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-start">
          {/* Tile 1: Water Needed with Drops Gauge */}
          <PictorialTile
            title={language === 'te' ? 'నీటి మోతాదు' : language === 'hi' ? 'पानी की मात्रा' : 'Water Needed'}
            phrase={hasPlan ? `${grossDepth.toFixed(0)} mm • ${Math.round(waterLiters).toLocaleString('en-IN')} L` : (language === 'te' ? 'నీటి మోతాదు ఇంకా తెలియదు' : language === 'hi' ? 'पानी की मात्रा नहीं निकाली' : 'No calculation yet')}
            illustration={hasPlan ? <WaterDropsGauge dropsCount={grossDepth > 25 ? 4 : grossDepth > 15 ? 3 : grossDepth > 0 ? 2 : 1} /> : <NoDataIllustration size={80} />}
            status={hasPlan ? (isWaterNeeded ? 'warning' : 'success') : 'nodata'}
            statusWord={hasPlan ? (isWaterNeeded ? (language === 'te' ? 'నీరు అవసరం' : language === 'hi' ? 'पानी चाहिए' : 'Water Needed') : (language === 'te' ? 'సరిపడా ఉంది' : language === 'hi' ? 'पर्याप्त' : 'Adequate')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasPlan ? `Recommended gross irrigation depth is ${grossDepth.toFixed(0)} millimetres, equal to ${Math.round(waterLiters)} litres for your field area.` : 'No irrigation calculation yet.'}
          />

          {/* Tile 2: Soil Root Zone Status */}
          <PictorialTile
            title={language === 'te' ? 'భూమిలో తేమ' : language === 'hi' ? 'मिट्टी में नमी' : 'Soil Moisture'}
            phrase={hasPlan ? (isRainSkip ? (language === 'te' ? 'వర్ష సూచన ఉంది' : language === 'hi' ? 'बारिश का अनुमान' : 'Rain forecast active') : isWaterNeeded ? (language === 'te' ? 'వేర్లలో తేమ తగ్గింది' : language === 'hi' ? 'जड़ में नमी कम' : 'Root stress reached') : (language === 'te' ? 'నేలలో తేమ సరైనది' : language === 'hi' ? 'सामान्य जल स्तर' : 'Normal water level')) : (language === 'te' ? 'నేలలో తేమ ఇంకా కొలవలేదు' : language === 'hi' ? 'मिट्टी की नमी अभी नहीं मापी' : 'Awaiting soil moisture run')}
            illustration={hasPlan ? <WateringFieldIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasPlan ? (isRainSkip ? 'info' : isWaterNeeded ? 'warning' : 'success') : 'nodata'}
            statusWord={hasPlan ? (isRainSkip ? (language === 'te' ? 'వర్షం వల్ల వాయిదా' : language === 'hi' ? 'बारिश टालें' : 'Rain Skip') : isWaterNeeded ? (language === 'te' ? 'తేమ తగ్గింది' : language === 'hi' ? 'नमी कम' : 'Depleted') : (language === 'te' ? 'సరైన తేమ' : language === 'hi' ? 'उत्तम नमी' : 'Optimal')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasPlan ? `Soil moisture condition: ${isRainSkip ? 'Rain forecast protects soil' : isWaterNeeded ? 'Root zone depletion requires watering' : 'Moisture is in optimal range'}.` : 'Soil moisture has not been calculated yet.'}
          />

          {/* Tile 3: Next Watering Date */}
          <PictorialTile
            title={language === 'te' ? 'తదుపరి తడి' : language === 'hi' ? 'अगली सिंचाई' : 'Next Irrigation'}
            phrase={hasPlan ? (plan?.next_irrigation_date ? `Date: ${plan.next_irrigation_date}` : (language === 'te' ? 'ఈ వారం అవసరం లేదు' : language === 'hi' ? 'इस सप्ताह जरूरत नहीं' : 'Not required this week')) : (language === 'te' ? 'తేదీ ఇంకా నిర్ణయించలేదు' : language === 'hi' ? 'तारीख अभी तय नहीं' : 'Not scheduled yet')}
            illustration={hasPlan ? <WateringCanIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasPlan ? 'info' : 'nodata'}
            statusWord={hasPlan ? (language === 'te' ? 'షెడ్యూల్ అయింది' : language === 'hi' ? 'निर्धारित' : 'Scheduled') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasPlan ? `Next scheduled watering date is ${plan?.next_irrigation_date || 'in upcoming days'}.` : 'Next irrigation date is not scheduled yet.'}
          />
        </div>

        {/* 3-Step Daily Water Management Flow */}
        <StepFlow
          heading={language === 'te' ? 'నీటి యాజమాన్యంలో 3 దశలు' : language === 'hi' ? 'सिंचाई के 3 सरल कदम' : '3 Water Management Steps'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'భూమి తేమ చూడండి' : language === 'hi' ? 'जड़ की नमी देखें' : 'Check Soil Depth',
              desc: language === 'te' ? 'వేర్ల ప్రాంతంలో 10 సెం.మీ లోతులో తేమ చూడండి' : language === 'hi' ? '10 सेमी गहराई पर मिट्टी की नमी जांचें' : 'Feel moisture at 10cm depth in root zone',
              icon: Sprout,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'వర్షం గమనించండి' : language === 'hi' ? 'बारिश का अनुमान' : 'Check Rain Forecast',
              desc: language === 'te' ? 'వర్షం ఉంటే తడిని వాయిదా వేయండి' : language === 'hi' ? 'बारिश हो तो सिंचाई टालें' : 'Skip irrigation if heavy rainfall is predicted',
              icon: CloudRain,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'డ్రిప్ / స్ప్రింక్లర్ ప్రారంభించండి' : language === 'hi' ? 'ड्रिप चालू करें' : 'Irrigate Field',
              desc: language === 'te' ? 'సిఫార్సు చేసిన లీటర్ల నీరు మాత్రమే ఇవ్వండి' : language === 'hi' ? 'सिफारिश अनुसार आवश्यक लीटर पानी दें' : 'Apply recommended depth to avoid waterlogging',
              icon: Droplets,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        icon={Droplets}
        title={t('irrigation.title')}
        purpose={t('irrigation.subtitle')}
        whatIsThis={{
          summary: language === 'te'
            ? 'FAO-56 వ్యవసాయ వాతావరణ విధానాన్ని ఉపయోగించి పంట దశ, నేల రకం మరియు వాతావరణం ఆధారంగా పంటకు అవసరమైన ఖచ్చితమైన నీటిని లెక్కిస్తుంది.'
            : language === 'hi'
            ? 'संयुक्त राष्ट्र FAO-56 मौसम विज्ञान पद्धति का उपयोग करके फसल अवस्था, मिट्टी के प्रकार और मौसम के आधार पर सटीक पानी की आवश्यकता की गणना करता है।'
            : 'Calculates the exact water requirements of your crops based on stage, soil type, and weather using the UN FAO-56 agro-meteorological method.',
          whatToEnter: language === 'te'
            ? 'మీ పంట పేరు, విత్తిన తేదీ, నేల రకం, నీటి పద్ధతి (ఉదా. డ్రిప్, స్ప్రింక్లర్), మరియు ఎకరాల విస్తీర్ణం.'
            : language === 'hi'
            ? 'आपकी फसल का नाम, बुवाई की तारीख, मिट्टी का प्रकार, सिंचाई विधि (जैसे ड्रिप, स्प्रिंकलर), और एकड़ में क्षेत्रफल।'
            : 'Your crop name, sowing date, soil type, irrigation method (e.g. drip, sprinkler), and land area in acres.',
          whatYouGet: language === 'te'
            ? 'ఈరోజు నీరు పెట్టాలా వద్దా, మిల్లీమీటర్లలో లోతు, లీటర్లలో మొత్తం నీరు, మరియు తదుపరి నీటి తడి తేదీ.'
            : language === 'hi'
            ? 'आज सिंचाई करनी है या नहीं, मिलीमीटर में गहराई, लीटर में कुल पानी, और अगली सिंचाई की तारीख।'
            : 'Immediate recommendation whether to irrigate today, gross depth in millimetres, total water volume in litres, and next watering date.',
        }}
        actions={
          <button
            type="button"
            onClick={handleComputeBudget}
            disabled={isLoadingPlan || isRefetchingPlan}
            className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetchingPlan ? 'animate-spin' : ''}`} />
            <span>{isLoadingPlan || isRefetchingPlan ? (language === 'te' ? 'లెక్కిస్తోంది...' : language === 'hi' ? 'गणना जारी...' : 'Computing...') : (language === 'te' ? 'పంట నీటి బడ్జెట్ లెక్కించండి' : language === 'hi' ? 'फसल जल बजट निकालें' : 'Compute Crop Water Budget')}</span>
          </button>
        }
      />

      {/* LEAD SUMMARY SECTION (1 to 3 Important Results as Large Cards + ONE clear CTA) */}
      <div ref={resultsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: Today's Watering Decision */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                {t('irrigation.next_irrigation_title')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                DAS {plan?.days_after_sowing ?? 90}
              </span>
            </div>

            {plan?.rain_skip_triggered ? (
              <div className="flex items-center gap-2 text-teal-800">
                <CloudRain className="w-5 h-5 text-teal-600 shrink-0" />
                <h2 className="font-display text-[20px] sm:text-[22px] font-extrabold">
                  {t('irrigation.rain_skip_active')}
                </h2>
              </div>
            ) : plan?.should_irrigate ? (
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-[#DA9A4C] shrink-0" />
                <h2 className="font-display text-[20px] sm:text-[22px] font-extrabold">
                  {t('irrigation.irrigate_now')}
                </h2>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <h2 className="font-display text-[20px] sm:text-[22px] font-extrabold">
                  {t('irrigation.adequate_moisture')}
                </h2>
              </div>
            )}

            <p className="text-[13px] sm:text-[14px] font-semibold text-[#183D2E] leading-relaxed">
              {translateBackendString(plan?.recommendation_text || 'Soil water depletion has reached RAW threshold. Irrigation required today.', language)}
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between gap-3">
            <ReadAloudButton text={plainMeaning} />
            <button
              type="button"
              onClick={handleComputeBudget}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs sm:text-sm shadow-sm"
            >
              <span>{language === 'te' ? 'పంట నీటి బడ్జెట్ లెక్కించండి' : language === 'hi' ? 'फसल जल बजट निकालें' : 'Compute Crop Water Budget'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Required Water Volume & Depth */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('irrigation.water_volume')}
              </span>
              <span className="text-xs text-[#7A553A] font-semibold">
                {areaAcres} {t('irrigation.farm_area')}
              </span>
            </div>

            <div className="py-1">
              <span className="text-2xl sm:text-[26px] font-display font-black text-[#183D2E]">
                {plan?.should_irrigate && plan?.litres_needed != null
                  ? `${plan.litres_needed.toLocaleString()} L`
                  : (language === 'te' ? 'ఈరోజు నీరు అవసరం లేదు (0 L)' : language === 'hi' ? 'आज सिंचाई की आवश्यकता नहीं (0 L)' : 'No watering needed today (0 L)')}
              </span>
              <span className="text-xs text-[#4E5F57] block mt-0.5">
                {language === 'te' ? 'స్థూల లోతు:' : language === 'hi' ? 'సकल गहराई:' : 'Gross Depth:'}{' '}
                <strong>{plan?.should_irrigate && plan?.gross_depth_mm != null ? plan.gross_depth_mm.toFixed(1) : '0.0'} mm</strong> ({translateBackendString(plan?.irrigation_method || 'drip', language)})
              </span>
              {plan?.should_irrigate && (
                <div className="text-[10px] text-[#4E5F57] bg-[#FAF8F5] p-1.5 rounded-lg border border-[#7A553A]/15 mt-1 font-mono">
                  {language === 'te' ? 'లెక్కింపు:' : language === 'hi' ? 'सूत्र:' : 'Derivation:'} {Number(plan?.gross_depth_mm ?? 0).toFixed(1)} mm × 4,046.86 L/(mm·ac) × {areaAcres} ac
                </div>
              )}
            </div>

            {/* What this means for you */}
            <WhatThisMeans
              message={plainMeaning}
              confidenceNote={language === 'te' ? 'స్థానిక వాతావరణం ఆధారంగా సూచిక FAO-56 అనుకరణ.' : language === 'hi' ? 'स्थानीय मौसम पर आधारित संकेतात्मक FAO-56 अनुकरण।' : 'Indicative FAO-56 agro-meteorological simulation based on local weather.'}
            />
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 text-xs text-[#4E5F57] flex justify-between">
            <span>{language === 'te' ? 'తదుపరి తడి తేదీ:' : language === 'hi' ? 'अगली सिंचाई तिथि:' : 'Next watering date:'}</span>
            <strong className="text-[#183D2E]">{plan?.next_irrigation_date || t('common.no_data_yet', { defaultValue: 'No data yet' })}</strong>
          </div>
        </div>

        {/* Card 3: Soil Water Level & Evapotranspiration */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('irrigation.soil_water_level_title', { defaultValue: 'Soil Water Level & Telemetry' })}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                FAO-56
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#4E5F57] block font-bold uppercase">{t('irrigation.kc_label')} ({language === 'te' ? 'పంట కారకం' : language === 'hi' ? 'फसल कारक' : 'Crop factor'})</span>
                <span className="text-base font-extrabold text-[#183D2E]">{plan?.kc ? plan.kc.toFixed(2) : '1.20'}</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#4E5F57] block font-bold uppercase">{t('irrigation.et0_label')} ({language === 'te' ? 'వాతావరణం' : language === 'hi' ? 'वायुमंडलीय' : 'Atmospheric'})</span>
                <span className="text-base font-extrabold text-[#183D2E]">{plan?.reference_et0_mm ? plan.reference_et0_mm.toFixed(1) : '5.0'} mm/day</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#4E5F57] block font-bold uppercase">{t('irrigation.etc_label')} ({language === 'te' ? 'పంట డిమాండ్' : language === 'hi' ? 'फसल मांग' : 'Crop demand'})</span>
                <span className="text-base font-extrabold text-[#183D2E]">{plan?.etc_today_mm ? plan.etc_today_mm.toFixed(1) : '6.0'} mm/day</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#4E5F57] block font-bold uppercase">{t('irrigation.litres_saved_card', { defaultValue: 'Litres Saved' })}</span>
                <span className="text-base font-extrabold text-teal-800">{plan?.litres_saved ? plan.litres_saved.toLocaleString() : '0'} L</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 text-xs text-[#7A553A] italic">
            {language === 'te' ? 'నేల' : language === 'hi' ? 'मिट्टी' : 'Soil'}: <strong>{translateBackendString(plan?.soil_type || soilType, language)}</strong> &bull; {language === 'te' ? 'పరిమితి' : language === 'hi' ? 'सीमा' : 'Raw threshold'}: {plan?.raw_mm != null ? `${plan.raw_mm} mm` : '—'}
          </div>
        </div>
      </div>

      {/* Honesty Note Banner */}
      <div className="bg-[#FEF6E9] border border-[#DA9A4C]/40 rounded-2xl p-4 text-xs font-semibold text-[#543924] flex items-center gap-2.5 shadow-sm">
        <Info className="w-5 h-5 text-[#DA9A4C] shrink-0" />
        <span>{t('irrigation.modelled_not_measured')}</span>
      </div>

      {/* DETAIL TABS (Preserves all controls, forms, charts and diagnostic features) */}
      <div className="bg-white rounded-3xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tab Header Bar */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5] p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'forecast'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            {t('irrigation.tab_forecast', { defaultValue: '7-Day Water Balance Chart' })}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'params'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            {t('irrigation.tab_params', { defaultValue: 'Farm Calibration & Sowing Date' })}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'telemetry'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            {t('irrigation.tab_telemetry', { defaultValue: 'FAO-56 Soil Water Telemetry' })}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'diagnostic'
                ? 'bg-white text-[#183D2E] shadow-sm border border-[#7A553A]/20'
                : 'text-[#4E5F57] hover:text-[#183D2E]'
            }`}
          >
            {t('irrigation.tab_diagnostic', { defaultValue: 'Irrigation Issue Diagnostic' })}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: 7-DAY WATER BALANCE FORECAST & RECHARTS */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-base font-bold text-[#183D2E]">
                    {t('irrigation.water_balance_heading', { defaultValue: '7-Day Root Zone Moisture Balance (FAO-56)' })}
                  </h4>
                  <p className="text-xs text-[#4E5F57]">
                    {t('irrigation.chart_subtitle', { defaultValue: 'Blue bars show rain, green line shows root zone depletion, red dashed line shows RAW stress limit.' })}
                  </p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-72 w-full pt-4 min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="rain" name={language === 'te' ? 'అంచనా వర్షపాతం (మి.మీ)' : language === 'hi' ? 'अपेक्षित वर्षा (मिमी)' : 'Expected Rain (mm)'} fill="#3B82F6" barSize={18} radius={[4, 4, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="etc" name={language === 'te' ? 'పంట నీటి డిమాండ్ ETc (మి.మీ)' : language === 'hi' ? 'फसल जल मांग ETc (मिमी)' : 'Crop Water Demand ETc (mm)'} stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="left" type="monotone" dataKey="depletion" name={language === 'te' ? 'వేర్ల వద్ద తేమ తగ్గుదల (మి.మీ)' : language === 'hi' ? 'जड़ क्षेत्र नमी कमी (मिमी)' : 'Root Zone Depletion (mm)'} stroke="#7A553A" strokeWidth={2.5} dot={{ r: 3 }} />
                      {plan?.raw_mm && (
                        <ReferenceLine yAxisId="left" y={plan.raw_mm} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'RAW Threshold', fill: '#EF4444', fontSize: 10, position: 'top' }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic p-4 bg-[#FAF8F5] rounded-xl">
                  {t('irrigation.run_budget_prompt', { defaultValue: 'Run crop water budget to display 7-day balance chart.' })}
                </p>
              )}
            </div>
          )}

          {/* TAB 2: FARM CALIBRATION & STEP-BY-STEP PARAMETERS */}
          {activeTab === 'params' && (
            <div className="space-y-6">
              <h4 className="font-display text-base font-bold text-[#183D2E]">
                {language === 'te' ? 'పంట & నేల సర్దుబాటు వివరాలు' : language === 'hi' ? 'फसल व मिट्टी अंशांकन सेटिंग्स' : 'Crop & Soil Calibration Settings'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1.5">
                    {t('irrigation.select_crop_label')}
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-[#7A553A]/30 text-sm bg-white font-semibold text-[#1A2421]"
                  >
                    {SUPPORTED_CROPS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1.5">
                    {t('irrigation.planting_date_label')}
                  </label>
                  <input
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-[#7A553A]/30 text-sm bg-white font-semibold text-[#1A2421]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1.5">
                    {t('irrigation.soil_type_label')}
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-[#7A553A]/30 text-sm bg-white font-semibold text-[#1A2421]"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1.5">
                    {t('irrigation.irrigation_method_label')}
                  </label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-[#7A553A]/30 text-sm bg-white font-semibold text-[#1A2421]"
                  >
                    {IRRIGATION_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.eff})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1.5">
                    {t('irrigation.area_label')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(Number(e.target.value))}
                    className="min-h-[48px] w-full px-3.5 py-2 rounded-xl border border-[#7A553A]/30 text-sm bg-white font-semibold text-[#1A2421]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleComputeBudget}
                    className="min-h-[48px] w-full px-5 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('irrigation.apply_recompute', { defaultValue: 'Apply & Recompute' })}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCIENTIFIC SOIL WATER TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <h4 className="font-display text-base font-bold text-[#183D2E]">
                {t('irrigation.tab_telemetry', { defaultValue: 'FAO-56 Soil Water Balance Formula Parameters' })}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">{t('irrigation.taw_label', { defaultValue: 'Total Available Water (TAW)' })}</span>
                  <span className="text-base font-extrabold text-[#183D2E]">{plan?.taw_mm ? plan.taw_mm.toFixed(1) : '190.0'} mm</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">{t('irrigation.raw_label', { defaultValue: 'Readily Available Water (RAW)' })}</span>
                  <span className="text-base font-extrabold text-[#183D2E]">{plan?.raw_mm ? plan.raw_mm.toFixed(1) : '123.5'} mm</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">{t('irrigation.awc_label', { defaultValue: 'Available Water Cap. (AWC)' })}</span>
                  <span className="text-base font-extrabold text-[#183D2E]">{plan?.awc_mm_per_m ? plan.awc_mm_per_m.toFixed(1) : '190.0'} mm/m</span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">{t('irrigation.depletion_label', { defaultValue: 'Current Depletion' })}</span>
                  <span className="text-base font-extrabold text-[#7A553A]">{plan?.depletion_today_mm ? plan.depletion_today_mm.toFixed(1) : '126.0'} mm</span>
                </div>
              </div>
              <p className="text-xs text-[#4E5F57] leading-relaxed pt-2">
                {t('irrigation.fao_scientific_note', { defaultValue: 'Scientific basis: FAO Irrigation and Drainage Paper No. 56. When root zone depletion exceeds RAW, the crop experiences moisture stress and evapotranspiration drops below maximum potential ETc.' })}
              </p>
            </div>
          )}

          {/* TAB 4: IRRIGATION ISSUE DIAGNOSTIC ASSISTANT */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              <h4 className="font-display text-base font-bold text-[#183D2E]">
                {t('irrigation.diagnostic_title', { defaultValue: 'Water Stress & Salinity Diagnostic Assistant' })}
              </h4>
              <p className="text-xs text-[#4E5F57]">
                {t('irrigation.diagnostic_desc', { defaultValue: 'Describe foliar wilting, leaf tip burns, or upload a field photo to diagnose waterlogging or salinity issues.' })}
              </p>

              <form onSubmit={handleDiagnose} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1">
                    {t('irrigation.describe_symptoms_label', { defaultValue: 'Describe Visible Water or Soil Symptoms' })}
                  </label>
                  <textarea
                    rows={3}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder={language === 'te' ? 'ఉదా. కాలువ తడి ఇచ్చినప్పటికీ మధ్యాహ్నం ఆకులు వాలిపోతున్నాయి...' : language === 'hi' ? 'उदा. थाला सिंचाई के बाद भी दोपहर में पत्तियां मुरझा रही हैं...' : 'e.g. Cotton leaves wilting in afternoon despite furrow watering...'}
                    className="w-full p-3 rounded-xl border border-[#7A553A]/30 text-sm bg-white"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A553A]/30 bg-[#FAF8F5] text-xs font-bold text-[#183D2E] hover:bg-[#EDE5DC] cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#DA9A4C]" />
                    <span>{t('irrigation.upload_leaf_soil_photo', { defaultValue: 'Upload Leaf / Soil Photo' })}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                  {photoFile && (
                    <span className="text-xs text-[#183D2E] font-medium">{photoFile.name}</span>
                  )}
                </div>

                {validationError && (
                  <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs">{validationError}</div>
                )}

                <button
                  type="submit"
                  disabled={diagnoseMutation.isPending || (!problemText.trim() && !photoFile)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] disabled:opacity-50"
                >
                  {diagnoseMutation.isPending ? (language === 'te' ? 'విశ్లేషిస్తోంది...' : language === 'hi' ? 'विश्लेषण जारी...' : 'Diagnosing...') : (language === 'te' ? 'సమస్యను విశ్లేషించండి' : language === 'hi' ? 'नैदानिक विश्लेषण करें' : 'Run Diagnostic Analysis')}
                </button>
              </form>

              {diagnosisResult && (
                <div className="mt-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#7A553A]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-[#183D2E]">{diagnosisResult.title}</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4EDE8] text-[#183D2E]">
                      {diagnosisResult.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#4E5F57]">{diagnosisResult.description}</p>
                  {diagnosisResult.suggestions?.length > 0 && (
                    <ul className="text-xs text-[#183D2E] list-disc list-inside space-y-1 pt-1">
                      {diagnosisResult.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IrrigationPage;
