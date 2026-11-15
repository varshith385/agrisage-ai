import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { weatherApi } from '../api/weather';
import { CurrentWeather, WeatherForecast } from '../types/api';

export interface UseFarmWeatherResult {
  weather: CurrentWeather | null;
  forecast: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  placeName: string;
  latitude: number;
  longitude: number;
  gridDisclaimer: string;
}

export function useFarmWeather(): UseFarmWeatherResult {
  const { activeFarm } = useAuth();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const lat = activeFarm?.latitude ?? 17.9689;
  const lon = activeFarm?.longitude ?? 79.5941;
  const farmId = activeFarm?.id;

  const placeName =
    weather?.place_name ||
    forecast?.place_name ||
    (activeFarm
      ? `${activeFarm.name} (${activeFarm.village || ''}, ${activeFarm.district || ''})`
      : 'Warangal Centroid (Telangana)');

  const gridDisclaimer =
    weather?.grid_disclaimer ||
    forecast?.grid_disclaimer ||
    'model grid value for this location, not a village sensor';

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (farmId != null) {
        const fc = await weatherApi.getFarmWeather(farmId);
        setForecast(fc);
        setWeather(fc.current);
      } else {
        const [cw, fc] = await Promise.all([
          weatherApi.getCurrentWeather(lat, lon),
          weatherApi.getForecast(lat, lon),
        ]);
        setWeather(cw);
        setForecast(fc);
      }
    } catch (err: any) {
      console.error('Failed to fetch farm weather from Open-Meteo:', err);
      setError(err?.message || 'Open-Meteo weather service unreachable.');
      setWeather(null);
      setForecast(null);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, lat, lon]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return {
    weather,
    forecast,
    isLoading,
    error,
    refetch: fetchWeather,
    placeName,
    latitude: lat,
    longitude: lon,
    gridDisclaimer,
  };
}
