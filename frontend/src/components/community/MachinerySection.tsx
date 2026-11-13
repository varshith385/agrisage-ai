import React, { useState, useEffect } from 'react';
import { Wrench, Search, MapPin, CheckCircle, AlertCircle, Plus, Info } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import {
  getMachineryGuide,
  searchMachineryListings,
  createMachineryListing,
  createMachineryBooking,
  getUserBookings,
  updateBookingStatus,
} from '../../api/community';
import {
  MachineryGuideResponse,
  MachineryListing,
  MachineryBooking,
} from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

export const MachinerySection: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'guide' | 'rent' | 'bookings'>('rent');

  // Guide state
  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
  const [guideData, setGuideData] = useState<MachineryGuideResponse | null>(null);
  const [loadingGuide, setLoadingGuide] = useState<boolean>(false);

  // Rental state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [listings, setListings] = useState<MachineryListing[]>([]);
  const [loadingListings, setLoadingListings] = useState<boolean>(false);

  // Bookings state
  const [myRentals, setMyRentals] = useState<MachineryBooking[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<MachineryBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  // Booking modal
  const [selectedListing, setSelectedListing] = useState<MachineryListing | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [rateType, setRateType] = useState<'daily' | 'hourly'>('daily');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [cropPurpose, setCropPurpose] = useState<string>('Cotton Land Prep');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Listing modal
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [newMachName, setNewMachName] = useState<string>('');
  const [newMachCategory, setNewMachCategory] = useState<string>('tractor');
  const [newHourlyRate, setNewHourlyRate] = useState<number>(600);
  const [newDailyRate, setNewDailyRate] = useState<number>(4200);
  const [newVillage, setNewVillage] = useState<string>('Geikonda');
  const [newPhoneOptIn, setNewPhoneOptIn] = useState<boolean>(true);
  const [newDescription, setNewDescription] = useState<string>('');
  const [listSubmitting, setListSubmitting] = useState<boolean>(false);

  const fetchGuide = async (crop: string) => {
    setLoadingGuide(true);
    try {
      const res = await getMachineryGuide(crop);
      setGuideData(res);
    } catch (err) {
      console.error('Failed to load machinery guide:', err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await searchMachineryListings({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        village: searchQuery.trim() || undefined,
        onlyAvailable: true,
      });
      setListings(res);
    } catch (err) {
      console.error('Failed to load machinery listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const [renterRes, ownerRes] = await Promise.all([
        getUserBookings('renter'),
        getUserBookings('owner'),
      ]);
      setMyRentals(renterRes);
      setIncomingBookings(ownerRes);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'guide') {
      fetchGuide(selectedCrop);
    } else if (activeTab === 'rent') {
      fetchListings();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab, selectedCrop, categoryFilter]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setBookingSubmitting(true);
    setBookingSuccess(null);
    try {
      const res = await createMachineryBooking({
        listing_id: selectedListing.id,
        start_date: startDate,
        end_date: endDate,
        rate_type: rateType,
        duration_hours: rateType === 'hourly' ? durationHours : undefined,
        crop_purpose: cropPurpose,
        notes: bookingNotes,
      });
      setBookingSuccess(`Booking request submitted for ${selectedListing.name}! Estimated total: ₹${res.estimated_total}`);
      setSelectedListing(null);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to submit booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListSubmitting(true);
    try {
      await createMachineryListing({
        name: newMachName,
        category: newMachCategory,
        hourly_rate: newHourlyRate,
        daily_rate: newDailyRate,
        village: newVillage,
        district: 'Warangal',
        state: 'Telangana',
        latitude: 17.9689,
        longitude: 79.5941,
        contact_phone_opt_in: newPhoneOptIn,
        description: newDescription,
      });
      setShowListModal(false);
      setNewMachName('');
      setNewDescription('');
      fetchListings();
    } catch (err: any) {
      alert(err.message || 'Failed to create listing.');
    } finally {
      setListSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId: number, status: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
    try {
      await updateBookingStatus(bookingId, status);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-agri-gold-100 text-agri-green-900 rounded-lg">
                <Wrench className="w-5 h-5 text-agri-green-800" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {t('community.machinery.title')}
              </h2>
              <StatusBadge status="DEMO" />
              <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                {t('community.demo_badge')}
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              {t('community.machinery.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowListModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('community.machinery.list_machine_btn')}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('rent')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              activeTab === 'rent'
                ? 'border-agri-green-800 text-agri-green-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t('community.machinery.rental_tab')}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              activeTab === 'guide'
                ? 'border-agri-green-800 text-agri-green-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t('community.machinery.guide_tab')}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
              activeTab === 'bookings'
                ? 'border-agri-green-800 text-agri-green-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t('community.machinery.my_bookings_tab')} ({myRentals.length + incomingBookings.length})
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* =========================================================================
          Tab 1: Rent Machinery (Distance Search & Listings)
         ========================================================================= */}
      {activeTab === 'rent' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-subtle">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                placeholder={t('community.machinery.search_placeholder')}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-agri-green-700"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-600 shrink-0">
                {t('community.machinery.category_filter')}
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
              >
                <option value="all">{t('community.machinery.all_categories')}</option>
                <option value="tractor">Tractor</option>
                <option value="rotavator">Rotavator</option>
                <option value="sprayer">Sprayer</option>
                <option value="harvester">Harvester</option>
                <option value="seed_drill">Seed Drill</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loadingListings ? (
            <div className="text-center py-12 text-xs text-stone-500 animate-pulse">
              Searching nearest machinery with Haversine distance metrics...
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
              No machinery listings found in this category or area.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-subtle flex flex-col justify-between hover:border-agri-gold-400 transition-all space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-agri-green-800 bg-agri-cream-100 px-2 py-0.5 rounded-md">
                          {l.category}
                        </span>
                        <h3 className="text-sm font-bold text-stone-900 mt-1 leading-snug">
                          {l.name}
                        </h3>
                      </div>
                      {l.distance_km !== null && l.distance_km !== undefined && (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-700" />
                          {l.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 mb-3">
                      {l.description || 'Verified machinery listed for local custom hiring.'}
                    </p>

                    <div className="space-y-1.5 text-xs text-stone-700 border-t border-stone-100 pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Village:</span>
                        <span className="font-semibold text-stone-900">{l.village}, {l.district}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Owner:</span>
                        <span className="font-semibold text-stone-800">{l.owner_name_or_alias}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Rental Rates:</span>
                        <span className="font-bold text-stone-900">
                          ₹{l.hourly_rate}/hr • ₹{l.daily_rate}/day
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-500">Direct Contact:</span>
                        {l.owner_phone ? (
                          <span className="font-mono font-bold text-agri-green-900 bg-agri-cream-100 px-1.5 py-0.5 rounded">
                            {l.owner_phone}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">
                            {t('community.machinery.phone_opted_out')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedListing(l)}
                    className="w-full py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    {t('community.machinery.book_btn')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          Tab 2: Crop & Stage Mechanization Guide
         ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Crop Mechanization Package — Indicative, to verify. Not from a published source.
              </h3>
              <p className="text-xs text-stone-600">
                Standard equipment requirements, operational hours, and efficiency recommendations by growth stage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">
                {t('community.machinery.crop_select')}
              </span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-agri-green-900 focus:outline-none"
              >
                <option value="Cotton">Cotton</option>
                <option value="Rice">Rice (Paddy)</option>
                <option value="Wheat">Wheat</option>
                <option value="Maize">Maize</option>
                <option value="Groundnut">Groundnut</option>
                <option value="Chilli">Chilli</option>
                <option value="Tomato">Tomato</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Soybean">Soybean</option>
                <option value="Pulses">Pulses</option>
              </select>
            </div>
          </div>

          {loadingGuide ? (
            <div className="text-center py-10 text-xs text-stone-500 animate-pulse">
              Loading crop mechanization package...
            </div>
          ) : guideData ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Growth Stage</th>
                      <th className="px-4 py-2.5">Recommended Implement / Machinery</th>
                      <th className="px-4 py-2.5">Agronomic Purpose</th>
                      <th className="px-4 py-2.5">Hours / Acre</th>
                      <th className="px-4 py-2.5">Efficiency Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {guideData.stages.map((st, i) => (
                      <tr key={i} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-bold text-stone-900 whitespace-nowrap">{st.stage}</td>
                        <td className="px-4 py-3 font-semibold text-agri-green-900">{st.recommended_machinery}</td>
                        <td className="px-4 py-3 text-stone-600 leading-relaxed">{st.purpose}</td>
                        <td className="px-4 py-3 font-mono font-bold text-stone-800">{st.operational_hours_per_acre} h</td>
                        <td className="px-4 py-3 text-emerald-800 font-medium">{st.cost_saving_tip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Source Note Footer */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-800">{t('community.machinery.source_citation')}</strong>{' '}
                  {guideData.source_citation}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          Tab 3: My Bookings & Incoming Approvals
         ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Bookings Made by Current Farmer */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              {t('community.machinery.my_rentals_title')}
            </h3>

            {loadingBookings ? (
              <div className="py-4 text-xs text-stone-500 animate-pulse">Loading booking records...</div>
            ) : myRentals.length === 0 ? (
              <p className="text-xs text-stone-500 py-3">You have no active equipment booking requests.</p>
            ) : (
              <div className="space-y-2.5">
                {myRentals.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{b.listing_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-stone-600">
                        Dates: {b.start_date} to {b.end_date} • {b.crop_purpose || 'General Fieldwork'}
                      </p>
                      <p className="text-stone-500 text-[11px] italic">{b.booking_note}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-stone-900">₹{b.estimated_total.toLocaleString()}</span>
                      {b.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(b.id, 'CANCELLED')}
                          className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg text-[11px] font-bold"
                        >
                          {t('community.machinery.cancel_btn')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Bookings on My Equipment */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-2">
              {t('community.machinery.incoming_bookings_title')}
            </h3>

            {incomingBookings.length === 0 ? (
              <p className="text-xs text-stone-500 py-3">No incoming booking requests for your listed machinery.</p>
            ) : (
              <div className="space-y-2.5">
                {incomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{b.listing_name}</span>
                        <span className="text-stone-500">Requested by: <strong>{b.renter_alias}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-stone-600">
                        Schedule: {b.start_date} to {b.end_date} • Purpose: {b.crop_purpose}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900 mr-2">₹{b.estimated_total.toLocaleString()}</span>
                      {b.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(b.id, 'APPROVED')}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            {t('community.machinery.approve_btn')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(b.id, 'REJECTED')}
                            className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold"
                          >
                            {t('community.machinery.reject_btn')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {t('community.machinery.booking_modal_title')}
                </h3>
                <p className="text-xs text-stone-500 font-semibold">{selectedListing.name}</p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('community.machinery.start_date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('community.machinery.end_date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('community.machinery.rate_type')}
                  </label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="daily">Daily (₹{selectedListing.daily_rate}/day)</option>
                    <option value="hourly">Hourly (₹{selectedListing.hourly_rate}/hr)</option>
                  </select>
                </div>
                {rateType === 'hourly' && (
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      {t('community.machinery.duration_hours')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.machinery.purpose')}
                </label>
                <input
                  type="text"
                  value={cropPurpose}
                  onChange={(e) => setCropPurpose(e.target.value)}
                  placeholder="e.g. Cotton Land Prep, Bed Mulching"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.machinery.notes')}
                </label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Field condition or attachment requests..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              {/* No Online Payments Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{t('community.machinery.no_payments_warning')}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl shadow"
                >
                  {bookingSubmitting ? 'Submitting...' : t('community.machinery.confirm_booking_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Machinery Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {t('community.machinery.list_machine_btn')}
                </h3>
                <p className="text-xs text-stone-500">List your farm machinery for peer custom hiring.</p>
              </div>
              <button
                onClick={() => setShowListModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Implement / Machine Name</label>
                <input
                  type="text"
                  required
                  value={newMachName}
                  onChange={(e) => setNewMachName(e.target.value)}
                  placeholder="e.g. Mahindra 575 DI Tractor with MB Plough"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newMachCategory}
                    onChange={(e) => setNewMachCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="tractor">Tractor</option>
                    <option value="rotavator">Rotavator</option>
                    <option value="sprayer">Sprayer</option>
                    <option value="harvester">Harvester</option>
                    <option value="seed_drill">Seed Drill</option>
                    <option value="power_tiller">Power Tiller</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village Centroid</label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={newHourlyRate}
                    onChange={(e) => setNewHourlyRate(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={newDailyRate}
                    onChange={(e) => setNewDailyRate(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Explicit Phone Sharing Opt-in Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={newPhoneOptIn}
                    onChange={(e) => setNewPhoneOptIn(e.target.checked)}
                    className="rounded text-agri-green-800 focus:ring-agri-green-700 w-4 h-4"
                  />
                  <span>Display My Phone Number on Listing</span>
                </label>
                <p className="text-[10px] text-stone-500 pl-6">
                  If unchecked, your phone number remains private and farmers must submit bookings through the platform.
                </p>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description / Condition</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Horsepower, blade condition, attachments included..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={listSubmitting}
                  className="px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl shadow"
                >
                  {listSubmitting ? 'Listing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
