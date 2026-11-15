import { apiRequest } from './client';
import { CurrentWeather, WeatherForecast, CropSuitabilityResponse } from '../types/api';

export const weatherApi = {
  getCurrentWeather: async (lat?: number, lon?: number, farmId?: number): Promise<CurrentWeather> => {
    let url = '/api/v1/weather/current';
    if (farmId != null) {
      url += `?farm_id=${farmId}`;
    } else if (lat != null && lon != null) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    return apiRequest<CurrentWeather>(url);
  },

  getForecast: async (lat?: number, lon?: number, farmId?: number): Promise<WeatherForecast> => {
    let url = '/api/v1/weather/forecast';
    if (farmId != null) {
      url += `?farm_id=${farmId}`;
    } else if (lat != null && lon != null) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    return apiRequest<WeatherForecast>(url);
  },

  getFarmWeather: async (farmId: number): Promise<WeatherForecast> => {
    return apiRequest<WeatherForecast>(`/api/v1/weather/farm/${farmId}`);
  },

  getCropSuitability: async (crop: string, lat: number, lon: number): Promise<CropSuitabilityResponse> => {
    return apiRequest<CropSuitabilityResponse>(
      `/api/v1/weather/suitability?crop=${encodeURIComponent(crop)}&lat=${lat}&lon=${lon}`
    );
  },

  getClimateNormals: async (lat: number, lon: number): Promise<{
    latitude: number;
    longitude: number;
    mean_temperature_c: number;
    mean_relative_humidity_pct: number;
    mean_monthly_rainfall_mm: number;
    annual_rainfall_mm: number;
    window_start_date: string;
    window_end_date: string;
    window_days: number;
    source: string;
    formula_note: string;
  }> => {
    return apiRequest(`/api/v1/weather/climate-normals?lat=${lat}&lon=${lon}`);
  },
};

