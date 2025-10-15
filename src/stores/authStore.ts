import router from '@/router';
import type { ApiError, User } from '@/types/api';
import { useGuard, type User as AuthingUser } from '@authing/guard-vue3';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { requestLogout, syncUserProfile } from '../api/authApi';

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 状态
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isLoggedIn = ref(false);
    const user = ref<User | null>(null);

    // 在 store 顶层初始化 composable
    const guard = useGuard();

    // 计算属性
    const userName = computed(() => user.value?.username || '');
    const isAuthenticated = computed(() => isLoggedIn.value && !!user.value);

    /**
     * Handle Authing login success
     */
    const setAuthingUser = async (authingUser: AuthingUser) => {
      // 调用 API 同步用户信息
      const response = await syncUserProfile({
        authingId: authingUser.id,
        username: authingUser.username as string,
        email: authingUser.email as string,
        phone: authingUser.phone as string,
        token: authingUser.token as string,
      });

      console.log('debug 同步用户信息:', response);

      user.value = response.data;
      isLoggedIn.value = true;
      error.value = null;

      console.log('Authing 用户登录成功:', user.value);
    };

    /**
     * Logout user
     */
    const logout = async (): Promise<void> => {
      loading.value = true;
      try {
        await guard.logout();
        await requestLogout();
      } catch (err) {
        console.error('Logout failed:', err);
      } finally {
        clearAuthState();
        loading.value = false;
        if (router.currentRoute.value.name !== 'auth-authing') {
          router.push({
            name: 'auth-authing',
            query: { redirect: router.currentRoute.value.fullPath },
          });
        }
      }
    };

    /**
     * Clear authentication state
     */
    const clearAuthState = () => {
      isLoggedIn.value = false;
      user.value = null;
      error.value = null;
    };

    /**
     * Handle authentication errors
     */
    const handleAuthError = (apiError: ApiError) => {
      if (apiError.code === 401) {
        error.value = 'Invalid username or password';
        clearAuthState();
      } else if (apiError.code === 403) {
        error.value = 'Access denied';
      } else if (apiError.code === 0) {
        error.value = 'Network error. Please check your connection.';
      } else {
        error.value = apiError.message || 'Login failed. Please try again.';
      }
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      error.value = null;
    };

    // 返回所有状态、计算属性和方法
    return {
      // 状态
      loading,
      error,
      isLoggedIn,
      user,

      // 计算属性
      isAuthenticated,
      userName,

      // 方法
      setAuthingUser,
      logout,
      clearAuthState,
      handleAuthError,
      clearError,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['isLoggedIn', 'user'],
    },
  }
);
