import React from 'react';
import { CurrentWeather } from '../../types/api';
import { Thermometer, Droplets, Wind, CloudRain, Sun, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  className?: string;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather, className = '' }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-white border border-agri-soil-200/80 rounded-2xl p-6 shadow-warm space-y-4 ${className}`}
    >
      {/* Header & Stale Data Warning */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-agri-gold-100 text-agri-gold-600 rounded-xl">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-stone-900">
              {t('location.current_weather_heading')}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              {weather.source}
            </p>
          </div>
        </div>

        {/* Stale Cache Notice */}
        {weather.stale && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>
              {t('location.stale_badge')}: {new Date(weather.fetched_at).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {weather.stale && (
        <p className="text-xs text-amber-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
          {t('location.stale_explanation')}{' '}
          <span className="font-bold">{new Date(weather.fetched_at).toLocaleString()}</span>
        </p>
      )}

      {/* Grid of Key Agro-Meteo Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Temperature */}
        <div className="p-3.5 bg-agri-cream-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-500 font-medium">{t('location.temp')}</div>
            <div className="text-lg font-bold text-stone-900">{weather.temperature_c}°C</div>
          </div>
        </div>

        {/* Relative Humidity */}
        <div className="p-3.5 bg-agri-cream-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-500 font-medium">{t('location.humidity')}</div>
            <div className="text-lg font-bold text-stone-900">{weather.relative_humidity_pct}%</div>
          </div>
        </div>

        {/* Expected Rainfall */}
        <div className="p-3.5 bg-agri-cream-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-500 font-medium">{t('location.rainfall')}</div>
            <div className="text-lg font-bold text-stone-900">{weather.expected_rainfall_today_mm} mm</div>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-3.5 bg-agri-cream-50 rounded-xl border border-stone-200/60 flex items-center gap-3">
          <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-500 font-medium">{t('location.wind')}</div>
            <div className="text-lg font-bold text-stone-900">{weather.wind_speed_kmh} km/h</div>
          </div>
        </div>

        {/* Reference ET0 (FAO-56) */}
        <div className="p-3.5 bg-agri-cream-50 rounded-xl border border-stone-200/60 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2 bg-agri-gold-100 text-agri-gold-700 rounded-lg">
            <Sun className="w-5 h-5 text-agri-gold-600" />
          </div>
          <div>
            <div className="text-[11px] text-stone-500 font-medium">{t('location.et0')}</div>
            <div className="text-lg font-bold text-stone-900">{weather.reference_et0_mm} mm/day</div>
          </div>
        </div>
      </div>

      {weather.village_coordinates_note && (
        <div className="text-[11px] text-stone-400 italic text-right">
          {weather.village_coordinates_note}
        </div>
      )}
    </div>
  );
};

