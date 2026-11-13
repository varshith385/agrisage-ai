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

export interface PhenologicalStageInfo {
  stage_key: string;
  stage_name_en: string;
  stage_name_te: string;
  stage_name_hi: string;
  start_das: number;
  end_das: number;
  duration_days: number;
  fao56_kc_stage: string;
  is_current: boolean;
  progress_pct: number;
}

export interface AgronomicTaskItem {
  id: string;
  title: string;
  category: 'irrigation' | 'fertilizer' | 'scouting' | 'spraying' | 'cultural';
  description: string;
  criticality: 'high' | 'medium' | 'low';
  guidance_disclaimer: string;
  dosages_included: boolean;
}

export interface StageTasksResponse {
  crop_name: string;
  current_stage: string;
  days_after_sowing: number;
  tasks: AgronomicTaskItem[];
  source_notes: string;
}

export interface GrowthStageResponse {
  crop_name: string;
  planting_date: string;
  days_after_sowing: number;
  current_stage: string;
  current_stage_te: string;
  current_stage_hi: string;
  fao56_kc_stage: string;
  stage_progress_pct: number;
  cycle_progress_pct: number;
  estimated_days_to_next_stage?: number | null;
  next_stage_name?: string | null;
  total_crop_duration_days: number;
  stages_timeline: PhenologicalStageInfo[];
  stage_guidance: Record<string, string>;
  source_notes: string;
}

export interface HealthScoreComponent {
  name: string;
  key: string;
  score?: number | null;
  nominal_weight: number;
  normalized_weight?: number | null;
  status: 'INCLUDED' | 'EXCLUDED';
  exclusion_reason?: string | null;
  inputs_used: Record<string, any>;
  rationale: string;
  threshold_notes: string;
}

export interface FarmHealthScoreBreakdown {
  score?: number | null;
  status: 'COMPUTED' | 'INSUFFICIENT_DATA';
  active_components_count: number;
  total_components_count: number;
  summary: string;
  formula_description: string;
  components: HealthScoreComponent[];
}

export interface SevenDayPlanItem {
  day_number: number;
  date_str: string;
  action: string;
  action_te?: string | null;
  action_hi?: string | null;
  reason: string;
  reason_te?: string | null;
  reason_hi?: string | null;
  priority: 'high' | 'medium' | 'low';
  responsible_agent: string;
  source: string;
  translation_status: 'translated' | 'untranslated_marked';
}

export interface HeadlineYieldSummary {
  crop_name: string;
  is_supported: boolean;
  headline_yield_quintals_per_acre?: number | null;
  headline_label: string;
  ml_range_lower?: number | null;
  ml_range_upper?: number | null;
  district_mean_baseline?: number | null;
  unit: string;
  disclaimer: string;
}

export interface AdvisoryPlan {
  status: 'WORKING' | 'PARTIAL' | 'DEMO' | 'stub';
  message: string;
  farm_health_score?: number | null;
  farm_health_breakdown?: FarmHealthScoreBreakdown | null;
  seven_day_plan?: SevenDayPlanItem[] | string[] | null;
  headline_yield?: HeadlineYieldSummary | null;
  growth_stage?: GrowthStageResponse | null;
  risk_alerts?: string[];
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

export interface CropCandidate {
  crop_name: string;
  probability: number;
  reasons: string[];
  climate_suitable: boolean;
  suitability_note?: string | null;
}

export interface CropRecommendationResponse {
  top_crops: CropCandidate[];
  soil_values_missing: boolean;
  fallback_used: string;
  confidence: number;
  confidence_type: string;
  supported_crops: string[];
  unsupported_common_crops: string[];
  climate_warnings: string[];
  explanation: ExplainabilitySchema;
  status: FeatureStatus;
}

export interface CostLineItems {
  seed: number;
  fertilizer: number;
  pesticide: number;
  labour: number;
  machinery: number;
  irrigation: number;
  fuel: number;
  transport: number;
  storage: number;
  other: number;
}

export interface TenureEconomicsDetail {
  area_acres: number;
  operating_cost_total: string;
  operating_cost_per_acre: string;
  lease_cost_total: string;
  loan_interest_total: string;
  total_cost: string;
  total_cost_per_acre: string;
  gross_revenue: string;
  gross_profit: string;
  net_profit: string;
  margin_pct: number;
  break_even_price_per_q?: string | null;
  break_even_yield_q_per_acre?: string | null;
}

export interface ScenarioOutcome {
  name: string;
  description: string;
  yield_q_per_acre: number;
  price_per_q: number;
  gross_revenue: string;
  total_cost: string;
  net_profit: string;
  margin_pct: number;
  is_profitable: boolean;
}

export interface EconomicsCalculationRequest {
  crop_name: string;
  area: number;
  area_unit?: 'acres' | 'hectares';
  ownership_type: 'owned' | 'leased' | 'mixed';
  owned_area?: number | null;
  leased_area?: number | null;
  lease_cost_per_acre?: number | null;
  irrigation_method?: string;
  expected_yield_q_per_acre: number;
  yield_is_user_estimate?: boolean;
  expected_price_per_q: number;
  custom_costs?: CostLineItems | null;
  loan_amount?: number;
  loan_interest_rate_pct?: number;
  loan_tenure_months?: number;
}

export interface EconomicsCalculationResponse {
  crop_name: string;
  crop_name_te?: string;
  crop_name_hi?: string;
  area_acres: number;
  ownership_type: string;
  owned_area_acres: number;
  leased_area_acres: number;
  expected_yield_q_per_acre: number;
  yield_source_label: string;
  expected_price_per_q: number;
  price_source_label: string;
  itemized_costs_per_acre: Record<string, number>;
  owned_tenure?: TenureEconomicsDetail | null;
  leased_tenure?: TenureEconomicsDetail | null;
  combined_summary: TenureEconomicsDetail;
  scenarios: ScenarioOutcome[];
  disclaimer: string;
  status: FeatureStatus;
}

export interface CropComparisonItem {
  crop_name: string;
  crop_name_te: string;
  crop_name_hi: string;
  typical_duration_days: number;
  water_need_mm: number;
  risk_level: string;
  estimated_cost_per_acre: number;
  estimated_yield_q_per_acre: number;
  estimated_price_per_q: number;
  estimated_revenue_per_acre: number;
  estimated_net_profit_per_acre: number;
  margin_pct: number;
  break_even_price_per_q: number;
  break_even_yield_q_per_acre: number;
}

export interface CropComparisonResponse {
  area_acres: number;
  ownership_type: string;
  crops: CropComparisonItem[];
  disclaimer: string;
  status: FeatureStatus;
}

export interface WhatIfRequest {
  crop_name?: string;
  area_acres: number;
  ownership_type: 'owned' | 'leased' | 'mixed';
  owned_area: number;
  leased_area: number;
  lease_cost_per_acre: number;
  price_per_q: number;
  yield_q_per_acre: number;
  operating_cost_per_acre: number;
  loan_amount?: number;
  loan_interest_rate_pct?: number;
  sweep_variable: 'price' | 'yield' | 'area' | 'lease_cost';
  sweep_range_pct?: number;
}

export interface WhatIfPoint {
  variable_value: number;
  revenue: number;
  total_cost: number;
  net_profit: number;
  margin_pct: number;
}

export interface WhatIfResponse {
  current_net_profit: number;
  current_margin_pct: number;
  break_even_price_per_q?: number | null;
  break_even_yield_q_per_acre?: number | null;
  sweep_variable: string;
  sensitivity_points: WhatIfPoint[];
  formula_used: string;
  status: FeatureStatus;
}

export interface RotationSuggestionItem {
  crop_name: string;
  crop_name_te?: string;
  crop_name_hi?: string;
  crop_family: string;
  benefit_category: 'nitrogen_fixation' | 'pest_cycle_break' | 'disease_prevention' | 'soil_structure' | 'moisture_conservation';
  rationale: string;
  precaution: string;
  suitable_seasons: string[];
  agronomic_source: string;
  is_rule_based: boolean;
}

export interface CropRotationResponse {
  previous_crop: string;
  previous_crop_family: string;
  primary_agronomic_risks: string[];
  avoid_crops: string[];
  avoid_reason: string;
  recommended_rotations: RotationSuggestionItem[];
  source_notes: string;
  status: FeatureStatus;
}

export interface LifecycleStageItem {
  stage_id: string;
  stage_name_en: string;
  stage_name_te?: string;
  stage_name_hi?: string;
  start_das: number;
  end_das: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  key_activities: string[];
}

export interface CalendarEventItem {
  event_id: string;
  title: string;
  title_te?: string;
  title_hi?: string;
  event_type: 'irrigation' | 'fertilizer' | 'scouting' | 'sowing' | 'harvest' | 'field_work';
  start_date: string;
  end_date?: string | null;
  growth_stage: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  notification_text: string;
}

export interface SeasonalAwarenessResponse {
  current_season: 'Kharif' | 'Rabi' | 'Zaid';
  season_name_te: string;
  season_name_hi: string;
  season_period: string;
  current_month: string;
  climate_expectations: Record<string, string>;
  typical_crops: string[];
  primary_risks: string[];
  general_guidance: string;
  status: FeatureStatus;
}

export interface CropCalendarResponse {
  crop_name: string;
  planting_date: string;
  days_after_sowing: number;
  current_stage: string;
  total_duration_days: number;
  lifecycle_stages: LifecycleStageItem[];
  events: CalendarEventItem[];
  status: FeatureStatus;
}

// ==========================================
// Market & Marketplace Types (Module 12 & 13)
// ==========================================

export interface MandiPriceRecord {
  mandi: string;
  district: string;
  state: string;
  commodity: string;
  variety?: string | null;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  is_demo: boolean;
  source: string;
  last_verified?: string | null;
}

export interface MandiPriceResponse {
  crop: string;
  district?: string | null;
  state?: string | null;
  prices: MandiPriceRecord[];
  total_records: number;
  source: string;
  fetched_at: string;
  demo: boolean;
}

export interface NetRealizationItem {
  mandi: string;
  district: string;
  state: string;
  modal_price: number;
  quantity_quintals: number;
  distance_km: number;
  transport_rate_per_km_per_q: number;
  transport_cost: number;
  market_fee_pct: number;
  market_fee: number;
  gross_revenue: number;
  net_realization: number;
  net_realization_per_q: number;
  rank: number;
  reasoning: string;
  is_demo: boolean;
  source: string;
}

export interface NetRealizationRankingResponse {
  crop: string;
  quantity_quintals: number;
  farmer_latitude: number;
  farmer_longitude: number;
  transport_rate_assumption: number;
  market_fee_pct_assumption: number;
  assumptions_note: string;
  rankings: NetRealizationItem[];
  best_mandi?: NetRealizationItem | null;
  source: string;
  fetched_at: string;
  demo: boolean;
}

export interface MSPBenchmarkItem {
  crop: string;
  variety: string;
  season: string;
  year: string;
  msp_per_quintal?: number | null;
  source_url: string;
  source_organization: string;
  last_verified?: string | null;
}

export interface MSPComparisonResponse {
  crop: string;
  expected_price_per_q: number;
  msp_verified: boolean;
  benchmark?: MSPBenchmarkItem | null;
  status_label: 'above_msp' | 'below_msp' | 'at_msp' | 'msp_not_verified';
  variance_amount?: number | null;
  variance_pct?: number | null;
  explanation: string;
  source_url?: string | null;
  last_verified?: string | null;
  status?: string;
  demo: boolean;
}

export interface HistoricalPricePoint {
  month_year: string;
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  arrivals_tonnes?: number | null;
  is_forecast?: boolean;
}

export interface PriceTrendResponse {
  crop: string;
  mandi: string;
  historical_prices: HistoricalPricePoint[];
  forecast_prices: HistoricalPricePoint[];
  trend_direction: 'rising' | 'stable' | 'falling';
  best_time_to_sell_hint: string;
  seasonal_pattern_summary: string;
  error_margin_pct?: number | null;
  disclaimer: string;
  is_indicative: boolean;
  status?: string;
  source: string;
  demo: boolean;
}

export interface WarehouseItem {
  name: string;
  warehouse_type: string;
  district: string;
  state: string;
  distance_km?: number | null;
  capacity_mt: number;
  daily_charge_per_quintal: number;
  source: string;
  demo: boolean;
}

export interface WarehouseResponse {
  warehouses: WarehouseItem[];
  farmer_latitude?: number | null;
  farmer_longitude?: number | null;
  source: string;
  demo: boolean;
}

export interface FarmerContactDetails {
  full_name: string;
  phone_number?: string | null;
  email?: string | null;
}

export interface ListingResponse {
  id: number;
  farmer_id: number;
  farmer_name: string;
  crop_name: string;
  variety?: string | null;
  quantity_quintals: number;
  expected_price_per_q: number;
  state: string;
  district: string;
  village: string;
  harvest_date: string;
  description?: string | null;
  status: string;
  is_verified_seller: boolean;
  is_owner: boolean;
  farmer_contact?: FarmerContactDetails | null;
  contact_unlocked: boolean;
  inquiry_count: number;
  average_rating?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ListingCreatePayload {
  crop_name: string;
  variety?: string;
  quantity_quintals: number;
  expected_price_per_q: number;
  state: string;
  district: string;
  village: string;
  harvest_date: string;
  description?: string;
}

export interface InquiryResponse {
  id: number;
  listing_id: number;
  listing_crop: string;
  listing_village: string;
  buyer_id: number;
  buyer_name: string;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  offered_price_per_q: number;
  quantity_quintals: number;
  message?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  farmer_contact?: FarmerContactDetails | null;
  contact_unlocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface InquiryCreatePayload {
  listing_id: number;
  offered_price_per_q: number;
  quantity_quintals: number;
  message?: string;
}

export interface ReviewResponse {
  id: number;
  farmer_id: number;
  buyer_id: number;
  buyer_name: string;
  listing_id?: number | null;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface ReviewCreatePayload {
  farmer_id: number;
  listing_id?: number;
  rating: number;
  comment?: string;
}





