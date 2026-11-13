import { apiRequest } from './client';
import {
  InquiryCreatePayload,
  InquiryResponse,
  ListingCreatePayload,
  ListingResponse,
  MandiPriceResponse,
  MSPComparisonResponse,
  NetRealizationRankingResponse,
  PriceTrendResponse,
  ReviewCreatePayload,
  ReviewResponse,
  WarehouseResponse,
} from '../types/api';

export async function getMandiPrices(params: {
  crop: string;
  district?: string;
  state?: string;
}): Promise<MandiPriceResponse> {
  const query = new URLSearchParams({ crop: params.crop });
  if (params.district) query.set('district', params.district);
  if (params.state) query.set('state', params.state);

  return apiRequest<MandiPriceResponse>(`/api/v1/market/prices?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getNetRealizationRanking(params: {
  crop: string;
  quantity: number;
  lat?: number;
  lon?: number;
  transport_rate?: number;
  market_fee_pct?: number;
}): Promise<NetRealizationRankingResponse> {
  const query = new URLSearchParams({
    crop: params.crop,
    quantity: params.quantity.toString(),
  });
  if (params.lat !== undefined) query.set('lat', params.lat.toString());
  if (params.lon !== undefined) query.set('lon', params.lon.toString());
  if (params.transport_rate !== undefined) query.set('transport_rate', params.transport_rate.toString());
  if (params.market_fee_pct !== undefined) query.set('market_fee_pct', params.market_fee_pct.toString());

  return apiRequest<NetRealizationRankingResponse>(`/api/v1/market/ranking?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getMSPComparison(params: {
  crop: string;
  expected_price: number;
}): Promise<MSPComparisonResponse> {
  const query = new URLSearchParams({
    crop: params.crop,
    expected_price: params.expected_price.toString(),
  });

  return apiRequest<MSPComparisonResponse>(`/api/v1/market/msp?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getPriceTrends(params: {
  crop: string;
  mandi?: string;
}): Promise<PriceTrendResponse> {
  const query = new URLSearchParams({ crop: params.crop });
  if (params.mandi) query.set('mandi', params.mandi);

  return apiRequest<PriceTrendResponse>(`/api/v1/market/trends?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getNearbyWarehouses(params: {
  lat?: number;
  lon?: number;
}): Promise<WarehouseResponse> {
  const query = new URLSearchParams();
  if (params.lat !== undefined) query.set('lat', params.lat.toString());
  if (params.lon !== undefined) query.set('lon', params.lon.toString());

  return apiRequest<WarehouseResponse>(`/api/v1/market/warehouses?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getMarketplaceListings(params?: {
  crop?: string;
  district?: string;
  status?: string;
}): Promise<ListingResponse[]> {
  const query = new URLSearchParams();
  if (params?.crop) query.set('crop', params.crop);
  if (params?.district) query.set('district', params.district);
  if (params?.status) query.set('status', params.status);

  return apiRequest<ListingResponse[]>(`/api/v1/marketplace/listings?${query.toString()}`, {
    method: 'GET',
  });
}

export async function createMarketplaceListing(
  payload: ListingCreatePayload
): Promise<ListingResponse> {
  return apiRequest<ListingResponse>('/api/v1/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMarketplaceListing(
  id: number,
  payload: Partial<ListingCreatePayload> & { status?: string }
): Promise<ListingResponse> {
  return apiRequest<ListingResponse>(`/api/v1/marketplace/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteMarketplaceListing(id: number): Promise<{ deleted: boolean; id: number }> {
  return apiRequest<{ deleted: boolean; id: number }>(`/api/v1/marketplace/listings/${id}`, {
    method: 'DELETE',
  });
}

export async function submitBuyerInquiry(
  payload: InquiryCreatePayload
): Promise<InquiryResponse> {
  return apiRequest<InquiryResponse>('/api/v1/marketplace/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMarketplaceInquiries(): Promise<InquiryResponse[]> {
  return apiRequest<InquiryResponse[]>('/api/v1/marketplace/inquiries', {
    method: 'GET',
  });
}

export async function updateInquiryStatus(
  id: number,
  status: 'accepted' | 'declined'
): Promise<InquiryResponse> {
  return apiRequest<InquiryResponse>(`/api/v1/marketplace/inquiries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function verifyFarmer(
  farmerId: number,
  verified: boolean
): Promise<{ success: boolean; farmer_id: number; verified: boolean }> {
  return apiRequest<{ success: boolean; farmer_id: number; verified: boolean }>(
    `/api/v1/marketplace/farmers/${farmerId}/verify`,
    {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    }
  );
}

export async function verifyListing(
  listingId: number,
  verified: boolean
): Promise<ListingResponse> {
  return apiRequest<ListingResponse>(`/api/v1/marketplace/listings/${listingId}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ verified }),
  });
}

export async function submitReview(
  payload: ReviewCreatePayload
): Promise<ReviewResponse> {
  return apiRequest<ReviewResponse>('/api/v1/marketplace/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

