import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { SubAccountSessionInfo } from '@/types/api';

import { subAccountLogin, subAccountLogout } from '@/api/subAccountApi';

const SESSION_KEY = 'zerocut-sub-account-session';

/**
 * 子账号会话状态，与主站 authStore 完全隔离。
 * 令牌走 httpOnly cookie，前端仅保存非敏感的会话信息用于展示与路由守卫。
 */
export const useSubAccountStore = defineStore('subAccount', () => {
  const session = ref<SubAccountSessionInfo | null>(loadSession());
  const loading = ref(false);

  const isLoggedIn = computed(() => session.value != null);

  function loadSession(): SubAccountSessionInfo | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SubAccountSessionInfo;
      // 过期即视为未登录
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function persist(value: SubAccountSessionInfo | null) {
    session.value = value;
    if (value) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  async function login(workspaceId: string, apiKeySuffix: string): Promise<void> {
    loading.value = true;
    try {
      const info = await subAccountLogin(workspaceId, apiKeySuffix);
      persist(info);
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await subAccountLogout();
    } catch {
      // 即使登出请求失败也清理本地会话
    } finally {
      persist(null);
    }
  }

  /** 会话失效（例如查询返回 401）时清理本地状态 */
  function clear(): void {
    persist(null);
  }

  return { session, loading, isLoggedIn, login, logout, clear };
});
