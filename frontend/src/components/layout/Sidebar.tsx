import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudSun,
  Droplets,
  Leaf,
  Coins,
  Store,
  Calendar,
  Sprout,
  FileText,
  Users,
  Layers,
  HelpCircle,
  Video,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePictorial } from '../../context/PictorialContext';

interface SidebarProps {
  onStartTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onStartTour }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isPictorial, togglePictorial } = usePictorial();

  if (!isAuthenticated) return null;

  const coreNav = [
    { to: '/dashboard', label: t('nav.dashboard', { defaultValue: 'Dashboard' }), icon: LayoutDashboard },
    { to: '/setup', label: t('nav.weather', { defaultValue: 'Weather & Setup' }), icon: CloudSun },
    { to: '/irrigation', label: t('nav.irrigation', { defaultValue: 'Irrigation & Water' }), icon: Droplets },
    { to: '/disease', label: t('nav.disease', { defaultValue: 'Disease Diagnosis' }), icon: Leaf },
    { to: '/economics', label: t('nav.economics', { defaultValue: 'Economics & Profit' }), icon: Coins },
  ];

  const toolsNav = [
    { to: '/farms', label: t('nav.farms', { defaultValue: 'My Farms' }), icon: Layers },
    { to: '/calendar', label: t('nav.calendar', { defaultValue: 'Crop Calendar' }), icon: Calendar },
    { to: '/recommend', label: t('nav.recommend', { defaultValue: 'Crop Advisory' }), icon: Sprout },
    { to: '/market', label: t('nav.market', { defaultValue: 'Mandi Market' }), icon: Store },
    { to: '/schemes', label: t('nav.schemes', { defaultValue: 'Soil Card & Schemes' }), icon: FileText },
    { to: '/community', label: t('nav.community', { defaultValue: 'Community & Map' }), icon: Users },
  ];

  const helpNav = [
    { to: '/how-to', label: t('nav.how_to', { defaultValue: 'How to Use' }), icon: HelpCircle },
    { to: '/watch', label: t('nav.watch', { defaultValue: 'Watch Video' }), icon: Video },
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex flex-col w-64 lg:w-72 bg-[#183D2E] text-[#FAF8F5] border-r border-[#183D2E]/80 shrink-0 select-none min-h-screen sticky top-0 h-screen overflow-y-auto"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#FAF8F5]/10">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-[#DA9A4C] text-[#0E241B] flex items-center justify-center font-bold shadow-subtle group-hover:scale-105 transition-transform shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white block leading-none">
              {t('app.name')}
            </span>
            <span className="text-[11px] text-[#DA9A4C] font-semibold tracking-wide block mt-1">
              {t('app.tagline')}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Advisory */}
        <div>
          <span className="px-3 text-[11px] font-black uppercase text-[#DA9A4C] tracking-wider block mb-2">
            Core Advisory
          </span>
          <div className="space-y-1">
            {coreNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-[#265C46] text-white shadow-sm border border-[#DA9A4C]/40'
                        : 'text-[#FAF8F5]/80 hover:bg-[#265C46]/50 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-[#DA9A4C] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Farm & Market Tools */}
        <div>
          <span className="px-3 text-[11px] font-black uppercase text-[#FAF8F5]/60 tracking-wider block mb-2">
            Farm Management
          </span>
          <div className="space-y-1">
            {toolsNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-[#265C46] text-white shadow-sm border border-[#DA9A4C]/40'
                        : 'text-[#FAF8F5]/80 hover:bg-[#265C46]/50 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-[#FAF8F5]/70 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Guidance */}
        <div>
          <span className="px-3 text-[11px] font-black uppercase text-[#FAF8F5]/60 tracking-wider block mb-2">
            Help & Guidance
          </span>
          <div className="space-y-1">
            {helpNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `min-h-[48px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-[#265C46] text-white shadow-sm border border-[#DA9A4C]/40'
                        : 'text-[#FAF8F5]/80 hover:bg-[#265C46]/50 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-[#FAF8F5]/70 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}

            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="min-h-[48px] w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 text-[#FAF8F5]/80 hover:bg-[#265C46]/50 hover:text-white transition-all text-left"
              >
                <Sparkles className="w-5 h-5 text-[#DA9A4C] shrink-0" />
                <span>Start Guided Tour</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Pictorial Mode Toggle & Bottom Footer Info */}
      <div className="p-4 border-t border-[#FAF8F5]/10 space-y-3 bg-[#0E241B]/40">
        <button
          type="button"
          onClick={togglePictorial}
          className={`min-h-[48px] w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
            isPictorial
              ? 'bg-[#DA9A4C] text-[#0E241B] border-[#DA9A4C]'
              : 'bg-[#183D2E] text-[#FAF8F5] border-[#FAF8F5]/20 hover:bg-[#265C46]'
          }`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Pictorial Mode</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            isPictorial ? 'bg-[#0E241B] text-[#DA9A4C]' : 'bg-[#FAF8F5]/10 text-white'
          }`}>
            {isPictorial ? 'ON' : 'OFF'}
          </span>
        </button>

        <div className="text-[10px] text-[#FAF8F5]/60 text-center">
          Yuktik 2026 &bull; FAO-56 Calibrated
        </div>
      </div>
    </aside>
  );
};
