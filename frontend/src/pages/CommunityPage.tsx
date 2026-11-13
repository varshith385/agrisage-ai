import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Truck, Calculator, Wrench, AlertTriangle, Database } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GroupsSection } from '../components/community/GroupsSection';
import { RequestsSection } from '../components/community/RequestsSection';
import { CostSplitCalculator } from '../components/community/CostSplitCalculator';
import { MachinerySection } from '../components/community/MachinerySection';
import { OutbreakMapSection } from '../components/community/OutbreakMapSection';

export const CommunityPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeFarm, location: userLoc } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'groups' | 'requests' | 'calculator' | 'machinery' | 'outbreak'>('groups');

  // Handle URL hash changes like #outbreak-map
  useEffect(() => {
    if (location.hash === '#outbreak-map') {
      setActiveTab('outbreak');
      const el = document.getElementById('outbreak-map');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Prominent DEMO DATA Banner */}
      <div className="bg-purple-900/90 text-purple-100 rounded-2xl p-4 shadow-md border border-purple-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-800 text-purple-200 rounded-xl shrink-0">
            <Database className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white tracking-wide">
                {t('community.demo_badge')}
              </span>
              <StatusBadge status="DEMO" className="border-purple-400/40 text-purple-200" />
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              {t('community.demo_banner')}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/80 shrink-0">
          Centroid: {activeFarm?.village || userLoc?.village || 'Geikonda'} ({activeFarm?.district || userLoc?.district || 'Warangal'})
        </div>
      </div>

      {/* Main Page Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-stone-200/80 shadow-subtle flex flex-wrap items-center gap-1.5">
        {[
          { id: 'groups', label: t('community.tabs.groups'), icon: Users },
          { id: 'requests', label: t('community.tabs.requests'), icon: Truck },
          { id: 'calculator', label: t('community.tabs.calculator'), icon: Calculator },
          { id: 'machinery', label: t('community.tabs.machinery'), icon: Wrench },
          { id: 'outbreak', label: t('community.tabs.outbreak'), icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'outbreak') {
                  window.history.replaceState(null, '', '#outbreak-map');
                } else {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-agri-green-800 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-agri-gold-400' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="transition-all duration-200">
        {activeTab === 'groups' && <GroupsSection />}
        {activeTab === 'requests' && <RequestsSection onOpenCalculator={() => setActiveTab('calculator')} />}
        {activeTab === 'calculator' && <CostSplitCalculator />}
        {activeTab === 'machinery' && <MachinerySection />}
        {activeTab === 'outbreak' && <OutbreakMapSection />}
      </div>
    </div>
  );
};
