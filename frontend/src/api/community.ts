import { apiRequest } from './client';
import {
  NearbyFarmer,
  FarmerGroup,
  GroupMember,
  GroupCreatePayload,
  CommunityRequest,
  CostSplitResult,
  MachineryGuideResponse,
  MachineryListing,
  MachineryBooking,
  OutbreakMapResponse,
  DistrictOfficerSummary,
} from '../types/api';

// ==============================================================================
// 1. Nearby Farmers & Community Groups
// ==============================================================================

export async function getNearbyFarmers(village?: string, district?: string): Promise<NearbyFarmer[]> {
  const params = new URLSearchParams();
  if (village) params.append('village', village);
  if (district) params.append('district', district);
  return apiRequest<NearbyFarmer[]>(`/api/v1/community/nearby-farmers?${params.toString()}`);
}

export async function getGroups(village?: string, district?: string): Promise<FarmerGroup[]> {
  const params = new URLSearchParams();
  if (village) params.append('village', village);
  if (district) params.append('district', district);
  return apiRequest<FarmerGroup[]>(`/api/v1/community/groups?${params.toString()}`);
}

export async function createGroup(payload: GroupCreatePayload): Promise<FarmerGroup> {
  return apiRequest<FarmerGroup>('/api/v1/community/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function joinGroup(groupId: number, consentShareContact: boolean): Promise<FarmerGroup> {
  return apiRequest<FarmerGroup>(`/api/v1/community/groups/${groupId}/join`, {
    method: 'POST',
    body: JSON.stringify({ consent_share_contact: consentShareContact }),
  });
}

export async function leaveGroup(groupId: number): Promise<{ message: string; group_id: number }> {
  return apiRequest<{ message: string; group_id: number }>(`/api/v1/community/groups/${groupId}/leave`, {
    method: 'DELETE',
  });
}

export async function updateGroupConsent(
  groupId: number,
  consentShareContact: boolean
): Promise<{ group_id: number; consent_share_contact: boolean; consent_at?: string; message: string }> {
  return apiRequest(`/api/v1/community/groups/${groupId}/consent`, {
    method: 'PUT',
    body: JSON.stringify({ consent_share_contact: consentShareContact }),
  });
}

export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
  return apiRequest<GroupMember[]>(`/api/v1/community/groups/${groupId}/members`);
}

// ==============================================================================
// 2. Shared Logistics & Group Requests
// ==============================================================================

export async function getRequests(
  requestType?: string,
  village?: string,
  district?: string
): Promise<CommunityRequest[]> {
  const params = new URLSearchParams();
  if (requestType && requestType !== 'all') params.append('request_type', requestType);
  if (village) params.append('village', village);
  if (district) params.append('district', district);
  return apiRequest<CommunityRequest[]>(`/api/v1/community/requests?${params.toString()}`);
}

export async function createCommunityRequest(payload: any): Promise<CommunityRequest> {
  return apiRequest<CommunityRequest>('/api/v1/community/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function joinCommunityRequest(
  requestId: number,
  quantityOrWeight: number,
  distanceKm: number = 0.0,
  notes?: string
): Promise<CommunityRequest> {
  return apiRequest<CommunityRequest>(`/api/v1/community/requests/${requestId}/join`, {
    method: 'POST',
    body: JSON.stringify({
      quantity_or_weight: quantityOrWeight,
      distance_km: distanceKm,
      notes,
    }),
  });
}

export async function calculateTransportCostSplit(payload: {
  base_truck_cost: number;
  rate_per_km: number;
  total_distance_km: number;
  solo_tempo_base?: number;
  solo_rate_per_km?: number;
  split_method?: 'weight_share' | 'ton_km';
  participants: Array<{
    name_or_alias: string;
    weight_quintals: number;
    pickup_distance_km: number;
  }>;
}): Promise<CostSplitResult> {
  return apiRequest<CostSplitResult>('/api/v1/community/transport/cost-split', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==============================================================================
// 3. Machinery Hub
// ==============================================================================

export async function getMachineryGuide(crop?: string): Promise<MachineryGuideResponse> {
  const params = new URLSearchParams();
  if (crop && crop !== 'All Supported Crops') params.append('crop', crop);
  return apiRequest<MachineryGuideResponse>(`/api/v1/machinery/guide?${params.toString()}`);
}

export async function searchMachineryListings(params?: {
  lat?: number;
  lon?: number;
  village?: string;
  category?: string;
  maxDistanceKm?: number;
  onlyAvailable?: boolean;
}): Promise<MachineryListing[]> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.append('lat', params.lat.toString());
  if (params?.lon !== undefined) query.append('lon', params.lon.toString());
  if (params?.village) query.append('village', params.village);
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.maxDistanceKm) query.append('max_distance_km', params.maxDistanceKm.toString());
  if (params?.onlyAvailable !== undefined) query.append('only_available', String(params.onlyAvailable));
  return apiRequest<MachineryListing[]>(`/api/v1/machinery/listings?${query.toString()}`);
}

export async function createMachineryListing(payload: {
  name: string;
  category: string;
  hourly_rate: number;
  daily_rate: number;
  village: string;
  district: string;
  state?: string;
  latitude: number;
  longitude: number;
  contact_phone_opt_in: boolean;
  description?: string;
}): Promise<MachineryListing> {
  return apiRequest<MachineryListing>('/api/v1/machinery/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMachineryBooking(payload: {
  listing_id: number;
  start_date: string;
  end_date: string;
  duration_hours?: number;
  rate_type: 'daily' | 'hourly';
  crop_purpose?: string;
  notes?: string;
}): Promise<MachineryBooking> {
  return apiRequest<MachineryBooking>('/api/v1/machinery/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUserBookings(role: 'renter' | 'owner' = 'renter'): Promise<MachineryBooking[]> {
  return apiRequest<MachineryBooking[]>(`/api/v1/machinery/bookings?role=${role}`);
}

export async function updateBookingStatus(
  bookingId: number,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
): Promise<MachineryBooking> {
  return apiRequest<MachineryBooking>(`/api/v1/machinery/bookings/${bookingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ==============================================================================
// 4. Disease Outbreak Telemetry
// ==============================================================================

export async function getOutbreakMap(params?: {
  district?: string;
  state?: string;
  days?: number;
  crop?: string;
  minThreshold?: number;
}): Promise<OutbreakMapResponse> {
  const query = new URLSearchParams();
  if (params?.district) query.append('district', params.district);
  if (params?.state) query.append('state', params.state);
  if (params?.days) query.append('days', params.days.toString());
  if (params?.crop && params.crop !== 'all') query.append('crop', params.crop);
  if (params?.minThreshold) query.append('min_threshold', params.minThreshold.toString());
  return apiRequest<OutbreakMapResponse>(`/api/v1/outbreaks/map?${query.toString()}`);
}

export async function getDistrictOfficerSummary(params?: {
  district?: string;
  state?: string;
  days?: number;
}): Promise<DistrictOfficerSummary> {
  const query = new URLSearchParams();
  if (params?.district) query.append('district', params.district);
  if (params?.state) query.append('state', params.state);
  if (params?.days) query.append('days', params.days.toString());
  return apiRequest<DistrictOfficerSummary>(`/api/v1/outbreaks/district-summary?${query.toString()}`);
}

