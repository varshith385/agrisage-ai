import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, ShieldCheck, Play, ArrowRight, UserCheck, Globe, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { UserRole } from '../types/api';

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
    <div className="max-w-5xl mx-auto py-6 sm:py-12 px-4 animate-fadeIn">
      {/* Top Language Bar for First-Time Farmers */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#7A553A]/20 rounded-2xl">
          <Globe className="w-4 h-4 text-[#7A553A] ml-2" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'en' ? 'bg-[#183D2E] text-white shadow-xs' : 'text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('te')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'te' ? 'bg-[#183D2E] text-white shadow-xs' : 'text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            తెలుగు
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'hi' ? 'bg-[#183D2E] text-white shadow-xs' : 'text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand Hero & One-Click Demo Mode */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF6E9] text-[#183D2E] text-xs font-bold border border-[#DA9A4C]">
              <Sprout className="w-4 h-4 text-[#DA9A4C]" />
              <span>{t('auth.tagline', { defaultValue: 'Smallholder Agricultural Decision Intelligence' })}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#183D2E] leading-tight">
              {t('auth.welcome_title', { defaultValue: 'Smart Farming Advice Built for Indian Farmers' })}
            </h1>
            <p className="text-sm text-[#4E5F57] leading-relaxed">
              {t('auth.welcome_subtitle', { defaultValue: 'Accurate weather, water budgeting, disease detection, and mandi market prices tailored to your land parcel.' })}
            </p>
          </div>

          {/* ONE-CLICK DEMO MODE CARD */}
          <div className="bg-gradient-to-br from-[#183D2E] to-[#265C46] text-white p-6 sm:p-7 rounded-3xl shadow-lg border-2 border-[#DA9A4C] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#DA9A4C]">
                {t('auth.instant_evaluation', { defaultValue: 'Instant Evaluation' })}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DA9A4C] text-[#183D2E]">
                {t('auth.one_click_badge', { defaultValue: 'ONE-CLICK LOGIN' })}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-[#DA9A4C] fill-[#DA9A4C]" />
                <span>{t('auth.demo_button', { defaultValue: 'Enter as Ramesh Kumar (Farmer)' })}</span>
              </h3>
              <p className="text-xs text-[#FAF8F5]/80 leading-relaxed">
                {t('auth.demo_hint', { defaultValue: 'Pre-loaded with 6-acre mixed holding (Cotton & Rice) in Warangal, Telangana. No password required.' })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 bg-[#DA9A4C] hover:bg-[#C28538] text-[#183D2E] font-extrabold rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 text-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isLoading ? t('common.loading', { defaultValue: 'Loading demo profile...' }) : t('auth.one_click_access', { defaultValue: 'One-Click Demo Access' })}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-[#7A553A]/20 flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-[#183D2E] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#183D2E]">{t('auth.honesty_badge', { defaultValue: 'Honesty Guarantees' })}</h4>
                <p className="text-[11px] text-[#7A553A]">{t('auth.honesty_desc', { defaultValue: 'Zero fake numbers. Modelled vs measured data clearly labelled.' })}</p>
              </div>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-[#7A553A]/20 flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-[#DA9A4C] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#183D2E]">{t('auth.fao_badge', { defaultValue: 'FAO-56 Irrigation' })}</h4>
                <p className="text-[11px] text-[#7A553A]">{t('auth.fao_desc', { defaultValue: 'Calculated with real solar ET0 math, not guessed numbers.' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Auth Tabs & Form */}
        <div className="lg:col-span-6 bg-white border border-[#7A553A]/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Tab Selector */}
          <div className="flex border-b border-[#7A553A]/15 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 min-h-[44px] py-2 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-[#183D2E] text-[#183D2E]'
                  : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
              }`}
            >
              {t('auth.login_tab', { defaultValue: 'Sign In' })}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 min-h-[44px] py-2 text-center text-sm font-bold border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-[#183D2E] text-[#183D2E]'
                  : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
              }`}
            >
              {t('auth.register_tab', { defaultValue: 'Create Account' })}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block font-bold text-[#183D2E] mb-1">
                    {t('auth.full_name_label', { defaultValue: 'Full Name' })}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 focus:outline-none focus:ring-2 focus:ring-[#183D2E] text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#183D2E] mb-1">
                    {t('auth.phone_label', { defaultValue: 'Phone Number (Optional)' })}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 focus:outline-none focus:ring-2 focus:ring-[#183D2E] text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#183D2E] mb-1">
                    {t('auth.role_label', { defaultValue: 'Your Primary Role' })}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 focus:outline-none focus:ring-2 focus:ring-[#183D2E] text-sm bg-white"
                  >
                    <option value="Farmer">{t('auth.role_farmer', { defaultValue: 'Farmer' })}</option>
                    <option value="Expert">{t('auth.role_expert', { defaultValue: 'Agronomy Expert' })}</option>
                    <option value="Buyer">{t('auth.role_buyer', { defaultValue: 'Produce Buyer' })}</option>
                    <option value="Admin">{t('auth.role_admin', { defaultValue: 'System Administrator' })}</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-bold text-[#183D2E] mb-1">
                {t('auth.email_label', { defaultValue: 'Email Address / Identifier' })}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@agrisage.demo"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 focus:outline-none focus:ring-2 focus:ring-[#183D2E] text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-[#183D2E] mb-1">
                {t('auth.password_label', { defaultValue: 'Password' })}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 focus:outline-none focus:ring-2 focus:ring-[#183D2E] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 px-4 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 text-sm mt-2"
            >
              {isLoading ? t('common.loading', { defaultValue: 'Please wait...' }) : activeTab === 'login' ? t('auth.login_action', { defaultValue: 'Sign In to Grow2Gain' }) : t('auth.register_action', { defaultValue: 'Create My Account' })}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
