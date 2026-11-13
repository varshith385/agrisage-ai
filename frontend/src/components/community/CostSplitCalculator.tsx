import React, { useState } from 'react';
import { Calculator, TrendingDown, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { calculateTransportCostSplit } from '../../api/community';
import { CostSplitResult } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

export const CostSplitCalculator: React.FC = () => {
  const { t } = useTranslation();

  const [baseTruckCost, setBaseTruckCost] = useState<number>(3000);
  const [ratePerKm, setRatePerKm] = useState<number>(35);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(28);
  const [soloTempoBase, setSoloTempoBase] = useState<number>(1200);
  const [soloRatePerKm, setSoloRatePerKm] = useState<number>(25);
  const [splitMethod, setSplitMethod] = useState<'weight_share' | 'ton_km'>('weight_share');

  const [participants, setParticipants] = useState<Array<{ name: string; weight: number; dist: number }>>([
    { name: 'Ramesh (Demo Farmer)', weight: 25.0, dist: 28.0 },
    { name: 'Mallesh (Neighbor)', weight: 15.0, dist: 28.0 },
    { name: 'Kavitha (Neighbor)', weight: 10.0, dist: 24.0 },
  ]);

  const [calcResult, setCalcResult] = useState<CostSplitResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFormula, setShowFormula] = useState<boolean>(true);

  const handleAddParticipant = () => {
    setParticipants([
      ...participants,
      { name: `Farmer ${participants.length + 1}`, weight: 10.0, dist: totalDistanceKm },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (index: number, field: string, val: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: val };
    setParticipants(updated);
  };

  const runCalculation = async () => {
    setLoading(true);
    try {
      const res = await calculateTransportCostSplit({
        base_truck_cost: baseTruckCost,
        rate_per_km: ratePerKm,
        total_distance_km: totalDistanceKm,
        solo_tempo_base: soloTempoBase,
        solo_rate_per_km: soloRatePerKm,
        split_method: splitMethod,
        participants: participants.map((p) => ({
          name_or_alias: p.name,
          weight_quintals: Number(p.weight) || 1.0,
          pickup_distance_km: Number(p.dist) || totalDistanceKm,
        })),
      });
      setCalcResult(res);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-agri-gold-100 text-agri-green-900 rounded-lg">
                <Calculator className="w-5 h-5 text-agri-green-800" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {t('community.calculator.title')}
              </h2>
              <StatusBadge status="DEMO" />
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              {t('community.calculator.subtitle')}
            </p>
          </div>
        </div>

        {/* Truck & Solo Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-agri-cream-50/70 p-3.5 rounded-xl border border-agri-cream-200/80 space-y-1">
            <label className="text-xs font-bold text-stone-800 block">
              {t('community.calculator.truck_base')}
            </label>
            <input
              type="number"
              value={baseTruckCost}
              onChange={(e) => setBaseTruckCost(Number(e.target.value))}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900"
            />
            <span className="text-[10px] text-stone-500 block">Eicher 10-Tonne fixed rental base</span>
          </div>

          <div className="bg-agri-cream-50/70 p-3.5 rounded-xl border border-agri-cream-200/80 space-y-1">
            <label className="text-xs font-bold text-stone-800 block">
              {t('community.calculator.rate_km')}
            </label>
            <input
              type="number"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(Number(e.target.value))}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900"
            />
            <span className="text-[10px] text-stone-500 block">Diesel & driver rate per km</span>
          </div>

          <div className="bg-agri-cream-50/70 p-3.5 rounded-xl border border-agri-cream-200/80 space-y-1">
            <label className="text-xs font-bold text-stone-800 block">
              {t('community.calculator.trip_distance')}
            </label>
            <input
              type="number"
              value={totalDistanceKm}
              onChange={(e) => setTotalDistanceKm(Number(e.target.value))}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-900"
            />
            <span className="text-[10px] text-stone-500 block">Geikonda to Enumamula Mandi (~28 km)</span>
          </div>
        </div>

        {/* Solo Benchmark Inputs & Splitting Method */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pt-3 border-t border-stone-100">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              {t('community.calculator.method_label')}
            </label>
            <select
              value={splitMethod}
              onChange={(e) => setSplitMethod(e.target.value as any)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-900"
            >
              <option value="weight_share">{t('community.calculator.weight_share')}</option>
              <option value="ton_km">{t('community.calculator.ton_km')}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              {t('community.calculator.solo_base')}
            </label>
            <input
              type="number"
              value={soloTempoBase}
              onChange={(e) => setSoloTempoBase(Number(e.target.value))}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              {t('community.calculator.solo_km')}
            </label>
            <input
              type="number"
              value={soloRatePerKm}
              onChange={(e) => setSoloRatePerKm(Number(e.target.value))}
              className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900"
            />
          </div>
        </div>

        {/* Dynamic Participants Table */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Participating Farmers ({participants.length})
            </label>
            <button
              onClick={handleAddParticipant}
              className="flex items-center gap-1 text-xs font-bold text-agri-green-800 hover:text-agri-green-900 bg-agri-cream-100 hover:bg-agri-cream-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Farmer
            </button>
          </div>

          <div className="space-y-2">
            {participants.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80"
              >
                <div className="w-full sm:w-1/3">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdateParticipant(idx, 'name', e.target.value)}
                    placeholder="Farmer Name / Alias"
                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-900"
                  />
                </div>
                <div className="w-full sm:w-1/3 flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 shrink-0">Weight:</span>
                  <input
                    type="number"
                    step="0.5"
                    value={p.weight}
                    onChange={(e) => handleUpdateParticipant(idx, 'weight', Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-900 font-semibold"
                  />
                  <span className="text-[11px] text-stone-500 shrink-0">q</span>
                </div>
                <div className="w-full sm:w-1/3 flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 shrink-0">Distance:</span>
                  <input
                    type="number"
                    value={p.dist}
                    onChange={(e) => handleUpdateParticipant(idx, 'dist', Number(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-stone-900 font-semibold"
                  />
                  <span className="text-[11px] text-stone-500 shrink-0">km</span>
                  {participants.length > 1 && (
                    <button
                      onClick={() => handleRemoveParticipant(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculate Action Button */}
        <button
          onClick={runCalculation}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          {loading ? 'Computing Fair Freight Allocation...' : t('community.calculator.calc_btn')}
        </button>
      </div>

      {/* Results Section */}
      {calcResult && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-6 animate-fadeIn">
          {/* Top Headline Savings Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 font-medium block">
                {t('community.calculator.total_pooled')}
              </span>
              <span className="text-xl font-bold text-stone-900">
                ₹{calcResult.total_truck_cost.toLocaleString()}
              </span>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 font-medium block">
                {t('community.calculator.total_solo')}
              </span>
              <span className="text-xl font-bold text-stone-600 line-through">
                ₹{calcResult.total_solo_cost.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold block flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-emerald-700" />
                {t('community.calculator.net_savings')}
              </span>
              <span className="text-xl font-bold text-emerald-900">
                ₹{calcResult.total_savings.toLocaleString()}{' '}
                <span className="text-xs text-emerald-700 font-bold">
                  ({calcResult.total_savings_percentage}% saved)
                </span>
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">
              {t('community.calculator.participants_breakdown')}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">{t('community.calculator.farmer_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.weight_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.dist_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.share_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.allocated_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.solo_col')}</th>
                    <th className="px-4 py-2.5">{t('community.calculator.savings_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {calcResult.participants.map((p, i) => (
                    <tr key={i} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-stone-900">{p.name_or_alias}</td>
                      <td className="px-4 py-2.5">{p.weight_quintals} q</td>
                      <td className="px-4 py-2.5">{p.pickup_distance_km} km</td>
                      <td className="px-4 py-2.5 font-semibold text-stone-700">{p.share_percentage}%</td>
                      <td className="px-4 py-2.5 font-bold text-agri-green-900">₹{p.allocated_cost.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-stone-500">₹{p.solo_cost.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-700">
                        ₹{p.savings.toLocaleString()}{' '}
                        <span className="text-[10px] font-semibold text-emerald-600">
                          ({p.savings_percentage}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transparent Formula & Method Explanation */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs text-stone-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-stone-500" />
                Transparent Cost-Splitting Formula & Explanations
              </span>
              <button
                onClick={() => setShowFormula(!showFormula)}
                className="text-stone-500 hover:text-stone-800 font-semibold text-[11px]"
              >
                {showFormula ? 'Hide' : 'Show'} Formula
              </button>
            </div>
            {showFormula && (
              <div className="pt-2 text-[11px] leading-relaxed text-stone-600 space-y-2 border-t border-stone-200/60 font-mono">
                <p>
                  <strong>1. Total Pooled Truck Cost:</strong> C_truck = Fixed_Base (₹{baseTruckCost}) + [Rate/km (₹{ratePerKm}) × Distance ({totalDistanceKm} km)] = ₹{calcResult.total_truck_cost}
                </p>
                <p>
                  <strong>2. Proportional Allocation:</strong> Share_i = (Weight_i / Total_Weight) × C_truck. Prevents cross-subsidization.
                </p>
                <p>
                  <strong>3. Solo Benchmark:</strong> Solo_i = Base_Hire (₹{soloTempoBase}) + [Solo_km (₹{soloRatePerKm}) × Distance_i].
                </p>
                <p>
                  <strong>4. Individual Savings:</strong> Savings_i = Solo_i - Allocated_i.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
