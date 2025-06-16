import apiClient from './client';
import type { LoginRequest, LoginResponse, UserStatusResponse } from '@/types/api';

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

  /**
   * Get current user status
   * Used to check if user is authenticated via httpOnly cookie
   */
  async getCurrentUser(): Promise<UserStatusResponse> {
    const response = await apiClient.get<UserStatusResponse>('/user/me');
    return response.data;
  },

  /**
   * Alternative endpoint name for user status check
   */
  async getUserStatus(): Promise<UserStatusResponse> {
    const response = await apiClient.get<UserStatusResponse>('/user/status');
    return response.data;
  },
};

export default authApi;
