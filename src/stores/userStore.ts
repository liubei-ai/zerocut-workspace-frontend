import { getHomepageData } from '@/api/userApi';
import type { UserInfoDto } from '@/types/api';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息
    userInfo: null as UserInfoDto | null,
    // 加载状态
    loading: false,
    // 错误信息
    error: null as string | null,
  }),

  persist: {
    storage: localStorage,
    pick: ['userInfo'],
  },

  getters: {
    // 获取用户角色
    userRole: state => state.userInfo?.role || null,

    // 检查是否为超级管理员
    isSuperAdmin: state => state.userInfo?.role === 'super_admin',

    // 检查是否为普通用户
    isUser: state => state.userInfo?.role === 'user',

    // 获取用户名
    username: state => state.userInfo?.username || '',

    // 获取用户邮箱
    email: state => state.userInfo?.email || '',

    // 检查用户是否已登录
    isLoggedIn: state => !!state.userInfo,
  },

  actions: {
    // 加载用户信息
    async loadUserInfo() {
      this.loading = true;
      this.error = null;

      try {
        const homepageData = await getHomepageData();
        this.userInfo = homepageData.user;
        console.log('用户信息加载成功:', this.userInfo);
      } catch (error) {
        console.error('加载用户信息失败:', error);
        this.error = '网络错误，请稍后重试';
        this.userInfo = null;
      } finally {
        this.loading = false;
      }
    },

    // 更新用户信息
    updateUserInfo(userInfo: UserInfoDto) {
      this.userInfo = userInfo;
    },

    // 清除错误信息
    clearError() {
      this.error = null;
    },

    // 重置状态
    reset() {
      this.userInfo = null;
      this.loading = false;
      this.error = null;
    },
  },
});
