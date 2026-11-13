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
      <div className="mb-6 h-14 bg-stone-100/80 animate-pulse rounded-2xl border border-stone-200/60" />
    );
  }

  if (farms.length === 0) {
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="text-xs font-bold block">{t('farms.complete_profile_prompt')}</span>
          </div>
        </div>
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
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
      className="mb-6 bg-gradient-to-r from-agri-green-900 via-agri-green-800 to-agri-green-900 text-agri-cream-50 rounded-2xl p-3.5 sm:p-4 shadow-sm border border-agri-green-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
    >
      {/* Left Farm Metadata Details */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-agri-gold-500 text-agri-green-950 flex items-center justify-center font-bold shadow-subtle shrink-0">
          <Sprout className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-sm sm:text-base text-white tracking-tight">
              {activeFarm?.name || t('farms.no_farm_selected')}
            </span>
            {activeFarm && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-agri-green-700 text-agri-gold-300 border border-agri-green-600/80">
                {activeFarm.area} ac &bull; {activeFarm.ownership_type}
              </span>
            )}
            {activeCrop && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <Sprout className="w-2.5 h-2.5" />
                {activeCrop}
              </span>
            )}
          </div>
          {activeFarm && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-agri-cream-200">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-agri-gold-400" />
                {activeFarm.village}, {activeFarm.district}, {activeFarm.state}
              </span>
              {activeFarm.soil_type && (
                <span className="text-agri-cream-300">
                  Soil: <strong>{activeFarm.soil_type}</strong>
                </span>
              )}
              {activeFarm.irrigation_method && (
                <span className="flex items-center gap-1 text-agri-cream-300">
                  <Droplets className="w-3 h-3 text-cyan-300" />
                  {activeFarm.irrigation_method}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Farm Switcher Controls */}
      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
        <div className="flex items-center bg-agri-green-950/80 rounded-xl p-1 border border-agri-green-700/80 shadow-inner">
          <Layers className="w-3.5 h-3.5 text-agri-gold-400 ml-2 mr-1" />
          <select
            value={activeFarmId ?? ''}
            onChange={handleFarmSwitch}
            aria-label={t('farms.switch_farm')}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 py-1"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id} className="text-stone-900">
                {f.name} ({f.area} ac &bull; {f.village})
              </option>
            ))}
            <option value="__new__" className="text-stone-900 font-bold">
              {t('farms.register_new')}
            </option>
          </select>
        </div>

        <Link
          to="/farms"
          title={t('farms.title')}
          className="p-2 text-agri-cream-100 hover:text-white bg-agri-green-700/60 hover:bg-agri-green-700 border border-agri-green-600/60 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

