/**
 * AgriSage AI — Voice Assistant API Client
 * Module 21: /api/v1/voice
 */

import { apiRequest } from './client';

export interface VoiceQueryRequest {
  query: string;
  language?: 'en' | 'te' | 'hi';
  farm_id?: number;
}

export interface VoiceQueryResponse {
  intent: 'weather' | 'irrigation' | 'disease' | 'cost' | 'scheme' | 'price' | 'greeting' | 'about' | 'thanks' | 'bye' | 'general' | string;
  confidence: number;
  confidence_type: 'rule' | 'model' | 'fallback';
  spoken_text: string;
  status: 'WORKING' | 'PARTIAL' | 'DEMO';
  sources: string[];
  action_link?: string;
  action_label?: string;
  structured_data?: Record<string, any>;
  limitations: string[];
  upstream_status?: string;
  suggestion_chips?: string[];
  timestamp: string;
}

export async function queryVoiceAssistant(
  payload: VoiceQueryRequest
): Promise<VoiceQueryResponse> {
  return apiRequest<VoiceQueryResponse>('/api/v1/voice/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

