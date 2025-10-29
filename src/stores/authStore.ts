import router from '@/router';
import type { RechargeRecord } from '@/types/api';
import { useGuard, type User as AuthingUser } from '@authing/guard-vue3';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { requestLogout, syncUserProfile } from '../api/authApi';
import { useUserStore } from './userStore';
import { useWorkspaceStore } from './workspaceStore';

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const loading = ref(false);
  const error = ref<string | null>(null);
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
