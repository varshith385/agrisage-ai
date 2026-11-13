import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Info } from 'lucide-react';
import { locationApi } from '../api/location';
import { weatherApi } from '../api/weather';
import { CurrentWeather, DailyForecastItem, CropSuitabilityResponse, VillageItem } from '../types/api';
import { CurrentWeatherCard } from '../components/weather/CurrentWeatherCard';
import { ForecastChart } from '../components/weather/ForecastChart';
import { ExplainCard } from '../components/common/ExplainCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { StatusBadge } from '../components/common/StatusBadge';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const LocationWeatherPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-gold-600">
              Tier 1 Agro-Meteorology
            </span>
            <StatusBadge status="WORKING" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            {t('location.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {t('location.subtitle')}
          </p>
        </div>

        <button
          onClick={() => navigate('/farms')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-agri-green-700 hover:bg-agri-green-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <span>{t('location.proceed_to_farm')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Location Cascading Selectors */}
      <div className="bg-white border border-agri-soil-200/80 rounded-2xl p-5 shadow-warm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <MapPin className="w-5 h-5 text-agri-green-700" />
          <h3 className="font-display text-sm font-bold text-stone-900">
            Select Agro-Climatic Zone & Village Coordinates
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* State */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('location.select_state')}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-agri-green-600 bg-white"
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
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('location.select_district')}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-agri-green-600 bg-white"
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
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t('location.select_village')}
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-agri-green-600 bg-white"
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
          <div className="flex items-start gap-2 p-3 bg-agri-cream-100 rounded-xl border border-stone-200/80 text-[11px] text-stone-600">
            <Info className="w-4 h-4 text-agri-soil-600 flex-shrink-0 mt-0.5" />
            <span>{t('location.partial_dataset_notice')}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoadingWeather && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-warm">
          <LoadingSkeleton lines={4} />
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

      {/* Live Weather Card */}
      {weatherData && !isLoadingWeather && (
        <CurrentWeatherCard weather={weatherData} />
      )}

      {/* 7-Day Forecast & Suitability Layout */}
      {dailyForecast.length > 0 && !isLoadingWeather && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <ForecastChart data={dailyForecast} />
          </div>

          <div className="lg:col-span-4">
            {suitability && (
              <ExplainCard
                title={t('location.suitability_heading')}
                data={suitability}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
