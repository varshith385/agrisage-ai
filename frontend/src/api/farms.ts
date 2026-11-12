import { apiRequest } from './client';
import { Farm, FarmCreatePayload } from '../types/api';

export const farmsApi = {
  getFarms: async (): Promise<Farm[]> => {
    return apiRequest<Farm[]>('/api/v1/farms');
  },

  getFarmById: async (id: number): Promise<Farm> => {
    return apiRequest<Farm>(`/api/v1/farms/${id}`);
  },

  createFarm: async (payload: FarmCreatePayload): Promise<Farm> => {
    return apiRequest<Farm>('/api/v1/farms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

