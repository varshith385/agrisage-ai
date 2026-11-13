import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  Bell,
  BellOff,
  Sun,
  Clock,
  CheckCircle,
  Sprout,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { getFarms } from '../api/farms';
import { getCropCalendar, getSeasonalAwareness } from '../api/economics';
import {
  Farm,
  CropCalendarResponse,
  SeasonalAwarenessResponse,
} from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ExplainCard } from '../components/common/ExplainCard';

export const CalendarPage: React.FC = () => {
  const { t, language } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [cropName, setCropName] = useState<string>('Cotton');
  const [plantingDate, setPlantingDate] = useState<string>('2026-08-15');

  const [calendarData, setCalendarData] = useState<CropCalendarResponse | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonalAwarenessResponse | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  // Browser Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  useEffect(() => {
    getFarms().then((data: Farm[]) => {
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarm(data[0]);
      }
    });

    getSeasonalAwareness().then((data) => setSeasonData(data));
  }, []);

  const loadCalendar = () => {
    setLoading(true);
    getCropCalendar({ crop_name: cropName, planting_date: plantingDate })
      .then((data) => setCalendarData(data))
      .catch((err) => console.error('Failed to load calendar:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCalendar();
  }, [cropName, plantingDate]);

  const requestNotificationOptIn = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationMsg('Browser notifications are not supported in this environment.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        setNotificationMsg('Notifications enabled! You will receive timely field task reminders.');
        new Notification('AgriSage AI Calendar', {
          body: 'Field reminders and stage alerts are active for your farm.',
          icon: '/favicon.ico',
        });
      } else {
        setNotificationMsg('Notification permission was declined. In-app alerts remain active.');
      }
    } catch (e) {
      setNotificationMsg('Error requesting notification permissions.');
    }
  };

  const downloadIcsFile = () => {
    const url = `/api/v1/calendar/export.ics?crop_name=${encodeURIComponent(cropName)}&planting_date=${plantingDate}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cropName.toLowerCase()}_schedule.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredEvents = calendarData?.events.filter((evt) => {
    if (eventTypeFilter === 'all') return true;
    return evt.event_type === eventTypeFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-agri-gold-400 text-stone-900 rounded-md">
              {t('common.demo_mode')}
            </span>
            <StatusBadge status="WORKING" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-agri-green-700" />
            {t('calendar.title')}
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            {t('calendar.subtitle')}
          </p>

          {/* Farm & Crop Selector */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-stone-100">
            {farms.length > 0 && (
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const f = farms.find((farm) => farm.id === Number(e.target.value));
                  if (f) setSelectedFarm(f);
                }}
                className="text-xs font-bold bg-stone-100 text-stone-800 rounded-lg px-2.5 py-1.5 border border-stone-300"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.area} ac)</option>
                ))}
              </select>
            )}
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="text-xs font-bold bg-stone-100 text-stone-800 rounded-lg px-2.5 py-1.5 border border-stone-300"
            >
              <option value="Cotton">Cotton (పత్తి)</option>
              <option value="Rice">Rice (వరి)</option>
              <option value="Wheat">Wheat (గోధుమ)</option>
              <option value="Maize">Maize (మొక్కజొన్న)</option>
              <option value="Chilli">Chilli (మిరప)</option>
              <option value="Tomato">Tomato (టమాట)</option>
              <option value="Groundnut">Groundnut (వేరుశనగ)</option>
              <option value="Sugarcane">Sugarcane (చెరకు)</option>
            </select>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="text-xs font-bold bg-stone-100 text-stone-800 rounded-lg px-2.5 py-1.5 border border-stone-300"
            />
            {loading && <span className="text-[10px] text-stone-500 font-bold animate-pulse">Syncing...</span>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadIcsFile}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow transition-all"
            title="Export RFC 5545 .ics Calendar"
          >
            <Download className="w-4 h-4" />
            {t('calendar.export_ics_btn')}
          </button>

          <button
            onClick={requestNotificationOptIn}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
              notificationPermission === 'granted'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            {notificationPermission === 'granted' ? (
              <>
                <Bell className="w-4 h-4 text-emerald-600" />
                {t('calendar.notifications_active')}
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 text-stone-500" />
                {t('calendar.enable_notifications')}
              </>
            )}
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Seasonal Awareness Card */}
      {seasonData && (
        <div className="bg-gradient-to-r from-agri-cream-100/90 to-agri-cream-50 border border-agri-gold-300 rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-agri-gold-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Sun className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {t('calendar.season_awareness_title')}: {seasonData.current_season} ({seasonData.season_period})
                </h3>
                <span className="text-[11px] text-stone-600">
                  {language === 'te' ? seasonData.season_name_te : (language === 'hi' ? seasonData.season_name_hi : `${seasonData.current_season} Season`)} &bull; Current Month: {seasonData.current_month}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-1 rounded-lg border border-agri-gold-300 text-stone-700">
              IMD Agromet Guidelines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 p-3.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-800 block mb-1">Climatic Expectations:</span>
              <ul className="text-xs text-stone-600 space-y-1">
                <li>• Temp: <strong>{seasonData.climate_expectations.temperature}</strong></li>
                <li>• Rain: <strong>{seasonData.climate_expectations.rainfall}</strong></li>
                <li>• Humidity: <strong>{seasonData.climate_expectations.humidity}</strong></li>
              </ul>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-800 block mb-1">Typical Regional Crops:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {seasonData.typical_crops.map((c) => (
                  <span key={c} className="text-[11px] bg-agri-green-50 text-agri-green-800 font-semibold px-2 py-0.5 rounded-md border border-agri-green-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block mb-1">Primary Seasonal Risks:</span>
              <ul className="text-[11px] text-amber-800 space-y-1">
                {seasonData.primary_risks.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Timeline (7 Stages) */}
      {calendarData && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-agri-green-700" />
              <h3 className="text-base font-bold text-stone-900">
                {t('calendar.lifecycle_timeline_title')} ({cropName} &bull; Sown: {plantingDate} &bull; DAS {calendarData.days_after_sowing})
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-semibold">
              Total Duration: {calendarData.total_duration_days} days
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 pt-2">
            {calendarData.lifecycle_stages.map((st) => (
              <div
                key={st.stage_id}
                className={`p-3 rounded-xl border transition-all ${
                  st.is_active
                    ? 'bg-agri-gold-50 border-agri-gold-400 shadow-sm ring-2 ring-agri-gold-400/40'
                    : 'bg-stone-50/70 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                    st.is_active ? 'bg-agri-gold-400 text-stone-900' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {st.is_active ? 'Current' : `DAS ${st.start_das}`}
                  </span>
                </div>
                <h4 className="font-bold text-stone-900 text-xs line-clamp-1">{st.stage_name_en}</h4>
                <span className="text-[10px] text-stone-500 block mb-2">{st.start_date.slice(5)} to {st.end_date.slice(5)}</span>
                <ul className="text-[10px] text-stone-600 space-y-1">
                  {st.key_activities.slice(0, 2).map((act, i) => (
                    <li key={i} className="line-clamp-2">• {act}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dated Calendar Events List */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-agri-green-700" />
            <h3 className="text-base font-bold text-stone-900">
              {t('calendar.events_list_title')} ({filteredEvents?.length || 0} Scheduled Actions)
            </h3>
          </div>

          {/* Event Filters */}
          <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-xl text-xs">
            {['all', 'sowing', 'irrigation', 'fertilizer', 'scouting', 'harvest'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setEventTypeFilter(filterKey)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                  eventTypeFilter === filterKey ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {filteredEvents?.map((evt) => (
            <div
              key={evt.event_id}
              className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-agri-cream-200 text-agri-green-900 text-[10px] font-black uppercase rounded-md tracking-wider">
                    {evt.event_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    evt.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {evt.priority} Priority
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 text-sm mb-1">{evt.title}</h4>
                <p className="text-xs text-stone-600 mb-2 leading-relaxed">{evt.description}</p>
              </div>

              <div className="border-t border-stone-200 pt-2 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1 font-semibold text-agri-green-800">
                  <Clock className="w-3.5 h-3.5" />
                  {evt.start_date} {evt.end_date ? `to ${evt.end_date}` : ''}
                </span>
                <span className="capitalize text-[11px] text-stone-500">{evt.growth_stage} stage</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Universal ExplainCard */}
      <ExplainCard
        title={t('calendar.explain_title')}
        data={{
          value: `${cropName} Calendar & Lifecycle Schedule`,
          status: 'WORKING',
          confidence: 0.90,
          confidence_type: 'rule',
          reasons: [
            "Lifecycle stages align directly with FAO-56 stage lengths computed from your crop sowing date.",
            "Calendar export complies strictly with the RFC 5545 iCalendar standard for cross-platform calendar synchronization.",
            "In-app reminders flag high-priority moisture stress checks and pest scouting windows ahead of time.",
          ],
          sources: [
            "FAO Irrigation and Drainage Paper 56 — Crop Stages and Lengths",
            "ICAR Krishi Vigyan Kendra (KVK) Agronomic Calendar Schedules",
          ],
          limitations: [
            "Weather anomalies (monsoon delay, heavy unseasonal rain) may accelerate or retard phenological DAS by 5-7 days.",
            "Notification alerts require active browser permission grant on your mobile device.",
          ],
        }}
      />
    </div>
  );
};
