import apiClient from './client';
import type { LoginRequest, LoginResponse } from '@/types/api';

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Login with username and password
   * Server will set httpOnly cookie on successful login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/user/login', credentials);
    return response.data;
  },

  /**
   * Logout user
   * Server will clear httpOnly cookie
   */
  async logout(): Promise<void> {
    await apiClient.post('/user/logout');
  },
};

export default authApi;
