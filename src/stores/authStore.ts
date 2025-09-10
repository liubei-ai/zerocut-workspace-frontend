import router from '@/router';
import type { ApiError, User } from '@/types/api';
import { useGuard, type User as AuthingUser } from '@authing/guard-vue3';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { syncUserProfile } from '../api/authApi';

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
    const isAuthenticated = computed(() => isLoggedIn.value && !!user.value);
    const userName = computed(() => user.value?.username || '');

    /**
     * Handle Authing login success
     */
    const setAuthingUser = async (authingUser: AuthingUser) => {
      console.log('debug Authing 用户登录成功:', authingUser);

      // 将 Authing 用户信息转换为应用的用户格式
      const userData: User = {
        authingId: authingUser.id,
        username: authingUser.username as string,
        email: authingUser.email as string,
        phone: authingUser.phone as string,
        token: authingUser.token as string,
      };

      // 调用 API 同步用户信息
      await syncUserProfile(userData);

      user.value = userData;
      isLoggedIn.value = true;
      error.value = null;

      console.log('Authing 用户登录成功:', userData);
    };

    /**
     * Logout user
     */
    const logout = async (): Promise<void> => {
      loading.value = true;

      try {
        // 直接使用已初始化的 guard 实例
        await guard.logout();
      } catch (err) {
        console.error('Logout failed:', err);
        // Continue with local logout even if server logout fails
      } finally {
        clearAuthState();
        loading.value = false;

        // 只有在不是由 API 层调用时才跳转（避免重复跳转）
        if (router.currentRoute.value.name !== 'auth-authing') {
          router.push({ name: 'auth-authing' });
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
