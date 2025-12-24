import router from '@/router';
import type { RechargeRecord } from '@/types/api';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  requestAuth0Logout,
  requestAuthingLogout,
  syncAuth0Token,
  syncAuthingToken,
} from '../api/authApi';
import { useUserStore } from './userStore';
import { useWorkspaceStore } from './workspaceStore';

export const useAuthStore = defineStore('authing', () => {
  // 状态
  const loading = ref(false);
  const error = ref<string | null>(null);
  const newbieCreditsRecord = ref<RechargeRecord | null>(null);
  const userStore = useUserStore();
  const authType = import.meta.env.VITE_AUTH_MODE;
  const authRouteName = authType === 'auth0' ? 'auth-auth0' : 'auth-authing';

  /**
   * Handle Authing login success
   */
  const setAuthingUser = async (token: string) => {
    // 调用 API 同步用户信息
    let response;
    if (authType === 'authing') {
      response = await syncAuthingToken(token);
    } else if (authType === 'auth0') {
      response = await syncAuth0Token(token);
    }

    error.value = null;
    const { newbieCreditsRecord: record, ...rest } = response.data;
    userStore.updateUserInfo(rest);

    const workspaceStore = useWorkspaceStore();
    workspaceStore.loadWorkspaces();

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
      if (authType === 'authing') {
        await requestAuthingLogout();
      } else if (authType === 'auth0') {
        await requestAuth0Logout();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      clearAuthState();
      loading.value = false;
      if (router.currentRoute.value.name !== authRouteName) {
        router.push({
          name: authRouteName,
          query: { redirect: router.currentRoute.value.fullPath },
        });
      }
    }
  };

  /**
   * Clear authentication state
   */
  const clearAuthState = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace');
    error.value = null;
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

  return {
    // 状态
    error,
    loading,
    newbieCreditsRecord,

    // 方法
    setAuthingUser,
    logout,
    clearAuthState,
    clearError,
    clearNewbieCreditsRecord,
  };
});
