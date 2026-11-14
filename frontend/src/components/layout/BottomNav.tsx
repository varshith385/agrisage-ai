import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  Leaf,
  Coins,
  MoreHorizontal,
  CloudSun,
  Store,
  Calendar,
  Sprout,
  FileText,
  Users,
  Layers,
  HelpCircle,
  Video,
  Sparkles,
  X,
  LogOut,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onStartTour?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onStartTour }) => {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isAuthenticated) return null;

  const primaryItems = [
    { to: '/dashboard', label: t('nav.dashboard', { defaultValue: 'Home' }), icon: LayoutDashboard },
    { to: '/irrigation', label: t('nav.irrigation', { defaultValue: 'Water' }), icon: Droplets },
    { to: '/disease', label: t('nav.disease', { defaultValue: 'Disease' }), icon: Leaf },
    { to: '/economics', label: t('nav.economics', { defaultValue: 'Profit' }), icon: Coins },
  ];

  const moreItems = [
    { to: '/setup', label: t('nav.weather', { defaultValue: 'Weather & Forecast' }), icon: CloudSun, desc: 'Agro-meteorology & 7-day rain forecast' },
    { to: '/market', label: t('nav.market', { defaultValue: 'Mandi Market' }), icon: Store, desc: 'Mandi arrivals, prices & buyer inquiries' },
    { to: '/calendar', label: t('nav.calendar', { defaultValue: 'Crop Calendar' }), icon: Calendar, desc: 'Crop schedule & field activity tracking' },
    { to: '/recommend', label: t('nav.recommend', { defaultValue: 'Crop Advisory' }), icon: Sprout, desc: 'AI soil & agro-climatic crop matching' },
    { to: '/schemes', label: t('nav.schemes', { defaultValue: 'Soil Card & Schemes' }), icon: FileText, desc: 'Soil nutrient calibration & advisory notices' },
    { to: '/farms', label: t('nav.farms', { defaultValue: 'My Farms' }), icon: Layers, desc: 'Parcel registration & mixed land tenure' },
    { to: '/community', label: t('nav.community', { defaultValue: 'Community & Map' }), icon: Users, desc: 'Farmer forum, machinery rental & pest outbreaks' },
    { to: '/how-to', label: 'How to Use AgriSage', icon: HelpCircle, desc: 'Illustrated step-by-step guidance' },
    { to: '/watch', label: 'Watch Video Guide', icon: Video, desc: 'Short video walkthrough for farmers' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#183D2E]/95 backdrop-blur-md text-[#FAF8F5] border-t border-[#0E241B] px-1 py-1 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `min-h-[48px] min-w-[56px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-[#DA9A4C] font-bold bg-[#265C46]/60 shadow-inner'
                      : 'text-[#FAF8F5]/80 hover:text-white font-medium'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}

          {/* "More" Sheet Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-label="More navigation pages"
            className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              moreOpen
                ? 'text-[#DA9A4C] font-bold bg-[#265C46]/60'
                : 'text-[#FAF8F5]/80 hover:text-white font-medium'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Sheet Overlay Modal */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All features menu"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn flex flex-col justify-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-[#FAF8F5] rounded-t-3xl border-t-2 border-[#183D2E] p-5 max-h-[85vh] overflow-y-auto text-[#1A2421] shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#7A553A]/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-[#183D2E]">
                  All Tools & Pages
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-full bg-white border border-[#7A553A]/30 text-[#183D2E] flex items-center justify-center hover:bg-[#EFE7DE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tour trigger in mobile sheet */}
            {onStartTour && (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onStartTour();
                }}
                className="w-full mb-3 min-h-[48px] p-3 rounded-2xl bg-gradient-to-r from-[#183D2E] to-[#265C46] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-[#DA9A4C]" />
                <span>Start Interactive Guided Tour</span>
              </button>
            )}

            {/* List of Other Pages */}
            <div className="grid grid-cols-1 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="min-h-[48px] p-3 rounded-2xl bg-white border border-[#7A553A]/15 hover:border-[#183D2E]/40 flex items-center gap-3 transition-all active:bg-[#EFE7DE]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#183D2E] border border-[#7A553A]/25 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#183D2E]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-bold text-sm text-[#183D2E] block">
                        {item.label}
                      </span>
                      <span className="text-xs text-[#4E5F57] truncate block">
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Logout button at bottom of sheet */}
            <div className="mt-4 pt-4 border-t border-[#7A553A]/20">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="w-full min-h-[48px] p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of AgriSage</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
