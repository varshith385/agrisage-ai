import React, { useState, useEffect } from 'react';
import { Truck, Plus, Percent } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import {
  getRequests,
  createCommunityRequest,
  joinCommunityRequest,
} from '../../api/community';
import { CommunityRequest } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

export const RequestsSection: React.FC<{ onOpenCalculator?: () => void }> = ({ onOpenCalculator }) => {
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Join modal
  const [selectedReqForJoin, setSelectedReqForJoin] = useState<CommunityRequest | null>(null);
  const [joinWeight, setJoinWeight] = useState<number>(10);
  const [joinDistance, setJoinDistance] = useState<number>(25);
  const [joinNotes, setJoinNotes] = useState<string>('');
  const [joinSubmitting, setJoinSubmitting] = useState<boolean>(false);

  // Create request modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [reqType, setReqType] = useState<'transport' | 'input_purchase' | 'pooled_sale'>('transport');
  const [title, setTitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [village, setVillage] = useState<string>('Geikonda');

  // Transport fields
  const [destination, setDestination] = useState<string>('Enumamula Agricultural Market Yard, Warangal');
  const [capacity, setCapacity] = useState<number>(100);
  const [baseCost, setBaseCost] = useState<number>(3000);
  const [rateKm, setRateKm] = useState<number>(35);
  const [distanceKm, setDistanceKm] = useState<number>(28);

  // Input fields
  const [itemName, setItemName] = useState<string>('Certified Bt-Cotton Seed & Neem Urea');
  const [targetQty, setTargetQty] = useState<number>(50);
  const [bulkPrice, setBulkPrice] = useState<number>(780);
  const [retailPrice, setRetailPrice] = useState<number>(890);

  // Sale fields
  const [cropName, setCropName] = useState<string>('Cotton');
  const [targetQuintals, setTargetQuintals] = useState<number>(60);
  const [expectedPrice, setExpectedPrice] = useState<number>(7450);

  // Creator's load
  const [creatorLoad, setCreatorLoad] = useState<number>(15);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);

  const fetchReqs = async () => {
    setLoading(true);
    try {
      const res = await getRequests(activeFilter !== 'all' ? activeFilter : undefined, undefined, 'Warangal');
      setRequests(res);
    } catch (err) {
      console.error('Failed to load community requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReqs();
  }, [activeFilter]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForJoin) return;
    setJoinSubmitting(true);
    try {
      await joinCommunityRequest(selectedReqForJoin.id, joinWeight, joinDistance, joinNotes);
      setSelectedReqForJoin(null);
      fetchReqs();
    } catch (err: any) {
      alert(err.message || 'Failed to join request.');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await createCommunityRequest({
        request_type: reqType,
        title,
        description: desc,
        village,
        district: 'Warangal',
        state: 'Telangana',
        creator_quantity_or_weight: creatorLoad,
        destination: reqType === 'transport' ? destination : undefined,
        total_capacity_quintals: reqType === 'transport' ? capacity : undefined,
        base_truck_cost: reqType === 'transport' ? baseCost : undefined,
        rate_per_km: reqType === 'transport' ? rateKm : undefined,
        distance_km: reqType === 'transport' ? distanceKm : undefined,
        item_name: reqType === 'input_purchase' ? itemName : undefined,
        target_quantity: reqType === 'input_purchase' ? targetQty : undefined,
        bulk_price_per_unit: reqType === 'input_purchase' ? bulkPrice : undefined,
        retail_price_per_unit: reqType === 'input_purchase' ? retailPrice : undefined,
        crop_name: reqType === 'pooled_sale' ? cropName : undefined,
        target_quantity_quintals: reqType === 'pooled_sale' ? targetQuintals : undefined,
        expected_price_per_quintal: reqType === 'pooled_sale' ? expectedPrice : undefined,
      });
      setShowCreateModal(false);
      setTitle('');
      setDesc('');
      fetchReqs();
    } catch (err: any) {
      alert(err.message || 'Failed to create request.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-agri-gold-100 text-agri-green-900 rounded-lg">
                <Truck className="w-5 h-5 text-agri-green-800" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {t('community.requests.title')}
              </h2>
              <StatusBadge status="DEMO" />
              <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                {t('community.demo_badge')}
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              {t('community.requests.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCalculator && (
              <button
                onClick={onOpenCalculator}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-all"
              >
                Launch Calculator
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('community.requests.create_btn')}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-stone-200">
          {[
            { id: 'all', label: t('community.requests.all') },
            { id: 'transport', label: t('community.requests.transport') },
            { id: 'input_purchase', label: t('community.requests.input_purchase') },
            { id: 'pooled_sale', label: t('community.requests.pooled_sale') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                activeFilter === f.id
                  ? 'border-agri-green-800 text-agri-green-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500 animate-pulse">
          Loading shared logistics and purchasing requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
          No active community requests in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-subtle flex flex-col justify-between hover:border-agri-gold-400 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      r.request_type === 'transport' ? 'bg-blue-50 text-blue-800' :
                      r.request_type === 'input_purchase' ? 'bg-emerald-50 text-emerald-800' :
                      'bg-amber-50 text-amber-800'
                    }`}>
                      {r.request_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 mt-1 leading-snug">
                      {r.title}
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    r.status === 'OPEN' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-stone-100 text-stone-700 border-stone-300'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mb-3">
                  {r.description}
                </p>

                {/* Specific Meta Fields */}
                <div className="space-y-1.5 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/60 mb-3">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Origin / Village:</span>
                    <span className="font-semibold text-stone-900">{r.village}, {r.district}</span>
                  </div>

                  {r.request_type === 'transport' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-500">{t('community.requests.destination')}</span>
                        <span className="font-semibold text-stone-900">{r.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Capacity & Load:</span>
                        <span className="font-bold text-agri-green-900">
                          {r.current_weight_quintals} / {r.total_capacity_quintals || 100} quintals
                        </span>
                      </div>
                      {/* Freight Progress Bar */}
                      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-agri-green-800 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (r.current_weight_quintals / (r.total_capacity_quintals || 100)) * 100)}%`,
                          }}
                        />
                      </div>
                      {r.cost_split_summary && (
                        <div className="flex justify-between items-center pt-1 border-t border-stone-200/60 text-[11px]">
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-emerald-700" />
                            Collective Freight Savings:
                          </span>
                          <span className="font-bold text-emerald-900">
                            ₹{r.cost_split_summary.total_savings.toLocaleString()} ({r.cost_split_summary.total_savings_pct}%)
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {r.request_type === 'input_purchase' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Product:</span>
                        <span className="font-semibold text-stone-900">{r.item_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Target Bulk Order:</span>
                        <span className="font-bold text-stone-900">{r.target_quantity} {r.unit}</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>Bulk Price vs Retail:</span>
                        <span>₹{r.bulk_price_per_unit} (vs ₹{r.retail_price_per_unit} retail)</span>
                      </div>
                    </>
                  )}

                  {r.request_type === 'pooled_sale' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Crop:</span>
                        <span className="font-semibold text-stone-900">{r.crop_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Target Volume:</span>
                        <span className="font-bold text-stone-900">{r.target_quantity_quintals} q</span>
                      </div>
                      <div className="flex justify-between text-agri-gold-900 font-bold">
                        <span>Expected Price:</span>
                        <span>₹{r.expected_price_per_quintal}/q (direct mill quote)</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Participants Roster Preview */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Participants ({r.participants.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.participants.map((p, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md font-medium"
                      >
                        {p.alias_or_name}: <strong>{p.quantity_or_weight}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Join Button */}
              {r.status === 'OPEN' ? (
                <button
                  onClick={() => setSelectedReqForJoin(r)}
                  className="w-full py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  {t('community.requests.join_request_btn')}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2 bg-stone-200 text-stone-500 font-bold rounded-xl text-xs cursor-not-allowed"
                >
                  Request Full
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Join Request Modal */}
      {selectedReqForJoin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Join Community Request
                </h3>
                <p className="text-xs text-stone-500">{selectedReqForJoin.title}</p>
              </div>
              <button
                onClick={() => setSelectedReqForJoin(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.requests.quantity_label')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={joinWeight}
                  onChange={(e) => setJoinWeight(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900"
                />
              </div>

              {selectedReqForJoin.request_type === 'transport' && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('community.requests.distance_label')}
                  </label>
                  <input
                    type="number"
                    required
                    value={joinDistance}
                    onChange={(e) => setJoinDistance(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.requests.notes_label')}
                </label>
                <input
                  type="text"
                  value={joinNotes}
                  onChange={(e) => setJoinNotes(e.target.value)}
                  placeholder="e.g. Moisture 11%, Bollgard II cotton"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedReqForJoin(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinSubmitting}
                  className="px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl shadow"
                >
                  {joinSubmitting ? 'Joining...' : 'Confirm Participation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {t('community.requests.create_btn')}
                </h3>
                <p className="text-xs text-stone-500">Initiate a pooled logistics or bulk order request.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900"
                >
                  <option value="transport">Pooled Transport (Shared Truck to Mandi)</option>
                  <option value="input_purchase">Input Purchase (Bulk Seed/Fertilizer)</option>
                  <option value="pooled_sale">Pooled Produce Sale (Direct to Mill)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shared 10-Tonne Eicher Truck to Enumamula Mandi"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-semibold text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Village Centroid</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Your Load / Contribution</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={creatorLoad}
                    onChange={(e) => setCreatorLoad(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              {reqType === 'transport' && (
                <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Destination Mandi</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Capacity (q)</label>
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Base Hire (₹)</label>
                      <input
                        type="number"
                        value={baseCost}
                        onChange={(e) => setBaseCost(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Rate/km (₹)</label>
                      <input
                        type="number"
                        value={rateKm}
                        onChange={(e) => setRateKm(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Distance (km)</label>
                      <input
                        type="number"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {reqType === 'input_purchase' && (
                <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Item Name</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Target Qty</label>
                      <input
                        type="number"
                        value={targetQty}
                        onChange={(e) => setTargetQty(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Bulk Price (₹)</label>
                      <input
                        type="number"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Retail Price (₹)</label>
                      <input
                        type="number"
                        value={retailPrice}
                        onChange={(e) => setRetailPrice(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {reqType === 'pooled_sale' && (
                <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Crop</label>
                      <input
                        type="text"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Target (q)</label>
                      <input
                        type="number"
                        value={targetQuintals}
                        onChange={(e) => setTargetQuintals(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-600 block mb-0.5">Expected Price (₹/q)</label>
                      <input
                        type="number"
                        value={expectedPrice}
                        onChange={(e) => setExpectedPrice(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description / Conditions</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Dispatch date, pickup points, quality specifications..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl shadow"
                >
                  {createSubmitting ? 'Creating...' : 'Publish Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
