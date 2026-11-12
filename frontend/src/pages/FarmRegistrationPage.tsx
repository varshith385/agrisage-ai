import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, Plus, MapPin, AlertCircle, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { farmsApi } from '../api/farms';
import { Farm, OwnershipType, IrrigationMethod } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';

export const FarmRegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const { setActiveFarm } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [errorFarms, setErrorFarms] = useState<string | null>(null);

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
  const [latitude, setLatitude] = useState<number>(17.9944);
  const [longitude, setLongitude] = useState<number>(79.4589);

  const fetchFarms = async () => {
    setIsLoadingFarms(true);
    setErrorFarms(null);
    try {
      const data = await farmsApi.getFarms();
      setFarms(data);
      if (data.length > 0) {
        setActiveFarm(data[0]);
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
      setFormError(t('farms.positive_area_error'));
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

      setFormSuccess(t('farms.success_created'));
      setFarms((prev) => [...prev, newFarm]);
      setActiveFarm(newFarm);
      // Reset form fields
      setName('New Farm Holding');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating farm holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-gold-600">
              Tier 1 Land Tenure Engine
            </span>
            <StatusBadge status="WORKING" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            {t('farms.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {t('farms.subtitle')}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-agri-green-700 hover:bg-agri-green-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <span>{t('nav.dashboard')}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Farm Registration Form */}
        <div className="lg:col-span-7 bg-white border border-agri-soil-200/80 rounded-3xl p-6 sm:p-8 shadow-warm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
            <div className="p-2 bg-agri-green-100 text-agri-green-800 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-stone-900">
                {t('farms.register_heading')}
              </h3>
              <p className="text-xs text-stone-500">
                Mathematical verification of owned vs leased acreage
              </p>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Farm Name & Total Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.name_label')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-agri-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.area_label')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={area}
                  onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-agri-green-600"
                />
              </div>
            </div>

            {/* Ownership Type (Radio Pills) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {t('farms.tenure_label')}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['owned', 'leased', 'mixed'] as OwnershipType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOwnershipType(type)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      ownershipType === type
                        ? 'bg-agri-green-700 text-white border-agri-green-800 shadow-sm'
                        : 'bg-agri-cream-50 text-stone-700 border-stone-200 hover:border-agri-green-600/40'
                    }`}
                  >
                    {t(`farms.${type}_option`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Tenure Inputs */}
            {(ownershipType === 'leased' || ownershipType === 'mixed') && (
              <div className="p-4 bg-agri-cream-100/70 border border-agri-soil-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-agri-soil-800">
                  <Layers className="w-4 h-4 text-agri-soil-600" />
                  <span>{t('farms.tenure_breakdown_heading')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ownershipType === 'mixed' && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        {t('farms.owned_area_label')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={ownedArea}
                        onChange={(e) => setOwnedArea(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      {t('farms.leased_area_label')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={leasedArea}
                      onChange={(e) => setLeasedArea(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>

                  <div className={ownershipType === 'mixed' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      {t('farms.lease_amount_label')}
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={leaseAmount}
                      onChange={(e) => setLeaseAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>
                </div>

                {ownershipType === 'mixed' && (
                  <div
                    className={`text-[11px] font-semibold flex items-center justify-between p-2 rounded-lg ${
                      isTenureValid()
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
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

            {/* Agronomic Attributes & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.soil_type_label')}
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="Black Cotton">{t('farms.soil_black_cotton')}</option>
                  <option value="Red Loam">{t('farms.soil_red_loam')}</option>
                  <option value="Alluvial">{t('farms.soil_alluvial')}</option>
                  <option value="Sandy Loam">{t('farms.soil_sandy_loam')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.water_source_label')}
                </label>
                <input
                  type="text"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  placeholder="e.g. Borewell / Canal"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.irrigation_label')}
                </label>
                <select
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value as IrrigationMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option value="drip">{t('farms.irrigation_drip')}</option>
                  <option value="sprinkler">{t('farms.irrigation_sprinkler')}</option>
                  <option value="flood">{t('farms.irrigation_flood')}</option>
                  <option value="furrow">{t('farms.irrigation_furrow')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t('farms.budget_label')}
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>
            </div>

            {/* Location coordinates */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-0.5">{t('farms.state_label')}</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-0.5">{t('farms.village_label')}</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-0.5">{t('farms.district_label')}</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-0.5">{t('farms.latitude_label')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-0.5">{t('farms.longitude_label')}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isTenureValid()}
              className="w-full py-3.5 px-4 bg-agri-green-700 hover:bg-agri-green-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm mt-2"
            >
              {isSubmitting ? t('common.loading') : t('farms.submit_btn')}
            </button>
          </form>
        </div>

        {/* Right: List of Registered Holdings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-agri-green-700" />
              {t('farms.list_heading')} ({farms.length})
            </h3>
            <button
              onClick={fetchFarms}
              className="text-xs text-agri-green-700 font-bold hover:underline"
            >
              Refresh
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
              title={t('farms.no_farms')}
              description="Enter your land parcel details on the left to begin calculating water and cost budgets."
            />
          )}

          <div className="space-y-3">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-subtle hover:border-agri-green-600/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display text-base font-bold text-stone-900">
                      {farm.name}
                    </h4>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {farm.village}, {farm.district}, {farm.state}
                    </p>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 bg-agri-cream-100 text-agri-soil-800 rounded-full text-xs font-bold border border-agri-soil-200">
                    {farm.area} {t('common.acres')}
                  </span>
                </div>

                {/* Tenure Breakdown Pills */}
                <div className="flex flex-wrap gap-2 text-xs pt-1">
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-lg font-medium">
                    Tenure: <strong className="capitalize">{farm.ownership_type}</strong>
                  </span>
                  {farm.ownership_type === 'mixed' && (
                    <>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                        Owned: {farm.owned_area} ac
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg font-medium">
                        Leased: {farm.leased_area} ac
                      </span>
                    </>
                  )}
                  {farm.lease_amount > 0 && (
                    <span className="px-2 py-0.5 bg-agri-gold-100 text-agri-soil-900 rounded-lg font-medium">
                      Lease: ₹{farm.lease_amount.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 bg-agri-cream-50 p-2.5 rounded-xl border border-stone-100">
                  <div>{t('farms.soil_label_short')}: <strong>{farm.soil_type || 'Unspecified'}</strong></div>
                  <div>{t('farms.water_label_short')}: <strong>{farm.water_source || 'Unspecified'}</strong></div>
                  <div>{t('farms.method_label_short')}: <strong className="capitalize">{farm.irrigation_method}</strong></div>
                  <div>{t('farms.coordinates_label')}: <strong>{farm.latitude.toFixed(2)}, {farm.longitude.toFixed(2)}</strong></div>
                </div>

                {/* Crop cycle indicator */}
                {farm.current_crop_cycles && farm.current_crop_cycles.length > 0 && (
                  <div className="text-xs text-agri-green-800 bg-agri-green-50 p-2 rounded-xl flex items-center justify-between">
                    <span>{t('farms.active_cycle_label')}: <strong>{farm.current_crop_cycles[0].crop_name}</strong></span>
                    <span className="capitalize text-[11px] px-2 py-0.5 bg-agri-green-200/60 rounded-full font-bold">
                      {farm.current_crop_cycles[0].current_stage}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
