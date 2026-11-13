import React, { useState, useEffect } from 'react';
import {
  Store,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  Unlock,
  Info,
  Calendar,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  getNetRealizationRanking,
  getMSPComparison,
  getPriceTrends,
  getNearbyWarehouses,
  getMarketplaceListings,
  createMarketplaceListing,
  deleteMarketplaceListing,
  submitBuyerInquiry,
  getMarketplaceInquiries,
  updateInquiryStatus,
  verifyFarmer,
} from '../api/market';
import {
  InquiryResponse,
  ListingResponse,
  MSPComparisonResponse,
  NetRealizationRankingResponse,
  PriceTrendResponse,
  WarehouseResponse,
} from '../types/api';

export const MarketPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'mandi' | 'marketplace' | 'inquiries'>('mandi');

  // Mandi & Ranking States
  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
  const [quantity, setQuantity] = useState<number>(20.0);
  const [transportRate, setTransportRate] = useState<number>(2.50);
  const [marketFeePct, setMarketFeePct] = useState<number>(1.0);
  const [rankingData, setRankingData] = useState<NetRealizationRankingResponse | null>(null);
  const [mspData, setMspData] = useState<MSPComparisonResponse | null>(null);
  const [trendData, setTrendData] = useState<PriceTrendResponse | null>(null);
  const [warehouseData, setWarehouseData] = useState<WarehouseResponse | null>(null);
  const [mandiLoading, setMandiLoading] = useState<boolean>(false);
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);

  // Marketplace States
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
  const [marketLoading, setMarketLoading] = useState<boolean>(false);
  const [inboxTab, setInboxTab] = useState<'received' | 'sent'>('received');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modals
  const [showListingModal, setShowListingModal] = useState<boolean>(false);
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [activeListingForInquiry, setActiveListingForInquiry] = useState<ListingResponse | null>(null);

  // New Listing Form
  const [newCrop, setNewCrop] = useState<string>('Cotton');
  const [newVariety, setNewVariety] = useState<string>('Bollgard II Hybrid');
  const [newQty, setNewQty] = useState<number>(30.0);
  const [newPrice, setNewPrice] = useState<number>(7250.0);
  const [newVillage, setNewVillage] = useState<string>('Geikonda');
  const [newHarvestDate, setNewHarvestDate] = useState<string>('2027-01-20');
  const [newDesc, setNewDesc] = useState<string>('Quality harvested crop, moisture below 8%.');

  // Inquiry Form
  const [inqPrice, setInqPrice] = useState<number>(7200.0);
  const [inqQty, setInqQty] = useState<number>(20.0);
  const [inqMsg, setInqMsg] = useState<string>('Interested in bulk farm-gate procurement with immediate settlement.');

  // Fetch Mandi Intelligence Data
  const loadMandiData = async () => {
    setMandiLoading(true);
    try {
      const [rankingRes, mspRes, trendRes, whRes] = await Promise.all([
        getNetRealizationRanking({
          crop: selectedCrop,
          quantity: quantity,
          transport_rate: transportRate,
          market_fee_pct: marketFeePct,
        }),
        getMSPComparison({
          crop: selectedCrop,
          expected_price: 7200.0,
        }),
        getPriceTrends({ crop: selectedCrop }),
        getNearbyWarehouses({}),
      ]);
      setRankingData(rankingRes);
      setMspData(mspRes);
      setTrendData(trendRes);
      setWarehouseData(whRes);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setMandiLoading(false);
    }
  };

  // Fetch Marketplace Data
  const loadMarketplaceData = async () => {
    setMarketLoading(true);
    try {
      const [listRes, inqRes] = await Promise.all([
        getMarketplaceListings(),
        getMarketplaceInquiries(),
      ]);
      setListings(listRes);
      setInquiries(inqRes);
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    loadMandiData();
  }, [selectedCrop, quantity, transportRate, marketFeePct]);

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketplaceListing({
        crop_name: newCrop,
        variety: newVariety,
        quantity_quintals: newQty,
        expected_price_per_q: newPrice,
        state: 'Telangana',
        district: 'Warangal',
        village: newVillage,
        harvest_date: newHarvestDate,
        description: newDesc,
      });
      setShowListingModal(false);
      setFeedbackMsg('Harvest listing posted successfully!');
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to create listing:', err);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListingForInquiry) return;
    try {
      await submitBuyerInquiry({
        listing_id: activeListingForInquiry.id,
        offered_price_per_q: inqPrice,
        quantity_quintals: inqQty,
        message: inqMsg,
      });
      setShowInquiryModal(false);
      setFeedbackMsg('Procurement inquiry sent to farmer!');
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    }
  };

  const handleInquiryDecision = async (inqId: number, decision: 'accepted' | 'declined') => {
    try {
      await updateInquiryStatus(inqId, decision);
      setFeedbackMsg(`Inquiry ${decision}! Contact details are now accessible.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to update inquiry decision:', err);
    }
  };

  const handleToggleAdminVerify = async (farmerId: number, curStatus: boolean) => {
    try {
      await verifyFarmer(farmerId, !curStatus);
      setFeedbackMsg(`Farmer verification status updated to ${!curStatus ? 'VERIFIED' : 'UNVERIFIED'}.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to update verification:', err);
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteMarketplaceListing(listingId);
      setFeedbackMsg('Listing deleted successfully.');
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-agri-gold-400 text-stone-900 rounded-md">
              Tier 2
            </span>
            <StatusBadge status={rankingData?.demo ? "DEMO" : "WORKING"} />
            {rankingData?.demo && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                DEMO DATA
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-8 h-8 text-agri-green-700" />
            {t('market.title')}
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            {t('market.subtitle')}
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-2xl gap-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('mandi')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'mandi'
                ? 'bg-white shadow text-agri-green-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('market.tab_mandi')}
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'marketplace'
                ? 'bg-white shadow text-agri-green-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('market.tab_marketplace')}
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all relative ${
              activeTab === 'inquiries'
                ? 'bg-white shadow text-agri-green-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t('market.tab_inquiries')}
            {inquiries.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-agri-green-700 text-white rounded-full text-[10px] font-black">
                {inquiries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MANDI INTELLIGENCE & NET REALIZATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'mandi' && (
        <div className="space-y-6">
          {/* DEMO DATA Banner */}
          {rankingData?.demo && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-subtle">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="bg-amber-200 px-2 py-0.5 rounded font-black text-amber-950">
                    {t('market.demo_banner_title')}
                  </span>
                  &bull; Source: datasets/demo/mandi_prices.csv
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {t('market.demo_banner_desc')}
                </p>
              </div>
            </div>
          )}

          {/* Controls & Editable Assumptions Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-agri-green-700" />
                  {t('market.assumptions_title')}
                </h3>
                <span className="text-[11px] text-stone-500">
                  {t('market.transport_rate_hint')} &bull; {t('market.market_fee_hint')}
                </span>
              </div>
              <button
                onClick={loadMandiData}
                disabled={mandiLoading}
                className="px-3.5 py-1.5 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow transition-all self-start sm:self-auto disabled:opacity-50"
              >
                {mandiLoading ? 'Recalculating...' : t('market.recalculate_btn')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {t('market.select_crop')}
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                >
                  <option value="Cotton">Cotton (పత్తి / कपास)</option>
                  <option value="Chilli">Chilli (మిర్చి / मिर्च)</option>
                  <option value="Paddy">Paddy (వరి / धान)</option>
                  <option value="Rice">Rice (బియ్యం / चावल)</option>
                  <option value="Maize">Maize (మొక్కజొన్న / मक्का)</option>
                  <option value="Groundnut">Groundnut (వేరుశనగ / मूंगफली)</option>
                  <option value="Soybean">Soybean (సోయాచిక్కుడు / सोयाबीन)</option>
                  <option value="Wheat">Wheat (గోధుమలు / गेहूं)</option>
                  <option value="Tomato">Tomato (టమోటా / टमाटर)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {t('market.quantity_label')}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {t('market.transport_rate_label')}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.25"
                  value={transportRate}
                  onChange={(e) => setTransportRate(parseFloat(e.target.value) || 0.5)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {t('market.market_fee_label')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={marketFeePct}
                  onChange={(e) => setMarketFeePct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-agri-green-600"
                />
              </div>
            </div>
          </div>

          {/* MSP Benchmark Comparison Chip & Rationale Card */}
          {mspData && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-agri-green-700" />
                  <h3 className="text-sm font-bold text-stone-900">
                    {t('market.msp_title')}: {selectedCrop}
                  </h3>
                </div>

                {mspData.msp_verified ? (
                  <span className="px-2.5 py-1 text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl flex items-center gap-1.5 self-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    {t('market.msp_verified_badge')} (₹{mspData.benchmark?.msp_per_quintal?.toLocaleString()}/q)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-xl flex items-center gap-1.5 self-start">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    {t('market.msp_unverified_badge')}
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                {mspData.explanation}
              </p>

              {mspData.msp_verified && mspData.source_url && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                  <a
                    href={mspData.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-agri-green-700 hover:text-agri-green-900 font-bold underline flex items-center gap-1"
                  >
                    <span>{t('market.msp_source_link')} ({mspData.benchmark?.season} {mspData.benchmark?.year})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {mspData.last_verified && (
                    <span>{t('market.msp_verified_date')}: <strong className="text-stone-700">{mspData.last_verified}</strong></span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Net Realization Mandi Ranking Table */}
          {rankingData && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-agri-green-700" />
                    {t('market.ranking_title')}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t('market.ranking_subtitle')}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-xl self-start">
                  Volume: {quantity} quintals
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                      <th className="p-3 font-bold">{t('market.col_rank')}</th>
                      <th className="p-3 font-bold">{t('market.col_mandi')}</th>
                      <th className="p-3 font-bold">{t('market.col_modal_price')}</th>
                      <th className="p-3 font-bold">{t('market.col_distance')}</th>
                      <th className="p-3 font-bold">{t('market.col_transport_cost')}</th>
                      <th className="p-3 font-bold">{t('market.col_market_fee')}</th>
                      <th className="p-3 font-bold">{t('market.col_net')}</th>
                      <th className="p-3 font-bold">{t('market.col_net_per_q')}</th>
                      <th className="p-3 font-bold text-right">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/60">
                    {rankingData.rankings.map((m) => (
                      <React.Fragment key={m.rank}>
                        <tr
                          className={`hover:bg-stone-50/80 transition-colors ${
                            m.rank === 1 ? 'bg-emerald-50/50 font-semibold' : ''
                          }`}
                        >
                          <td className="p-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                                m.rank === 1
                                  ? 'bg-emerald-600 text-white'
                                  : m.rank === 2
                                  ? 'bg-stone-300 text-stone-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {m.rank}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              {m.mandi}
                              {m.rank === 1 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 rounded">
                                  {t('market.best_choice_badge')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500">{m.district}, {m.state}</span>
                          </td>
                          <td className="p-3 font-bold text-stone-900">
                            ₹{m.modal_price.toLocaleString()}
                          </td>
                          <td className="p-3 text-stone-700">
                            {m.distance_km} km
                          </td>
                          <td className="p-3 text-red-600 font-medium">
                            -₹{m.transport_cost.toLocaleString()}
                          </td>
                          <td className="p-3 text-stone-600">
                            -₹{m.market_fee.toLocaleString()}
                          </td>
                          <td className="p-3 text-sm font-black text-agri-green-800">
                            ₹{m.net_realization.toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-stone-900">
                            ₹{m.net_realization_per_q.toLocaleString()} / q
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() =>
                                setExpandedReasoning(expandedReasoning === m.rank ? null : m.rank)
                              }
                              className="text-[11px] font-bold text-agri-green-700 hover:text-agri-green-900 inline-flex items-center gap-0.5"
                            >
                              <span>{expandedReasoning === m.rank ? 'Hide' : 'Explain'}</span>
                              {expandedReasoning === m.rank ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {expandedReasoning === m.rank && (
                          <tr className="bg-stone-50/90 text-stone-700 text-xs">
                            <td colSpan={9} className="p-3.5 border-t border-stone-200">
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                                <span className="text-[10px] font-black uppercase text-stone-400 block tracking-wider">
                                  {t('market.reasoning_label')} — {m.mandi}
                                </span>
                                <p className="text-xs text-stone-800 leading-relaxed">
                                  {m.reasoning}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historical Price Trend & Best-Time-To-Sell Hint */}
          {trendData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Price Line Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-agri-green-700" />
                      {t('market.trends_title')}: {selectedCrop}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {trendData.seasonal_pattern_summary}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl self-start ${
                      trendData.trend_direction === 'rising'
                        ? 'bg-emerald-100 text-emerald-900'
                        : trendData.trend_direction === 'falling'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {trendData.trend_direction === 'rising'
                      ? t('market.trend_badge_rising')
                      : trendData.trend_direction === 'falling'
                      ? t('market.trend_badge_falling')
                      : t('market.trend_badge_stable')}
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        ...trendData.historical_prices.map((p) => ({
                          month: p.month_year,
                          price: p.modal_price,
                          type: 'historical',
                        })),
                        ...trendData.forecast_prices.map((p) => ({
                          month: p.month_year,
                          price: p.modal_price,
                          type: 'forecast',
                        })),
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Modal Price']}
                        labelFormatter={(lbl) => `Month: ${lbl}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#15803d"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#15803d' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200">
                  <span>Green line: APMC monthly modal prices (historical + 3-month seasonal projection)</span>
                  <span className="font-bold text-stone-700">Indicative seasonal pattern</span>
                </div>
              </div>

              {/* Best-Time-To-Sell Hint & Honesty Disclaimer */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-agri-gold-600" />
                    <h3 className="text-sm font-bold text-stone-900">
                      {t('market.best_time_title')}
                    </h3>
                  </div>

                  <div className="bg-agri-cream-100 p-4 rounded-xl border border-agri-gold-300 text-xs text-stone-800 leading-relaxed font-medium">
                    {trendData.best_time_to_sell_hint}
                  </div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                  <span className="font-bold text-stone-900 block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {t('market.disclaimer_title')}
                  </span>
                  <p>{trendData.disclaimer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Warehouses & Cold Storages */}
          {warehouseData && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-agri-green-700" />
                    {t('market.warehouses_title')}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {t('market.warehouses_subtitle')}
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded-xl self-start">
                  DEMO DATASET
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouseData.warehouses.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/60 hover:bg-white hover:shadow-subtle transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-stone-900 block leading-tight">
                        {w.name}
                      </span>
                    </div>
                    <div className="text-stone-600 space-y-0.5">
                      <p>Type: <strong className="text-stone-800">{w.warehouse_type}</strong></p>
                      <p>Distance: <strong className="text-stone-800">{w.distance_km} km</strong> ({w.district})</p>
                      <p>Capacity: <strong className="text-stone-800">{w.capacity_mt.toLocaleString()} MT</strong></p>
                      <p>Daily Rate: <strong className="text-agri-green-800">₹{w.daily_charge_per_quintal}/q/day</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FARMER-TO-BUYER MARKETPLACE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Privacy & Contact Banner */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950 shadow-subtle">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {t('market.privacy_banner_title')} (Honesty Rule 8 & Smallholder Privacy)
              </p>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                {t('market.privacy_banner_desc')}
              </p>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                {t('market.marketplace_title')}
                {marketLoading && <span className="text-xs text-stone-400 font-normal">Loading...</span>}
              </h3>
              <p className="text-xs text-stone-500">
                {t('market.marketplace_subtitle')}
              </p>
            </div>

            <button
              onClick={() => setShowListingModal(true)}
              className="px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t('market.post_listing_btn')}</span>
            </button>
          </div>

          {/* Harvest Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-subtle flex flex-col justify-between space-y-4 hover:border-agri-green-500/60 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-stone-900">
                        {l.crop_name}
                      </h4>
                      <span className="text-[11px] text-stone-500">{l.variety || 'Standard Variety'}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {l.is_verified_seller && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          {t('market.listing_verified_seller')}
                        </span>
                      )}
                      {l.is_owner && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-md">
                          {t('market.listing_owner_badge')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Quantity</span>
                      <strong className="text-stone-900 font-display text-sm">{l.quantity_quintals} q</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Expected Price</span>
                      <strong className="text-agri-green-800 font-display text-sm">₹{l.expected_price_per_q.toLocaleString()}/q</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {l.village}, {l.district}
                      </span>
                      <span>Harvest: <strong>{l.harvest_date}</strong></span>
                    </div>
                  </div>

                  {l.description && (
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {l.description}
                    </p>
                  )}

                  {/* Contact Details Card (Privacy Protected) */}
                  <div className="p-3 rounded-xl border text-xs">
                    {l.contact_unlocked && l.farmer_contact ? (
                      <div className="bg-emerald-50/80 border border-emerald-200 -m-3 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1">
                          <Unlock className="w-3 h-3 text-emerald-700" />
                          {t('market.contact_unlocked_title')}
                        </span>
                        <p className="font-bold text-stone-900">{l.farmer_contact.full_name}</p>
                        <p className="text-[11px] text-stone-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          {l.farmer_contact.phone_number || 'N/A'}
                        </p>
                        <p className="text-[11px] text-stone-700 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-emerald-700" />
                          {l.farmer_contact.email || 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-stone-500 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-stone-600">
                          <Lock className="w-3 h-3 text-stone-400" />
                          {t('market.contact_locked_title')}
                        </span>
                        <p className="text-[10px] leading-relaxed">
                          {t('market.contact_locked_desc')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Listing Action Buttons */}
                <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                  {l.is_owner ? (
                    <div className="flex items-center gap-2 w-full justify-end">
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                      >
                        {t('market.delete_listing_btn')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveListingForInquiry(l);
                        setInqPrice(l.expected_price_per_q);
                        setInqQty(l.quantity_quintals);
                        setShowInquiryModal(true);
                      }}
                      className="w-full px-4 py-2 bg-agri-gold-400 hover:bg-agri-gold-500 text-stone-900 font-bold text-xs rounded-xl shadow-sm transition-all text-center"
                    >
                      {t('market.make_inquiry_btn')}
                    </button>
                  )}

                  {/* Admin verified seller toggle */}
                  {user?.role === 'Admin' && (
                    <div className="w-full pt-1 flex justify-end">
                      <button
                        onClick={() => handleToggleAdminVerify(l.farmer_id, l.is_verified_seller)}
                        className="text-[10px] font-bold text-blue-700 underline"
                      >
                        {l.is_verified_seller ? t('market.admin_unverify_action') : t('market.admin_verify_action')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INQUIRIES & OFFERS INBOX                                            */}
      {/* ========================================================================= */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {t('market.inbox_title')}
              </h3>
              <p className="text-xs text-stone-500">
                Manage buyer procurement offers, trade negotiations, and contact releases.
              </p>
            </div>

            <div className="flex bg-stone-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
              <button
                onClick={() => setInboxTab('received')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  inboxTab === 'received' ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {t('market.inbox_received_tab')}
              </button>
              <button
                onClick={() => setInboxTab('sent')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  inboxTab === 'sent' ? 'bg-white shadow text-agri-green-900' : 'text-stone-600'
                }`}
              >
                {t('market.inbox_sent_tab')}
              </button>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs">
              {t('market.inbox_empty')}
            </div>
          ) : (
            <div className="divide-y divide-stone-200/70">
              {inquiries.map((inq) => (
                <div key={inq.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {inq.listing_crop} ({inq.quantity_quintals} q)
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-md ${
                          inq.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-900'
                            : inq.status === 'declined'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {inq.status === 'accepted'
                          ? t('market.inquiry_status_accepted')
                          : inq.status === 'declined'
                          ? t('market.inquiry_status_declined')
                          : t('market.inquiry_status_pending')}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700">
                      Offered Price: <strong className="text-agri-green-800">₹{inq.offered_price_per_q.toLocaleString()}/q</strong> &bull; Buyer: <strong className="text-stone-800">{inq.buyer_name}</strong>
                    </p>

                    {inq.message && (
                      <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                        "{inq.message}"
                      </p>
                    )}

                    {/* Unlocked Farmer Contact if accepted */}
                    {inq.contact_unlocked && inq.farmer_contact && (
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300 text-xs text-emerald-950 space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-emerald-800 block">
                          {t('market.contact_unlocked_title')}
                        </span>
                        <p className="font-bold">{inq.farmer_contact.full_name}</p>
                        <p className="text-[11px] text-stone-700">Phone: <strong>{inq.farmer_contact.phone_number || 'N/A'}</strong> &bull; Email: {inq.farmer_contact.email || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for Farmer (Accept/Decline) */}
                  {inq.status === 'pending' && user?.role === 'Farmer' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleInquiryDecision(inq.id, 'accepted')}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('market.accept_btn')}
                      </button>
                      <button
                        onClick={() => handleInquiryDecision(inq.id, 'declined')}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-all"
                      >
                        {t('market.decline_btn')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE LISTING                                                      */}
      {/* ========================================================================= */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-agri-green-700" />
              {t('market.post_listing_btn')}
            </h3>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Crop</label>
                  <input
                    type="text"
                    required
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Variety</label>
                  <input
                    type="text"
                    value={newVariety}
                    onChange={(e) => setNewVariety(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Expected Price (₹/q)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 100)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={newHarvestDate}
                    onChange={(e) => setNewHarvestDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Quality & Logistics Notes</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  Submit Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT INQUIRY / OFFER                                              */}
      {/* ========================================================================= */}
      {showInquiryModal && activeListingForInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">
              {t('market.inquiry_modal_title')} — {activeListingForInquiry.crop_name}
            </h3>

            <p className="text-xs text-stone-600">
              Listing: {activeListingForInquiry.quantity_quintals} q in {activeListingForInquiry.village} (Farmer asking ₹{activeListingForInquiry.expected_price_per_q}/q)
            </p>

            <form onSubmit={handleSubmitInquiry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('market.offered_price_label')}
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={inqPrice}
                    onChange={(e) => setInqPrice(parseFloat(e.target.value) || 100)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('market.inquiry_qty_label')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeListingForInquiry.quantity_quintals}
                    required
                    value={inqQty}
                    onChange={(e) => setInqQty(parseFloat(e.target.value) || 1)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('market.inquiry_message_label')}
                </label>
                <textarea
                  rows={2}
                  value={inqMsg}
                  onChange={(e) => setInqMsg(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-agri-gold-400 hover:bg-agri-gold-500 text-stone-900 font-bold text-xs rounded-xl shadow"
                >
                  {t('market.submit_inquiry_action')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
