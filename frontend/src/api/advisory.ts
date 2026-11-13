import { apiRequest } from './client';
import {
  GrowthStageResponse,
  StageTasksResponse,
  AdvisoryPlan,
} from '../types/api';

export const advisoryApi = {
  getGrowthStage: async (
    crop: string = 'cotton',
    plantingDate: string = '2026-08-15'
  ): Promise<GrowthStageResponse> => {
    return apiRequest<GrowthStageResponse>(
      `/api/v1/advisory/stage?crop=${encodeURIComponent(crop)}&planting_date=${encodeURIComponent(plantingDate)}`
    );
  },

  getStageTasks: async (params?: {
    crop_cycle_id?: number;
    crop?: string;
    planting_date?: string;
  }): Promise<StageTasksResponse> => {
    const query = new URLSearchParams();
    if (params?.crop_cycle_id) query.append('crop_cycle_id', params.crop_cycle_id.toString());
    if (params?.crop) query.append('crop', params.crop);
    if (params?.planting_date) query.append('planting_date', params.planting_date);

    return apiRequest<StageTasksResponse>(`/api/v1/advisory/tasks?${query.toString()}`);
  },

  getAdvisoryPlan: async (payload: {
    farm_id: number;
    crop_cycle_id?: number;
    image_path?: string;
  }): Promise<AdvisoryPlan> => {
    return apiRequest<AdvisoryPlan>('/api/v1/advisory/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

