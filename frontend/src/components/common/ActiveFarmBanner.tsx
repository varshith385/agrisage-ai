import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, MapPin, Layers, AlertCircle, Plus, Droplets } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

export const ActiveFarmBanner: React.FC = () => {
  const { isAuthenticated, activeFarm, activeFarmId, farms, isLoadingFarms, setActiveFarmId, activeCrop } =
    useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  if (isLoadingFarms && farms.length === 0) {
    return (
      <div className="mb-6 h-16 bg-[#EDE5DC]/60 animate-pulse rounded-2xl border border-[#7A553A]/20" />
    );
  }

  if (farms.length === 0) {
    return (
      <div className="mb-6 p-4 sm:p-5 bg-[#FEF6E9] border-2 border-[#DA9A4C]/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#543924] shadow-sm animate-fadeIn">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-[#DA9A4C] shrink-0" />
          <div>
            <span className="text-sm font-bold block text-[#183D2E]">{t('farms.complete_profile_prompt')}</span>
            <span className="text-xs text-[#543924]">Register your land area, soil type and irrigation to enable tailored advisories.</span>
          </div>
        </div>
        <Link
          to="/farms"
          className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-5 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-sm rounded-xl shadow-sm transition-all shrink-0"
        >
          {t('farms.complete_profile_cta')} &rarr;
        </Link>
      </div>
    );
  }

  const handleFarmSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      navigate('/farms');
    } else {
      setActiveFarmId(Number(val));
    }
  };

  return (
    <section
      aria-label={t('farms.banner_title')}
      className="mb-6 bg-gradient-to-r from-[#1B5E3B] via-[#24784C] to-[#1B5E3B] text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-[#164E30] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      {/* Left Farm Metadata Details */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#F2B01E] text-[#1F2A24] flex items-center justify-center font-black shadow-sm shrink-0">
          <Sprout className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-black text-base sm:text-lg text-white tracking-tight">
              {activeFarm?.name || t('farms.no_farm_selected')}
            </span>
            {activeFarm && (
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-[#F2B01E] text-[#1F2A24] shadow-xs">
                {activeFarm.area} ac &bull; {activeFarm.ownership_type}
              </span>
            )}
            {activeCrop && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-[#F2B01E]" />
                {activeCrop}
              </span>
            )}
          </div>
          {activeFarm && (
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-white/90">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#F2B01E]" />
                {activeFarm.village}, {activeFarm.district}, {activeFarm.state}
              </span>
              {activeFarm.soil_type && (
                <span className="text-white/80">
                  Soil: <strong className="text-white">{activeFarm.soil_type}</strong>
                </span>
              )}
              {activeFarm.irrigation_method && (
                <span className="flex items-center gap-1 text-white/80">
                  <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                  {activeFarm.irrigation_method}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Farm Switcher Controls */}
      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
        <div className="flex items-center bg-[#14462C] rounded-2xl p-1.5 border border-[#24784C] shadow-inner">
          <Layers className="w-4 h-4 text-[#F2B01E] ml-2 mr-1.5 shrink-0" />
          <select
            value={activeFarmId ?? ''}
            onChange={handleFarmSwitch}
            aria-label={t('farms.switch_farm')}
            className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer pr-2 py-1 min-h-[44px]"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id} className="text-[#1F2A24] bg-white">
                {f.name} ({f.area} ac &bull; {f.village})
              </option>
            ))}
            <option value="__new__" className="text-[#1F2A24] bg-white font-bold">
              {t('farms.register_new')}
            </option>
          </select>
        </div>

        <Link
          to="/farms"
          title={t('farms.title')}
          aria-label="Add new farm holding"
          className="min-h-[48px] min-w-[48px] p-2.5 text-white hover:text-white bg-[#24784C] hover:bg-[#1B5E3B] border border-[#F2B01E]/60 rounded-2xl transition-all flex items-center justify-center shadow-sm"
        >
          <Plus className="w-5 h-5 text-[#F2B01E]" />
        </Link>
      </div>
    </section>
  );
};
