export type UserRole = 'Farmer' | 'Expert' | 'Buyer' | 'Admin';
export type Language = 'en' | 'te' | 'hi';
export type OwnershipType = 'owned' | 'leased' | 'mixed';
export type IrrigationMethod = 'flood' | 'furrow' | 'sprinkler' | 'drip';
export type CropStage = 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity';
export type FeatureStatus = 'WORKING' | 'PARTIAL' | 'DEMO' | 'NOT STARTED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: UserRole;
  preferred_language: Language;
  is_active: boolean;
  is_demo_account: boolean;
  created_at: string;
}

export interface DemoFarmSummary {
  id: number;
  name: string;
  area: number;
  ownership_type: OwnershipType;
  owned_area: number;
  leased_area: number;
  lease_amount: number;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface DemoLoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  farm?: DemoFarmSummary | null;
  active_crop?: string | null;
  message?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CropHistory {
  id: number;
  crop_name: string;
  season: string;
  year: number;
  yield_obtained?: number | null;
  profit_realized?: number | null;
  created_at: string;
}

export interface CurrentCropCycle {
  id: number;
  crop_name: string;
  variety?: string | null;
  planting_date: string;
  expected_harvest_date?: string | null;
  current_stage: CropStage;
  is_active: boolean;
  created_at: string;
}

export interface Farm {
  id: number;
  user_id: number;
  name: string;
  area: number;
  ownership_type: OwnershipType;
  owned_area: number;
  leased_area: number;
  lease_amount: number;
  soil_type?: string | null;
  water_source?: string | null;
  irrigation_method: IrrigationMethod;
  budget: number;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  created_at: string;
  crops_history?: CropHistory[];
  current_crop_cycles?: CurrentCropCycle[];
}

export interface FarmCreatePayload {
  name: string;
  area: number;
  ownership_type: OwnershipType;
  owned_area: number;
  leased_area: number;
  lease_amount: number;
  soil_type?: string;
  water_source?: string;
  irrigation_method: IrrigationMethod;
  budget: number;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature_c: number;
  relative_humidity_pct: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  expected_rainfall_today_mm: number;
  reference_et0_mm: number;
  stale: boolean;
  fetched_at: string;
  source: string;
  village_coordinates_note?: string;
}

export interface DailyForecastItem {
  date: string;
  temp_min_c: number;
  temp_max_c: number;
  precipitation_probability_pct: number;
  precipitation_sum_mm: number;
  reference_et0_mm: number;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  daily: DailyForecastItem[];
  stale: boolean;
  fetched_at: string;
  source: string;
  village_coordinates_note?: string;
}

export interface ExplainabilitySchema {
  value: string;
  confidence: number;
  confidence_type: 'model_metric' | 'heuristic' | 'rule' | 'rule_based' | 'prediction_confidence';
  reasons: string[];
  sources: Array<string | { title?: string; name?: string; url?: string }>;
  status: FeatureStatus;
  limitations: string[];
}

export interface CropSuitabilityResponse extends ExplainabilitySchema {
  crop: string;
}

export interface VillageItem {
  village: string;
  lat: number;
  lon: number;
}

export interface LocationVillagesResponse {
  state: string;
  district: string;
  is_partial: boolean;
  note: string;
  villages: VillageItem[];
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  source: string;
  approximate: boolean;
}

export interface ApiErrorResponse {
  detail: string;
  error_code?: string;
  request_id?: string;
  timestamp?: string;
}

export interface AgentEnvelope<T = Record<string, any>> {
  agent_name: string;
  status: 'success' | 'degraded' | 'failed';
  timestamp: string;
  inputs_used: Record<string, any>;
  outputs: T;
  confidence: number;
  warnings: string[];
}

export interface WeatherReport {
  temperature_c: number;
  relative_humidity_pct: number;
  expected_rainfall_today_mm: number;
  rain_forecast_24h_mm: number;
  rain_forecast_48h_mm: number;
  reference_et0_mm: number;
  wind_speed_kmh: number;
  stale: boolean;
  source: string;
  fetched_at: string;
  status: 'WORKING' | 'PARTIAL' | 'DEMO';
}

export interface IrrigationPlan {
  status: 'WORKING' | 'PARTIAL' | 'DEMO' | 'stub';
  message: string;
  irrigate?: boolean | null;
  water_depth_mm?: number | null;
  litres_needed?: number | null;
  litres_saved?: number | null;
  recommendation_text?: string | null;
  rain_skip_triggered: boolean;
  foliar_wetness_caution: boolean;
  confidence: number;
}

export interface DiseaseFinding {
  status: 'WORKING' | 'PARTIAL' | 'DEMO' | 'stub';
  message: string;
  image_provided: boolean;
  detected_disease?: string | null;
  risk_level?: string | null;
  confidence: number;
  fungal_risk_elevated: boolean;
  safe_ipm_steps: string[];
}

export interface YieldEstimate {
  status: 'WORKING' | 'PARTIAL' | 'DEMO' | 'stub';
  message: string;
  expected_yield_quintals_per_acre?: number | null;
  yield_range_lower?: number | null;
  yield_range_upper?: number | null;
  adjustment_factors: string[];
  confidence: number;
}

export interface AdvisoryPlan {
  status: 'WORKING' | 'PARTIAL' | 'DEMO' | 'stub';
  message: string;
  farm_health_score?: number | null;
  seven_day_plan?: string[] | null;
  summary?: string | null;
  explainable_cards: ExplainabilitySchema[];
  confidence: number;
}

export interface Conflict {
  agent_a: string;
  agent_b: string;
  issue: string;
  resolution: string;
  rationale: string;
  rule_type: string;
  indicative: boolean;
}

export interface HandoffRecord {
  from_agent: string;
  to_agent: string;
  message: string;
  timestamp: string;
}

export interface OrchestratorRunResult {
  run_id: string;
  farm_id: number;
  status: string;
  duration_ms: number;
  handoffs: HandoffRecord[];
  conflicts: Conflict[];
  envelopes: Record<string, AgentEnvelope>;
  advisory_plan: AdvisoryPlan;
  created_at: string;
}

export interface AgentRunItem {
  id: number;
  run_id: string;
  farm_id?: number | null;
  agent_name?: string | null;
  trigger_type: string;
  status: string;
  duration_ms: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  warnings: string[];
  created_at: string;
}

export interface AgentRunRequest {
  farm_id: number;
  image_path?: string | null;
}

export interface QualityGateMetrics {
  width?: number;
  height?: number;
  mean_luminance?: number;
  sharpness_laplacian_var?: number;
  foliar_ratio?: number;
}

export interface QualityGateResult {
  passed: boolean;
  reason: string;
  metrics: QualityGateMetrics;
}

export interface PredictionCandidate {
  class_key: string;
  crop: string;
  disease_name: string;
  probability: number;
}

export interface SourceCitation {
  title?: string;
  name?: string;
  url?: string;
  source?: string;
  last_verified?: string;
  status?: string;
}

export interface WeatherFungalRisk {
  elevated: boolean;
  relative_humidity_pct?: number;
  rain_24h_mm?: number;
  explanation: string;
  indicative: boolean;
}

export interface DiseasePredictionResponse {
  success: boolean;
  quality_gate: QualityGateResult;
  predicted_class?: string | null;
  predicted_crop?: string | null;
  predicted_disease?: string | null;
  prediction_confidence?: number | null;
  confidence_type: string;
  is_uncertain: boolean;
  crop_supported: boolean;
  supported_crops: string[];
  top3_predictions: PredictionCandidate[];
  symptoms?: string | null;
  safe_ipm_steps: string[];
  sources: SourceCitation[];
  scheme_tags: string[];
  weather_fungal_risk?: WeatherFungalRisk | null;
  warnings: string[];
  reported_to_outbreak: boolean;
  outbreak_record_id?: number | null;
  error?: string | null;
}

export interface SupportedCropsResponse {
  model_name: string;
  num_classes: number;
  supported_crops: string[];
  unsupported_examples: string[];
  note: string;
}

export interface DiseaseHistoryItem {
  id: number;
  farm_id?: number | null;
  crop_hint?: string | null;
  predicted_disease: string;
  confidence: number;
  confidence_type: string;
  village: string;
  district: string;
  state: string;
  reported_to_outbreak: boolean;
  created_at: string;
}

export interface IrrigationPlanPayload {
  farm_id?: number;
  crop_name?: string;
  planting_date?: string;
  soil_type?: string;
  irrigation_method?: string;
  area_acres?: number;
  latitude?: number;
  longitude?: number;
  reference_et0_mm?: number;
  rain_forecast_24h_mm?: number;
  rain_forecast_48h_mm?: number;
  current_depletion_mm?: number;
}

export interface DailyBalanceItem {
  date: string;
  day_index: number;
  kc: number;
  et0_mm: number;
  etc_mm: number;
  rain_mm: number;
  effective_rain_mm: number;
  root_zone_depletion_mm: number;
  taw_mm: number;
  raw_mm: number;
  moisture_stress_risk: boolean;
  rain_skip_potential: boolean;
}

export interface IrrigationPlanResponse {
  crop_name: string;
  growth_stage: string;
  days_after_sowing: number;
  kc: number;
  reference_et0_mm: number;
  etc_today_mm: number;
  effective_rain_today_mm: number;
  should_irrigate: boolean;
  net_depth_mm: number;
  gross_depth_mm: number;
  litres_needed: number;
  litres_saved: number;
  rain_skip_triggered: boolean;
  next_irrigation_date: string;
  irrigation_method: string;
  method_efficiency: number;
  soil_type: string;
  awc_mm_per_m: number;
  taw_mm: number;
  raw_mm: number;
  depletion_today_mm: number;
  daily_forecast_balance: DailyBalanceItem[];
  recommendation_text: string;
  explanation: ExplainabilitySchema;
  status: FeatureStatus;
}

export interface FingerTestStep {
  step: number;
  title: string;
  instruction?: string;
  condition?: string;
  status?: string;
  action?: string;
}

export interface FingerTestGuide {
  title: string;
  notice: string;
  steps: FingerTestStep[];
}

export interface VisualCues {
  visual_indicator_disclaimer: string;
  aspect_ratio: number;
  green_foliar_ratio: number;
  wilting_or_yellowing_cue: string;
  surface_waterlogging_cue: string;
  color_tone: string;
}

export interface IrrigationDiagnosisResponse {
  category: string;
  title: string;
  severity: string;
  confidence: number;
  description: string;
  suggestions: string[];
  visual_cues?: VisualCues | null;
  finger_test_guide: FingerTestGuide;
  status: FeatureStatus;
}



