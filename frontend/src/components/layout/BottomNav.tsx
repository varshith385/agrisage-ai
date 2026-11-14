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
  Bell,
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
    { to: '/recommend', label: t('nav.recommend', { defaultValue: 'Advisory' }), icon: Sprout },
    { to: '/dashboard', label: t('nav.dashboard', { defaultValue: 'Home' }), icon: LayoutDashboard },
    { to: '/irrigation', label: t('nav.irrigation', { defaultValue: 'Water' }), icon: Droplets },
    { to: '/disease', label: t('nav.disease', { defaultValue: 'Disease' }), icon: Leaf },
    { to: '/economics', label: t('nav.economics', { defaultValue: 'Profit' }), icon: Coins },
  ];

  const moreItems = [
    { to: '/setup', label: t('nav.weather', { defaultValue: 'Weather & Forecast' }), icon: CloudSun, desc: 'Agro-meteorology & 7-day rain forecast' },
    { to: '/market', label: t('nav.market', { defaultValue: 'Mandi Market' }), icon: Store, desc: 'Mandi arrivals, prices & buyer inquiries' },
    { to: '/calendar', label: t('nav.calendar', { defaultValue: 'Crop Calendar' }), icon: Calendar, desc: 'Crop schedule & field activity tracking' },
    { to: '/schemes', label: t('nav.schemes', { defaultValue: 'Soil Card & Schemes' }), icon: FileText, desc: 'Soil nutrient calibration & advisory notices' },
    { to: '/farms', label: t('nav.farms', { defaultValue: 'My Farms' }), icon: Layers, desc: 'Parcel registration & mixed land tenure' },
    { to: '/reminders', label: 'Reminders & Alerts', icon: Bell, desc: 'Task scheduling, irrigation alarms & field alerts' },
    { to: '/community', label: t('nav.community', { defaultValue: 'Community & Map' }), icon: Users, desc: 'Farmer forum, machinery rental & pest outbreaks' },
    { to: '/how-to', label: t('nav.how_to', { defaultValue: 'How to Use Grow2Gain' }), icon: HelpCircle, desc: 'Illustrated step-by-step guidance' },
    { to: '/watch', label: 'Watch Video Guide', icon: Video, desc: 'Short video walkthrough for farmers' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B5E3B]/95 dark:bg-[#121B16]/95 backdrop-blur-md text-white border-t border-[#164E30] dark:border-[#273B30] px-1 py-1.5 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `min-h-[52px] min-w-[60px] flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
                    isActive
                      ? 'text-[#F2B01E] font-black bg-[#24784C] dark:bg-[#1B5E3B] shadow-inner'
                      : 'text-white/80 hover:text-white font-semibold'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[12px] tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}

          {/* "More" Sheet Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-label="More navigation pages"
            className={`min-h-[52px] min-w-[60px] flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
              moreOpen
                ? 'text-[#F2B01E] font-black bg-[#24784C] dark:bg-[#1B5E3B]'
                : 'text-white/80 hover:text-white font-semibold'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[12px] tracking-tight">More</span>
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
            className="bg-[#FFFDF8] dark:bg-[#18241E] rounded-t-3xl border-t-2 border-[#1B5E3B] p-5 max-h-[85vh] overflow-y-auto text-[#1F2A24] dark:text-[#F2F5F3] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D4C7] dark:border-[#273B30]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#F2B01E] text-[#1F2A24] flex items-center justify-center font-black shadow-sm">
                  <Sprout className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg font-bold text-[#1B5E3B] dark:text-[#F2B01E]">
                  All Tools & Pages
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-full bg-white dark:bg-[#121B16] border border-[#D9D4C7] dark:border-[#273B30] text-[#1F2A24] dark:text-[#F2F5F3] flex items-center justify-center hover:bg-[#F0ECE1] dark:hover:bg-stone-800"
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
                className="w-full mb-3 min-h-[52px] p-3 rounded-2xl bg-[#1B5E3B] hover:bg-[#24784C] text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-[#F2B01E]" />
                <span>Start Interactive Guided Tour</span>
              </button>
            )}

            {/* List of Other Pages */}
            <div className="grid grid-cols-1 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="min-h-[52px] p-3 rounded-2xl bg-white border border-[#D9D4C7] hover:border-[#1B5E3B] flex items-center gap-3 transition-all active:bg-[#F0ECE1]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFFDF8] text-[#1B5E3B] border border-[#D9D4C7] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#1B5E3B]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-bold text-[16px] text-[#1B5E3B] block">
                        {item.label}
                      </span>
                      <span className="text-[14px] text-[#4A5750] truncate block">
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Logout button at bottom of sheet */}
            <div className="mt-4 pt-4 border-t border-[#D9D4C7]">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="w-full min-h-[52px] p-3 rounded-2xl border border-red-300 bg-red-50 text-red-800 font-bold text-[16px] flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Grow2Gain</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
