import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FlaskConical,
  Landmark,
  Camera,
  Trash2,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial } from '../context/PictorialContext';
import { useAuth } from '../context/AuthContext';
import { useSoilCard } from '../hooks/useSoilCard';
import { validateImageFile, compressImage } from '../utils/imageCompressor';
import {
  getOcrEngines,
  extractSoilCard,
  getSoilImpact,
  SoilCardExtractionResponse,
  SoilImpactAnalysisResponse,
  OcrEnginesResponse,
} from '../api/soil_card';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { WateringFieldIllustration } from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StepFlow } from '../components/common/StepFlow';
import { StatusBadge } from '../components/common/StatusBadge';
import { scrollToSection } from '../utils/scrollToSection';

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

const ALLOWED_RETURN_PATHS = ['/recommend', '/crop-recommendation', '/dashboard'];

export const SchemesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { activeFarm } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Validate returnTo parameter against internal allowlist
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = rawReturnTo && ALLOWED_RETURN_PATHS.includes(rawReturnTo) ? rawReturnTo : null;

  // Selected farm holding from activeFarm context (or fallback farm 1)
  const farmId = activeFarm?.id ?? 1;

  // Shared soil card hook (TanStack Query, keyed by farmId)
  const {
    card: savedCard,
    hasCard,
    saveSoilCard,
    isSaving,
    deleteSoilCard,
    isDeleting,
  } = useSoilCard(farmId);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'upload' | 'impact' | 'schemes' | 'privacy'>('upload');

  // Handle URL tab query parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'upload' || tabParam === 'impact' || tabParam === 'schemes' || tabParam === 'privacy') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Mode: if card exists, default to saved summary unless user clicks "Replace card"
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [showReplaceOptions, setShowReplaceOptions] = useState<boolean>(false);

  // OCR engine state
  const [engineInfo, setEngineInfo] = useState<OcrEnginesResponse | null>(null);
  const [showPowerShellGuide, setShowPowerShellGuide] = useState(false);

  // Upload & Extraction state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<SoilCardExtractionResponse | null>(null);

  // Confirmation editable values
  const [nitrogen, setNitrogen] = useState<string>('');
  const [phosphorus, setPhosphorus] = useState<string>('');
  const [potassium, setPotassium] = useState<string>('');
  const [ph, setPh] = useState<string>('');
  const [organicCarbon, setOrganicCarbon] = useState<string>('');
  const [ec, setEc] = useState<string>('');
  const [soilTexture, setSoilTexture] = useState<string>('Sandy Clay Loam');
  const [testDate, setTestDate] = useState<string>('');
  const [storeImageOptIn, setStoreImageOptIn] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  // Impact Analysis state
  const [impactData, setImpactData] = useState<SoilImpactAnalysisResponse | null>(null);

  // Sync saved card data to local form when active farm or savedCard changes
  useEffect(() => {
    if (savedCard) {
      setNitrogen(savedCard.nitrogen_kg_ha != null ? String(savedCard.nitrogen_kg_ha) : '');
      setPhosphorus(savedCard.phosphorus_kg_ha != null ? String(savedCard.phosphorus_kg_ha) : '');
      setPotassium(savedCard.potassium_kg_ha != null ? String(savedCard.potassium_kg_ha) : '');
      setPh(savedCard.ph != null ? String(savedCard.ph) : '');
      setOrganicCarbon(savedCard.organic_carbon_pct != null ? String(savedCard.organic_carbon_pct) : '');
      setEc(savedCard.electrical_conductivity_ds_m != null ? String(savedCard.electrical_conductivity_ds_m) : '');
      if (savedCard.soil_texture) setSoilTexture(savedCard.soil_texture);
      if (savedCard.test_date) setTestDate(savedCard.test_date);
      setIsReplacing(false);
    } else {
      setNitrogen('');
      setPhosphorus('');
      setPotassium('');
      setPh('');
      setOrganicCarbon('');
      setEc('');
      setTestDate('');
      setIsReplacing(false);
    }
    setExtractionResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setConfirmSuccessMsg(null);
  }, [farmId, savedCard]);

  const loadEngineStatus = async () => {
    try {
      const data = await getOcrEngines();
      setEngineInfo(data);
    } catch (e) {
      console.warn('Could not fetch OCR engine status', e);
    }
  };

  const loadImpact = async () => {
    try {
      const impact = await getSoilImpact(farmId, 'Rice');
      setImpactData(impact);
    } catch (e) {
      console.warn('Error fetching soil card impact', e);
    }
  };

  useEffect(() => {
    loadEngineStatus();
    loadImpact();
  }, [farmId, hasCard]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid && file.type !== 'application/pdf') {
        setUploadError(validation.errorMessage || 'Invalid image format or size.');
        return;
      }
      setUploadError(null);
      setConfirmSuccessMsg(null);

      try {
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await compressImage(file);
        }
        setSelectedFile(fileToUpload);
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          setPreviewUrl(URL.createObjectURL(fileToUpload));
        }
      } catch {
        setSelectedFile(file);
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          setPreviewUrl(URL.createObjectURL(file));
        }
      }
    }
  };

  const loadSample = (sampleText: string) => {
    setRawText(sampleText);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setUploadError(null);
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

      if (res.is_soil_health_card === false) {
        setUploadError(res.rejection_reason || 'The uploaded image could not be verified as an official Soil Health Card. Please enter your values manually.');
      }

      if (res.nitrogen.value !== null) setNitrogen(String(res.nitrogen.value));
      if (res.phosphorus.value !== null) setPhosphorus(String(res.phosphorus.value));
      if (res.potassium.value !== null) setPotassium(String(res.potassium.value));
      if (res.ph.value !== null) setPh(String(res.ph.value));
      if (res.organic_carbon.value !== null) setOrganicCarbon(String(res.organic_carbon.value));
      if (res.electrical_conductivity.value !== null) setEc(String(res.electrical_conductivity.value));
      if (res.soil_texture) setSoilTexture(res.soil_texture);
      if (res.test_date) setTestDate(res.test_date);
      if (res.preview_image_base64) {
        setPreviewUrl(res.preview_image_base64);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Extraction failed. Check connection to backend or enter values manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = async () => {
    if (isConfirming || isSaving) return;
    setIsConfirming(true);
    setConfirmSuccessMsg(null);
    setUploadError(null);
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
        extraction_method: extractionResult?.engine_detected || (selectedFile ? 'gemini_vision' : 'manual'),
        source: selectedFile || extractionResult ? 'photo read by AI' : 'typed by farmer',
        test_date: testDate || extractionResult?.test_date || undefined,
        field_confidences: extractionResult ? {
          nitrogen: extractionResult.nitrogen.confidence,
          phosphorus: extractionResult.phosphorus.confidence,
          potassium: extractionResult.potassium.confidence,
          ph: extractionResult.ph.confidence,
          organic_carbon: extractionResult.organic_carbon.confidence,
          electrical_conductivity: extractionResult.electrical_conductivity.confidence,
        } : undefined,
      };

      const res = await saveSoilCard(payload);
      setConfirmSuccessMsg(res.message);
      setIsReplacing(false);
      await loadImpact();
    } catch (err: any) {
      setUploadError(err.message || 'Could not save confirmed values to farm.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmPrompt = window.confirm(
      t('soilcard.remove_confirm_msg', {
        defaultValue: 'Are you sure you want to remove the saved soil values for this farm?',
      })
    );
    if (!confirmPrompt) return;

    try {
      await deleteSoilCard(farmId);
      setConfirmSuccessMsg(
        t('soilcard.card_removed_success', {
          defaultValue: 'Saved soil values removed successfully.',
        })
      );
      setNitrogen('');
      setPhosphorus('');
      setPotassium('');
      setPh('');
      setOrganicCarbon('');
      setEc('');
      setTestDate('');
      setIsReplacing(false);
      setShowReplaceOptions(false);
      setExtractionResult(null);
      await loadImpact();
    } catch (err: any) {
      setUploadError(err.message || 'Could not remove soil values.');
    }
  };

  const getConfidenceBadge = (_fieldName: string, fieldConf?: { value: number | null; confidence: number; status: string }) => {
    if (!extractionResult) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-400 px-2 py-0.5 rounded-full">
          {t('soilcard.source_manual', { defaultValue: 'Typed by farmer' })}
        </span>
      );
    }

    if (!fieldConf || fieldConf.value === null || fieldConf.confidence === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {t('soilcard.field_unreadable', { defaultValue: 'Not detected — enter manually' })}
        </span>
      );
    }

    const pct = Math.round(fieldConf.confidence * 100);
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {t('soilcard.read_from_card', { defaultValue: 'Read from your card' })} • {pct}%
      </span>
    );
  };

  const plainMeaning = (hasCard || impactData?.has_confirmed_soil_card)
    ? `Confirmed soil card active. Soil profile: N=${nitrogen || '280'} kg/ha, P=${phosphorus || '18'} kg/ha, K=${potassium || '310'} kg/ha, pH=${ph || '7.2'}. Model upgraded from weather-only to full 7-feature agronomic evaluation.`
    : 'No confirmed soil card registered. Recommendations currently rely on regional weather and soil averages.';

  // PICTORIAL MODE
  if (isPictorial) {
    const isCardActive = Boolean(hasCard && savedCard);

    return (
      <div className="space-y-6 animate-fadeIn pb-12 max-w-6xl mx-auto">
        <PageHeader
          icon={FileText}
          title={language === 'te' ? 'నేల ఆరోగ్య పత్రం & పథకాలు' : language === 'hi' ? 'मृदा स्वास्थ्य व योजनाएं' : 'Soil Health & Schemes'}
          purpose={language === 'te' ? 'నేల పరీక్ష ఫలితాలు, ఎరువుల మోతాదు మరియు సంక్షేమ పథకాలు' : language === 'hi' ? 'मिट्टी की जांच, पोषण और सरकारी योजनाएं' : 'Visual soil nutrients and welfare schemes (planned, details to verify).'}
        />

        {/* Lead Status Card */}
        <div className="bg-[#FFFDF8] dark:bg-stone-900 rounded-3xl border-2 border-[#1B5E3B] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] dark:bg-stone-800 border-2 border-[#1B5E3B] flex items-center justify-center shrink-0 shadow-sm">
              <WateringFieldIllustration className="w-16 h-16 drop-shadow-sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {soilTexture || 'Field Soil'}
                </span>
                <StatusBadge
                  status={isCardActive ? 'success' : 'nodata'}
                  label={isCardActive ? (language === 'te' ? 'ధృవీకరించబడింది' : language === 'hi' ? 'पुष्टि की गई' : 'Card Confirmed') : (language === 'te' ? 'బేస్‌లైన్ డేటా' : language === 'hi' ? 'बेसलाइन डेटा' : 'Baseline Mode')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] dark:text-white leading-snug">
                {isCardActive
                  ? (language === 'te' ? 'నేల పోషకాలు నమోదు చేయబడ్డాయి' : language === 'hi' ? 'मृदा पोषक तत्व सक्रिय हैं' : 'Calibrated Soil Profile')
                  : (language === 'te' ? 'నేల పరీక్ష రికార్డు నమోదు కాలేదు' : language === 'hi' ? 'कोई सॉइल टेस्ट दर्ज नहीं है' : 'No Soil Card Recorded Yet')}
              </h2>
              <p className="text-[16px] text-[#4A5750] dark:text-stone-300 max-w-xl">
                {isCardActive
                  ? `N: ${nitrogen || '280'} kg/ha • P: ${phosphorus || '18'} kg/ha • K: ${potassium || '310'} kg/ha • pH ${ph || '7.2'}`
                  : (language === 'te' ? 'ప్రాంతీయ సగటు నేల విలువల ఆధారంగా సిఫార్సులు చేయబడుతున్నాయి. ఖచ్చితత్వం కోసం మీ నేల పరీక్ష పత్రాన్ని నమోదు చేయండి.' : language === 'hi' ? 'क्षेत्रीय औसत के आधार पर सिफारिशें हो रही हैं। सटीक जानकारी के लिए सॉइल टेस्ट कार्ड दर्ज करें।' : 'Recommendations currently use regional baseline averages. Enter lab test values to upgrade confidence.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <ReadAloudButton
              text={`Soil status: ${isCardActive ? `Confirmed soil card. Nitrogen ${nitrogen || 280}, Phosphorus ${phosphorus || 18}, Potassium ${potassium || 310}` : 'No confirmed soil card registered. Using regional baseline values.'} ${plainMeaning}`}
              label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
            />
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setMode('words');
                scrollToSection('soil-card-upload');
              }}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు & క్యాలిబ్రేషన్' : language === 'hi' ? 'पूरा विवरण व कैलिब्रेशन' : 'View / Edit Card'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Pictorial Summary Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Tile 1: Soil Nutrients N-P-K */}
          <PictorialTile
            title={language === 'te' ? 'నత్రజని-భాస్వరం-పొటాష్' : language === 'hi' ? 'एन-पी-के पोषक तत्व' : 'Nutrients (N-P-K)'}
            phrase={isCardActive ? `N: ${nitrogen || '--'} • P: ${phosphorus || '--'} • K: ${potassium || '--'} kg/ha` : (language === 'te' ? 'బేస్‌లైన్ సగటు (N:280 P:18 K:310)' : language === 'hi' ? 'बेसलाइन औसत (N:280 P:18 K:310)' : 'Regional baseline average')}
            illustration={<WateringFieldIllustration className="w-20 h-20" />}
            status={isCardActive ? 'success' : 'nodata'}
            statusWord={isCardActive ? (language === 'te' ? 'ధృవీకరించబడింది' : language === 'hi' ? 'सत्यापित' : 'Confirmed') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'Baseline / No Data')}
            spokenText={isCardActive ? `Nitrogen is ${nitrogen} kg/ha, Phosphorus is ${phosphorus} kg/ha, Potassium is ${potassium} kg/ha.` : 'No lab soil test on file. Regional baseline estimates are being used.'}
            onOpenDetails={() => {
              setActiveTab('upload');
              setMode('words');
              scrollToSection('soil-card-upload');
            }}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 2: Soil pH & Texture */}
          <PictorialTile
            title={language === 'te' ? 'పీహెచ్ & నేల రకం' : language === 'hi' ? 'पीएच व मिट्टी का प्रकार' : 'pH & Soil Texture'}
            phrase={`${soilTexture || 'Sandy Clay Loam'} • pH ${ph || (isCardActive ? 'Not tested' : '7.2 (est)')}`}
            illustration={<FlaskConical className="w-16 h-16 text-[#1565A8]" />}
            status={isCardActive ? 'info' : 'nodata'}
            statusWord={isCardActive ? `pH ${ph || '7.2'}` : (language === 'te' ? 'అంచనా' : language === 'hi' ? 'अनुमानित' : 'Estimated')}
            spokenText={`Soil reaction is pH ${ph || '7.2'} and soil texture is ${soilTexture || 'sandy clay loam'}.`}
            onOpenDetails={() => {
              setActiveTab('impact');
              setMode('words');
              scrollToSection('soil-card-upload');
            }}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 3: Schemes (Planned. Details to verify) */}
          <PictorialTile
            title={language === 'te' ? 'ప్రణాళిక. వివరాలు ధృవీకరించబడాలి' : language === 'hi' ? 'प्रस्तावित। विवरण सत्यापित करें' : 'Planned. Details to verify'}
            phrase={language === 'te' ? 'వివరాలు ధృవీకరించాలి (డెమో సమాచారం)' : language === 'hi' ? 'विवरण सत्यापित करें (डेमो जानकारी)' : 'Directory planned (details to verify)'}
            illustration={<Landmark className="w-16 h-16 text-[#7A553A]" />}
            status="warning"
            statusWord={language === 'te' ? 'ధృవీకరించండి' : language === 'hi' ? 'సत्यापित करें' : 'details to verify'}
            spokenText="Welfare schemes directory is planned. Details require verification from local agriculture extension offices."
            onOpenDetails={() => {
              setActiveTab('schemes');
              setMode('words');
              scrollToSection('soil-card-upload');
            }}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवరణ' : 'Details'}
          />
        </div>

        {/* Step-by-Step Physical Field Flow */}
        <StepFlow
          heading={language === 'te' ? 'నేల పరీక్ష & పథకాల మార్గదర్శకత్వం' : language === 'hi' ? 'मृदा स्वास्थ्य व योजना प्रक्रिया' : 'Soil Testing & Schemes Workflow'}
          spokenText="Step 1: Collect soil core samples from 10 to 15 field locations. Step 2: Calibrate app with Soil Health Card N-P-K readings. Step 3: Consult local Agriculture Extension Officer for verified government welfare schemes."
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'నేల నమూనా సేకరణ' : language === 'hi' ? 'मिट्टी का नमूना संग्रह' : 'Soil Sampling',
              desc: language === 'te' ? 'పొలంలో 10-15 ప్రదేశాల్లో 15 సెం.మీ లోతులో మట్టి సేకరించి ల్యాబ్‌లో పరీక్షించండి' : language === 'hi' ? 'खेत में 10-15 स्थानों से 15 सेमी गहराई से नमूना लेकर लैब में जांच करवाएं' : 'Collect 10-15 core samples at 15cm depth across field for testing at KVK/lab.',
              icon: FlaskConical,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'యాప్‌లో నమోదు & క్యాలిబ్రేషన్' : language === 'hi' ? 'ऐप में दर्ज व कैलिब्रेशन' : 'Nutrient Calibration',
              desc: language === 'te' ? 'ల్యాబ్ ఫలితాల ప్రకారం N-P-K మరియు pH విలువలను నమోదు చేసి సిఫార్సులను మెరుగుపరచండి' : language === 'hi' ? 'सॉइल कार्ड से N-P-K और पीएच मान दर्ज करके सटीक सिफारिशें प्राप्त करें' : 'Input lab test values to replace baseline averages with verified field nutrients.',
              icon: FileText,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'అధికారులతో సంప్రదింపు' : language === 'hi' ? 'कृषि अधिकारी से संपर्क' : 'Extension Verification',
              desc: language === 'te' ? 'అర్హత కలిగిన ప్రభుత్వ పథకాల ధృవీకరణ కోసం మీ స్థానిక వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి' : language === 'hi' ? 'पात्र सरकारी योजनाओं के सत्यापन हेतु अपने स्थानीय कृषि विस्तार अधिकारी से संपर्क करें' : 'Visit local Agriculture Extension Officer (AEO) / Rythu Bharosa Kendra for verified scheme enrolment.',
              icon: Landmark,
            },
          ]}
        />
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
            : 'Calibrated recommendation model confidence upgrade and targeted fertilizer advice.',
        }}
      />

      {/* LEAD SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Soil Nutrient Status */}
        <div className="bg-gradient-to-br from-[#FEF6E9] to-white dark:from-stone-900 dark:to-stone-850 rounded-2xl border-2 border-[#DA9A4C] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Soil Nutrient Status
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                hasCard ? 'bg-[#183D2E] text-white dark:bg-emerald-700' : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
              }`}>
                {hasCard ? 'Confirmed' : 'Baseline'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#183D2E] dark:text-white">
                {soilTexture}
              </h2>
              <span className="text-xs font-semibold text-[#7A553A] dark:text-stone-400">
                pH {ph || '7.2'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
              <div className="bg-[#FAF8F5] dark:bg-stone-800 p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">N</span>
                <strong className="text-sm text-[#183D2E] dark:text-white">{nitrogen ? `${nitrogen}` : (hasCard ? '--' : '280 (est)')}</strong>
                <span className="text-[9px] text-[#4E5F57] dark:text-stone-400 block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-stone-800 p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">P</span>
                <strong className="text-sm text-[#183D2E] dark:text-white">{phosphorus ? `${phosphorus}` : (hasCard ? '--' : '18 (est)')}</strong>
                <span className="text-[9px] text-[#4E5F57] dark:text-stone-400 block">kg/ha</span>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-stone-800 p-2 rounded-xl border border-[#7A553A]/15">
                <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">K</span>
                <strong className="text-sm text-[#183D2E] dark:text-white">{potassium ? `${potassium}` : (hasCard ? '--' : '310 (est)')}</strong>
                <span className="text-[9px] text-[#4E5F57] dark:text-stone-400 block">kg/ha</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Soil status: Nitrogen ${nitrogen || 280}, Phosphorus ${phosphorus || 18}, Potassium ${potassium || 310}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                scrollToSection('soil-card-upload');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>{t('soilcard.calibrate_soil_btn', { defaultValue: 'Calibrate Soil' })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Agronomic Model Shift */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
                {t('soilcard.agronomic_precision', { defaultValue: 'Agronomic Precision' })}
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] dark:text-stone-400 bg-[#FAF8F5] dark:bg-stone-800 px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                {t('soilcard.evaluation_shift', { defaultValue: 'Evaluation Shift' })}
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] dark:bg-stone-800 rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#4E5F57] dark:text-stone-400">{t('soilcard.weather_baseline_mode', { defaultValue: 'Weather Baseline Mode:' })}</span>
                <strong className="text-[#7A553A] dark:text-stone-300">
                  {impactData?.without_soil_card?.confidence != null ? `${Math.round(impactData.without_soil_card.confidence * 100)}% Confidence` : '—'}
                </strong>
              </div>
              <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-400 font-bold">
                <span>{t('soilcard.with_confirmed_card', { defaultValue: 'With Confirmed Soil Card:' })}</span>
                <span>
                  {impactData?.with_soil_card?.confidence != null ? `${Math.round(impactData.with_soil_card.confidence * 100)}% Confidence` : 'Calibrated upon card entry'}
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${impactData?.with_soil_card?.confidence != null ? Math.round(impactData.with_soil_card.confidence * 100) : 0}%` }}
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
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#DA9A4C]" />
                Welfare Schemes
              </span>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Planned &bull; Details to verify
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] dark:bg-stone-800 rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <p className="font-semibold text-[#183D2E] dark:text-white">
                Scheme Directory Notice:
              </p>
              <p className="text-[#4E5F57] dark:text-stone-300 leading-relaxed">
                Central and State welfare schemes are planned for a future integration and are not available on this version.
              </p>
              <p className="text-[11px] text-[#7A553A] dark:text-stone-400 italic">
                Guidelines, criteria, and subsidy amounts change periodically.
              </p>
            </div>

            <p className="text-[11px] text-[#7A553A] dark:text-stone-400">
              Grow2Gain does not disburse government subsidies. Verify rules with your local Mandal Agriculture Officer (MAO).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('schemes');
              scrollToSection('soil-card-upload');
            }}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-[#7A553A]/25 bg-[#FAF8F5] dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold text-xs text-[#183D2E] dark:text-white flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-[#7A553A]" />
            <span>View Advisory Notice</span>
          </button>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div id="soil-card-upload" tabIndex={-1} className="bg-white dark:bg-stone-900 rounded-3xl border border-[#7A553A]/20 dark:border-stone-800 shadow-sm overflow-hidden scroll-mt-24">
        <div className="flex border-b border-[#7A553A]/15 bg-[#FAF8F5] dark:bg-stone-850 px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#183D2E] text-[#183D2E] dark:text-emerald-400 bg-white dark:bg-stone-900'
                : 'border-transparent text-[#7A553A] dark:text-stone-400 hover:text-[#183D2E]'
            }`}
          >
            <Upload className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('soilcard.upload_calibrate_tab', { defaultValue: 'Upload & Calibrate Soil Card' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'impact'
                ? 'border-[#183D2E] text-[#183D2E] dark:text-emerald-400 bg-white dark:bg-stone-900'
                : 'border-transparent text-[#7A553A] dark:text-stone-400 hover:text-[#183D2E]'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('soilcard.impact_shift_tab', { defaultValue: 'Agronomic Impact Shift' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemes')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'schemes'
                ? 'border-[#183D2E] text-[#183D2E] dark:text-emerald-400 bg-white dark:bg-stone-900'
                : 'border-transparent text-[#7A553A] dark:text-stone-400 hover:text-[#183D2E]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('soilcard.welfare_schemes_tab', { defaultValue: 'Welfare Schemes (Planned)' })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#183D2E] text-[#183D2E] dark:text-emerald-400 bg-white dark:bg-stone-900'
                : 'border-transparent text-[#7A553A] dark:text-stone-400 hover:text-[#183D2E]'
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
              {/* Confirmed State View (if farm has saved card and not replacing) */}
              {hasCard && savedCard && !isReplacing ? (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-[#183D2E] dark:border-emerald-600 p-5 sm:p-6 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#7A553A]/15 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge
                          status="success"
                          label={t('soilcard.saved_values_active', { defaultValue: 'Saved soil values active for this farm' })}
                          size="sm"
                        />
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {t('soilcard.source_label', { defaultValue: 'Source' })}: {savedCard.source === 'photo read by AI' ? t('soilcard.source_ai', { defaultValue: 'Photo read by AI' }) : t('soilcard.source_manual', { defaultValue: 'Typed by farmer' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#183D2E] dark:text-emerald-400">
                        {savedCard.soil_texture || 'Field Soil'}
                      </h3>
                      {(savedCard.test_date || savedCard.created_at) && (
                        <p className="text-xs text-[#7A553A] dark:text-stone-400">
                          {t('soilcard.test_date_label', { defaultValue: 'Test Date' })}: {savedCard.test_date || (savedCard.created_at ? new Date(savedCard.created_at).toLocaleDateString() : '--')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigate(returnTo || '/recommend')}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold bg-[#183D2E] hover:bg-[#265C46] text-white flex items-center gap-2 text-xs shadow-sm transition-all"
                      >
                        <span>
                          {returnTo
                            ? t('soilcard.back_to_crop_advisory', { defaultValue: 'Back to Crop Advisory' })
                            : t('soilcard.go_to_crop_advisory', { defaultValue: 'Go to Crop Advisory' })}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowReplaceOptions(!showReplaceOptions)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl font-bold border border-[#7A553A]/30 dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-[#183D2E] dark:text-stone-200 text-xs shadow-sm transition-all"
                      >
                        <span>{t('soilcard.replace_or_remove_btn', { defaultValue: 'Replace card / Remove saved values' })}</span>
                      </button>
                    </div>
                  </div>

                  {/* Replace / Remove confirmation panel */}
                  {showReplaceOptions && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                      <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                        Choose an action for this farm's soil profile:
                      </p>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReplacing(true);
                            setShowReplaceOptions(false);
                            setExtractionResult(null);
                          }}
                          className="flex-1 sm:flex-initial min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-[#183D2E] text-white hover:bg-[#265C46] transition-colors"
                        >
                          {t('soilcard.replace_card_btn', { defaultValue: 'Replace card' })}
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex-1 sm:flex-initial min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition-colors disabled:bg-stone-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDeleting ? t('soilcard.removing', { defaultValue: 'Removing saved values...' }) : t('soilcard.remove_card_btn', { defaultValue: 'Remove saved values' })}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {confirmSuccessMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{confirmSuccessMsg}</span>
                    </div>
                  )}

                  {/* Confirmed Nutrient Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_n', { defaultValue: 'Available Nitrogen (N)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.nitrogen_kg_ha ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">kg/ha</span>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_p', { defaultValue: 'Available Phosphorus (P)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.phosphorus_kg_ha ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">kg/ha</span>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_k', { defaultValue: 'Available Potassium (K)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.potassium_kg_ha ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">kg/ha</span>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_ph', { defaultValue: 'Soil Reaction (pH)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.ph ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">pH</span>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_oc', { defaultValue: 'Organic Carbon (OC)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.organic_carbon_pct ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">%</span>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-stone-800 p-3 rounded-xl border border-[#7A553A]/15 text-center">
                      <span className="text-[10px] text-[#7A553A] dark:text-stone-400 font-bold block">{t('soilcard.field_ec', { defaultValue: 'Electrical Conductivity (EC)' })}</span>
                      <strong className="text-base text-[#183D2E] dark:text-white block mt-0.5">{savedCard.electrical_conductivity_ds_m ?? '--'}</strong>
                      <span className="text-[10px] text-[#4E5F57] dark:text-stone-400">dS/m</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Card Upload & Manual Entry Form Flow */
                <div className="space-y-6">
                  {/* Replacing mode header */}
                  {hasCard && isReplacing && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-4 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Replacing saved soil card for this farm. Upload a new photo or adjust values below.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsReplacing(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 border border-amber-400 text-stone-700 dark:text-stone-200 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* AI Provider Transparency Notice */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                      {t('soilcard.ai_provider_notice', { defaultValue: 'Photo is sent to an AI provider (Google Gemini) to read values.' })}
                    </p>
                  </div>

                  {/* Soil Card Parser Status Card */}
                  <div className="bg-[#FAF8F5] dark:bg-stone-850 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold">
                          <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#183D2E] dark:text-white">
                              {t('soilcard.ocr_engine_title', { defaultValue: 'Card Parser Status: Manual Entry & Text Parsing (No OCR Installed)' })}
                            </h3>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              engineInfo?.engine_detected
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                            }`}>
                              {engineInfo?.engine_detected
                                ? t('soilcard.engine_active', { engine: engineInfo.engine_detected, defaultValue: `Active: ${engineInfo.engine_detected}` })
                                : t('soilcard.manual_mode_badge', { defaultValue: 'Manual Entry & Text Parsing (No OCR)' })}
                            </span>
                          </div>
                          <p className="text-xs text-[#7A553A] dark:text-stone-400 mt-0.5">
                            {engineInfo?.engine_detected
                              ? `Available backends: ${engineInfo.available_engines.join(', ')}`
                              : t('soilcard.no_engine', { defaultValue: 'Zero-friction manual entry with regex pattern assistance. No OCR backend is installed locally.' })}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPowerShellGuide(!showPowerShellGuide)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183D2E] dark:text-emerald-400 bg-white dark:bg-stone-800 border border-[#7A553A]/20 dark:border-stone-700 hover:bg-[#FAF8F5] px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
                      >
                        {showPowerShellGuide ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>{t('soilcard.hide_guide_btn', { defaultValue: 'Hide Setup Guide' })}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>{t('soilcard.install_guide_btn', { defaultValue: 'Optional OCR Setup Guide' })}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {showPowerShellGuide && (
                      <div className="mt-4 pt-4 border-t border-[#7A553A]/15 space-y-3">
                        <p className="text-xs text-[#4E5F57] dark:text-stone-300 font-medium">
                          Note: Grow2Gain uses manual input and text parsing by default. If you wish to enable experimental optical recognition from images, you can install an optional OCR engine via Windows PowerShell:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-[#183D2E] text-white p-3 rounded-xl text-xs font-mono">
                            <span className="text-[#DA9A4C] font-bold block mb-1"># Optional: EasyOCR (PyTorch-based)</span>
                            <code>py -3.12 -m pip install easyocr</code>
                          </div>
                          <div className="bg-[#183D2E] text-white p-3 rounded-xl text-xs font-mono">
                            <span className="text-[#DA9A4C] font-bold block mb-1"># Optional: Tesseract OCR</span>
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
                      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-5 space-y-4">
                        <h3 className="text-sm font-bold text-[#183D2E] dark:text-white flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#DA9A4C]" />
                          <span>{t('soilcard.take_photo_camera', { defaultValue: 'Choose photo or capture with camera' })}</span>
                        </h3>

                        {/* Dropzone with Camera Capture support */}
                        <label className="border-2 border-dashed border-[#7A553A]/30 dark:border-stone-700 hover:border-[#183D2E] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAF8F5] dark:bg-stone-800 hover:bg-[#FEF6E9]/40">
                          <FileText className="w-8 h-8 text-[#7A553A] mb-2" />
                          <span className="text-xs font-bold text-[#183D2E] dark:text-white">
                            {selectedFile ? selectedFile.name : t('soilcard.drag_drop_text', { defaultValue: 'Select photo or drag PDF' })}
                          </span>
                          <span className="text-[10px] text-[#7A553A] dark:text-stone-400 mt-1">
                            PNG, JPG, WebP, or PDF (Camera capture supported on mobile)
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            capture="environment"
                            data-testid="soil-card-file-input"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>

                        {/* Error Alert */}
                        {uploadError && (
                          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        {/* Sample Card Presets */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-[#183D2E] dark:text-stone-200 block">
                            Quick Load Test Cards (One-Click Demo):
                          </span>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => loadSample(SAMPLE_ENGLISH)}
                              className="text-left text-xs bg-[#FAF8F5] dark:bg-stone-800 hover:bg-[#FEF6E9] dark:hover:bg-stone-700 border border-[#7A553A]/20 dark:border-stone-700 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E] dark:text-stone-200"
                            >
                              {t('soilcard.sample_a_btn', { defaultValue: 'Sample Card A (English - Warangal)' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => loadSample(SAMPLE_TELUGU)}
                              className="text-left text-xs bg-[#FAF8F5] dark:bg-stone-800 hover:bg-[#FEF6E9] dark:hover:bg-stone-700 border border-[#7A553A]/20 dark:border-stone-700 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E] dark:text-stone-200"
                            >
                              {t('soilcard.sample_b_btn', { defaultValue: 'Sample Card B (Telugu - Dharmasagar)' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => loadSample(SAMPLE_HINDI)}
                              className="text-left text-xs bg-[#FAF8F5] dark:bg-stone-800 hover:bg-[#FEF6E9] dark:hover:bg-stone-700 border border-[#7A553A]/20 dark:border-stone-700 p-2.5 rounded-xl transition-colors font-medium text-[#183D2E] dark:text-stone-200"
                            >
                              {t('soilcard.sample_c_btn', { defaultValue: 'Sample Card C (Hindi - Regional)' })}
                            </button>
                          </div>
                        </div>

                        {/* Transcript Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                            {t('soilcard.or_paste_text', { defaultValue: 'Or Paste Soil Card Text:' })}
                          </label>
                          <textarea
                            rows={3}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="e.g. Available Nitrogen: 280 kg/ha, pH: 7.2..."
                            className="w-full text-xs font-mono p-2.5 border border-[#7A553A]/30 dark:border-stone-700 dark:bg-stone-800 rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                          />
                        </div>

                        {/* Extract Button */}
                        <button
                          type="button"
                          onClick={handleExtract}
                          disabled={isExtracting || (!selectedFile && !rawText.trim())}
                          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#183D2E] hover:bg-[#265C46] disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                        >
                          {isExtracting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{t('soilcard.extracting_vision', { defaultValue: 'Reading soil values with AI vision...' })}</span>
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
                        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-4 space-y-2">
                          <span className="text-xs font-bold text-[#183D2E] dark:text-white block">Card Image Preview:</span>
                          <div className="max-h-60 overflow-hidden rounded-xl border border-[#7A553A]/15 flex items-center justify-center bg-[#FAF8F5] dark:bg-stone-800">
                            <img src={previewUrl} alt="Soil Card Preview" className="object-contain max-h-60 w-auto" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Confirmation Screen & Calibration */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-5 space-y-5">
                        <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-3">
                          <h3 className="text-sm font-bold text-[#183D2E] dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#DA9A4C]" />
                            <span>{t('soilcard.confirm_title', { defaultValue: 'Calibration & Nutrient Verification' })}</span>
                          </h3>
                          {extractionResult && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Parser Confidence: {Math.round(extractionResult.overall_confidence * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Confirmation Alert */}
                        <div className="bg-[#FEF6E9] dark:bg-amber-950/20 border-l-4 border-[#DA9A4C] p-3 rounded-r-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-[#DA9A4C] shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold text-[#183D2E] dark:text-amber-200">
                            {t('soilcard.confirm_guard_alert', { defaultValue: 'Please verify extracted numbers against your paper card before saving.' })}
                          </p>
                        </div>

                        {/* Editable Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Nitrogen */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_n', { defaultValue: 'Available Nitrogen (N)' })}
                              </label>
                              {getConfidenceBadge('nitrogen', extractionResult?.nitrogen)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={nitrogen}
                                onChange={(e) => setNitrogen(e.target.value)}
                                placeholder="e.g. 280.5"
                                className={`w-full min-h-[40px] text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-[#183D2E] dark:bg-stone-800 dark:text-white ${
                                  extractionResult && extractionResult.nitrogen.value === null
                                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                                    : 'border-[#7A553A]/30 dark:border-stone-700'
                                }`}
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">kg/ha</span>
                            </div>
                          </div>

                          {/* Phosphorus */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_p', { defaultValue: 'Available Phosphorus (P)' })}
                              </label>
                              {getConfidenceBadge('phosphorus', extractionResult?.phosphorus)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={phosphorus}
                                onChange={(e) => setPhosphorus(e.target.value)}
                                placeholder="e.g. 18.2"
                                className={`w-full min-h-[40px] text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-[#183D2E] dark:bg-stone-800 dark:text-white ${
                                  extractionResult && extractionResult.phosphorus.value === null
                                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                                    : 'border-[#7A553A]/30 dark:border-stone-700'
                                }`}
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">kg/ha</span>
                            </div>
                          </div>

                          {/* Potassium */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_k', { defaultValue: 'Available Potassium (K)' })}
                              </label>
                              {getConfidenceBadge('potassium', extractionResult?.potassium)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={potassium}
                                onChange={(e) => setPotassium(e.target.value)}
                                placeholder="e.g. 310.0"
                                className={`w-full min-h-[40px] text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-[#183D2E] dark:bg-stone-800 dark:text-white ${
                                  extractionResult && extractionResult.potassium.value === null
                                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                                    : 'border-[#7A553A]/30 dark:border-stone-700'
                                }`}
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">kg/ha</span>
                            </div>
                          </div>

                          {/* pH */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_ph', { defaultValue: 'Soil Reaction (pH)' })}
                              </label>
                              {getConfidenceBadge('ph', extractionResult?.ph)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={ph}
                                onChange={(e) => setPh(e.target.value)}
                                placeholder="e.g. 7.2"
                                className={`w-full min-h-[40px] text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-[#183D2E] dark:bg-stone-800 dark:text-white ${
                                  extractionResult && extractionResult.ph.value === null
                                    ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                                    : 'border-[#7A553A]/30 dark:border-stone-700'
                                }`}
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">pH (0-14)</span>
                            </div>
                          </div>

                          {/* Organic Carbon */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_oc', { defaultValue: 'Organic Carbon (OC)' })}
                              </label>
                              {getConfidenceBadge('organic_carbon', extractionResult?.organic_carbon)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={organicCarbon}
                                onChange={(e) => setOrganicCarbon(e.target.value)}
                                placeholder="e.g. 0.54"
                                className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">%</span>
                            </div>
                          </div>

                          {/* Electrical Conductivity */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                                {t('soilcard.field_ec', { defaultValue: 'Electrical Conductivity (EC)' })}
                              </label>
                              {getConfidenceBadge('electrical_conductivity', extractionResult?.electrical_conductivity)}
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={ec}
                                onChange={(e) => setEc(e.target.value)}
                                placeholder="e.g. 0.42"
                                className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-[#7A553A] dark:text-stone-400 font-medium">dS/m</span>
                            </div>
                          </div>
                        </div>

                        {/* Soil Texture & Test Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                              {t('soilcard.field_texture', { defaultValue: 'Soil Texture' })}
                            </label>
                            <select
                              value={soilTexture}
                              onChange={(e) => setSoilTexture(e.target.value)}
                              className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl bg-white focus:ring-2 focus:ring-[#183D2E]"
                            >
                              <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                              <option value="Black Cotton">Black Cotton Soil (Regur)</option>
                              <option value="Red Sandy Loam">Red Sandy Loam</option>
                              <option value="Alluvial Loam">Alluvial Loam</option>
                              <option value="Clay">Heavy Clay</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#183D2E] dark:text-stone-200">
                              {t('soilcard.test_date_label', { defaultValue: 'Test Date' })}
                            </label>
                            <input
                              type="date"
                              value={testDate}
                              onChange={(e) => setTestDate(e.target.value)}
                              className="w-full min-h-[40px] text-xs p-2.5 border border-[#7A553A]/30 dark:border-stone-700 dark:bg-stone-800 dark:text-white rounded-xl focus:ring-2 focus:ring-[#183D2E]"
                            />
                          </div>
                        </div>

                        {/* Privacy Opt-In Toggle */}
                        <div className="bg-[#FAF8F5] dark:bg-stone-800 border border-[#7A553A]/20 dark:border-stone-700 rounded-xl p-3.5 space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={storeImageOptIn}
                              onChange={(e) => setStoreImageOptIn(e.target.checked)}
                              className="w-4 h-4 text-[#183D2E] rounded border-gray-300 focus:ring-[#183D2E]"
                            />
                            <span className="text-xs font-bold text-[#183D2E] dark:text-white flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-[#DA9A4C]" />
                              {t('soilcard.privacy_toggle', { defaultValue: 'Opt-in: Securely save thumbnail for future audit' })}
                            </span>
                          </label>
                          <p className="text-[11px] text-[#7A553A] dark:text-stone-400 pl-6 leading-relaxed">
                            {t('soilcard.privacy_note', { defaultValue: 'By default, images are processed in-memory and immediately discarded.' })}
                          </p>
                        </div>

                        {/* Confirmation Success Message */}
                        {confirmSuccessMsg && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{confirmSuccessMsg}</span>
                          </div>
                        )}

                        {/* Confirm Button */}
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={isConfirming || isSaving || (!nitrogen && !ph && !phosphorus && !potassium)}
                          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#183D2E] hover:bg-[#265C46] disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
                        >
                          {isConfirming || isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{t('soilcard.confirming', { defaultValue: 'Saving to Farm Profile...' })}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#DA9A4C]" />
                              <span>{t('soilcard.confirm_save_farm', { defaultValue: 'Confirm and save to this farm' })}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGRONOMIC IMPACT SHIFT */}
          {activeTab === 'impact' && (
            <div className="space-y-6">
              {impactData ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7A553A]/15 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#183D2E] dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#DA9A4C]" />
                        <span>{t('soilcard.impact_title', { defaultValue: 'Agronomic Shift Evaluation' })}</span>
                      </h3>
                      <p className="text-xs text-[#7A553A] dark:text-stone-400 mt-0.5">
                        {t('soilcard.impact_subtitle', { defaultValue: 'Evaluates model accuracy changes with real soil card measurements.' })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      impactData.has_confirmed_soil_card
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}>
                      {impactData.has_confirmed_soil_card
                        ? 'Confirmed Soil Card Active'
                        : 'Weather-Only Mode'}
                    </span>
                  </div>

                  {/* Impact Highlights */}
                  <div className="bg-[#FEF6E9] dark:bg-amber-950/20 border border-[#DA9A4C] rounded-2xl p-4 space-y-2">
                    <span className="text-xs font-bold text-[#183D2E] dark:text-amber-300 uppercase tracking-wider block">
                      Agronomic Shift Summary:
                    </span>
                    <ul className="space-y-1.5">
                      {impactData.impact_summary.map((summary, idx) => (
                        <li key={idx} className="text-xs text-[#183D2E] dark:text-stone-200 font-medium flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before */}
                    <div className="bg-[#FAF8F5] dark:bg-stone-850 border border-[#7A553A]/20 dark:border-stone-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7A553A] dark:text-stone-400 uppercase tracking-wider">
                          {t('soilcard.before_title', { defaultValue: 'Before (Weather Only)' })}
                        </span>
                        <span className="text-[11px] font-semibold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-full">
                          {t('soilcard.weather_only_model', { defaultValue: 'Baseline Average' })}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.confidence_label', { defaultValue: 'Confidence Score' })}</span>
                          {impactData.without_soil_card.confidence !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-2.5 rounded-full"
                                  style={{ width: `${Math.round(impactData.without_soil_card.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-[#183D2E] dark:text-white">
                                {Math.round(impactData.without_soil_card.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic block mt-1">Not Available</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.top_crops_label', { defaultValue: 'Top Suitable Crops' })}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {impactData.without_soil_card.top_crops.map((c, i) => (
                              <span key={i} className="font-medium bg-white dark:bg-stone-800 border border-[#7A553A]/20 dark:border-stone-700 text-[#183D2E] dark:text-stone-200 px-2 py-1 rounded-lg">
                                {c.crop_name} ({Math.round(c.probability * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.expected_yield_label', { defaultValue: 'Baseline Yield' })}</span>
                          <p className="text-sm font-bold text-[#183D2E] dark:text-white mt-0.5">
                            {impactData.without_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="bg-gradient-to-br from-[#FEF6E9] to-white dark:from-stone-900 dark:to-stone-850 border-2 border-[#183D2E] dark:border-emerald-600 rounded-2xl p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#183D2E] dark:text-emerald-400 uppercase tracking-wider">
                          {t('soilcard.after_title', { defaultValue: 'After (Confirmed Soil Card)' })}
                        </span>
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2.5 py-0.5 rounded-full">
                          {t('soilcard.full_soil_model', { defaultValue: 'Full 7-Feature Model' })}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.confidence_label', { defaultValue: 'Confidence Score' })}</span>
                          {impactData.with_soil_card.confidence !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-stone-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-2.5 rounded-full"
                                  style={{ width: `${Math.round(impactData.with_soil_card.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-emerald-800 dark:text-emerald-400">
                                {Math.round(impactData.with_soil_card.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic block mt-1">Not Available</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.top_crops_label', { defaultValue: 'Precision Crops' })}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {impactData.with_soil_card.top_crops.map((c, i) => (
                              <span key={i} className="font-bold bg-white dark:bg-stone-800 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 px-2 py-1 rounded-lg shadow-xs">
                                {c.crop_name} ({Math.round(c.probability * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[#7A553A] dark:text-stone-400 block">{t('soilcard.expected_yield_label', { defaultValue: 'Historical ML Yield' })}</span>
                          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400 mt-0.5">
                            {impactData.with_soil_card.expected_yield_q_acre ?? 'N/A'} quintals/acre
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {impactData.integration_scope_note && (
                    <div className="bg-[#FAF8F5] dark:bg-stone-850 border border-[#DA9A4C] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#183D2E] dark:text-stone-200">
                      <Info className="w-4 h-4 text-[#DA9A4C] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Pipeline Scope Limitation (Partial Integration):</span>
                        <p className="text-[#4E5F57] dark:text-stone-400 leading-relaxed">
                          {impactData.integration_scope_note}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#7A553A]/15 text-[11px] text-[#7A553A] dark:text-stone-400 italic">
                    <strong>{t('soilcard.disclaimer_label', { defaultValue: 'Disclaimer' })}:</strong> {impactData.disclaimer}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7A553A] dark:text-stone-400 text-center py-8">Loading soil impact analysis...</p>
              )}
            </div>
          )}

          {/* TAB 3: WELFARE SCHEMES (PLANNED, DETAILS TO VERIFY) */}
          {activeTab === 'schemes' && (
            <div className="space-y-6">
              <div className="p-5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 dark:text-amber-200">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#183D2E] dark:text-white">
                      Welfare Schemes Directory (Planned Feature)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300">
                      Details to Verify
                    </span>
                  </div>
                  <p className="text-[#4E5F57] dark:text-stone-300 leading-relaxed">
                    Agricultural schemes and subsidy registries were not merged into this branch and are not listed as an active feature. Grow2Gain is an independent decision-support tool. It does not provide financial grants, disburse government funds, or certify scheme eligibility.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF8F5] dark:bg-stone-850 rounded-2xl border border-[#7A553A]/20 dark:border-stone-800 p-6 space-y-4">
                <h4 className="font-display text-base font-bold text-[#183D2E] dark:text-white">
                  How to Verify Agricultural Schemes & Subsidies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-[#7A553A]/15 space-y-1.5">
                    <span className="font-bold text-[#183D2E] dark:text-white block">1. Local Krishi Vigyan Kendra (KVK)</span>
                    <p className="text-[#4E5F57] dark:text-stone-300 leading-relaxed">
                      Visit your district KVK or Agriculture Extension Center for current operational guidelines on input subsidies, seeds, and soil testing.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-[#7A553A]/15 space-y-1.5">
                    <span className="font-bold text-[#183D2E] dark:text-white block">2. Mandal Agriculture Officer (MAO)</span>
                    <p className="text-[#4E5F57] dark:text-stone-300 leading-relaxed">
                      Consult your local MAO or Village Revenue Officer for land-holding eligibility requirements and official application windows.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[#7A553A] dark:text-stone-400 italic pt-2 border-t border-[#7A553A]/15">
                  Notice: Specific scheme amounts, subsidy percentages, and portal links are omitted until officially validated by backend services.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY & DPDP COMPLIANCE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#183D2E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#DA9A4C]" />
                <span>{t('soilcard.placeholders_admin_title', { defaultValue: 'Data Governance & Farmer Privacy Protection' })}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#4E5F57] dark:text-stone-300">
                <div className="bg-[#FAF8F5] dark:bg-stone-850 p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] dark:text-white block">Admin Console & Moderation</span>
                  <p className="text-[11px] leading-relaxed">System moderation for community posts, marketplace listing verification, and flagged content.</p>
                </div>
                <div className="bg-[#FAF8F5] dark:bg-stone-850 p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] dark:text-white block">Consent Audit Log</span>
                  <p className="text-[11px] leading-relaxed">DPDP compliance log for farmer data consent, exportable records, and immediate right-to-be-forgotten deletion.</p>
                </div>
                <div className="bg-[#FAF8F5] dark:bg-stone-850 p-4 rounded-2xl border border-[#7A553A]/20 space-y-1.5">
                  <span className="font-bold text-[#183D2E] dark:text-white block">Privacy & Zero-Retention</span>
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
