import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
  Droplets,
  CloudRain,
  Sprout,
  TrendingUp,
  Info,
  CalendarPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial } from '../context/PictorialContext';
import { PageHeader } from '../components/common/PageHeader';
import { PictorialTile } from '../components/common/PictorialTile';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { translateBackendString } from '../utils/safeTranslation';
import { scrollToSection } from '../utils/scrollToSection';
import {
  Reminder,
  ReminderSuggestion,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getReminderSuggestions,
  downloadIcsCalendarFile,
} from '../api/reminders';

export const RemindersPage: React.FC = () => {
  const { activeFarm } = useAuth();
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [suggestions, setSuggestions] = useState<ReminderSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'done'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3-Step Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('06:30');
  const [newRepeat, setNewRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load reminders and smart suggestions
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rems, suggs] = await Promise.all([
        getReminders({ farm_id: activeFarm?.id }),
        getReminderSuggestions(activeFarm?.id),
      ]);
      setReminders(rems);
      setSuggestions(suggs);
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarm?.id]);

  const now = new Date();

  // Filter into Upcoming, Overdue, Done
  const upcomingReminders = reminders.filter((r) => {
    if (r.status === 'done') return false;
    return new Date(r.due_at) >= now;
  });

  const overdueReminders = reminders.filter((r) => {
    if (r.status === 'done') return false;
    return new Date(r.due_at) < now;
  });

  const doneReminders = reminders.filter((r) => r.status === 'done');

  // Handle Mark Done
  const handleMarkDone = async (id: number) => {
    try {
      const updated = await updateReminder(id, { status: 'done' });
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // ignore
    }
  };

  // Handle Snooze
  const handleSnooze = async (id: number, days: number) => {
    try {
      const updated = await updateReminder(id, { snooze_days: days });
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // ignore
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  // One-tap Add Suggestion
  const handleAddSuggestion = async (sugg: ReminderSuggestion) => {
    try {
      const created = await createReminder({
        farm_id: activeFarm?.id,
        title: sugg.title,
        notes: sugg.notes,
        due_at: sugg.due_at,
        repeat: sugg.repeat,
        source: sugg.source,
      });
      setReminders((prev) => [...prev, created]);
      setSuggestions((prev) => prev.filter((s) => s.id !== sugg.id));
    } catch {
      // ignore
    }
  };

  // Submit 3-Step Wizard Form
  const handleCreateReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const combinedDateTime = new Date(`${newDate}T${newTime}:00`);
      const created = await createReminder({
        farm_id: activeFarm?.id,
        title: newTitle.trim(),
        notes: newNotes.trim() || undefined,
        due_at: combinedDateTime.toISOString(),
        repeat: newRepeat,
        source: 'user',
      });
      setReminders((prev) => [...prev, created]);
      setIsModalOpen(false);
      // Reset wizard
      setWizardStep(1);
      setNewTitle('');
      setNewNotes('');
      setNewRepeat('none');
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'irrigation_plan':
        return <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'weather_alert':
        return <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'calendar_stage':
        return <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'system_advisory':
        return <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-agri-green-600 dark:text-agri-green-400" />;
    }
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const activeList =
    activeTab === 'upcoming'
      ? upcomingReminders
      : activeTab === 'overdue'
      ? overdueReminders
      : doneReminders;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Bell}
        title={t('reminders.title', { defaultValue: 'Reminders & Field Alerts' })}
        purpose={t('reminders.purpose', { defaultValue: 'Track spray intervals, irrigation water days, and harvest calendar milestones' })}
        actions={
          <div className="flex items-center gap-2">
            <ReadAloudButton
              text={`Reminders overview: ${upcomingReminders.length} upcoming alerts, ${overdueReminders.length} overdue tasks, and ${suggestions.length} smart recommendations.`}
              label={t('reminders.listen_btn', { defaultValue: 'Listen' })}
            />
            <button
              onClick={() => {
                setWizardStep(1);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#1B5E3B] dark:bg-[#F2B01E] text-white dark:text-stone-900 font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('reminders.add_reminder_btn', { defaultValue: '+ Add Reminder' })}</span>
            </button>
          </div>
        }
      />

      {/* Pictorial Summary Section (Visible in Pictorial Mode) */}
      {isPictorial && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              {t('reminders.visual_summary_title', { defaultValue: 'Visual Summary' })}
            </h2>
            <ReadAloudButton
              text={`Reminders overview: ${upcomingReminders.length} upcoming alerts, ${overdueReminders.length} overdue tasks, and ${suggestions.length} smart recommendations.`}
              label={t('reminders.listen_btn', { defaultValue: 'Listen' })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-start">
            <PictorialTile
              title={t('reminders.upcoming_tasks', { defaultValue: 'Upcoming Tasks' })}
              phrase={`${upcomingReminders.length} ${translateBackendString('Scheduled', language)}`}
              status="good"
              statusWord={translateBackendString('Scheduled', language)}
              illustration={<Calendar className="w-16 h-16 text-emerald-600" />}
              onOpenDetails={() => {
                setActiveTab('upcoming');
                scrollToSection('tabs');
              }}
              detailsLabel={t('reminders.view_list_btn', { defaultValue: 'View List' })}
            />
            <PictorialTile
              title={t('reminders.overdue_tasks', { defaultValue: 'Overdue Tasks' })}
              phrase={`${overdueReminders.length} ${language === 'te' ? 'ఆలస్యం' : language === 'hi' ? 'अतिदेय' : 'Overdue'}`}
              status={overdueReminders.length > 0 ? 'attention' : 'good'}
              statusWord={overdueReminders.length > 0 ? (language === 'te' ? 'చర్య అవసరం' : language === 'hi' ? 'कार्रवाई आवश्यक' : 'Action Needed') : (language === 'te' ? 'సమయానికి నడుస్తోంది' : language === 'hi' ? 'समय पर' : 'On Schedule')}
              illustration={<AlertTriangle className="w-16 h-16 text-amber-600" />}
              onOpenDetails={() => {
                setActiveTab('overdue');
                scrollToSection('tabs');
              }}
              detailsLabel={t('reminders.resolve_btn', { defaultValue: 'Resolve' })}
            />
            <PictorialTile
              title={t('reminders.farm_suggestions', { defaultValue: 'Farm Suggestions' })}
              phrase={`${suggestions.length} ${language === 'te' ? 'సిద్ధం' : language === 'hi' ? 'तैयार' : 'Ready'}`}
              status="good"
              statusWord={translateBackendString('Ready', language)}
              illustration={<Sparkles className="w-16 h-16 text-sky-600" />}
              onOpenDetails={() => scrollToSection('suggestions')}
              detailsLabel={t('reminders.adopt_btn', { defaultValue: 'Adopt' })}
            />
          </div>
        </div>
      )}

      {/* Honest Delivery Limitation Banner */}
      <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            {t('reminders.delivery_notice_title', { defaultValue: 'Delivery Limitation Notice' })}
          </p>
          <p className="leading-relaxed">
            {t('reminders.delivery_notice_text', { defaultValue: 'Reminders trigger when you open the app or enable browser notifications. Direct SMS/WhatsApp alerts are planned for production rollout. Use the "Add to phone calendar" (.ics) button to sync any reminder directly into your Android / iOS calendar.' })}
          </p>
        </div>
      </div>

      {/* One-Tap Suggested Reminders Carousel / Grid */}
      {suggestions.length > 0 && (
        <div id="suggestions" tabIndex={-1} className="space-y-3 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-agri-green-600 dark:text-agri-green-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                {t('reminders.suggested_title', { defaultValue: 'Suggested for Your Farm (1-Tap Add)' })}
              </h2>
            </div>
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              {t('reminders.derived_live_telemetry', { defaultValue: 'Derived from live telemetry' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="bg-white dark:bg-[#14201A] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-agri-green-500 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-agri-green-800 dark:text-agri-green-300 bg-agri-green-50 dark:bg-agri-green-950/60 px-2 py-0.5 rounded-full border border-agri-green-200 dark:border-agri-green-800">
                      {getSourceIcon(sugg.source)}
                      <span>{sugg.badge_label}</span>
                    </span>
                    <span className="text-[10px] text-stone-400">{formatDueDate(sugg.due_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {sugg.title}
                  </h3>
                  {sugg.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {sugg.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 italic">{sugg.reason}</span>
                  <button
                    onClick={() => handleAddSuggestion(sugg)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-agri-green-700 hover:bg-agri-green-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'te' ? 'జోడించు' : language === 'hi' ? 'जोड़ें' : 'Add to Reminders'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs & Active Reminders List */}
      <div id="tabs" tabIndex={-1} className="bg-white dark:bg-[#121A15] border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 scroll-mt-24">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex space-x-2 sm:space-x-3">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-agri-green-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {t('reminders.tab_upcoming', { defaultValue: 'Upcoming' })} ({upcomingReminders.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'overdue'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {t('reminders.tab_overdue', { defaultValue: 'Overdue' })} ({overdueReminders.length})
            </button>
            <button
              onClick={() => setActiveTab('done')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'done'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {t('reminders.tab_done', { defaultValue: 'Done' })} ({doneReminders.length})
            </button>
          </div>

          <button
            onClick={() => {
              setWizardStep(1);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-agri-green-50 text-agri-green-800 dark:bg-agri-green-950/60 dark:text-agri-green-300 border border-agri-green-200 dark:border-agri-green-800 hover:bg-agri-green-100 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {t('reminders.add_reminder_btn', { defaultValue: '+ Add Reminder' })}
            </span>
          </button>
        </div>

        {/* Reminders List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-stone-400">{t('reminders.loading', { defaultValue: 'Loading reminders...' })}</div>
        ) : activeList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
              {activeTab === 'upcoming'
                ? t('reminders.no_upcoming', { defaultValue: 'No upcoming reminders scheduled' })
                : activeTab === 'overdue'
                ? t('reminders.no_overdue', { defaultValue: 'No overdue tasks! You are right on schedule.' })
                : t('reminders.no_done', { defaultValue: 'No completed tasks yet' })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeList.map((rem) => (
              <div
                key={rem.id}
                className="bg-stone-50 dark:bg-[#16221C] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-stone-300 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                      {getSourceIcon(rem.source)}
                      <span className="capitalize">{translateBackendString(rem.source.replace('_', ' '), language)}</span>
                    </span>
                    {rem.repeat !== 'none' && (
                      <span className="text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-full font-medium">
                        {t('reminders.repeat_label', { defaultValue: 'Repeat:' })} {translateBackendString(rem.repeat, language)}
                      </span>
                    )}
                    {rem.status === 'snoozed' && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                        {t('reminders.snoozed_badge', { defaultValue: 'Snoozed' })}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      rem.status === 'done'
                        ? 'line-through text-stone-400 dark:text-stone-500'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {translateBackendString(rem.title, language)}
                  </h3>

                  {rem.notes && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {translateBackendString(rem.notes, language)}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400 pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('reminders.due_label', { defaultValue: 'Due:' })} {formatDueDate(rem.due_at)} (Asia/Kolkata)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  {rem.status !== 'done' && (
                    <>
                      <button
                        onClick={() => handleMarkDone(rem.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                        title="Mark Done"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('reminders.mark_done_btn', { defaultValue: 'Mark Done' })}</span>
                      </button>

                      <button
                        onClick={() => handleSnooze(rem.id, 1)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white dark:bg-[#1E2E25] hover:bg-stone-100 dark:hover:bg-[#25392E] text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-medium transition-colors"
                        title="Snooze 1 Day"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>+1d</span>
                      </button>

                      <button
                        onClick={() => handleSnooze(rem.id, 2)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white dark:bg-[#1E2E25] hover:bg-stone-100 dark:hover:bg-[#25392E] text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-medium transition-colors"
                        title="Snooze 2 Days"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>+2d</span>
                      </button>
                    </>
                  )}

                  {/* Add to phone calendar (.ics download) */}
                  <button
                    onClick={() => downloadIcsCalendarFile(rem)}
                    className="p-1.5 bg-white dark:bg-[#1E2E25] hover:bg-stone-100 dark:hover:bg-[#25392E] text-sky-700 dark:text-sky-300 border border-stone-300 dark:border-stone-700 rounded-xl transition-colors"
                    title="Add to Phone / Google Calendar (.ics)"
                    aria-label="Add to Phone Calendar"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(rem.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Delete Reminder"
                    aria-label="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3-Step Wizard Modal for Creating a Reminder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#14201A] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5">
            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {language === 'te'
                    ? 'నూతన జ్ఞాపికను సృష్టించండి'
                    : language === 'hi'
                    ? 'नया स्मरणपत्र बनाएं'
                    : 'Create Field Reminder'}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep >= 1 ? 'bg-agri-green-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    1
                  </span>
                  <span className="text-xs font-medium text-stone-500">{t('reminders.step_what', { defaultValue: 'What' })}</span>
                  <span className="text-stone-300">→</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep >= 2 ? 'bg-agri-green-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    2
                  </span>
                  <span className="text-xs font-medium text-stone-500">{t('reminders.step_when', { defaultValue: 'When' })}</span>
                  <span className="text-stone-300">→</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep >= 3 ? 'bg-agri-green-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    3
                  </span>
                  <span className="text-xs font-medium text-stone-500">{t('reminders.step_repeat', { defaultValue: 'Repeat' })}</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: WHAT */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('reminders.task_title_label', { defaultValue: 'Task Title *' })}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('reminders.task_title_placeholder', { defaultValue: 'e.g. Irrigate cotton south parcel, Apply Stage 3 fertilizer' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#1B2720] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-agri-green-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('reminders.notes_label', { defaultValue: 'Guidance Notes (Optional)' })}
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder={t('reminders.notes_placeholder', { defaultValue: 'e.g. Check soil moisture probe before turning on the drip line' })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#1B2720] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-agri-green-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!newTitle.trim()}
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 bg-agri-green-700 hover:bg-agri-green-800 disabled:bg-stone-300 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    {t('reminders.next_when', { defaultValue: 'Next: When →' })}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: WHEN */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('reminders.due_date_label', { defaultValue: 'Due Date' })}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#1B2720] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-agri-green-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    {t('reminders.due_time_label', { defaultValue: 'Due Time (Asia/Kolkata)' })}
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#1B2720] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-agri-green-600"
                  />

                  {/* Farmer Time Presets */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setNewTime('06:00')}
                      className="px-2.5 py-1 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-agri-green-100 dark:hover:bg-agri-green-950 rounded-lg text-stone-700 dark:text-stone-300"
                    >
                      {t('reminders.preset_morning', { defaultValue: 'Morning (6:00 AM)' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTime('14:00')}
                      className="px-2.5 py-1 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-agri-green-100 dark:hover:bg-agri-green-950 rounded-lg text-stone-700 dark:text-stone-300"
                    >
                      {t('reminders.preset_afternoon', { defaultValue: 'Afternoon (2:00 PM)' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTime('17:00')}
                      className="px-2.5 py-1 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-agri-green-100 dark:hover:bg-agri-green-950 rounded-lg text-stone-700 dark:text-stone-300"
                    >
                      {t('reminders.preset_evening', { defaultValue: 'Evening (5:00 PM)' })}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm font-medium"
                  >
                    {t('reminders.back_btn', { defaultValue: '← Back' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 bg-agri-green-700 hover:bg-agri-green-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    {t('reminders.next_repeat', { defaultValue: 'Next: Repeat →' })}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: REPEAT */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right duration-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                    {t('reminders.repeat_frequency_label', { defaultValue: 'Repeat Frequency' })}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['none', 'daily', 'weekly'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewRepeat(opt)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          newRepeat === opt
                            ? 'border-agri-green-700 bg-agri-green-50 dark:bg-agri-green-950/60 text-agri-green-900 dark:text-agri-green-200 font-bold ring-2 ring-agri-green-600/30'
                            : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <p className="text-xs capitalize font-semibold">{t(`reminders.repeat_${opt}`, { defaultValue: opt })}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary card before confirmation */}
                <div className="p-3 bg-stone-50 dark:bg-[#18261F] rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{newTitle}</p>
                  <p className="text-stone-500">
                    {t('reminders.due_label', { defaultValue: 'Due:' })} {newDate} at {newTime} ({t(`reminders.repeat_${newRepeat}`, { defaultValue: newRepeat })})
                  </p>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-sm font-medium"
                  >
                    {t('reminders.back_btn', { defaultValue: '← Back' })}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCreateReminderSubmit}
                    className="px-5 py-2.5 bg-agri-green-700 hover:bg-agri-green-800 active:scale-95 disabled:bg-stone-300 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
                  >
                    {isSubmitting ? (language === 'te' ? 'భద్రపరుస్తోంది...' : language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : t('reminders.save_reminder_btn', { defaultValue: 'Confirm & Schedule' })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
