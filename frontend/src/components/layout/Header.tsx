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
    <header className="sticky top-0 z-40 bg-[#1B5E3B] text-white shadow-md border-b border-[#164E30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#F2B01E] text-[#1F2A24] flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <Sprout className="w-7 h-7" />
              </div>
              <div>
                <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white block leading-none">
                  {t('app.name')}
                </span>
                <span className="text-[12px] text-[#F2B01E] font-bold tracking-wide block mt-0.5">
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
              className="flex items-center bg-[#14462C] rounded-2xl p-1 border border-[#24784C]"
            >
              {(['en', 'te', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  aria-label={`Switch to ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}`}
                  className={`min-h-[48px] px-3 sm:px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    language === lang
                      ? 'bg-[#F2B01E] text-[#1F2A24] shadow-sm font-black'
                      : 'text-white/80 hover:text-white hover:bg-[#24784C]/60'
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
              className={`min-h-[48px] px-3.5 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all border-2 ${
                isPictorial
                  ? 'bg-[#F2B01E] text-[#1F2A24] border-[#F2B01E] shadow-sm font-black'
                  : 'bg-[#14462C] text-white border-[#24784C] hover:bg-[#24784C]'
              }`}
            >
              <ImageIcon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">
                {language === 'te' ? 'చిత్రాలు' : language === 'hi' ? 'चित्र' : 'Pictures'}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                isPictorial ? 'bg-[#1F2A24] text-[#F2B01E]' : 'bg-black/30 text-white'
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
                className="min-h-[48px] px-3.5 py-2 rounded-2xl text-sm font-bold bg-[#14462C] text-white border border-[#24784C] hover:bg-[#24784C] flex items-center gap-1.5 transition-all hidden sm:flex"
              >
                <Sparkles className="w-5 h-5 text-[#F2B01E]" />
                <span>Tour</span>
              </button>
            )}

            {/* Voice Assistant Header Button */}
            <button
              type="button"
              onClick={handleVoiceAssistantClick}
              aria-label="Ask Voice Assistant"
              title="Ask Voice Assistant in Telugu, Hindi or English"
              className="min-h-[48px] px-4 py-2.5 rounded-2xl text-sm font-bold bg-[#F2B01E] text-[#1F2A24] hover:bg-[#e09f14] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Mic className="w-5 h-5" />
              <span className="hidden md:inline font-black">Voice</span>
            </button>

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-bold text-white leading-tight">
                    {user?.full_name || 'Farmer'}
                  </span>
                  <span className="text-[11px] text-[#F2B01E] font-semibold">
                    {user?.role || 'Farmer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Logout"
                  title="Sign out of AgriSage AI"
                  className="min-h-[48px] min-w-[48px] p-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-[#24784C] transition-all flex items-center justify-center border border-transparent hover:border-[#24784C]"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="min-h-[48px] px-5 py-2.5 rounded-2xl text-sm font-bold bg-[#F2B01E] text-[#1F2A24] hover:bg-[#e09f14] transition-all flex items-center gap-2 font-black"
              >
                <UserIcon className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
