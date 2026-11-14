import React, { useState, useEffect } from 'react';
import {
  Store,
  TrendingUp,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Check,
  ArrowRight,
  Truck,
  ChevronDown,
  ChevronUp,
  Lock,
  Sliders,
  Phone,
  Mail,
  RotateCcw,
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
import { usePictorial } from '../context/PictorialContext';
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
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { MoneyProfitIllustration, CoinStackGauge, NoDataIllustration } from '../components/common/FarmerIllustrations';
import { ModeToggleHero } from '../components/common/ModeToggleHero';
import { PictorialTile } from '../components/common/PictorialTile';
import { StatusBadge } from '../components/common/StatusBadge';
import { StepFlow } from '../components/common/StepFlow';

export const MarketPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { user, activeFarm, activeCrop, location } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'mandi' | 'marketplace' | 'inquiries'>('mandi');

  // Mandi & Ranking States
  const [selectedCrop, setSelectedCrop] = useState<string>(activeCrop || 'Cotton');
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
  const [newCrop, setNewCrop] = useState<string>(activeCrop || 'Cotton');
  const [newVariety, setNewVariety] = useState<string>('Bollgard II Hybrid');
  const [newQty, setNewQty] = useState<number>(30.0);
  const [newPrice, setNewPrice] = useState<number>(7250.0);
  const [newVillage, setNewVillage] = useState<string>(
    activeFarm?.village || location?.village || 'Geikonda'
  );
  const [newHarvestDate, setNewHarvestDate] = useState<string>('2027-01-20');
  const [newDesc, setNewDesc] = useState<string>('Quality harvested crop, moisture below 8%.');

  useEffect(() => {
    if (activeCrop) {
      setSelectedCrop(activeCrop);
      setNewCrop(activeCrop);
    }
    if (activeFarm?.village) {
      setNewVillage(activeFarm.village);
    }
  }, [activeFarm, activeCrop]);

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
        state: activeFarm?.state || location?.state || 'Telangana',
        district: activeFarm?.district || location?.district || 'Warangal',
        village: newVillage || activeFarm?.village || 'Geikonda',
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
      setFeedbackMsg('Inquiry submitted to seller!');
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    }
  };

  const handleUpdateStatus = async (inquiryId: number, status: 'accepted' | 'declined') => {
    try {
      await updateInquiryStatus(inquiryId, status);
      setFeedbackMsg(`Inquiry marked as ${status}`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteMarketplaceListing(id);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  const handleToggleAdminVerify = async (farmerId: number, curStatus: boolean) => {
    try {
      await verifyFarmer(farmerId, !curStatus);
      setFeedbackMsg(`Farmer verification status updated to ${!curStatus ? 'VERIFIED' : 'UNVERIFIED'}.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to verify farmer:', err);
    }
  };

  const bestMandi = rankingData?.rankings?.[0];
  const isLiveMandi = Boolean(rankingData?.source && !rankingData.source.toLowerCase().includes('demo'));

  const plainMeaning = bestMandi
    ? `Selling ${quantity} quintals of ${selectedCrop} at ${bestMandi.mandi} gives your highest net payout of ₹${bestMandi.net_realization_per_q.toFixed(0)}/q after deducting transport and mandi fees.`
    : 'Calculating net mandi realization rankings...';

  // PICTORIAL MODE v2
  if (isPictorial) {
    const hasMandi = Boolean(bestMandi);

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Giant Mode & Language Switcher at Top */}
        <ModeToggleHero />

        <PageHeader
          icon={Store}
          title={language === 'te' ? 'మార్కెట్ ధరలు' : language === 'hi' ? 'मंडी के भाव' : 'Market Prices'}
          purpose={language === 'te' ? 'దగ్గర్లోని మార్కెట్లలో ధరలు మరియు లాభం చూడండి' : language === 'hi' ? 'नजदीकी मंडियों के भाव और शुद्ध कमाई देखें' : 'Visual market prices and best net mandi payout.'}
        />

        {/* Lead "Do This Today" Best Mandi Card */}
        <div className="bg-[#FFFDF8] rounded-3xl border-2 border-[#1B5E3B] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-[#FFF8E1] border-2 border-[#F2B01E] flex items-center justify-center shrink-0 shadow-sm">
              {hasMandi ? <MoneyProfitIllustration size={64} /> : <NoDataIllustration size={64} />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[13px] font-black uppercase tracking-wider text-[#1B5E3B] bg-[#1B5E3B]/10 px-2.5 py-1 rounded-md">
                  {selectedCrop} &bull; {hasMandi ? bestMandi!.mandi : 'Market'}
                </span>
                <StatusBadge
                  status={hasMandi ? (isLiveMandi ? 'success' : 'demo') : 'nodata'}
                  label={hasMandi ? (isLiveMandi ? 'Live APMC' : 'DEMO DATA') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No Data')}
                  size="sm"
                />
              </div>
              <h2 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1F2A24] leading-snug flex items-center flex-wrap gap-2">
                {hasMandi ? (
                  <>
                    <span>₹{bestMandi!.net_realization_per_q.toFixed(0)}/q net ({bestMandi!.mandi}, {bestMandi!.distance_km} km)</span>
                    {!isLiveMandi && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        DEMO DATA
                      </span>
                    )}
                  </>
                ) : (
                  language === 'te' ? 'మండి ధరలు ఇంకా లోడ్ కాలేదు' : language === 'hi' ? 'మండి भाव अभी लोड नहीं हुए' : 'Awaiting Mandi Prices'
                )}
              </h2>
              <p className="text-[16px] text-[#4A5750] max-w-xl">
                {hasMandi ? plainMeaning : (language === 'te' ? 'రవాణా ఖర్చులు తీసివేసిన తర్వాత అత్యధిక నికర రాబడిని చూపే మండి ర్యాంకింగ్స్.' : language === 'hi' ? 'परिवहन खर्च घटाने के बाद सर्वाधिक शुद्ध लाभ वाली मंडियों की सूची।' : 'Transport-adjusted net payout rankings comparing local APMCs.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            {hasMandi && (
              <ReadAloudButton
                text={`Best mandi for ${selectedCrop} is ${bestMandi!.mandi}. ${plainMeaning}`}
                label={language === 'te' ? 'వినండి' : language === 'hi' ? 'सुनें' : 'Listen'}
              />
            )}
            <button
              type="button"
              onClick={() => setMode('words')}
              className="min-h-[56px] px-6 py-3 rounded-2xl font-bold bg-[#1B5E3B] text-white hover:bg-[#265C46] flex items-center gap-2 text-[18px] shadow-sm transition-all"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు' : language === 'hi' ? 'पूरा विवरण' : 'See Details'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Pictorial Summary Tiles with Real Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Tile 1: Best Net Mandi Realization */}
          <PictorialTile
            title={language === 'te' ? 'అత్యధిక నికర ధర' : language === 'hi' ? 'सर्वोत्तम शुद्ध भाव' : 'Best Net Mandi'}
            phrase={hasMandi ? `${bestMandi!.mandi}: ₹${bestMandi!.net_realization_per_q.toFixed(0)}/q ${!isLiveMandi ? '(DEMO DATA)' : ''}` : (language === 'te' ? 'మండి ధరలు లేవు' : language === 'hi' ? 'मंडी भाव नहीं हैं' : 'No mandi loaded')}
            illustration={hasMandi ? <CoinStackGauge netProfit={bestMandi!.net_realization} className="w-20 h-20" /> : <NoDataIllustration size={80} />}
            status={hasMandi ? (isLiveMandi ? 'success' : 'demo') : 'nodata'}
            statusWord={hasMandi ? (isLiveMandi ? 'Best Mandi' : 'DEMO DATA') : (language === 'te' ? 'డేటా లేదు' : language === 'hi' ? 'डेटा नहीं' : 'No data yet')}
            spokenText={hasMandi ? `Best net realization is at ${bestMandi!.mandi} offering ${bestMandi!.net_realization_per_q.toFixed(0)} rupees per quintal net.` : 'No mandi prices loaded yet.'}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 2: Government MSP Benchmark */}
          <PictorialTile
            title={language === 'te' ? 'కనీస మద్దతు ధర (MSP)' : language === 'hi' ? 'न्यूनतम समर्थन मूल्य (MSP)' : 'MSP Benchmark'}
            phrase={language === 'te' ? 'వివరాలు ధృవీకరించండి' : language === 'hi' ? 'सत्यापन आवश्यक (विवरण जांचें)' : 'details to verify'}
            illustration={<NoDataIllustration size={80} />}
            status="nodata"
            statusWord={language === 'te' ? 'ధృవీకరించండి' : language === 'hi' ? 'सत्यापन आवश्यक' : 'details to verify'}
            spokenText="Minimum Support Price benchmark details require local verification. No unverified prices are shown."
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          {/* Tile 3: Direct Trade Listings */}
          <PictorialTile
            title={language === 'te' ? 'రైతు విక్రయాలు' : language === 'hi' ? 'किसान खरीद-बिक्री' : 'Direct Trade'}
            phrase={`${listings.length} trade listings in area`}
            illustration={<Truck className="w-16 h-16 text-[#1B5E3B]" />}
            status="info"
            statusWord={`${listings.length} Listings`}
            spokenText={`There are ${listings.length} active peer-to-peer trade listings in your region.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>

        {/* 3-Step Mandi Selection StepFlow */}
        <StepFlow
          heading={language === 'te' ? 'మార్కెట్ ఎంపికలో 3 దశలు' : language === 'hi' ? 'मंडी चयन के 3 सरल कदम' : '3 Mandi Decision Steps'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'ధరలు పరిశీలించండి' : language === 'hi' ? 'भाव देखें' : 'Check Mandi Prices',
              desc: language === 'te' ? 'దగ్గర్లోని మార్కెట్లలో క్వింటాల్ మోడల్ ధర తెలుసుకోండి' : language === 'hi' ? 'आस-पास की मंडियों में मॉडल भाव देखें' : 'Compare modal prices across nearby APMC yards',
              icon: Store,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'రవాణా ఖర్చు తీసివేయండి' : language === 'hi' ? 'किराया घटाएं' : 'Deduct Transport Cost',
              desc: language === 'te' ? 'దూరం మరియు డీజిల్ ఖర్చు తీసివేసి నికర ధర లెక్కించండి' : language === 'hi' ? 'दूरी और मालभाड़ा घटाकर शुद्ध प्राप्ति निकालें' : 'Calculate net realization after transport and market fees',
              icon: Truck,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'ఉత్తమ మండిని ఎంచుకోండి' : language === 'hi' ? 'सही मंडी चुनें' : 'Choose Best Mandi',
              desc: language === 'te' ? 'చేతికి ఎక్కువ డబ్బు వచ్చే మార్కెట్ కు సరుకు తీసుకెళ్లండి' : language === 'hi' ? 'जहाँ शुद्ध कमाई सबसे ज्यादा हो, वही मंडी चुनें' : 'Direct produce to the highest net-yield market',
              icon: TrendingUp,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* PAGE HEADER */}
      <PageHeader
        icon={Store}
        title={t('market.title', { defaultValue: 'Mandi Trade & Farm-Gate Marketplace' })}
        purpose={t('market.subtitle', { defaultValue: 'Compare net realizations across regional APMC mandis, check MSP benchmarks, and list harvests.' })}
        whatIsThis={{
          summary: language === 'te'
            ? 'రవాణా ఖర్చులు మరియు మార్కెట్ రుసుములు మినహాయించిన తర్వాత ప్రతి మార్కెట్‌లో చేతికి వచ్చే అసలు నికర ఆదాయాన్ని లెక్కిస్తుంది.'
            : language === 'hi'
              ? 'किराया और मंडी टैक्स काटने के बाद हर मंडी में किसान के हाथ में आने वाली असली शुद्ध कमाई की गणना करता है।'
              : 'Calculates the real in-hand cash you earn per quintal after deducting fuel and market cess for every nearby APMC mandi.',
          whatToEnter: language === 'te'
            ? 'పంట రకం, పరిమాణం (క్వింటాళ్లలో), మరియు రవాణా రేటు.'
            : language === 'hi'
              ? 'अपनी फसल, मात्रा (क्विंटल में) और अनुमानित भाड़ा दर।'
              : 'Your harvested crop, total volume in quintals, and optional transport rate assumption.',
          whatYouGet: language === 'te'
            ? 'ఏ మార్కెట్‌లో అత్యధిక లాభం వస్తుందో ర్యాంకింగ్, మరియు దళారులు లేకుండా నేరుగా కొనుగోలుదారులతో మాట్లాడే సదుపాయం.'
            : language === 'hi'
              ? 'सबसे ज्यादा मुनाफा देने वाली मंडी की रैंकिंग और सीधे खरीदारों से जुड़ने की सुविधा।'
              : 'Clear rankings showing where you pocket the most money, plus a direct marketplace to sell to buyers without middlemen.',
        }}
      />

      {/* Global Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-[#FEF6E9] border border-[#DA9A4C] text-[#183D2E] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <Check className="w-4 h-4 text-[#DA9A4C] shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* LEAD SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Top Mandi Net Realization */}
        <div className="bg-gradient-to-br from-[#FEF6E9] to-white rounded-2xl border-2 border-[#DA9A4C] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Top Mandi Realization
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                {selectedCrop}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#183D2E]">
                {bestMandi ? bestMandi.mandi : 'Warangal Mandi'}
              </h2>
              <span className="text-xs font-semibold text-[#7A553A]">
                {bestMandi ? `${bestMandi.distance_km} km` : '15 km'}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-display font-black text-[#183D2E] flex items-center flex-wrap gap-2">
              {bestMandi ? (
                <>
                  <span>₹{bestMandi.net_realization_per_q.toFixed(0)}</span>
                  <span className="text-xs font-semibold text-[#7A553A]">/ q net</span>
                  {!isLiveMandi && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      DEMO DATA
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl text-[#7A553A]">Awaiting prices</span>
              )}
            </div>

            <p className="text-xs text-[#4E5F57] leading-relaxed">
              Total Net Payout: <strong>{bestMandi ? `₹${bestMandi.net_realization.toLocaleString('en-IN')}` : 'Calculating...'}</strong> for {quantity} quintals {!isLiveMandi && <span className="font-bold text-amber-800">(DEMO DATA)</span>}.
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Best mandi for ${selectedCrop} is ${bestMandi?.mandi || 'nearby APMC'}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('mandi')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>View All Mandis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: MSP Benchmark & Price Defense */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#DA9A4C]" />
                MSP Benchmark (details to verify)
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                Indicative Reference
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#7A553A]">MSP Benchmark:</span>
                <strong className="text-base font-bold text-[#183D2E]">
                  {mspData?.benchmark?.msp_per_quintal
                    ? `₹${mspData.benchmark.msp_per_quintal.toLocaleString('en-IN')} / q (Indicative)`
                    : 'Details to verify (No benchmark record)'}
                </strong>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#7A553A]">Market Realization:</span>
                <strong className="text-xs font-bold text-[#183D2E]">
                  {bestMandi
                    ? `₹${bestMandi.net_realization_per_q.toFixed(0)} / q ${!isLiveMandi ? '(DEMO DATA)' : ''}`
                    : 'Awaiting APMC Prices'}
                </strong>
              </div>
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote="APMC mandi prices and MSP benchmarks are modelled, indicative values (details to verify with local APMC)."
            />
          </div>
        </div>

        {/* Card 3: Freight & Cess Logistics Deduction */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#DA9A4C]" />
                Transport & Cess Math
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                ₹{transportRate}/km/q
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <div className="flex justify-between text-[#4E5F57]">
                <span>Gross Realization ({quantity} q):</span>
                <strong>
                  {bestMandi ? `₹${(bestMandi.modal_price * quantity).toLocaleString('en-IN')}` : 'Calculating...'}
                  {!isLiveMandi && <span className="ml-1 text-[9px] font-bold text-amber-800">(DEMO DATA)</span>}
                </strong>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Freight Logistics:</span>
                <strong>-₹{bestMandi ? bestMandi.transport_cost.toLocaleString('en-IN') : '750'}</strong>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Mandi Cess ({marketFeePct}%):</span>
                <strong>-₹{bestMandi ? bestMandi.market_fee.toLocaleString('en-IN') : '1,440'}</strong>
              </div>
            </div>

            <p className="text-[11px] text-[#7A553A]">
              Gross modal price is misleading without transport cost. Always choose based on net realization.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('marketplace');
              setShowListingModal(true);
            }}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-[#DA9A4C] bg-[#FEF6E9] hover:bg-[#FAF8F5] font-bold text-xs text-[#183D2E] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#DA9A4C]" />
            <span>List Harvest for Farm-Gate Sale</span>
          </button>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div className="bg-white rounded-3xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        <div className="flex border-b border-[#7A553A]/15 bg-[#FAF8F5] px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('mandi')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'mandi'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
              }`}
          >
            <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
            <span>Mandi Rankings & Trends</span>
            {mandiLoading && <span className="text-[10px] text-[#7A553A] font-normal">(Loading...)</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'marketplace'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
              }`}
          >
            <Store className="w-4 h-4 text-[#DA9A4C]" />
            <span>Farm-Gate Marketplace</span>
            {listings.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-[#183D2E] text-white">
                {listings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'inquiries'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
              }`}
          >
            <Mail className="w-4 h-4 text-[#DA9A4C]" />
            <span>Buyer Inquiries & Inbox</span>
            {inquiries.length > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-[#DA9A4C] text-[#183D2E] font-black">
                {inquiries.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB 1: MANDI INTELLIGENCE & RANKINGS */}
          {activeTab === 'mandi' && (
            <div className="space-y-6">
              {/* DEMO DATA Banner */}
              {rankingData?.demo && (
                <div className="bg-[#FEF6E9] border border-[#DA9A4C] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#183D2E]">
                  <AlertTriangle className="w-5 h-5 text-[#DA9A4C] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span className="bg-[#DA9A4C] text-white px-2 py-0.5 rounded font-black text-[10px]">
                        DEMO DATA
                      </span>
                      &bull; Source: datasets/demo/mandi_prices.csv
                    </p>
                    <p className="text-[11px] text-[#7A553A] leading-relaxed">
                      APMC modal prices and transport rates are calibrated on illustrative market datasets.
                    </p>
                  </div>
                </div>
              )}

              {/* Assumptions & Controls */}
              <div className="p-4 sm:p-5 bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#7A553A]/15 pb-3">
                  <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#DA9A4C]" />
                    <span>Realization Simulator Parameters</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(20.0);
                      setTransportRate(2.50);
                      setMarketFeePct(1.0);
                    }}
                    className="text-xs font-semibold text-[#7A553A] hover:text-[#183D2E] flex items-center gap-1 self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-[#183D2E] block mb-1">Crop</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 bg-white font-medium"
                    >
                      <option value="Cotton">Cotton</option>
                      <option value="Paddy (Dhan)">Paddy (Dhan)</option>
                      <option value="Maize">Maize</option>
                      <option value="Red Gram (Tur)">Red Gram (Tur)</option>
                      <option value="Chilli (Dry)">Chilli (Dry)</option>
                      <option value="Soyabean">Soyabean</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#183D2E] block mb-1">Harvest Volume (Quintals)</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 bg-white font-medium"
                      min={1}
                      step={1}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#183D2E] block mb-1">Transport Rate (₹/km/q)</label>
                    <input
                      type="number"
                      value={transportRate}
                      onChange={(e) => setTransportRate(parseFloat(e.target.value) || 0)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 bg-white font-medium"
                      step={0.1}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#183D2E] block mb-1">Market Fee / Cess (%)</label>
                    <input
                      type="number"
                      value={marketFeePct}
                      onChange={(e) => setMarketFeePct(parseFloat(e.target.value) || 0)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 bg-white font-medium"
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Mandi Rankings Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#183D2E]">
                    APMC Mandis Ranked by Net Realization ({selectedCrop})
                  </h3>
                  <span className="text-xs text-[#7A553A]">
                    Formula: (Modal Price &times; Qty) - Transport Cost - Mandi Fee
                  </span>
                </div>

                {rankingData && rankingData.rankings.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-[#7A553A]/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F5] text-[#183D2E] border-b border-[#7A553A]/20">
                          <th className="p-3 font-bold">Rank</th>
                          <th className="p-3 font-bold">Mandi</th>
                          <th className="p-3 font-bold">Distance</th>
                          <th className="p-3 font-bold">Modal Price</th>
                          <th className="p-3 font-bold">Transport Cost</th>
                          <th className="p-3 font-bold">Mandi Fee</th>
                          <th className="p-3 font-bold">Net Realization / q</th>
                          <th className="p-3 font-bold">Total Net Payout {!isLiveMandi && <span className="text-[10px] font-normal text-amber-800">(DEMO)</span>}</th>
                          <th className="p-3 font-bold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#7A553A]/15">
                        {rankingData.rankings.map((m) => (
                          <React.Fragment key={m.rank}>
                            <tr
                              className={`hover:bg-[#FAF8F5]/60 transition-colors ${m.rank === 1 ? 'bg-[#FEF6E9] font-bold' : ''
                                }`}
                            >
                              <td className="p-3">
                                <span
                                  className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-black ${m.rank === 1
                                      ? 'bg-[#183D2E] text-white'
                                      : m.rank === 2
                                        ? 'bg-[#DA9A4C] text-[#183D2E]'
                                        : 'bg-stone-200 text-stone-700'
                                    }`}
                                >
                                  {m.rank}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-[#183D2E]">{m.mandi}</div>
                                <span className="text-[10px] text-[#7A553A]">{m.district}, {m.state}</span>
                              </td>
                              <td className="p-3 text-[#4E5F57]">{m.distance_km} km</td>
                              <td className="p-3 text-[#4E5F57]">₹{m.modal_price.toLocaleString('en-IN')} {!isLiveMandi && <span className="text-[10px] font-bold text-amber-800">(DEMO)</span>}</td>
                              <td className="p-3 text-red-700 font-medium">-₹{m.transport_cost.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-[#7A553A]">-₹{m.market_fee.toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <span className="font-extrabold text-[#183D2E]">
                                  ₹{m.net_realization_per_q.toFixed(0)} {!isLiveMandi && <span className="text-[10px] font-bold text-amber-800">(DEMO)</span>}
                                </span>
                              </td>
                              <td className="p-3 font-extrabold text-[#183D2E]">
                                ₹{m.net_realization.toLocaleString('en-IN')} {!isLiveMandi && <span className="text-[10px] font-bold text-amber-800">(DEMO)</span>}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedReasoning(expandedReasoning === m.rank ? null : m.rank)}
                                  className="text-xs text-[#7A553A] hover:text-[#183D2E] p-1 inline-flex items-center"
                                  aria-label="Toggle details"
                                >
                                  {expandedReasoning === m.rank ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {expandedReasoning === m.rank && (
                              <tr className="bg-[#FAF8F5]">
                                <td colSpan={9} className="p-4 text-xs space-y-1">
                                  <p className="font-bold text-[#183D2E]">Economic Reasoning:</p>
                                  <p className="text-[#4E5F57] leading-relaxed">{m.reasoning}</p>
                                  <p className="text-[10px] text-[#7A553A]">
                                    Source: {m.source} &bull; Indicative data to verify before hauling produce.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 text-center py-6">Loading rankings...</p>
                )}
              </div>

              {/* Price Trend Chart & Seasonal Outlook */}
              {trendData && (
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#DA9A4C]" />
                        <span>Price Trend & Seasonal Projection ({selectedCrop})</span>
                      </h3>
                      <p className="text-xs text-[#7A553A]">{trendData.seasonal_pattern_summary}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl self-start ${trendData.trend_direction === 'rising'
                          ? 'bg-emerald-100 text-emerald-900'
                          : trendData.trend_direction === 'falling'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                    >
                      {trendData.trend_direction.toUpperCase()}
                    </span>
                  </div>

                  <div className="h-56 w-full pt-1" style={{ minHeight: '200px' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart
                        data={[
                          ...trendData.historical_prices.map((p) => ({
                            month: p.month_year,
                            price: p.modal_price,
                            type: 'Historical',
                          })),
                          ...trendData.forecast_prices.map((p) => ({
                            month: p.month_year,
                            price: p.modal_price,
                            type: 'Forecast',
                          })),
                        ]}
                        margin={{ top: 10, right: 20, left: 15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#EFE7DE" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#7A553A' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#7A553A' }} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          formatter={(value: any) => [`₹${value}`, 'Modal Price']}
                          contentStyle={{ backgroundColor: '#FAF8F5', borderColor: '#DA9A4C', borderRadius: '0.75rem', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="price" stroke="#183D2E" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-xs text-[#4E5F57] flex flex-col sm:flex-row justify-between gap-2 border-t border-[#7A553A]/15 pt-2">
                    <span>{trendData.best_time_to_sell_hint}</span>
                    <span className="text-[10px] text-[#7A553A]">{trendData.disclaimer}</span>
                  </div>
                </div>
              )}

              {/* Nearby Warehouses & Cold Storages */}
              {warehouseData?.warehouses && warehouseData.warehouses.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#DA9A4C]" />
                    <span>Nearby WDRA Accredited Warehouses (Eligible for e-NWR Pledge Loans)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {warehouseData.warehouses.map((wh) => (
                      <div key={wh.name} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/20 text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <strong className="text-[#183D2E]">{wh.name}</strong>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            {wh.distance_km} km away
                          </span>
                        </div>
                        <p className="text-[#4E5F57]">{wh.district}, {wh.state} ({wh.warehouse_type})</p>
                        <p className="text-[11px] text-[#7A553A]">
                          Capacity: {wh.capacity_mt.toLocaleString('en-IN')} MT &bull; Daily Charge: ₹{wh.daily_charge_per_quintal}/q/day
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FARM-GATE MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="space-y-5">
              {/* Privacy Banner */}
              <div className="bg-[#FAF8F5] border border-[#DA9A4C] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#183D2E]">
                <Lock className="w-5 h-5 text-[#DA9A4C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Farmer Contact Privacy Protection (Smallholder Privacy)
                  </p>
                  <p className="text-[11px] text-[#7A553A] leading-relaxed">
                    Farmer phone numbers and precise farm locations are never displayed publicly. Phone contact is released only when a buyer makes an inquiry and the farmer accepts the offer.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#7A553A]/15">
                <div>
                  <h3 className="text-base font-bold text-[#183D2E]">
                    Available Harvest Batches
                    {marketLoading && <span className="text-xs text-stone-400 font-normal ml-2">Loading...</span>}
                  </h3>
                  <p className="text-xs text-[#7A553A]">
                    Direct farm-gate listings with verified village sources.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowListingModal(true)}
                  className="min-h-[44px] px-4 py-2 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-[#DA9A4C]" />
                  <span>Post Harvest Listing</span>
                </button>
              </div>

              {listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#7A553A]/20 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#DA9A4C] transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#DA9A4C] uppercase tracking-wider block">
                              {item.crop_name}
                            </span>
                            <h4 className="text-base font-bold text-[#183D2E]">{item.variety || 'Standard Quality'}</h4>
                          </div>
                          <span className="text-xs font-black text-[#183D2E] bg-white px-2 py-1 rounded-lg border border-[#7A553A]/15">
                            ₹{item.expected_price_per_q}/q
                          </span>
                        </div>

                        <p className="text-xs text-[#4E5F57] line-clamp-2">{item.description}</p>

                        <div className="text-[11px] text-[#7A553A] space-y-0.5">
                          <div>Quantity: <strong>{item.quantity_quintals} quintals</strong></div>
                          <div>Village: <strong>{item.village}, {item.district}</strong></div>
                          <div>Harvest Date: <strong>{item.harvest_date}</strong></div>
                          <div>Seller: <strong>{item.farmer_name}</strong> {item.is_verified_seller && <span className="text-emerald-700 font-bold ml-1">✓ Verified</span>}</div>
                        </div>

                        {item.contact_unlocked && item.farmer_contact && (
                          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                            <span className="font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Contact Released:</span>
                            <p>{item.farmer_contact.full_name}: {item.farmer_contact.phone_number}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-[#7A553A]/15">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveListingForInquiry(item);
                              setShowInquiryModal(true);
                            }}
                            className="min-h-[40px] px-4 py-2 bg-[#DA9A4C] hover:bg-[#C28538] text-[#183D2E] font-bold text-xs rounded-xl transition-all shadow-sm flex-1 text-center"
                          >
                            Send Inquiry
                          </button>
                          {(user?.id === item.farmer_id || item.is_owner) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(item.id)}
                              className="min-h-[40px] px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {user?.role === 'Admin' && (
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleAdminVerify(item.farmer_id, item.is_verified_seller)}
                              className="text-[10px] font-bold text-blue-700 underline"
                            >
                              {item.is_verified_seller ? 'Admin: Unverify' : 'Admin: Verify Seller'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 text-center py-6">No marketplace listings available.</p>
              )}
            </div>
          )}

          {/* TAB 3: INQUIRIES & INBOX */}
          {activeTab === 'inquiries' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-[#7A553A]/15 pb-3">
                <button
                  type="button"
                  onClick={() => setInboxTab('received')}
                  className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${inboxTab === 'received' ? 'bg-[#183D2E] text-white shadow' : 'bg-[#FAF8F5] text-[#7A553A]'
                    }`}
                >
                  Received Inquiries
                </button>
                <button
                  type="button"
                  onClick={() => setInboxTab('sent')}
                  className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${inboxTab === 'sent' ? 'bg-[#183D2E] text-white shadow' : 'bg-[#FAF8F5] text-[#7A553A]'
                    }`}
                >
                  Sent Inquiries
                </button>
              </div>

              {inquiries.length > 0 ? (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#183D2E] text-sm">Offer: ₹{inq.offered_price_per_q}/q</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inq.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              inq.status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-stone-200 text-stone-800'
                            }`}>
                            {inq.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[#4E5F57]">{inq.message}</p>
                        <span className="text-[10px] text-[#7A553A] block">
                          Crop: {inq.listing_crop} &bull; Quantity: {inq.quantity_quintals} q &bull; Date: {new Date(inq.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {inq.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(inq.id, 'accepted')}
                            className="min-h-[36px] px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                          >
                            Accept Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(inq.id, 'declined')}
                            className="min-h-[36px] px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 text-center py-6">No trade inquiries in this view.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Marketplace Listing */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl border border-[#7A553A]/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#7A553A]/15">
              <h3 className="text-lg font-bold text-[#183D2E]">Post Harvest Listing</h3>
              <button
                type="button"
                onClick={() => setShowListingModal(false)}
                className="text-stone-500 hover:text-stone-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#183D2E] block mb-1">Crop</label>
                <input
                  type="text"
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#183D2E] block mb-1">Variety</label>
                <input
                  type="text"
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#183D2E] block mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#183D2E] block mb-1">Expected Price (₹/q)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#183D2E] block mb-1">Harvest Date</label>
                <input
                  type="date"
                  value={newHarvestDate}
                  onChange={(e) => setNewHarvestDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                />
              </div>

              <div>
                <label className="font-bold text-[#183D2E] block mb-1">Notes / Moisture Quality</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full min-h-[70px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A553A]/30 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[#183D2E] text-white font-bold"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Buyer Inquiry */}
      {showInquiryModal && activeListingForInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl border border-[#7A553A]/20">
            <div className="flex items-center justify-between pb-2 border-b border-[#7A553A]/15">
              <h3 className="text-lg font-bold text-[#183D2E]">
                Make Offer for {activeListingForInquiry.crop_name}
              </h3>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="text-stone-500 hover:text-stone-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInquiry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#183D2E] block mb-1">Offered Price (₹/q)</label>
                  <input
                    type="number"
                    value={inqPrice}
                    onChange={(e) => setInqPrice(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#183D2E] block mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    value={inqQty}
                    onChange={(e) => setInqQty(parseFloat(e.target.value) || 0)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#183D2E] block mb-1">Message</label>
                <textarea
                  value={inqMsg}
                  onChange={(e) => setInqMsg(e.target.value)}
                  className="w-full min-h-[70px] px-3 py-2 rounded-xl border border-[#7A553A]/30"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#7A553A]/30 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[#183D2E] text-white font-bold"
                >
                  Send Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage;
