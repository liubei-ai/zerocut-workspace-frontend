import { getCurrentUserInfo } from '@/api/userApi';
import type { UserInfoDto } from '@/types/api';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户基本信息
    userInfo: null as UserInfoDto | null,
    // 加载状态
    loading: false,
    // 错误信息
    error: null as string | null,
    // 用户偏好设置
    preferences: {
      notifications: {
        officialEmails: true,
        followerUpdates: true,
      },
      authorized: {
        google: false,
        facebook: false,
      },
    },
  }),

  persist: {
    storage: localStorage,
    pick: ['userInfo', 'preferences'],
  },

  getters: {
    // 基本信息
    username: state => state.userInfo?.username || '',
    email: state => state.userInfo?.email || '',
    name: state => state.userInfo?.name || '',
    avatar: state => state.userInfo?.avatar || '',
    phone: state => state.userInfo?.phone || '',

    // 角色和权限
    userRole: state => state.userInfo?.role || null,
    isSuperAdmin: state => state.userInfo?.role === 'super_admin',
    isUser: state => state.userInfo?.role === 'user',

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
      authorized: state.preferences.authorized,
      notifications: state.preferences.notifications,
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
    reset() {
      this.userInfo = null;
      this.loading = false;
      this.error = null;
      // 保留偏好设置，因为这些是用户的个人配置
    },
  },
});
