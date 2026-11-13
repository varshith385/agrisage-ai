import React, { useState, useEffect } from 'react';
import { Users, LogOut, Shield, Phone, PhoneOff, MapPin, Plus, UserCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import {
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  updateGroupConsent,
  getGroupMembers,
  getNearbyFarmers,
} from '../../api/community';
import {
  FarmerGroup,
  GroupMember,
  NearbyFarmer,
} from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

export const GroupsSection: React.FC = () => {
  const { t } = useTranslation();

  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Group creation modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupCrop, setNewGroupCrop] = useState<string>('Cotton');
  const [newGroupVillage, setNewGroupVillage] = useState<string>('Geikonda');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupConsent, setNewGroupConsent] = useState<boolean>(true);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);

  // Members modal
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<FarmerGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [updatingConsent, setUpdatingConsent] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, farmersRes] = await Promise.all([
        getGroups(undefined, 'Warangal'),
        getNearbyFarmers(undefined, 'Warangal'),
      ]);
      setGroups(groupsRes);
      setNearbyFarmers(farmersRes);
    } catch (err) {
      console.error('Failed to load groups data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await createGroup({
        name: newGroupName,
        crop_focus: newGroupCrop,
        village: newGroupVillage,
        district: 'Warangal',
        state: 'Telangana',
        description: newGroupDesc,
        consent_share_contact: newGroupConsent,
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create group.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleJoinGroup = async (group: FarmerGroup, consent: boolean) => {
    try {
      await joinGroup(group.id, consent);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to join group.');
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await leaveGroup(groupId);
      if (selectedGroupForMembers?.id === groupId) {
        setSelectedGroupForMembers(null);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group.');
    }
  };

  const handleToggleConsent = async (groupId: number, currentConsent: boolean) => {
    setUpdatingConsent(true);
    try {
      await updateGroupConsent(groupId, !currentConsent);
      // Refresh groups list and members list
      await fetchData();
      if (selectedGroupForMembers?.id === groupId) {
        const updatedMembers = await getGroupMembers(groupId);
        setGroupMembers(updatedMembers);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update consent.');
    } finally {
      setUpdatingConsent(false);
    }
  };

  const handleOpenMembersModal = async (group: FarmerGroup) => {
    setSelectedGroupForMembers(group);
    setLoadingMembers(true);
    try {
      const members = await getGroupMembers(group.id);
      setGroupMembers(members);
    } catch (err: any) {
      alert(err.message || 'Failed to load group members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Groups Section Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-agri-gold-100 text-agri-green-900 rounded-lg">
                <Users className="w-5 h-5 text-agri-green-800" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                {t('community.groups.title')}
              </h2>
              <StatusBadge status="DEMO" />
              <span className="text-[11px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                {t('community.demo_badge')}
              </span>
            </div>
            <p className="text-xs text-stone-600 max-w-2xl">
              {t('community.groups.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-agri-green-800 hover:bg-agri-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('community.groups.create_btn')}
          </button>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500 animate-pulse">
            Loading community groups and peer networks...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-stone-50/80 rounded-2xl p-5 border border-stone-200/80 flex flex-col justify-between hover:border-agri-green-600 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-agri-green-900 bg-agri-cream-100 px-2 py-0.5 rounded-md">
                        {g.crop_focus || 'Multi-Crop'}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">{g.name}</h3>
                    </div>
                    <span className="text-[11px] font-bold bg-white text-stone-700 px-2 py-0.5 rounded-full border border-stone-200 shrink-0">
                      {g.member_count} {t('community.groups.members_title')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-3">
                    {g.description || 'Local farmer mutual assistance and pooling group.'}
                  </p>

                  <div className="text-xs text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{g.village}, {g.district}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200/60">
                  {/* Membership & Explicit Consent Status */}
                  {g.is_member ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-emerald-800 font-bold">
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          Joined
                        </span>

                        {/* Interactive Revocable Consent Toggle */}
                        <button
                          onClick={() => handleToggleConsent(g.id, g.user_has_consented)}
                          disabled={updatingConsent}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            g.user_has_consented
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-600 border-stone-300'
                          }`}
                          title={t('community.groups.consent_desc')}
                        >
                          {g.user_has_consented ? (
                            <>
                              <Phone className="w-3 h-3 text-emerald-700" />
                              {t('community.groups.consent_active')}
                            </>
                          ) : (
                            <>
                              <PhoneOff className="w-3 h-3 text-stone-400" />
                              {t('community.groups.consent_inactive')}
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenMembersModal(g)}
                          className="flex-1 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                        >
                          View Roster ({g.member_count})
                        </button>
                        <button
                          onClick={() => handleLeaveGroup(g.id)}
                          className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold"
                          title="Leave Group"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinGroup(g, true)}
                          className="flex-1 py-1.5 bg-agri-green-800 hover:bg-agri-green-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          Join & Share Phone
                        </button>
                        <button
                          onClick={() => handleJoinGroup(g, false)}
                          className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                          title="Join with phone number hidden"
                        >
                          Join Private
                        </button>
                      </div>
                      <button
                        onClick={() => handleOpenMembersModal(g)}
                        className="w-full py-1 text-center text-[11px] font-semibold text-stone-500 hover:text-stone-800"
                      >
                        Preview Members Roster
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Farmers Section (Village-Level Only) */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-subtle space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 tracking-tight">
            {t('community.groups.nearby_title')}
          </h3>
          <p className="text-xs text-stone-500">
            {t('community.groups.nearby_privacy_note')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {nearbyFarmers.map((f) => (
            <div
              key={f.user_id}
              className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/80 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{f.alias_or_name}</h4>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {f.village}, {f.district}
                  </span>
                </div>
                {f.has_shared_contact ? (
                  <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full" title="Mutual Consent Active">
                    <Phone className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="p-1 bg-stone-200 text-stone-500 rounded-full" title="Contact Hidden">
                    <PhoneOff className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="text-[11px] text-stone-600">
                <span className="text-stone-400 font-semibold">{t('community.groups.crops_grown')}</span>{' '}
                <span className="font-medium text-stone-800">{f.crops_grown.join(', ')}</span>
              </div>

              <div className="pt-1.5 border-t border-stone-200/60 text-[11px]">
                {f.phone_number ? (
                  <span className="font-mono font-bold text-agri-green-900 bg-agri-cream-100 px-1.5 py-0.5 rounded">
                    {f.phone_number}
                  </span>
                ) : (
                  <span className="text-stone-400 italic">
                    {t('community.groups.phone_hidden')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Members Modal */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {selectedGroupForMembers.name} — Member Roster
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedGroupForMembers.village}, {selectedGroupForMembers.district} • {groupMembers.length} verified farmers
                </p>
              </div>
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Privacy Rule Explainer Box */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Privacy Boundary Rule:</strong>
                <span>
                  Phone numbers are disclosed only after explicit, revocable reciprocal consent. Members who have not opted in appear with their alias and village only.
                </span>
              </div>
            </div>

            {loadingMembers ? (
              <div className="py-8 text-center text-xs text-stone-500 animate-pulse">
                Verifying permission boundary and fetching members...
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {groupMembers.map((m) => (
                  <div
                    key={m.user_id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{m.alias_or_name}</span>
                        <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded">
                          {m.role}
                        </span>
                      </div>
                      <span className="text-stone-500 text-[11px] block">{m.village}</span>
                    </div>

                    <div className="text-right">
                      {m.phone_number ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-agri-green-900 bg-agri-cream-100 px-2 py-0.5 rounded text-[11px] inline-block">
                            {m.phone_number}
                          </span>
                          <span className="text-[9px] text-emerald-700 block font-semibold">
                            Opt-in consented
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-stone-400 italic text-[11px] block">
                            Phone Hidden
                          </span>
                          <span className="text-[9px] text-stone-400 block">
                            (No consent)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="px-4 py-1.5 bg-stone-800 text-white font-bold rounded-xl text-xs"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {t('community.groups.create_modal_title')}
                </h3>
                <p className="text-xs text-stone-500">Create a new local group for logistics, inputs, or machinery.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.groups.group_name')}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Geikonda Cotton Growers Club"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    {t('community.groups.crop_focus')}
                  </label>
                  <input
                    type="text"
                    value={newGroupCrop}
                    onChange={(e) => setNewGroupCrop(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Village Centroid
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupVillage}
                    onChange={(e) => setNewGroupVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {t('community.groups.description')}
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Goals of the collective, pooling focus..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900"
                />
              </div>

              {/* Explicit Consent Opt-In */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={newGroupConsent}
                    onChange={(e) => setNewGroupConsent(e.target.checked)}
                    className="rounded text-agri-green-800 focus:ring-agri-green-700 w-4 h-4"
                  />
                  <span>{t('community.groups.consent_label')}</span>
                </label>
                <p className="text-[10px] text-stone-500 pl-6">
                  {t('community.groups.consent_desc')}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {createSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
