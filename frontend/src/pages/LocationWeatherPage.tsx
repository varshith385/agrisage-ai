import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  Info,
  CloudSun,
  Droplets,
  Calendar,
  Sparkles,
  Sun,
  Wind,
  CloudRain,
} from 'lucide-react';
import { locationApi } from '../api/location';
import { weatherApi } from '../api/weather';
import { CurrentWeather, DailyForecastItem, CropSuitabilityResponse, VillageItem } from '../types/api';
import { CurrentWeatherCard } from '../components/weather/CurrentWeatherCard';
import { ForecastChart } from '../components/weather/ForecastChart';
import { ExplainCard } from '../components/common/ExplainCard';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  WeatherIllustration,
  ThermometerGauge,
  WaterDropsGauge,
  NoDataIllustration,
} from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StepFlow } from '../components/common/StepFlow';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';

export const LocationWeatherPage: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { isPictorial } = usePictorial();
  const { activeFarm, location, setLocation } = useAuth();

  // Location Selector State (defaulting to activeFarm/global location)
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>(
    activeFarm?.state || location?.state || 'Telangana'
  );
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    activeFarm?.district || location?.district || 'Warangal'
  );
  const [villages, setVillages] = useState<VillageItem[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>(
    activeFarm?.village || location?.village || 'Geikonda'
  );
  const [isPartialNotice, setIsPartialNotice] = useState<boolean>(true);

  // Weather & Agronomic State
  const [currentLat, setCurrentLat] = useState<number>(
    activeFarm?.latitude || location?.latitude || 17.9689
  );
  const [currentLon, setCurrentLon] = useState<number>(
    activeFarm?.longitude || location?.longitude || 79.5941
  );
  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [suitability, setSuitability] = useState<CropSuitabilityResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'forecast' | 'location' | 'suitability'>('forecast');

  // Loading & Error States
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // 1. Fetch available states on load
  useEffect(() => {
    locationApi
      .getStates()
      .then((data) => {
        setStates(data);
      })
      .catch((err) => console.error('Failed to load states', err));
  }, []);

  // 2. Fetch districts when state changes
  useEffect(() => {
    if (!selectedState) return;
    locationApi
      .getDistricts(selectedState)
      .then((data) => {
        setDistricts(data);
        if (data.length > 0 && !data.includes(selectedDistrict)) {
          setSelectedDistrict(data[0]);
        }
      })
      .catch((err) => console.error('Failed to load districts', err));
  }, [selectedState]);

  // 3. Fetch villages when state or district changes
  useEffect(() => {
    if (!selectedState || !selectedDistrict) return;
    locationApi
      .getVillages(selectedState, selectedDistrict)
      .then((res) => {
        setVillages(res.villages);
        setIsPartialNotice(res.is_partial);
        if (res.villages.length > 0) {
          const match = res.villages.find((v) => v.village === selectedVillage);
          if (!match) {
            setSelectedVillage(res.villages[0].village);
            setCurrentLat(res.villages[0].lat);
            setCurrentLon(res.villages[0].lon);
          } else {
            setCurrentLat(match.lat);
            setCurrentLon(match.lon);
          }
        }
      })
      .catch((err) => console.error('Failed to load villages', err));
  }, [selectedState, selectedDistrict]);

  // 4. Fetch Weather & Suitability whenever lat/lon changes
  const fetchWeather = async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const [current, forecast, suit] = await Promise.all([
        weatherApi.getCurrentWeather(lat, lon),
        weatherApi.getForecast(lat, lon),
        weatherApi.getCropSuitability('cotton', lat, lon),
      ]);

      setWeatherData(current);
      setDailyForecast(forecast.daily);
      setSuitability(suit);
    } catch (err: unknown) {
      setWeatherError(
        err instanceof Error ? err.message : 'Weather service unreachable (HTTP 503 / Network Error).'
      );
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (currentLat && currentLon) {
      fetchWeather(currentLat, currentLon);
    }
  }, [currentLat, currentLon]);

  useEffect(() => {
    if (activeFarm) {
      if (activeFarm.state) setSelectedState(activeFarm.state);
      if (activeFarm.district) setSelectedDistrict(activeFarm.district);
      if (activeFarm.village) setSelectedVillage(activeFarm.village);
      if (activeFarm.latitude) setCurrentLat(activeFarm.latitude);
      if (activeFarm.longitude) setCurrentLon(activeFarm.longitude);
    }
  }, [activeFarm]);

  const handleVillageChange = (villageName: string) => {
    setSelectedVillage(villageName);
    const item = villages.find((v) => v.village === villageName);
    if (item) {
      setCurrentLat(item.lat);
      setCurrentLon(item.lon);
      setLocation({
        state: selectedState,
        district: selectedDistrict,
        village: item.village,
        latitude: item.lat,
        longitude: item.lon,
      });
    }
  };

  // Derived plain language advice
  const plainMeaning = weatherData
    ? weatherData.expected_rainfall_today_mm > 5
      ? `Rainfall of ${weatherData.expected_rainfall_today_mm.toFixed(1)} mm is expected today. You can pause irrigation and avoid spraying liquid pesticides.`
      : weatherData.temperature_c > 38
      ? `High heat of ${weatherData.temperature_c.toFixed(0)}°C detected. Ensure field moisture is maintained to prevent crop heat stress.`
      : `Weather conditions are moderate (${weatherData.temperature_c.toFixed(0)}°C, ${weatherData.relative_humidity_pct}% humidity). Favourable for routine field maintenance.`
    : 'Live weather telemetry will calculate field action recommendations once loaded.';

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasWeather = Boolean(weatherData && weatherData.temperature_c != null);
    const tempC = weatherData?.temperature_c ?? 0;
    const rainMm = weatherData?.expected_rainfall_today_mm ?? 0;
    const humidity = weatherData?.relative_humidity_pct ?? 0;
    const windSpeed = weatherData?.wind_speed_kmh ?? 0;
    const et0Val = weatherData?.reference_et0_mm ?? 0;
    const isRainy = rainMm > 3;
    const isHot = tempC > 36;

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={CloudSun}
          title={language === 'te' ? 'వాతావరణం' : language === 'hi' ? 'मौसम की जानकारी' : 'Weather'}
          purpose={language === 'te' ? 'ఈ రోజు ఎండ, వర్షం మరియు గాలి సమాచారం' : language === 'hi' ? 'आज की धूप, बारिश और हवा की स्थिति' : 'Visual weather forecast for your village.'}
        />

        {/* Lead "Do This Today" Weather Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#E1F5FE] border-2 border-[#1565A8] flex items-center justify-center shrink-0 shadow-sm">
              {hasWeather ? <ThermometerGauge tempC={tempC} className="w-10 h-16" /> : <NoDataIllustration size={64} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {selectedVillage || 'Local Village'}, {selectedDistrict || 'District'}
                </span>
                <StatusBadge
                  status={hasWeather ? (isRainy ? 'info' : isHot ? 'warning' : 'success') : 'nodata'}
                  label={hasWeather ? (isRainy ? (language === 'te' ? 'వర్ష సూచన' : language === 'hi' ? 'बारिश चेतावनी' : 'Rain Alert') : isHot ? (language === 'te' ? 'తీవ్ర ఎండ' : language === 'hi' ? 'तीज धूप' : 'High Heat') : (language === 'te' ? 'అనుకూలం' : language === 'hi' ? 'अनुकूल' : 'Comfortable')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No Data')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[24px] sm:text-[30px] font-black text-[#1F2A24] leading-snug">
                {hasWeather ? (
                  <>
                    {tempC.toFixed(0)}°C
                    <span className="text-[18px] font-bold text-[#4A5750] ml-3">
                      {isRainy ? `• ${rainMm} mm Rain Expected` : (language === 'te' ? '• ఆకాశం నిర్మలంగా ఉంది' : language === 'hi' ? '• आसमान साफ' : '• Clear Skies')}
                    </span>
                  </>
                ) : (
                  language === 'te' ? 'వాతావరణ డేటా ఇంకా రాలేదు' : language === 'hi' ? 'मौसम डेटा अभी उपलब्ध नहीं' : 'Weather Telemetry Loading'
                )}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {hasWeather ? plainMeaning : (language === 'te' ? 'వాతావరణ సమాచారం లోడ్ అయిన తర్వాత తగిన సలహాలు కనిపిస్తాయి.' : language === 'hi' ? 'मौसम की जानकारी प्राप्त होने के बाद सलाह उपलब्ध होगी।' : 'Open-Meteo weather telemetry will calculate field action recommendations once loaded.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {hasWeather && (
              <ReadAloudButton
                text={`Weather for ${selectedVillage}: ${tempC.toFixed(0)} degrees Celsius. ${plainMeaning}`}
                label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
              />
            )}
          </div>
        </div>

        {/* 4 Large Pictorial Tiles with REAL Values or Honest No-Data Fallback */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-start">
          {/* Tile 1: Temperature Gauge */}
          <PictorialTile
            title={language === 'te' ? 'ఉష్ణోగ్రత' : language === 'hi' ? 'तापमान' : 'Temperature'}
            phrase={hasWeather ? `${tempC.toFixed(0)}°C • ${isHot ? (language === 'te' ? 'తీవ్రమైన ఎండ' : language === 'hi' ? 'अधिक तापमान' : 'High heat alert') : (language === 'te' ? 'పంటలకు అనుకూలం' : language === 'hi' ? 'फसलों के लिए उत्तम' : 'Comfortable for crops')}` : (language === 'te' ? 'ఉష్ణోగ్రత డేటా లేదు' : language === 'hi' ? 'तापमान डेटा नहीं है' : 'No temperature data')}
            illustration={hasWeather ? <ThermometerGauge tempC={tempC} className="w-12 h-24" /> : <NoDataIllustration size={80} />}
            status={hasWeather ? (isHot ? 'warning' : 'success') : 'nodata'}
            statusWord={hasWeather ? (isHot ? (language === 'te' ? 'ఎండ హెచ్చరిక' : language === 'hi' ? 'अधिक गर्मी' : 'High Heat') : (language === 'te' ? 'సరైనది' : language === 'hi' ? 'सामान्य' : 'Optimal')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasWeather ? `Current temperature is ${tempC.toFixed(0)} degrees Celsius.` : 'No temperature data loaded yet.'}
          />

          {/* Tile 2: Rain & Cloud */}
          <PictorialTile
            title={language === 'te' ? 'వర్ష సూచన' : language === 'hi' ? 'बारिश' : 'Rainfall'}
            phrase={hasWeather ? `${rainMm} mm • ${isRainy ? (language === 'te' ? 'వర్షపు జల్లులు' : language === 'hi' ? 'बारिश के आसार' : 'Rain showers likely') : (language === 'te' ? 'భారీ వర్షం లేదు' : language === 'hi' ? 'बारिश नहीं' : 'No heavy rain')}` : (language === 'te' ? 'వర్ష సూచన లేదు' : language === 'hi' ? 'वर्षा डेटा नहीं है' : 'No rainfall data')}
            illustration={hasWeather ? <WeatherIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasWeather ? (isRainy ? 'info' : 'success') : 'nodata'}
            statusWord={hasWeather ? (isRainy ? (language === 'te' ? 'వర్ష సూచన' : language === 'hi' ? 'बारिश संभव' : 'Rain Likely') : (language === 'te' ? 'ఎండ & పొడి' : language === 'hi' ? 'धूप और साफ' : 'Dry & Clear')) : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasWeather ? `Rain forecast is ${rainMm} millimetres.` : 'No rain forecast data loaded yet.'}
          />

          {/* Tile 3: Atmospheric Water Demand (ET0) */}
          <PictorialTile
            title={language === 'te' ? 'ఆవిరయ్యే నీరు' : language === 'hi' ? 'जल वाष्पीकरण' : 'Water Loss (ET0)'}
            phrase={hasWeather ? `${et0Val.toFixed(1)} mm/day` : (language === 'te' ? 'ఆవిరి లెక్క లేదు' : language === 'hi' ? 'वाष्पीकरण डेटा नहीं' : 'No ET0 calculated')}
            illustration={hasWeather ? <WaterDropsGauge dropsCount={et0Val > 5 ? 4 : et0Val > 3 ? 3 : 2} /> : <NoDataIllustration size={80} />}
            status={hasWeather ? 'info' : 'nodata'}
            statusWord={hasWeather ? (language === 'te' ? 'ఆవిరి రేటు' : language === 'hi' ? 'वाष्पीकरण' : 'Atmospheric') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasWeather ? `Atmospheric water demand rate is ${et0Val.toFixed(1)} millimetres per day.` : 'Atmospheric water demand rate is not available.'}
          />

          {/* Tile 4: Humidity & Wind */}
          <PictorialTile
            title={language === 'te' ? 'తేమ & గాలి' : language === 'hi' ? 'हवा और नमी' : 'Wind & Humidity'}
            phrase={hasWeather ? `${humidity}% RH • ${windSpeed} km/h` : (language === 'te' ? 'గాలి/తేమ డేటా లేదు' : language === 'hi' ? 'हवा/नमी डेटा नहीं' : 'No wind data')}
            illustration={hasWeather ? <Wind className="w-16 h-16 text-[#1565A8]" /> : <NoDataIllustration size={80} />}
            status={hasWeather ? 'success' : 'nodata'}
            statusWord={hasWeather ? (language === 'te' ? 'సాధారణం' : language === 'hi' ? 'सामान्य' : 'Normal') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasWeather ? `Relative humidity is ${humidity} percent, wind speed is ${windSpeed} kilometres per hour.` : 'Humidity and wind data not available.'}
          />
        </div>

        {/* 3-Step Weather Routine */}
        <StepFlow
          heading={language === 'te' ? 'వాతావరణ రక్షణలో 3 దశలు' : language === 'hi' ? 'मौसम सुरक्षा के 3 सरल कदम' : '3 Weather Action Steps'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'ఉదయం ఎండ చూడండి' : language === 'hi' ? 'सुबह की धूप देखें' : 'Check Morning Sun',
              desc: language === 'te' ? 'ఆకులపై మంచు త్వరగా ఆరిపోయేలా చూడండి' : language === 'hi' ? 'पत्तियों पर ओस सूखने का ध्यान रखें' : 'Dew dry-off prevents fungal proliferation',
              icon: Sun,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'వర్షం ఉంటే మందులు కొట్టవద్దు' : language === 'hi' ? 'बारिश में छिड़काव न करें' : 'Hold Sprays if Rainy',
              desc: language === 'te' ? 'వర్షానికి మందు కొట్టుకుపోతుంది' : language === 'hi' ? 'बारिश से दवा बह जाएगी' : 'Avoid liquid foliar spraying before rain showers',
              icon: CloudRain,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'మధ్యాహ్నపు వేడి గమనించండి' : language === 'hi' ? 'दोपहर की गर्मी से बचाव' : 'Mitigate Afternoon Heat',
              desc: language === 'te' ? 'వేడి ఎక్కువగా ఉంటే సాయంత్రం తడి ఇవ్వండి' : language === 'hi' ? 'तेज धूप में शाम को पानी दें' : 'Irrigate during evening hours to minimize evaporation',
              icon: Wind,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <PageHeader
        icon={CloudSun}
        title={t('location.title')}
        purpose={t('location.subtitle')}
        whatIsThis={{
          summary: 'Retrieves live open-meteo agro-meteorology, UN FAO-56 atmospheric water demand (ET0), and village-level rainfall forecasts for crop protection.',
          whatToEnter: 'Your State, District, and Village centroid from the cascading pickers below.',
          whatYouGet: 'Current temperature, humidity, wind, 7-day weather outlook, and crop thermal suitability analysis.',
        }}
        actions={
          <button
            type="button"
            onClick={() => navigate('/farms')}
            className="min-h-[48px] px-5 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <span>{t('location.proceed_to_farm')}</span>
            <ArrowRight className="w-4 h-4 text-[#DA9A4C]" />
          </button>
        }
      />

      {/* Loading Skeleton */}
      {isLoadingWeather && (
        <div className="bg-white border border-[#7A553A]/20 rounded-2xl p-6 shadow-sm">
          <SkeletonCard rows={3} />
        </div>
      )}

      {/* Error State with Retry Button */}
      {weatherError && !isLoadingWeather && (
        <ErrorState
          title="Weather Service Error"
          message={weatherError}
          onRetry={() => fetchWeather(currentLat, currentLon)}
        />
      )}

      {/* LEAD SUMMARY SECTION (1 to 3 Large Cards + Primary Action) */}
      {weatherData && !isLoadingWeather && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
          {/* Card 1: Today's Weather & Rain Risk */}
          <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                  Today's Agro-Weather
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                  {selectedVillage}
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-[28px] font-display font-black text-[#183D2E]">
                  {weatherData.temperature_c.toFixed(0)}°C
                </span>
                <span className="text-sm font-semibold text-[#7A553A]">
                  Rain: <strong>{weatherData.expected_rainfall_today_mm.toFixed(1)} mm</strong>
                </span>
              </div>

              <p className="text-xs text-[#4E5F57] leading-relaxed">
                Open-Meteo live feed &bull; Coordinates: {currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E
              </p>
            </div>

            <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
              <ReadAloudButton text={`Weather for ${selectedVillage}: ${weatherData.temperature_c.toFixed(0)} degrees Celsius. ${plainMeaning}`} />
              <button
                type="button"
                onClick={() => setActiveTab('forecast')}
                className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
              >
                <span>7-Day Outlook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Evaporative Demand & Humidity */}
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Atmospheric Demand
                </span>
                <span className="text-xs text-[#7A553A] font-semibold">
                  FAO-56 ET0 ({weatherData.reference_et0_mm} mm)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] font-bold text-[#7A553A] uppercase block">Humidity</span>
                  <span className="text-lg font-black text-[#183D2E]">
                    {weatherData.relative_humidity_pct}%
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                  <span className="text-[10px] font-bold text-[#7A553A] uppercase block">Wind Speed</span>
                  <span className="text-lg font-black text-[#183D2E]">
                    {weatherData.wind_speed_kmh} <span className="text-xs font-normal">km/h</span>
                  </span>
                </div>
              </div>

              <WhatThisMeans
                message={plainMeaning}
                confidenceNote="Observation feeds from Open-Meteo agro-meteorological models."
              />
            </div>
          </div>

          {/* Card 3: Village Centroid & Farm Matching */}
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#DA9A4C]" />
                  Active Agro-Centroid
                </span>
                <span className="text-xs font-bold text-[#183D2E]">
                  {selectedDistrict}
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-1 text-xs">
                <p className="text-[#183D2E] font-bold">
                  {selectedVillage}, {selectedDistrict}, {selectedState}
                </p>
                <p className="text-[#7A553A]">
                  Centroid Lat/Lon: {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
                </p>
                {activeFarm && (
                  <p className="text-emerald-800 font-semibold pt-1 border-t border-[#7A553A]/10">
                    Linked to farm: {activeFarm.name} ({activeFarm.area} ac)
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between text-xs text-[#7A553A]">
              <span>Indicative village-level centroid.</span>
              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className="text-xs font-bold text-[#183D2E] hover:underline"
              >
                Change Village →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL TABS (Preserving all weather features and controls) */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'forecast'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#DA9A4C]" />
            <span>7-Day Agro-Forecast ({dailyForecast.length} days)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'location'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#183D2E]" />
            <span>Village & Location Selector</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suitability')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'suitability'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Crop Climate Suitability</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: 7-DAY FORECAST */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {weatherData && (
                <div className="pb-4">
                  <CurrentWeatherCard weather={weatherData} />
                </div>
              )}

              {dailyForecast.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#183D2E]">
                      7-Day Daily Rain & Evapotranspiration
                    </h3>
                    <span className="text-xs text-[#7A553A]">
                      Rainfall in mm &bull; ET0 demand
                    </span>
                  </div>
                  <ForecastChart data={dailyForecast} />
                </div>
              ) : (
                <p className="text-xs text-neutral-500 text-center py-6">Forecast data loading...</p>
              )}
            </div>
          )}

          {/* TAB 2: VILLAGE & LOCATION SELECTOR */}
          {activeTab === 'location' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-[#7A553A]/15 pb-3">
                <MapPin className="w-5 h-5 text-[#183D2E]" />
                <h3 className="text-sm font-bold text-[#183D2E]">
                  Select Agro-Climatic Zone & Village Coordinates
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1">
                    {t('location.select_state')}
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs font-medium focus:ring-2 focus:ring-[#183D2E] bg-white text-[#183D2E]"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1">
                    {t('location.select_district')}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs font-medium focus:ring-2 focus:ring-[#183D2E] bg-white text-[#183D2E]"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Village */}
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1">
                    {t('location.select_village')}
                  </label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs font-medium focus:ring-2 focus:ring-[#183D2E] bg-white text-[#183D2E]"
                  >
                    {villages.map((v) => (
                      <option key={v.village} value={v.village}>
                        {v.village} ({v.lat.toFixed(2)}, {v.lon.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Partial Village Dataset Disclaimer */}
              {isPartialNotice && (
                <div className="flex items-start gap-2 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/20 text-xs text-[#7A553A]">
                  <Info className="w-4 h-4 text-[#DA9A4C] shrink-0 mt-0.5" />
                  <span>{t('location.partial_dataset_notice')}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CROP CLIMATE SUITABILITY */}
          {activeTab === 'suitability' && (
            <div className="space-y-4">
              {suitability ? (
                <ExplainCard
                  title={t('location.suitability_heading')}
                  data={suitability}
                />
              ) : (
                <p className="text-xs text-neutral-500 text-center py-6">Suitability analysis loading...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationWeatherPage;