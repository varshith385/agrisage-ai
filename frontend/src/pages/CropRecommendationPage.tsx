import React, { useState, useEffect } from 'react';
import {
  Sprout,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { getRotationRecommendations } from '../api/economics';
import { apiRequest } from '../api/client';
import {
  CropRotationResponse,
  CropRecommendationResponse,
  CropCandidate,
} from '../types/api';
import { translateBackendString } from '../utils/safeTranslation';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';
import { ExplainCard } from '../components/common/ExplainCard';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { EmptyPlotIllustration, NoDataIllustration, LeafScanIllustration } from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorState } from '../components/common/ErrorState';

export const CropRecommendationPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { activeCrop } = useAuth();

  // ML Recommendation Inputs
  const [n, setN] = useState<number>(50.0);
  const [p, setP] = useState<number>(50.0);
  const [k, setK] = useState<number>(50.0);
  const [ph, setPh] = useState<number>(6.5);
  const [temp, setTemp] = useState<number>(28.0);
  const [humidity, setHumidity] = useState<number>(70.0);
  const [rainfall, setRainfall] = useState<number>(180.0);
  const [omitSoil, setOmitSoil] = useState<boolean>(false);
  const [hasConfirmedInputs, setHasConfirmedInputs] = useState<boolean>(false);

  const [mlResult, setMlResult] = useState<CropRecommendationResponse | null>(null);
  const [loadingMl, setLoadingMl] = useState<boolean>(false);
  const [errorMl, setErrorMl] = useState<string | null>(null);

  // Crop Rotation Inputs (synchronized with active crop)
  const [prevCrop, setPrevCrop] = useState<string>(activeCrop || 'Cotton');
  const [rotationData, setRotationData] = useState<CropRotationResponse | null>(null);
  const [loadingRotation, setLoadingRotation] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'candidates' | 'inputs' | 'rotation' | 'methodology'>('candidates');

  useEffect(() => {
    if (activeCrop) {
      setPrevCrop(activeCrop);
    }
  }, [activeCrop]);

  const fetchRecommendation = async () => {
    setLoadingMl(true);
    setErrorMl(null);
    try {
      const payload: any = {
        temperature: temp,
        humidity: humidity,
        rainfall: rainfall,
      };
      if (!omitSoil) {
        payload.n = n;
        payload.p = p;
        payload.k = k;
        payload.ph = ph;
      }
      const res = await apiRequest<CropRecommendationResponse>('/api/v1/recommend/crop', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMlResult(res);
    } catch (e: any) {
      console.error('Failed to fetch crop recommendation:', e);
      setErrorMl(e?.message || 'Failed to fetch crop recommendation');
    } finally {
      setLoadingMl(false);
    }
  };

  const fetchRotation = () => {
    setLoadingRotation(true);
    getRotationRecommendations(prevCrop)
      .then((data) => setRotationData(data))
      .catch((e) => console.error('Failed to fetch rotation:', e))
      .finally(() => setLoadingRotation(false));
  };

  useEffect(() => {
    fetchRecommendation();
  }, [omitSoil]);

  useEffect(() => {
    fetchRotation();
  }, [prevCrop]);

  const topCrop = mlResult?.top_crops?.[0];
  const topRotation = rotationData?.recommended_rotations?.[0];
  const isLowConfidence = Boolean(topCrop && topCrop.probability < 0.5);

  const lowConfidenceMsg = topCrop
    ? language === 'te'
      ? `మోడల్ యొక్క ప్రాథమిక ఊహ ${translateBackendString(topCrop.crop_name, language)}, తక్కువ విశ్వసనీయతతో (${Math.round(topCrop.probability * 100)}%)`
      : language === 'hi'
      ? `मॉडल का प्रारंभिक अनुमान ${translateBackendString(topCrop.crop_name, language)} है, कम विश्वास के साथ (${Math.round(topCrop.probability * 100)}%)`
      : `The model's top guess is ${topCrop.crop_name}, with low confidence (${Math.round(topCrop.probability * 100)}%)`
    : '';

  const plainMeaning = topCrop
    ? isLowConfidence
      ? `${lowConfidenceMsg}. ${language === 'te' ? 'అన్‌కాలిబ్రేటెడ్.' : language === 'hi' ? 'अनकैलिब्रेटेड।' : 'Uncalibrated.'}`
      : `The most suitable crop for your soil and weather is ${topCrop.crop_name} with ${(topCrop.probability * 100).toFixed(0)}% agro-climatic alignment. Following previous ${prevCrop}, rotating with ${topRotation?.crop_name || 'legumes'} will restore soil nutrients.`
    : 'Evaluating crop suitability and restorative rotation sequence...';

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasTopCrop = Boolean(topCrop);
    const hasRotation = Boolean(topRotation);

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={Sprout}
          title={language === 'te' ? 'పంట సిఫార్సు' : language === 'hi' ? 'फसल चयन' : 'Crop Recommendation'}
          purpose={language === 'te' ? 'మీ నేల మరియు వాతావరణానికి తగిన పంటను ఎంచుకోండి' : language === 'hi' ? 'अपनी मिट्टी और मौसम के लिए सबसे सही फसल चुनें' : 'Visual crop recommendation based on soil and weather.'}
        />

        {errorMl && (
          <ErrorState
            title={language === 'te' ? 'సిఫార్సులను లోడ్ చేయడం సాధ్యం కాలేదు' : language === 'hi' ? 'सिफारिश लोड नहीं हो सकी' : 'Could not load recommendation'}
            message={errorMl}
            onRetry={fetchRecommendation}
          />
        )}

        {/* Lead "Do This Today" Best Crop Match Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] border-2 border-[#1B5E3B] flex items-center justify-center shrink-0 shadow-sm">
              {hasTopCrop ? <LeafScanIllustration size={64} /> : <NoDataIllustration size={64} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {language === 'te' ? 'ఉత్తమ పంట' : language === 'hi' ? 'सर्वोत्तम फसल' : 'Recommended Crop'}
                </span>
                <StatusBadge
                  status={hasTopCrop ? (isLowConfidence ? 'warning' : 'success') : 'nodata'}
                  label={hasTopCrop ? (isLowConfidence ? (language === 'te' ? 'అన్‌కాలిబ్రేటెడ్' : language === 'hi' ? 'अनकैलिब्रेटेड' : 'Uncalibrated') : `${(topCrop!.probability * 100).toFixed(0)}% Match`) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No Data')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug">
                {hasTopCrop
                  ? (isLowConfidence
                      ? (language === 'te'
                          ? `మోడల్ యొక్క ప్రాథమిక ఊహ ${translateBackendString(topCrop!.crop_name, language)}, తక్కువ విశ్వసనీయతతో (${(topCrop!.probability * 100).toFixed(0)}%)`
                          : language === 'hi'
                          ? `मॉडल का प्रारंभिक अनुमान ${translateBackendString(topCrop!.crop_name, language)} है, कम विश्वास के साथ (${(topCrop!.probability * 100).toFixed(0)}%)`
                          : `The model's top guess is ${topCrop!.crop_name}, with low confidence (${(topCrop!.probability * 100).toFixed(0)}%)`)
                      : `${translateBackendString(topCrop!.crop_name, language)} (${(topCrop!.probability * 100).toFixed(0)}% Match)`)
                  : (language === 'te' ? 'పంట సిఫార్సు ఇంకా లెక్కింపబడలేదు' : language === 'hi' ? 'फसल चयन अभी नहीं हुआ' : 'Awaiting Crop Evaluation')}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {hasTopCrop ? plainMeaning : (language === 'te' ? 'మీ నేల పోషకాలు మరియు వాతావరణం ఆధారంగా ఉత్తమ పంటను సిఫార్సు చేయడానికి వివరాలు నమోదు చేయండి.' : language === 'hi' ? 'मिट्टी और मौसम के अनुसार सर्वोत्तम फसल जानने के लिए जानकारी भरें।' : 'Fill soil NPK and climate values in details view to evaluate suitable crops.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {hasTopCrop && (
              <ReadAloudButton
                text={`Best crop is ${topCrop!.crop_name}. ${plainMeaning}`}
                label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
              />
            )}
            <button
              type="button"
              onClick={() => setMode('words')}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు' : language === 'hi' ? 'पूरा विवरण' : 'See Details'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Pictorial Summary Tiles with Real Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-start">
          {/* Tile 1: Top Suitable Crop */}
          <PictorialTile
            title={language === 'te' ? 'అత్యంత అనుకూల పంట' : language === 'hi' ? 'उपयुक्त फसल' : 'Best Match'}
            phrase={hasTopCrop ? (isLowConfidence ? (language === 'te' ? `తక్కువ విశ్వసనీయత (${(topCrop!.probability * 100).toFixed(0)}%) • అన్‌కాలిబ్రేటెడ్` : language === 'hi' ? `कम विश्वास (${(topCrop!.probability * 100).toFixed(0)}%) • अनकैलिब्रेटेड` : `Low confidence (${(topCrop!.probability * 100).toFixed(0)}%) • uncalibrated`) : `${translateBackendString(topCrop!.crop_name, language)} • ${(topCrop!.probability * 100).toFixed(0)}% match`) : (language === 'te' ? 'పంట ఇంకా నిర్ణయించలేదు' : language === 'hi' ? 'फसल तय नहीं' : 'No crop matched yet')}
            illustration={hasTopCrop ? <LeafScanIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasTopCrop ? (isLowConfidence ? 'warning' : 'success') : 'nodata'}
            statusWord={hasTopCrop ? (isLowConfidence ? (language === 'te' ? 'అన్‌కాలిబ్రేటెడ్' : language === 'hi' ? 'अनकैलिब्रेटेड' : 'Uncalibrated') : (language === 'te' ? 'అగ్ర ఎంపిక' : language === 'hi' ? 'शीर्ष पसंद' : 'Rank #1')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasTopCrop ? `Recommended crop is ${topCrop!.crop_name} with ${(topCrop!.probability * 100).toFixed(0)} percent suitability.` : 'No crop recommendation calculated yet.'}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 2: Restorative Crop Rotation */}
          <PictorialTile
            title={language === 'te' ? 'పంట మార్పిడి' : language === 'hi' ? 'फसल चक्र' : 'Crop Rotation'}
            phrase={hasRotation ? `After ${prevCrop} → ${topRotation!.crop_name}` : (language === 'te' ? 'మార్పిడి ప్రణాళిక లేదు' : language === 'hi' ? 'चक्र योजना नहीं' : 'No rotation plan yet')}
            illustration={hasRotation ? <EmptyPlotIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasRotation ? 'info' : 'nodata'}
            statusWord={hasRotation ? (language === 'te' ? 'నేల రక్షణ' : language === 'hi' ? 'भूमि सुधार' : 'Restorative') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasRotation ? `Recommended rotation after ${prevCrop} is ${topRotation!.crop_name}. ${topRotation!.rationale}` : 'No rotation sequence calculated yet.'}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 3: Soil Nutrients Evaluated */}
          <PictorialTile
            title={language === 'te' ? 'మూల్యాంకన ఆధారం' : language === 'hi' ? 'मूल्यांकन आधार' : 'Evaluation Basis'}
            phrase={!hasConfirmedInputs ? (language === 'te' ? 'డిఫాల్ట్ వివరాలు (ధృవీకరించబడలేదు)' : language === 'hi' ? 'डिफ़ॉल्ट इनपुट (असत्यापित)' : 'Default inputs (unconfirmed)') : omitSoil ? 'Weather-only evaluation' : `N: ${n} • P: ${p} • K: ${k}`}
            illustration={<Sprout className="w-16 h-16 text-[#1B5E3B]" />}
            status={!hasConfirmedInputs ? 'warning' : 'info'}
            statusWord={!hasConfirmedInputs ? (language === 'te' ? 'డిఫాల్ట్ వివరాలు' : language === 'hi' ? 'डिफ़ॉल्ट इनपुट' : 'Default inputs') : omitSoil ? 'Weather Only' : 'Soil NPK'}
            spokenText={!hasConfirmedInputs ? 'Evaluation using default demo inputs. Confirm your soil NPK and climate values to calibrate.' : omitSoil ? 'Evaluating recommendations using climate parameters only.' : `Soil nutrients evaluated: Nitrogen ${n}, Phosphorus ${p}, Potassium ${k}.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* PAGE HEADER */}
      <PageHeader
        icon={Sprout}
        title={`${t('recommend.title')} & ${t('recommend.rotation_title')}`}
        purpose={t('recommend.subtitle')}
        whatIsThis={{
          summary: 'Evaluates machine learning multi-crop suitability (Random Forest) and agronomic crop rotation sequences to protect long-term soil health and pest breaks.',
          whatToEnter: 'Soil Nitrogen, Phosphorus, Potassium, and pH (or check Weather-Only fallback), plus expected temperature, humidity, and rainfall.',
          whatYouGet: 'Ranked candidate crops with suitability percentages, climate risk flags, and biological nitrogen-fixing rotation recommendations.',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasConfirmedInputs(true);
                fetchRecommendation();
              }}
              disabled={loadingMl}
              className="min-h-[48px] px-5 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
              <span>{loadingMl ? 'Evaluating...' : t('recommend.evaluate_btn')}</span>
            </button>
          </div>
        }
      />

      {errorMl && (
        <ErrorState
          title={language === 'te' ? 'సిఫార్సులను లోడ్ చేయడం సాధ్యం కాలేదు' : language === 'hi' ? 'सिफारिश लोड नहीं हो सकी' : 'Could not load recommendation'}
          message={errorMl}
          onRetry={fetchRecommendation}
        />
      )}

      {/* LEAD SUMMARY SECTION (1 to 3 Large Cards + Primary CTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: Top Recommended Crop */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                {t('recommend.rank_1_title', { defaultValue: 'Rank #1 Recommendation' })}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLowConfidence ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-[#183D2E] text-white'
              }`}>
                {isLowConfidence ? (language === 'te' ? 'అన్‌కాలిబ్రేటెడ్' : language === 'hi' ? 'अनकैलिब्रेटेड' : 'Uncalibrated') : t('recommend.ml_evaluated_badge', { defaultValue: 'ML Evaluated' })}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-2xl sm:text-[26px] font-display font-black text-[#183D2E] capitalize">
                {topCrop ? translateBackendString(topCrop.crop_name, language) : '—'}
              </h2>
              <span className="text-base font-mono font-bold text-[#183D2E]">
                {topCrop ? `${(topCrop.probability * 100).toFixed(0)}%` : '—'} {t('recommend.match_label', { defaultValue: 'match' })}
              </span>
            </div>

            {isLowConfidence && (
              <p className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                {lowConfidenceMsg}
              </p>
            )}

            <p className="text-xs text-[#4E5F57] leading-relaxed pt-1">
              {topCrop?.reasons?.[0] ? translateBackendString(topCrop.reasons[0], language) : '—'}
            </p>

            {topCrop?.suitability_note && (
              <p className="text-[11px] text-[#7A553A] italic">
                {translateBackendString(topCrop.suitability_note, language)}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Top recommended crop is ${topCrop?.crop_name || '—'}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('candidates')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>{t('recommend.see_top_3_btn', { defaultValue: 'See Top 3' })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Restorative Crop Rotation Break */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#DA9A4C]" />
                {t('recommend.biological_pest_break_title', { defaultValue: 'Biological Pest Break' })}
              </span>
              <span className="text-xs font-semibold text-[#7A553A]">
                {t('recommend.after_label', { defaultValue: 'After:' })} {translateBackendString(prevCrop, language)}
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-1">
              <span className="text-xs font-black text-[#183D2E] block">
                {t('recommend.next_label', { defaultValue: 'Next:' })} {topRotation ? translateBackendString(topRotation.crop_name, language) : (language === 'te' ? 'కందులు / పప్పుధాన్యాలు' : language === 'hi' ? 'दालें / अरहर' : 'Pulses / Redgram')}
              </span>
              <p className="text-xs text-[#4E5F57] leading-relaxed">
                {topRotation ? translateBackendString(topRotation.rationale, language) : (language === 'te' ? 'నేలలో నత్రజనిని స్థిరీకరించి తెగుళ్ల చక్రాన్ని విచ్ఛిన్నం చేస్తుంది.' : language === 'hi' ? 'मिट्टी में नाइट्रोजन की आपूर्ति कर कीट चक्र को तोड़ती है।' : 'Fixes atmospheric nitrogen into depleted soils and breaks pest cycles.')}
              </p>
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote={language === 'te' ? 'సాధారణ పంట మార్పిడి సూత్రాల ఆధారంగా సూచిక వ్యవసాయ సలహా (స్థానిక వ్యవసాయ అధికారిని సంప్రదించండి).' : language === 'hi' ? 'सामान्य फसल चक्र सिद्धांतों पर आधारित संकेतात्मक कृषि सलाह (स्थानीय कृषि अधिकारी से पुष्टि करें)।' : 'Indicative agronomic advice based on general crop rotation principles (details to verify with local extension officer).'}
            />
          </div>
        </div>

        {/* Card 3: Soil Nutrient & Weather Mode */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('recommend.evaluation_basis_title', { defaultValue: 'Evaluation Basis' })}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !hasConfirmedInputs
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : omitSoil
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-emerald-100 text-emerald-900'
              }`}>
                {!hasConfirmedInputs
                  ? (language === 'te' ? 'డిఫాల్ట్ వివరాలు' : language === 'hi' ? 'डिफ़ॉल्ट इनपुट' : 'Default inputs')
                  : omitSoil
                  ? (language === 'te' ? 'వాతావరణ ఆధారితం (ధృవీకరించబడింది)' : language === 'hi' ? 'केवल मौसम (पुष्ट)' : 'Weather-Only (Confirmed)')
                  : (language === 'te' ? 'పూర్తి నేల + వాతావరణం (ధృవీకరించబడింది)' : language === 'hi' ? 'पूर्ण मिट्टी + मौसम (पुष्ट)' : 'Full Soil + Weather (Confirmed)')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[10px] text-[#7A553A] block">{t('recommend.temperature_label', { defaultValue: 'Temperature' })}</span>
                <strong className="text-sm font-bold text-[#183D2E]">{temp}°C</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[10px] text-[#7A553A] block">{t('recommend.rainfall_label', { defaultValue: 'Rainfall' })}</span>
                <strong className="text-sm font-bold text-[#183D2E]">{rainfall} mm</strong>
              </div>
              {!omitSoil && (
                <>
                  <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                    <span className="text-[10px] text-[#7A553A] block">{t('recommend.npk_label', { defaultValue: 'NPK (kg/ha)' })}</span>
                    <strong className="text-xs font-bold text-[#183D2E]">{n}-{p}-{k}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                    <span className="text-[10px] text-[#7A553A] block">{t('recommend.soil_ph_label', { defaultValue: 'Soil pH' })}</span>
                    <strong className="text-xs font-bold text-[#183D2E]">{ph}</strong>
                  </div>
                </>
              )}
            </div>

            {mlResult?.soil_values_missing && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                {language === 'te' ? 'నేల విలువలు లేవు: మోడల్ తక్కువ విశ్వసనీయతతో వాతావరణం ఆధారంగా మాత్రమే అంచనా వేసింది.' : language === 'hi' ? 'मिट्टी के मान उपलब्ध नहीं: मॉडल ने कम विश्वसनीयता के साथ केवल मौसम चरों पर मूल्यांकन किया।' : 'Soil values omitted: Model evaluated on climate variables only with reduced confidence.'}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between text-xs text-[#7A553A]">
            <span>Model: RandomForest Multi-Crop</span>
            <button
              type="button"
              onClick={() => setActiveTab('inputs')}
              className="font-bold text-[#183D2E] hover:underline"
            >
              {language === 'te' ? 'ఇన్‌పుట్‌లు మార్చండి →' : language === 'hi' ? 'इनपुट बदलें →' : 'Adjust Inputs →'}
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL TABS (Decluttering without deleting any feature or control) */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
          <button
            type="button"
            onClick={() => setActiveTab('candidates')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'candidates'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('recommend.tab_candidates', { defaultValue: 'Top Recommended Crops' })}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inputs')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'inputs'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#183D2E]" />
            <span>{t('recommend.tab_inputs', { defaultValue: 'Nutrient & Climate Parameters' })}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rotation')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'rotation'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>{t('recommend.tab_rotation', { defaultValue: 'Crop Rotation Planner' })}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'methodology'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#7A553A]" />
            <span>{t('calendar.tab_methodology', { defaultValue: 'Methodology & Disclaimers' })}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: TOP CROPS */}
          {activeTab === 'candidates' && (
            <div className="space-y-5">
              {mlResult?.top_crops && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mlResult.top_crops.map((crop: CropCandidate, idx: number) => (
                    <div
                      key={crop.crop_name}
                      className="p-5 rounded-2xl border border-[#7A553A]/20 bg-[#FAF8F5] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-[#DA9A4C] text-[#183D2E] rounded-full">
                            {language === 'te' ? `శ్రేణి #${idx + 1}` : language === 'hi' ? `रैंक #${idx + 1}` : `Rank #${idx + 1}`}
                          </span>
                          <span className="text-xs font-bold text-[#183D2E]">
                            {(crop.probability * 100).toFixed(1)}% {t('recommend.match_label', { defaultValue: 'match' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#183D2E] text-lg capitalize">{translateBackendString(crop.crop_name, language)}</h4>
                        <p className="text-xs text-[#4E5F57] leading-relaxed">{crop.reasons.map((r) => translateBackendString(r, language)).join(' ')}</p>
                        {crop.suitability_note && (
                          <p className="text-[11px] text-[#7A553A] italic">{translateBackendString(crop.suitability_note, language)}</p>
                        )}
                      </div>
                      <div className="border-t border-[#7A553A]/15 pt-3">
                        <ConfidenceMeter value={crop.probability} type="model_metric" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mlResult?.climate_warnings && mlResult.climate_warnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs space-y-1">
                  <span className="font-bold block">{t('recommend.climate_suitability_warnings', { defaultValue: 'Climate Suitability Warnings:' })}</span>
                  <ul className="list-disc list-inside space-y-0.5 text-red-800">
                    {mlResult.climate_warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INPUTS */}
          {activeTab === 'inputs' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7A553A]/15 pb-3">
                <h3 className="text-sm font-bold text-[#183D2E]">
                  Crop Suitability Parameters
                </h3>
                <label className="flex items-center gap-2 text-xs font-bold text-[#183D2E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={omitSoil}
                    onChange={(e) => setOmitSoil(e.target.checked)}
                    className="accent-[#183D2E] rounded w-4 h-4 cursor-pointer"
                  />
                  <span>{t('recommend.omit_soil_checkbox')} (Weather-Only Fallback)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Nitrogen (N)</label>
                  <input
                    type="number"
                    disabled={omitSoil}
                    value={n}
                    onChange={(e) => setN(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Phosphorus (P)</label>
                  <input
                    type="number"
                    disabled={omitSoil}
                    value={p}
                    onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Potassium (K)</label>
                  <input
                    type="number"
                    disabled={omitSoil}
                    value={k}
                    onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={omitSoil}
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value) || 7.0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value) || 25)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value) || 60)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Rain (mm)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={rainfall}
                    onChange={(e) => setRainfall(parseFloat(e.target.value) || 150)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHasConfirmedInputs(true);
                    fetchRecommendation();
                  }}
                  disabled={loadingMl}
                  className="min-h-[48px] px-6 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {loadingMl ? 'Evaluating ML Model...' : t('recommend.evaluate_btn')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ROTATION PLANNER */}
          {activeTab === 'rotation' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#7A553A]/15 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#183D2E]" />
                  <h3 className="text-base font-bold text-[#183D2E]">
                    {t('recommend.rotation_planner_title')} (Biological Soil &amp; Pest Break Engine)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#183D2E]">{t('recommend.previous_harvest_label')}:</span>
                  <select
                    value={prevCrop}
                    onChange={(e) => setPrevCrop(e.target.value)}
                    className="min-h-[44px] bg-white border border-[#7A553A]/30 text-[#183D2E] font-bold rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#183D2E]"
                  >
                    <option value="Cotton">Cotton (Malvaceae)</option>
                    <option value="Rice">Rice / Paddy (Poaceae)</option>
                    <option value="Maize">Maize (Poaceae)</option>
                    <option value="Chilli">Chilli (Solanaceae)</option>
                    <option value="Tomato">Tomato (Solanaceae)</option>
                    <option value="Groundnut">Groundnut (Fabaceae)</option>
                    <option value="Pulses">Pulses / Redgram (Fabaceae)</option>
                  </select>
                  {loadingRotation && <span className="text-[10px] text-[#7A553A] font-bold animate-pulse">Loading...</span>}
                </div>
              </div>

              {rotationData && (
                <div className="space-y-4">
                  {/* Agronomic Risks & Avoid Crops */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Primary Agronomic Risks of Repeating {rotationData.previous_crop}:
                      </span>
                      <ul className="text-xs text-amber-800 space-y-1">
                        {rotationData.primary_agronomic_risks.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-700" />
                        Crops Strictly to Avoid:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rotationData.avoid_crops.map((c) => (
                          <span key={c} className="text-xs font-bold bg-white text-red-800 px-2.5 py-1 rounded-md border border-red-300">
                            ✕ {c}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-red-800/90 leading-relaxed mt-1">
                        {rotationData.avoid_reason}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Rotations */}
                  <div>
                    <h4 className="text-xs font-bold text-[#183D2E] uppercase tracking-wider mb-2.5">
                      Recommended Successor Crops (Citing Soil Restoration &amp; Pest Breaks):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {rotationData.recommended_rotations.map((item) => (
                        <div
                          key={item.crop_name}
                          className="p-4 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase rounded">
                                {item.benefit_category.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-[#7A553A] font-semibold">
                                {item.suitable_seasons.join(', ')}
                              </span>
                            </div>
                            <h5 className="font-bold text-[#183D2E] text-sm mb-1">{item.crop_name}</h5>
                            <span className="text-[10px] text-[#7A553A] block mb-2 font-medium">{item.crop_family}</span>
                            <p className="text-xs text-[#4E5F57] mb-2 leading-relaxed">{item.rationale}</p>
                            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-2">
                              <strong>Precaution:</strong> {item.precaution}
                            </p>
                          </div>
                          <div className="border-t border-[#7A553A]/15 pt-2 text-[10px] text-[#7A553A]">
                            <span>Source: {item.agronomic_source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: METHODOLOGY */}
          {activeTab === 'methodology' && (
            <div className="space-y-4">
              <ExplainCard
                title={t('recommend.explain_title')}
                data={{
                  value: 'Crop Selection & Restorative Rotation Architecture',
                  status: 'WORKING',
                  confidence: 0.92,
                  confidence_type: 'rule',
                  reasons: [
                    "Crop rotation rules prioritize leguminous biological nitrogen fixation (indicative 30-40 kg N/ha, to verify) after heavy-feeding cotton.",
                    "Monoculture cotton and Solanaceous crops (Chilli/Tomato) are strictly flagged due to soil-borne nematode and wilt accumulation.",
                    "Weather-only fallback protects model credibility by lowering confidence when soil parameters are unavailable.",
                  ],
                  sources: [
                    "General agronomic rotation and biological nitrogen fixation principles (to verify - source not checked)",
                  ],
                  limitations: [
                    "Field pest and nematode presence must be confirmed visually before finalizing pulse varieties.",
                    "Residual moisture in rice fallows varies by rainfall; broadcast pulses when soil is moist but unflooded.",
                  ],
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendationPage;