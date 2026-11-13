import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Volume2,
  Info,
  Leaf,
  CloudRain,
  MapPin,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

import { useTranslation } from '../context/LanguageContext';
import { predictPlantDisease, getSupportedCrops, getDiseaseHistory } from '../api/disease';
import { validateImageFile, compressImage } from '../utils/imageCompressor';
import { farmsApi } from '../api/farms';
import {
  DiseasePredictionResponse,
  SupportedCropsResponse,
  DiseaseHistoryItem,
  Farm,
  CurrentCropCycle,
} from '../types/api';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';

export const DiseasePage: React.FC = () => {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
  const [cropHint, setCropHint] = useState<string>('');
  const [reportToOutbreak, setReportToOutbreak] = useState<boolean>(false);
  const [speechSpeaking, setSpeechSpeaking] = useState<boolean>(false);
  const [showSupportedModal, setShowSupportedModal] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Image gate validation and borderline states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [borderlineWarning, setBorderlineWarning] = useState<{
    message: string;
    confidence: number;
    top_class?: string;
  } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Queries
  const { data: supportedData } = useQuery<SupportedCropsResponse>({
    queryKey: ['supportedCrops'],
    queryFn: getSupportedCrops,
  });

  const { data: farms = [] } = useQuery<Farm[]>({
    queryKey: ['farms'],
    queryFn: farmsApi.getFarms,
  });

  useEffect(() => {
    if (farms && farms.length > 0 && selectedFarmId === undefined) {
      setSelectedFarmId(farms[0].id);
      const activeCycle = farms[0].current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropHint(activeCycle.crop_name);
      }
    }
  }, [farms, selectedFarmId]);

  const { data: history = [] } = useQuery<DiseaseHistoryItem[]>({
    queryKey: ['diseaseHistory'],
    queryFn: getDiseaseHistory,
  });

  // Mutation for diagnosis
  const diagnoseMutation = useMutation({
    mutationFn: async (confirmOverride?: boolean) => {
      if (!selectedFile) throw new Error('No file selected');
      const compressed = await compressImage(selectedFile);
      const formData = new FormData();
      formData.append('file', compressed);
      if (cropHint.trim()) {
        formData.append('crop_hint', cropHint.trim());
      }
      if (selectedFarmId !== undefined) {
        formData.append('farm_id', String(selectedFarmId));
      }
      formData.append('report_to_outbreak', String(reportToOutbreak));
      formData.append('confirmed', String(confirmOverride ?? isConfirmed));
      formData.append('language', language);
      return predictPlantDisease(formData);
    },
    onSuccess: (data) => {
      setBorderlineWarning(null);
      if (data.reported_to_outbreak) {
        queryClient.invalidateQueries({ queryKey: ['diseaseHistory'] });
      }
    },
    onError: (err: any) => {
      if (err.status === 422 && err.detailPayload?.borderline) {
        setBorderlineWarning({
          message: err.message,
          confidence: err.detailPayload.confidence,
          top_class: err.detailPayload.top_class,
        });
      } else {
        setBorderlineWarning(null);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const val = validateImageFile(file);
      if (!val.valid) {
        setValidationError(val.errorMessage || 'Invalid image file.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setValidationError(null);
      setBorderlineWarning(null);
      setIsConfirmed(false);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      diagnoseMutation.reset();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const val = validateImageFile(file);
      if (!val.valid) {
        setValidationError(val.errorMessage || 'Invalid image file.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setValidationError(null);
      setBorderlineWarning(null);
      setIsConfirmed(false);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      diagnoseMutation.reset();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setBorderlineWarning(null);
    setIsConfirmed(false);
    diagnoseMutation.reset();
  };

  const handleFarmSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedFarmId(undefined);
    } else {
      const farmId = parseInt(val, 10);
      setSelectedFarmId(farmId);
      const farm = (farms as Farm[]).find((f: Farm) => f.id === farmId);
      const activeCycle = farm?.current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropHint(activeCycle.crop_name);
      }
    }
  };

  // TTS Read-aloud trigger
  const handleReadAloud = (res: DiseasePredictionResponse) => {
    setVoiceNotice(null);
    if (!('speechSynthesis' in window)) {
      setVoiceNotice(t('disease.speech_not_supported'));
      return;
    }

    if (speechSpeaking) {
      window.speechSynthesis.cancel();
      setSpeechSpeaking(false);
      return;
    }

    const langPrefix = language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en';
    const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const matchedVoice = currentVoices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
    );

    if (currentVoices.length > 0 && !matchedVoice) {
      const langLabel = language === 'te' ? 'Telugu (తెలుగు)' : language === 'hi' ? 'Hindi (हिंदी)' : 'English';
      setVoiceNotice(t('disease.no_voice_for_language', { lang: langLabel }));
      return;
    }

    const textToRead =
      language === 'te'
        ? `గుర్తించిన తెగులు: ${res.predicted_disease}. పంట: ${res.predicted_crop}. అంచనా ఖచ్చితత్వం: ${Math.round((res.prediction_confidence || 0) * 100)} శాతం. సిఫార్సు చేయబడిన సేంద్రీయ పద్ధతులు: ${res.safe_ipm_steps.slice(0, 2).join('. ')}`
        : language === 'hi'
        ? `पहचाना गया रोग: ${res.predicted_disease}. फसल: ${res.predicted_crop}. अनुमानित विश्वास: ${Math.round((res.prediction_confidence || 0) * 100)} प्रतिशत. सुरक्षित उपाय: ${res.safe_ipm_steps.slice(0, 2).join('. ')}`
        : `Identified condition: ${res.predicted_disease} on ${res.predicted_crop}. Prediction confidence: ${Math.round((res.prediction_confidence || 0) * 100)} percent. Key management step: ${res.safe_ipm_steps[0] || t('disease.consult_officer')}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = langCode;
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.rate = 0.95;
    utterance.onend = () => setSpeechSpeaking(false);
    utterance.onerror = () => setSpeechSpeaking(false);

    setSpeechSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const result = diagnoseMutation.data;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Supported Crops Pill */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-agri-cream-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-agri-green-100 text-agri-green-800 border border-agri-green-200">
                <Leaf className="w-3.5 h-3.5 text-agri-green-700" />
                {t('disease.badge_tier1')}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-agri-gold-100 text-agri-gold-900 border border-agri-gold-200">
                {t('disease.badge_classes')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-agri-green-900">
              {t('disease.title')}
            </h1>
            <p className="text-sm text-agri-green-700/80 mt-1 max-w-2xl">
              {t('disease.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowSupportedModal(!showSupportedModal)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-agri-cream-100 hover:bg-agri-cream-200 text-agri-green-900 text-xs font-bold transition-all border border-agri-cream-300 shadow-subtle shrink-0"
          >
            <Info className="w-4 h-4 text-agri-green-700" />
            <span>{t('disease.supported_crops_title')} (14)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSupportedModal ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Supported Crops Card */}
        {showSupportedModal && (
          <div className="mt-6 pt-5 border-t border-agri-cream-200">
            <div className="bg-agri-cream-50 rounded-2xl p-4 sm:p-5 border border-agri-cream-300">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-agri-green-700 mt-0.5 shrink-0" />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-agri-green-900">
                      {t('disease.supported_crops_title')}
                    </h3>
                    <p className="text-xs text-agri-green-800/80 mt-0.5">
                      {t('disease.supported_crops_desc')}
                    </p>
                  </div>

                  {/* Badges for 14 supported crops */}
                  <div className="flex flex-wrap gap-1.5">
                    {supportedData?.supported_crops.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-agri-green-800 border border-agri-green-200 shadow-subtle"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Warning on common crops outside benchmark */}
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xs text-amber-900 font-semibold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      {t('disease.unsupported_warning_title')}: Cotton, Chilli, Rice, Wheat
                    </p>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      {supportedData?.note}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Grid: Upload & Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Upload & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-agri-cream-200 space-y-5">
            <h2 className="text-lg font-display font-bold text-agri-green-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-agri-green-700" />
              {t('disease.upload_heading')}
            </h2>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Drag & Drop Zone */}
            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-agri-cream-300 hover:border-agri-green-500 rounded-3xl p-6 sm:p-8 text-center cursor-pointer bg-agri-cream-50/50 hover:bg-agri-green-50/40 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-subtle flex items-center justify-center text-agri-green-700 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-agri-green-900">
                    {t('disease.drag_drop_text')}
                  </p>
                  <p className="text-[11px] text-agri-green-600 mt-1">
                    {t('disease.format_hint')}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-agri-green-800 text-white text-xs font-bold hover:bg-agri-green-900 shadow-subtle transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {t('disease.camera_btn')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-agri-cream-300 shadow-subtle aspect-video bg-neutral-900 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Specimen Leaf Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-xl bg-black/60 text-white text-[11px] font-bold backdrop-blur-md hover:bg-black/80"
                    >
                      {t('disease.change_photo')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="px-2.5 py-1 rounded-xl bg-red-600/80 text-white text-[11px] font-bold backdrop-blur-md hover:bg-red-700"
                    >
                      {t('disease.remove_photo')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Farm Selector (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-green-900 block">
                {t('disease.select_farm_label')}
              </label>
              <select
                value={selectedFarmId || ''}
                onChange={handleFarmSelect}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-agri-cream-300 bg-white text-xs text-agri-green-900 font-medium focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
              >
                <option value="">{t('disease.no_farm_selected')}</option>
                {farms.map((f: Farm) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.village}, {f.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Hint Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-green-900 block">
                {t('disease.crop_hint_label')}
              </label>
              <input
                type="text"
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                placeholder={t('disease.crop_hint_placeholder')}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-agri-cream-300 bg-white text-xs text-agri-green-900 font-medium focus:ring-2 focus:ring-agri-green-600 focus:outline-none"
              />
            </div>

            {/* Outbreak Opt-in Checkbox (unticked by default) */}
            <div className="bg-agri-cream-50 rounded-2xl p-3.5 border border-agri-cream-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportToOutbreak}
                  onChange={(e) => setReportToOutbreak(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-agri-green-700 focus:ring-agri-green-600 border-agri-cream-300 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-agri-green-900 block">
                    {t('disease.opt_in_outbreak_label')}
                  </span>
                  <span className="text-[11px] text-agri-green-700 leading-tight block">
                    {t('disease.opt_in_outbreak_hint')}
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!selectedFile || diagnoseMutation.isPending}
              onClick={() => diagnoseMutation.mutate()}
              className="w-full py-3.5 px-6 rounded-2xl bg-agri-green-800 hover:bg-agri-green-900 text-white font-bold text-sm shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {diagnoseMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('disease.diagnosing_btn')}</span>
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 text-agri-gold-400" />
                  <span>{t('disease.diagnose_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnosis Advisory & Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Client-side File Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-300 text-red-900 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Invalid File</h4>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">{validationError}</p>
              </div>
            </div>
          )}

          {/* Borderline Domain Gate Warning with Confirm-to-Continue */}
          {borderlineWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Borderline Agricultural Confidence ({Math.round(borderlineWarning.confidence * 100)}%)
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">{borderlineWarning.message}</p>
                  <p className="text-[11px] text-amber-700 italic mt-1">
                    Visual indication only, not a soil moisture measurement. Please confirm to proceed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmed(true);
                    diagnoseMutation.mutate(true);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  Confirm and Continue
                </button>
              </div>
            </div>
          )}

          {/* Authoritative Domain Gate Rejection (HTTP 422) */}
          {diagnoseMutation.isError && !borderlineWarning && (
            <div className="bg-red-50 border border-red-300 text-red-900 rounded-2xl p-6 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Image Gate Verification Rejected</h4>
                <p className="text-xs text-red-800 mt-1 font-medium leading-relaxed">
                  {diagnoseMutation.error instanceof Error ? diagnoseMutation.error.message : 'Upload rejected.'}
                </p>
                <p className="text-[11px] text-red-700 mt-1">
                  Non-agricultural photo detected. No diagnosis generated.
                </p>
              </div>
            </div>
          )}

          {/* Initial Empty / Idle State */}
          {!result && !diagnoseMutation.isPending && !diagnoseMutation.isError && !validationError && !borderlineWarning && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-card border border-agri-cream-200 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-16 h-16 rounded-3xl bg-agri-cream-100 flex items-center justify-center text-agri-green-700 mb-4 shadow-subtle">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-display font-bold text-agri-green-900">
                {t('disease.ready_title')}
              </h3>
              <p className="text-xs text-agri-green-700/80 max-w-sm mt-1 leading-relaxed">
                {t('disease.ready_desc')}
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {diagnoseMutation.isPending && (
            <div className="bg-white rounded-3xl p-8 shadow-card border border-agri-cream-200 space-y-5 animate-pulse min-h-[380px]">
              <div className="h-6 w-1/3 bg-agri-cream-200 rounded-xl" />
              <div className="h-20 w-full bg-agri-cream-100 rounded-2xl" />
              <div className="h-4 w-1/2 bg-agri-cream-200 rounded-xl" />
              <div className="space-y-2 pt-4">
                <div className="h-4 w-full bg-agri-cream-100 rounded-xl" />
                <div className="h-4 w-4/5 bg-agri-cream-100 rounded-xl" />
                <div className="h-4 w-3/4 bg-agri-cream-100 rounded-xl" />
              </div>
            </div>
          )}

          {/* Case 1: Quality Gate Rejected */}
          {result && !result.success && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-red-200 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-red-900">
                    {t('disease.quality_gate_failed')}
                  </h3>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    {result.error || result.quality_gate?.reason}
                  </p>
                </div>
              </div>

              {/* Quality Metrics breakdown */}
              {result.quality_gate?.metrics && (
                <div className="bg-red-50/60 rounded-2xl p-4 border border-red-200 space-y-2 text-xs">
                  <p className="font-bold text-red-900 text-[11px] uppercase tracking-wider">
                    {t('disease.diagnostic_checks')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-white rounded-xl p-2.5 border border-red-100">
                      <span className="text-neutral-500 block">{t('disease.sharpness_metric')}</span>
                      <span className="font-bold text-neutral-800">
                        {result.quality_gate.metrics.sharpness_laplacian_var ?? 'N/A'} ({t('disease.min_label')} 60)
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-red-100">
                      <span className="text-neutral-500 block">{t('disease.luminance_metric')}</span>
                      <span className="font-bold text-neutral-800">
                        {result.quality_gate.metrics.mean_luminance ?? 'N/A'} (20–240)
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-red-100">
                      <span className="text-neutral-500 block">{t('disease.foliar_chromaticity_metric')}</span>
                      <span className="font-bold text-neutral-800">
                        {result.quality_gate.metrics.foliar_ratio ?? 'N/A'} ({t('disease.min_label')} 0.20)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 space-y-1">
                <p className="font-bold text-neutral-900">{t('disease.photo_tips_title')}</p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 text-neutral-600">
                  <li>{t('disease.photo_tip_1')}</li>
                  <li>{t('disease.photo_tip_2')}</li>
                  <li>{t('disease.photo_tip_3')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Case 2: Diagnosis Succeeded */}
          {result && result.success && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-agri-cream-200 space-y-6">
              {/* Result Header & Audio read-aloud */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-agri-cream-200">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-agri-green-100 text-agri-green-800 border border-agri-green-200">
                      <CheckCircle2 className="w-3 h-3 text-agri-green-700" />
                      {result.predicted_crop}
                    </span>
                    {result.reported_to_outbreak && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        {t('disease.outbreak_logged')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-agri-green-900">
                    {result.predicted_disease}
                  </h3>
                  <p className="text-xs text-agri-green-700 font-medium mt-0.5">
                    {t('disease.benchmark_class')} <span className="font-mono text-[11px]">{result.predicted_class}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReadAloud(result)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      speechSpeaking
                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                        : 'bg-agri-cream-100 hover:bg-agri-cream-200 text-agri-green-900 border-agri-cream-300'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 text-agri-green-700" />
                    <span>{speechSpeaking ? t('disease.stop_audio') : t('disease.read_aloud')}</span>
                  </button>
                </div>
              </div>

              {/* Voice Notice (e.g. if speech synthesis voice is missing) */}
              {voiceNotice && (
                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{voiceNotice}</p>
                </div>
              )}

              {/* Confidence Meter (Explicitly Uncalibrated) */}
              <div className="bg-agri-cream-50/70 rounded-2xl p-4 border border-agri-cream-300 space-y-2">
                <ConfidenceMeter
                  value={result.prediction_confidence || 0}
                  type="prediction_confidence"
                  showLabel={true}
                />
              </div>

              {/* Warning Banners */}
              {/* Low confidence / uncertain notice */}
              {result.is_uncertain && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 leading-relaxed space-y-1">
                    <p className="font-bold">{t('disease.inconclusive_warning_title')}</p>
                    <p>{t('disease.uncertain_warning')}</p>
                  </div>
                </div>
              )}

              {/* Warnings list from backend (e.g. crop mismatch, PlantVillage lab context) */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="space-y-2">
                  {result.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200 text-xs text-neutral-800 flex items-start gap-2.5"
                    >
                      <Info className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Top 3 Ranking Bars */}
              {result.top3_predictions && result.top3_predictions.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-agri-green-800">
                    {t('disease.top3_ranking')}
                  </h4>
                  <div className="space-y-2">
                    {result.top3_predictions.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-3 border border-agri-cream-200 space-y-1 shadow-subtle"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-agri-green-900">
                            {idx + 1}. {p.crop} — {p.disease_name}
                          </span>
                          <span className="font-mono font-bold text-agri-green-800">
                            {(p.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-agri-cream-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-agri-green-600' : 'bg-agri-gold-500'
                            }`}
                            style={{ width: `${Math.min(100, p.probability * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Characteristic Symptoms */}
              {result.symptoms && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-agri-green-800">
                    {t('disease.symptoms_heading')}
                  </h4>
                  <div className="bg-agri-cream-50/60 rounded-2xl p-4 border border-agri-cream-200 text-xs text-agri-green-900 leading-relaxed">
                    {result.symptoms}
                  </div>
                </div>
              )}

              {/* Safe Cultural & Organic IPM Practices */}
              {result.safe_ipm_steps && result.safe_ipm_steps.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-agri-green-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-agri-green-700" />
                      {t('disease.ipm_heading')}
                    </h4>
                    <span className="text-[10px] font-semibold text-agri-green-700 bg-agri-green-50 px-2 py-0.5 rounded-full border border-agri-green-200">
                      {t('disease.zero_chemical_dosages')}
                    </span>
                  </div>

                  <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
                    {result.safe_ipm_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                    <p className="text-[11px] text-emerald-800/80 pt-2 border-t border-emerald-200/60 italic">
                      {t('disease.ipm_disclaimer')}
                    </p>
                  </div>
                </div>
              )}

              {/* Weather Fungal Risk Factor (if farm was selected) */}
              {result.weather_fungal_risk && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-agri-green-800 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-agri-green-700" />
                    {t('disease.weather_fungal_title')}
                  </h4>
                  <div
                    className={`rounded-2xl p-4 border text-xs leading-relaxed ${
                      result.weather_fungal_risk.elevated
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-agri-cream-50 border-agri-cream-200 text-agri-green-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          result.weather_fungal_risk.elevated
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-agri-green-100 text-agri-green-800'
                        }`}
                      >
                        {result.weather_fungal_risk.elevated ? t('disease.elevated_spore_risk') : t('disease.low_atmospheric_risk')}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {t('disease.indicative_microclimate')}
                      </span>
                    </div>
                    <p>{result.weather_fungal_risk.explanation}</p>
                  </div>
                </div>
              )}

              {/* Citations & Scheme tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {result.sources && result.sources.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      {t('disease.sources_heading')}
                    </h5>
                    <div className="space-y-1">
                      {result.sources.map((s, idx) =>
                        s.url && s.url.startsWith('http') ? (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-xs text-agri-green-800 hover:text-agri-green-950 bg-neutral-50 hover:bg-neutral-100 p-2 rounded-xl border border-neutral-200 transition-colors"
                          >
                            <span className="truncate pr-1">{s.title || s.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                          </a>
                        ) : (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-stone-700 bg-neutral-50 p-2 rounded-xl border border-neutral-200"
                          >
                            <span className="truncate pr-1">{s.title || s.name}</span>
                            <span className="text-[10px] text-amber-700 font-semibold px-1.5 py-0.5 rounded bg-amber-100">to verify</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {result.scheme_tags && result.scheme_tags.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      {t('disease.schemes_heading')}
                    </h5>
                    <div className="space-y-1">
                      {result.scheme_tags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-agri-green-800 bg-neutral-50 p-2 rounded-xl border border-neutral-200"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Community Outbreak Contributions Drawer / History */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-agri-cream-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-display font-bold text-agri-green-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-agri-green-700" />
              {t('disease.history_title')}
            </h3>
            <span className="text-xs text-neutral-500 font-medium">
              {t('disease.anonymized_centroids')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((h: DiseaseHistoryItem) => (
              <div
                key={h.id}
                className="bg-agri-cream-50/70 rounded-2xl p-3.5 border border-agri-cream-300 space-y-1.5 shadow-subtle text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-agri-green-900 truncate pr-1">
                    {h.predicted_disease}
                  </span>
                  <span className="font-mono text-[11px] text-agri-green-700 font-semibold shrink-0">
                    {Math.round(h.confidence * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-agri-green-600 shrink-0" />
                  {h.village}, {h.district}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {new Date(h.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default DiseasePage;
