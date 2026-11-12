import { apiRequest } from './client';
import { LocationVillagesResponse, GeocodeResult } from '../types/api';

export const locationApi = {
  getStates: async (): Promise<string[]> => {
    return apiRequest<string[]>('/api/v1/location/states');
  },

  getDistricts: async (state: string): Promise<string[]> => {
    return apiRequest<string[]>(`/api/v1/location/districts?state=${encodeURIComponent(state)}`);
  },

  getVillages: async (state: string, district: string): Promise<LocationVillagesResponse> => {
    return apiRequest<LocationVillagesResponse>(
      `/api/v1/location/villages?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`
    );
  },

  geocode: async (query: string): Promise<GeocodeResult> => {
    return apiRequest<GeocodeResult>(`/api/v1/location/geocode?query=${encodeURIComponent(query)}`);
  },
};

