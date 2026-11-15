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
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { translateBackendString } from '../utils/safeTranslation';
import { getCropCalendar, getSeasonalAwareness } from '../api/economics';
import {
  CropCalendarResponse,
  SeasonalAwarenessResponse,
} from '../types/api';
import { ExplainCard } from '../components/common/ExplainCard';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { NoDataIllustration, LeafScanIllustration } from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { StatusBadge } from '../components/common/StatusBadge';
import { StepFlow } from '../components/common/StepFlow';
import { scrollToSection } from '../utils/scrollToSection';

export const CalendarPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { activeFarm, activeFarmId, setActiveFarmId, farms } = useAuth();

  const [cropName, setCropName] = useState<string>('Cotton');
  const [plantingDate, setPlantingDate] = useState<string>('2026-08-15');

  const [calendarData, setCalendarData] = useState<CropCalendarResponse | null>(null);
  const [seasonData, setSeasonData] = useState<SeasonalAwarenessResponse | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'stages' | 'season' | 'methodology'>('tasks');

  // Browser Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  useEffect(() => {
    if (activeFarm) {
      const activeCycle = activeFarm.current_crop_cycles?.find((c) => c.is_active);
      if (activeCycle) {
        setCropName(activeCycle.crop_name);
        if (activeCycle.planting_date) {
          setPlantingDate(activeCycle.planting_date);
        }
      }
    }
  }, [activeFarm]);

  useEffect(() => {
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
        new Notification('Grow2Gain Calendar', {
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

  const filteredEvents = (calendarData?.events || []).filter((evt) => {
    if (eventTypeFilter === 'all') return true;
    return evt.event_type === eventTypeFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = (calendarData?.events || [])
    .filter((evt) => {
      const taskDate = evt.start_date || evt.end_date || '';
      const matchesType = eventTypeFilter === 'all' || evt.event_type === eventTypeFilter;
      return matchesType && taskDate >= todayStr;
    })
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));

  const activeStage = (calendarData?.lifecycle_stages || []).find((st) => st.is_active);
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  const plainMeaning = calendarData
    ? `Your ${cropName} crop is currently at DAS ${calendarData.days_after_sowing} in the ${activeStage?.stage_name_en || 'active growth'} stage. ${nextEvent ? `Next priority task is: ${nextEvent.title}.` : 'No upcoming tasks scheduled for this period.'}`
    : 'Generating crop lifecycle calendar...';

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasCalendar = Boolean(calendarData);
    const das = calendarData?.days_after_sowing;
    const stageName = activeStage?.stage_name_en;
    const stages = calendarData?.lifecycle_stages || [];

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <PageHeader
          icon={CalendarIcon}
          title={language === 'te' ? 'పంట కాలెండర్' : language === 'hi' ? 'फसल कैलेंडर' : 'Crop Calendar'}
          purpose={language === 'te' ? 'పంట దశ మరియు రాబోయే పనుల వివరాలు' : language === 'hi' ? 'फसल की अवस्था और आगामी कार्यों की जानकारी' : 'Visual schedule of field activities.'}
        />

        {/* Lead "Do This Today" Crop Stage Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] border-2 border-[#1B5E3B] flex items-center justify-center shrink-0 shadow-sm">
              {hasCalendar ? <LeafScanIllustration size={64} /> : <NoDataIllustration size={64} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {cropName}
                </span>
                <StatusBadge
                  status={hasCalendar ? 'info' : 'nodata'}
                  label={hasCalendar ? `DAS ${das}` : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No Data')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug">
                {hasCalendar
                  ? (stageName || 'Mid-Season Development')
                  : (language === 'te' ? 'కాలెండర్ ఇంకా సిద్ధం కాలేదు' : language === 'hi' ? 'कैलेंडर अभी तैयार नहीं' : 'Awaiting Crop Calendar')}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {hasCalendar ? plainMeaning : (language === 'te' ? 'విత్తిన తేదీ ఆధారంగా దశలవారీ పనుల కాలెండర్ రూపొందించబడుతుంది.' : language === 'hi' ? 'बुवाई की तारीख के अनुसार कार्यों का कैलेंडर तैयार होगा।' : 'Sowing date models daily crop operations and phenological milestones.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {hasCalendar && (
              <ReadAloudButton
                text={`Crop Calendar: ${cropName} is at DAS ${das}. ${plainMeaning}`}
                label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
              />
            )}
            <button
              type="button"
              onClick={() => setMode('words')}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు' : language === 'hi' ? 'पूरा विवरण' : 'See Details'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Pictorial Summary Tiles with Real Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-start">
          {/* Tile 1: Current Growth Stage */}
          <PictorialTile
            title={language === 'te' ? 'ప్రస్తుత పంట దశ' : language === 'hi' ? 'वर्तमान अवस्था' : 'Current Stage'}
            phrase={hasCalendar ? `${stageName || 'Active Growth'} • DAS ${das}` : (language === 'te' ? 'దశ ఇంకా తెలియదు' : language === 'hi' ? 'अवस्था ज्ञात नहीं' : 'No stage calculated')}
            illustration={hasCalendar ? <LeafScanIllustration size={80} /> : <NoDataIllustration size={80} />}
            status={hasCalendar ? 'success' : 'nodata'}
            statusWord={hasCalendar ? (stageName || 'Active') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasCalendar ? `${cropName} is in ${stageName || 'active'} stage at day ${das} after sowing.` : 'Crop calendar data not available.'}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 2: Next Scheduled Task */}
          <PictorialTile
            title={language === 'te' ? 'రాబోయే ముఖ్య పని' : language === 'hi' ? 'आगामी कार्य' : 'Next Priority Task'}
            phrase={nextEvent ? `${translateBackendString(nextEvent.title, language)} (${nextEvent.start_date})` : (language === 'te' ? 'రాబోయే పనులు లేవు' : language === 'hi' ? 'कोई आगामी कार्य नहीं' : 'No upcoming tasks scheduled')}
            illustration={<CalendarIcon className="w-16 h-16 text-[#1565A8]" />}
            status={nextEvent ? 'warning' : 'nodata'}
            statusWord={nextEvent ? (language === 'te' ? 'తదుపరి పని' : language === 'hi' ? 'आगामी कार्य' : 'Scheduled') : (language === 'te' ? 'పనులు లేవు' : language === 'hi' ? 'कार्य नहीं' : 'No Tasks')}
            spokenText={nextEvent ? `Next priority field task is ${nextEvent.title} on ${nextEvent.start_date}.` : 'No upcoming tasks scheduled.'}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 3: Total Season Milestones */}
          <PictorialTile
            title={language === 'te' ? 'సీజన్ మైలురాళ్లు' : language === 'hi' ? 'सीजन के पड़ाव' : 'Season Milestones'}
            phrase={stages.length > 0 ? `${stages.length} growth milestones scheduled` : (language === 'te' ? 'మైలురాళ్లు లేవు' : language === 'hi' ? 'पड़ाव नहीं' : 'No stages loaded')}
            illustration={<Sprout className="w-16 h-16 text-[#1B5E3B]" />}
            status={stages.length > 0 ? 'info' : 'nodata'}
            statusWord={stages.length > 0 ? `${stages.length} Stages` : 'No Data'}
            spokenText={`${stages.length} phenological growth stages are modeled for ${cropName}.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>

        {/* 3-Step Phenological Crop Operations Routine */}
        <StepFlow
          heading={language === 'te' ? 'పంట దశల కాలెండర్‌లో 3 ముఖ్యమైన అడుగులు' : language === 'hi' ? 'फसल कैलेंडर के 3 सरल चरण' : '3 Crop Stage Milestones'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'ప్రస్తుత పంట దశ' : language === 'hi' ? 'वर्तमान अवस्था' : 'Current Stage Tracking',
              desc: language === 'te' ? 'విత్తిన రోజుల సంఖ్య (DAS) మరియు ఎదుగుదల చూడండి' : language === 'hi' ? 'बुवाई के दिन और वानस्पतिक वृद्धि देखें' : 'Track exact days after sowing and canopy development',
              icon: Sprout,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'తదుపరి పొలం పని' : language === 'hi' ? 'अगला कृषि कार्य' : 'Next Field Task',
              desc: language === 'te' ? 'ఎరువులు, కలుపు తీత లేదా పురుగుల నిఘా చేపట్టండి' : language === 'hi' ? 'खाद, निराई या कीट निगरानी करें' : 'Perform scheduled weeding, scouting, and nutrient top-dressing',
              icon: CheckCircle,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'కోత సమయం మరియు విక్రయం' : language === 'hi' ? 'कटाई एवं मंडी' : 'Harvest Window',
              desc: language === 'te' ? 'సరైన పక్వత సమయంలో కోత కోసి మార్కెట్ కు తరలించండి' : language === 'hi' ? 'सही परिपक्वता पर कटाई कर मंडी ले जाएं' : 'Plan harvest timing and line up transport to avoid moisture loss',
              icon: Sun,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* PAGE HEADER */}
      <PageHeader
        icon={CalendarIcon}
        title={t('calendar.title')}
        purpose={t('calendar.subtitle')}
        whatIsThis={{
          summary: 'Generates day-by-day agronomic task timelines and 7-stage phenological milestones based on your actual sowing date using UN FAO-56 crop growth stage models.',
          whatToEnter: 'Selected crop, sowing/planting date, and your registered farm holding.',
          whatYouGet: 'Scheduled field actions (fertilizer, scouting, weeding, harvest), growth stage tracking, and downloadable RFC 5545 .ics smartphone calendar file.',
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadIcsFile}
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              title="Export RFC 5545 .ics Calendar"
            >
              <Download className="w-4 h-4 text-[#DA9A4C]" />
              <span>{t('calendar.export_ics_btn')}</span>
            </button>

            <button
              type="button"
              onClick={requestNotificationOptIn}
              className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-[#183D2E] border-[#7A553A]/30 hover:bg-[#FAF8F5]'
              }`}
            >
              {notificationPermission === 'granted' ? (
                <>
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>{t('calendar.notifications_active')}</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-[#7A553A]" />
                  <span>{t('calendar.enable_notifications')}</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Sowing Date & Farm Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#7A553A]/20 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {farms.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-[#7A553A] uppercase block mb-0.5">{t('calendar.farm_holding_label', { defaultValue: 'Farm Holding' })}</label>
              <select
                value={activeFarmId || ''}
                onChange={(e) => setActiveFarmId(Number(e.target.value))}
                className="min-h-[40px] text-xs font-bold bg-[#FAF8F5] text-[#183D2E] rounded-xl px-3 py-1.5 border border-[#7A553A]/30 focus:ring-2 focus:ring-[#183D2E]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.area} ac)</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-[#7A553A] uppercase block mb-0.5">{t('calendar.crop_label', { defaultValue: 'Crop' })}</label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="min-h-[40px] text-xs font-bold bg-[#FAF8F5] text-[#183D2E] rounded-xl px-3 py-1.5 border border-[#7A553A]/30 focus:ring-2 focus:ring-[#183D2E]"
            >
              <option value="Cotton">Cotton ({language === 'te' ? 'పత్తి' : language === 'hi' ? 'कपास' : 'Cotton'})</option>
              <option value="Rice">Rice ({language === 'te' ? 'వరి' : language === 'hi' ? 'चावल' : 'Rice'})</option>
              <option value="Wheat">Wheat ({language === 'te' ? 'గోధుమ' : language === 'hi' ? 'गेहूं' : 'Wheat'})</option>
              <option value="Maize">Maize ({language === 'te' ? 'మొక్కజొన్న' : language === 'hi' ? 'मक्का' : 'Maize'})</option>
              <option value="Chilli">Chilli ({language === 'te' ? 'మిరప' : language === 'hi' ? 'मिर्च' : 'Chilli'})</option>
              <option value="Tomato">Tomato ({language === 'te' ? 'టమాట' : language === 'hi' ? 'टमाटर' : 'Tomato'})</option>
              <option value="Groundnut">Groundnut ({language === 'te' ? 'వేరుశనగ' : language === 'hi' ? 'मूंगफली' : 'Groundnut'})</option>
              <option value="Sugarcane">Sugarcane ({language === 'te' ? 'చెరకు' : language === 'hi' ? 'गन्ना' : 'Sugarcane'})</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#7A553A] uppercase block mb-0.5">{t('calendar.planting_date_label', { defaultValue: 'Planting / Sowing Date' })}</label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="min-h-[40px] text-xs font-bold bg-[#FAF8F5] text-[#183D2E] rounded-xl px-3 py-1.5 border border-[#7A553A]/30 focus:ring-2 focus:ring-[#183D2E]"
            />
          </div>
        </div>

        {loading && <span className="text-xs text-[#DA9A4C] font-bold animate-pulse">{t('calendar.syncing_calendar', { defaultValue: 'Syncing Calendar...' })}</span>}
      </div>

      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* LEAD SUMMARY SECTION (1 to 3 Large Cards + Primary Action) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: Current Phenological Stage */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                {t('calendar.current_growth_stage_title', { defaultValue: 'Current Growth Stage' })}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                DAS {calendarData?.days_after_sowing ?? 90}
              </span>
            </div>

            <h2 className="text-[20px] sm:text-[22px] font-display font-extrabold text-[#183D2E]">
              {translateBackendString(activeStage?.stage_name_en || 'Mid-Season Development', language)}
            </h2>

            <p className="text-xs text-[#7A553A] font-semibold">
              {t('calendar.duration_label', { defaultValue: 'Duration:' })} {calendarData?.total_duration_days ?? 160} {t('calendar.days_total_label', { defaultValue: 'days total' })} &bull; {t('calendar.sown_label', { defaultValue: 'Sown:' })} {plantingDate}
            </p>

            <p className="text-xs text-[#4E5F57] leading-relaxed pt-1">
              {t('calendar.active_activities_label', { defaultValue: 'Active activities:' })} {activeStage?.key_activities?.map((a) => translateBackendString(a, language)).join(', ') || (language === 'te' ? 'కలుపు నివారణ, చేను పరిశీలన మరియు నేల తేమ తనిఖీ.' : language === 'hi' ? 'खरपतवार नियंत्रण, फसल निगरानी और मिट्टी नमी की जांच।' : 'Weed control, vegetative scouting, and soil moisture checks.')}
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Current Stage is ${activeStage?.stage_name_en || 'Active growth'}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => {
                setActiveTab('stages');
                scrollToSection('calendar-tabs-section');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>{t('calendar.view_stages_btn', { defaultValue: 'View 7 Stages' })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Next Field Action & Priority */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#DA9A4C]" />
                {t('calendar.next_priority_task_title', { defaultValue: 'Next Priority Task' })}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                nextEvent?.priority === 'high' ? 'bg-red-100 text-red-900' : 'bg-stone-200 text-stone-800'
              }`}>
                {nextEvent ? translateBackendString(nextEvent.priority, language) : (language === 'te' ? 'పనులు లేవు' : language === 'hi' ? 'कोई नहीं' : 'None')}
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-1">
              <h3 className="text-sm font-bold text-[#183D2E]">
                {nextEvent ? translateBackendString(nextEvent.title, language) : (language === 'te' ? 'రాబోయే పనులు షెడ్యూల్ కాలేదు' : language === 'hi' ? 'कोई आगामी कार्य निर्धारित नहीं है' : 'No upcoming tasks scheduled')}
              </h3>
              <p className="text-xs text-[#4E5F57] leading-relaxed">
                {nextEvent ? translateBackendString(nextEvent.description, language) : (language === 'te' ? 'ప్రస్తుత సమయానికి తదుపరి పనులు లేవు. పంట క్షేత్రాన్ని సాధారణంగా పరిశీలించండి.' : language === 'hi' ? 'वर्तमान अवधि के लिए कोई आगामी कार्य नहीं है। सामान्य खेत निरीक्षण जारी रखें।' : 'All scheduled operations for the current window are complete or none are pending.')}
              </p>
              <span className="text-[11px] text-[#7A553A] font-semibold block pt-1">
                {t('calendar.target_window_label', { defaultValue: 'Target Window:' })} {nextEvent?.start_date ? translateBackendString(nextEvent.start_date, language) : (language === 'te' ? 'ఏదీ లేదు' : language === 'hi' ? 'कोई नहीं' : 'None scheduled')}
              </span>
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote={language === 'te' ? 'FAO-56 పంట ఎదుగుదల రోజులు మరియు వ్యవసాయ-వాతావరణ సూత్రాల ఆధారంగా లెక్కించబడింది.' : language === 'hi' ? 'FAO-56 चरण दिनों और स्थानीय कृषि-मौसम संबंधी दिशानिर्देशों से परिकलित।' : 'Computed from FAO-56 stage days and local agro-meteorological guidelines.'}
            />
          </div>
        </div>

        {/* Card 3: Seasonal Agro-Climate Status */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                {t('calendar.regional_season_title', { defaultValue: 'Regional Season' })}
              </span>
              <span className="text-xs font-bold text-[#183D2E]">
                {translateBackendString(seasonData?.current_season || 'Kharif', language)}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[#7A553A] block text-[10px]">{t('calendar.season_period_label', { defaultValue: 'Season Period:' })}</span>
                <strong className="text-[#183D2E]">{seasonData?.season_period || 'June to October'}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#7A553A]/10">
                <span className="text-[#7A553A] block text-[10px]">{t('calendar.primary_seasonal_risk', { defaultValue: 'Primary Seasonal Risk:' })}</span>
                <strong className="text-amber-900">{seasonData?.primary_risks?.[0] || 'Unseasonal rain during flowering'}</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between text-xs text-[#7A553A]">
            <span>{t('calendar.imd_agromet_guidelines', { defaultValue: 'IMD Agromet Guidelines' })}</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('season');
                scrollToSection('calendar-tabs-section');
              }}
              className="font-bold text-[#183D2E] hover:underline"
            >
              Season Details →
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL TABS (Decluttering all calendar controls without deleting) */}
      <div id="calendar-tabs-section" tabIndex={-1} className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden scroll-mt-24">
        {/* Tabs Bar */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'tasks'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>{t('calendar.tab_tasks', { defaultValue: 'Scheduled Field Tasks' })} ({filteredEvents?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'stages'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#DA9A4C]" />
            <span>{t('calendar.tab_stages', { defaultValue: '7-Stage Lifecycle Timeline' })}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('season')}
            className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'season'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-600" />
            <span>{t('calendar.tab_season', { defaultValue: 'Seasonal Awareness & IMD Agromet' })}</span>
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
            <span>{t('calendar.tab_methodology', { defaultValue: 'Methodology & Disclaimers' })}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* TAB 1: SCHEDULED TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7A553A]/15">
                <h3 className="text-sm font-bold text-[#183D2E]">
                  {t('calendar.filter_tasks_label', { defaultValue: 'Filter Scheduled Actions:' })}
                </h3>
                <div className="flex flex-wrap gap-1 bg-[#FAF8F5] p-1 rounded-xl text-xs border border-[#7A553A]/20">
                  {['all', 'sowing', 'irrigation', 'fertilizer', 'scouting', 'harvest'].map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setEventTypeFilter(filterKey)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                        eventTypeFilter === filterKey ? 'bg-[#183D2E] text-white shadow' : 'text-[#7A553A] hover:text-[#183D2E]'
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents?.map((evt) => (
                  <div
                    key={evt.event_id}
                    className="p-4 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] hover:bg-[#EFE7DE]/30 transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-[#DA9A4C]/20 text-[#7A553A] text-[10px] font-black uppercase rounded-md tracking-wider">
                          {evt.event_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          evt.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {evt.priority} Priority
                        </span>
                      </div>

                      <h4 className="font-bold text-[#183D2E] text-sm mb-1">{evt.title}</h4>
                      <p className="text-xs text-[#4E5F57] leading-relaxed">{evt.description}</p>
                    </div>

                    <div className="border-t border-[#7A553A]/15 pt-2 flex items-center justify-between text-xs text-[#7A553A]">
                      <span className="flex items-center gap-1 font-semibold text-[#183D2E]">
                        <Clock className="w-3.5 h-3.5" />
                        {evt.start_date} {evt.end_date ? `to ${evt.end_date}` : ''}
                      </span>
                      <span className="capitalize text-[11px] text-[#7A553A]">{evt.growth_stage} stage</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIFECYCLE STAGES */}
          {activeTab === 'stages' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#7A553A]/15">
                <h3 className="text-sm font-bold text-[#183D2E]">
                  {t('calendar.lifecycle_timeline_title')} ({cropName} &bull; Sown: {plantingDate} &bull; DAS {calendarData?.days_after_sowing})
                </h3>
                <span className="text-xs text-[#7A553A] font-semibold">
                  Total Duration: {calendarData?.total_duration_days} days
                </span>
              </div>

              {calendarData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {calendarData.lifecycle_stages.map((st) => (
                    <div
                      key={st.stage_id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        st.is_active
                          ? 'bg-[#FEF6E9] border-[#DA9A4C] shadow-sm ring-2 ring-[#DA9A4C]/50'
                          : 'bg-[#FAF8F5] border-[#7A553A]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          st.is_active ? 'bg-[#183D2E] text-white' : 'bg-[#7A553A]/15 text-[#7A553A]'
                        }`}>
                          {st.is_active ? 'Current' : `DAS ${st.start_das}`}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#183D2E] text-xs line-clamp-1">{st.stage_name_en}</h4>
                      <span className="text-[10px] text-[#7A553A] block mb-2">{st.start_date.slice(5)} to {st.end_date.slice(5)}</span>
                      <ul className="text-[10px] text-[#4E5F57] space-y-1">
                        {st.key_activities.slice(0, 2).map((act, i) => (
                          <li key={i} className="line-clamp-2">• {act}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEASONAL AWARENESS */}
          {activeTab === 'season' && (
            <div className="space-y-5">
              {seasonData && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7A553A]/15 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-[#183D2E]">
                        {seasonData.current_season} Season ({seasonData.season_period})
                      </h3>
                      <span className="text-xs text-[#7A553A]">
                        {language === 'te' ? seasonData.season_name_te : (language === 'hi' ? seasonData.season_name_hi : `${seasonData.current_season} Season`)} &bull; Current Month: {seasonData.current_month}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#7A553A]/20 text-[#7A553A]">
                      {t('calendar.imd_agromet_guidelines', { defaultValue: 'IMD Agromet Guidelines' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#7A553A]/20">
                      <span className="text-xs font-bold text-[#183D2E] block mb-1">Climatic Expectations:</span>
                      <ul className="text-xs text-[#4E5F57] space-y-1">
                        <li>• Temp: <strong>{seasonData.climate_expectations.temperature}</strong></li>
                        <li>• Rain: <strong>{seasonData.climate_expectations.rainfall}</strong></li>
                        <li>• Humidity: <strong>{seasonData.climate_expectations.humidity}</strong></li>
                      </ul>
                    </div>

                    <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#7A553A]/20">
                      <span className="text-xs font-bold text-[#183D2E] block mb-1">Typical Regional Crops:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {seasonData.typical_crops.map((c) => (
                          <span key={c} className="text-[11px] bg-white text-[#183D2E] font-semibold px-2 py-0.5 rounded-md border border-[#7A553A]/20">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <span className="text-xs font-bold text-amber-900 block mb-1">{t('calendar.primary_seasonal_risks_colon', { defaultValue: 'Primary Seasonal Risks:' })}</span>
                      <ul className="text-[11px] text-amber-800 space-y-1">
                        {seasonData.primary_risks.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: METHODOLOGY */}
          {activeTab === 'methodology' && (
            <div className="space-y-4">
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
                    "General agronomic calendar schedules (details to verify with local extension officer)",
                  ],
                  limitations: [
                    "Weather anomalies (monsoon delay, heavy unseasonal rain) may accelerate or retard phenological DAS by 5-7 days.",
                    "Notification alerts require active browser permission grant on your mobile device.",
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

export default CalendarPage;