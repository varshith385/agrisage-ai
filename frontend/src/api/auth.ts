import { apiRequest } from './client';
import { AuthResponse, DemoLoginResponse, UserRole, Language } from '../types/api';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: UserRole;
  preferred_language?: Language;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  demoLogin: async (): Promise<DemoLoginResponse> => {
    return apiRequest<DemoLoginResponse>('/api/v1/auth/demo-login', {
      method: 'POST',
    });
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

