import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  Sun,
  Moon,
  Globe,
  Bell,
  Mic,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePictorial } from '../../context/PictorialContext';
import { Language } from '../../types/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
}

interface CommandItem {
  id: string;
  category: 'pages' | 'actions';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onStartTour }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { isPictorial, togglePictorial } = usePictorial();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open palette
          const btn = document.getElementById('agrisage-command-palette-btn');
          if (btn) btn.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = [
    // Core Pages
    {
      id: 'page-dashboard',
      category: 'pages',
      title: t('nav.dashboard', { defaultValue: 'Dashboard' }),
      subtitle: 'Overview, health score and daily action item',
      icon: LayoutDashboard,
      keywords: 'dashboard home health today action డాష్‌బోర్డ్',
      onSelect: () => { navigate('/dashboard'); onClose(); },
    },
    {
      id: 'page-weather',
      category: 'pages',
      title: t('nav.weather', { defaultValue: 'Weather & Setup' }),
      subtitle: 'Live Open-Meteo temperature, rain and ET0 forecast',
      icon: CloudSun,
      keywords: 'weather forecast rain et0 temperature setup వాతావరణం',
      onSelect: () => { navigate('/setup'); onClose(); },
    },
    {
      id: 'page-irrigation',
      category: 'pages',
      title: t('nav.irrigation', { defaultValue: 'Irrigation & Water' }),
      subtitle: 'FAO-56 dual crop coefficient water budgeting',
      icon: Droplets,
      keywords: 'irrigation water depth fao56 soil depletion schedule నీటి పారుదల',
      onSelect: () => { navigate('/irrigation'); onClose(); },
    },
    {
      id: 'page-disease',
      category: 'pages',
      title: t('nav.disease', { defaultValue: 'Disease Diagnosis' }),
      subtitle: 'MobileNetV2 leaf disease detection and treatment',
      icon: Leaf,
      keywords: 'disease diagnosis leaf scan pest mobilenetv2 తెగులు',
      onSelect: () => { navigate('/disease'); onClose(); },
    },
    {
      id: 'page-economics',
      category: 'pages',
      title: t('nav.economics', { defaultValue: 'Economics & Profit' }),
      subtitle: 'Cost breakdown, net profit simulator and crop comparison',
      icon: Coins,
      keywords: 'economics profit cost revenue calculator what-if ఆర్ధిక లాభం',
      onSelect: () => { navigate('/economics'); onClose(); },
    },
    {
      id: 'page-farms',
      category: 'pages',
      title: t('nav.farms', { defaultValue: 'My Farms' }),
      subtitle: 'Manage land holdings, acreage, soil types and crops',
      icon: Layers,
      keywords: 'farms parcel land registration soil acreage holding నా పొలాలు',
      onSelect: () => { navigate('/farms'); onClose(); },
    },
    {
      id: 'page-calendar',
      category: 'pages',
      title: t('nav.calendar', { defaultValue: 'Crop Calendar' }),
      subtitle: 'GDD crop growth stages and agronomic activity timeline',
      icon: Calendar,
      keywords: 'calendar stage gdd milestone tasks schedule పంట క్యాలెండర్',
      onSelect: () => { navigate('/calendar'); onClose(); },
    },
    {
      id: 'page-recommend',
      category: 'pages',
      title: t('nav.recommend', { defaultValue: 'Crop Advisory' }),
      subtitle: 'RandomForest crop suitability matching soil and climate',
      icon: Sprout,
      keywords: 'crop advisory recommendation suitability matching పంట సలహా',
      onSelect: () => { navigate('/recommend'); onClose(); },
    },
    {
      id: 'page-market',
      category: 'pages',
      title: t('nav.market', { defaultValue: 'Mandi Market' }),
      subtitle: 'Transport-adjusted net payout mandi rankings',
      icon: Store,
      keywords: 'mandi market price apmc modal net payout transport మండి',
      onSelect: () => { navigate('/market'); onClose(); },
    },
    {
      id: 'page-schemes',
      category: 'pages',
      title: t('nav.schemes', { defaultValue: 'Soil Card & Schemes' }),
      subtitle: 'Soil card parser and planned government schemes info',
      icon: FileText,
      keywords: 'schemes soil card welfare npk extraction subsidies సాయిల్ కార్డ్',
      onSelect: () => { navigate('/schemes'); onClose(); },
    },
    {
      id: 'page-community',
      category: 'pages',
      title: t('nav.community', { defaultValue: 'Community & Map' }),
      subtitle: 'Shared machinery rental, freight pool and pest outbreak map',
      icon: Users,
      keywords: 'community machinery tractor rental outbreak map pooling సంఘం',
      onSelect: () => { navigate('/community'); onClose(); },
    },
    {
      id: 'page-reminders',
      category: 'pages',
      title: 'Reminders & Notifications',
      subtitle: 'Automated field tasks, spray windows and irrigation alarms',
      icon: Bell,
      keywords: 'reminders notifications tasks alerts bell alarms జ్ఞాపికలు स्मरणपत्र',
      onSelect: () => { navigate('/reminders'); onClose(); },
    },
    {
      id: 'page-how-to',
      category: 'pages',
      title: t('nav.how_to', { defaultValue: 'How to Use' }),
      subtitle: 'Step-by-step visual guides for all core tools',
      icon: HelpCircle,
      keywords: 'how to help guide tutorial walk-through ఎలా ఉపయోగించాలి',
      onSelect: () => { navigate('/how-to'); onClose(); },
    },
    {
      id: 'page-watch',
      category: 'pages',
      title: t('nav.watch', { defaultValue: 'Watch Video' }),
      subtitle: 'Video walkthrough and plain-language guides',
      icon: Video,
      keywords: 'watch video tutorial visual steps వీడియో',
      onSelect: () => { navigate('/watch'); onClose(); },
    },

    // Quick Actions
    {
      id: 'act-toggle-theme',
      category: 'actions',
      title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: `Currently active: ${isDark ? 'Dark Mode' : 'Light Mode'}`,
      icon: isDark ? Sun : Moon,
      keywords: 'theme dark mode light mode color contrast రాత్రి పగలు',
      onSelect: () => { toggleTheme(); onClose(); },
    },
    {
      id: 'act-toggle-pictorial',
      category: 'actions',
      title: isPictorial ? 'Switch to Words Mode (Detailed)' : 'Switch to Pictures Mode (Visual)',
      subtitle: `Currently active: ${isPictorial ? 'Pictures Mode' : 'Words Mode'}`,
      icon: ImageIcon,
      keywords: 'pictorial pictures words visual mode simple view చిత్రాలు',
      onSelect: () => { togglePictorial(); onClose(); },
    },
    {
      id: 'act-lang-en',
      category: 'actions',
      title: 'English Language',
      subtitle: language === 'en' ? 'Active language' : 'Switch display to English',
      icon: Globe,
      keywords: 'language english en switch',
      onSelect: () => { setLanguage('en' as Language); onClose(); },
    },
    {
      id: 'act-lang-te',
      category: 'actions',
      title: 'తెలుగు (Telugu Language)',
      subtitle: language === 'te' ? 'క్రియాశీల భాష' : 'యాప్‌ను తెలుగులోకి మార్చండి',
      icon: Globe,
      keywords: 'language telugu te switch తెలుగు',
      onSelect: () => { setLanguage('te' as Language); onClose(); },
    },
    {
      id: 'act-lang-hi',
      category: 'actions',
      title: 'हिन्दी (Hindi Language)',
      subtitle: language === 'hi' ? 'सक्रिय भाषा' : 'ऐप को हिन्दी में बदलें',
      icon: Globe,
      keywords: 'language hindi hi switch हिन्दी',
      onSelect: () => { setLanguage('hi' as Language); onClose(); },
    },
    {
      id: 'act-tour',
      category: 'actions',
      title: 'Start Guided Walkthrough Tour',
      subtitle: 'Interactive step-by-step tour highlighting all app features',
      icon: Sparkles,
      keywords: 'tour walkthrough guided help start టూర్',
      onSelect: () => {
        onClose();
        if (onStartTour) onStartTour();
      },
    },
    {
      id: 'act-voice',
      category: 'actions',
      title: 'Open Voice Assistant',
      subtitle: 'Ask agricultural questions by voice in Telugu, Hindi or English',
      icon: Mic,
      keywords: 'voice assistant mic speak ask audio మాట్లాడండి',
      onSelect: () => {
        onClose();
        const fab = document.querySelector('#global-voice-assistant-slot button') as HTMLButtonElement | null;
        if (fab) fab.click();
      },
    },
  ];

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.keywords.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#18241E] rounded-3xl border border-[#D9D4C7] dark:border-[#273B30] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#D9D4C7] dark:border-[#273B30] bg-[#FFFDF8] dark:bg-[#121B16]">
          <Search className="w-5 h-5 text-[#F2B01E] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              language === 'te'
                ? 'ఏదైనా పేజీ, సాధనం లేదా చర్య కోసం వెతకండి... (Ctrl+K)'
                : language === 'hi'
                ? 'पेज, टूल या कमांड खोजें... (Ctrl+K)'
                : 'Type a page, tool, or command... (Ctrl+K)'
            }
            className="w-full bg-transparent text-[16px] text-[#1F2A24] dark:text-[#F2F5F3] placeholder:text-[#4A5750]/60 dark:placeholder:text-[#9EB0A5]/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <kbd className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              ESC
            </kbd>
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[#4A5750] dark:text-[#9EB0A5]">
              <Search className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-[15px] font-semibold">No matching pages or tools found</p>
              <p className="text-xs text-stone-400 mt-1">Try searching for "weather", "irrigation", "mandi" or "language"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-[#1B5E3B] text-white shadow-sm'
                      : 'text-[#1F2A24] dark:text-[#F2F5F3] hover:bg-stone-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#F2B01E] text-[#1F2A24]'
                          : 'bg-stone-100 dark:bg-stone-800 text-[#1B5E3B] dark:text-[#F2B01E]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-[15px] leading-tight truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div
                          className={`text-xs truncate mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-[#4A5750] dark:text-[#9EB0A5]'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="w-4 h-4 text-white/70 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 border-t border-[#D9D4C7] dark:border-[#273B30] bg-[#FFFDF8] dark:bg-[#121B16] flex items-center justify-between text-[11px] text-[#4A5750] dark:text-[#9EB0A5]">
          <span>Use &uarr; &darr; arrows to navigate, Enter to select</span>
          <span className="font-semibold text-[#1B5E3B] dark:text-[#F2B01E]">AgriSage Command Palette</span>
        </div>
      </div>
    </div>
  );
};
