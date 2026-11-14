import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, MapPin, AlertCircle, Droplets } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

export const ActiveFarmBanner: React.FC = () => {
  const { isAuthenticated, activeFarm, farms, isLoadingFarms, activeCrop } = useAuth();
  const { t } = useTranslation();

  if (!isAuthenticated) return null;

  if (isLoadingFarms && farms.length === 0) {
    return (
      <div className="mb-4 h-9 bg-[#EDE5DC]/60 dark:bg-stone-800/60 animate-pulse rounded-xl border border-[#7A553A]/20 dark:border-[#273B30]" />
    );
  }

  if (farms.length === 0) {
    return (
      <div className="mb-4 min-h-[36px] max-h-[40px] px-3.5 bg-[#FEF6E9] dark:bg-[#2A2015] border border-[#DA9A4C]/60 rounded-xl flex items-center justify-between text-xs text-[#543924] dark:text-[#E6C285]">
        <div className="flex items-center gap-2 truncate">
          <AlertCircle className="w-4 h-4 text-[#DA9A4C] shrink-0" />
          <span className="font-bold truncate">{t('farms.complete_profile_prompt', { defaultValue: 'Complete your farm profile' })}</span>
          <span className="hidden md:inline text-stone-500 dark:text-stone-400">— Register land area, soil type &amp; irrigation</span>
        </div>
        <Link
          to="/farms"
          className="font-bold text-[#183D2E] dark:text-[#F2B01E] hover:underline text-xs shrink-0 ml-2"
        >
          {t('farms.complete_profile_cta', { defaultValue: 'Set up now' })} &rarr;
        </Link>
      </div>
    );
  }

  return (
    <section
      aria-label={t('farms.banner_title', { defaultValue: 'Active Farm Summary' })}
      className="mb-4 min-h-[36px] max-h-[40px] px-3.5 bg-[#FAF8F5] dark:bg-[#16221C] border border-[#D9D4C7] dark:border-[#273B30] rounded-xl flex items-center justify-between gap-3 text-xs text-[#1F2A24] dark:text-[#E2ECE6] overflow-x-auto whitespace-nowrap shadow-xs max-w-full"
    >
      <div className="flex items-center gap-2.5 truncate font-medium">
        <Sprout className="w-4 h-4 text-[#1B5E3B] dark:text-[#F2B01E] shrink-0" />
        <span className="font-bold text-[#1B5E3B] dark:text-[#F2B01E] truncate">
          {activeFarm?.name || t('farms.no_farm_selected', { defaultValue: 'No farm selected' })}
        </span>
        {activeFarm && (
          <>
            <span className="text-stone-400 dark:text-stone-600">&bull;</span>
            <span className="font-semibold">{activeFarm.area} ac</span>
            <span className="text-stone-400 dark:text-stone-600">&bull;</span>
            <span className="capitalize">{activeFarm.ownership_type}</span>
            {activeCrop && (
              <>
                <span className="text-stone-400 dark:text-stone-600">&bull;</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">{activeCrop}</span>
              </>
            )}
            {activeFarm.soil_type && (
              <>
                <span className="text-stone-400 dark:text-stone-600">&bull;</span>
                <span className="text-stone-600 dark:text-stone-300">{activeFarm.soil_type}</span>
              </>
            )}
            {activeFarm.irrigation_method && (
              <>
                <span className="text-stone-400 dark:text-stone-600">&bull;</span>
                <span className="text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  {activeFarm.irrigation_method}
                </span>
              </>
            )}
            {activeFarm.village && (
              <>
                <span className="text-stone-400 dark:text-stone-600">&bull;</span>
                <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  {activeFarm.village}
                </span>
              </>
            )}
          </>
        )}
      </div>
      <Link
        to="/farms"
        className="text-[11px] font-bold text-[#1B5E3B] dark:text-[#F2B01E] hover:underline shrink-0 ml-auto"
      >
        Manage &rarr;
      </Link>
    </section>
  );
};
export default ActiveFarmBanner;
