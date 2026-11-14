import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Sliders,
  Scale,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Store,
  Check,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Coins,
  Receipt,
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
import { usePictorial } from '../context/PictorialContext';
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
import { ExplainCard } from '../components/common/ExplainCard';
import { computeProfit } from '../utils/profitCalculator';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { MoneyProfitIllustration, CoinStackGauge } from '../components/common/FarmerIllustrations';
import { ModeToggleHero } from '../components/common/ModeToggleHero';
import { PictorialTile } from '../components/common/PictorialTile';
import { StepFlow } from '../components/common/StepFlow';

export const EconomicsPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();
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

  const [tenureTab, setTenureTab] = useState<'combined' | 'owned' | 'leased'>('combined');
  const [mandiPriceLoading, setMandiPriceLoading] = useState<boolean>(false);
  const [mandiFeedback, setMandiFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'whatif' | 'costs' | 'tenure' | 'scenarios' | 'matrix' | 'methodology'>('whatif');

  const handleUseMandiPrice = async () => {
    setMandiPriceLoading(true);
    try {
      const res = await getMandiPrices({ crop: selectedCrop });
      if (res.prices && res.prices.length > 0) {
        const modal = res.prices[0].modal_price;
        setExpectedPrice(modal);
        setSliderPrice(modal);
        setMandiFeedback(`${t('market.use_mandi_price_success')} ₹${modal} (${res.prices[0].mandi})`);
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

  // Plain meaning explanation
  const plainMeaning = liveResult.net_profit >= 0
    ? `At current price of ₹${sliderPrice}/q and harvest yield of ${sliderYield} q/acre, your estimated net profit is ₹${Math.round(liveResult.net_profit).toLocaleString('en-IN')} with a ${liveResult.margin_pct.toFixed(1)}% margin.`
    : `Warning: Projected net deficit of ₹${Math.abs(Math.round(liveResult.net_profit)).toLocaleString('en-IN')}. Break-even requires at least ₹${liveResult.break_even_price?.toFixed(0) || 'N/A'}/q or reduced operating expenditure.`;

  // PICTORIAL MODE v2
  if (isPictorial) {
    const isProfit = liveResult.net_profit >= 0;
    const profitVal = liveResult.net_profit;
    const revenueVal = liveResult.gross_revenue;
    const costVal = liveResult.total_cost;
    const breakEven = liveResult.break_even_price ?? 3800;

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Giant Mode & Language Switcher at Top */}
        <ModeToggleHero />

        <PageHeader
          icon={DollarSign}
          title={language === 'te' ? 'ఆదాయం మరియు ఖర్చులు' : language === 'hi' ? 'खर्च और मुनाफा' : 'Money & Profit'}
          purpose={language === 'te' ? 'మీ పంట ఖర్చులు, ఆదాయం మరియు నికర లాభం చూడండి' : language === 'hi' ? 'अपनी फसल का खर्च, कमाई और शुद्ध मुनाफा देखें' : 'Visual profit estimation and crop cost planning.'}
        />

        {/* Lead "Do This Today" Profit Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#FFF8E1] border-2 border-[#F2B01E] flex items-center justify-center shrink-0 shadow-sm">
              <CoinStackGauge netProfit={profitVal} className="w-16 h-16" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {language === 'te' ? 'నికర లాభం' : language === 'hi' ? 'शुद्ध मुनाफा' : 'Net Season Profit'}
                </span>
                <StatusBadge
                  status={isProfit ? 'success' : 'danger'}
                  label={isProfit ? 'Surplus Projected' : 'Deficit Risk'}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[24px] sm:text-[30px] font-black text-[#1F2A24] leading-snug">
                ₹{Math.round(profitVal).toLocaleString('en-IN')}
                <span className="text-[16px] font-medium text-[#4A5750] ml-2">
                  ({selectedCrop} &bull; {sliderArea} acres &bull; Margin {liveResult.margin_pct.toFixed(1)}%)
                </span>
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {plainMeaning}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <ReadAloudButton
              text={`Estimated net profit is ₹${Math.round(profitVal).toLocaleString('en-IN')}. ${plainMeaning}`}
              label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
            />
          </div>
        </div>

        {/* 4 Large Pictorial Tiles with Real Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Tile 1: Net Profit */}
          <PictorialTile
            title={language === 'te' ? 'నికర లాభం' : language === 'hi' ? 'शुद्ध लाभ' : 'Net Profit'}
            phrase={`₹${Math.round(profitVal).toLocaleString('en-IN')}`}
            illustration={<CoinStackGauge netProfit={profitVal} className="w-20 h-20" />}
            status={isProfit ? 'success' : 'danger'}
            statusWord={isProfit ? 'Profit Surplus' : 'Deficit Risk'}
            spokenText={`Estimated net profit is rupees ${Math.round(profitVal)}.`}
          />

          {/* Tile 2: Gross Crop Revenue */}
          <PictorialTile
            title={language === 'te' ? 'మొత్తం రాబడి' : language === 'hi' ? 'कुल आय' : 'Gross Income'}
            phrase={`₹${Math.round(revenueVal).toLocaleString('en-IN')}`}
            illustration={<MoneyProfitIllustration size={80} />}
            status="info"
            statusWord="Harvest Value"
            spokenText={`Gross harvest value is rupees ${Math.round(revenueVal)} based on ${sliderYield} quintals per acre.`}
          />

          {/* Tile 3: Total Cultivation Cost */}
          <PictorialTile
            title={language === 'te' ? 'మొత్తం ఖర్చులు' : language === 'hi' ? 'कुल खर्च' : 'Cultivation Cost'}
            phrase={`₹${Math.round(costVal).toLocaleString('en-IN')}`}
            illustration={<Coins className="w-16 h-16 text-[#7A553A]" />}
            status="warning"
            statusWord="Expenses"
            spokenText={`Total cultivation cost is rupees ${Math.round(costVal)} across seeds, fertilizer, labour, and irrigation.`}
          />

          {/* Tile 4: Break-Even Mandi Price */}
          <PictorialTile
            title={language === 'te' ? 'కనీస విక్రయ ధర' : language === 'hi' ? 'न्यूनतम भाव' : 'Break-even Rate'}
            phrase={`₹${breakEven.toFixed(0)} / quintal`}
            illustration={<Scale className="w-16 h-16 text-[#1565A8]" />}
            status="info"
            statusWord="Target Price"
            spokenText={`Break-even selling price is rupees ${breakEven.toFixed(0)} per quintal. Sell above this price to earn profit.`}
          />
        </div>

        {/* 3-Step Financial Routine */}
        <StepFlow
          heading={language === 'te' ? 'ఆర్థిక భద్రతలో 3 దశలు' : language === 'hi' ? 'मुनाफा बढ़ाने के 3 सरल कदम' : '3 Farm Profit Maximizing Steps'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'ఖర్చుల రసీదులు ఉంచండి' : language === 'hi' ? 'खर्च की रसीद रखें' : 'Track Input Costs',
              desc: language === 'te' ? 'విత్తనాలు మరియు ఎరువుల ఖర్చులను రాయండి' : language === 'hi' ? 'బీజ్ మరియు ఖాద్ కా బిల్ సంభాల్ కర్ రఖేం' : 'Record seed, fertilizer, and tractor hire bills',
              icon: Receipt,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'మార్కెట్ ధరలు చూడండి' : language === 'hi' ? 'మండీ భావ్ దేఖేం' : 'Watch Mandi Rates',
              desc: language === 'te' ? 'కనీస విక్రయ ధర కంటే ఎక్కువకు అమ్మండి' : language === 'hi' ? 'న్యూనతం దర్ సే అధిక్ భావ్ పర్ బేచేం' : 'Compare nearby APMC market modal prices',
              icon: Store,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'లాభాన్ని లెక్కించండి' : language === 'hi' ? 'మునాఫే కీ గణనా' : 'Secure Season Profit',
              desc: language === 'te' ? 'ఆదాయం ఖర్చుల కంటే ఎక్కువగా ఉండాలి' : language === 'hi' ? 'ఖర్చ్ ఘటాకర్ అప్నా శుద్ధ మునాఫా సురక్షిత కరేం' : 'Ensure harvest income exceeds total seasonal outlay',
              icon: TrendingUp,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Mode & Language Switcher in Words Mode */}
      <ModeToggleHero />

      {/* PAGE HEADER */}
      <PageHeader
        icon={DollarSign}
        title={t('economics.title')}
        purpose={t('economics.subtitle')}
        whatIsThis={{
          summary: 'Computes total cost of cultivation, expected gross revenue, and net profit with exact land tenure accounting (owned vs leased acreage) using Python Decimal precision.',
          whatToEnter: 'Selected crop, farm acreage, owned/leased land division, annual lease rent, expected harvest yield, and mandi price.',
          whatYouGet: 'Net profit, profit margin percentage, break-even price per quintal, break-even yield, and interactive What-If sensitivity modeling.',
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {farms.length > 0 && (
              <select
                value={activeFarmId || ''}
                onChange={(e) => setActiveFarmId(Number(e.target.value))}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.area} ac)
                  </option>
                ))}
              </select>
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
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
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
              className="min-h-[44px] px-3 py-2 bg-[#DA9A4C] hover:bg-[#C28538] text-[#183D2E] font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-[#183D2E]" />
              <span>{mandiPriceLoading ? '...' : t('market.use_mandi_price')}</span>
            </button>
          </div>
        }
      />

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

      {/* LEAD SUMMARY SECTION (1 to 3 Large Cards + ONE Primary Action) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Live Net Profit & Margin */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Live Net Profit
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                liveResult.net_profit >= 0 ? 'bg-[#183D2E] text-white' : 'bg-red-700 text-white'
              }`}>
                {liveResult.net_profit >= 0 ? 'Profitable' : 'Deficit'}
              </span>
            </div>

            <div className={`text-3xl sm:text-4xl font-display font-black tracking-tight ${
              liveResult.net_profit >= 0 ? 'text-[#183D2E]' : 'text-red-700'
            }`}>
              ₹{liveResult.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-[#4E5F57] pt-1">
              <span>Margin: <strong>{liveResult.margin_pct.toFixed(1)}%</strong></span>
              <span>&bull;</span>
              <span>Per Acre: <strong>₹{Math.round(liveResult.net_profit / (sliderArea || 1)).toLocaleString('en-IN')}</strong></span>
            </div>

            <p className="text-xs text-[#7A553A] font-medium pt-1">
              Change vs Baseline: <strong className={changeVsBaseline >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                {changeVsBaseline >= 0 ? '+' : ''}₹{Math.round(changeVsBaseline).toLocaleString('en-IN')}
              </strong>
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Live Net Profit is ₹${Math.round(liveResult.net_profit).toLocaleString('en-IN')}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('whatif')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>Simulate What-If</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Revenue vs Expenditure Breakdown */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                Financial Baseline
              </span>
              <span className="text-xs text-[#7A553A] font-semibold">
                {sliderArea} acres &bull; {selectedCrop}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] font-bold text-[#7A553A] uppercase block">Gross Revenue</span>
                <span className="text-lg font-black text-[#183D2E]">
                  ₹{liveResult.gross_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-[#4E5F57] block">@ ₹{sliderPrice}/q</span>
              </div>
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] font-bold text-[#7A553A] uppercase block">Total Cost</span>
                <span className="text-lg font-black text-[#7A553A]">
                  ₹{liveResult.total_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-[#4E5F57] block">₹{Math.round(liveResult.total_cost / (sliderArea || 1)).toLocaleString()}/ac</span>
              </div>
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote="Calculated using exact Python Decimal arithmetic based on user input parameters."
            />
          </div>
        </div>

        {/* Card 3: Break-Even Targets & Land Tenure Structure */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider">
                Break-Even Thresholds
              </span>
              <span className="text-xs font-bold text-[#DA9A4C] capitalize">
                {ownershipType} Land
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="font-medium text-[#4E5F57]">Break-Even Price:</span>
                <strong className="text-sm font-black text-[#183D2E]">
                  {liveResult.break_even_price !== null ? `₹${liveResult.break_even_price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}/q` : 'N/A'}
                </strong>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="font-medium text-[#4E5F57]">Break-Even Yield:</span>
                <strong className="text-sm font-black text-[#183D2E]">
                  {liveResult.break_even_yield !== null ? `${liveResult.break_even_yield.toFixed(1)} q/ac` : 'N/A'}
                </strong>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-[#7A553A]">
              Tenure Structure: <strong>{ownershipType === 'mixed' ? `${ownedArea} ac own + ${leasedArea} ac lease` : `${area} acres`}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 text-[11px] text-[#7A553A]">
            Prices below break-even result in seasonal debt. Verify prices at local APMC mandi.
          </div>
        </div>
      </div>

      {/* DETAIL TABS (Decluttering without deleting any feature or control) */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
          <button
            type="button"
            onClick={() => setActiveTab('whatif')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'whatif'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#DA9A4C]" />
            <span>What-If Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('costs')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'costs'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Cost of Cultivation Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenure')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'tenure'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#183D2E]" />
            <span>Tenure Breakdown (Owned vs Leased)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scenarios')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'scenarios'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Scale className="w-4 h-4 text-[#DA9A4C]" />
            <span>Best/Base/Worst Scenarios</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'matrix'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Crop Comparison Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'methodology'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#7A553A]" />
            <span>Methodology & Disclaimers</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: WHAT-IF SIMULATOR */}
          {activeTab === 'whatif' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#183D2E]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#183D2E]">
                    {t('economics.what_if_title')}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetWhatIf}
                    className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] hover:bg-[#EFE7DE] text-[#183D2E] text-xs font-bold rounded-xl border border-[#7A553A]/30 transition-all shadow-sm"
                    title="Reset all simulator values to baseline defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('economics.what_if_reset_btn')}</span>
                  </button>
                  <span className="text-[11px] text-[#7A553A] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#7A553A]/20">
                    {whatIfResult ? 'Instant pure-function model • backend synced' : 'Instant pure-function model'}
                  </span>
                </div>
              </div>

              {/* Sweep Variable Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#183D2E]">Sensitivity Variable:</span>
                {(['price', 'yield', 'area', 'lease_cost'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWhatIfVar(v)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      whatIfVar === v
                        ? 'bg-[#183D2E] text-white border-[#183D2E] shadow-sm'
                        : 'bg-[#FAF8F5] text-[#183D2E] border-[#7A553A]/30 hover:bg-[#EFE7DE]'
                    }`}
                  >
                    {v.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Synchronized Sliders + Number Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20">
                {/* Price */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#183D2E]">
                    <label htmlFor="whatif-price-number">Expected Price (₹/q):</label>
                  </div>
                  <input
                    id="whatif-price-number"
                    aria-label="Expected Price (₹/q)"
                    type="number"
                    min="1000"
                    max="30000"
                    step="50"
                    value={sliderPrice}
                    onChange={(e) => setSliderPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E] mb-1"
                  />
                  <input
                    id="whatif-price"
                    aria-label="Expected Price Slider"
                    type="range"
                    min="1000"
                    max="25000"
                    step="50"
                    value={sliderPrice}
                    onChange={(e) => setSliderPrice(Number(e.target.value))}
                    className="w-full accent-[#183D2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A553A]">
                    <span>₹1,000</span>
                    <span>₹25,000</span>
                  </div>
                </div>

                {/* Yield */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#183D2E]">
                    <label htmlFor="whatif-yield-number">Harvest Yield (q/ac):</label>
                  </div>
                  <input
                    id="whatif-yield-number"
                    aria-label="Harvest Yield (q/ac)"
                    type="number"
                    min="1"
                    max="40"
                    step="0.5"
                    value={sliderYield}
                    onChange={(e) => setSliderYield(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E] mb-1"
                  />
                  <input
                    id="whatif-yield"
                    aria-label="Harvest Yield Slider"
                    type="range"
                    min="1"
                    max="40"
                    step="0.5"
                    value={sliderYield}
                    onChange={(e) => setSliderYield(Number(e.target.value))}
                    className="w-full accent-[#183D2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A553A]">
                    <span>1.0 q</span>
                    <span>40.0 q</span>
                  </div>
                </div>

                {/* Area */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#183D2E]">
                    <label htmlFor="whatif-area-number">Total Area (acres):</label>
                  </div>
                  <input
                    id="whatif-area-number"
                    aria-label="Total Area (acres)"
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={sliderArea}
                    onChange={(e) => setSliderArea(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E] mb-1"
                  />
                  <input
                    id="whatif-area"
                    aria-label="Total Area Slider"
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={sliderArea}
                    onChange={(e) => setSliderArea(Number(e.target.value))}
                    className="w-full accent-[#183D2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A553A]">
                    <span>0.5 ac</span>
                    <span>50 ac</span>
                  </div>
                </div>

                {/* Lease Rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#183D2E]">
                    <label htmlFor="whatif-lease-number">Lease Rate (₹/ac):</label>
                  </div>
                  <input
                    id="whatif-lease-number"
                    aria-label="Lease Rate (₹/ac)"
                    type="number"
                    min="0"
                    max="40000"
                    step="500"
                    value={sliderLeaseRate}
                    onChange={(e) => setSliderLeaseRate(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-1 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E] mb-1"
                  />
                  <input
                    id="whatif-lease"
                    aria-label="Lease Rate Slider"
                    type="range"
                    min="0"
                    max="40000"
                    step="500"
                    value={sliderLeaseRate}
                    onChange={(e) => setSliderLeaseRate(Number(e.target.value))}
                    className="w-full accent-[#183D2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7A553A]">
                    <span>₹0</span>
                    <span>₹40,000</span>
                  </div>
                </div>

                {/* Irrigation Method */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#183D2E]">
                    <label htmlFor="whatif-irrigation">{t('economics.what_if_irrigation_method')}:</label>
                  </div>
                  <select
                    id="whatif-irrigation"
                    aria-label={t('economics.what_if_irrigation_method')}
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-xl px-2.5 py-2 text-xs font-bold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
                  >
                    <option value="drip">Drip (-10% cost)</option>
                    <option value="sprinkler">Sprinkler (Baseline)</option>
                    <option value="furrow">Furrow (+15% cost)</option>
                    <option value="flood">Flood (+30% cost)</option>
                  </select>
                  <span className="text-[10px] text-[#7A553A] block pt-1">
                    Adjusts water cost factor
                  </span>
                </div>
              </div>

              {/* Profit-vs-Variable Chart */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#183D2E]">
                    {t('economics.what_if_chart_heading')} ({whatIfVar.replace('_', ' ').toUpperCase()})
                  </span>
                  <span className="text-[11px] text-[#7A553A]">
                    Green line represents simulated net profit curve
                  </span>
                </div>
                <div className="h-56 w-full pt-1" style={{ minHeight: '220px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EFE7DE" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7A553A' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#7A553A' }}
                        tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Net Profit']}
                        contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#DA9A4C', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                      <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} />
                      <Line
                        type="monotone"
                        dataKey="net_profit"
                        stroke="#183D2E"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#183D2E' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sensitivity Point Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-[10px] pt-1">
                  {chartPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-lg border ${
                        pt.net_profit >= 0
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-red-50/80 border-red-200'
                      }`}
                    >
                      <span className="font-bold text-[#183D2E] block truncate">{pt.label}</span>
                      <span className={`block font-extrabold ${pt.net_profit >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                        ₹{Math.round(pt.net_profit / 1000)}k
                      </span>
                      <span className="text-[#7A553A] text-[9px]">{pt.margin_pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITEMIZED COST EDITOR */}
          {activeTab === 'costs' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[#7A553A]/15">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#183D2E]" />
                  <h3 className="text-base font-bold text-[#183D2E]">
                    {t('economics.cost_editor_title')} (Per-Acre Expenditure Line Items)
                  </h3>
                </div>
                {templates && templates[selectedCrop.toLowerCase()] && (
                  <button
                    type="button"
                    onClick={() => {
                      if (templates[selectedCrop.toLowerCase()]) {
                        setCosts(templates[selectedCrop.toLowerCase()].items);
                      }
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FAF8F5] text-[11px] text-[#183D2E] font-bold border border-[#7A553A]/30 hover:bg-[#EFE7DE]"
                  >
                    Reset to {selectedCrop} Benchmark
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(costs).map(([key, val]) => (
                  <div key={key} className="bg-[#FAF8F5] p-3 rounded-xl border border-[#7A553A]/20">
                    <label className="text-[11px] font-bold text-[#183D2E] capitalize block mb-1">
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
                      className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
                    />
                  </div>
                ))}
              </div>

              {/* Crop Loan & KCC Borrowing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#7A553A]/20">
                  <label className="text-xs font-bold text-[#183D2E] block mb-1">
                    Crop Loan / KCC Principal (₹ Total)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-lg px-3 py-2 text-xs font-semibold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
                  />
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#7A553A]/20">
                  <label className="text-xs font-bold text-[#183D2E] block mb-1">
                    Annual Loan Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="36"
                    step="0.5"
                    value={loanInterestPct}
                    onChange={(e) => setLoanInterestPct(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] bg-white border border-[#7A553A]/30 rounded-lg px-3 py-2 text-xs font-semibold text-[#183D2E] focus:ring-2 focus:ring-[#183D2E]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-[#7A553A]/15 gap-3">
                <span className="text-xs text-[#7A553A] font-semibold">
                  Operating Cost Subtotal: <strong className="text-[#183D2E]">₹{operatingPerAcre.toLocaleString()} / acre</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={loading}
                  className="min-h-[48px] px-6 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Re-calculating...' : t('economics.recalculate_btn')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TENURE BREAKDOWN */}
          {activeTab === 'tenure' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#7A553A]/15">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#183D2E]" />
                  <h3 className="text-base font-bold text-[#183D2E]">
                    {t('economics.tenure_comparison_title')} (Owned vs Leased Land)
                  </h3>
                </div>
                <div className="flex bg-[#FAF8F5] p-1 rounded-xl gap-1 border border-[#7A553A]/20">
                  <button
                    type="button"
                    onClick={() => setTenureTab('combined')}
                    className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tenureTab === 'combined' ? 'bg-[#183D2E] text-white shadow' : 'text-[#7A553A]'
                    }`}
                  >
                    {t('economics.combined')} ({area} ac)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenureTab('owned')}
                    className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tenureTab === 'owned' ? 'bg-[#183D2E] text-white shadow' : 'text-[#7A553A]'
                    }`}
                  >
                    {t('economics.owned_portion')} ({ownedArea} ac)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenureTab('leased')}
                    className={`min-h-[38px] px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tenureTab === 'leased' ? 'bg-[#183D2E] text-white shadow' : 'text-[#7A553A]'
                    }`}
                  >
                    {t('economics.leased_portion')} ({leasedArea} ac)
                  </button>
                </div>
              </div>

              {econResult ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#7A553A]/20 space-y-1 text-xs">
                    <span className="font-bold text-[#183D2E] block mb-1">
                      {tenureTab === 'combined' ? 'Combined Total Area' : (tenureTab === 'owned' ? 'Owned Area' : 'Leased Area')}
                    </span>
                    <p className="text-[#4E5F57]">
                      Acreage: <strong className="text-[#183D2E]">
                        {tenureTab === 'combined' ? area : (tenureTab === 'owned' ? ownedArea : leasedArea)} acres
                      </strong>
                    </p>
                    <p className="text-[#4E5F57]">
                      Lease Cost Incurred:{' '}
                      <strong className="text-[#183D2E]">
                        ₹{tenureTab === 'combined' ? econResult.combined_summary.lease_cost_total : (tenureTab === 'owned' ? '0.00' : econResult.leased_tenure?.lease_cost_total)}
                      </strong>
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#7A553A]/20 space-y-1 text-xs">
                    <span className="font-bold text-[#183D2E] block mb-1">Cost & Margin</span>
                    <p className="text-[#4E5F57]">
                      Total Expenditure: <strong className="text-[#183D2E]">
                        ₹{tenureTab === 'combined' ? econResult.combined_summary.total_cost : (tenureTab === 'owned' ? econResult.owned_tenure?.total_cost : econResult.leased_tenure?.total_cost)}
                      </strong>
                    </p>
                    <p className="text-[#4E5F57]">
                      Net Margin:{' '}
                      <strong className="text-[#183D2E]">
                        {(tenureTab === 'combined' ? econResult.combined_summary.margin_pct : (tenureTab === 'owned' ? econResult.owned_tenure?.margin_pct : econResult.leased_tenure?.margin_pct))?.toFixed(1)}%
                      </strong>
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#7A553A]/20 space-y-1 text-xs">
                    <span className="font-bold text-[#183D2E] block mb-1">Break-Even Benchmark</span>
                    <p className="text-[#4E5F57]">
                      Break-Even Price: <strong className="text-[#183D2E]">
                        ₹{tenureTab === 'combined' ? econResult.combined_summary.break_even_price_per_q : (tenureTab === 'owned' ? econResult.owned_tenure?.break_even_price_per_q : econResult.leased_tenure?.break_even_price_per_q)} / q
                      </strong>
                    </p>
                    <p className="text-[#4E5F57]">
                      Break-Even Yield: <strong className="text-[#183D2E]">
                        {tenureTab === 'combined' ? econResult.combined_summary.break_even_yield_q_per_acre : (tenureTab === 'owned' ? econResult.owned_tenure?.break_even_yield_q_per_acre : econResult.leased_tenure?.break_even_yield_q_per_acre)} q/ac
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">Run calculation to inspect tenure division.</p>
              )}
            </div>
          )}

          {/* TAB 4: SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#7A553A]/15">
                <Scale className="w-5 h-5 text-[#183D2E]" />
                <h3 className="text-base font-bold text-[#183D2E]">
                  {t('economics.scenarios_title')} (Yield & Price Volatility Sensitivity)
                </h3>
              </div>

              {econResult?.scenarios && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {econResult.scenarios.map((sc) => (
                    <div
                      key={sc.name}
                      className={`p-4 rounded-2xl border transition-all ${
                        sc.name.includes('Best')
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : sc.name.includes('Worst')
                          ? 'bg-red-50/70 border-red-300'
                          : 'bg-[#FAF8F5] border-[#7A553A]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-[#183D2E] text-sm">{sc.name}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          sc.is_profitable ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                        }`}>
                          {sc.is_profitable ? 'Profitable' : 'Deficit'}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A553A] mb-3">{sc.description}</p>
                      <div className="space-y-1.5 text-xs text-[#4E5F57] border-t border-[#7A553A]/15 pt-2">
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
                        <div className="flex justify-between font-bold border-t border-[#7A553A]/15 pt-1">
                          <span>Net Profit:</span>
                          <span className={sc.is_profitable ? 'text-emerald-700' : 'text-red-600'}>
                            ₹{sc.net_profit}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#7A553A]">
                          <span>Margin:</span>
                          <span>{sc.margin_pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CROP COMPARISON MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#7A553A]/15">
                <TrendingUp className="w-5 h-5 text-[#183D2E]" />
                <h3 className="text-base font-bold text-[#183D2E]">
                  {t('economics.crop_comparison_title')} (Side-by-Side Agro-Financial Matrix)
                </h3>
              </div>

              {compareResult && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] text-[#183D2E] border-b border-[#7A553A]/20">
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
                    <tbody className="divide-y divide-[#7A553A]/15">
                      {compareResult.crops.map((c) => (
                        <tr
                          key={c.crop_name}
                          className={`hover:bg-[#FAF8F5]/60 transition-colors ${
                            c.crop_name.toLowerCase() === selectedCrop.toLowerCase() ? 'bg-[#FEF6E9] font-bold' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-[#183D2E]">
                            {c.crop_name}
                            {language === 'te' && c.crop_name_te && <span className="block text-[10px] text-[#7A553A] font-normal">{c.crop_name_te}</span>}
                            {language === 'hi' && c.crop_name_hi && <span className="block text-[10px] text-[#7A553A] font-normal">{c.crop_name_hi}</span>}
                          </td>
                          <td className="p-3 text-[#4E5F57]">{c.typical_duration_days} d</td>
                          <td className="p-3 text-[#4E5F57]">{c.water_need_mm} mm</td>
                          <td className="p-3 text-[#4E5F57]">₹{c.estimated_cost_per_acre.toLocaleString()}</td>
                          <td className="p-3 text-[#4E5F57]">{c.estimated_yield_q_per_acre} q</td>
                          <td className="p-3 text-[#4E5F57]">₹{c.estimated_price_per_q.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`font-bold ${c.estimated_net_profit_per_acre >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              ₹{c.estimated_net_profit_per_acre.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 text-[#4E5F57]">{c.margin_pct.toFixed(1)}%</td>
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
              )}
            </div>
          )}

          {/* TAB 6: METHODOLOGY & EXPLAINCARD */}
          {activeTab === 'methodology' && (
            <div className="space-y-4">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EconomicsPage;