import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, HelpCircle, Video } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-[#7A553A]/20 bg-[#FAF8F5] text-[#1A2421]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Brand & Purpose */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#183D2E] text-[#DA9A4C] flex items-center justify-center font-bold">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-[#183D2E]">
                {t('app.name')}
              </span>
            </div>
            <p className="text-sm text-[#4E5F57] leading-relaxed">
              Agronomic forecasting, crop water budgeting, and honest explainable advisory designed for Indian farmers.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#7A553A] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#183D2E]" />
              <span>Honesty Guarantee: Modelled values clearly labelled. Zero synthetic telemetry.</span>
            </div>
          </div>

          {/* Col 2: Farmer Guidance Links */}
          <div>
            <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-3">
              Help & Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/how-to" className="text-[#4E5F57] hover:text-[#183D2E] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#DA9A4C]" />
                  <span>How to use AgriSage</span>
                </Link>
              </li>
              <li>
                <Link to="/watch" className="text-[#4E5F57] hover:text-[#183D2E] flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#DA9A4C]" />
                  <span>Watch Video Guide</span>
                </Link>
              </li>
              <li>
                <Link to="/farms" className="text-[#4E5F57] hover:text-[#183D2E]">
                  My Farms & Land Tenure
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="text-[#4E5F57] hover:text-[#183D2E]">
                  Schemes & Soil Health Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Honesty Disclaimer */}
          <div>
            <h4 className="text-xs font-black uppercase text-[#183D2E] tracking-wider mb-3">
              Advisory Notice
            </h4>
            <p className="text-xs text-[#4E5F57] leading-relaxed">
              Independent agricultural decision-support tool. Crop models, ET0 water budgets, and market projections are indicative estimates based on scientific formulas (FAO-56) and open datasets. Not affiliated with or endorsed by any government entity. Always verify local conditions before major farm investments.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#7A553A]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A553A]">
          <div>
            &copy; {new Date().getFullYear()} AgriSage AI. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Yuktik 2026</span>
            <span>&bull;</span>
            <span>FAO-56 Calibrated</span>
            <span>&bull;</span>
            <span>Multilingual (EN / TE / HI)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
