import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Droplets,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Upload,
  RefreshCw,
  Gauge,
  Compass,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getIrrigationPlan, diagnoseIrrigationIssue } from '../api/irrigation';
import { farmsApi } from '../api/farms';
import {
  Farm,
  CurrentCropCycle,
  IrrigationPlanResponse,
  IrrigationDiagnosisResponse,
  IrrigationPlanPayload,
} from '../types/api';
import { ExplainCard } from '../components/common/ExplainCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

const SUPPORTED_CROPS = [
  'Cotton',
  'Rice',
  'Wheat',
  'Maize',
  'Groundnut',
  'Chilli',
  'Tomato',
  'Sugarcane',
  'Soybean',
  'Pulses',
];

const SOIL_TYPES = [
  'Black Cotton',
  'Red Loam',
  'Alluvial',
  'Clay',
  'Sandy Loam',
  'Loam',
];

const IRRIGATION_METHODS = [
  { id: 'drip', name: 'Drip Irrigation', eff: '90%' },
  { id: 'sprinkler', name: 'Sprinkler', eff: '75%' },
  { id: 'furrow', name: 'Furrow', eff: '60%' },
  { id: 'flood', name: 'Flood Irrigation', eff: '50%' },
];

export const IrrigationPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeFarm } = useAuth();

  // Farm holdings
  const { data: farms = [] } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: farmsApi.getFarms,
  });

  // Selected parameters
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
  const [cropName, setCropName] = useState<string>('Cotton');
  const [plantingDate, setPlantingDate] = useState<string>(
    new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [soilType, setSoilType] = useState<string>('Black Cotton');
  const [irrigationMethod, setIrrigationMethod] = useState<string>('drip');
  const [areaAcres, setAreaAcres] = useState<number>(2.5);

  // Initialize farm parameters from active farm or first farm
  useEffect(() => {
    if (farms.length > 0 && selectedFarmId === undefined) {
      const targetFarm = activeFarm ? farms.find((f) => f.id === activeFarm.id) || farms[0] : farms[0];
      setSelectedFarmId(targetFarm.id);
      setAreaAcres(targetFarm.area || 2.5);
      if (targetFarm.soil_type) setSoilType(targetFarm.soil_type);
      if (targetFarm.irrigation_method) setIrrigationMethod(targetFarm.irrigation_method);

      const activeCycle = targetFarm.current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropName(activeCycle.crop_name);
        if (activeCycle.planting_date) {
          setPlantingDate(activeCycle.planting_date);
        }
      }
    }
  }, [farms, activeFarm, selectedFarmId]);

  // When farmer selects a different holding
  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = Number(e.target.value);
    setSelectedFarmId(fId);
    const chosen = farms.find((f) => f.id === fId);
    if (chosen) {
      setAreaAcres(chosen.area || 2.5);
      if (chosen.soil_type) setSoilType(chosen.soil_type);
      if (chosen.irrigation_method) setIrrigationMethod(chosen.irrigation_method);
      const activeCycle = chosen.current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropName(activeCycle.crop_name);
        if (activeCycle.planting_date) setPlantingDate(activeCycle.planting_date);
      }
    }
  };

  // Plan Query
  const planPayload: IrrigationPlanPayload = useMemo(() => {
    return {
      farm_id: selectedFarmId,
      crop_name: cropName,
      planting_date: plantingDate,
      soil_type: soilType,
      irrigation_method: irrigationMethod,
      area_acres: areaAcres,
    };
  }, [selectedFarmId, cropName, plantingDate, soilType, irrigationMethod, areaAcres]);

  const {
    data: plan,
    isLoading: isLoadingPlan,
    isRefetching: isRefetchingPlan,
    refetch: refetchPlan,
  } = useQuery<IrrigationPlanResponse>({
    queryKey: ['irrigationPlan', planPayload],
    queryFn: () => getIrrigationPlan(planPayload),
    enabled: !!cropName,
  });

  // Diagnostic State
  const [problemText, setProblemText] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<IrrigationDiagnosisResponse | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const diagnoseMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (problemText.trim()) {
        formData.append('text_query', problemText.trim());
      }
      if (photoFile) {
        formData.append('file', photoFile);
      }
      if (selectedFarmId) {
        formData.append('farm_id', String(selectedFarmId));
      }
      return diagnoseIrrigationIssue(formData);
    },
    onSuccess: (data) => {
      setDiagnosisResult(data);
    },
  });

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim() && !photoFile) return;
    diagnoseMutation.mutate();
  };

  // Format 7-day balance chart data
  const chartData = useMemo(() => {
    if (!plan?.daily_forecast_balance) return [];
    return plan.daily_forecast_balance.map((item) => {
      const d = new Date(item.date);
      const dayLabel = d.toLocaleDateString(
        language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-US',
        { weekday: 'short', day: 'numeric' }
      );
      return {
        name: dayLabel,
        rain: item.rain_mm,
        etc: item.etc_mm,
        depletion: item.root_zone_depletion_mm,
        raw: item.raw_mm,
        taw: item.taw_mm,
      };
    });
  }, [plan, language]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-agri-soil-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-agri-green-100 text-agri-green-800 border border-agri-green-300">
              <Droplets className="w-3.5 h-3.5 text-agri-green-700" />
              {t('irrigation.badge_fao')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
              {t('irrigation.badge_water_savings')}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {t('irrigation.title')}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {t('irrigation.subtitle')}
          </p>
        </div>

        <button
          onClick={() => refetchPlan()}
          disabled={isLoadingPlan || isRefetchingPlan}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-agri-green-800 text-white hover:bg-agri-green-900 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetchingPlan ? 'animate-spin' : ''}`} />
          {t('irrigation.calculate_btn')}
        </button>
      </div>

      {/* Farm & Crop Calibration Panel */}
      <section className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-agri-soil-600" />
          {t('irrigation.farm_config_title')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Farm selector */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              {t('irrigation.select_farm')}
            </label>
            <select
              value={selectedFarmId || ''}
              onChange={handleFarmChange}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area} ac • {f.village})
                </option>
              ))}
            </select>
          </div>

          {/* Crop Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              {t('irrigation.crop_name')}
            </label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
            >
              {SUPPORTED_CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Planting Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              {t('irrigation.planting_date')}
            </label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
            />
          </div>

          {/* Soil Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              {t('irrigation.soil_type')}
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
            >
              {SOIL_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Irrigation Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              {t('irrigation.irrigation_method')}
            </label>
            <select
              value={irrigationMethod}
              onChange={(e) => setIrrigationMethod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-agri-green-600 focus:outline-none capitalize"
            >
              {IRRIGATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.eff})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Plan Results Loading */}
      {isLoadingPlan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-64 rounded-3xl" />
          <LoadingSkeleton className="h-64 rounded-3xl md:col-span-2" />
        </div>
      )}

      {/* Hero Recommendation Cards */}
      {plan && !isLoadingPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Card */}
          <div
            className={`rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between ${
              plan.rain_skip_triggered
                ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-agri-green-900 border border-teal-500/40'
                : plan.should_irrigate
                ? 'bg-gradient-to-br from-agri-soil-800 via-amber-900 to-agri-green-950 border border-amber-500/40'
                : 'bg-gradient-to-br from-agri-green-800 via-agri-green-900 to-stone-900 border border-agri-green-600/40'
            }`}
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                  <Droplets className="w-3.5 h-3.5 text-agri-gold-400" />
                  {t('irrigation.next_irrigation_title')}
                </span>
                <span className="text-xs font-mono text-white/80 bg-black/20 px-2.5 py-1 rounded-lg">
                  {plan.crop_name} • {plan.growth_stage}
                </span>
              </div>

              {/* Status Header */}
              {plan.rain_skip_triggered ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-teal-300">
                    <CloudRain className="w-6 h-6 animate-bounce" />
                    <h3 className="font-display text-xl sm:text-2xl font-black">
                      {t('irrigation.rain_skip_active')}
                    </h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {plan.recommendation_text}
                  </p>
                </div>
              ) : plan.should_irrigate ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-agri-gold-400">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="font-display text-xl sm:text-2xl font-black">
                      {t('irrigation.irrigate_now')}
                    </h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {plan.recommendation_text}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                    <h3 className="font-display text-xl sm:text-2xl font-black">
                      {t('irrigation.adequate_moisture')}
                    </h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {plan.recommendation_text}
                  </p>
                </div>
              )}
            </div>

            {/* Depth & Litres Metric */}
            <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                  {t('irrigation.gross_depth')}
                </span>
                <span className="text-xl font-black font-display text-white">
                  {plan.gross_depth_mm.toFixed(1)} mm
                </span>
                <span className="text-[10px] text-white/60 block mt-0.5">
                  ({plan.irrigation_method} • {(plan.method_efficiency * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                  {t('irrigation.water_volume')}
                </span>
                <span className="text-xl font-black font-display text-agri-gold-300">
                  {plan.litres_needed.toLocaleString()} L
                </span>
                <span className="text-[10px] text-white/60 block mt-0.5">
                  {areaAcres} {t('irrigation.farm_area')}
                </span>
              </div>
            </div>
          </div>

          {/* Conservation & Phenology Strip */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Litres Saved Highlight */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-teal-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-teal-600" />
                    {t('irrigation.litres_saved_title')}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-teal-200/70 text-teal-900 rounded-full">
                    {plan.rain_skip_triggered ? 'Rain Active' : 'Optimal'}
                  </span>
                </div>
                <div className="text-3xl font-extrabold font-display text-teal-950 my-2">
                  {plan.litres_saved.toLocaleString()} <span className="text-base font-normal text-teal-700">Litres</span>
                </div>
                <p className="text-xs text-teal-800 leading-relaxed">
                  {t('irrigation.litres_saved_desc')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-200/60 flex items-center justify-between text-xs text-teal-900 font-semibold">
                <span>{t('irrigation.next_irrigation_title')}:</span>
                <span className="font-mono bg-white px-2 py-1 rounded-md border border-teal-300">
                  {plan.next_irrigation_date}
                </span>
              </div>
            </div>

            {/* FAO-56 Soil & Stage Telemetry Card */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-agri-green-700" />
                  FAO-56 Soil Bucket Model
                </h4>
                <StatusBadge status={plan.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">
                    {t('irrigation.growth_stage_label')}
                  </span>
                  <span className="font-bold text-stone-900 capitalize">
                    {plan.growth_stage} (DAS {plan.days_after_sowing})
                  </span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">
                    {t('irrigation.kc_label')}
                  </span>
                  <span className="font-bold text-stone-900 font-mono">
                    {plan.kc.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">
                    Daily Demand (ETc)
                  </span>
                  <span className="font-bold text-agri-green-800 font-mono">
                    {plan.etc_today_mm.toFixed(1)} mm/day
                  </span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">
                    Depletion / RAW
                  </span>
                  <span className="font-bold text-stone-900 font-mono">
                    {plan.depletion_today_mm.toFixed(1)} / {plan.raw_mm.toFixed(1)} mm
                  </span>
                </div>
              </div>

              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 transition-all ${
                    plan.depletion_today_mm >= plan.raw_mm
                      ? 'bg-amber-600'
                      : 'bg-agri-green-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (plan.depletion_today_mm / Math.max(1, plan.taw_mm)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Water Balance Chart */}
      {plan && !isLoadingPlan && chartData.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-agri-green-700" />
                {t('irrigation.water_balance_heading')}
              </h3>
              <p className="text-xs text-stone-500">
                Comparing forecasted rainfall, crop evapotranspiration demand (ETc), and soil root-zone depletion against RAW limit.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                {t('irrigation.rain_mm')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#d97706]" />
                {t('irrigation.etc_mm')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#b45309]" />
                {t('irrigation.depletion_mm')}
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine
                  y={plan.raw_mm}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{
                    value: `RAW Limit (${plan.raw_mm.toFixed(1)} mm)`,
                    fill: '#dc2626',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Bar dataKey="rain" name={t('irrigation.rain_mm')} fill="#0284c7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="etc" name={t('irrigation.etc_mm')} fill="#d97706" radius={[6, 6, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="depletion"
                  name={t('irrigation.depletion_mm')}
                  stroke="#b45309"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* "Should I Grow This Crop Now?" (Water Availability Feasibility) */}
      <section className="bg-gradient-to-br from-agri-cream-100 to-white border border-agri-soil-200 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-agri-soil-700" />
            <h3 className="font-display text-base font-bold text-stone-900">
              {t('irrigation.suitability_title')}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-agri-green-100 text-agri-green-800 rounded-full border border-agri-green-300">
            Rule-Based Assessment
          </span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          {t('irrigation.suitability_desc')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-stone-200">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">
              Seasonal Crop Water Need
            </span>
            <span className="text-sm font-bold text-stone-900 block mt-1">
              {cropName === 'Rice'
                ? '1200 – 1400 mm'
                : cropName === 'Sugarcane'
                ? '1500 – 2200 mm'
                : cropName === 'Cotton'
                ? '700 – 850 mm'
                : cropName === 'Chilli' || cropName === 'Tomato'
                ? '600 – 750 mm'
                : '400 – 550 mm'}
            </span>
            <span className="text-[10px] text-stone-500">Total lifecycle requirement</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">
              Irrigation Suitability
            </span>
            <span className="text-sm font-bold text-agri-green-800 block mt-1">
              {irrigationMethod === 'drip'
                ? 'High Water Efficiency'
                : irrigationMethod === 'sprinkler'
                ? 'Moderate Efficiency'
                : 'Heavy Water Depletion'}
            </span>
            <span className="text-[10px] text-stone-500">
              {irrigationMethod === 'drip'
                ? 'Recommended for semi-arid zones'
                : 'Risk of conveyance & percolation losses'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-stone-200">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">
              Soil Retention Capacity
            </span>
            <span className="text-sm font-bold text-stone-900 block mt-1">
              {soilType === 'Black Cotton' ? 'High (190 mm/m AWC)' : 'Moderate (140 mm/m AWC)'}
            </span>
            <span className="text-[10px] text-stone-500">Buffering against short dry spells</span>
          </div>
        </div>
      </section>

      {/* Field Problem Diagnostician & In-Field Finger Test Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnostic Form */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                {t('irrigation.diagnose_title')}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {t('irrigation.diagnose_subtitle')}
              </p>
            </div>
            <StatusBadge status="PARTIAL" />
          </div>

          <form onSubmit={handleDiagnose} className="space-y-4">
            <div>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder={t('irrigation.issue_input_placeholder')}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-agri-green-600"
              />
            </div>

            {/* Photo Attachment (Optional) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                {t('irrigation.upload_photo')}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer">
                  <Upload className="w-4 h-4 text-stone-500" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                {photoFile && (
                  <span className="text-xs text-agri-green-800 font-semibold truncate max-w-[200px]">
                    {photoFile.name}
                  </span>
                )}
              </div>
              {photoPreview && (
                <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-stone-300">
                  <img src={photoPreview} alt="Field preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={(!problemText.trim() && !photoFile) || diagnoseMutation.isPending}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {diagnoseMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('irrigation.diagnosing')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('irrigation.diagnose_btn')}
                </>
              )}
            </button>
          </form>

          {/* Diagnostic Result Output */}
          {diagnosisResult && (
            <div className="mt-4 pt-4 border-t border-stone-200 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {t('irrigation.diagnostic_result')}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    diagnosisResult.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : diagnosisResult.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {diagnosisResult.severity}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-sm text-stone-900">
                  {diagnosisResult.title}
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {diagnosisResult.description}
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  {t('irrigation.suggestions_heading')}
                </h5>
                <ul className="space-y-1">
                  {diagnosisResult.suggestions.map((sug: string, idx: number) => (
                    <li key={idx} className="text-xs text-stone-700 flex items-start gap-2 leading-relaxed">
                      <span className="text-agri-gold-600 font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Photo Visual Cues Disclaimer */}
              {diagnosisResult.visual_cues && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t('irrigation.visual_cue_heading')}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium">
                    {diagnosisResult.visual_cues.visual_indicator_disclaimer}
                  </p>
                  <div className="text-[10px] text-amber-900/80 pt-1">
                    Cues: {diagnosisResult.visual_cues.wilting_or_yellowing_cue} •{' '}
                    {diagnosisResult.visual_cues.surface_waterlogging_cue}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* In-Field Finger Moisture Test Guide */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-agri-green-100 text-agri-green-800">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h3 className="font-display text-base font-bold text-stone-900">
                {t('irrigation.finger_test_title')}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {t('irrigation.finger_test_notice')}
            </p>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-agri-green-800 text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-stone-900">Insertion & Depth</span>
              </div>
              <p className="text-xs text-stone-600 pl-7">
                Insert your index finger 5 to 8 cm (2 to 3 inches) deep into the root zone soil directly under the crop canopy.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold text-amber-950">Dry & Crumbly</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  WATER STRESS
                </span>
              </div>
              <p className="text-xs text-amber-900/90 pl-7">
                Soil feels dry, hard, dusty, or crumbles without clinging. <strong className="font-bold">Action: Irrigate immediately.</strong>
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-bold text-emerald-950">Moist & Pliable</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  ADEQUATE
                </span>
              </div>
              <p className="text-xs text-emerald-900/90 pl-7">
                Soil feels cool, damp, clings lightly, and forms a loose ball without releasing water. <strong className="font-bold">Action: Do not irrigate today.</strong>
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">
                    4
                  </span>
                  <span className="text-xs font-bold text-blue-950">Wet & Muddy</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                  WATERLOGGED
                </span>
              </div>
              <p className="text-xs text-blue-900/90 pl-7">
                Soil leaves glistening mud on skin or oozes free water droplets. <strong className="font-bold">Action: Halt all watering and clear drainage paths.</strong>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Explainability Section */}
      {plan?.explanation && (
        <section className="space-y-4">
          <ExplainCard
            title="FAO-56 Crop Water Model Explainability"
            data={plan.explanation}
          />
        </section>
      )}
    </div>
  );
};

export default IrrigationPage;
