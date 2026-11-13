import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, DollarSign, Calendar, Users, Leaf } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/community', label: t('nav.community'), icon: Users },
    { to: '/economics', label: t('nav.economics'), icon: DollarSign },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar },
    { to: '/disease', label: t('nav.disease'), icon: Leaf },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-agri-green-900/95 backdrop-blur-md text-white border-t border-agri-green-800/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[70px] ${
                  isActive
                    ? 'text-agri-gold-400 font-bold scale-105'
                    : 'text-agri-cream-200/70 hover:text-white font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

