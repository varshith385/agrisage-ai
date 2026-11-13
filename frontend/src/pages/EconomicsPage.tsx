import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Sliders,
  Scale,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileSpreadsheet,
  Store,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getMandiPrices } from '../api/market';
import {
  calculateEconomics,
  compareCrops,
  simulateWhatIf,
  getCostTemplates,
} from '../api/economics';
import {
  EconomicsCalculationResponse,
  CropComparisonResponse,
  WhatIfResponse,
  CostLineItems,
} from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ExplainCard } from '../components/common/ExplainCard';
import { computeProfit } from '../utils/profitCalculator';

export const EconomicsPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { activeFarm, activeFarmId, setActiveFarmId, farms } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');

  // Input states
  const [area, setArea] = useState<number>(5.0);
  const [ownershipType, setOwnershipType] = useState<'owned' | 'leased' | 'mixed'>('mixed');
  const [ownedArea, setOwnedArea] = useState<number>(3.0);
  const [leasedArea, setLeasedArea] = useState<number>(2.0);
  const [leaseCostPerAcre, setLeaseCostPerAcre] = useState<number>(10000.0);
  const [expectedYield, setExpectedYield] = useState<number>(8.0);
  const [expectedPrice, setExpectedPrice] = useState<number>(7100.0);
  const [loanAmount, setLoanAmount] = useState<number>(0.0);
  const [loanInterestPct, setLoanInterestPct] = useState<number>(7.0);

  // Line item costs
  const [costs, setCosts] = useState<CostLineItems>({
    seed: 2400.0,
    fertilizer: 5500.0,
    pesticide: 4800.0,
    labour: 12000.0,
    machinery: 4000.0,
    irrigation: 2000.0,
    fuel: 1500.0,
    transport: 1200.0,
    storage: 500.0,
    other: 1100.0,
  });

  const [econResult, setEconResult] = useState<EconomicsCalculationResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CropComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any>(null);

  // What-If Simulator state
  const [whatIfVar, setWhatIfVar] = useState<'price' | 'yield' | 'area' | 'lease_cost'>('price');
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [sliderPrice, setSliderPrice] = useState<number>(7100);
  const [sliderYield, setSliderYield] = useState<number>(8.0);
  const [sliderArea, setSliderArea] = useState<number>(5.0);
  const [sliderLeaseRate, setSliderLeaseRate] = useState<number>(10000);
  const [irrigationType, setIrrigationType] = useState<string>('drip');

  const [showCostEditor, setShowCostEditor] = useState<boolean>(true);
  const [tenureTab, setTenureTab] = useState<'combined' | 'owned' | 'leased'>('combined');
  const [mandiPriceLoading, setMandiPriceLoading] = useState<boolean>(false);
  const [mandiFeedback, setMandiFeedback] = useState<string | null>(null);

  const handleUseMandiPrice = async () => {
    setMandiPriceLoading(true);
    try {
      const res = await getMandiPrices({ crop: selectedCrop });
      if (res.prices && res.prices.length > 0) {
        const modal = res.prices[0].modal_price;
        setExpectedPrice(modal);
        setSliderPrice(modal);
        setMandiFeedback(`${t('market.use_mandi_price_success')} ${modal} (${res.prices[0].mandi})`);
        setTimeout(() => setMandiFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to fetch mandi price:', err);
    } finally {
      setMandiPriceLoading(false);
    }
  };

  // Synchronize inputs with active farm
  useEffect(() => {
    if (activeFarm) {
      setArea(activeFarm.area);
      setOwnershipType(activeFarm.ownership_type as any);
      setOwnedArea(activeFarm.owned_area);
      setLeasedArea(activeFarm.leased_area);
      setSliderArea(activeFarm.area);
      if (activeFarm.lease_amount && activeFarm.lease_amount > 0) {
        setLeaseCostPerAcre(activeFarm.lease_amount);
        setSliderLeaseRate(activeFarm.lease_amount);
      }
      if (activeFarm.irrigation_method) {
        setIrrigationType(activeFarm.irrigation_method);
      }
      const activeCycle = activeFarm.current_crop_cycles?.find((c) => c.is_active);
      if (activeCycle) {
        setSelectedCrop(activeCycle.crop_name);
      }
    }
  }, [activeFarm]);

  useEffect(() => {
    getCostTemplates()
      .then((data: Record<string, any>) => setTemplates(data))
      .catch((err: unknown) => console.error('Failed to load templates:', err));
  }, []);

  // Recalculate economics
  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateEconomics({
        crop_name: selectedCrop,
        area: area,
        area_unit: 'acres',
        ownership_type: ownershipType,
        owned_area: ownedArea,
        leased_area: leasedArea,
        lease_cost_per_acre: leaseCostPerAcre,
        expected_yield_q_per_acre: expectedYield,
        yield_is_user_estimate: selectedCrop.toLowerCase() === 'cotton',
        expected_price_per_q: expectedPrice,
        custom_costs: costs,
        loan_amount: loanAmount,
        loan_interest_rate_pct: loanInterestPct,
      });
      setEconResult(res);

    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
    compareCrops({ area_acres: area, ownership_type: ownershipType, lease_cost_per_acre: leaseCostPerAcre })
      .then((data) => setCompareResult(data))
      .catch((err) => console.error('Failed to load crop comparisons:', err));
  }, [selectedCrop, area, ownershipType, ownedArea, leasedArea, leaseCostPerAcre, expectedYield, expectedPrice]);

  // Baseline calculation using pure computeProfit
  const baselineResult = useMemo(() => {
    return computeProfit({
      crop: selectedCrop,
      area: area,
      irrigation_type: irrigationType,
      lease_cost: leaseCostPerAcre,
      yield_per_acre: expectedYield,
      price_per_quintal: expectedPrice,
      editable_costs: costs,
      ownership_type: ownershipType,
      leased_area: leasedArea,
      loan_amount: loanAmount,
      loan_interest_rate_pct: loanInterestPct,
    });
  }, [
    selectedCrop,
    area,
    irrigationType,
    leaseCostPerAcre,
    expectedYield,
    expectedPrice,
    costs,
    ownershipType,
    leasedArea,
    loanAmount,
    loanInterestPct,
  ]);

  // Client-side instantaneous What-If calculation using pure computeProfit
  const liveResult = useMemo(() => {
    const calcLeasedArea =
      ownershipType === 'mixed'
        ? (area > 0 ? sliderArea * (leasedArea / area) : 0)
        : (ownershipType === 'leased' ? sliderArea : 0);

    return computeProfit({
      crop: selectedCrop,
      area: sliderArea,
      irrigation_type: irrigationType,
      lease_cost: sliderLeaseRate,
      yield_per_acre: sliderYield,
      price_per_quintal: sliderPrice,
      editable_costs: costs,
      ownership_type: ownershipType,
      leased_area: calcLeasedArea,
      loan_amount: loanAmount,
      loan_interest_rate_pct: loanInterestPct,
    });
  }, [
    selectedCrop,
    sliderArea,
    irrigationType,
    sliderLeaseRate,
    sliderYield,
    sliderPrice,
    costs,
    ownershipType,
    leasedArea,
    area,
    loanAmount,
    loanInterestPct,
  ]);

  const changeVsBaseline = liveResult.net_profit - baselineResult.net_profit;

  const handleResetWhatIf = () => {
    setSliderPrice(expectedPrice);
    setSliderYield(expectedYield);
    setSliderArea(area);
    setSliderLeaseRate(leaseCostPerAcre);
    setIrrigationType('drip');
  };

  const chartPoints = useMemo(() => {
    const points = [];
    const steps = 7;
    let minVal = Math.max(1000, sliderPrice * 0.7);
    let maxVal = sliderPrice * 1.3;
    if (whatIfVar === 'yield') {
      minVal = Math.max(1, sliderYield * 0.6);
      maxVal = sliderYield * 1.4;
    } else if (whatIfVar === 'area') {
      minVal = Math.max(1, sliderArea * 0.5);
      maxVal = sliderArea * 1.5;
    } else if (whatIfVar === 'lease_cost') {
      minVal = Math.max(0, sliderLeaseRate * 0.6);
      maxVal = sliderLeaseRate * 1.4;
    }

    const stepSize = (maxVal - minVal) / (steps - 1);
    for (let i = 0; i < steps; i++) {
      const v = minVal + i * stepSize;
      const roundedV = Math.round(v * 10) / 10;
      const testInputs = {
        crop: selectedCrop,
        area: whatIfVar === 'area' ? roundedV : sliderArea,
        irrigation_type: irrigationType,
        lease_cost: whatIfVar === 'lease_cost' ? roundedV : sliderLeaseRate,
        yield_per_acre: whatIfVar === 'yield' ? roundedV : sliderYield,
        price_per_quintal: whatIfVar === 'price' ? roundedV : sliderPrice,
        editable_costs: costs,
        ownership_type: ownershipType,
        leased_area:
          ownershipType === 'mixed'
            ? (area > 0 ? (whatIfVar === 'area' ? roundedV : sliderArea) * (leasedArea / area) : 0)
            : (ownershipType === 'leased' ? (whatIfVar === 'area' ? roundedV : sliderArea) : 0),
        loan_amount: loanAmount,
        loan_interest_rate_pct: loanInterestPct,
      };
      const res = computeProfit(testInputs);
      let label = `${roundedV}`;
      if (whatIfVar === 'price' || whatIfVar === 'lease_cost') {
        label = `₹${Math.round(roundedV).toLocaleString('en-IN')}`;
      } else if (whatIfVar === 'yield') {
        label = `${roundedV.toFixed(1)} q/ac`;
      } else if (whatIfVar === 'area') {
        label = `${roundedV.toFixed(1)} ac`;
      }
      points.push({
        variable_value: roundedV,
        label,
        net_profit: res.net_profit,
        revenue: res.gross_revenue,
        total_cost: res.total_cost,
        margin_pct: res.margin_pct,
      });
    }
    return points;
  }, [
    whatIfVar,
    sliderPrice,
    sliderYield,
    sliderArea,
    sliderLeaseRate,
    selectedCrop,
    irrigationType,
    costs,
    ownershipType,
    leasedArea,
    area,
    loanAmount,
    loanInterestPct,
  ]);

  // Debounced backend simulation (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateWhatIf({
        crop_name: selectedCrop,
        area_acres: sliderArea,
        ownership_type: ownershipType,
        owned_area: ownedArea,
        leased_area: leasedArea,
        lease_cost_per_acre: sliderLeaseRate,
        price_per_q: sliderPrice,
        yield_q_per_acre: sliderYield,
        operating_cost_per_acre: liveResult.operating_cost_per_acre,
        irrigation_type: irrigationType,
        loan_amount: loanAmount,
        loan_interest_rate_pct: loanInterestPct,
        sweep_variable: whatIfVar,
      })
        .then((res) => setWhatIfResult(res))
        .catch((err) => console.error('What-if backend error:', err));
    }, 350);

    return () => clearTimeout(timer);
  }, [
    selectedCrop,
    sliderPrice,
    sliderYield,
    sliderArea,
    sliderLeaseRate,
    irrigationType,
    whatIfVar,
    liveResult.operating_cost_per_acre,
    ownershipType,
    ownedArea,
    leasedArea,
    loanAmount,
    loanInterestPct,
  ]);

  const operatingPerAcre = useMemo(() => {
    return Object.values(costs).reduce((a, b) => a + b, 0);
  }, [costs]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-agri-gold-400 text-stone-900 rounded-md">
              {t('common.demo_mode')}
            </span>
            <StatusBadge status="WORKING" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-8 h-8 text-agri-green-700" />
            {t('economics.title')}
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            {t('economics.subtitle')}
          </p>
        </div>

        {/* Farm & Crop Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {farms.length > 0 && (
            <div className="flex items-center gap-2 bg-agri-cream-100/70 border border-agri-green-800/20 rounded-xl px-3 py-1.5 text-xs font-semibold text-agri-green-900">
              <div>
                <span className="text-[10px] uppercase text-stone-500 block">{t('farms.active_holding')}</span>
                <select
                  value={activeFarmId || ''}
                  onChange={(e) => setActiveFarmId(Number(e.target.value))}
                  className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.area} ac)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <select
            value={selectedCrop}
            onChange={(e) => {
              const c = e.target.value;
              setSelectedCrop(c);
              let y = 8.0;
              let p = 7100.0;
              if (c === 'Cotton') {
                y = 8.0;
                p = 7100.0;
              } else if (c === 'Rice') {
                y = 22.0;
                p = 2200.0;
              } else if (c === 'Maize') {
                y = 24.0;
                p = 2050.0;
              } else if (c === 'Chilli') {
                y = 14.0;
                p = 15500.0;
              } else if (c === 'Groundnut') {
                y = 9.5;
                p = 6400.0;
              }
              setExpectedYield(y);
              setExpectedPrice(p);
              setSliderYield(y);
              setSliderPrice(p);
            }}
            className="bg-white border border-stone-300 text-stone-900 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-agri-green-600"
          >
            <option value="Cotton">Cotton (పత్తి / कपास)</option>
            <option value="Rice">Rice (వరి / धान)</option>
            <option value="Maize">Maize (మొక్కజొన్న / मक्का)</option>
            <option value="Groundnut">Groundnut (వేరుశనగ / मूंगफली)</option>
            <option value="Chilli">Chilli (మిర్చి / मिर्च)</option>
            <option value="Tomato">Tomato (టమోటా / टमाटर)</option>
            <option value="Soybean">Soybean (సోయాచిక్కుడు / सोयाबीन)</option>
            <option value="Pulses">Pulses (కందులు / दालें)</option>
          </select>

          <button
            type="button"
            onClick={handleUseMandiPrice}
            disabled={mandiPriceLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-agri-gold-400 hover:bg-agri-gold-500 text-stone-900 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Use current APMC mandi modal price for this crop"
          >
            <Store className="w-4 h-4 text-agri-green-900" />
            <span>{mandiPriceLoading ? '...' : t('market.use_mandi_price')}</span>
          </button>
        </div>
      </div>

      {mandiFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mandiFeedback}</span>
        </div>
      )}

      {/* Honest Price & Yield Disclaimer Banner */}
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {t('economics.price_notice_title')}: <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">{t('economics.price_your_estimate')}</span> &bull; <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900">{t('economics.msp_not_verified')}</span>
          </p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            {selectedCrop === 'Cotton'
              ? 'Cotton is excluded from metric yield regressor per MODEL_CARD.md (official DES production recorded in 170 kg bales, not metric tonnes). Expected yield is user-entered.'
              : 'Expected yield defaults to historical district mean baseline per MODEL_CARD.md until local soil test is confirmed.'}
            {' '}Prices and costs are editable indicative estimates; edit each line item below to match your actual local expenditure.
          </p>
        </div>
      </div>

      {/* Financial KPIs Banner */}
      {econResult && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.gross_revenue')}</span>
            <div className="text-xl font-display font-black text-agri-green-800 mt-1">
              ₹{econResult.combined_summary.gross_revenue}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">{area} acres @ ₹{expectedPrice}/q</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.total_cost')}</span>
            <div className="text-xl font-display font-black text-stone-900 mt-1">
              ₹{econResult.combined_summary.total_cost}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">₹{econResult.combined_summary.total_cost_per_acre} / ac</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.net_profit')}</span>
            <div className={`text-xl font-display font-black mt-1 ${
              Number(econResult.combined_summary.net_profit.replace(/,/g, '')) >= 0
                ? 'text-agri-green-700'
                : 'text-red-600'
            }`}>
              ₹{econResult.combined_summary.net_profit}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">Margin: {econResult.combined_summary.margin_pct.toFixed(1)}%</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.break_even_price')}</span>
            <div className="text-xl font-display font-black text-stone-900 mt-1">
              ₹{econResult.combined_summary.break_even_price_per_q || 'N/A'}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">per quintal</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.break_even_yield')}</span>
            <div className="text-xl font-display font-black text-stone-900 mt-1">
              {econResult.combined_summary.break_even_yield_q_per_acre || 'N/A'}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">quintals / acre</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-subtle">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">{t('economics.tenure_type')}</span>
            <div className="text-xl font-display font-black text-agri-gold-700 capitalize mt-1">
              {ownershipType}
            </div>
            <span className="text-[10px] text-stone-500 font-medium">
              {ownershipType === 'mixed' ? `${ownedArea} ac own + ${leasedArea} ac lease` : `${area} acres`}
            </span>
          </div>
        </div>
      )}

      {/* Tenure Breakdown Tabs (Mixed Holding Math) */}
      {ownershipType === 'mixed' && econResult && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-agri-green-700" />
              <h3 className="text-base font-bold text-stone-900">
                {t('economics.tenure_comparison_title')} (Owned vs Leased Land)
              </h3>
            </div>
            <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setTenureTab('combined')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  tenureTab === 'combined' ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {t('economics.combined')} (5 ac)
              </button>
              <button
                onClick={() => setTenureTab('owned')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  tenureTab === 'owned' ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {t('economics.owned_portion')} ({ownedArea} ac)
              </button>
              <button
                onClick={() => setTenureTab('leased')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  tenureTab === 'leased' ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {t('economics.leased_portion')} ({leasedArea} ac)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
              <span className="text-xs font-bold text-stone-700 block mb-1">
                {tenureTab === 'combined' ? 'Combined Total Area' : (tenureTab === 'owned' ? 'Owned Area' : 'Leased Area')}
              </span>
              <p className="text-sm text-stone-600">
                Acreage: <strong className="text-stone-900">
                  {tenureTab === 'combined' ? area : (tenureTab === 'owned' ? ownedArea : leasedArea)} acres
                </strong>
              </p>
              <p className="text-sm text-stone-600 mt-1">
                Lease Cost Incurred:{' '}
                <strong className="text-stone-900">
                  ₹{tenureTab === 'combined' ? econResult.combined_summary.lease_cost_total : (tenureTab === 'owned' ? '0.00' : econResult.leased_tenure?.lease_cost_total)}
                </strong>
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
              <span className="text-xs font-bold text-stone-700 block mb-1">Cost & Margin</span>
              <p className="text-sm text-stone-600">
                Total Expenditure: <strong className="text-stone-900">
                  ₹{tenureTab === 'combined' ? econResult.combined_summary.total_cost : (tenureTab === 'owned' ? econResult.owned_tenure?.total_cost : econResult.leased_tenure?.total_cost)}
                </strong>
              </p>
              <p className="text-sm text-stone-600 mt-1">
                Net Margin:{' '}
                <strong className={
                  (tenureTab === 'combined' ? econResult.combined_summary.margin_pct : (tenureTab === 'owned' ? econResult.owned_tenure?.margin_pct : econResult.leased_tenure?.margin_pct)) || 0 >= 0
                    ? 'text-agri-green-700'
                    : 'text-red-600'
                }>
                  {(tenureTab === 'combined' ? econResult.combined_summary.margin_pct : (tenureTab === 'owned' ? econResult.owned_tenure?.margin_pct : econResult.leased_tenure?.margin_pct))?.toFixed(1)}%
                </strong>
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
              <span className="text-xs font-bold text-stone-700 block mb-1">Break-Even Benchmark</span>
              <p className="text-sm text-stone-600">
                Break-Even Price: <strong className="text-stone-900">
                  ₹{tenureTab === 'combined' ? econResult.combined_summary.break_even_price_per_q : (tenureTab === 'owned' ? econResult.owned_tenure?.break_even_price_per_q : econResult.leased_tenure?.break_even_price_per_q)} / q
                </strong>
              </p>
              <p className="text-sm text-stone-600 mt-1">
                Break-Even Yield: <strong className="text-stone-900">
                  {tenureTab === 'combined' ? econResult.combined_summary.break_even_yield_q_per_acre : (tenureTab === 'owned' ? econResult.owned_tenure?.break_even_yield_q_per_acre : econResult.leased_tenure?.break_even_yield_q_per_acre)} q/ac
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios: Best, Base, Worst */}
      {econResult && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('economics.scenarios_title')} (Yield & Price Volatility Sensitivity)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {econResult.scenarios.map((sc) => (
              <div
                key={sc.name}
                className={`p-4 rounded-2xl border transition-all ${
                  sc.name.includes('Best')
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : sc.name.includes('Worst')
                    ? 'bg-red-50/70 border-red-300'
                    : 'bg-stone-50/80 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-stone-900 text-sm">{sc.name}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    sc.is_profitable ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                  }`}>
                    {sc.is_profitable ? 'Profitable' : 'Deficit'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-3">{sc.description}</p>
                <div className="space-y-1.5 text-xs text-stone-700 border-t border-stone-200/60 pt-2">
                  <div className="flex justify-between">
                    <span>Yield:</span>
                    <strong>{sc.yield_q_per_acre} q/ac</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <strong>₹{sc.price_per_q} / q</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Gross Revenue:</span>
                    <strong>₹{sc.gross_revenue}</strong>
                  </div>
                  <div className="flex justify-between font-bold border-t border-stone-200/60 pt-1">
                    <span>Net Profit:</span>
                    <span className={sc.is_profitable ? 'text-agri-green-700' : 'text-red-600'}>
                      ₹{sc.net_profit}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Margin:</span>
                    <span>{sc.margin_pct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive What-If Simulator */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('economics.what_if_title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetWhatIf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition-all shadow-sm"
              title="Reset all simulator values to baseline defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('economics.what_if_reset_btn')}
            </button>
            <span className="text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
              {whatIfResult ? 'Instant pure-function model • backend synced' : 'Instant pure-function model'}
            </span>
          </div>
        </div>

        {/* Sweep Variable Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-stone-600">Sensitivity Variable:</span>
          {(['price', 'yield', 'area', 'lease_cost'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setWhatIfVar(v)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                whatIfVar === v
                  ? 'bg-agri-green-700 text-white border-agri-green-800 shadow-sm'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              {v.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Live Controls: Synchronized Sliders + Number Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
          {/* Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <label htmlFor="whatif-price">Expected Price (₹/q):</label>
            </div>
            <input
              id="whatif-price-number"
              type="number"
              min="1000"
              max="30000"
              step="50"
              value={sliderPrice}
              onChange={(e) => setSliderPrice(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-agri-green-800 focus:ring-2 focus:ring-agri-green-600 mb-1"
            />
            <input
              id="whatif-price"
              type="range"
              min="1000"
              max="25000"
              step="50"
              value={sliderPrice}
              onChange={(e) => setSliderPrice(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>₹1,000</span>
              <span>₹25,000</span>
            </div>
          </div>

          {/* Yield */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <label htmlFor="whatif-yield">Harvest Yield (q/ac):</label>
            </div>
            <input
              id="whatif-yield-number"
              type="number"
              min="1"
              max="40"
              step="0.5"
              value={sliderYield}
              onChange={(e) => setSliderYield(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-agri-green-800 focus:ring-2 focus:ring-agri-green-600 mb-1"
            />
            <input
              id="whatif-yield"
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={sliderYield}
              onChange={(e) => setSliderYield(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>1.0 q</span>
              <span>40.0 q</span>
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <label htmlFor="whatif-area">Total Area (acres):</label>
            </div>
            <input
              id="whatif-area-number"
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={sliderArea}
              onChange={(e) => setSliderArea(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-agri-green-800 focus:ring-2 focus:ring-agri-green-600 mb-1"
            />
            <input
              id="whatif-area"
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={sliderArea}
              onChange={(e) => setSliderArea(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>0.5 ac</span>
              <span>50 ac</span>
            </div>
          </div>

          {/* Lease Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <label htmlFor="whatif-lease">Lease Rate (₹/ac):</label>
            </div>
            <input
              id="whatif-lease-number"
              type="number"
              min="0"
              max="40000"
              step="500"
              value={sliderLeaseRate}
              onChange={(e) => setSliderLeaseRate(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-agri-green-800 focus:ring-2 focus:ring-agri-green-600 mb-1"
            />
            <input
              id="whatif-lease"
              type="range"
              min="0"
              max="40000"
              step="500"
              value={sliderLeaseRate}
              onChange={(e) => setSliderLeaseRate(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-500">
              <span>₹0</span>
              <span>₹40,000</span>
            </div>
          </div>

          {/* Irrigation Method */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <label htmlFor="whatif-irrigation">{t('economics.what_if_irrigation_method')}:</label>
            </div>
            <select
              id="whatif-irrigation"
              value={irrigationType}
              onChange={(e) => setIrrigationType(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-agri-green-600"
            >
              <option value="drip">Drip (-10% cost)</option>
              <option value="sprinkler">Sprinkler (Baseline)</option>
              <option value="furrow">Furrow (+15% cost)</option>
              <option value="flood">Flood (+30% cost)</option>
            </select>
            <span className="text-[10px] text-stone-500 block pt-1">
              Adjusts water cost factor
            </span>
          </div>
        </div>

        {/* Live Simulator Outcome Cards: Total Cost, Revenue, Net Profit, Margin, Break-even, Change vs Baseline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Net Profit */}
          <div className={`p-3.5 rounded-xl border col-span-2 sm:col-span-1 lg:col-span-1 ${
            liveResult.net_profit >= 0
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-red-50/90 border-red-300 text-red-950'
          }`}>
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_live_net_profit')}
            </span>
            <div className={`text-xl font-black mt-0.5 ${
              liveResult.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              ₹{liveResult.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Change vs Baseline */}
          <div className="p-3.5 rounded-xl border bg-stone-50 border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_change_vs_baseline')}
            </span>
            <div className={`text-base font-extrabold mt-0.5 ${
              changeVsBaseline > 0 ? 'text-emerald-700' : changeVsBaseline < 0 ? 'text-red-700' : 'text-stone-700'
            }`}>
              {changeVsBaseline > 0 ? '+' : ''}₹{Math.round(changeVsBaseline).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Revenue */}
          <div className="p-3.5 rounded-xl border bg-stone-50 border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_live_revenue')}
            </span>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              ₹{liveResult.gross_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Total Cost */}
          <div className="p-3.5 rounded-xl border bg-stone-50 border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_live_total_cost')}
            </span>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              ₹{liveResult.total_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Profit Margin */}
          <div className="p-3.5 rounded-xl border bg-stone-50 border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_profit_margin')}
            </span>
            <div className={`text-base font-extrabold mt-0.5 ${
              liveResult.margin_pct >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {liveResult.margin_pct.toFixed(1)}%
            </div>
          </div>

          {/* Break-Even Price */}
          <div className="p-3.5 rounded-xl border bg-stone-50 border-stone-200">
            <span className="text-[11px] font-bold text-stone-600 block">
              {t('economics.what_if_break_even_price')}
            </span>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              {liveResult.break_even_price !== null
                ? `₹${liveResult.break_even_price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}/q`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Profit-vs-Variable Chart */}
        <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-stone-800">
              {t('economics.what_if_chart_heading')} ({whatIfVar.replace('_', ' ').toUpperCase()})
            </span>
            <span className="text-[11px] text-stone-500">
              Green line represents simulated net profit curve
            </span>
          </div>
          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#78716c' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Net Profit']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d6d3d1', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} />
                <Line
                  type="monotone"
                  dataKey="net_profit"
                  stroke="#15803d"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#15803d' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sensitivity Point Badges */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] pt-1">
            {chartPoints.map((pt, idx) => (
              <div
                key={idx}
                className={`p-1.5 rounded-lg border ${
                  pt.net_profit >= 0
                    ? 'bg-emerald-50/80 border-emerald-200'
                    : 'bg-red-50/80 border-red-200'
                }`}
              >
                <span className="font-bold text-stone-800 block truncate">{pt.label}</span>
                <span className={`block font-extrabold ${pt.net_profit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                  ₹{Math.round(pt.net_profit / 1000)}k
                </span>
                <span className="text-stone-500 text-[9px]">{pt.margin_pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Itemized Cost-of-Cultivation Editor */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
        <div
          onClick={() => setShowCostEditor(!showCostEditor)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('economics.cost_editor_title')} (Per-Acre Expenditure Line Items)
            </h3>
          </div>
          <button className="text-xs text-stone-500 flex items-center gap-1 hover:text-stone-800">
            {showCostEditor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showCostEditor && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(costs).map(([key, val]) => (
                <div key={key} className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <label className="text-[11px] font-bold text-stone-700 capitalize block mb-1">
                    {key} (₹/ac)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={val}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setCosts((prev) => ({ ...prev, [key]: v }));
                    }}
                    className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                  />
                </div>
              ))}
            </div>

            {/* Crop Loan & KCC Borrowing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Crop Loan / KCC Principal (₹ Total)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                />
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Annual Loan Interest Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="36"
                  step="0.5"
                  value={loanInterestPct}
                  onChange={(e) => setLoanInterestPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-stone-200 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-600">
                  Operating Cost Subtotal:{' '}
                  <strong className="text-stone-900">₹{operatingPerAcre.toLocaleString()} / acre</strong>
                </span>
                {templates && templates[selectedCrop.toLowerCase()] && (
                  <button
                    type="button"
                    onClick={() => {
                      if (templates[selectedCrop.toLowerCase()]) {
                        setCosts(templates[selectedCrop.toLowerCase()].items);
                      }
                    }}
                    className="text-[11px] text-agri-green-700 underline font-semibold hover:text-agri-green-900"
                  >
                    Reset to {selectedCrop} Benchmark
                  </button>
                )}
              </div>
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
              >
                {loading ? 'Re-calculating...' : t('economics.recalculate_btn')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Candidate Crop Comparison Matrix */}
      {compareResult && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('economics.crop_comparison_title')} (Side-by-Side Agro-Financial Matrix)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                  <th className="p-3 font-bold">Crop</th>
                  <th className="p-3 font-bold">Duration</th>
                  <th className="p-3 font-bold">Water Need</th>
                  <th className="p-3 font-bold">Cost / ac</th>
                  <th className="p-3 font-bold">Exp. Yield</th>
                  <th className="p-3 font-bold">Exp. Price</th>
                  <th className="p-3 font-bold">Net Profit / ac</th>
                  <th className="p-3 font-bold">Margin</th>
                  <th className="p-3 font-bold">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {compareResult.crops.map((c) => (
                  <tr
                    key={c.crop_name}
                    className={`hover:bg-stone-50 transition-colors ${
                      c.crop_name.toLowerCase() === selectedCrop.toLowerCase() ? 'bg-agri-cream-50 font-bold' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-stone-900">
                      {c.crop_name}
                      {language === 'te' && c.crop_name_te && <span className="block text-[10px] text-stone-500 font-normal">{c.crop_name_te}</span>}
                      {language === 'hi' && c.crop_name_hi && <span className="block text-[10px] text-stone-500 font-normal">{c.crop_name_hi}</span>}
                    </td>
                    <td className="p-3 text-stone-700">{c.typical_duration_days} d</td>
                    <td className="p-3 text-stone-700">{c.water_need_mm} mm</td>
                    <td className="p-3 text-stone-700">₹{c.estimated_cost_per_acre.toLocaleString()}</td>
                    <td className="p-3 text-stone-700">{c.estimated_yield_q_per_acre} q</td>
                    <td className="p-3 text-stone-700">₹{c.estimated_price_per_q.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`font-bold ${c.estimated_net_profit_per_acre >= 0 ? 'text-agri-green-700' : 'text-red-600'}`}>
                        ₹{c.estimated_net_profit_per_acre.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-stone-700">{c.margin_pct.toFixed(1)}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.risk_level.includes('high') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal ExplainCard */}
      <ExplainCard
        title={t('economics.explain_title')}
        data={{
          value: 'Decimal Cost of Cultivation & Land Tenure Separation Architecture',
          status: 'WORKING',
          confidence: 0.88,
          confidence_type: 'heuristic',
          reasons: [
            "Cost calculations use Python Decimal arithmetic to eliminate binary floating point rounding anomalies.",
            "Owned land and leased land are computed as independent cost centers and combined for mixed tenure holdings.",
            "Break-even price indicates the minimum mandi realization required to cover operating and lease commitments.",
            "What-if simulator lets you test vulnerability against crop price collapses or adverse weather yield shocks.",
          ],
          sources: [
            "Indicative estimates entered by the project team, not taken from any published report; edit to your actual cost; verify with your local KVK or agriculture officer.",
          ],
          limitations: [
            "Mandi market price service is not yet integrated; price is user's estimate and MSP is unverified.",
            "Cotton yield regressor is not supported due to official non-metric bale units (170 kg bales vs tonnes).",
            "Cost templates represent regional indicative benchmarks; actual local costs may differ based on soil and weed pressure.",
          ],
        }}
      />
    </div>
  );
};
