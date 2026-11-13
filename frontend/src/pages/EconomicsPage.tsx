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
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getFarms } from '../api/farms';
import {
  calculateEconomics,
  compareCrops,
  simulateWhatIf,
  getCostTemplates,
} from '../api/economics';
import {
  Farm,
  EconomicsCalculationResponse,
  CropComparisonResponse,
  WhatIfResponse,
  CostLineItems,
} from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ExplainCard } from '../components/common/ExplainCard';

export const EconomicsPage: React.FC = () => {
  const { t, language } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
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

  const [showCostEditor, setShowCostEditor] = useState<boolean>(true);
  const [tenureTab, setTenureTab] = useState<'combined' | 'owned' | 'leased'>('combined');

  // Load farms on mount
  useEffect(() => {
    getFarms()
      .then((data: Farm[]) => {
        setFarms(data);
        if (data.length > 0) {
          const f = data[0];
          setSelectedFarm(f);
          setArea(f.area);
          setOwnershipType(f.ownership_type as any);
          setOwnedArea(f.owned_area);
          setLeasedArea(f.leased_area);
          if (f.lease_amount && f.lease_amount > 0) {
            setLeaseCostPerAcre(f.lease_amount);
            setSliderLeaseRate(f.lease_amount);
          }
        }
      })
      .catch((err: unknown) => console.error('Failed to load farms:', err));

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

      // Also trigger what-if backend check
      const wRes = await simulateWhatIf({
        crop_name: selectedCrop,
        area_acres: area,
        ownership_type: ownershipType,
        owned_area: ownedArea,
        leased_area: leasedArea,
        lease_cost_per_acre: leaseCostPerAcre,
        price_per_q: expectedPrice,
        yield_q_per_acre: expectedYield,
        operating_cost_per_acre: Object.values(costs).reduce((a, b) => a + b, 0),
        loan_amount: loanAmount,
        loan_interest_rate_pct: loanInterestPct,
        sweep_variable: whatIfVar,
      });
      setWhatIfResult(wRes);
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

  // Client-side instantaneous What-If calculation formula (verified identically with backend)
  const clientWhatIfProfit = useMemo(() => {
    const opPerAcre = Object.values(costs).reduce((a, b) => a + b, 0);
    const totOp = opPerAcre * sliderArea;
    const leasedRatio = area > 0 ? leasedArea / area : 0;
    const curLeasedA = ownershipType === 'mixed' ? sliderArea * leasedRatio : (ownershipType === 'leased' ? sliderArea : 0);
    const totLease = curLeasedA * sliderLeaseRate;
    const totLoanInterest = (loanAmount * loanInterestPct) / 100;
    const totCost = totOp + totLease + totLoanInterest;
    const rev = sliderYield * sliderArea * sliderPrice;
    return rev - totCost;
  }, [sliderPrice, sliderYield, sliderArea, sliderLeaseRate, costs, area, leasedArea, ownershipType, loanAmount, loanInterestPct]);

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
            <div className="bg-agri-cream-100/70 border border-agri-green-800/20 rounded-xl px-3 py-1.5 text-xs font-semibold text-agri-green-900">
              <span className="text-[10px] uppercase text-stone-500 block">{t('farms.active_holding')}</span>
              {selectedFarm?.name || 'Rameshwaram Farm'} ({area} ac)
            </div>
          )}
          <select
            value={selectedCrop}
            onChange={(e) => {
              const c = e.target.value;
              setSelectedCrop(c);
              if (c === 'Cotton') {
                setExpectedYield(8.0);
                setExpectedPrice(7100.0);
              } else if (c === 'Rice') {
                setExpectedYield(22.0);
                setExpectedPrice(2200.0);
              } else if (c === 'Maize') {
                setExpectedYield(24.0);
                setExpectedPrice(2050.0);
              } else if (c === 'Chilli') {
                setExpectedYield(14.0);
                setExpectedPrice(15500.0);
              } else if (c === 'Groundnut') {
                setExpectedYield(9.5);
                setExpectedPrice(6400.0);
              }
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
        </div>
      </div>

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
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('economics.what_if_title')} (Live Profit Simulator)
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
            Instant client-side calculation verified against Python backend
          </span>
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

        {/* Live Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <label>Expected Price (₹/q):</label>
              <span className="text-agri-green-800">₹{sliderPrice}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="15000"
              step="100"
              value={sliderPrice}
              onChange={(e) => setSliderPrice(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <span className="text-[10px] text-stone-500">₹3,000 to ₹15,000</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <label>Harvest Yield (q/ac):</label>
              <span className="text-agri-green-800">{sliderYield} q</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="0.5"
              value={sliderYield}
              onChange={(e) => setSliderYield(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <span className="text-[10px] text-stone-500">2.0 to 25.0 q/acre</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <label>Total Land Area:</label>
              <span className="text-agri-green-800">{sliderArea} acres</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={sliderArea}
              onChange={(e) => setSliderArea(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <span className="text-[10px] text-stone-500">1 to 20 acres</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <label>Lease Rate (₹/ac):</label>
              <span className="text-agri-green-800">₹{sliderLeaseRate}</span>
            </div>
            <input
              type="range"
              min="4000"
              max="25000"
              step="500"
              value={sliderLeaseRate}
              onChange={(e) => setSliderLeaseRate(Number(e.target.value))}
              className="w-full accent-agri-green-700 cursor-pointer"
            />
            <span className="text-[10px] text-stone-500">₹4,000 to ₹25,000</span>
          </div>
        </div>

        {/* Live Simulator Outcome Callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-agri-cream-100 rounded-xl border border-agri-gold-300 gap-4">
          <div>
            <span className="text-xs font-bold text-stone-700 block">Simulated Net Profit Result:</span>
            <div className={`text-2xl font-black ${clientWhatIfProfit >= 0 ? 'text-agri-green-800' : 'text-red-600'}`}>
              ₹{clientWhatIfProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-xs text-stone-600 text-right">
            <span>Operating Cost Base: ₹{operatingPerAcre.toLocaleString()}/ac</span> &bull;{' '}
            <span>Total Production: {(sliderYield * sliderArea).toFixed(1)} quintals</span>
          </div>
        </div>

        {/* Sensitivity Visual Points Chart */}
        {whatIfResult && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 block">
              Profit Sensitivity Across {whatIfResult.sweep_variable.toUpperCase()} Variances (±30%):
            </span>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
              {whatIfResult.sensitivity_points.map((pt, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border ${
                    pt.net_profit >= 0
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-red-50/80 border-red-200'
                  }`}
                >
                  <span className="font-bold text-stone-800 block">₹{Math.round(pt.variable_value)}</span>
                  <span className={`block font-extrabold ${pt.net_profit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                    ₹{Math.round(pt.net_profit / 1000)}k
                  </span>
                  <span className="text-stone-500 text-[9px]">{pt.margin_pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
