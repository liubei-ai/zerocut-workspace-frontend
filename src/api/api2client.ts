import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

import type { ApiError, ApiResponse } from '@/types/api';

import { extractApiMessageFromPayload } from '@/utils/apiError';

import { handleAuthFailure, handleForbidden, handleWorkspaceAccessDenied } from './helper';

const WORKSPACE_ACCESS_DENIED = 'WORKSPACE_ACCESS_DENIED';

const isWorkspaceAccessDenied = (payload: unknown): boolean => {
  if (typeof payload !== 'object' || payload === null || !('errorCode' in payload)) {
    return false;
  }
  return (payload as { errorCode?: unknown }).errorCode === WORKSPACE_ACCESS_DENIED;
};

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API2_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Add any request modifications here
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle unified ApiResponse structure
apiClient.interceptors.response.use(
  async (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data, details } = response.data;
    const url = response.config.url || '';

    // Check if the response indicates success
    if (code === 200 || code === 201 || code === 0) {
      // Return the data directly for successful responses
      return { ...response, data: data };
    } else if (code === 401) {
      // 登录态失效 → 登出
      console.warn('Authentication failed, redirecting to login page');
      handleAuthFailure();
      return Promise.reject({ code, message, details });
    } else if (code === 403 && isWorkspaceAccessDenied(response.data)) {
      await handleWorkspaceAccessDenied();
      return Promise.reject({ code, message, details, errorCode: WORKSPACE_ACCESS_DENIED });
    } else if (code === 403 && url.startsWith('/admin/')) {
      // 登录态有效但权限不足 → 跳 /403，保持登录态
      console.warn('Forbidden (admin), redirecting to /403');
      handleForbidden();
      return Promise.reject({ code, message, details });
    } else {
      // Handle other API-level errors
      return Promise.reject({ code, message, details });
    }
  },
  async (error: AxiosError) => {
    // Handle HTTP-level errors
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';
      const responseData = error.response.data;
      const extractedMessage = extractApiMessageFromPayload(responseData);
      const statusText = error.response.statusText?.trim();

      if (status === 401) {
        console.warn(`HTTP 401, redirecting to login page`);
        handleAuthFailure();
      } else if (status === 403 && isWorkspaceAccessDenied(responseData)) {
        await handleWorkspaceAccessDenied();
      } else if (status === 403 && url.startsWith('/admin/')) {
        console.warn(`HTTP 403 (admin), redirecting to /403`);
        handleForbidden();
      }

      // Server responded with error status
      const apiError: ApiError = {
        code: status,
        message: extractedMessage || statusText || error.message || 'Request failed',
        details: responseData,
        errorCode: isWorkspaceAccessDenied(responseData) ? WORKSPACE_ACCESS_DENIED : null,
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request was made but no response received
      const apiError: ApiError = {
        code: 0,
        message: 'Network error - no response received',
        details: error.request,
      };
      return Promise.reject(apiError);
    } else {
      // Something else happened
      const apiError: ApiError = {
        code: -1,
        message: error.message || 'Unknown error occurred',
        details: error,
      };
      return Promise.reject(apiError);
    }
  }
);

export default apiClient;
