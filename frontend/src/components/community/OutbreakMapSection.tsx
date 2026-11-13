import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Shield, AlertTriangle, Filter, Calendar, Activity, ChevronDown, ChevronUp, UserCheck, Lock } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getOutbreakMap, getDistrictOfficerSummary } from '../../api/community';
import { OutbreakMapResponse, DistrictOfficerSummary, OutbreakCluster } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

// Leaflet center adjuster component
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const OutbreakMapSection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [days, setDays] = useState<number>(14);
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [minThreshold] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapData, setMapData] = useState<OutbreakMapResponse | null>(null);

  // Officer View state
  const [showOfficerView, setShowOfficerView] = useState<boolean>(false);
  const [officerSummary, setOfficerSummary] = useState<DistrictOfficerSummary | null>(null);
  const [loadingOfficer, setLoadingOfficer] = useState<boolean>(false);
  const [officerError, setOfficerError] = useState<string | null>(null);

  const isOfficerEligible = user?.role === 'Expert' || user?.role === 'Admin';

  const fetchOutbreaks = async () => {
    setLoading(true);
    try {
      const res = await getOutbreakMap({
        district: 'Warangal',
        state: 'Telangana',
        days,
        crop: cropFilter,
        minThreshold,
      });
      setMapData(res);
    } catch (err) {
      console.error('Failed to load outbreak map:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerSummary = async () => {
    if (!isOfficerEligible) return;
    setLoadingOfficer(true);
    setOfficerError(null);
    try {
      const summary = await getDistrictOfficerSummary({ district: 'Warangal', state: 'Telangana', days: 30 });
      setOfficerSummary(summary);
    } catch (err: any) {
      setOfficerError(err?.message || 'Failed to load officer telemetry.');
    } finally {
      setLoadingOfficer(false);
    }
  };

  useEffect(() => {
    fetchOutbreaks();
  }, [days, cropFilter]);

  useEffect(() => {
    if (showOfficerView && isOfficerEligible && !officerSummary) {
      fetchOfficerSummary();
    }
  }, [showOfficerView, isOfficerEligible]);

  // Center coordinate around Warangal district
  const centerCoord: [number, number] = [17.9784, 79.5941];

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return '#dc2626'; // Red
      case 'MODERATE':
        return '#f59e0b'; // Amber
      case 'LOW':
      default:
        return '#10b981'; // Emerald
    }
  };

  const getMarkerRadius = (count: number) => {
    return Math.min(28, Math.max(14, 12 + count * 2.5));
  };

  return (
    <section id="outbreak-map" className="scroll-mt-24 space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {t('community.outbreak.title')}
              </h2>
              <StatusBadge status="DEMO" />
              <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                {t('community.demo_badge')}
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              {t('community.outbreak.subtitle')}
            </p>
          </div>

          {/* Privacy Threshold Note Badge */}
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl px-3 py-2 text-xs font-semibold">
            <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="block font-bold">{t('community.outbreak.privacy_guard_badge')}</span>
              <span className="text-[10px] text-emerald-800/80 font-normal">
                {t('community.outbreak.privacy_explanation')}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Window Selector */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium text-stone-700">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{t('community.outbreak.time_window')}</span>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer ml-1"
              >
                <option value={7}>{t('community.outbreak.days_7')}</option>
                <option value={14}>{t('community.outbreak.days_14')}</option>
                <option value={30}>{t('community.outbreak.days_30')}</option>
                <option value={90}>{t('community.outbreak.days_90')}</option>
              </select>
            </div>

            {/* Crop Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium text-stone-700">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <span>{t('community.outbreak.crop_filter')}</span>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer ml-1"
              >
                <option value="all">{t('community.outbreak.all_crops')}</option>
                <option value="Tomato">Tomato</option>
                <option value="Potato">Potato</option>
                <option value="Corn">Maize / Corn</option>
                <option value="Cotton">Cotton</option>
                <option value="Chilli">Chilli</option>
              </select>
            </div>
          </div>

          {/* District Officer Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOfficerView(!showOfficerView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showOfficerView
                  ? 'bg-agri-green-800 text-white border-agri-green-900 shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-agri-gold-400" />
              {t('community.outbreak.officer_view_btn')}
              {showOfficerView ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Telemetry Summary Stats */}
        {mapData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-stone-100">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                Active Village Clusters
              </span>
              <span className="text-lg font-bold text-stone-900">
                {mapData.summary.unique_villages_displayed}
              </span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                Verified Opt-In Reports
              </span>
              <span className="text-lg font-bold text-stone-900">
                {mapData.summary.total_qualifying_reports}
              </span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                Privacy-Suppressed Clusters (&lt;3)
              </span>
              <span className="text-lg font-bold text-emerald-800">
                {mapData.summary.suppressed_clusters_count} hidden
              </span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                Target District
              </span>
              <span className="text-lg font-bold text-stone-900">
                {mapData.district}, {mapData.state}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* District Officer Dashboard (Expert & Admin Role Exclusive) */}
      {showOfficerView && (
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 border border-stone-800 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-agri-gold-500 text-stone-900 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('community.outbreak.officer_dashboard_title')}
              </h3>
              <span className="text-[10px] bg-agri-gold-400/20 text-agri-gold-300 font-bold px-2 py-0.5 rounded-full border border-agri-gold-400/40">
                {t('community.outbreak.officer_only_badge')}
              </span>
            </div>
            <span className="text-xs text-stone-400">Warangal Mandal Epidemiology</span>
          </div>

          {!isOfficerEligible ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs text-stone-300 font-medium">
                The full district officer epidemiological breakdown is reserved for registered Agricultural Officers (Expert/Admin).
              </p>
              <p className="text-[11px] text-stone-500">
                Farmers see the aggregated public village cluster map below with privacy protection.
              </p>
            </div>
          ) : loadingOfficer ? (
            <div className="py-8 text-center text-xs text-stone-400 animate-pulse">
              Aggregating district disease submissions...
            </div>
          ) : officerSummary ? (
            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prevalent Diseases Breakdown */}
                <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/60">
                  <h4 className="text-xs font-bold text-agri-gold-400 mb-2.5">
                    {t('community.outbreak.top_diseases')}
                  </h4>
                  <div className="space-y-2">
                    {officerSummary.disease_breakdown.map((d, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between text-stone-300 mb-0.5">
                          <span>{d.disease}</span>
                          <span className="font-bold text-white">{d.count} ({d.pct}%)</span>
                        </div>
                        <div className="w-full bg-stone-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-agri-gold-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, d.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hotspot Villages */}
                <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/60">
                  <h4 className="text-xs font-bold text-agri-gold-400 mb-2.5">
                    {t('community.outbreak.hotspot_villages')}
                  </h4>
                  <div className="space-y-1.5">
                    {officerSummary.hotspot_villages.slice(0, 5).map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-stone-700/40">
                        <span className="text-stone-300">{h.village}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300">
                          {h.count} reports
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4-Week Trend */}
                <div className="bg-stone-800/80 p-4 rounded-xl border border-stone-700/60">
                  <h4 className="text-xs font-bold text-agri-gold-400 mb-2.5">
                    {t('community.outbreak.weekly_trend')}
                  </h4>
                  <div className="space-y-1.5">
                    {officerSummary.weekly_trends.map((w, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-stone-700/40">
                        <span className="text-stone-300">{w.week_label}</span>
                        <span className="font-bold text-white">{w.reports_count} cases</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Extension Actions */}
              <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/60">
                <h4 className="text-xs font-bold text-emerald-400 mb-2">
                  {t('community.outbreak.officer_advisories')}
                </h4>
                <ul className="space-y-1.5 text-xs text-stone-300">
                  {officerSummary.officer_action_advisories.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-400 py-4">{officerError || 'Failed to load telemetry.'}</div>
          )}
        </div>
      )}

      {/* Leaflet Map Interactive Canvas */}
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-subtle relative">
        {/* Severity Legend Pill */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-stone-200 text-xs space-y-1.5 hidden sm:block">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
            Severity Rating
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600" />
            <span className="text-[11px] text-stone-700 font-semibold">{t('community.outbreak.severity_high')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[11px] text-stone-700 font-semibold">{t('community.outbreak.severity_mod')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-stone-700 font-semibold">{t('community.outbreak.severity_low')}</span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-[1001] text-xs font-bold text-stone-700">
            Updating outbreak clusters...
          </div>
        )}
        <div className="h-[460px] w-full">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={centerCoord}
              zoom={11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <ChangeView center={centerCoord} zoom={11} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mapData?.clusters.map((cluster: OutbreakCluster, idx: number) => {
                const color = getMarkerColor(cluster.severity);
                const radius = getMarkerRadius(cluster.report_count);

                return (
                  <CircleMarker
                    key={idx}
                    center={[cluster.latitude, cluster.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-stone-800 font-sans min-w-[200px]">
                        <div className="flex items-center justify-between border-b pb-1">
                          <span className="font-bold text-xs text-stone-900">{cluster.village}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: color }}
                          >
                            {cluster.severity}
                          </span>
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <p>
                            <strong className="text-stone-600">{t('community.outbreak.cluster_popup_disease')}:</strong>{' '}
                            <span className="font-semibold text-rose-700">{cluster.predicted_disease}</span>
                          </p>
                          <p>
                            <strong className="text-stone-600">{t('community.outbreak.cluster_popup_reports')}:</strong>{' '}
                            <span className="font-bold text-stone-900">{cluster.report_count} cases</span>
                          </p>
                          <p>
                            <strong className="text-stone-600">{t('community.outbreak.cluster_popup_conf')}:</strong>{' '}
                            <span>{(cluster.avg_confidence * 100).toFixed(1)}% (uncalibrated)</span>
                          </p>
                        </div>
                        <p className="text-[9px] text-stone-500 pt-1 border-t italic">
                          {cluster.privacy_note}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </section>
  );
};
