import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { Language } from '../../types/api';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-agri-green-800 text-agri-cream-50 shadow-md border-b border-agri-green-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-agri-gold-500 text-agri-green-900 flex items-center justify-center font-bold shadow-subtle group-hover:bg-agri-gold-400 transition-colors">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white block leading-none">
                {t('app.name')}
              </span>
              <span className="text-[10px] text-agri-gold-400 font-medium tracking-wide">
                {t('app.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/dashboard')
                    ? 'bg-agri-green-700 text-white shadow-inner'
                    : 'text-agri-cream-100 hover:bg-agri-green-700/60 hover:text-white'
                }`}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/setup"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/setup')
                    ? 'bg-agri-green-700 text-white shadow-inner'
                    : 'text-agri-cream-100 hover:bg-agri-green-700/60 hover:text-white'
                }`}
              >
                {t('nav.weather')}
              </Link>
              <Link
                to="/farms"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/farms')
                    ? 'bg-agri-green-700 text-white shadow-inner'
                    : 'text-agri-cream-100 hover:bg-agri-green-700/60 hover:text-white'
                }`}
              >
                {t('nav.farms')}
              </Link>
              <Link
                to="/disease"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/disease')
                    ? 'bg-agri-green-700 text-white shadow-inner'
                    : 'text-agri-cream-100 hover:bg-agri-green-700/60 hover:text-white'
                }`}
              >
                {t('nav.disease')}
              </Link>
              <Link
                to="/irrigation"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent('/irrigation')
                    ? 'bg-agri-green-700 text-white shadow-inner'
                    : 'text-agri-cream-100 hover:bg-agri-green-700/60 hover:text-white'
                }`}
              >
                {t('nav.irrigation')}
              </Link>
            </nav>
          )}

          {/* Right actions: Language switcher, User info, Logout */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-agri-green-900/80 rounded-xl p-1 border border-agri-green-700/60">
              <Globe className="w-3.5 h-3.5 text-agri-gold-400 ml-1.5 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                aria-label={t('common.select_language')}
              >
                <option value="en" className="text-stone-900">English</option>
                <option value="te" className="text-stone-900">తెలుగు</option>
                <option value="hi" className="text-stone-900">हिंदी</option>
              </select>
            </div>

            {/* Authenticated User pill */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-agri-gold-400 font-semibold">
                    {user.role} {user.is_demo_account && '• Demo'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title={t('nav.logout')}
                  className="p-2 text-agri-cream-200 hover:text-white hover:bg-agri-green-700 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-agri-gold-500 hover:bg-agri-gold-400 text-agri-green-900 font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                {t('auth.login_tab')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

