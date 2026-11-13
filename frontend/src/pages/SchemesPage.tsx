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
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
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

  // Selected farm holding (defaults to farm ID 1 or user farm)
  const farmId = 1;

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

  // Initial load: get engine status and check existing confirmed card
  useEffect(() => {
    loadEngineStatus();
    checkLatestCardAndImpact();
  }, [farmId]);

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

      // Populate editable fields with extracted values
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

      // Refresh impact analysis
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
          {Math.round(conf * 100)}% Low / Out of Range
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        Manual Entry Required
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-agri-gold-100 text-agri-green-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Phase 5
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
              {t('soilcard.title')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {t('soilcard.subtitle')}
          </p>
        </div>
      </div>

      {/* Government Schemes Placeholder Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <Layers className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <h2 className="font-semibold text-amber-900">
            {t('soilcard.schemes_notice_title')}
          </h2>
          <p className="text-amber-800/90 mt-0.5">
            {t('soilcard.schemes_notice_desc')}
          </p>
        </div>
      </div>

      {/* Main Section: #soil-card-upload */}
      <section id="soil-card-upload" className="space-y-6">
        {/* OCR Engine Status Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-agri-green-50 text-agri-green-800 flex items-center justify-center font-bold">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    {t('soilcard.ocr_engine_title')}
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    engineInfo?.engine_detected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {engineInfo?.engine_detected
                      ? t('soilcard.engine_active', { engine: engineInfo.engine_detected })
                      : t('soilcard.manual_mode_badge')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {engineInfo?.engine_detected
                    ? `Available backends: ${engineInfo.available_engines.join(', ')}`
                    : t('soilcard.no_engine')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPowerShellGuide(!showPowerShellGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-agri-green-700 bg-agri-green-50 hover:bg-agri-green-100 px-3 py-2 rounded-xl transition-colors"
            >
              {showPowerShellGuide ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  {t('soilcard.hide_guide_btn')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {t('soilcard.install_guide_btn')}
                </>
              )}
            </button>
          </div>

          {/* PowerShell Installation Drawer */}
          {showPowerShellGuide && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-600 font-medium">
                Install local OCR backends via Windows PowerShell for automatic text recognition from images:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-900 text-gray-100 p-3 rounded-xl text-xs font-mono">
                  <span className="text-emerald-400 font-bold block mb-1"># Option 1: EasyOCR (PyTorch-based)</span>
                  <code>py -3.12 -m pip install easyocr</code>
                </div>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-xl text-xs font-mono">
                  <span className="text-emerald-400 font-bold block mb-1"># Option 2: Tesseract OCR</span>
                  <code>winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract</code>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                Note: In environments without OCR backends, AgriSage provides zero-friction manual calibration and regex parsing.
              </p>
            </div>
          )}
        </div>

        {/* Upload & Quick Sample Test Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Sample Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-agri-green-700" />
                Upload Soil Health Card
              </h2>

              {/* Dropzone */}
              <label className="border-2 border-dashed border-gray-300 hover:border-agri-green-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-agri-green-50/20">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : t('soilcard.drag_drop_text')}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, or PDF up to 10MB</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* Sample Card Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-600 block">
                  Quick Load Test Cards (One-Click Demo):
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => loadSample(SAMPLE_ENGLISH)}
                    className="text-left text-xs bg-gray-50 hover:bg-agri-green-50 border border-gray-200 hover:border-agri-green-300 p-2.5 rounded-xl transition-colors font-medium text-gray-800"
                  >
                    {t('soilcard.sample_a_btn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample(SAMPLE_TELUGU)}
                    className="text-left text-xs bg-gray-50 hover:bg-agri-green-50 border border-gray-200 hover:border-agri-green-300 p-2.5 rounded-xl transition-colors font-medium text-gray-800"
                  >
                    {t('soilcard.sample_b_btn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample(SAMPLE_HINDI)}
                    className="text-left text-xs bg-gray-50 hover:bg-agri-green-50 border border-gray-200 hover:border-agri-green-300 p-2.5 rounded-xl transition-colors font-medium text-gray-800"
                  >
                    {t('soilcard.sample_c_btn')}
                  </button>
                </div>
              </div>

              {/* Transcript Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  {t('soilcard.or_paste_text')}
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. Available Nitrogen: 280 kg/ha, pH: 7.2..."
                  className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600 focus:border-transparent"
                />
              </div>

              {/* Extract Button */}
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || (!selectedFile && !rawText.trim())}
                className="w-full inline-flex items-center justify-center gap-2 bg-agri-green-700 hover:bg-agri-green-800 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('soilcard.extracting')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('soilcard.extract_btn')}
                  </>
                )}
              </button>
            </div>

            {/* Thumbnail Preview Card if image selected */}
            {previewUrl && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-gray-600 block">Card Image Preview:</span>
                <div className="max-h-60 overflow-hidden rounded-xl border border-gray-100 flex items-center justify-center bg-gray-50">
                  <img src={previewUrl} alt="Soil Card Preview" className="object-contain max-h-60 w-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Confirmation Screen & Calibration */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-agri-green-700" />
                  {t('soilcard.confirm_title')}
                </h2>
                {extractionResult && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    Overall OCR: {Math.round(extractionResult.overall_confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Confirmation Guard Alert Banner */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-900">
                  {t('soilcard.confirm_guard_alert')}
                </p>
              </div>

              {/* Indic Language Warning if detected */}
              {extractionResult?.status === 'PARTIAL' && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Indic Language Card Detected (Telugu/Hindi)</span>
                  <p className="text-blue-800">
                    Regional language recognition requires specialized OCR weights. Values have been extracted via smart heuristics; please verify each number before confirming.
                  </p>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nitrogen */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_n')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">kg/ha</span>
                  </div>
                </div>

                {/* Phosphorus */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_p')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">kg/ha</span>
                  </div>
                </div>

                {/* Potassium */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_k')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">kg/ha</span>
                  </div>
                </div>

                {/* pH */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_ph')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">pH (0-14)</span>
                  </div>
                </div>

                {/* Organic Carbon */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_oc')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">%</span>
                  </div>
                </div>

                {/* Electrical Conductivity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {t('soilcard.field_ec')}
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
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-agri-green-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">dS/m</span>
                  </div>
                </div>
              </div>

              {/* Soil Texture Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  {t('soilcard.field_texture')}
                </label>
                <select
                  value={soilTexture}
                  onChange={(e) => setSoilTexture(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-agri-green-600"
                >
                  <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                  <option value="Black Cotton">Black Cotton Soil (Regur)</option>
                  <option value="Red Sandy Loam">Red Sandy Loam</option>
                  <option value="Alluvial Loam">Alluvial Loam</option>
                  <option value="Clay">Heavy Clay</option>
                </select>
              </div>

              {/* Privacy Opt-In Toggle */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeImageOptIn}
                    onChange={(e) => setStoreImageOptIn(e.target.checked)}
                    className="w-4 h-4 text-agri-green-600 rounded border-gray-300 focus:ring-agri-green-500"
                  />
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    {t('soilcard.privacy_toggle')}
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 pl-6 leading-relaxed">
                  {t('soilcard.privacy_note')}
                </p>
              </div>

              {/* Confirmation Success Message */}
              {confirmSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {confirmSuccessMsg}
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming || (!nitrogen && !ph)}
                className="w-full inline-flex items-center justify-center gap-2 bg-agri-green-800 hover:bg-agri-green-900 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('soilcard.confirming')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t('soilcard.confirm_btn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Impact Analysis Section (Before vs After) */}
        {impactData && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-agri-green-700" />
                  {t('soilcard.impact_title')}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {t('soilcard.impact_subtitle')}
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

            {/* Impact Highlights Bullet points */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                Agronomic Shift Summary:
              </span>
              <ul className="space-y-1.5">
                {impactData.impact_summary.map((summary, idx) => (
                  <li key={idx} className="text-xs text-emerald-900 font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Before (Without Soil Card) */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('soilcard.before_title')}
                  </span>
                  <span className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {t('soilcard.weather_only_model')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">{t('soilcard.confidence_label')}</span>
                    {impactData.without_soil_card.confidence !== null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-2.5 rounded-full"
                            style={{ width: `${Math.round(impactData.without_soil_card.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {Math.round(impactData.without_soil_card.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic block mt-1">Not Available</span>
                    )}
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Weather-only model evaluated (temperature, humidity, rainfall)
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">{t('soilcard.top_crops_label')}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {impactData.without_soil_card.top_crops.map((c, i) => (
                        <span key={i} className="text-xs font-medium bg-white border border-gray-200 text-gray-800 px-2 py-1 rounded-lg">
                          {c.crop_name} ({Math.round(c.probability * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500 block">{t('soilcard.expected_yield_label')}</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {impactData.without_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                    </p>
                    <span className="text-[10px] text-gray-400">Baseline district production records</span>
                  </div>
                </div>
              </div>

              {/* Card 2: After (With Confirmed Soil Card) */}
              <div className="bg-agri-green-50/50 border-2 border-agri-green-300 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-agri-green-900 uppercase tracking-wider">
                    {t('soilcard.after_title')}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {t('soilcard.full_soil_model')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600 block">{t('soilcard.confidence_label')}</span>
                    {impactData.with_soil_card.confidence !== null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2.5 rounded-full"
                            style={{ width: `${Math.round(impactData.with_soil_card.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-emerald-800">
                          {Math.round(impactData.with_soil_card.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic block mt-1">Not Available</span>
                    )}
                    <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
                      Full 7-feature model evaluated with confirmed N-P-K-pH values
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600 block">{t('soilcard.top_crops_label')}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {impactData.with_soil_card.top_crops.map((c, i) => (
                        <span key={i} className="text-xs font-bold bg-white border border-emerald-200 text-emerald-900 px-2 py-1 rounded-lg shadow-2xs">
                          {c.crop_name} ({Math.round(c.probability * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600 block">{t('soilcard.expected_yield_label')}</span>
                    <p className="text-base font-bold text-emerald-950 mt-0.5">
                      {impactData.with_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                    </p>
                    <span className="text-[10px] text-gray-500">
                      Real regressor output from historical production records (zero unvalidated soil adjustments)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Integration Scope Limitation Callout */}
            {impactData.integration_scope_note && (
              <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Pipeline Scope Limitation (Partial Integration):</span>
                  <p className="text-amber-800 leading-relaxed">
                    {impactData.integration_scope_note}
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic">
              <strong>{t('soilcard.disclaimer_label')}:</strong> {impactData.disclaimer}
            </div>
          </div>
        )}

        {/* Placeholders for Admin Console, Consent Audit, Moderation, Privacy */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-400" />
            {t('soilcard.placeholders_admin_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <span className="font-semibold text-gray-800 block mb-1">Admin Console & Moderation</span>
              <p className="text-gray-500 text-[11px]">System moderation for community posts and listing verification (Next Phase).</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <span className="font-semibold text-gray-800 block mb-1">Consent Audit Log</span>
              <p className="text-gray-500 text-[11px]">GDPR/DPDP compliance log for farmer data consent, export, and right-to-be-forgotten.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <span className="font-semibold text-gray-800 block mb-1">Privacy & Data Retention</span>
              <p className="text-gray-500 text-[11px]">Zero-retention default for uploaded media; all raw document images discarded upon processing.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
