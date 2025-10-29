import router from '@/router';
import type { ApiError, RechargeRecord } from '@/types/api';
import { useGuard, type User as AuthingUser } from '@authing/guard-vue3';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { requestLogout, syncUserProfile } from '../api/authApi';
import { useUserStore } from './userStore';

export const useAuthStore = defineStore(
  'auth',
  () => {
    // 状态
    const loading = ref(false);
    const error = ref<string | null>(null);
    const isLoggedIn = ref(false);
    const newbieCreditsRecord = ref<RechargeRecord | null>(null);

    // 在 store 顶层初始化 composable
    const guard = useGuard();

    /**
     * Handle Authing login success
     */
    const setAuthingUser = async (authingUser: AuthingUser) => {
      const userStore = useUserStore();

      // 调用 API 同步用户信息
      const response = await syncUserProfile({
        authingId: authingUser.id,
        name: authingUser.name as string,
        username: authingUser.username as string,
        avatar: authingUser.photo as string,
        email: authingUser.email as string,
        phone: authingUser.phone as string,
        token: authingUser.token as string,
      });

      const { newbieCreditsRecord: record, ...rest } = response.data;

      // 更新认证状态
      isLoggedIn.value = true;
      error.value = null;

      // 同步用户信息后，重新加载完整的用户数据
      userStore.updateUserInfo(rest);

      // 处理新用户积分奖励记录
      if (record) {
        newbieCreditsRecord.value = record;
        console.log('新用户获得积分奖励:', record);
      }
    };

    /**
     * Logout user
     */
    const logout = async (): Promise<void> => {
      if (loading.value) return;
      loading.value = true;

      try {
        await requestLogout();
        await guard.logout();
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
      const userStore = useUserStore();
      isLoggedIn.value = false;
      error.value = null;
      userStore.reset();
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

    /**
     * 清除新用户积分奖励记录
     */
    const clearNewbieCreditsRecord = () => {
      newbieCreditsRecord.value = null;
    };

    // 返回所有状态、计算属性和方法
    return {
      // 状态
      loading,
      error,
      isLoggedIn,
      newbieCreditsRecord,

      // 方法
      setAuthingUser,
      logout,
      clearAuthState,
      handleAuthError,
      clearError,
      clearNewbieCreditsRecord,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['isLoggedIn', 'authToken'],
    },
  }
);
