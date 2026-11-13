import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Camera,
  AlertTriangle,
  ShieldCheck,
  Info,
  Leaf,
  CloudRain,
  MapPin,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  History,
} from 'lucide-react';

import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { predictPlantDisease, getSupportedCrops, getDiseaseHistory } from '../api/disease';
import { validateImageFile, compressImage } from '../utils/imageCompressor';
import {
  SupportedCropsResponse,
  DiseaseHistoryItem,
  Farm,
  CurrentCropCycle,
} from '../types/api';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { LeafScanIllustration } from '../components/common/FarmerIllustrations';

export const DiseasePage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { activeFarm, activeFarmId, setActiveFarmId, farms } = useAuth();
  const [cropHint, setCropHint] = useState<string>('');
  const [reportToOutbreak, setReportToOutbreak] = useState<boolean>(false);
  const [showSupportedModal, setShowSupportedModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ipm' | 'diagnostic' | 'sources' | 'crops' | 'history'>('ipm');

  // Image gate validation and borderline states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [borderlineWarning, setBorderlineWarning] = useState<{
    message: string;
    confidence: number;
    top_class?: string;
  } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // Queries
  const { data: supportedData } = useQuery<SupportedCropsResponse>({
    queryKey: ['supportedCrops'],
    queryFn: getSupportedCrops,
  });

  // Synchronize crop hint with active farm
  useEffect(() => {
    if (activeFarm) {
      const activeCycle = activeFarm.current_crop_cycles?.find((c: CurrentCropCycle) => c.is_active);
      if (activeCycle) {
        setCropHint(activeCycle.crop_name);
      }
    }
  }, [activeFarm]);

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
      if (activeFarmId !== null && activeFarmId !== undefined) {
        formData.append('farm_id', String(activeFarmId));
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
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
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
      setActiveFarmId(null);
    } else {
      const farmId = parseInt(val, 10);
      setActiveFarmId(farmId);
    }
  };

  const result = diagnoseMutation.data;

  // PICTORIAL MODE
  if (isPictorial) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={Leaf}
          title={language === 'te' ? 'ఆకు తెగుళ్ల గుర్తింపు' : language === 'hi' ? 'पत्ती रोग की जांच' : 'Plant Disease Doctor'}
          purpose={language === 'te' ? 'ఆకు ఫోటో తీసి తెగులును సులభంగా తెలుసుకోండి' : language === 'hi' ? 'पत्ती की फोटो खींचकर रोग की पहचान करें' : 'Visual leaf photo diagnosis with zero-chemical organic advice.'}
        />

        <div className="bg-gradient-to-br from-[#FEF6E9] to-[#FAF8F5] rounded-3xl border-2 border-[#DA9A4C] p-6 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="flex justify-center">
            <LeafScanIllustration className="w-48 h-36 drop-shadow-sm" />
          </div>

          <h2 className="text-2xl font-bold font-display text-[#183D2E]">
            {language === 'te' ? 'ఆకు ఫోటో తీయండి' : language === 'hi' ? 'रोगग्रस्त पत्ती का फोटो लें' : 'Take a Leaf Photo'}
          </h2>

          <p className="text-base text-[#4E5F57]">
            {language === 'te'
              ? 'మచ్చలు లేదా తెగులు ఉన్న ఆకును స్పష్టంగా ఫోటో తీయండి'
              : language === 'hi'
              ? 'जिस पत्ती पर धब्बे या रोग हों, उसका साफ फोटो खींचें'
              : 'Hold camera steady on the leaf showing spots or disease symptoms.'}
          </p>

          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center justify-center gap-3 text-lg shadow-md active:scale-95 transition-all"
            >
              <Camera className="w-6 h-6 text-[#DA9A4C]" />
              <span>{language === 'te' ? 'కెమెరా తెరవండి' : language === 'hi' ? 'कैमरा खोलें' : 'Open Camera'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#FAF8F5] text-[#183D2E] border-2 border-[#183D2E]/30 hover:bg-[#EFE7DE] flex items-center justify-center gap-3 text-lg shadow-sm active:scale-95 transition-all"
            >
              <Upload className="w-6 h-6 text-[#183D2E]" />
              <span>{language === 'te' ? 'ఫోటో ఎంచుకోండి' : language === 'hi' ? 'फोटो चुनें' : 'Choose Photo'}</span>
            </button>
          </div>

          {previewUrl && (
            <div className="pt-4 border-t border-[#7A553A]/20 space-y-3">
              <img
                src={previewUrl}
                alt="Leaf Preview"
                className="w-40 h-40 object-cover rounded-2xl mx-auto border-2 border-[#183D2E]"
              />
              <button
                type="button"
                disabled={diagnoseMutation.isPending}
                onClick={() => diagnoseMutation.mutate()}
                className="w-full min-h-[52px] px-6 py-3 rounded-2xl font-bold bg-[#DA9A4C] text-[#183D2E] hover:bg-[#C28538] flex items-center justify-center gap-2 text-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {diagnoseMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t('disease.diagnosing_btn')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{language === 'te' ? 'తెగులును గుర్తించండి' : language === 'hi' ? 'रोग की जांच करें' : 'Diagnose Disease Now'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {result && result.success && (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#183D2E] text-left space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#183D2E] text-white">
                  {result.predicted_crop}
                </span>
                <ReadAloudButton text={`${result.predicted_disease}. ${result.safe_ipm_steps[0] || ''}`} />
              </div>
              <h3 className="text-xl font-bold text-[#183D2E]">
                {result.predicted_disease}
              </h3>
              <p className="text-sm text-[#4E5F57]">
                {result.safe_ipm_steps[0]}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Derived plain meaning
  const plainMeaning = result?.success
    ? `Identified condition is ${result.predicted_disease} on ${result.predicted_crop} with ${Math.round((result.prediction_confidence || 0) * 100)}% visual similarity. Zero chemical pesticides recommended; implement the organic cultural practices below.`
    : 'Upload or capture a sharp photo of an affected leaf to identify symptoms and safe cultural treatments.';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* PAGE HEADER */}
      <PageHeader
        icon={Leaf}
        title={t('disease.title')}
        purpose={t('disease.subtitle')}
        whatIsThis={{
          summary: 'Scans plant leaf photos using deep learning computer vision to recognize foliar diseases, calculate visual confidence, and recommend zero-chemical cultural IPM management.',
          whatToEnter: 'A sharp, well-lit photo of an affected leaf, your crop name, and (optionally) your registered farm holding.',
          whatYouGet: 'Identified condition name, certainty percentage, safe non-chemical management steps, and weather fungal risk indicators.',
        }}
        actions={
          <button
            type="button"
            onClick={() => setShowSupportedModal(!showSupportedModal)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#7A553A]/30 text-xs font-bold text-[#183D2E] hover:bg-[#FAF8F5] flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Info className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('disease.supported_crops_title')} (14)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSupportedModal ? 'rotate-180' : ''}`} />
          </button>
        }
      />

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

      {/* Supported crops collapsible panel */}
      {showSupportedModal && (
        <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#7A553A]/20 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#183D2E] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#183D2E]">
                {t('disease.supported_crops_title')}
              </h3>
              <p className="text-xs text-[#4E5F57] leading-relaxed">
                {t('disease.supported_crops_desc')}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {supportedData?.supported_crops.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#183D2E] border border-[#7A553A]/20 shadow-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mt-2">
                <p className="text-xs text-amber-900 font-semibold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  {t('disease.unsupported_warning_title')}: Cotton, Chilli, Rice, Wheat
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {supportedData?.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAD SUMMARY SECTION (1 to 3 Large Result Cards if Result Exists) */}
      {result && result.success && (
        <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Diagnosis Condition & Confidence */}
          <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                  Diagnosis Identified
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                  {result.predicted_crop}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#183D2E]">
                {result.predicted_disease}
              </h2>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-bold text-[#4E5F57]">Certainty:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#183D2E]/10 text-[#183D2E]">
                  {Math.round((result.prediction_confidence || 0) * 100)}%
                </span>
                {result.reported_to_outbreak && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                    Outbreak Logged
                  </span>
                )}
              </div>

              <p className="text-xs text-[#7A553A] font-medium pt-1">
                {t('disease.benchmark_class')}: <span className="font-mono">{result.predicted_class}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
              <ReadAloudButton text={`${result.predicted_disease} on ${result.predicted_crop}. ${plainMeaning}`} />
              <button
                type="button"
                onClick={handleClearImage}
                className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
              >
                <span>Scan Another Leaf</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: #1 Immediate Organic / Cultural Management Step */}
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Primary IPM Action
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Zero Chemical
                </span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <p className="text-sm font-bold text-emerald-950 leading-relaxed">
                  {result.safe_ipm_steps?.[0] || 'Remove visibly infected foliage and isolate affected plants to prevent spread.'}
                </p>
              </div>

              <WhatThisMeans
                message={plainMeaning}
                confidenceNote="Visual similarity match against PlantVillage benchmark (modelled, not laboratory cultured)."
              />
            </div>
          </div>

          {/* Card 3: Weather Fungal Risk & Outbreak Centroid */}
          <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1">
                  <CloudRain className="w-4 h-4 text-[#DA9A4C]" />
                  Microclimate Spore Risk
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    result.weather_fungal_risk?.elevated
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {result.weather_fungal_risk?.elevated ? 'Elevated Risk' : 'Low Atmospheric Risk'}
                </span>
              </div>

              <p className="text-xs text-[#4E5F57] leading-relaxed">
                {result.weather_fungal_risk?.explanation ||
                  'No extreme humidity or precipitation spikes detected in current weather forecast.'}
              </p>

              {activeFarm && (
                <div className="pt-2 flex items-center gap-1 text-xs text-[#7A553A] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#183D2E]" />
                  <span>Centroid: {activeFarm.village}, {activeFarm.district}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#7A553A]/15 text-xs text-[#7A553A]">
              <span>Indicative microclimate assessment based on open agro-meteorological data.</span>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD & INPUT CONTROL CARD */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7A553A]/15">
          <h2 className="text-lg font-display font-bold text-[#183D2E] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#DA9A4C]" />
            <span>Leaf Specimen & Farm Parameters</span>
          </h2>
          <span className="text-xs text-[#7A553A] font-semibold">
            {selectedFile ? 'Photo Loaded' : 'No Photo Selected'}
          </span>
        </div>

        {/* Validation Errors & Borderline Prompts */}
        {validationError && (
          <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Invalid File</h4>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">{validationError}</p>
            </div>
          </div>
        )}

        {borderlineWarning && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 space-y-3">
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
                className="min-h-[44px] px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                Confirm and Continue
              </button>
            </div>
          </div>
        )}

        {diagnoseMutation.isError && !borderlineWarning && (
          <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl p-4 flex items-start gap-3">
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

        {/* Upload Zone & Fields */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Photo area (7 cols) */}
          <div className="md:col-span-7">
            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#7A553A]/30 hover:border-[#183D2E] rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-[#FAF8F5] hover:bg-[#EFE7DE]/50 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#183D2E]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#183D2E]">
                    {t('disease.drag_drop_text')}
                  </p>
                  <p className="text-xs text-[#7A553A] mt-1">
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
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#183D2E] text-white text-xs font-bold hover:bg-[#265C46] flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('disease.camera_btn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#7A553A]/30 aspect-video bg-neutral-900 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Specimen Leaf Preview"
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[36px] px-3 py-1 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-md hover:bg-black/80"
                  >
                    {t('disease.change_photo')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="min-h-[36px] px-3 py-1 rounded-xl bg-red-600/80 text-white text-xs font-bold backdrop-blur-md hover:bg-red-700"
                  >
                    {t('disease.remove_photo')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Parameters (5 cols) */}
          <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#183D2E] block mb-1">
                  {t('disease.select_farm_label')}
                </label>
                <select
                  value={activeFarmId || ''}
                  onChange={handleFarmSelect}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 bg-white text-xs text-[#183D2E] font-medium focus:ring-2 focus:ring-[#183D2E] focus:outline-none"
                >
                  <option value="">{t('disease.no_farm_selected')}</option>
                  {farms.map((f: Farm) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.village}, {f.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#183D2E] block mb-1">
                  {t('disease.crop_hint_label')}
                </label>
                <input
                  type="text"
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  placeholder={t('disease.crop_hint_placeholder')}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 bg-white text-xs text-[#183D2E] font-medium focus:ring-2 focus:ring-[#183D2E] focus:outline-none"
                />
              </div>

              <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#7A553A]/20">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportToOutbreak}
                    onChange={(e) => setReportToOutbreak(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#183D2E] focus:ring-[#183D2E] border-[#7A553A]/30 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#183D2E] block">
                      {t('disease.opt_in_outbreak_label')}
                    </span>
                    <span className="text-[11px] text-[#7A553A] leading-tight block">
                      {t('disease.opt_in_outbreak_hint')}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!selectedFile || diagnoseMutation.isPending}
              onClick={() => diagnoseMutation.mutate()}
              className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {diagnoseMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('disease.diagnosing_btn')}</span>
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 text-[#DA9A4C]" />
                  <span>{t('disease.diagnose_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quality Gate Failure State */}
      {result && !result.success && (
        <div className="bg-white rounded-2xl p-6 border-2 border-red-300 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-900">
                {t('disease.quality_gate_failed')}
              </h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                {result.error || result.quality_gate?.reason}
              </p>
            </div>
          </div>

          {result.quality_gate?.metrics && (
            <div className="bg-red-50/60 rounded-xl p-4 border border-red-200 space-y-2 text-xs">
              <p className="font-bold text-red-900 uppercase tracking-wider text-[11px]">
                {t('disease.diagnostic_checks')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2.5 border border-red-100">
                  <span className="text-neutral-500 block">{t('disease.sharpness_metric')}</span>
                  <span className="font-bold text-neutral-800">
                    {result.quality_gate.metrics.sharpness_laplacian_var ?? 'N/A'} (min 60)
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-red-100">
                  <span className="text-neutral-500 block">{t('disease.luminance_metric')}</span>
                  <span className="font-bold text-neutral-800">
                    {result.quality_gate.metrics.mean_luminance ?? 'N/A'} (20–240)
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-red-100">
                  <span className="text-neutral-500 block">{t('disease.foliar_chromaticity_metric')}</span>
                  <span className="font-bold text-neutral-800">
                    {result.quality_gate.metrics.foliar_ratio ?? 'N/A'} (min 0.20)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 space-y-1">
            <p className="font-bold text-neutral-900">{t('disease.photo_tips_title')}</p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-neutral-600">
              <li>{t('disease.photo_tip_1')}</li>
              <li>{t('disease.photo_tip_2')}</li>
              <li>{t('disease.photo_tip_3')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* DETAIL TABS SECTION (Decluttering all existing information without deleting) */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
          <button
            type="button"
            onClick={() => setActiveTab('ipm')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'ipm'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Organic IPM & Symptoms</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostic')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'diagnostic'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#DA9A4C]" />
            <span>Lab Diagnostic & Alternatives</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'sources'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Citations & Schemes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crops')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'crops'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Info className="w-4 h-4 text-[#183D2E]" />
            <span>Supported Crops & Tips</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <History className="w-4 h-4 text-[#7A553A]" />
            <span>Community Outbreaks ({history.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: ORGANIC IPM & SYMPTOMS */}
          {activeTab === 'ipm' && (
            <div className="space-y-5">
              {result && result.success ? (
                <>
                  {/* Characteristic Symptoms */}
                  {result.symptoms && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#183D2E]">
                        {t('disease.symptoms_heading')}
                      </h4>
                      <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#7A553A]/20 text-xs sm:text-sm text-[#183D2E] leading-relaxed">
                        {result.symptoms}
                      </div>
                    </div>
                  )}

                  {/* Safe Cultural Practices */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#183D2E] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {t('disease.ipm_heading')}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {t('disease.zero_chemical_dosages')}
                      </span>
                    </div>

                    <div className="bg-emerald-50/40 rounded-xl p-4 sm:p-5 border border-emerald-200 space-y-3">
                      {result.safe_ipm_steps && result.safe_ipm_steps.length > 0 ? (
                        result.safe_ipm_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-emerald-950">
                            <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="leading-relaxed font-medium">{step}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-600">{t('disease.consult_officer')}</p>
                      )}
                      <p className="text-[11px] text-emerald-800/80 pt-2 border-t border-emerald-200/60 italic">
                        {t('disease.ipm_disclaimer')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  <Leaf className="w-8 h-8 mx-auto text-[#183D2E]/40 mb-2" />
                  <p>Upload or capture a leaf photo above to reveal detailed organic IPM steps and symptoms.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIAGNOSTIC & ALTERNATIVES */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-5">
              {result && result.success ? (
                <>
                  {/* Uncalibrated confidence meter */}
                  <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#7A553A]/20 space-y-2">
                    <ConfidenceMeter
                      value={result.prediction_confidence || 0}
                      type="prediction_confidence"
                      showLabel={true}
                    />
                  </div>

                  {/* Top 3 Alternative Candidates */}
                  {result.top3_predictions && result.top3_predictions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#183D2E]">
                        {t('disease.top3_ranking')}
                      </h4>
                      <div className="space-y-2">
                        {result.top3_predictions.map((p, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-3 border border-[#7A553A]/20 space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-semibold text-[#183D2E]">
                                {idx + 1}. {p.crop} — {p.disease_name}
                              </span>
                              <span className="font-mono font-bold text-[#183D2E]">
                                {(p.probability * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-[#FAF8F5] rounded-full h-2 overflow-hidden border border-[#7A553A]/10">
                              <div
                                className={`h-full rounded-full ${
                                  idx === 0 ? 'bg-[#183D2E]' : 'bg-[#DA9A4C]'
                                }`}
                                style={{ width: `${Math.min(100, p.probability * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="space-y-2">
                      {result.warnings.map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 text-xs text-neutral-800 flex items-start gap-2.5"
                        >
                          <Info className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                          <p className="leading-relaxed">{w}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  <p>Run a diagnosis first to inspect confidence rankings and alternative candidate probabilities.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SOURCES & SCHEMES */}
          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#183D2E]">
                  {t('disease.sources_heading')}
                </h5>
                {result?.sources && result.sources.length > 0 ? (
                  <div className="space-y-1.5">
                    {result.sources.map((s, idx) =>
                      s.url && s.url.startsWith('http') ? (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-xs text-[#183D2E] hover:text-[#265C46] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/20 transition-colors"
                        >
                          <span className="truncate pr-1">{s.title || s.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#7A553A]" />
                        </a>
                      ) : (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-stone-700 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/20"
                        >
                          <span className="truncate pr-1">{s.title || s.name}</span>
                          <span className="text-[10px] text-amber-700 font-semibold px-1.5 py-0.5 rounded bg-amber-100">to verify</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Government ICAR/KVK package of practices citations appear here upon diagnosis.</p>
                )}
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#183D2E]">
                  {t('disease.schemes_heading')}
                </h5>
                {result?.scheme_tags && result.scheme_tags.length > 0 ? (
                  <div className="space-y-1.5">
                    {result.scheme_tags.map((tag, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-[#183D2E] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#7A553A]/20 font-medium"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Relevant crop protection schemes (e.g. NFSM, PMFBY) appear here.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORTED CROPS & TIPS */}
          {activeTab === 'crops' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#183D2E]">
                  14 Supported Crops in PlantVillage Benchmark
                </h4>
                <div className="flex flex-wrap gap-2">
                  {supportedData?.supported_crops.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/20"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/20 space-y-2">
                <h5 className="text-xs font-bold text-[#183D2E]">{t('disease.photo_tips_title')}</h5>
                <ul className="list-disc list-inside text-xs space-y-1 text-[#4E5F57]">
                  <li>{t('disease.photo_tip_1')}</li>
                  <li>{t('disease.photo_tip_2')}</li>
                  <li>{t('disease.photo_tip_3')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: COMMUNITY OUTBREAK HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#183D2E] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#DA9A4C]" />
                  <span>{t('disease.history_title')}</span>
                </h4>
                <span className="text-xs text-[#7A553A]">
                  {t('disease.anonymized_centroids')}
                </span>
              </div>

              {history.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {history.map((h: DiseaseHistoryItem) => (
                    <div
                      key={h.id}
                      className="bg-[#FAF8F5] rounded-xl p-3.5 border border-[#7A553A]/20 space-y-1.5 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#183D2E] truncate pr-1">
                          {h.predicted_disease}
                        </span>
                        <span className="font-mono text-[11px] text-[#7A553A] font-semibold shrink-0">
                          {Math.round(h.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4E5F57] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#183D2E] shrink-0" />
                        {h.village}, {h.district}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  No community outbreak reports recorded in your region yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseasePage;