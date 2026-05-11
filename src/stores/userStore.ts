import { defineStore } from 'pinia';

import type { UserInfoDto } from '@/types/api';

import { getCurrentUserInfo } from '@/api/userApi';
import { Permission } from '@/constants/permissions';

export const useUserStore = defineStore('user', {
  state: () => ({
    loading: false,
    error: null as string | null,
    userInfo: null as UserInfoDto | null,
  }),

  getters: {
    // 基本信息
    username: state => state.userInfo?.username || '',
    email: state => state.userInfo?.email || '',
    name: state => state.userInfo?.name || '',
    avatar: state => state.userInfo?.avatar || '',
    phone: state => state.userInfo?.phone || '',

    // 角色和权限
    userRole: state => state.userInfo?.role || null,
    /** @deprecated 用 hasPermission 代替；保留以兼容旧路由/页面 */
    isSuperAdmin: state => state.userInfo?.role === 'super_admin',
    isUser: state => state.userInfo?.role === 'user',
    permissions: (state): string[] => state.userInfo?.permissions ?? [],
    isAdminTier: (state): boolean =>
      (state.userInfo?.permissions ?? []).includes(Permission.ADMIN_ACCESS),

    /**
     * 是否拥有指定权限点（AND 语义：传数组时需全部命中）。
     * 用法：userStore.hasPermission(Permission.WALLET_GRANT)
     *      userStore.hasPermission([Permission.WORKSPACE_READ, Permission.WORKSPACE_WRITE])
     */
    hasPermission(state) {
      const set = new Set(state.userInfo?.permissions ?? []);
      return (perm: Permission | Permission[] | string | string[]): boolean => {
        const list = Array.isArray(perm) ? perm : [perm];
        return list.every(p => set.has(p));
      };
    },

    /** OR 语义：拥有任意一个即可 */
    hasAnyPermission(state) {
      const set = new Set(state.userInfo?.permissions ?? []);
      return (perms: Array<Permission | string>): boolean => perms.some(p => set.has(p));
    },

    // 状态
    isLoggedIn: state => !!state.userInfo,

    // 完整的用户资料（用于 ProfilePage）
    profile: state => ({
      basic: {
        username: state.userInfo?.username || '',
        realname: state.userInfo?.name || '',
        email: state.userInfo?.email || '',
        avatar: state.userInfo?.avatar || '',
        role: state.userInfo?.role || '',
      },
    }),
  },

  actions: {
    // 加载用户信息
    async loadUserInfo() {
      this.loading = true;
      this.error = null;

      try {
        const userInfo = await getCurrentUserInfo();
        this.userInfo = userInfo;
      } catch (error) {
        this.error = error instanceof Error ? error.message : '加载用户信息失败';
        console.error('Failed to load user info:', error);
      } finally {
        this.loading = false;
      }
    },

    /** 重新拉取 profile 同步 permissions（后台调权限后无需登出即可生效） */
    async refreshProfile() {
      const userInfo = await getCurrentUserInfo();
      this.userInfo = userInfo;
    },

    // 更新用户信息
    updateUserInfo(userInfo: UserInfoDto) {
      this.userInfo = userInfo;
    },

    // 更新基本信息
    updateBasicInfo(info: Partial<UserInfoDto>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...info };
      }
    },

    // 更新授权状态
    updateAuthorizedStatus(service: keyof typeof this.preferences.authorized, status: boolean) {
      this.preferences.authorized[service] = status;
    },

    // 更新通知设置
    updateNotificationSettings(settings: Partial<typeof this.preferences.notifications>) {
      this.preferences.notifications = { ...this.preferences.notifications, ...settings };
    },

    // 清除错误
    clearError() {
      this.error = null;
    },

    // 重置状态
    $reset() {
      this.userInfo = null;
      this.loading = false;
      this.error = null;
    },
  },

  persist: {
    storage: localStorage,
    pick: ['userInfo', 'isLoggedIn'],
  },
});
