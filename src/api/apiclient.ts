import type { ApiError, ApiResponse } from '@/types/api';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { Router } from 'vue-router';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// 避免循环依赖，延迟导入
let router: Router;
let authStore;

// 延迟导入函数
const getRouter = async () => {
  if (!router) {
    const { default: routerInstance } = await import('@/router');
    router = routerInstance;
  }
  return router;
};

const getAuthStore = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/stores/authStore');
    authStore = useAuthStore();
  }
  return authStore;
};

// 处理认证失败的函数
const handleAuthFailure = async (currentPath?: string) => {
  try {
    // 清空认证状态
    const store = await getAuthStore();
    await store.logout();

    // 跳转到登录页面，保存当前路径用于登录后重定向
    const routerInstance = await getRouter();
    const redirectPath = currentPath || routerInstance.currentRoute.value.fullPath;

    await routerInstance.push({
      name: 'auth-authing',
      query: { redirect: redirectPath },
    });
  } catch (error) {
    console.error('Handle auth failure error:', error);
    // 如果出错，直接跳转到登录页面
    window.location.href = '/auth/authing';
  }
};

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
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data;

    // Check if the response indicates success
    if (code === 200 || code === 0) {
      // Return the data directly for successful responses
      return { ...response, data: data };
    } else if (code === 401) {
      // Handle authentication failure
      console.warn('Authentication failed, redirecting to login page');
      handleAuthFailure();

      // Still reject the promise so the calling code can handle it
      const apiError: ApiError = {
        code,
        message: message || 'Authentication failed',
        details: data,
      };
      return Promise.reject(apiError);
    } else {
      // Handle other API-level errors
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
      const status = error.response.status;

      // Handle HTTP 401 Unauthorized
      if (status === 401) {
        console.warn('HTTP 401 Unauthorized, redirecting to login page');
        handleAuthFailure();
      }

      // Server responded with error status
      const apiError: ApiError = {
        code: status,
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
