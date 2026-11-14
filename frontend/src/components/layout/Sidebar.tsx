import React, { useState } from 'react';
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
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
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

  // Collapsible state: default collapsed (72px) on < 1440px; expanded (248px) at >= 1440px
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('agrisage_sidebar_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      if (typeof window !== 'undefined') {
        return window.innerWidth < 1440;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('agrisage_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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
    { to: '/reminders', label: 'Reminders', icon: Bell },
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
      className={`hidden md:flex flex-col bg-[#1B5E3B] dark:bg-[#121B16] text-white border-r border-[#164E30] dark:border-[#273B30] shrink-0 select-none min-h-screen sticky top-0 h-screen transition-all duration-300 z-30 ${
        isCollapsed ? 'w-[72px]' : 'w-[248px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-white/10 dark:border-white/5 flex items-center ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <Link
          to="/dashboard"
          title="Grow2Gain Dashboard"
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F2B01E] text-[#1F2A24] flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-display text-lg font-black tracking-tight text-white block leading-tight truncate">
                {t('app.name')}
              </span>
              <span className="text-[11px] text-[#F2B01E] font-bold tracking-wide block truncate">
                {t('app.tagline')}
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Collapse sidebar to icon rail"
            title="Collapse sidebar (saves screen space)"
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-[#24784C] dark:hover:bg-[#18241E] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed, show expand button at top */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-white/10 dark:border-white/5">
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar navigation"
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-[#24784C] dark:hover:bg-[#18241E] transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
        {/* Core Advisory */}
        <div>
          {!isCollapsed && (
            <span className="px-2.5 text-[11px] font-black uppercase text-[#F2B01E] tracking-wider block mb-1.5">
              Core Advisory
            </span>
          )}
          <div className="space-y-0.5">
            {coreNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `min-h-[44px] rounded-xl text-xs font-bold flex items-center transition-all ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                    } ${
                      isActive
                        ? 'bg-[#24784C] dark:bg-[#1B5E3B] text-white shadow-xs border border-[#F2B01E]/60 ring-1 ring-[#F2B01E]/20'
                        : 'text-white/80 hover:bg-[#24784C]/50 dark:hover:bg-[#18241E] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-[#F2B01E] shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Farm Management */}
        <div>
          {!isCollapsed && (
            <span className="px-2.5 text-[11px] font-black uppercase text-white/60 tracking-wider block mb-1.5">
              Farm Management
            </span>
          )}
          <div className="space-y-0.5">
            {toolsNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `min-h-[44px] rounded-xl text-xs font-bold flex items-center transition-all ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                    } ${
                      isActive
                        ? 'bg-[#24784C] dark:bg-[#1B5E3B] text-white shadow-xs border border-[#F2B01E]/60 ring-1 ring-[#F2B01E]/20'
                        : 'text-white/80 hover:bg-[#24784C]/50 dark:hover:bg-[#18241E] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-white/80 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Guidance */}
        <div>
          {!isCollapsed && (
            <span className="px-2.5 text-[11px] font-black uppercase text-white/60 tracking-wider block mb-1.5">
              Help & Tour
            </span>
          )}
          <div className="space-y-0.5">
            {helpNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `min-h-[44px] rounded-xl text-xs font-bold flex items-center transition-all ${
                      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                    } ${
                      isActive
                        ? 'bg-[#24784C] dark:bg-[#1B5E3B] text-white shadow-xs border border-[#F2B01E]/60'
                        : 'text-white/80 hover:bg-[#24784C]/50 dark:hover:bg-[#18241E] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-white/80 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}

            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                title={isCollapsed ? 'Start Guided Tour' : undefined}
                className={`min-h-[44px] w-full rounded-xl text-xs font-bold flex items-center text-white/80 hover:bg-[#24784C]/50 dark:hover:bg-[#18241E] hover:text-white transition-all text-left ${
                  isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#F2B01E] shrink-0" />
                {!isCollapsed && <span>Guided Tour</span>}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Pictorial Mode Toggle & Bottom Footer Info */}
      <div className={`p-3 border-t border-white/10 dark:border-white/5 bg-[#14462C] dark:bg-[#0D1410] ${
        isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'
      }`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={togglePictorial}
            aria-label="Toggle pictorial visual mode"
            title={`Pictorial Mode: ${isPictorial ? 'ON' : 'OFF'} (Click to toggle)`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
              isPictorial
                ? 'bg-[#F2B01E] text-[#1F2A24] border-[#F2B01E]'
                : 'bg-[#1B5E3B] text-white/80 border-white/20 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePictorial}
            className={`min-h-[42px] w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
              isPictorial
                ? 'bg-[#F2B01E] text-[#1F2A24] border-[#F2B01E] font-black'
                : 'bg-[#1B5E3B] text-white border-white/20 hover:bg-[#24784C]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Pictorial Mode</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              isPictorial ? 'bg-[#1F2A24] text-[#F2B01E]' : 'bg-black/20 text-white'
            }`}>
              {isPictorial ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {!isCollapsed && (
          <div className="text-[10px] text-white/50 text-center tracking-tight">
            Grow2Gain &bull; FAO-56 Calibrated
          </div>
        )}
      </div>
    </aside>
  );
};
