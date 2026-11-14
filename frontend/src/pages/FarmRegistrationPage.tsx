import React, { useState, useEffect } from 'react';
import {
  Tractor,
  Plus,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
  Droplets,
  Edit3,
  X,
} from 'lucide-react';
import { farmsApi } from '../api/farms';
import { Farm, OwnershipType, IrrigationMethod } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { usePictorial } from '../context/PictorialContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { WhatThisMeans } from '../components/common/WhatThisMeans';
import { ReadAloudButton } from '../components/common/ReadAloudButton';
import { WateringFieldIllustration } from '../components/common/FarmerIllustrations';
import { PictorialTile } from '../components/common/PictorialTile';
import { translateBackendString } from '../utils/safeTranslation';
import { StepFlow } from '../components/common/StepFlow';
import {
  getIndianStates,
  getDistrictsForState,
  getDistrictCoordinates,
  getLocalizedStateName,
  getLocalizedDistrictName,
} from '../utils/indiaGeo';

export const FarmRegistrationPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { isPictorial, setMode } = usePictorial();
  const { setActiveFarmId, refreshFarms, activeFarmId, activeFarm } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [errorFarms, setErrorFarms] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'register' | 'holdings'>('register');
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState('East Valley Parcel');
  const [area, setArea] = useState<number>(6.0);
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('mixed');
  const [ownedArea, setOwnedArea] = useState<number>(4.0);
  const [leasedArea, setLeasedArea] = useState<number>(2.0);
  const [leaseAmount, setLeaseAmount] = useState<number>(14000.0);
  const [soilType, setSoilType] = useState('Black Cotton');
  const [waterSource, setWaterSource] = useState('Canal');
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationMethod>('drip');
  const [budget, setBudget] = useState<number>(40000.0);
  const [village, setVillage] = useState('Dharmasagar');
  const [district, setDistrict] = useState('Warangal');
  const [state, setState] = useState('Telangana');
  const [latitude, setLatitude] = useState<number>(17.9689);
  const [longitude, setLongitude] = useState<number>(79.5941);
  const [isCoordFallback, setIsCoordFallback] = useState<boolean>(false);

  // Edit Farm State
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editArea, setEditArea] = useState<number>(0);
  const [editState, setEditState] = useState<string>('Telangana');
  const [editDistrict, setEditDistrict] = useState<string>('Warangal');
  const [editVillage, setEditVillage] = useState<string>('');
  const [editLatitude, setEditLatitude] = useState<number>(17.9689);
  const [editLongitude, setEditLongitude] = useState<number>(79.5941);
  const [editIsFallback, setEditIsFallback] = useState<boolean>(false);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const districts = getDistrictsForState(newState);
    if (districts.length > 0) {
      const firstDistrict = districts[0];
      setDistrict(firstDistrict.name);
      setLatitude(firstDistrict.latitude);
      setLongitude(firstDistrict.longitude);
      setIsCoordFallback(Boolean(firstDistrict.is_fallback));
    } else {
      setDistrict('');
      const coords = getDistrictCoordinates(newState, '');
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setIsCoordFallback(true);
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const coords = getDistrictCoordinates(state, newDistrict);
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setIsCoordFallback(coords.isFallback);
  };

  const startEditFarm = (f: Farm) => {
    setEditingFarm(f);
    setEditName(f.name);
    setEditArea(f.area);
    setEditVillage(f.village || '');
    setEditState(f.state);
    setEditDistrict(f.district);
    setEditLatitude(f.latitude);
    setEditLongitude(f.longitude);
    setEditIsFallback(false);
    setEditError(null);
  };

  const handleEditStateChange = (newState: string) => {
    setEditState(newState);
    const districts = getDistrictsForState(newState);
    if (districts.length > 0) {
      const firstDistrict = districts[0];
      setEditDistrict(firstDistrict.name);
      setEditLatitude(firstDistrict.latitude);
      setEditLongitude(firstDistrict.longitude);
      setEditIsFallback(Boolean(firstDistrict.is_fallback));
    } else {
      setEditDistrict('');
      const coords = getDistrictCoordinates(newState, '');
      setEditLatitude(coords.latitude);
      setEditLongitude(coords.longitude);
      setEditIsFallback(true);
    }
  };

  const handleEditDistrictChange = (newDistrict: string) => {
    setEditDistrict(newDistrict);
    const coords = getDistrictCoordinates(editState, newDistrict);
    setEditLatitude(coords.latitude);
    setEditLongitude(coords.longitude);
    setEditIsFallback(coords.isFallback);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await farmsApi.updateFarm(editingFarm.id, {
        name: editName,
        area: editArea,
        village: editVillage,
        state: editState,
        district: editDistrict,
        latitude: editLatitude,
        longitude: editLongitude,
      });
      await fetchFarms();
      if (refreshFarms) await refreshFarms();
      setEditingFarm(null);
      setFormSuccess(t('farms.success_updated', { defaultValue: 'Farm parcel successfully updated!' }));
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update farm parcel');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchFarms = async () => {
    setIsLoadingFarms(true);
    setErrorFarms(null);
    try {
      const data = await farmsApi.getFarms();
      setFarms(data);
      if (data.length > 0 && !activeFarmId) {
        setActiveFarmId(data[0].id);
      }
    } catch (err: unknown) {
      setErrorFarms(err instanceof Error ? err.message : 'Failed to retrieve farm holdings.');
    } finally {
      setIsLoadingFarms(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  // Validation logic
  const isTenureValid = () => {
    if (area <= 0) return false;
    if (ownershipType === 'owned') return true;
    if (ownershipType === 'leased') return leasedArea > 0;
    if (ownershipType === 'mixed') {
      const sum = Number((ownedArea + leasedArea).toFixed(2));
      const total = Number(area.toFixed(2));
      return Math.abs(sum - total) < 0.01;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (area <= 0) {
      setFormError(t('farms.positive_area_error', { defaultValue: 'Farm acreage must be greater than zero.' }));
      return;
    }

    if (ownershipType === 'mixed') {
      const sum = Number((ownedArea + leasedArea).toFixed(2));
      const total = Number(area.toFixed(2));
      if (Math.abs(sum - total) >= 0.01) {
        setFormError(
          t('farms.math_error', {
            owned: ownedArea,
            leased: leasedArea,
            total: area,
            defaultValue: `Acreage mismatch: Owned (${ownedArea}) + Leased (${leasedArea}) != Total (${area})`,
          })
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newFarm = await farmsApi.createFarm({
        name,
        area,
        ownership_type: ownershipType,
        owned_area: ownershipType === 'leased' ? 0.0 : ownedArea,
        leased_area: ownershipType === 'owned' ? 0.0 : leasedArea,
        lease_amount: ownershipType === 'owned' ? 0.0 : leaseAmount,
        soil_type: soilType,
        water_source: waterSource,
        irrigation_method: irrigationMethod,
        budget,
        village,
        district,
        state,
        latitude,
        longitude,
      });

      setFormSuccess(t('farms.success_created', { defaultValue: 'Farm parcel successfully registered and activated!' }));
      setFarms((prev) => [...prev, newFarm]);
      setActiveFarmId(newFarm.id);
      await refreshFarms();
      setName('New Farm Holding');
      setActiveTab('holdings');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating farm holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const plainMeaning = activeFarm
    ? `Active parcel: ${activeFarm.name} (${activeFarm.area} acres, ${activeFarm.ownership_type} tenure) in ${activeFarm.village}. Soil: ${activeFarm.soil_type || 'Black Cotton'}, Irrigation: ${activeFarm.irrigation_method}.`
    : 'No active parcel selected. Register or choose a parcel below.';

  // PICTORIAL MODE
  if (isPictorial) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12 max-w-6xl mx-auto">
        <PageHeader
          icon={Tractor}
          title={language === 'te' ? 'నా పొలం వివరాలు' : language === 'hi' ? 'खेत का विवरण' : 'My Farm Holdings'}
          purpose={language === 'te' ? 'భూమి వివరాలు మరియు హక్కుల రకం నమోదు చేసుకోండి' : language === 'hi' ? 'जमीन का रकबा और मालिकाना हक़ दर्ज करें' : 'Visual farm parcel registration and holding summary.'}
          actions={
            <button
              type="button"
              onClick={() => setMode('words')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 flex items-center gap-1.5 text-xs shadow-xs"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు & రిజిస్ట్రేషన్' : language === 'hi' ? 'खेत विवरण देखें / बदलें' : 'View / Edit Parcels'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        {/* 3 Pictorial Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <PictorialTile
            title={language === 'te' ? 'యాక్టివ్ పొలం' : language === 'hi' ? 'सक्रिय खेत' : 'Active Parcel'}
            phrase={language === 'te' ? `${activeFarm?.area || area} ఎకరాలు (${activeFarm?.village || village})` : language === 'hi' ? `${activeFarm?.area || area} एकड़ (${activeFarm?.village || village})` : `${activeFarm?.area || area} Acres (${activeFarm?.village || village})`}
            illustration={<WateringFieldIllustration size={80} />}
            status={activeFarm ? 'success' : 'nodata'}
            statusWord={activeFarm ? `${activeFarm.area} ac` : (language === 'te' ? 'పొలం లేదు' : language === 'hi' ? 'खेत नहीं' : 'No farm')}
            spokenText={`Active farm is ${activeFarm?.name || 'My Farmland'}, total area ${activeFarm?.area || area} acres located in ${activeFarm?.village || village}.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          <PictorialTile
            title={language === 'te' ? 'భూమి హక్కులు' : language === 'hi' ? 'मालिकाना हक' : 'Land Tenure'}
            phrase={language === 'te' ? `${translateBackendString(String(activeFarm?.ownership_type || ownershipType), language)} హక్కు (${activeFarm?.owned_area || ownedArea} ఎకరాలు సొంతం)` : language === 'hi' ? `${translateBackendString(String(activeFarm?.ownership_type || ownershipType), language)} हक (${activeFarm?.owned_area || ownedArea} एकड़ खुद की)` : `${activeFarm?.ownership_type || ownershipType} tenure (${activeFarm?.owned_area || ownedArea} ac owned)`}
            illustration={<Layers className="w-16 h-16 text-[#1B5E3B]" />}
            status="info"
            statusWord={translateBackendString(String(activeFarm?.ownership_type || ownershipType), language)}
            spokenText={`Land tenure is ${activeFarm?.ownership_type || ownershipType}. ${activeFarm?.owned_area || ownedArea} acres owned and ${activeFarm?.leased_area || leasedArea} acres leased.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />

          <PictorialTile
            title={language === 'te' ? 'నీటిపారుదల రకం' : language === 'hi' ? 'सिंचाई प्रणाली' : 'Irrigation Profile'}
            phrase={language === 'te' ? `${translateBackendString(String(activeFarm?.irrigation_method || irrigationMethod), language)} (${translateBackendString(String(activeFarm?.water_source || waterSource), language)})` : language === 'hi' ? `${translateBackendString(String(activeFarm?.irrigation_method || irrigationMethod), language)} (${translateBackendString(String(activeFarm?.water_source || waterSource), language)})` : `${activeFarm?.irrigation_method || irrigationMethod} (${activeFarm?.water_source || waterSource})`}
            illustration={<Droplets className="w-16 h-16 text-sky-600" />}
            status="good"
            statusWord={translateBackendString(String(activeFarm?.irrigation_method || irrigationMethod), language)}
            spokenText={`Irrigation method is ${activeFarm?.irrigation_method || irrigationMethod} utilizing ${activeFarm?.water_source || waterSource} water.`}
            onOpenDetails={() => setMode('words')}
            detailsLabel={language === 'te' ? 'వివరాలు' : language === 'hi' ? 'विवरण' : 'Details'}
          />
        </div>

        {/* 3-Step Parcel Registration StepFlow */}
        <StepFlow
          heading={language === 'te' ? 'పొలం నమోదులో 3 దశలు' : language === 'hi' ? 'खेत पंजीकरण के 3 सरल कदम' : '3 Land Registration Steps'}
          steps={[
            {
              stepNumber: 1,
              title: language === 'te' ? 'విస్తీర్ణం మరియు హక్కులు' : language === 'hi' ? 'रकबा और मालिकाना हक' : 'Area & Land Tenure',
              desc: language === 'te' ? 'సొంత మరియు కౌలు ఎకరాల వివరాలు ఇవ్వండి' : language === 'hi' ? 'खुद की और बटाई की जमीन दर्ज करें' : 'Enter owned and leased acreage to calibrate lease expenses',
              icon: Layers,
            },
            {
              stepNumber: 2,
              title: language === 'te' ? 'గ్రామం & జీపీఎస్ లొకేషన్' : language === 'hi' ? 'गांव व स्थान' : 'Village & Weather Location',
              desc: language === 'te' ? 'ఖచ్చితమైన వర్షపాత సూచన కోసం గ్రామం ఎంచుకోండి' : language === 'hi' ? 'सटीक बारिश के लिए गांव का चयन करें' : 'Pinpoint village coordinates for hyper-local rain telemetry',
              icon: MapPin,
            },
            {
              stepNumber: 3,
              title: language === 'te' ? 'నీటి వనరు & పద్ధతి' : language === 'hi' ? 'जल स्रोत व विधि' : 'Water & Irrigation Type',
              desc: language === 'te' ? 'బోరుబావి, కాల్వ లేదా డ్రిప్ పద్ధతి ఎంచుకోండి' : language === 'hi' ? 'बोरवेल, नहर या ड्रिप चुनें' : 'Configure drip, sprinkler, or canal for root-zone moisture models',
              icon: Droplets,
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
        icon={Tractor}
        title={t('farms.title', { defaultValue: 'Farm Parcel Registration & Land Holdings' })}
        purpose={t('farms.subtitle', { defaultValue: 'Register individual land parcels, verify owned vs leased acreage math, and configure irrigation profiles.' })}
        whatIsThis={{
          summary: language === 'te'
            ? 'మీ సొంత మరియు కౌలు భూమి వివరాలను నమోదు చేసి, నీటి పారుదల మరియు ఎరువుల బడ్జెట్‌ను ఖచ్చితంగా లెక్కించడానికి ఉపయోగపడుతుంది.'
            : language === 'hi'
            ? 'अपनी खुद की और बटाई (पट्टे) वाली जमीन का रकबा दर्ज करें ताकि सिंचाई और खाद की सही योजना बन सके।'
            : 'Allows farmers to register parcels with accurate owned and leased acreages so all water budgets and crop cost models calculate correctly.',
          whatToEnter: language === 'te'
            ? 'పొలం పేరు, విస్తీర్ణం (ఎకరాల్లో), భూమి రకం (సొంతం/కౌలు), నేల స్వభావం మరియు గ్రామం.'
            : language === 'hi'
            ? 'खेत का नाम, रकबा (एकड़ में), जमीन का प्रकार (खुद की/बटाई), मिट्टी का प्रकार और गांव।'
            : 'Parcel name, total acres, tenure breakdown (owned/leased), soil type, water source, and village.',
          whatYouGet: language === 'te'
            ? 'ఖచ్చితమైన భూమి లెక్కలు మరియు యాక్టివ్ ఫామ్ ప్రొఫైల్.'
            : language === 'hi'
            ? 'जमीन का सटीक हिसाब और ऐप में सक्रिय खेत की प्रोफाइल।'
            : 'Verified parcel acreage and active farm state used across weather, irrigation, and economics tools.',
        }}
      />

      {/* LEAD SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-start">
        {/* Card 1: Active Farm Holding */}
        <div className="bg-gradient-to-br from-[#FEF6E9] to-white rounded-2xl border-2 border-[#DA9A4C] p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#DA9A4C] tracking-wider">
                Active Farm Holding
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#183D2E] text-white">
                Selected
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <h2 className="text-[20px] sm:text-[22px] font-display font-extrabold text-[#183D2E]">
                {activeFarm ? activeFarm.name : name}
              </h2>
              <span className="text-xs font-semibold text-[#7A553A]">
                {activeFarm ? `${activeFarm.area} acres` : `${area} acres`}
              </span>
            </div>

            <p className="text-xs text-[#4E5F57] leading-relaxed">
              Location: <strong>{activeFarm ? `${activeFarm.village}, ${activeFarm.district}` : `${village}, ${district}`}</strong> &bull; Tenure: <strong className="capitalize">{activeFarm ? activeFarm.ownership_type : ownershipType}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-[#7A553A]/15 flex items-center justify-between">
            <ReadAloudButton text={`Active farm is ${activeFarm ? activeFarm.name : name}. ${plainMeaning}`} />
            <button
              type="button"
              onClick={() => setActiveTab('holdings')}
              className="min-h-[44px] px-4 py-2 rounded-xl font-bold bg-[#183D2E] text-white hover:bg-[#265C46] flex items-center gap-1.5 transition-all text-xs shadow-sm"
            >
              <span>View All Holdings ({farms.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Land Tenure Breakdown */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#DA9A4C]" />
                Tenure & Lease Status
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                Holding Balance
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.total_acreage_label', { defaultValue: 'Total Acreage:' })}</span>
                <strong className="text-[#183D2E]">{activeFarm ? activeFarm.area : area} Acres</strong>
              </div>
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.owned_land_label', { defaultValue: 'Owned Land:' })}</span>
                <strong className="text-[#183D2E]">{activeFarm ? activeFarm.owned_area : ownedArea} Acres</strong>
              </div>
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.leased_land_label', { defaultValue: 'Leased Land:' })}</span>
                <strong className="text-[#7A553A]">{activeFarm ? activeFarm.leased_area : leasedArea} Acres</strong>
              </div>
              {(activeFarm?.lease_amount || leaseAmount) > 0 && (
                <div className="flex justify-between text-amber-800 border-t border-[#7A553A]/10 pt-1 font-semibold">
                  <span>{t('farms.annual_lease_rent_label', { defaultValue: 'Annual Lease Rent:' })}</span>
                  <strong>₹{(activeFarm ? activeFarm.lease_amount : leaseAmount).toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>

            <WhatThisMeans
              message={plainMeaning}
              confidenceNote="Tenure math ensures that lease rent is accurately subtracted from net farmer profits."
            />
          </div>
        </div>

        {/* Card 3: Soil & Irrigation Configuration */}
        <div className="bg-white rounded-2xl border border-[#7A553A]/20 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#183D2E] tracking-wider flex items-center gap-1.5">
                <Tractor className="w-4 h-4 text-[#DA9A4C]" />
                Agronomic Attributes
              </span>
              <span className="text-[10px] font-bold text-[#7A553A] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#7A553A]/20">
                Water & Soil
              </span>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#7A553A]/15 space-y-2 text-xs">
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.soil_type_colon', { defaultValue: 'Soil Type:' })}</span>
                <strong className="text-[#183D2E]">{activeFarm ? translateBackendString(activeFarm.soil_type || '', language, activeFarm.soil_type || '') : translateBackendString(soilType, language, soilType)}</strong>
              </div>
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.water_source_colon', { defaultValue: 'Water Source:' })}</span>
                <strong className="text-[#183D2E]">{activeFarm ? translateBackendString(activeFarm.water_source || '', language, activeFarm.water_source || '') : translateBackendString(waterSource, language, waterSource)}</strong>
              </div>
              <div className="flex justify-between text-[#4E5F57]">
                <span>{t('farms.irrigation_method_colon', { defaultValue: 'Irrigation Method:' })}</span>
                <strong className="text-[#183D2E] capitalize">{activeFarm ? translateBackendString(activeFarm.irrigation_method || '', language, activeFarm.irrigation_method || '') : translateBackendString(irrigationMethod, language, irrigationMethod)}</strong>
              </div>
              <div className="flex justify-between text-[#4E5F57]">
                <span>Seasonal Budget:</span>
                <strong className="text-[#183D2E]">₹{(activeFarm ? activeFarm.budget : budget).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <p className="text-[11px] text-[#7A553A]">
              {t('farms.irrigation_efficiency_note', { defaultValue: 'Irrigation method directly influences application efficiency (Drip 90%, Flood 60%).' })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-[#DA9A4C] bg-[#FEF6E9] hover:bg-[#FAF8F5] font-bold text-xs text-[#183D2E] flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#DA9A4C]" />
            <span>Register Another Parcel</span>
          </button>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div className="bg-white rounded-3xl border border-[#7A553A]/20 shadow-sm overflow-hidden">
        <div className="flex border-b border-[#7A553A]/15 bg-[#FAF8F5] px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Plus className="w-4 h-4 text-[#DA9A4C]" />
            <span>Register Land Parcel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('holdings')}
            className={`min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'holdings'
                ? 'border-[#183D2E] text-[#183D2E] bg-white'
                : 'border-transparent text-[#7A553A] hover:text-[#183D2E]'
            }`}
          >
            <Tractor className="w-4 h-4 text-[#DA9A4C]" />
            <span>Registered Holdings ({farms.length})</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB 1: STEP-BY-STEP REGISTRATION WIZARD */}
          {activeTab === 'register' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Wizard Steps Navigation */}
              <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      formStep === 1 ? 'bg-[#183D2E] text-white shadow-sm' : 'bg-[#FAF8F5] text-[#7A553A]'
                    }`}
                  >
                    <span>1. Land & Tenure</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStep(2)}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      formStep === 2 ? 'bg-[#183D2E] text-white shadow-sm' : 'bg-[#FAF8F5] text-[#7A553A]'
                    }`}
                  >
                    <span>2. Soil & Water</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStep(3)}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      formStep === 3 ? 'bg-[#183D2E] text-white shadow-sm' : 'bg-[#FAF8F5] text-[#7A553A]'
                    }`}
                  >
                    <span>3. Location & GPS</span>
                  </button>
                </div>
                <span className="text-xs text-[#7A553A] font-semibold hidden sm:inline">
                  Step {formStep} of 3
                </span>
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* STEP 1: LAND & TENURE */}
                {formStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.name_label', { defaultValue: 'Parcel Name or Identifier' })}
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-sm focus:ring-2 focus:ring-[#183D2E]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.area_label', { defaultValue: 'Total Land Holding (Acres)' })}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          value={area}
                          onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-sm focus:ring-2 focus:ring-[#183D2E]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#183D2E] mb-2">
                        {t('farms.tenure_label', { defaultValue: 'Ownership / Land Tenure Model' })}
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['owned', 'leased', 'mixed'] as OwnershipType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setOwnershipType(type)}
                            className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                              ownershipType === type
                                ? 'bg-[#183D2E] text-white border-[#183D2E] shadow-sm'
                                : 'bg-[#FAF8F5] text-[#7A553A] border-[#7A553A]/20 hover:border-[#183D2E]'
                            }`}
                          >
                            {t(`farms.${type}_option`, { defaultValue: type.toUpperCase() })}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(ownershipType === 'leased' || ownershipType === 'mixed') && (
                      <div className="p-4 bg-[#FAF8F5] border border-[#DA9A4C]/40 rounded-2xl space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#183D2E]">
                          <Layers className="w-4 h-4 text-[#DA9A4C]" />
                          <span>{t('farms.tenure_breakdown_heading', { defaultValue: 'Tenure Breakdown & Rent Math' })}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {ownershipType === 'mixed' && (
                            <div>
                              <label className="block text-[11px] font-bold text-[#7A553A] mb-1">
                                {t('farms.owned_area_label', { defaultValue: 'Owned Acreage' })}
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={ownedArea}
                                onChange={(e) => setOwnedArea(parseFloat(e.target.value) || 0)}
                                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#7A553A]/30 text-xs bg-white"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-bold text-[#7A553A] mb-1">
                              {t('farms.leased_area_label', { defaultValue: 'Leased Acreage' })}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={leasedArea}
                              onChange={(e) => setLeasedArea(parseFloat(e.target.value) || 0)}
                              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#7A553A]/30 text-xs bg-white"
                            />
                          </div>

                          <div className={ownershipType === 'mixed' ? 'sm:col-span-2' : ''}>
                            <label className="block text-[11px] font-bold text-[#7A553A] mb-1">
                              {t('farms.lease_amount_label', { defaultValue: 'Annual Lease Amount (₹)' })}
                            </label>
                            <input
                              type="number"
                              step="100"
                              min="0"
                              value={leaseAmount}
                              onChange={(e) => setLeaseAmount(parseFloat(e.target.value) || 0)}
                              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#7A553A]/30 text-xs bg-white"
                            />
                          </div>
                        </div>

                        {ownershipType === 'mixed' && (
                          <div
                            className={`text-[11px] font-semibold flex items-center justify-between p-2.5 rounded-xl ${
                              isTenureValid()
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            <span>
                              Owned ({ownedArea} ac) + Leased ({leasedArea} ac) = {(ownedArea + leasedArea).toFixed(1)} ac
                            </span>
                            <span>Target: {area} ac</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        disabled={!isTenureValid()}
                        className="min-h-[44px] px-6 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <span>Continue to Soil & Water</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SOIL & IRRIGATION */}
                {formStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.soil_type_label', { defaultValue: 'Soil Texture & Type' })}
                        </label>
                        <select
                          value={soilType}
                          onChange={(e) => setSoilType(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs bg-white"
                        >
                          <option value="Black Cotton">{t('farms.soil_black_cotton', { defaultValue: 'Black Cotton' })}</option>
                          <option value="Red Loam">{t('farms.soil_red_loam', { defaultValue: 'Red Loam' })}</option>
                          <option value="Alluvial">{t('farms.soil_alluvial', { defaultValue: 'Alluvial' })}</option>
                          <option value="Sandy Loam">{t('farms.soil_sandy_loam', { defaultValue: 'Sandy Loam' })}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.water_source_label', { defaultValue: 'Water Source' })}
                        </label>
                        <input
                          type="text"
                          value={waterSource}
                          onChange={(e) => setWaterSource(e.target.value)}
                          placeholder="e.g. Borewell / Canal"
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.irrigation_label', { defaultValue: 'Irrigation System' })}
                        </label>
                        <select
                          value={irrigationMethod}
                          onChange={(e) => setIrrigationMethod(e.target.value as IrrigationMethod)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs bg-white"
                        >
                          <option value="drip">{t('farms.irrigation_drip', { defaultValue: 'Drip Irrigation (90% Eff)' })}</option>
                          <option value="sprinkler">{t('farms.irrigation_sprinkler', { defaultValue: 'Sprinkler (75% Eff)' })}</option>
                          <option value="flood">{t('farms.irrigation_flood', { defaultValue: 'Surface Flood (60% Eff)' })}</option>
                          <option value="furrow">{t('farms.irrigation_furrow', { defaultValue: 'Furrow Irrigation' })}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1">
                          {t('farms.budget_label', { defaultValue: 'Seasonal Working Capital Budget (₹)' })}
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={budget}
                          onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#7A553A]/30 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="min-h-[44px] px-4 py-2 border border-[#7A553A]/30 rounded-xl text-xs font-bold text-[#7A553A]"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStep(3)}
                        className="min-h-[44px] px-6 py-2.5 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        <span>Continue to Location & GPS</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION & GPS */}
                {formStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1" htmlFor="farm-state-select">
                          {t('farms.state_label', { defaultValue: 'State' })}
                        </label>
                        <select
                          id="farm-state-select"
                          value={state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs bg-white text-[#183D2E] font-medium"
                        >
                          {getIndianStates().map((s) => (
                            <option key={s.state} value={s.state}>
                              {getLocalizedStateName(s.state, language)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1" htmlFor="farm-district-select">
                          {t('farms.district_label', { defaultValue: 'District' })}
                        </label>
                        <select
                          id="farm-district-select"
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs bg-white text-[#183D2E] font-medium"
                        >
                          {getDistrictsForState(state).map((d) => (
                            <option key={d.name} value={d.name}>
                              {getLocalizedDistrictName(d, language)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#183D2E] mb-1" htmlFor="farm-village-input">
                          {t('farms.village_label', { defaultValue: 'Village' })}
                        </label>
                        <input
                          id="farm-village-input"
                          type="text"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="Village or Mandal"
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-[#183D2E]" htmlFor="farm-latitude-input">
                            {t('farms.latitude_label', { defaultValue: 'Latitude' })}
                          </label>
                          <span className="text-[10px] text-[#7A553A] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            approximate district centre
                          </span>
                        </div>
                        <input
                          id="farm-latitude-input"
                          type="number"
                          step="0.0001"
                          value={latitude}
                          readOnly
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] text-xs font-mono text-[#543924] cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-[#183D2E]" htmlFor="farm-longitude-input">
                            {t('farms.longitude_label', { defaultValue: 'Longitude' })}
                          </label>
                          <span className="text-[10px] text-[#7A553A] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            approximate district centre
                          </span>
                        </div>
                        <input
                          id="farm-longitude-input"
                          type="number"
                          step="0.0001"
                          value={longitude}
                          readOnly
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] text-xs font-mono text-[#543924] cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {isCoordFallback && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        approximate: District coordinates approximate (state centre fallback).
                      </p>
                    )}

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="min-h-[44px] px-4 py-2 border border-[#7A553A]/30 rounded-xl text-xs font-bold text-[#7A553A]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isTenureValid()}
                        className="min-h-[48px] px-8 py-3 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-xs sm:text-sm flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-[#DA9A4C]" />
                        <span>{isSubmitting ? t('common.loading', { defaultValue: 'Saving...' }) : t('farms.submit_btn', { defaultValue: 'Complete Parcel Registration' })}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: REGISTERED HOLDINGS LIST */}
          {activeTab === 'holdings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-3">
                <h3 className="text-sm font-bold text-[#183D2E] flex items-center gap-2">
                  <Tractor className="w-5 h-5 text-[#DA9A4C]" />
                  <span>{t('farms.list_heading', { defaultValue: 'Active and Registered Parcels' })} ({farms.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={fetchFarms}
                  className="text-xs text-[#183D2E] font-bold hover:underline"
                >
                  Refresh Holdings
                </button>
              </div>

              {isLoadingFarms && <LoadingSkeleton lines={4} />}

              {errorFarms && (
                <ErrorState
                  title="Unable to load holdings"
                  message={errorFarms}
                  onRetry={fetchFarms}
                />
              )}

              {!isLoadingFarms && !errorFarms && farms.length === 0 && (
                <EmptyState
                  title={t('farms.no_farms', { defaultValue: 'No Registered Farm Holdings' })}
                  description="Enter your land parcel details to calculate water and cost budgets for your crops."
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className={`rounded-2xl p-5 border transition-all space-y-3 ${
                      farm.id === activeFarmId
                        ? 'border-2 border-[#183D2E] bg-gradient-to-br from-[#FEF6E9]/40 to-white shadow-sm'
                        : 'border-[#7A553A]/20 bg-[#FAF8F5] hover:border-[#183D2E]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display text-base font-bold text-[#183D2E]">
                          {farm.name}
                        </h4>
                        <p className="text-xs text-[#7A553A] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#DA9A4C]" />
                          {farm.village}, {farm.district}, {farm.state}
                        </p>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 bg-[#183D2E] text-white rounded-full text-xs font-bold">
                        {farm.area} {t('common.acres', { defaultValue: 'Acres' })}
                      </span>
                    </div>

                    {/* Tenure Breakdown Pills */}
                    <div className="flex flex-wrap gap-2 text-xs pt-1">
                      <span className="px-2 py-0.5 bg-white text-[#183D2E] rounded-lg font-bold border border-[#7A553A]/20">
                        Tenure: <strong className="capitalize">{farm.ownership_type}</strong>
                      </span>
                      {farm.ownership_type === 'mixed' && (
                        <>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg font-medium border border-emerald-200">
                            Owned: {farm.owned_area} ac
                          </span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg font-medium border border-amber-200">
                            Leased: {farm.leased_area} ac
                          </span>
                        </>
                      )}
                      {farm.lease_amount > 0 && (
                        <span className="px-2 py-0.5 bg-[#FEF6E9] text-amber-900 rounded-lg font-medium border border-amber-200">
                          Rent: ₹{farm.lease_amount.toLocaleString('en-IN')}/yr
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4E5F57] bg-white p-3 rounded-xl border border-[#7A553A]/15">
                      <div>{t('farms.soil_label_short', { defaultValue: 'Soil' })}: <strong>{farm.soil_type || 'Unspecified'}</strong></div>
                      <div>{t('farms.water_label_short', { defaultValue: 'Water' })}: <strong>{farm.water_source || 'Unspecified'}</strong></div>
                      <div>{t('farms.method_label_short', { defaultValue: 'System' })}: <strong className="capitalize">{farm.irrigation_method}</strong></div>
                      <div>{t('farms.coordinates_label', { defaultValue: 'GPS' })}: <strong>{farm.latitude.toFixed(2)}, {farm.longitude.toFixed(2)}</strong></div>
                    </div>

                    {/* Active Farm Switcher Action */}
                    <div className="pt-2 flex items-center justify-between border-t border-[#7A553A]/15">
                      <button
                        type="button"
                        onClick={() => startEditFarm(farm)}
                        className="text-xs font-bold text-[#7A553A] hover:text-[#183D2E] flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-[#FAF8F5] transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#DA9A4C]" />
                        <span>{language === 'te' ? 'సవరించండి' : language === 'hi' ? 'बदलें' : 'Edit Parcel'}</span>
                      </button>

                      {farm.id === activeFarmId ? (
                        <span className="text-xs font-bold text-[#183D2E] bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#183D2E]" />
                          <span>{t('farms.active_holding', { defaultValue: 'Active Farm Selected' })}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveFarmId(farm.id)}
                          className="text-xs font-bold text-[#183D2E] hover:text-white bg-white hover:bg-[#183D2E] px-4 py-1.5 rounded-full border border-[#7A553A]/30 transition-all shadow-xs"
                        >
                          {t('farms.switch_farm', { defaultValue: 'Switch to This Farm' })}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT FARM LOCATION & DETAILS MODAL */}
      {editingFarm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#7A553A]/20 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#7A553A]/15 pb-3">
              <h3 className="font-display text-lg font-bold text-[#183D2E]">
                {language === 'te' ? 'పొలం వివరాలు సవరించండి' : language === 'hi' ? 'खेत विवरण बदलें' : 'Edit Farm Parcel'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFarm(null)}
                className="p-1 rounded-lg text-[#7A553A] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {editError}
              </p>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#183D2E] mb-1">
                  {t('farms.name_label', { defaultValue: 'Parcel Name' })}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183D2E] mb-1">
                  {t('farms.area_label', { defaultValue: 'Total Land Acreage' })}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editArea}
                  onChange={(e) => setEditArea(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1" htmlFor="edit-farm-state-select">
                    {t('farms.state_label', { defaultValue: 'State' })}
                  </label>
                  <select
                    id="edit-farm-state-select"
                    value={editState}
                    onChange={(e) => handleEditStateChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs bg-white text-[#183D2E] font-medium"
                  >
                    {getIndianStates().map((s) => (
                      <option key={s.state} value={s.state}>
                        {getLocalizedStateName(s.state, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183D2E] mb-1" htmlFor="edit-farm-district-select">
                    {t('farms.district_label', { defaultValue: 'District' })}
                  </label>
                  <select
                    id="edit-farm-district-select"
                    value={editDistrict}
                    onChange={(e) => handleEditDistrictChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs bg-white text-[#183D2E] font-medium"
                  >
                    {getDistrictsForState(editState).map((d) => (
                      <option key={d.name} value={d.name}>
                        {getLocalizedDistrictName(d, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183D2E] mb-1">
                  {t('farms.village_label', { defaultValue: 'Village' })}
                </label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  placeholder="Village or Mandal"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/30 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#183D2E]">
                      {t('farms.latitude_label', { defaultValue: 'Latitude' })}
                    </label>
                    <span className="text-[10px] text-[#7A553A] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      approximate district centre
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLatitude}
                    readOnly
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] text-xs font-mono text-[#543924] cursor-not-allowed"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#183D2E]">
                      {t('farms.longitude_label', { defaultValue: 'Longitude' })}
                    </label>
                    <span className="text-[10px] text-[#7A553A] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      approximate district centre
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLongitude}
                    readOnly
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#7A553A]/20 bg-[#FAF8F5] text-xs font-mono text-[#543924] cursor-not-allowed"
                  />
                </div>
              </div>

              {editIsFallback && (
                <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  approximate: District coordinates approximate (state centre fallback).
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#7A553A]/15">
                <button
                  type="button"
                  onClick={() => setEditingFarm(null)}
                  className="min-h-[44px] px-4 py-2 border border-[#7A553A]/30 rounded-xl text-xs font-bold text-[#7A553A] hover:bg-[#FAF8F5]"
                >
                  {language === 'te' ? 'రద్దు చేయండి' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="min-h-[44px] px-6 py-2 bg-[#183D2E] hover:bg-[#265C46] text-white font-bold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit
                    ? (language === 'te' ? 'భద్రపరుస్తోంది...' : language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (language === 'te' ? 'మార్పులను భద్రపరచండి' : language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmRegistrationPage;
