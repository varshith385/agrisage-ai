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
  MapPin,
  CloudSun,
  CheckCircle,
  Info,
  XCircle,
  Check,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { getRotationRecommendations } from '../api/economics';
import { weatherApi } from '../api/weather';
import { apiRequest } from '../api/client';
import {
  CropRotationResponse,
  CropRecommendationResponse,
  CropCandidate,
  InputFeatureDetail,
} from '../types/api';
import { translateBackendString } from '../utils/safeTranslation';
import { getIndianStates, getDistrictsForState, getDistrictCoordinates } from '../utils/indiaGeo';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';
import { ExplainCard } from '../components/common/ExplainCard';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { EmptyPlotIllustration, NoDataIllustration, LeafScanIllustration } from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorState } from '../components/common/ErrorState';

// Training envelope ranges from Kaggle 2,200 sample benchmark
const TRAINING_RANGES = {
  n: { min: 0.0, max: 140.0, unit: 'kg/ha', label: 'Nitrogen' },
  p: { min: 5.0, max: 145.0, unit: 'kg/ha', label: 'Phosphorus' },
  k: { min: 5.0, max: 205.0, unit: 'kg/ha', label: 'Potassium' },
  ph: { min: 3.50, max: 9.94, unit: 'pH', label: 'Soil pH' },
  temperature: { min: 8.83, max: 43.68, unit: '°C', label: 'Temperature' },
  humidity: { min: 14.26, max: 99.98, unit: '%', label: 'Humidity' },
  rainfall: { min: 20.21, max: 298.56, unit: 'mm', label: 'Rainfall' },
};

export const CropRecommendationPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { activeCrop, activeFarm } = useAuth();

  // Location selector (cascading state -> district with coordinates)
  const statesList = getIndianStates();
  const [selectedState, setSelectedState] = useState<string>(activeFarm?.state || 'Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(activeFarm?.district || 'Warangal');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>(() => {
    if (activeFarm?.latitude && activeFarm?.longitude) {
      return { lat: activeFarm.latitude, lon: activeFarm.longitude };
    }
    const c = getDistrictCoordinates(activeFarm?.state || 'Telangana', activeFarm?.district || 'Warangal');
    return { lat: c.latitude, lon: c.longitude };
  });

  const districtsList = getDistrictsForState(selectedState);

  // Environmental inputs populated from Open-Meteo for the farm/district coordinates
  const [temp, setTemp] = useState<number>(25.0);
  const [humidity, setHumidity] = useState<number>(65.0);
  const [rainfall, setRainfall] = useState<number>(100.0);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherSource, setWeatherSource] = useState<string>('Measured (weather API, trailing 12mo)');
  const [userEditedWeather, setUserEditedWeather] = useState<boolean>(false);
  const [windowDates, setWindowDates] = useState<string>('Trailing 12 months (365 days)');

  // Soil inputs: strictly distinguishing measured from defaults
  const [hasUserEnteredSoil, setHasUserEnteredSoil] = useState<boolean>(false);
  const [n, setN] = useState<number>(50.0);
  const [p, setP] = useState<number>(50.0);
  const [k, setK] = useState<number>(50.0);
  const [ph, setPh] = useState<number>(6.5);

  const [mlResult, setMlResult] = useState<CropRecommendationResponse | null>(null);
  const [loadingMl, setLoadingMl] = useState<boolean>(false);
  const [errorMl, setErrorMl] = useState<string | null>(null);

  // Crop Rotation Inputs (synchronized with active crop)
  const [prevCrop, setPrevCrop] = useState<string>(activeCrop || 'Cotton');
  const [rotationData, setRotationData] = useState<CropRotationResponse | null>(null);
  const [loadingRotation, setLoadingRotation] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'candidates' | 'inputs' | 'rotation' | 'methodology'>('candidates');

  // Update location when activeFarm changes
  useEffect(() => {
    if (activeFarm) {
      if (activeFarm.state) setSelectedState(activeFarm.state);
      if (activeFarm.district) setSelectedDistrict(activeFarm.district);
      if (activeFarm.latitude && activeFarm.longitude) {
        setCoordinates({ lat: activeFarm.latitude, lon: activeFarm.longitude });
      }
    }
  }, [activeFarm]);

  // Synchronize activeCrop
  useEffect(() => {
    if (activeCrop) {
      setPrevCrop(activeCrop);
    }
  }, [activeCrop]);

  // Handle location dropdown changes
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const districts = getDistrictsForState(newState);
    const firstDist = districts[0]?.name || '';
    setSelectedDistrict(firstDist);
    const coords = getDistrictCoordinates(newState, firstDist);
    setCoordinates({ lat: coords.latitude, lon: coords.longitude });
  };

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    const coords = getDistrictCoordinates(selectedState, newDistrict);
    setCoordinates({ lat: coords.latitude, lon: coords.longitude });
  };

  // Fetch Open-Meteo weather when coordinates change
  const loadWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      let loadedNormals = false;
      if (weatherApi.getClimateNormals) {
        try {
          const normals = await weatherApi.getClimateNormals(coordinates.lat, coordinates.lon);
          if (normals && typeof normals.mean_temperature_c === 'number') {
            setTemp(normals.mean_temperature_c);
            setHumidity(normals.mean_relative_humidity_pct);
            setRainfall(normals.mean_monthly_rainfall_mm);
            setWindowDates(`${normals.window_start_date} to ${normals.window_end_date}`);
            setWeatherSource(normals.source || 'Measured (weather API, trailing 12mo)');
            setUserEditedWeather(false);
            loadedNormals = true;
          }
        } catch (normErr) {
          console.warn('Climate normals fetch error, falling back to forecast:', normErr);
        }
      }

      if (!loadedNormals && weatherApi.getForecast) {
        const forecast = await weatherApi.getForecast(coordinates.lat, coordinates.lon);
        if (forecast?.current) {
          setTemp(forecast.current.temperature_c);
          setHumidity(forecast.current.relative_humidity_pct);
          const rain7d = forecast.daily ? forecast.daily.reduce((acc, d) => acc + (d.precipitation_sum_mm || 0), 0) : 0;
          setRainfall(Math.max(Math.round(rain7d * 10), 40.0));
          setWindowDates('Live Open-Meteo forecast');
          setWeatherSource('Measured (weather API)');
          setUserEditedWeather(false);
        }
      }
    } catch (err: any) {
      console.warn('Weather fetch failure:', err);
      setWeatherError(err?.message || 'Failed to fetch weather from Open-Meteo. Please enter parameters manually.');
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [coordinates.lat, coordinates.lon]);

  // Fetch Crop Advisory recommendations from backend
  const fetchRecommendation = async () => {
    setLoadingMl(true);
    setErrorMl(null);
    try {
      const payload: any = {
        temperature: temp,
        humidity: humidity,
        rainfall: rainfall,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        state: selectedState,
        district: selectedDistrict,
        season: 'Kharif',
        weather_source: userEditedWeather ? 'Entered (user)' : weatherSource,
        window_dates: windowDates,
      };
      if (activeFarm?.id) {
        payload.farm_id = activeFarm.id;
      }
      // ONLY send soil parameters if user explicitly entered them
      if (hasUserEnteredSoil) {
        payload.n = n;
        payload.p = p;
        payload.k = k;
        payload.ph = ph;
        payload.soil_source = 'Entered (user)';
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
  }, [hasUserEnteredSoil, coordinates.lat, coordinates.lon, temp, humidity, rainfall]);

  useEffect(() => {
    fetchRotation();
  }, [prevCrop]);

  const topCrop = mlResult?.top_crops?.[0];
  const topRotation = rotationData?.recommended_rotations?.[0];

  // Derive decision status (CONFIDENT | LOW_CONFIDENCE | UNUSUAL | INVALID | MODEL_UNAVAILABLE)
  const isModelUnavailable = mlResult?.status === 'MODEL_UNAVAILABLE' || mlResult?.decision_status === 'MODEL_UNAVAILABLE';
  const decisionStatus: 'CONFIDENT' | 'LOW_CONFIDENCE' | 'UNUSUAL' | 'INVALID' | 'MODEL_UNAVAILABLE' =
    mlResult?.decision_status ||
    (isModelUnavailable ? 'MODEL_UNAVAILABLE' : (mlResult?.soil_values_missing ? 'LOW_CONFIDENCE' : (mlResult?.is_out_of_distribution ? 'UNUSUAL' : 'CONFIDENT')));

  const isLowConfidence = decisionStatus === 'LOW_CONFIDENCE' || Boolean(topCrop && topCrop.probability < 0.5);
  const isUnusual = decisionStatus === 'UNUSUAL';
  const isInvalid = decisionStatus === 'INVALID';

  const lowConfidenceMsg = topCrop
    ? language === 'te'
      ? `మోడల్ యొక్క ప్రాథమిక ఊహ ${translateBackendString(topCrop.crop_name, language)}, తక్కువ విశ్వసనీయతతో (${Math.round(topCrop.probability * 100)}%)`
      : language === 'hi'
      ? `मॉडल का प्रारंभिक अनुमान ${translateBackendString(topCrop.crop_name, language)} है, कम विश्वास के साथ (${Math.round(topCrop.probability * 100)}%)`
      : `The model's top guess is ${topCrop.crop_name}, with low confidence (${Math.round(topCrop.probability * 100)}%)`
    : '';

  const plainMeaning = isUnusual
    ? (language === 'te'
        ? 'అసాధారణ కలయిక, మోడల్ నమ్మకంగా సిఫార్సు చేయలేదు. దయచేసి నేల పరీక్ష లేదా వ్యవసాయ అధికారితో ధృవీకరించండి.'
        : language === 'hi'
        ? 'असामान्य संयोजन, मॉडल विश्वासपूर्वक सिफारिश नहीं कर सकता। कृपया मिट्टी परीक्षण या कृषि अधिकारी से पुष्टि करें।'
        : 'Unusual combination outside training envelope. Please verify with a soil test or local agriculture officer.')
    : isLowConfidence
    ? `${lowConfidenceMsg}. ${language === 'te' ? 'నేల వివరాలు అవసరం.' : language === 'hi' ? 'मृदा डेटा आवश्यक है।' : 'Soil values needed.'}`
    : topCrop
    ? (language === 'te'
        ? `మీ నేల మరియు వాతావరణానికి అత్యంత అనుకూలమైన పంట ${translateBackendString(topCrop.crop_name, language)} (${(topCrop.probability * 100).toFixed(0)}% సరిపోలిక).`
        : language === 'hi'
        ? `आपकी मिट्टी और मौसम के लिए सबसे उपयुक्त फसल ${translateBackendString(topCrop.crop_name, language)} है (${(topCrop.probability * 100).toFixed(0)}% उपयुक्तता)।`
        : `The most suitable crop for your soil and weather is ${topCrop.crop_name} with ${(topCrop.probability * 100).toFixed(0)}% agro-climatic alignment. Following previous ${prevCrop}, rotating with ${topRotation?.crop_name || 'legumes'} will restore soil nutrients.`)
    : (language === 'te'
        ? 'పంట అనుకూలత మరియు నేల పునరుద్ధరణ పరిశీలించబడుతోంది...'
        : language === 'hi'
        ? 'फसल उपयुक्तता और भूमि सुधार का मूल्यांकन किया जा रहा है...'
        : 'Evaluating crop suitability and restorative rotation sequence...');

  // Construct 7 input chips data
  const inputChips: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string;
    source: string;
    inRange: boolean;
    rangeStr: string;
  }> = [
    {
      key: 'n',
      label: 'Nitrogen',
      value: hasUserEnteredSoil ? n : null,
      unit: 'kg/ha',
      source: hasUserEnteredSoil ? 'Entered (user)' : t('recommend.source_not_provided', { defaultValue: 'Not provided' }),
      inRange: hasUserEnteredSoil ? (n >= TRAINING_RANGES.n.min && n <= TRAINING_RANGES.n.max) : true,
      rangeStr: `[${TRAINING_RANGES.n.min}–${TRAINING_RANGES.n.max}]`,
    },
    {
      key: 'p',
      label: 'Phosphorus',
      value: hasUserEnteredSoil ? p : null,
      unit: 'kg/ha',
      source: hasUserEnteredSoil ? 'Entered (user)' : t('recommend.source_not_provided', { defaultValue: 'Not provided' }),
      inRange: hasUserEnteredSoil ? (p >= TRAINING_RANGES.p.min && p <= TRAINING_RANGES.p.max) : true,
      rangeStr: `[${TRAINING_RANGES.p.min}–${TRAINING_RANGES.p.max}]`,
    },
    {
      key: 'k',
      label: 'Potassium',
      value: hasUserEnteredSoil ? k : null,
      unit: 'kg/ha',
      source: hasUserEnteredSoil ? 'Entered (user)' : t('recommend.source_not_provided', { defaultValue: 'Not provided' }),
      inRange: hasUserEnteredSoil ? (k >= TRAINING_RANGES.k.min && k <= TRAINING_RANGES.k.max) : true,
      rangeStr: `[${TRAINING_RANGES.k.min}–${TRAINING_RANGES.k.max}]`,
    },
    {
      key: 'ph',
      label: 'Soil pH',
      value: hasUserEnteredSoil ? ph : null,
      unit: 'pH',
      source: hasUserEnteredSoil ? 'Entered (user)' : t('recommend.source_not_provided', { defaultValue: 'Not provided' }),
      inRange: hasUserEnteredSoil ? (ph >= TRAINING_RANGES.ph.min && ph <= TRAINING_RANGES.ph.max) : true,
      rangeStr: `[${TRAINING_RANGES.ph.min}–${TRAINING_RANGES.ph.max}]`,
    },
    {
      key: 'temperature',
      label: 'Temperature',
      value: temp,
      unit: '°C',
      source: userEditedWeather ? 'Entered (user)' : (mlResult?.input_sources?.temperature?.source || weatherSource),
      inRange: temp >= TRAINING_RANGES.temperature.min && temp <= TRAINING_RANGES.temperature.max,
      rangeStr: `[${TRAINING_RANGES.temperature.min}–${TRAINING_RANGES.temperature.max}]`,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      value: humidity,
      unit: '%',
      source: userEditedWeather ? 'Entered (user)' : (mlResult?.input_sources?.humidity?.source || weatherSource),
      inRange: humidity >= TRAINING_RANGES.humidity.min && humidity <= TRAINING_RANGES.humidity.max,
      rangeStr: `[${TRAINING_RANGES.humidity.min}–${TRAINING_RANGES.humidity.max}]`,
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      value: rainfall,
      unit: 'mm',
      source: userEditedWeather ? 'Entered (user)' : (mlResult?.input_sources?.rainfall?.source || weatherSource),
      inRange: rainfall >= TRAINING_RANGES.rainfall.min && rainfall <= TRAINING_RANGES.rainfall.max,
      rangeStr: `[${TRAINING_RANGES.rainfall.min}–${TRAINING_RANGES.rainfall.max}]`,
    },
  ];

  // Override with backend input_sources if available
  if (mlResult?.input_sources) {
    inputChips.forEach((chip) => {
      const backendDetail: InputFeatureDetail | undefined = mlResult.input_sources?.[chip.key];
      if (backendDetail) {
        chip.source = backendDetail.source;
        chip.inRange = backendDetail.in_training_range;
        chip.rangeStr = backendDetail.training_range;
        if (backendDetail.value !== null && backendDetail.value !== undefined) {
          chip.value = backendDetail.value;
        }
      }
    });
  }

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasTopCrop = Boolean(topCrop) && !isUnusual && !isInvalid;
    const hasRotation = Boolean(topRotation);

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={Sprout}
          title={t('recommend.title', { defaultValue: 'Crop Advisory' })}
          purpose={language === 'te' ? 'మీ నేల మరియు వాతావరణానికి తగిన పంటను ఎంచుకోండి' : language === 'hi' ? 'अपनी मिट्टी और मौसम के लिए सबसे सही फसल चुनें' : 'Visual crop advisory based on soil and weather.'}
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
              {isUnusual ? (
                <ShieldAlert className="w-12 h-12 text-amber-700" />
              ) : hasTopCrop ? (
                <LeafScanIllustration size={64} />
              ) : (
                <NoDataIllustration size={64} />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`text-[13px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  isUnusual
                    ? 'text-amber-800 bg-amber-100'
                    : isLowConfidence
                    ? 'text-blue-800 bg-blue-100'
                    : 'text-[#1B5E3B] bg-[#1B5E3B]/10'
                }`}>
                  {isUnusual
                    ? t('recommend.unusual_refusal_title', { defaultValue: 'Unusual Combination, Not Confident' })
                    : isLowConfidence
                    ? t('recommend.status_low_confidence', { defaultValue: 'Indicative Only (Soil Needed)' })
                    : (language === 'te' ? 'ఉత్తమ పంట' : language === 'hi' ? 'सर्वोत्तम फसल' : 'Recommended Crop')}
                </span>
                <StatusBadge
                  status={isUnusual ? 'warning' : isLowConfidence ? 'warning' : hasTopCrop ? 'success' : 'nodata'}
                  label={
                    isUnusual
                      ? t('recommend.status_unusual', { defaultValue: 'Unusual' })
                      : isLowConfidence
                      ? (language === 'te' ? 'సూచిక మాత్రమే' : language === 'hi' ? 'संकेतात्मक' : 'Indicative Only')
                      : hasTopCrop
                      ? `${(topCrop!.probability * 100).toFixed(0)}% Match`
                      : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No Data')
                  }
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug">
                {isUnusual
                  ? t('recommend.unusual_refusal_title', { defaultValue: 'Unusual Combination, Not Confident' })
                  : isLowConfidence
                  ? (topCrop ? `${translateBackendString(topCrop.crop_name, language)} (${(topCrop.probability * 100).toFixed(0)}% • ${language === 'te' ? 'సూచిక' : language === 'hi' ? 'संकेतात्मक' : 'Indicative'})` : 'Indicative Candidate')
                  : hasTopCrop
                  ? `${translateBackendString(topCrop!.crop_name, language)} (${(topCrop!.probability * 100).toFixed(0)}% Match)`
                  : (language === 'te' ? 'పంట సిఫార్సు ఇంకా లెక్కింపబడలేదు' : language === 'hi' ? 'फसल चयन अभी नहीं हुआ' : 'Awaiting Crop Evaluation')}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {plainMeaning}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {/* ReadAloudButton is permitted ONLY in Pictures mode */}
            <ReadAloudButton
              text={isUnusual ? plainMeaning : hasTopCrop ? `Best crop is ${topCrop!.crop_name}. ${plainMeaning}` : plainMeaning}
              label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
            />
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
            phrase={
              isUnusual
                ? (language === 'te' ? 'అసాధారణ కలయిక • నమ్మకం సరిపోదు' : language === 'hi' ? 'असामान्य संयोजन • विश्वास योग्य नहीं' : 'Unusual combination • Not confident')
                : hasTopCrop
                ? (isLowConfidence
                    ? `${translateBackendString(topCrop!.crop_name, language)} • ${(topCrop!.probability * 100).toFixed(0)}%`
                    : `${translateBackendString(topCrop!.crop_name, language)} • ${(topCrop!.probability * 100).toFixed(0)}% match`)
                : (language === 'te' ? 'పంట ఇంకా నిర్ణయించలేదు' : language === 'hi' ? 'फसल तय नहीं' : 'No crop matched yet')
            }
            illustration={isUnusual ? <ShieldAlert className="w-16 h-16 text-amber-700" /> : hasTopCrop ? <LeafScanIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={isUnusual ? 'warning' : hasTopCrop ? (isLowConfidence ? 'warning' : 'success') : 'nodata'}
            statusWord={
              isUnusual
                ? (language === 'te' ? 'అసాధారణం' : language === 'hi' ? 'असामान्य' : 'Unusual')
                : hasTopCrop
                ? (isLowConfidence ? (language === 'te' ? 'సూచిక' : language === 'hi' ? 'संकेतात्मक' : 'Indicative') : (language === 'te' ? 'అగ్ర ఎంపిక' : language === 'hi' ? 'शीर्ष पसंद' : 'Rank #1'))
                : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')
            }
            spokenText={isUnusual ? plainMeaning : hasTopCrop ? `Recommended crop is ${topCrop!.crop_name} with ${(topCrop!.probability * 100).toFixed(0)} percent suitability.` : 'No crop recommendation calculated yet.'}
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
            phrase={!hasUserEnteredSoil ? (language === 'te' ? 'నేల వివరాలు ఇవ్వలేదు (వాతావరణ ఆధారితం)' : language === 'hi' ? 'मृदा मान उपलब्ध नहीं (मौसम आधारित)' : 'Soil not provided (Weather-only)') : `N: ${n} • P: ${p} • K: ${k}`}
            illustration={<Sprout className="w-16 h-16 text-[#1B5E3B]" />}
            status={!hasUserEnteredSoil ? 'warning' : 'success'}
            statusWord={!hasUserEnteredSoil ? (language === 'te' ? 'నేల వివరాలు లేవు' : language === 'hi' ? 'मृदा डेटा नहीं' : 'Soil not provided') : 'Measured Soil'}
            spokenText={!hasUserEnteredSoil ? 'Soil test values not provided. Evaluation using Open-Meteo climate parameters with reduced confidence.' : `Measured soil nutrients evaluated: Nitrogen ${n}, Phosphorus ${p}, Potassium ${k}.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>
      </div>
    );
  }

  // WORDS MODE (Strictly NO ReadAloudButtons per ListenVisibility test guidelines)
  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* PAGE HEADER */}
      <PageHeader
        icon={Sprout}
        title={t('recommend.title', { defaultValue: 'Crop Advisory' })}
        purpose={t('recommend.subtitle')}
        whatIsThis={{
          summary: 'Evaluates machine learning multi-crop suitability (GaussianNB benchmark) and agronomic crop rotation sequences to protect long-term soil health and break pest cycles.',
          whatToEnter: 'Soil Nitrogen, Phosphorus, Potassium, and pH (optional — leave unchecked for Weather-Only advisory), with temperature and rainfall auto-filled from Open-Meteo climate normals.',
          whatYouGet: 'Ranked candidate crops with suitability percentages, Out-of-Distribution validation, input source attribution, and restorative rotation sequences.',
        }}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchRecommendation}
              disabled={loadingMl}
              className="min-h-[48px] px-5 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
              <span>{loadingMl ? 'Evaluating...' : t('recommend.evaluate_btn')}</span>
            </button>
          </div>
        }
      />

      {/* LOCATION & AGRO-METEOROLOGY SELECTOR BAR */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#183D2E]">
              <MapPin className="w-4 h-4 text-[#DA9A4C]" />
              <span>{language === 'te' ? 'ప్రాంతం:' : language === 'hi' ? 'स्थान:' : 'Holding Location:'}</span>
            </div>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] bg-[#FAF8F5]"
            >
              {statesList.map((s) => (
                <option key={s.state} value={s.state}>{s.state}</option>
              ))}
            </select>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] bg-[#FAF8F5]"
            >
              {districtsList.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
            <span className="text-[11px] text-[#7A553A] font-semibold">
              ({coordinates.lat.toFixed(2)}°N, {coordinates.lon.toFixed(2)}°E &bull; district centre)
            </span>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-xs font-bold text-[#183D2E] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#7A553A]/15">
            <CloudSun className="w-4 h-4 text-[#DA9A4C]" />
            <span>
              {weatherLoading
                ? 'Loading Open-Meteo climate normals...'
                : `12-month average (${windowDates || 'trailing 365 days'}): ${temp.toFixed(1)}°C • ${humidity.toFixed(1)}% RH • ${rainfall.toFixed(1)} mm/mo rain ${userEditedWeather ? '(User edited)' : '(Open-Meteo archive)'}`}
            </span>
          </div>
        </div>
      </div>

      {weatherError && (
        <ErrorState
          title={language === 'te' ? 'వాతావరణ డేటా లోడ్ కాలేదు' : language === 'hi' ? 'मौसम डेटा लोड नहीं हो सका' : 'Could not load weather from Open-Meteo'}
          message={`${weatherError} You may enter climate parameters manually below.`}
          onRetry={loadWeather}
        />
      )}

      {(errorMl || isModelUnavailable) && (
        <ErrorState
          title={language === 'te' ? 'సిఫార్సు మోడల్ అందుబాటులో లేదు' : language === 'hi' ? 'सिफारिश मॉडल उपलब्ध नहीं है' : 'Crop Recommendation Model Unavailable'}
          message={errorMl || (mlResult?.decision_reasons?.[0] || 'Model artifacts are not loaded on this server. Please contact your administrator.')}
          onRetry={fetchRecommendation}
        />
      )}

      {/* OUT-OF-DISTRIBUTION / UNUSUAL NOTICE */}
      {(mlResult?.is_out_of_distribution || isUnusual) && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold text-sm block">
              {language === 'te' ? 'అవుట్-ఆఫ్-డిస్ట్రిబ్యూషన్ హెచ్చరిక' : language === 'hi' ? 'आउट-ऑफ-डिस्ट्रिब्यूशन चेतावनी' : 'Out-of-Distribution Input Notice'}
            </span>
            <p>
              {mlResult?.ood_warning || 'The entered soil or climate values fall outside standard benchmark distributions. Predictions carry reduced confidence.'}
            </p>
            {mlResult?.decision_reasons && mlResult.decision_reasons.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 pt-1 text-amber-800">
                {mlResult.decision_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* LEAD SUMMARY SECTION (Card 1: Refusal / Indicative / Confident + Card 2: Rotation + Card 3: Evaluation Basis) */}
      {!isModelUnavailable && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: Top Recommended Crop or Explicit Refusal */}
        <div className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5 ${
          isUnusual
            ? 'bg-amber-50/70 border-amber-400'
            : isInvalid
            ? 'bg-red-50 border-red-300'
            : isLowConfidence
            ? 'bg-[#F4F9F6] border-[#183D2E]/30'
            : 'bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white border-[#DA9A4C]/60'
        }`}>
          <div className="space-y-1.5">
            {/* Header badge distinguished by icon, shape, and words */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isUnusual ? 'text-amber-800' : isInvalid ? 'text-red-800' : isLowConfidence ? 'text-blue-800' : 'text-[#DA9A4C]'
              }`}>
                {isUnusual ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>{t('recommend.status_unusual', { defaultValue: 'Unusual Combination' })}</span>
                  </>
                ) : isInvalid ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-700" />
                    <span>{t('recommend.status_invalid', { defaultValue: 'Invalid Input' })}</span>
                  </>
                ) : isLowConfidence ? (
                  <>
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>{t('recommend.status_low_confidence', { defaultValue: 'Indicative Only (Soil Needed)' })}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t('recommend.rank_1_title', { defaultValue: 'Rank #1 Recommendation' })}</span>
                  </>
                )}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isUnusual
                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                  : isInvalid
                  ? 'bg-red-200 text-red-900 border border-red-300'
                  : isLowConfidence
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-[#183D2E] text-white'
              }`}>
                {isUnusual
                  ? 'Refusal (OOD)'
                  : isInvalid
                  ? 'Invalid'
                  : isLowConfidence
                  ? (mlResult?.confidence_label || 'Medium Confidence')
                  : (mlResult?.confidence_label || 'High Confidence')}
              </span>
            </div>

            {/* Headline and Content based on Decision State */}
            {isUnusual ? (
              <div className="pt-2 space-y-2">
                <h2 className="text-xl sm:text-[22px] font-display font-black text-amber-950 leading-snug">
                  {t('recommend.unusual_refusal_title', { defaultValue: 'Unusual Combination, Not Confident' })}
                </h2>
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  {t('recommend.unusual_refusal_msg', { defaultValue: 'Please verify with a soil test or local agriculture officer.' })}
                </p>
                {mlResult?.decision_reasons && mlResult.decision_reasons.length > 0 && (
                  <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-300/80 text-[11px] text-amber-900 space-y-1">
                    <span className="font-bold block">Reasons for Refusal:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {mlResult.decision_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {topCrop && (
                  <div className="pt-1 text-[11px] text-amber-800">
                    <span className="font-bold">Low-confidence candidate (unverified): </span>
                    <span className="capitalize">{translateBackendString(topCrop.crop_name, language)}</span>
                  </div>
                )}
              </div>
            ) : isInvalid ? (
              <div className="pt-2 space-y-2">
                <h2 className="text-xl sm:text-[22px] font-display font-black text-red-900 leading-snug">
                  These values are not valid
                </h2>
                <p className="text-xs text-red-800 leading-relaxed">
                  One or more parameters fall outside physically possible bounds (e.g., negative nutrient values, pH &lt; 0 or &gt; 14, humidity &gt; 100%).
                </p>
                {mlResult?.decision_reasons && (
                  <ul className="p-2 bg-red-100 rounded-lg text-xs text-red-900 list-disc list-inside">
                    {mlResult.decision_reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            ) : isLowConfidence ? (
              <div className="pt-1 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl sm:text-[26px] font-display font-black text-[#183D2E] capitalize">
                    {topCrop ? translateBackendString(topCrop.crop_name, language) : '—'}
                  </h2>
                  <span className="text-sm font-mono font-bold text-blue-900">
                    {topCrop ? `${(topCrop.probability * 100).toFixed(0)}%` : '—'} {t('recommend.match_label', { defaultValue: 'match' })}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Indicative candidate (soil values needed)</span>
                  <p className="text-[11px] text-blue-800">
                    {language === 'te'
                      ? 'నేల పోషకాలు (NPK, pH) ఇవ్వలేదు. వాతావరణ ఆధారంగా మాత్రమే అంచనా వేయబడింది.'
                      : language === 'hi'
                      ? 'मृदा पोषक तत्व दर्ज नहीं किए गए। केवल जलवायु आधार पर संकेतात्मक अनुमान।'
                      : 'Soil parameters omitted. Weather-only estimation, not labeled high confidence.'}
                  </p>
                </div>
                <p className="text-xs text-[#4E5F57] leading-relaxed">
                  {topCrop?.reasons?.[0] ? translateBackendString(topCrop.reasons[0], language) : '—'}
                </p>
              </div>
            ) : (
              <div className="pt-1 space-y-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl sm:text-[26px] font-display font-black text-[#183D2E] capitalize">
                    {topCrop ? translateBackendString(topCrop.crop_name, language) : '—'}
                  </h2>
                  <span className="text-base font-mono font-bold text-[#183D2E]">
                    {topCrop ? `${(topCrop.probability * 100).toFixed(1)}%` : '—'} {t('recommend.match_label', { defaultValue: 'match' })}
                  </span>
                </div>
                <p className="text-xs text-[#4E5F57] leading-relaxed">
                  {topCrop?.reasons?.[0] ? translateBackendString(topCrop.reasons[0], language) : '—'}
                </p>
                {topCrop?.suitability_note && (
                  <p className="text-[11px] text-[#7A553A] italic">
                    {translateBackendString(topCrop.suitability_note, language)}
                  </p>
                )}
                {topCrop && (
                  <div className="pt-1">
                    <ConfidenceMeter value={mlResult?.model_probability ?? topCrop.probability} type="model_metric" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <span className="text-[11px] text-[#7A553A] font-semibold">
              Model: {mlResult?.model_name || 'GaussianNB'}
            </span>
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

        {/* Card 3: Evaluation Basis & Input Envelope Summary */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                {t('recommend.evaluation_basis_title', { defaultValue: 'Evaluation Basis' })}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !hasUserEnteredSoil
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {!hasUserEnteredSoil
                  ? (language === 'te' ? 'నేల వివరాలు ఇవ్వలేదు (వాతావరణ ఆధారితం)' : language === 'hi' ? 'मृदा मान उपलब्ध नहीं (मौसम आधारित)' : 'Soil not provided (Weather-only)')
                  : (language === 'te' ? 'కొలిచిన నేల + వాతావరణం' : language === 'hi' ? 'प्रमाणित मिट्टी + मौसम' : 'Measured Soil + Weather')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[10px] text-[#7A553A] block">{t('recommend.temperature_label', { defaultValue: 'Temperature' })}</span>
                <strong className="text-sm font-bold text-[#183D2E]">{temp.toFixed(1)}°C</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[10px] text-[#7A553A] block">{t('recommend.rainfall_label', { defaultValue: 'Rainfall' })}</span>
                <strong className="text-sm font-bold text-[#183D2E]">{rainfall.toFixed(1)} mm/mo</strong>
              </div>
              {hasUserEnteredSoil ? (
                <>
                  <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                    <span className="text-[10px] text-[#7A553A] block">{t('recommend.npk_label', { defaultValue: 'NPK (kg/ha)' })}</span>
                    <strong className="text-xs font-bold text-[#183D2E]">{n}-{p}-{k} kg/ha</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                    <span className="text-[10px] text-[#7A553A] block">{t('recommend.soil_ph_label', { defaultValue: 'Soil pH' })}</span>
                    <strong className="text-xs font-bold text-[#183D2E]">{ph.toFixed(1)}</strong>
                  </div>
                </>
              ) : (
                <div className="col-span-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <span className="font-bold block">
                    {language === 'te' ? 'నేల పరీక్ష వివరాలు నమోదు చేయలేదు' : language === 'hi' ? 'मृदा परीक्षण डेटा दर्ज नहीं' : 'Soil test values not entered'}
                  </span>
                  <span>
                    {language === 'te'
                      ? 'ఖచ్చితమైన NPK/pH ఆధారిత సిఫార్సుల కొరకు క్రింద నేల వివరాలను నమోదు చేయండి.'
                      : language === 'hi'
                      ? 'सटीक NPK/pH आधारित सिफारिश के लिए नीचे मृदा मान दर्ज करें।'
                      : 'Enter measured NPK and pH under Nutrient Parameters tab for calibrated full-soil evaluation.'}
                  </span>
                </div>
              )}
            </div>

            {mlResult?.soil_values_missing && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                {language === 'te' ? 'నేల విలువలు లేవు: మోడల్ తక్కువ విశ్వసనీయతతో వాతావరణం ఆధారంగా మాత్రమే అంచనా వేసింది.' : language === 'hi' ? 'मिट्टी के मान उपलब्ध नहीं: मॉडल ने कम विश्वसनीयता के साथ केवल मौसम चरों पर मूल्यांकन किया।' : 'Soil values omitted: Model evaluated on climate variables only with reduced confidence.'}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between text-xs text-[#7A553A]">
            <span>Model: {mlResult?.model_name || 'scikit-learn Multi-Crop'}</span>
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
      )}

      {/* 7 INPUT CHIPS: VALUE, UNIT, SOURCE ATTRIBUTION & ENVELOPE STATUS */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7A553A]/15 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#183D2E]" />
            <h3 className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
              Input Attribution &amp; Training Envelope Checks (7 Parameters)
            </h3>
          </div>
          <span className="text-[11px] text-[#7A553A]">
            Window: {windowDates}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {inputChips.map((chip) => (
            <div
              key={chip.key}
              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between space-y-1.5 transition-all ${
                !chip.inRange
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : chip.value === null
                  ? 'bg-gray-50 border-gray-200 text-gray-700'
                  : 'bg-[#FAF8F5] border-[#7A553A]/15 text-[#183D2E]'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-[#7A553A] block truncate">{chip.label}</span>
                <span className="text-sm font-bold block">
                  {chip.value !== null ? `${chip.value} ${chip.unit}` : 'Not provided'}
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#7A553A]/10 text-[10px]">
                <div className="truncate">
                  <span className="font-semibold text-[#7A553A]">Source: </span>
                  <span className="font-medium text-[#183D2E]">{chip.source}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  {chip.value === null ? (
                    <span className="text-gray-500">Omitted</span>
                  ) : chip.inRange ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>In range</span>
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Out envelope</span>
                    </span>
                  )}
                  <span className="text-[9px] text-[#7A553A]">{chip.rangeStr}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "HOW THIS WAS CHOSEN" COMPACT EXPLANATION CARD */}
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/25 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#183D2E]" />
            <h3 className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
              {t('recommend.how_chosen_title', { defaultValue: 'How This Was Chosen' })}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#183D2E] bg-white px-2.5 py-0.5 rounded-md border border-[#7A553A]/20">
            Kaggle Crop Recommendation Benchmark
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#7A553A]/15 space-y-0.5">
            <span className="text-[10px] text-[#7A553A] font-bold block">Selected Model Family</span>
            <strong className="text-sm text-[#183D2E]">GaussianNB</strong>
            <p className="text-[10px] text-[#4E5F57]">Gaussian Naive Bayes (5-fold stratified CV winner)</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#7A553A]/15 space-y-0.5">
            <span className="text-[10px] text-[#7A553A] font-bold block">Cross-Validation Macro-F1</span>
            <strong className="text-sm text-emerald-800">99.49%</strong>
            <p className="text-[10px] text-[#4E5F57]">CV Accuracy: 99.49% ± 0.42% across 8 models</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#7A553A]/15 space-y-0.5">
            <span className="text-[10px] text-[#7A553A] font-bold block">Log-Loss &amp; Stability</span>
            <strong className="text-sm text-[#183D2E]">0.0158 &bull; 96.55%</strong>
            <p className="text-[10px] text-[#4E5F57]">Lowest CV log-loss; 96.55% joint ±5% perturbation stability</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#7A553A]/15 space-y-0.5">
            <span className="text-[10px] text-[#7A553A] font-bold block">OOD &amp; Refusal Engine</span>
            <strong className="text-sm text-amber-900">IsolationForest</strong>
            <p className="text-[10px] text-[#4E5F57]">Flags rare joint combinations; 4.09% FPR, 100% detection</p>
          </div>
        </div>

        <p className="text-[11px] text-[#7A553A] leading-relaxed pt-1">
          {t('recommend.public_dataset_disclaimer', {
            defaultValue: 'Advisory based on public benchmark dataset. Field verification is advised.'
          })}{' '}
          Dataset details: 2,200 rows, 22 crops (100 rows each), synthetic clean ranges, location/season agnostic. Real-world field accuracy unverified. See full methodology in{' '}
          <span className="font-semibold text-[#183D2E]">docs/CROP_ADVISORY_REPORT.md</span>.
        </p>
      </div>

      {/* DETAIL TABS */}
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
              {isUnusual && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Unusual Environmental Combination Notice:
                  </span>
                  <p>
                    Because inputs fall outside the training envelope or constitute a rare joint distribution, candidate recommendations below carry low confidence and should not be relied upon without local soil testing.
                  </p>
                </div>
              )}

              {mlResult?.top_crops && mlResult.top_crops.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mlResult.top_crops.map((crop: CropCandidate, idx: number) => (
                    <div
                      key={crop.crop_name}
                      className="p-5 rounded-2xl border border-[#7A553A]/20 bg-[#FAF8F5] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isUnusual ? 'bg-amber-200 text-amber-900' : 'bg-[#DA9A4C] text-[#183D2E]'
                          }`}>
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
              ) : (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/15 text-[#7A553A]">
                  <p className="text-sm font-semibold">No candidate crops available for the current input combination.</p>
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
                    checked={hasUserEnteredSoil}
                    onChange={(e) => setHasUserEnteredSoil(e.target.checked)}
                    className="accent-[#183D2E] rounded w-4 h-4 cursor-pointer"
                  />
                  <span>
                    {language === 'te'
                      ? 'నేల పరీక్ష వివరాలను నమోదు చేయండి (NPK & pH)'
                      : language === 'hi'
                      ? 'मृदा परीक्षण डेटा दर्ज करें (NPK और pH)'
                      : 'Enter measured soil test data (NPK & pH)'}
                  </span>
                </label>
              </div>

              {!hasUserEnteredSoil && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {language === 'te'
                      ? 'నేల విలువలు లేవు (వాతావరణ ఆధారిత సలహా). కొలిచిన నేల డేటా కోసం పై చెక్‌బాక్స్‌ను ఎంచుకోండి.'
                      : language === 'hi'
                      ? 'मृदा मान उपलब्ध नहीं (केवल मौसम आधारित)। प्रमाणित मृदा डेटा के लिए उपरोक्त चेकबॉक्स चुनें।'
                      : 'Soil values omitted — running weather-only model variant (confidence 50%). Check box above to enter measured Soil Health Card values.'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Nitrogen (kg/ha)</label>
                  <input
                    type="number"
                    disabled={!hasUserEnteredSoil}
                    value={n}
                    onChange={(e) => setN(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 0–140</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Phosphorus (kg/ha)</label>
                  <input
                    type="number"
                    disabled={!hasUserEnteredSoil}
                    value={p}
                    onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 5–145</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Potassium (kg/ha)</label>
                  <input
                    type="number"
                    disabled={!hasUserEnteredSoil}
                    value={k}
                    onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 5–205</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Soil pH</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!hasUserEnteredSoil}
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value) || 7.0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] disabled:opacity-40"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 3.5–9.9</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => {
                      setTemp(parseFloat(e.target.value) || 25);
                      setUserEditedWeather(true);
                    }}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 8.8–43.7</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={humidity}
                    onChange={(e) => {
                      setHumidity(parseFloat(e.target.value) || 60);
                      setUserEditedWeather(true);
                    }}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 14.3–100</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#183D2E] block mb-1">Rain (mm/mo)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    value={rainfall}
                    onChange={(e) => {
                      setRainfall(parseFloat(e.target.value) || 100);
                      setUserEditedWeather(true);
                    }}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E]"
                  />
                  <span className="text-[9px] text-[#7A553A] block mt-0.5">Range: 20.2–298.6</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={fetchRecommendation}
                  disabled={loadingMl}
                  className="min-h-[48px] px-6 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {loadingMl ? 'Evaluating ML Model...' : t('recommend.evaluate_btn')}
                </button>
                <span className="text-[11px] text-[#7A553A]">
                  {hasUserEnteredSoil
                    ? 'Mode: Full Soil + Weather (7 features)'
                    : 'Mode: Weather-Only (Soil parameters omitted)'}
                </span>
                {userEditedWeather && (
                  <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Weather manually modified by user
                  </span>
                )}
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
                    "Weather-only fallback protects model credibility by lowering confidence to 50% when soil parameters are unavailable.",
                    "Out-of-Distribution (OOD) detector evaluates whether environmental inputs conform to real Indian agro-climatic ranges.",
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
