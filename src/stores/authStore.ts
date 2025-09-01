import router from '@/router';
import type { ApiError, User } from '@/types/api';
import { useGuard, type User as AuthingUser } from '@authing/guard-vue3';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loading: false,
    error: null as string | null,
    isLoggedIn: false,

    user: null as User | null,
  }),

  getters: {
    isAuthenticated: state => state.isLoggedIn && !!state.user,
    userName: state => state.user?.username || '',
  },

  actions: {
    /**
     * Handle Authing login success
     */
    async setAuthingUser(authingUser: AuthingUser) {
      // 将 Authing 用户信息转换为应用的用户格式
      const user: User = {
        username: authingUser.username || '',
      };

      this.user = user;
      this.isLoggedIn = true;
      this.error = null;

      console.log('Authing 用户登录成功:', user);
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
      this.loading = true;

      try {
        const guard = useGuard();
        await guard.logout();
      } catch (error) {
        console.error('Logout failed:', error);
        // Continue with local logout even if server logout fails
      } finally {
        this.clearAuthState();
        this.loading = false;

        // 只有在不是由 API 层调用时才跳转（避免重复跳转）
        if (router.currentRoute.value.name !== 'auth-signin') {
          router.push({ name: 'auth-signin' });
        }
      }
    },

    /**
     * Clear authentication state
     */
    clearAuthState() {
      this.isLoggedIn = false;
      this.user = null;
      this.error = null;
    },

    /**
     * Handle authentication errors
     */
    handleAuthError(error: ApiError) {
      if (error.code === 401) {
        this.error = 'Invalid username or password';
        this.clearAuthState();
      } else if (error.code === 403) {
        this.error = 'Access denied';
      } else if (error.code === 0) {
        this.error = 'Network error. Please check your connection.';
      } else {
        this.error = error.message || 'Login failed. Please try again.';
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
    },
  },

  persist: {
    storage: localStorage,
    pick: ['isLoggedIn', 'user'],
  },
});
