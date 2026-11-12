import { apiRequest } from './client';
import { CurrentWeather, WeatherForecast, CropSuitabilityResponse } from '../types/api';

export const weatherApi = {
  getCurrentWeather: async (lat: number, lon: number): Promise<CurrentWeather> => {
    return apiRequest<CurrentWeather>(`/api/v1/weather/current?lat=${lat}&lon=${lon}`);
  },

  getForecast: async (lat: number, lon: number): Promise<WeatherForecast> => {
    return apiRequest<WeatherForecast>(`/api/v1/weather/forecast?lat=${lat}&lon=${lon}`);
  },

  getCropSuitability: async (crop: string, lat: number, lon: number): Promise<CropSuitabilityResponse> => {
    return apiRequest<CropSuitabilityResponse>(
      `/api/v1/weather/suitability?crop=${encodeURIComponent(crop)}&lat=${lat}&lon=${lon}`
    );
  },
};

