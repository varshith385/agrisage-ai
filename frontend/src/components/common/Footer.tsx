import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-[#D9D4C7] dark:border-[#273B30] bg-[#FAF8F5] dark:bg-[#121B16] text-[#4A5750] dark:text-[#9EB0A5] text-xs py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center sm:text-left">
          <span className="font-bold text-[#1B5E3B] dark:text-[#F2B01E]">{t('app.name', { defaultValue: 'Grow2Gain' })}</span>
          <span className="hidden sm:inline text-stone-300 dark:text-stone-700">|</span>
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B5E3B] dark:text-[#F2B01E] shrink-0" />
            <span>Independent agricultural decision support &bull; Modelled values &bull; Not government affiliated</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium text-[11px]">
          <Link to="/how-to" className="hover:text-[#1B5E3B] dark:hover:text-[#F2B01E] transition-colors">How to Use</Link>
          <Link to="/watch" className="hover:text-[#1B5E3B] dark:hover:text-[#F2B01E] transition-colors">Video Guide</Link>
          <Link to="/farms" className="hover:text-[#1B5E3B] dark:hover:text-[#F2B01E] transition-colors">My Farms</Link>
          <Link to="/schemes" className="hover:text-[#1B5E3B] dark:hover:text-[#F2B01E] transition-colors">Schemes</Link>
          <span className="text-stone-400 dark:text-stone-600">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
