import { apiRequest } from './client';
import {
  IrrigationPlanPayload,
  IrrigationPlanResponse,
  IrrigationDiagnosisResponse,
} from '../types/api';

export async function getIrrigationPlan(
  payload: IrrigationPlanPayload
): Promise<IrrigationPlanResponse> {
  return apiRequest<IrrigationPlanResponse>('/api/v1/irrigation/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function diagnoseIrrigationIssue(
  formData: FormData
): Promise<IrrigationDiagnosisResponse> {
  return apiRequest<IrrigationDiagnosisResponse>('/api/v1/irrigation/diagnose', {
    method: 'POST',
    body: formData,
  });
}

