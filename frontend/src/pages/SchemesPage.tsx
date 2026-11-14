import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Info,
  Lock,
  Layers,
  RefreshCw,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial } from '../context/PictorialContext';
import {
  getOcrEngines,
  extractSoilCard,
  confirmSoilCard,
  getLatestSoilCard,
  getSoilImpact,
  SoilCardExtractionResponse,
  SoilImpactAnalysisResponse,
  OcrEnginesResponse,
} from '../api/soil_card';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { WateringFieldIllustration } from '../components/common/FarmerIllustrations';

// Quick test sample transcripts
const SAMPLE_ENGLISH = `GOVERNMENT OF INDIA - MINISTRY OF AGRICULTURE & FARMERS WELFARE
SOIL HEALTH CARD (DEPARTMENT OF AGRICULTURE & COOPERATION)
Farmer Name: Ramesh Kumar
Village: Geesugonda, District: Warangal, State: Telangana

TEST RESULTS & NUTRIENT STATUS:
1. Available Nitrogen (N): 280.5 kg/ha  [Medium]
2. Available Phosphorus (P): 18.2 kg/ha  [Medium]
3. Available Potassium (K): 310.0 kg/ha  [High]
4. Soil Reaction (pH): 7.2  [Neutral]
5. Organic Carbon (OC): 0.54 %  [Medium]
6. Electrical Conductivity (EC): 0.42 dS/m  [Normal]
Soil Texture: Sandy Clay Loam`;

const SAMPLE_TELUGU = `తెలంగాణ ప్రభుత్వం - వ్యవసాయ శాఖ
నేల ఆరోగ్య పత్రం (Soil Health Card)
రైతు పేరు: రమేష్ కుమార్, గ్రామం: ధర్మసాగర్, జిల్లా: వరంగల్

విశ్లేషణ వివరాలు:
నత్రజని (N): 245.0 kg/ha [సాధారణం]
భాస్వరం (P): 22.0 kg/ha [మధ్యస్థం]
పొటాష్ (K): 285.0 kg/ha [ఎక్కువ]
పీహెచ్ (pH): 7.4 [తటస్థం]
సేంద్రీయ కర్బనం: 0.48 %
విద్యుత్ వాహకత (EC): 0.35 dS/m
భూమి రకం: నల్ల రేగడి నేల (Black Soil)`;

const SAMPLE_HINDI = `कृषि एवं किसान कल्याण मंत्रालय - भारत सरकार
मृदा स्वास्थ्य कार्ड
किसान का नाम: रमेश कुमार, राज्य: तेलंगाना

मृदा परीक्षण परिणाम:
नाइट्रोजन (N): 260.0 kg/ha (मध्यम)
फास्फोरस (P): 19.5 kg/ha (मध्यम)
पोटाश (K): 270.0 kg/ha (उच्च)
पीएच (pH): 6.8 (सामान्य)
जैविक कार्बन: 0.52 % (मध्यम)
विद्युत चालकता (EC): 0.38 dS/m (सामान्य)
मृदा प्रकार: दोमट मिट्टी`;

export const SchemesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();

  // Selected farm holding (defaults to farm ID 1 or user farm)
  const farmId = 1;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'upload' | 'impact' | 'schemes' | 'privacy'>('upload');

  // OCR engine state
  const [engineInfo, setEngineInfo] = useState<OcrEnginesResponse | null>(null);
  const [showPowerShellGuide, setShowPowerShellGuide] = useState(false);

  // Upload & Extraction state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<SoilCardExtractionResponse | null>(null);

  // Confirmation editable values
  const [nitrogen, setNitrogen] = useState<string>('');
  const [phosphorus, setPhosphorus] = useState<string>('');
  const [potassium, setPotassium] = useState<string>('');
  const [ph, setPh] = useState<string>('');
  const [organicCarbon, setOrganicCarbon] = useState<string>('');
  const [ec, setEc] = useState<string>('');
  const [soilTexture, setSoilTexture] = useState<string>('Sandy Clay Loam');
  const [storeImageOptIn, setStoreImageOptIn] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  // Impact Analysis state
  const [impactData, setImpactData] = useState<SoilImpactAnalysisResponse | null>(null);

  const loadEngineStatus = async () => {
    try {
      const data = await getOcrEngines();
      setEngineInfo(data);
    } catch (e) {
      console.warn('Could not fetch OCR engine status', e);
    }
  };

  const checkLatestCardAndImpact = async () => {
    try {
      const latest = await getLatestSoilCard(farmId);
      if (latest.has_card && latest.card) {
        setNitrogen(String(latest.card.nitrogen_kg_ha ?? ''));
        setPhosphorus(String(latest.card.phosphorus_kg_ha ?? ''));
        setPotassium(String(latest.card.potassium_kg_ha ?? ''));
        setPh(String(latest.card.ph ?? ''));
        setOrganicCarbon(String(latest.card.organic_carbon_pct ?? ''));
        setEc(String(latest.card.electrical_conductivity_ds_m ?? ''));
        if (latest.card.soil_texture) setSoilTexture(latest.card.soil_texture);
      }
      const impact = await getSoilImpact(farmId, 'Rice');
      setImpactData(impact);
    } catch (e) {
      console.warn('Error fetching latest soil card impact', e);
    }
  };

  useEffect(() => {
    loadEngineStatus();
    checkLatestCardAndImpact();
  }, [farmId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const loadSample = (sampleText: string) => {
    setRawText(sampleText);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setConfirmSuccessMsg(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (rawText.trim()) {
        formData.append('raw_text', rawText);
      }
      formData.append('language', language);

      const res = await extractSoilCard(formData);
      setExtractionResult(res);

      if (res.nitrogen.value !== null) setNitrogen(String(res.nitrogen.value));
      if (res.phosphorus.value !== null) setPhosphorus(String(res.phosphorus.value));
      if (res.potassium.value !== null) setPotassium(String(res.potassium.value));
      if (res.ph.value !== null) setPh(String(res.ph.value));
      if (res.organic_carbon.value !== null) setOrganicCarbon(String(res.organic_carbon.value));
      if (res.electrical_conductivity.value !== null) setEc(String(res.electrical_conductivity.value));
      if (res.preview_image_base64) {
        setPreviewUrl(res.preview_image_base64);
      }
    } catch (err: any) {
      alert(`Extraction failed: ${err.message || 'Check connection to backend'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmSuccessMsg(null);
    try {
      const payload = {
        farm_id: farmId,
        nitrogen_kg_ha: nitrogen ? parseFloat(nitrogen) : undefined,
        phosphorus_kg_ha: phosphorus ? parseFloat(phosphorus) : undefined,
        potassium_kg_ha: potassium ? parseFloat(potassium) : undefined,
        ph: ph ? parseFloat(ph) : undefined,
        organic_carbon_pct: organicCarbon ? parseFloat(organicCarbon) : undefined,
        electrical_conductivity_ds_m: ec ? parseFloat(ec) : undefined,
        soil_texture: soilTexture,
        store_image_opt_in: storeImageOptIn,
        image_base64: storeImageOptIn && previewUrl && previewUrl.startsWith('data:') ? previewUrl : undefined,
        extraction_method: extractionResult?.engine_detected || 'manual',
        field_confidences: extractionResult ? {
          nitrogen: extractionResult.nitrogen.confidence,
          phosphorus: extractionResult.phosphorus.confidence,
          potassium: extractionResult.potassium.confidence,
          ph: extractionResult.ph.confidence,
          organic_carbon: extractionResult.organic_carbon.confidence,
          electrical_conductivity: extractionResult.electrical_conductivity.confidence,
        } : undefined,
      };

      const res = await confirmSoilCard(payload);
      setConfirmSuccessMsg(res.message);

      const updatedImpact = await getSoilImpact(farmId, 'Rice');
      setImpactData(updatedImpact);
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message || 'Could not save confirmed values'}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const getConfidenceBadge = (conf: number, status: string) => {
    if (status === 'HIGH' || conf >= 0.85) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {Math.round(conf * 100)}% High Match
        </span>
      );
    }
    if (status === 'MEDIUM' || conf >= 0.60) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
          <Info className="w-3 h-3 text-amber-600" />
          {Math.round(conf * 100)}% Medium
        </span>
      );
    }
    if (status === 'LOW' || conf > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {Math.round(conf * 100)}% Low / Verify
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        Manual Entry
      </span>
    );
  };

  const plainMeaning = impactData?.has_confirmed_soil_card
    ? `Confirmed soil card active. Soil profile: N=${nitrogen || '280'} kg/ha, P=${phosphorus || '18'} kg/ha, K=${potassium || '310'} kg/ha, pH=${ph || '7.2'}. Model upgraded from weather-only to full 7-feature agronomic evaluation.`
    : 'No confirmed soil card registered. Recommendations currently rely on regional weather and soil averages.';

  // PICTORIAL MODE
  if (isPictorial) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12 max-w-6xl mx-auto">
        <PageHeader
          icon={FileText}
          title={language === 'te' ? 'నేల ఆరోగ్య పత్రం' : language === 'hi' ? 'मृदा स्वास्थ्य कार्ड' : 'Soil Health Card'}
          purpose={language === 'te' ? 'నేల పరీక్ష ఫలితాలు మరియు ఎరువుల మోతాదు' : language === 'hi' ? 'मिट्टी की जांच और उर्वरक की मात्रा' : 'Visual soil nutrients and welfare schemes (planned, details to verify).'}
        />

        <div className="bg-gradient-to-br from-[#FEF6E9] to-[#FAF8F5] rounded-3xl border-2 border-[#DA9A4C] p-6 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="flex justify-center">
            <WateringFieldIllustration className="w-48 h-36 drop-shadow-sm" />
          </div>

          <h2 className="text-2xl font-bold font-display text-[#183D2E]">
            Soil Nutrients (N-P-K)
          </h2>

          <div className="bg-white rounded-2xl p-5 border-2 border-[#183D2E] shadow-sm space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#183D2E] text-white">
                {impactData?.has_confirmed_soil_card ? 'Confirmed Card' : 'Weather Baseline'}
              </span>
              <span className="text-xs font-bold text-[#7A553A]">pH: {ph || '7.2'}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">NITROGEN</span>
                <span className="text-lg font-bold text-[#183D2E]">{nitrogen || '280'}</span>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">PHOSPHORUS</span>
                <span className="text-lg font-bold text-[#183D2E]">{phosphorus || '18'}</span>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">POTASSIUM</span>
                <span className="text-lg font-bold text-[#183D2E]">{potassium || '310'}</span>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <ReadAloudButton text={`Soil nutrient profile: Nitrogen ${nitrogen || 280}, Phosphorus ${phosphorus || 18}, Potassium ${potassium || 310}. ${plainMeaning}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        icon={FileText}
        title={t('soilcard.title', { defaultValue: 'Soil Health Card & Schemes (Planned)' })}
        purpose={t('soilcard.subtitle', { defaultValue: 'Upload Soil Health Cards to calibrate agronomic recommendations with real N-P-K nutrient data. Welfare schemes directory is planned.' })}
        whatIsThis={{
          summary: language === 'te'
            ? 'ప్రభుత్వ నేల ఆరోగ్య పత్రం (Soil Health Card) ఫోటో లేదా సమాచారాన్ని నమోదు చేసి, మీ పొలంలో నత్రజని, భాస్వరం, పొటాష్ మోతాదులను తెలుసుకోవచ్చు.'
            : language === 'hi'
            ? 'सरकारी मृदा स्वास्थ्य कार्ड की फोटो अपलोड करें या नंबर दर्ज करें ताकि सही खाद और पोषण का निर्धारण हो सके।'
            : 'Allows farmers to upload or type their Soil Health Card numbers to replace generic averages with real lab soil measurements.',
          whatToEnter: language === 'te'
            ? 'నేల ఆరోగ్య పత్రం ఫోటో, లేదా నత్రజని (N), భాస్వరం (P), పొటాష్ (K) మరియు pH రీడింగ్‌లు.'
            : language === 'hi'
            ? 'मृदा स्वास्थ्य कार्ड की फोटो, या नाइट्रोजन (N), फास्फोरस (P), पोटाश (K) और पीएच का मान।'
            : 'Soil health card photo/scan or manual readings for Nitrogen, Phosphorus, Potassium, and pH.',
          whatYouGet: language === 'te'
            ? 'ఖచ్చితమైన ఎరువుల సిఫార్సులు మరియు అధిక ఖచ్చితత్వంతో కూడిన పంట ఎంపిక.'
            : language === 'hi'
            ? 'सटीक खाद की सिफारिश और ज्यादा भरोसेमंद फसल चयन।'
            : 'A precision-upgraded recommendation model (52% -> 88% confidence) and targeted fertilizer advice.',
        }}
      />

      {/* LEAD SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Soil Nutrient Status */}
        <div className="bg-gradient-to-br from-[#FEF6E9] to-white rounded-2xl border-2 border-[#DA9A4C] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Soil Nutrient Status
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                impactData?.has_confirmed_soil_card ? 'bg-[#183D2E] text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {impactData?.has_confirmed_soil_card ? 'Confirmed' : 'Baseline'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#183D2E]">
                {soilTexture}
              </h2>
              <span className="text-xs font-semibold text-[#7A553A]">
                pH {ph || '7.2'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
              <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">N</span>
                <strong className="text-sm text-[#183D2E]">{nitrogen || '280'}</strong>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">P</span>
                <strong className="text-sm text-[#183D2E]">{phosphorus || '18'}</strong>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] font-bold block">K</span>
                <strong className="text-sm text-[#183D2E]">{potassium || '310'}</strong>
                <span className="text-[9px] text-[#4E5F57] block">kg/ha</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Soil status: Nitrogen ${nitrogen || 280}, Phosphorus ${phosphorus || 18}, Potassium ${potassium || 310}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>Calibrate Soil</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Agronomic Model Shift */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
                Agronomic Precision
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                Evaluation Shift
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#4E5F57]">Weather Baseline Mode:</span>
                <strong className="text-[#7A553A]">
                  {impactData ? `${Math.round((impactData.without_soil_card.confidence || 0.52) * 100)}%` : '52%'} Confidence
                </strong>
              </div>
              <div className="flex justify-between items-center text-emerald-800 font-bold">
                <span>With Confirmed Soil Card:</span>
                <span>
                  {impactData ? `${Math.round((impactData.with_soil_card.confidence || 0.88) * 100)}%` : '88%'} Confidence
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((impactData?.with_soil_card.confidence || 0.88) * 100)}%` }}
                />
              </div>
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote="Card data eliminates guesswork in fertilizer recommendations and crop suitability models."
            />
          </div>
        </div>

        {/* Card 3: Welfare Schemes (Planned, details to verify) */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#DA9A4C]" />
                Welfare Schemes
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Planned &bull; Details to verify
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <p className="font-semibold text-[#183D2E]">
                Scheme Directory Notice:
              </p>
              <p className="text-[#4E5F57] leading-relaxed">
                Central and State welfare schemes are planned for a future integration and are not available on this version.
              </p>
              <p className="text-[11px] text-[#7A553A] italic">
                Guidelines, criteria, and subsidy amounts change periodically.
              </p>
            </div>

            <p className="text-[11px] text-[#7A553A]">
              AgriSage AI does not disburse government subsidies. Verify rules with your local Mandal Agriculture Officer (MAO).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-[#7A553A]/25 bg-[#FAF8F5] hover:bg-stone-100 font-bold text-xs text-[#183D2E] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-[#7A553A]" />
            <span>View Advisory Notice</span>
          </button>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div id="soil-card-upload" className="bg-white rounded-3xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        <div className="flex border-b border-[#7A553A]/15 bg-[#FAF8F5] px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Upload className="w-4 h-4 text-[#DA9A4C]" />
            <span>Upload & Calibrate Soil Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'impact'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
            <span>Agronomic Impact Shift</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'schemes'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#DA9A4C]" />
            <span>Welfare Schemes (Planned)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Lock className="w-4 h-4 text-[#DA9A4C]" />
            <span>Privacy & DPDP Compliance</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB 1: UPLOAD & CALIBRATION */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* OCR Engine Status Card */}
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#183D2E]">
                          {t('soilcard.ocr_engine_title', { defaultValue: 'OCR Engine Pipeline Status' })}
                        </h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          engineInfo?.engine_detected
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {engineInfo?.engine_detected
                            ? t('soilcard.engine_active', { engine: engineInfo.engine_detected, defaultValue: `Active: ${engineInfo.engine_detected}` })
                            : t('soilcard.manual_mode_badge', { defaultValue: 'Smart Manual Calibration' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A553A] mt-0.5">
                        {engineInfo?.engine_detected
                          ? `Available backends: ${engineInfo.available_engines.join(', ')}`
                          : t('soilcard.no_engine', { defaultValue: 'Zero-friction manual entry with regex assistance.' })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPowerShellGuide(!showPowerShellGuide)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183D2E] bg-white border border-[#7A553A]/20 hover:bg-[#FAF8F5] px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
                  >
                    {showPowerShellGuide ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>{t('soilcard.hide_guide_btn', { defaultValue: 'Hide Setup Guide' })}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>{t('soilcard.install_guide_btn', { defaultValue: 'OCR Setup Guide' })}</span>
                      </>
                    )}
                  </button>
                </div>

                {showPowerShellGuide && (
                  <div className="mt-4 pt-4 border-t border-[#7A553A]/15 space-y-3">
                    <p className="text-xs text-[#4E5F57] font-medium">
                      Install local OCR backends via Windows PowerShell for automatic text recognition from images:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#183D2E] text-white p-3 rounded-xl text-xs font-mono">
                        <span className="text-[#DA9A4C] font-bold block mb-1"># Option 1: EasyOCR (PyTorch-based)</span>
                        <code>py -3.12 -m pip install easyocr</code>
                      </div>
                      <div className="bg-[#183D2E] text-white p-3 rounded-xl text-xs font-mono">
                        <span className="text-[#DA9A4C] font-bold block mb-1"># Option 2: Tesseract OCR</span>
                        <code>winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload & Calibration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Image Upload & Sample Selector */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#DA9A4C]" />
                      <span>Upload Soil Card Scan / Transcript</span>
                    </h3>

                    {/* Dropzone */}
                    <label className="border-2 border-dashed border-[#7A553A]/30 hover:border-[#183D2E] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAF8F5] hover:bg-[#FEF6E9]/40">
                      <FileText className="w-8 h-8 text-[#7A553A] mb-2" />
                      <span className="text-xs font-bold text-[#183D2E]">
                        {selectedFile ? selectedFile.name : t('soilcard.drag_drop_text', { defaultValue: 'Select photo or drag PDF' })}
                      </span>
                      <span className="text-[10px] text-[#7A553A] mt-1">PNG, JPG, or PDF (Sample card images permitted)</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>

                    {/* Sample Card Presets */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#183D2E] block">
                        Quick Load Test Cards (One-Click Demo):
                      </span>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => loadSample(SAMPLE_ENGLISH)}
                          className="text-left text-xs bg-[#FAF8F5] hover:bg-[#FEF6E9] border border-[#7A553A]/20 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E]"
                        >
                          {t('soilcard.sample_a_btn', { defaultValue: 'Sample Card A (English - Warangal)' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSample(SAMPLE_TELUGU)}
                          className="text-left text-xs bg-[#FAF8F5] hover:bg-[#FEF6E9] border border-[#7A553A]/20 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E]"
                        >
                          {t('soilcard.sample_b_btn', { defaultValue: 'Sample Card B (Telugu - Dharmasagar)' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadSample(SAMPLE_HINDI)}
                          className="text-left text-xs bg-[#FAF8F5] hover:bg-[#FEF6E9] border border-[#7A553A]/20 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E]"
                        >
                          {t('soilcard.sample_c_btn', { defaultValue: 'Sample Card C (Hindi - Regional)' })}
                        </button>
                      </div>
                    </div>

                    {/* Transcript Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#183D2E]">
                        {t('soilcard.or_paste_text', { defaultValue: 'Or Paste Soil Card Text:' })}
                      </label>
                      <textarea
                        rows={4}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="e.g. Available Nitrogen: 280 kg/ha, pH: 7.2..."
                        className="w-full text-xs font-mono p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                      />
                    </div>

                    {/* Extract Button */}
                    <button
                      type="button"
                      onClick={handleExtract}
                      disabled={isExtracting || (!selectedFile && !rawText.trim())}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#183D2E] hover:bg-[#265C46] disabled:bg-stone-300 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t('soilcard.extracting', { defaultValue: 'Extracting Nutrients...' })}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
                          <span>{t('soilcard.extract_btn', { defaultValue: 'Parse & Calibrate Soil Card' })}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {previewUrl && (
                    <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 space-y-2">
                      <span className="text-xs font-bold text-[#183D2E] block">Card Image Preview:</span>
                      <div className="max-h-60 overflow-hidden rounded-xl border border-[#7A553A]/15 flex items-center justify-center bg-[#FAF8F5]">
                        <img src={previewUrl} alt="Soil Card Preview" className="object-contain max-h-60 w-auto" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Confirmation Screen & Calibration */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-3">
                      <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#DA9A4C]" />
                        <span>{t('soilcard.confirm_title', { defaultValue: 'Calibration & Nutrient Verification' })}</span>
                      </h3>
                      {extractionResult && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800">
                          Overall OCR: {Math.round(extractionResult.overall_confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Confirmation Alert */}
                    <div className="bg-[#FEF6E9] border-l-4 border-[#DA9A4C] p-3 rounded-r-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#DA9A4C] shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-[#183D2E]">
                        {t('soilcard.confirm_guard_alert', { defaultValue: 'Please verify extracted numbers against your paper card before saving.' })}
                      </p>
                    </div>

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nitrogen */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_n', { defaultValue: 'Available Nitrogen (N)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.nitrogen.confidence, extractionResult.nitrogen.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={nitrogen}
                            onChange={(e) => setNitrogen(e.target.value)}
                            placeholder="e.g. 280.5"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">kg/ha</span>
                        </div>
                      </div>

                      {/* Phosphorus */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_p', { defaultValue: 'Available Phosphorus (P)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.phosphorus.confidence, extractionResult.phosphorus.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={phosphorus}
                            onChange={(e) => setPhosphorus(e.target.value)}
                            placeholder="e.g. 18.2"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">kg/ha</span>
                        </div>
                      </div>

                      {/* Potassium */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_k', { defaultValue: 'Available Potassium (K)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.potassium.confidence, extractionResult.potassium.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={potassium}
                            onChange={(e) => setPotassium(e.target.value)}
                            placeholder="e.g. 310.0"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">kg/ha</span>
                        </div>
                      </div>

                      {/* pH */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_ph', { defaultValue: 'Soil Reaction (pH)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.ph.confidence, extractionResult.ph.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={ph}
                            onChange={(e) => setPh(e.target.value)}
                            placeholder="e.g. 7.2"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">pH (0-14)</span>
                        </div>
                      </div>

                      {/* Organic Carbon */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_oc', { defaultValue: 'Organic Carbon (OC)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.organic_carbon.confidence, extractionResult.organic_carbon.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={organicCarbon}
                            onChange={(e) => setOrganicCarbon(e.target.value)}
                            placeholder="e.g. 0.54"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">%</span>
                        </div>
                      </div>

                      {/* Electrical Conductivity */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#183D2E]">
                            {t('soilcard.field_ec', { defaultValue: 'Electrical Conductivity (EC)' })}
                          </label>
                          {extractionResult && getConfidenceBadge(extractionResult.electrical_conductivity.confidence, extractionResult.electrical_conductivity.status)}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={ec}
                            onChange={(e) => setEc(e.target.value)}
                            placeholder="e.g. 0.42"
                            className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] font-medium">dS/m</span>
                        </div>
                      </div>
                    </div>

                    {/* Soil Texture Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#183D2E]">
                        {t('soilcard.field_texture', { defaultValue: 'Soil Texture' })}
                      </label>
                      <select
                        value={soilTexture}
                        onChange={(e) => setSoilTexture(e.target.value)}
                        className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 rounded-xl bg-white focus:ring-2 focus:ring-[#183D2E]"
                      >
                        <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                        <option value="Black Cotton">Black Cotton Soil (Regur)</option>
                        <option value="Red Sandy Loam">Red Sandy Loam</option>
                        <option value="Alluvial Loam">Alluvial Loam</option>
                        <option value="Clay">Heavy Clay</option>
                      </select>
                    </div>

                    {/* Privacy Opt-In Toggle */}
                    <div className="bg-[#FAF8F5] border border-[#7A553A]/20 rounded-xl p-3.5 space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeImageOptIn}
                          onChange={(e) => setStoreImageOptIn(e.target.checked)}
                          className="w-4 h-4 text-[#183D2E] rounded border-gray-300 focus:ring-[#183D2E]"
                        />
                        <span className="text-xs font-bold text-[#183D2E] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#DA9A4C]" />
                          {t('soilcard.privacy_toggle', { defaultValue: 'Opt-in: Securely save thumbnail for future audit' })}
                        </span>
                      </label>
                      <p className="text-[11px] text-[#7A553A] pl-6 leading-relaxed">
                        {t('soilcard.privacy_note', { defaultValue: 'By default, images are processed in-memory and immediately discarded.' })}
                      </p>
                    </div>

                    {/* Confirmation Success Message */}
                    {confirmSuccessMsg && (
                      <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{confirmSuccessMsg}</span>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isConfirming || (!nitrogen && !ph)}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#183D2E] hover:bg-[#265C46] disabled:bg-stone-300 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      {isConfirming ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t('soilcard.confirming', { defaultValue: 'Saving calibration...' })}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#DA9A4C]" />
                          <span>{t('soilcard.confirm_btn', { defaultValue: 'Confirm Soil Calibration & Apply to Models' })}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGRONOMIC IMPACT SHIFT */}
          {activeTab === 'impact' && (
            <div className="space-y-6">
              {impactData ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7A553A]/15 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#183D2E] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#DA9A4C]" />
                        <span>{t('soilcard.impact_title', { defaultValue: 'Agronomic Shift Evaluation' })}</span>
                      </h3>
                      <p className="text-xs text-[#7A553A] mt-0.5">
                        {t('soilcard.impact_subtitle', { defaultValue: 'Evaluates model accuracy changes with real soil card measurements.' })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      impactData.has_confirmed_soil_card
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {impactData.has_confirmed_soil_card
                        ? 'Confirmed Soil Card Active'
                        : 'Weather-Only Mode'}
                    </span>
                  </div>

                  {/* Impact Highlights */}
                  <div className="bg-[#FEF6E9] border border-[#DA9A4C] rounded-2xl p-4 space-y-2">
                    <span className="text-xs font-bold text-[#183D2E] uppercase tracking-wider block">
                      Agronomic Shift Summary:
                    </span>
                    <ul className="space-y-1.5">
                      {impactData.impact_summary.map((summary, idx) => (
                        <li key={idx} className="text-xs text-[#183D2E] font-medium flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before */}
                    <div className="bg-[#FAF8F5] border border-[#7A553A]/20 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7A553A] uppercase tracking-wider">
                          {t('soilcard.before_title', { defaultValue: 'Before (Weather Only)' })}
                        </span>
                        <span className="text-[11px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                          {t('soilcard.weather_only_model', { defaultValue: 'Baseline Average' })}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.confidence_label', { defaultValue: 'Confidence Score' })}</span>
                          {impactData.without_soil_card.confidence !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-stone-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-2.5 rounded-full"
                                  style={{ width: `${Math.round(impactData.without_soil_card.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-[#183D2E]">
                                {Math.round(impactData.without_soil_card.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic block mt-1">Not Available</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.top_crops_label', { defaultValue: 'Top Suitable Crops' })}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {impactData.without_soil_card.top_crops.map((c, i) => (
                              <span key={i} className="font-medium bg-white border border-[#7A553A]/20 text-[#183D2E] px-2 py-1 rounded-lg">
                                {c.crop_name} ({Math.round(c.probability * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.expected_yield_label', { defaultValue: 'Baseline Yield' })}</span>
                          <p className="text-sm font-bold text-[#183D2E] mt-0.5">
                            {impactData.without_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="bg-gradient-to-br from-[#FEF6E9] to-white border-2 border-[#183D2E] rounded-2xl p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#183D2E] uppercase tracking-wider">
                          {t('soilcard.after_title', { defaultValue: 'After (Confirmed Soil Card)' })}
                        </span>
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          {t('soilcard.full_soil_model', { defaultValue: 'Full 7-Feature Model' })}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.confidence_label', { defaultValue: 'Confidence Score' })}</span>
                          {impactData.with_soil_card.confidence !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-stone-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-2.5 rounded-full"
                                  style={{ width: `${Math.round(impactData.with_soil_card.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-emerald-800">
                                {Math.round(impactData.with_soil_card.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic block mt-1">Not Available</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.top_crops_label', { defaultValue: 'Precision Crops' })}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {impactData.with_soil_card.top_crops.map((c, i) => (
                              <span key={i} className="font-bold bg-white border border-emerald-300 text-emerald-900 px-2 py-1 rounded-lg shadow-xs">
                                {c.crop_name} ({Math.round(c.probability * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[#7A553A] block">{t('soilcard.expected_yield_label', { defaultValue: 'Historical ML Yield' })}</span>
                          <p className="text-sm font-bold text-emerald-900 mt-0.5">
                            {impactData.with_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {impactData.integration_scope_note && (
                    <div className="bg-[#FAF8F5] border border-[#DA9A4C] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#183D2E]">
                      <Info className="w-4 h-4 text-[#DA9A4C] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Pipeline Scope Limitation (Partial Integration):</span>
                        <p className="text-[#4E5F57] leading-relaxed">
                          {impactData.integration_scope_note}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#7A553A]/15 text-[11px] text-[#7A553A] italic">
                    <strong>{t('soilcard.disclaimer_label', { defaultValue: 'Disclaimer' })}:</strong> {impactData.disclaimer}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7A553A] text-center py-8">Loading soil impact analysis...</p>
              )}
            </div>
          )}

          {/* TAB 3: WELFARE SCHEMES (PLANNED, DETAILS TO VERIFY) */}
          {activeTab === 'schemes' && (
            <div className="space-y-6">
              <div className="p-5 bg-amber-50/80 border border-amber-300 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#183D2E]">
                      Welfare Schemes Directory (Planned Feature)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      Details to Verify
                    </span>
                  </div>
                  <p className="text-[#4E5F57] leading-relaxed">
                    Agricultural schemes and subsidy registries were not merged into this branch and are not listed as an active feature. AgriSage AI is an independent decision-support tool. It does not provide financial grants, disburse government funds, or certify scheme eligibility.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 p-6 space-y-4">
                <h4 className="font-display text-base font-bold text-[#183D2E]">
                  How to Verify Agricultural Schemes & Subsidies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-[#7A553A]/15 space-y-1.5">
                    <span className="font-bold text-[#183D2E] block">1. Local Krishi Vigyan Kendra (KVK)</span>
                    <p className="text-[#4E5F57] leading-relaxed">
                      Visit your district KVK or Agriculture Extension Center for current operational guidelines on input subsidies, seeds, and soil testing.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#7A553A]/15 space-y-1.5">
                    <span className="font-bold text-[#183D2E] block">2. Mandal Agriculture Officer (MAO)</span>
                    <p className="text-[#4E5F57] leading-relaxed">
                      Consult your local MAO or Village Revenue Officer for land-holding eligibility requirements and official application windows.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[#7A553A] italic pt-2 border-t border-[#7A553A]/15">
                  Notice: Specific scheme amounts, subsidy percentages, and portal links are omitted until officially validated by backend services.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY & DPDP COMPLIANCE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#183D2E] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#DA9A4C]" />
                <span>{t('soilcard.placeholders_admin_title', { defaultValue: 'Data Governance & Farmer Privacy Protection' })}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4E5F57]">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] block">Admin Console & Moderation</span>
                  <p className="text-[11px] leading-relaxed">System moderation for community posts, marketplace listing verification, and flagged content.</p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] block">Consent Audit Log</span>
                  <p className="text-[11px] leading-relaxed">DPDP compliance log for farmer data consent, exportable records, and immediate right-to-be-forgotten deletion.</p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] block">Privacy & Zero-Retention</span>
                  <p className="text-[11px] leading-relaxed">Zero-retention default for uploaded media; all raw document images are processed in memory and discarded.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemesPage;
