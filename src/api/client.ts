import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, ApiError } from '@/types/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Enable httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle unified ApiResponse structure
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data;

    // Check if the response indicates success
    if (code === 200 || code === 0) {
      // Return the data directly for successful responses
      return { ...response, data: data };
    } else {
      // Handle API-level errors
      const apiError: ApiError = {
        code,
        message,
        details: data,
      };
      return Promise.reject(apiError);
    }
  },
  (error: AxiosError) => {
    // Handle HTTP-level errors
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        code: error.response.status,
        message: error.response.statusText || 'Request failed',
        details: error.response.data,
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
