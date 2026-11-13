import { apiRequest } from './client';
import {
  CropCalendarResponse,
  CropComparisonResponse,
  CropRotationResponse,
  EconomicsCalculationRequest,
  EconomicsCalculationResponse,
  SeasonalAwarenessResponse,
  WhatIfRequest,
  WhatIfResponse,
} from '../types/api';

export async function calculateEconomics(
  payload: EconomicsCalculationRequest
): Promise<EconomicsCalculationResponse> {
  return apiRequest<EconomicsCalculationResponse>('/api/v1/economics/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCostTemplates(): Promise<any> {
  return apiRequest<any>('/api/v1/economics/templates', {
    method: 'GET',
  });
}

export async function compareCrops(params: {
  area_acres?: number;
  ownership_type?: string;
  leased_ratio?: number;
  lease_cost_per_acre?: number;
}): Promise<CropComparisonResponse> {
  const query = new URLSearchParams();
  if (params.area_acres) query.set('area_acres', params.area_acres.toString());
  if (params.ownership_type) query.set('ownership_type', params.ownership_type);
  if (params.leased_ratio !== undefined) query.set('leased_ratio', params.leased_ratio.toString());
  if (params.lease_cost_per_acre !== undefined) query.set('lease_cost_per_acre', params.lease_cost_per_acre.toString());

  return apiRequest<CropComparisonResponse>(`/api/v1/economics/compare?${query.toString()}`, {
    method: 'GET',
  });
}

export async function simulateWhatIf(payload: WhatIfRequest): Promise<WhatIfResponse> {
  return apiRequest<WhatIfResponse>('/api/v1/economics/what-if', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRotationRecommendations(previous_crop: string = 'Cotton'): Promise<CropRotationResponse> {
  return apiRequest<CropRotationResponse>(`/api/v1/rotation/recommend?previous_crop=${encodeURIComponent(previous_crop)}`, {
    method: 'GET',
  });
}

export async function getCropCalendar(params: {
  crop_name?: string;
  planting_date?: string;
}): Promise<CropCalendarResponse> {
  const query = new URLSearchParams();
  if (params.crop_name) query.set('crop_name', params.crop_name);
  if (params.planting_date) query.set('planting_date', params.planting_date);

  return apiRequest<CropCalendarResponse>(`/api/v1/calendar/events?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getSeasonalAwareness(params?: {
  month?: number;
  lat?: number;
  lon?: number;
}): Promise<SeasonalAwarenessResponse> {
  const query = new URLSearchParams();
  if (params?.month) query.set('month', params.month.toString());
  if (params?.lat) query.set('lat', params.lat.toString());
  if (params?.lon) query.set('lon', params.lon.toString());

  return apiRequest<SeasonalAwarenessResponse>(`/api/v1/calendar/season?${query.toString()}`, {
    method: 'GET',
  });
}
