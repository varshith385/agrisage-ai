import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Sprout,
  ChevronDown,
  Globe,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Sparkles,
  HelpCircle,
  Volume2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePictorial } from '../../context/PictorialContext';
import { CommandPalette } from '../common/CommandPalette';
import { Language } from '../../types/api';
import { speakText, loadVoices, findVoiceForLanguage, SupportedLanguage } from '../../services/speech';
import { getReminders } from '../../api/reminders';

interface HeaderProps {
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartTour }) => {
  const { user, isAuthenticated, logout, farms, activeFarm, activeFarmId, setActiveFarmId } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { isPictorial, togglePictorial, alwaysShowListen, toggleAlwaysShowListen } = usePictorial();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown states
  const [commandOpen, setCommandOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [voiceTestStatus, setVoiceTestStatus] = useState<string | null>(null);
  const [dueReminderCount, setDueReminderCount] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      getReminders({ farm_id: activeFarm?.id, status: 'pending' })
        .then((rems) => {
          setDueReminderCount(rems.length);
        })
        .catch(() => { });
    }
  }, [isAuthenticated, activeFarm?.id]);

  const langRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangDropdownOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title / breadcrumb from current path
  const getPageTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return t('nav.dashboard', { defaultValue: 'Dashboard' });
    if (path.startsWith('/setup')) return t('nav.weather', { defaultValue: 'Weather & Setup' });
    if (path.startsWith('/irrigation')) return t('nav.irrigation', { defaultValue: 'Irrigation & Water' });
    if (path.startsWith('/disease')) return t('nav.disease', { defaultValue: 'Disease Diagnosis' });
    if (path.startsWith('/economics')) return t('nav.economics', { defaultValue: 'Economics & Profit' });
    if (path.startsWith('/farms')) return t('nav.farms', { defaultValue: 'My Farms' });
    if (path.startsWith('/calendar')) return t('nav.calendar', { defaultValue: 'Crop Calendar' });
    if (path.startsWith('/recommend')) return t('nav.recommend', { defaultValue: 'Crop Advisory' });
    if (path.startsWith('/market')) return t('nav.market', { defaultValue: 'Mandi Market' });
    if (path.startsWith('/schemes')) return t('nav.schemes', { defaultValue: 'Soil Card & Schemes' });
    if (path.startsWith('/community')) return t('nav.community', { defaultValue: 'Community & Map' });
    if (path.startsWith('/reminders')) return 'Reminders';
    if (path.startsWith('/how-to')) return t('nav.how_to', { defaultValue: 'How to Use' });
    if (path.startsWith('/watch')) return t('nav.watch', { defaultValue: 'Watch Video' });
    return 'Grow2Gain';
  };

  const handleTestVoice = async (langCode: SupportedLanguage) => {
    const phrases: Record<SupportedLanguage, string> = {
      en: 'Grow2Gain voice test: system is ready to read agronomic advisories.',
      te: 'వ్యవసాయ సలహా ఆడియో పరీక్ష: Grow2Gain వాయిస్ సిద్ధంగా ఉంది.',
      hi: 'कृषि सलाहकार ऑडियो परीक्षण: Grow2Gain आवाज तैयार है।',
    };
    setVoiceTestStatus(`Finding ${langCode.toUpperCase()} voice...`);
    const voices = await loadVoices();
    const voice = findVoiceForLanguage(langCode, voices);
    if (!voice && langCode !== 'en') {
      const msg = langCode === 'te'
        ? 'No Telugu voice found on device (Install in Windows Settings or try Edge)'
        : 'No Hindi voice found on device (Install in Windows Settings or try Edge)';
      setVoiceTestStatus(msg);
      setTimeout(() => setVoiceTestStatus(null), 5000);
      return;
    }
    const voiceLabel = voice ? voice.name : 'Default voice';
    setVoiceTestStatus(`Found: ${voiceLabel}`);
    speakText(phrases[langCode], langCode, {
      customVoice: voice,
      onStart: () => setVoiceTestStatus(`Playing: ${voiceLabel}`),
      onEnd: () => setTimeout(() => setVoiceTestStatus(null), 3500),
      onError: (err) => {
        if (String(err?.message || '').includes('NO_VOICE_FOR_LANG')) {
          setVoiceTestStatus(`No ${langCode.toUpperCase()} voice installed in browser.`);
        } else {
          setVoiceTestStatus('Audio unavailable');
        }
        setTimeout(() => setVoiceTestStatus(null), 3500);
      },
    });
  };

  return (
    <>
      <header
        aria-label="Application header"
        className="sticky top-0 z-40 h-14 max-h-[56px] bg-[#1B5E3B] dark:bg-[#121B16] text-white shadow-xs border-b border-[#164E30] dark:border-[#273B30] flex items-center select-none"
      >
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
          {/* Left: Breadcrumb / Page Title */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <h1 className="font-display text-sm sm:text-lg font-bold text-white tracking-tight truncate max-w-[90px] xs:max-w-[120px] sm:max-w-none">
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          {/* Center / Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 1. Global "Go to..." Search Palette Button */}
            <button
              id="agrisage-command-palette-btn"
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette (Ctrl+K)"
              title="Search pages, tools, and actions (Ctrl+K)"
              className="min-h-[36px] sm:min-h-[38px] p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#14462C] dark:bg-[#18241E] text-white/90 hover:text-white hover:bg-[#24784C] dark:hover:bg-[#273B30] border border-[#24784C]/60 dark:border-[#273B30] flex items-center gap-2 transition-all text-xs font-semibold"
            >
              <Search className="w-4 h-4 text-[#F2B01E] shrink-0" />
              <span className="hidden md:inline">Go to...</span>
              <kbd className="hidden sm:inline text-[10px] bg-black/25 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-white/70">
                Ctrl+K
              </kbd>
            </button>

            {/* 2. Active Farm Chip with Switcher */}
            {isAuthenticated && (
              <div className="relative flex items-center bg-[#14462C] dark:bg-[#18241E] rounded-xl px-2 sm:px-2.5 py-1 border border-[#24784C]/60 dark:border-[#273B30] min-h-[36px] sm:min-h-[38px] max-w-[85px] xs:max-w-[120px] sm:max-w-[220px]">
                <Sprout className="w-3.5 h-3.5 text-[#F2B01E] shrink-0 mr-1 sm:mr-1.5" />
                <select
                  value={activeFarmId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__new__') {
                      navigate('/farms');
                    } else {
                      setActiveFarmId(Number(val));
                    }
                  }}
                  aria-label={t('farms.switch_farm', { defaultValue: 'Switch Farm' })}
                  title="Switch active farm holding"
                  className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer truncate max-w-[55px] xs:max-w-[85px] sm:max-w-[170px]"
                >
                  {farms.length === 0 ? (
                    <option value="" className="text-stone-900 bg-white">
                      {t('farms.no_farm_selected', { defaultValue: 'No farm' })}
                    </option>
                  ) : (
                    farms.map((f) => (
                      <option key={f.id} value={f.id} className="text-stone-900 bg-white">
                        {f.name} ({f.area} ac)
                      </option>
                    ))
                  )}
                  <option value="__new__" className="text-stone-900 bg-white font-bold">
                    + {t('farms.register_new', { defaultValue: 'Register Farm' })}
                  </option>
                </select>
              </div>
            )}

            {/* 3. Compact Language Dropdown */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                aria-expanded={langDropdownOpen}
                aria-label="Language selection"
                title="Select language"
                className="min-h-[36px] sm:min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#14462C] dark:bg-[#18241E] text-white hover:bg-[#24784C] dark:hover:bg-[#273B30] border border-[#24784C]/60 dark:border-[#273B30] flex items-center gap-1 sm:gap-1.5 transition-all text-xs font-bold"
              >
                <Globe className="w-3.5 h-3.5 text-[#F2B01E] shrink-0" />
                <span>
                  {language === 'en' ? 'EN' : language === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </span>
                <ChevronDown className="hidden xs:inline w-3 h-3 text-white/70 shrink-0" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#18241E] text-[#1F2A24] dark:text-[#F2F5F3] rounded-2xl border border-[#D9D4C7] dark:border-[#273B30] shadow-xl py-1 z-50 animate-scaleUp">
                  {[
                    { code: 'en', label: 'English', native: 'EN' },
                    { code: 'te', label: 'తెలుగు', native: 'Telugu' },
                    { code: 'hi', label: 'हिन्दी', native: 'Hindi' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code as Language);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors ${language === l.code
                        ? 'bg-[#1B5E3B]/10 dark:bg-[#1B5E3B]/30 text-[#1B5E3B] dark:text-[#F2B01E]'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                    >
                      <div>
                        <span>{l.label}</span>
                        <span className="block text-[10px] text-[#4A5750] dark:text-[#9EB0A5] font-normal">
                          {l.native}
                        </span>
                      </div>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-[#1B5E3B] dark:text-[#F2B01E]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Reminders Bell with Count Badge */}
            <Link
              to="/reminders"
              aria-label={`View reminders and field tasks (${dueReminderCount} pending)`}
              title={`Reminders & field alerts (${dueReminderCount} pending)`}
              className="min-h-[36px] sm:min-h-[38px] min-w-[36px] sm:min-w-[38px] relative p-2 rounded-xl text-white/90 hover:text-white hover:bg-[#14462C] dark:hover:bg-[#18241E] transition-all flex items-center justify-center"
            >
              <Bell className="w-4 h-4 text-white" />
              {dueReminderCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F2B01E] text-stone-900 text-[10px] font-black flex items-center justify-center ring-2 ring-[#1B5E3B] dark:ring-[#121B16] shadow-xs">
                  {dueReminderCount > 9 ? '9+' : dueReminderCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F2B01E]/60 ring-2 ring-[#1B5E3B] dark:ring-[#121B16]" />
              )}
            </Link>

            {/* 5. Dark Mode Toggle (Icon Only) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
              className="min-h-[36px] sm:min-h-[38px] min-w-[36px] sm:min-w-[38px] p-2 rounded-xl text-white/90 hover:text-white hover:bg-[#14462C] dark:hover:bg-[#18241E] transition-all flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#F2B01E]" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </button>

            {/* 6. User Avatar Menu (Profile, How-To, Tour, Logout) */}
            {isAuthenticated ? (
              <div ref={avatarRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((prev) => !prev)}
                  aria-expanded={avatarMenuOpen}
                  aria-label="User account menu"
                  title="Account and settings"
                  className="min-h-[36px] sm:min-h-[38px] min-w-[36px] sm:min-w-[38px] p-1.5 rounded-xl bg-[#F2B01E] text-[#1F2A24] font-black text-xs hover:bg-[#E09F14] shadow-xs flex items-center justify-center transition-all"
                >
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#18241E] text-[#1F2A24] dark:text-[#F2F5F3] rounded-2xl border border-[#D9D4C7] dark:border-[#273B30] shadow-xl py-2 z-50 animate-scaleUp">
                    {/* User Profile Header */}
                    <div className="px-4 py-2 border-b border-[#D9D4C7]/50 dark:border-[#273B30]">
                      <div className="font-bold text-sm truncate">{user?.full_name || 'Farmer'}</div>
                      <div className="text-[11px] text-[#4A5750] dark:text-[#9EB0A5] truncate">{user?.email || 'User'}</div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/farms"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                      >
                        <Sprout className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
                        <span>Farm Profile & Holdings</span>
                      </Link>

                      <Link
                        to="/how-to"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
                        <span>How to Use Guide</span>
                      </Link>

                      {onStartTour && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarMenuOpen(false);
                            onStartTour();
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-[#F2B01E]" />
                          <span>Start Guided Tour</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          togglePictorial();
                          setAvatarMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
                          <span>Pictorial Visual Mode</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPictorial ? 'bg-[#F2B01E] text-[#1F2A24]' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}>
                          {isPictorial ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleAlwaysShowListen();
                        }}
                        aria-pressed={alwaysShowListen}
                        className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Volume2 className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E]" />
                          <span>{t('pictorial.always_show_listen', { defaultValue: 'Always show Listen buttons' })}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${alwaysShowListen ? 'bg-[#1B5E3B] text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}>
                          {alwaysShowListen ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>

                    {/* Test Voice Section */}
                    <div className="pt-2 border-t border-[#D9D4C7]/50 dark:border-[#273B30] px-4 py-1.5">
                      <div className="text-[11px] font-bold text-[#4A5750] dark:text-[#9EB0A5] mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-[#F2B01E]" />
                          <span>Test Browser Voice</span>
                        </span>
                        {voiceTestStatus && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal truncate max-w-[120px]">
                            {voiceTestStatus}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTestVoice('en')}
                          className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-bold text-center"
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTestVoice('te')}
                          className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-bold text-center"
                        >
                          తెలుగు
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTestVoice('hi')}
                          className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-bold text-center"
                        >
                          हिन्दी
                        </button>
                      </div>
                    </div>

                    {/* Sign out */}
                    <div className="pt-1.5 border-t border-[#D9D4C7]/50 dark:border-[#273B30] px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F2B01E] text-[#1F2A24] font-bold text-xs hover:bg-[#E09F14] transition-all shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onStartTour={onStartTour}
      />
    </>
  );
};
