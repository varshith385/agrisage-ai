import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, ShieldCheck, Play, ArrowRight, UserCheck } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { UserRole } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';

export const AuthPage: React.FC = () => {
  const { setSession, isAuthenticated } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('Farmer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await authApi.demoLogin();
      setSession(res.access_token, res.user, res.farm, res.active_crop);
      if (res.user.preferred_language) {
        setLanguage(res.user.preferred_language);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Demo mode initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await authApi.login({ email, password });
        setSession(res.access_token, res.user);
        if (res.user.preferred_language) setLanguage(res.user.preferred_language);
        navigate('/dashboard');
      } else {
        const res = await authApi.register({
          email,
          password,
          full_name: fullName,
          phone_number: phoneNumber || undefined,
          role,
          preferred_language: language,
        });
        setSession(res.access_token, res.user);
        navigate('/setup');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand Hero & One-Click Demo Mode */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-gold-100 text-agri-soil-800 text-xs font-bold border border-agri-gold-400/50">
              <Sprout className="w-4 h-4 text-agri-green-700" />
              <span>Yuktik 2026 Hackathon Ready</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-agri-green-900 leading-tight">
              {t('auth.welcome_title')}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t('auth.welcome_subtitle')}
            </p>
          </div>

          {/* ONE-CLICK DEMO MODE CARD */}
          <div className="bg-gradient-to-br from-agri-green-800 to-agri-green-900 text-white p-6 rounded-3xl shadow-xl border border-agri-gold-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-agri-gold-400">
                Instant Evaluation
              </span>
              <StatusBadge status="WORKING" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-agri-gold-400 fill-agri-gold-400" />
                {t('auth.demo_button')}
              </h3>
              <p className="text-xs text-agri-cream-100/80 leading-relaxed">
                {t('auth.demo_hint')}
              </p>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-agri-gold-500 hover:bg-agri-gold-400 text-agri-green-900 font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isLoading ? t('common.loading') : t('auth.demo_button')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white/80 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-agri-green-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Honesty Rule Certified</h4>
                <p className="text-[11px] text-stone-500">Zero synthetic or fabricated telemetry</p>
              </div>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
              <Sprout className="w-5 h-5 text-agri-gold-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">FAO-56 Calibrated</h4>
                <p className="text-[11px] text-stone-500">Agro-meteorological crop water budgeting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Auth Tabs & Form */}
        <div className="lg:col-span-6 bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-warm">
          {/* Tab Selector */}
          <div className="flex border-b border-stone-200 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-agri-green-700 text-agri-green-800'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              {t('auth.login_tab')}
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-agri-green-700 text-agri-green-800'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              {t('auth.register_tab')}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('auth.full_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-agri-green-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('auth.phone_label')}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-agri-green-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t('auth.role_label')}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-agri-green-600 text-sm bg-white"
                  >
                    <option value="Farmer">{t('auth.role_farmer')}</option>
                    <option value="Expert">{t('auth.role_expert')}</option>
                    <option value="Buyer">{t('auth.role_buyer')}</option>
                    <option value="Admin">{t('auth.role_admin')}</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t('auth.email_label')}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@agrisage.demo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-agri-green-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t('auth.password_label')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-agri-green-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {isLoading ? t('common.loading') : activeTab === 'login' ? t('auth.login_action') : t('auth.register_action')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
