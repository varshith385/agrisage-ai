/**
 * AgriSage AI — Soil Health Card API Client
 * Module 20: /api/v1/soil-card
 */

import { apiRequest } from './client';

export interface SoilCardFieldConfidence {
  value: number | null;
  confidence: number;
  unit: string;
  status: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
  raw_match?: string | null;
}

export interface SoilCardExtractionResponse {
  engine_detected: string | null;
  available_engines: string[];
  install_instructions: Record<string, string>;
  nitrogen: SoilCardFieldConfidence;
  phosphorus: SoilCardFieldConfidence;
  potassium: SoilCardFieldConfidence;
  ph: SoilCardFieldConfidence;
  organic_carbon: SoilCardFieldConfidence;
  electrical_conductivity: SoilCardFieldConfidence;
  overall_confidence: number;
  preview_image_base64?: string | null;
  raw_text?: string | null;
  language: string;
  status: 'WORKING' | 'PARTIAL' | 'MANUAL_ONLY';
  notes: string[];
}

export interface SoilCardConfirmRequest {
  farm_id: number;
  nitrogen_kg_ha?: number | null;
  phosphorus_kg_ha?: number | null;
  potassium_kg_ha?: number | null;
  ph?: number | null;
  organic_carbon_pct?: number | null;
  electrical_conductivity_ds_m?: number | null;
  soil_texture?: string | null;
  store_image_opt_in: boolean;
  image_base64?: string | null;
  extraction_method?: string;
  field_confidences?: Record<string, number>;
}

export interface SoilCardConfirmResponse {
  success: boolean;
  message: string;
  card_id: number;
  farm_id: number;
  confirmed_values: Record<string, any>;
  created_at: string;
}

export interface SoilImpactAnalysisResponse {
  farm_id: number;
  crop_name: string;
  has_confirmed_soil_card: boolean;
  soil_values?: Record<string, any> | null;
  without_soil_card: {
    top_crops: Array<{ crop_name: string; probability: number }>;
    confidence: number;
    fallback_used: string;
    expected_yield_q_acre?: number | null;
    yield_range?: [number | null, number | null];
  };
  with_soil_card: {
    top_crops: Array<{ crop_name: string; probability: number }>;
    confidence: number;
    fallback_used: string;
    expected_yield_q_acre?: number | null;
    yield_range?: [number | null, number | null];
    soil_fertility_adjustment_pct: number;
  };
  impact_summary: string[];
  disclaimer: string;
}

export interface OcrEnginesResponse {
  engine_detected: string | null;
  available_engines: string[];
  install_instructions: Record<string, string>;
  powershell_help: Record<string, string>;
  status: string;
}

export async function getOcrEngines(): Promise<OcrEnginesResponse> {
  return apiRequest<OcrEnginesResponse>('/api/v1/soil-card/engines');
}

export async function extractSoilCard(formData: FormData): Promise<SoilCardExtractionResponse> {
  return apiRequest<SoilCardExtractionResponse>('/api/v1/soil-card/ocr', {
    method: 'POST',
    body: formData,
  });
}

export async function confirmSoilCard(payload: SoilCardConfirmRequest): Promise<SoilCardConfirmResponse> {
  return apiRequest<SoilCardConfirmResponse>('/api/v1/soil-card/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLatestSoilCard(farmId: number): Promise<{
  has_card: boolean;
  card?: any;
  message?: string;
}> {
  return apiRequest(`/api/v1/soil-card/latest?farm_id=${farmId}`);
}

export async function getSoilImpact(farmId: number, cropName?: string): Promise<SoilImpactAnalysisResponse> {
  return apiRequest<SoilImpactAnalysisResponse>('/api/v1/soil-card/impact', {
    method: 'POST',
    body: JSON.stringify({ farm_id: farmId, crop_name: cropName || 'Rice' }),
  });
}
