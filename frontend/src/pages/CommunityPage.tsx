import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Truck,
  Calculator,
  Wrench,
  AlertTriangle,
  Database,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePictorial } from '../context/PictorialContext';
import { GroupsSection } from '../components/community/GroupsSection';
import { RequestsSection } from '../components/community/RequestsSection';
import { CostSplitCalculator } from '../components/community/CostSplitCalculator';
import { MachinerySection } from '../components/community/MachinerySection';
import { OutbreakMapSection } from '../components/community/OutbreakMapSection';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { EmptyPlotIllustration } from '../components/common/FarmerIllustrations';

export const CommunityPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial } = usePictorial();
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

  const villageName = activeFarm?.village || userLoc?.village || 'Geikonda';
  const districtName = activeFarm?.district || userLoc?.district || 'Warangal';

  const plainMeaning = `Community tools allow you to pool transport with neighbouring farmers in ${villageName} and rent idle farm machinery at fair daily rates.`;

  // PICTORIAL MODE
  if (isPictorial) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12 max-w-6xl mx-auto">
        <PageHeader
          icon={Users}
          title={language === 'te' ? 'రైతు బృందం & యంత్రాలు' : language === 'hi' ? 'किसान समुदाय व मशीनें' : 'Community & Machinery'}
          purpose={language === 'te' ? 'యంత్రాల అద్దె మరియు కలిసి సరుకు రవాణా' : language === 'hi' ? 'मशीन किराया और समूह परिवहन' : 'Shared machinery and pooled transport.'}
        />

        <div className="bg-gradient-to-br from-[#FEF6E9] to-[#FAF8F5] rounded-3xl border-2 border-[#DA9A4C] p-6 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="flex justify-center">
            <EmptyPlotIllustration className="w-48 h-36 drop-shadow-sm" />
          </div>

          <h2 className="text-2xl font-bold font-display text-[#183D2E]">
            {villageName}, {districtName}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-left">
            <button
              type="button"
              onClick={() => setActiveTab('machinery')}
              className="bg-white p-4 rounded-2xl border-2 border-[#183D2E]/20 hover:border-[#183D2E] transition-all space-y-1 shadow-sm"
            >
              <Wrench className="w-6 h-6 text-[#183D2E]" />
              <span className="font-bold text-[#183D2E] block text-sm">Machinery</span>
              <span className="text-[11px] text-[#4E5F57]">Rent tractors & tools</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="bg-white p-4 rounded-2xl border-2 border-[#183D2E]/20 hover:border-[#183D2E] transition-all space-y-1 shadow-sm"
            >
              <Truck className="w-6 h-6 text-[#DA9A4C]" />
              <span className="font-bold text-[#183D2E] block text-sm">Transport</span>
              <span className="text-[11px] text-[#4E5F57]">Pool mandi trips</span>
            </button>
          </div>

          <div className="pt-2">
            <ReadAloudButton text={`Community hub for ${villageName}. ${plainMeaning}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        icon={Users}
        title={t('community.title', { defaultValue: 'Farmer Community & Machinery Sharing' })}
        purpose={t('community.subtitle', { defaultValue: 'Connect with local farmers, share machinery and transport costs, and track regional pest outbreaks.' })}
        whatIsThis={{
          summary: 'A collaborative sharing hub for smallholders to pool harvest transport trips, rent local farm implements (tractors, tillers, harvesters), and calculate transparent cost splits.',
          whatToEnter: 'Your machinery listings, rental inquiries, bulk truck pool requests, or mileage cost split factors.',
          whatYouGet: 'Lower logistics expenditure, shared machinery access, and real-time community pest outbreak alerts.',
        }}
        actions={
          <button
            type="button"
            onClick={() => setActiveTab('machinery')}
            className="min-h-[48px] px-5 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-[#DA9A4C]" />
            <span>Browse Machinery</span>
          </button>
        }
      />

      {/* Prominent DEMO DATA Banner */}
      <div className="bg-[#FAF8F5] text-[#183D2E] rounded-2xl p-4 shadow-sm border border-[#7A553A]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#183D2E] text-[#DA9A4C] rounded-xl shrink-0 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-[#183D2E] tracking-wide">
                {t('community.demo_badge')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DA9A4C]/20 text-[#7A553A] border border-[#DA9A4C]/40">
                DEMO DATA
              </span>
            </div>
            <p className="text-xs text-[#4E5F57] mt-0.5">
              {t('community.demo_banner')}
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-[#183D2E] bg-white px-3.5 py-2 rounded-xl border border-[#7A553A]/20 shadow-sm shrink-0 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#DA9A4C]" />
          <span>Centroid: {villageName} ({districtName})</span>
        </div>
      </div>

      {/* LEAD SUMMARY SECTION (1 to 3 Large Cards + Primary CTA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Village Collaboration Hub */}
        <div className="bg-gradient-to-br from-[#FEF6E9] via-[#FAF8F5] to-white rounded-2xl border-2 border-[#DA9A4C]/60 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Village Sharing Network
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                {villageName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#183D2E]">
              {districtName} Cluster
            </h2>

            <p className="text-xs text-[#4E5F57] leading-relaxed pt-1">
              Connect with fellow smallholders to pool crop transport and rent agricultural machinery at transparent rates.
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Community sharing network for ${villageName}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>View Groups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Shared Transport & Cost Split */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#DA9A4C]" />
                Mandi Transport Pooling
              </span>
              <span className="text-xs text-[#7A553A] font-semibold">
                Cost Reduction
              </span>
            </div>

            <p className="text-xs text-[#4E5F57] leading-relaxed">
              Splitting transport expenses with neighbouring farms reduces per-quintal logistics costs by up to 35%.
            </p>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote="Indicative community cost estimation (DEMO DATA)."
            />
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="text-xs font-bold text-[#183D2E] hover:underline flex items-center gap-1"
            >
              <span>Open Split Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Outbreak Warning Radar */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Community Pest Radar
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <p className="text-xs text-[#4E5F57] leading-relaxed">
              Anonymized village centroid reports alert farmers to spreading foliar fungal spores and insect infestations early.
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('outbreak')}
              className="text-xs font-bold text-[#183D2E] hover:underline flex items-center gap-1"
            >
              <span>Open Outbreak Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL TABS (Preserving all community tools and sections) */}
      <div className="bg-white rounded-2xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        {/* Main Page Navigation Tabs */}
        <div className="flex border-b border-[#7A553A]/15 overflow-x-auto bg-[#FAF8F5]/80">
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
                className={`min-h-[48px] px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#183D2E] text-[#183D2E] bg-white'
                    : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#DA9A4C]' : 'text-[#7A553A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        <div className="p-5 sm:p-6">
          {activeTab === 'groups' && <GroupsSection />}
          {activeTab === 'requests' && <RequestsSection onOpenCalculator={() => setActiveTab('calculator')} />}
          {activeTab === 'calculator' && <CostSplitCalculator />}
          {activeTab === 'machinery' && <MachinerySection />}
          {activeTab === 'outbreak' && <OutbreakMapSection />}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;