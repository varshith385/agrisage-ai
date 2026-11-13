import React, { useState, useEffect } from 'react';
import {
  Sprout,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getRotationRecommendations } from '../api/economics';
import { apiRequest } from '../api/client';
import {
  CropRotationResponse,
  CropRecommendationResponse,
  CropCandidate,
} from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceMeter } from '../components/common/ConfidenceMeter';
import { ExplainCard } from '../components/common/ExplainCard';

export const CropRecommendationPage: React.FC = () => {
  const { t } = useTranslation();

  // ML Recommendation Inputs
  const [n, setN] = useState<number>(50.0);
  const [p, setP] = useState<number>(50.0);
  const [k, setK] = useState<number>(50.0);
  const [ph, setPh] = useState<number>(6.5);
  const [temp, setTemp] = useState<number>(28.0);
  const [humidity, setHumidity] = useState<number>(70.0);
  const [rainfall, setRainfall] = useState<number>(180.0);
  const [omitSoil, setOmitSoil] = useState<boolean>(false);

  const [mlResult, setMlResult] = useState<CropRecommendationResponse | null>(null);
  const [loadingMl, setLoadingMl] = useState<boolean>(false);

  // Crop Rotation Inputs
  const [prevCrop, setPrevCrop] = useState<string>('Cotton');
  const [rotationData, setRotationData] = useState<CropRotationResponse | null>(null);
  const [loadingRotation, setLoadingRotation] = useState<boolean>(false);

  const fetchRecommendation = async () => {
    setLoadingMl(true);
    try {
      const payload: any = {
        temperature: temp,
        humidity: humidity,
        rainfall: rainfall,
      };
      if (!omitSoil) {
        payload.n = n;
        payload.p = p;
        payload.k = k;
        payload.ph = ph;
      }
      const res = await apiRequest<CropRecommendationResponse>('/api/v1/recommend/crop', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMlResult(res);
    } catch (e) {
      console.error('Failed to fetch crop recommendation:', e);
    } finally {
      setLoadingMl(false);
    }
  };

  const fetchRotation = () => {
    setLoadingRotation(true);
    getRotationRecommendations(prevCrop)
      .then((data) => setRotationData(data))
      .catch((e) => console.error('Failed to fetch rotation:', e))
      .finally(() => setLoadingRotation(false));
  };

  useEffect(() => {
    fetchRecommendation();
  }, [omitSoil]);

  useEffect(() => {
    fetchRotation();
  }, [prevCrop]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-agri-gold-400 text-stone-900 rounded-md">
              {t('common.demo_mode')}
            </span>
            <StatusBadge status="WORKING" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Sprout className="w-8 h-8 text-agri-green-700" />
            {t('recommend.title')} &amp; {t('recommend.rotation_title')}
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            {t('recommend.subtitle')}
          </p>
        </div>
      </div>

      {/* Section 1: ML Crop Recommendation Engine */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-agri-gold-500" />
            <h3 className="text-base font-bold text-stone-900">
              {t('recommend.ml_section_title')} (RandomForest Multi-Crop Classifier)
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={omitSoil}
              onChange={(e) => setOmitSoil(e.target.checked)}
              className="accent-agri-green-700 rounded"
            />
            <span>{t('recommend.omit_soil_checkbox')} (Weather-Only Fallback)</span>
          </label>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Nitrogen (N)</label>
            <input
              type="number"
              disabled={omitSoil}
              value={n}
              onChange={(e) => setN(parseFloat(e.target.value) || 0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Phosphorus (P)</label>
            <input
              type="number"
              disabled={omitSoil}
              value={p}
              onChange={(e) => setP(parseFloat(e.target.value) || 0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Potassium (K)</label>
            <input
              type="number"
              disabled={omitSoil}
              value={k}
              onChange={(e) => setK(parseFloat(e.target.value) || 0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Soil pH</label>
            <input
              type="number"
              step="0.1"
              disabled={omitSoil}
              value={ph}
              onChange={(e) => setPh(parseFloat(e.target.value) || 7.0)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 disabled:opacity-40"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Temp (°C)</label>
            <input
              type="number"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value) || 25)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Humidity (%)</label>
            <input
              type="number"
              value={humidity}
              onChange={(e) => setHumidity(parseFloat(e.target.value) || 60)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">Rain (mm)</label>
            <input
              type="number"
              min="0"
              max="500"
              value={rainfall}
              onChange={(e) => setRainfall(parseFloat(e.target.value) || 150)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900"
            />
          </div>
        </div>

        <button
          onClick={fetchRecommendation}
          disabled={loadingMl}
          className="px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
        >
          {loadingMl ? 'Evaluating ML Model...' : t('recommend.evaluate_btn')}
        </button>

        {/* ML Output */}
        {mlResult && (
          <div className="space-y-3 pt-2">
            {mlResult.soil_values_missing && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Soil values omitted:</strong> Evaluated dedicated weather-only model variant. Confidence reduced to 50% without guessing soil nutrients.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {mlResult.top_crops.map((crop: CropCandidate, idx: number) => (
                <div
                  key={crop.crop_name}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-agri-gold-400 text-stone-900 rounded-md">
                        Rank #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-agri-green-800">
                        {(crop.probability * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-base capitalize mb-1">{crop.crop_name}</h4>
                    <p className="text-xs text-stone-600 mb-3">{crop.reasons.join(' ')}</p>
                    {crop.suitability_note && (
                      <p className="text-[11px] text-stone-500 italic mb-2">{crop.suitability_note}</p>
                    )}
                  </div>
                  <div className="border-t border-stone-200 pt-2">
                    <ConfidenceMeter value={crop.probability} type="model_metric" />
                  </div>
                </div>
              ))}
            </div>

            {mlResult.climate_warnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-xl text-xs">
                <span className="font-bold block mb-1">Climate Suitability Warnings:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {mlResult.climate_warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Rule-Based Crop Rotation Planner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('recommend.rotation_planner_title')} (Biological Soil &amp; Pest Break Engine)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">{t('recommend.previous_harvest_label')}:</span>
            <select
              value={prevCrop}
              onChange={(e) => setPrevCrop(e.target.value)}
              className="bg-white border border-stone-300 text-stone-900 font-bold rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-agri-green-600"
            >
              <option value="Cotton">Cotton (Malvaceae)</option>
              <option value="Rice">Rice / Paddy (Poaceae)</option>
              <option value="Maize">Maize (Poaceae)</option>
              <option value="Chilli">Chilli (Solanaceae)</option>
              <option value="Tomato">Tomato (Solanaceae)</option>
              <option value="Groundnut">Groundnut (Fabaceae)</option>
              <option value="Pulses">Pulses / Redgram (Fabaceae)</option>
            </select>
            {loadingRotation && <span className="text-[10px] text-stone-500 font-bold animate-pulse">Loading...</span>}
          </div>
        </div>

        {rotationData && (
          <div className="space-y-4">
            {/* Agronomic Risks & Avoid Crops */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Primary Agronomic Risks of Repeating {rotationData.previous_crop}:
                </span>
                <ul className="text-xs text-amber-800 space-y-1">
                  {rotationData.primary_agronomic_risks.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-700" />
                  Crops Strictly to Avoid:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rotationData.avoid_crops.map((c) => (
                    <span key={c} className="text-xs font-bold bg-white text-red-800 px-2.5 py-1 rounded-md border border-red-300">
                      ✕ {c}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-red-800/90 leading-relaxed mt-1">
                  {rotationData.avoid_reason}
                </p>
              </div>
            </div>

            {/* Recommended Rotations */}
            <div>
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2.5">
                Recommended Successor Crops (Citing Soil Restoration &amp; Pest Breaks):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {rotationData.recommended_rotations.map((item) => (
                  <div
                    key={item.crop_name}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="px-2 py-0.5 bg-agri-green-100 text-agri-green-900 text-[10px] font-black uppercase rounded">
                          {item.benefit_category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-stone-500 font-semibold">
                          {item.suitable_seasons.join(', ')}
                        </span>
                      </div>
                      <h5 className="font-bold text-stone-900 text-sm mb-1">{item.crop_name}</h5>
                      <span className="text-[10px] text-stone-500 block mb-2 font-medium">{item.crop_family}</span>
                      <p className="text-xs text-stone-600 mb-2 leading-relaxed">{item.rationale}</p>
                      <p className="text-[11px] text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 mb-2">
                        <strong>Precaution:</strong> {item.precaution}
                      </p>
                    </div>
                    <div className="border-t border-stone-200 pt-2 text-[10px] text-stone-500">
                      <span>Source: {item.agronomic_source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universal ExplainCard */}
      <ExplainCard
        title={t('recommend.explain_title')}
        data={{
          value: 'Crop Selection & Restorative Rotation Architecture',
          status: 'WORKING',
          confidence: 0.92,
          confidence_type: 'rule',
          reasons: [
            "Crop rotation rules prioritize leguminous biological nitrogen fixation (30-40 kg N/ha) after heavy-feeding cotton.",
            "Monoculture cotton and Solanaceous crops (Chilli/Tomato) are strictly flagged due to soil-borne nematode and wilt accumulation.",
            "Weather-only fallback protects model credibility by lowering confidence when soil parameters are unavailable.",
          ],
          sources: [
            "ICAR Indian Institute of Farming Systems Research (IIFSR) Modipuram",
            "CRIDA Hyderabad — Dryland Cropping Sequence Guidelines",
          ],
          limitations: [
            "Field pest and nematode presence must be confirmed visually before finalizing pulse varieties.",
            "Residual moisture in rice fallows varies by rainfall; broadcast pulses when soil is moist but unflooded.",
          ],
        }}
      />
    </div>
  );
};
