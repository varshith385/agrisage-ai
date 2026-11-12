import { ApiErrorResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  requestId?: string;
  timestamp?: string;

  constructor(status: number, message: string, errorCode?: string, requestId?: string, timestamp?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
    this.timestamp = timestamp;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('agrisage_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    throw new ApiError(
      0,
      'Network request failed. Please check internet connection or verify backend is running on 127.0.0.1:8000.',
      'NETWORK_FAILURE'
    );
  }

  if (response.status === 401) {
    // Clear session and redirect to login if unauthorized
    localStorage.removeItem('agrisage_token');
    localStorage.removeItem('agrisage_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;
    let reqId: string | undefined;
    let timestamp: string | undefined;

    try {
      const errorJson: ApiErrorResponse = await response.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
      errorCode = errorJson.error_code;
      reqId = errorJson.request_id;
      timestamp = errorJson.timestamp;
    } catch {
      // Non-JSON error response
    }

    throw new ApiError(response.status, errorDetail, errorCode, reqId, timestamp);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

