import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  LogOut,
  User as UserIcon,
  Mic,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePictorial } from '../../context/PictorialContext';
import { Language } from '../../types/api';

interface HeaderProps {
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartTour }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { isPictorial, togglePictorial } = usePictorial();

  const handleVoiceAssistantClick = () => {
    // Focus or open global voice assistant
    const fab = document.querySelector('#global-voice-assistant-slot button') as HTMLButtonElement | null;
    if (fab) {
      fab.click();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#183D2E] text-[#FAF8F5] shadow-md border-b border-[#0E241B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Brand Logo (especially prominent on mobile since sidebar is hidden) */}
          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-[#DA9A4C] text-[#0E241B] flex items-center justify-center font-bold shadow-subtle group-hover:scale-105 transition-transform shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white block leading-none">
                  {t('app.name')}
                </span>
                <span className="text-[10px] text-[#DA9A4C] font-semibold tracking-wide block mt-0.5">
                  {t('app.tagline')}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Controls: Language Switcher, Pictorial Toggle, Tour, Voice, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Buttons (min 48px touch targets) */}
            <div
              role="group"
              aria-label="Language selection"
              className="flex items-center bg-[#0E241B]/80 rounded-xl p-1 border border-[#265C46]"
            >
              {(['en', 'te', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  aria-label={`Switch to ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}`}
                  className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    language === lang
                      ? 'bg-[#DA9A4C] text-[#0E241B] shadow-sm'
                      : 'text-[#FAF8F5]/80 hover:text-white hover:bg-[#265C46]/50'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </button>
              ))}
            </div>

            {/* Pictorial Mode Toggle Button */}
            <button
              type="button"
              onClick={togglePictorial}
              aria-pressed={isPictorial}
              aria-label="Toggle pictorial visual mode"
              title="Pictorial visual mode with large icons and simple text"
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isPictorial
                  ? 'bg-[#DA9A4C] text-[#0E241B] border-[#DA9A4C] shadow-sm'
                  : 'bg-[#265C46]/50 text-[#FAF8F5] border-[#265C46] hover:bg-[#265C46]'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {language === 'te' ? 'చిత్రాలు' : language === 'hi' ? 'चित्र' : 'Pictorial'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isPictorial ? 'bg-[#0E241B] text-[#DA9A4C]' : 'bg-black/20 text-[#FAF8F5]'
              }`}>
                {isPictorial ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Guided Tour Trigger Button */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                aria-label="Start guided tour"
                title="Start guided walkthrough of AgriSage AI"
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-[#265C46]/50 text-[#FAF8F5] border border-[#265C46] hover:bg-[#265C46] flex items-center gap-1.5 transition-all hidden sm:flex"
              >
                <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
                <span>Tour</span>
              </button>
            )}

            {/* Voice Assistant Header Button */}
            <button
              type="button"
              onClick={handleVoiceAssistantClick}
              aria-label="Ask Voice Assistant"
              title="Ask Voice Assistant in Telugu, Hindi or English"
              className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden md:inline">Voice</span>
            </button>

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user?.full_name || 'Farmer'}
                  </span>
                  <span className="text-[10px] text-[#DA9A4C] font-semibold">
                    {user?.role || 'Farmer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Logout"
                  title="Sign out of AgriSage AI"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#FAF8F5]/80 hover:text-white hover:bg-[#265C46] transition-all flex items-center justify-center border border-transparent hover:border-[#265C46]"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[#DA9A4C] text-[#0E241B] hover:bg-[#F5C989] transition-all flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
