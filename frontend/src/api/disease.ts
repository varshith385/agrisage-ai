import { apiRequest } from './client';
import {
  DiseasePredictionResponse,
  SupportedCropsResponse,
  DiseaseHistoryItem,
} from '../types/api';

export async function predictPlantDisease(
  formData: FormData
): Promise<DiseasePredictionResponse> {
  return apiRequest<DiseasePredictionResponse>('/api/v1/disease/predict', {
    method: 'POST',
    body: formData,
  });
}

export async function getSupportedCrops(): Promise<SupportedCropsResponse> {
  return apiRequest<SupportedCropsResponse>('/api/v1/disease/supported-crops', {
    method: 'GET',
  });
}

export async function getDiseaseHistory(): Promise<DiseaseHistoryItem[]> {
  return apiRequest<DiseaseHistoryItem[]>('/api/v1/disease/history', {
    method: 'GET',
  });
}
