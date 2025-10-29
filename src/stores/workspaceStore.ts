import { getHomepageData } from '@/api/userApi';
import type { UserWorkspaceDto, UserInfoDto } from '@/types/api';
import { defineStore } from 'pinia';

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    // 用户信息
    userInfo: null as UserInfoDto | null,
    // 当前选中的工作空间
    currentWorkspace: null as UserWorkspaceDto | null,
    // 用户的工作空间列表
    workspaces: [] as UserWorkspaceDto[],
    // 加载状态
    loading: false,
    // 错误信息
    error: null as string | null,
  }),

  persist: {
    storage: localStorage,
    pick: ['userInfo', 'currentWorkspace'],
  },

  getters: {
    // 用户信息相关 getters
    userRole: state => state.userInfo?.role || null,
    isSuperAdmin: state => state.userInfo?.role === 'super_admin',
    isUser: state => state.userInfo?.role === 'user',
    username: state => state.userInfo?.username || '',
    email: state => state.userInfo?.email || '',
    isLoggedIn: state => !!state.userInfo,

    // 获取当前工作空间ID
    currentWorkspaceId: state => state.currentWorkspace?.workspaceId || null,

    // 获取当前工作空间名称
    currentWorkspaceName: state => state.currentWorkspace?.name || '',

    // 检查是否有工作空间
    hasWorkspaces: state => state.workspaces.length > 0,

    // 获取活跃的工作空间列表
    activeWorkspaces: state => state.workspaces.filter(ws => ws.isActive),
  },

  actions: {
    // 加载主页数据（包含用户信息和工作空间数据）
    async loadHomepageData() {
      this.loading = true;
      this.error = null;

      try {
        const homepageData = await getHomepageData();

        // 设置用户信息
        this.userInfo = homepageData.user;
        console.log('debug 用户信息加载成功:', this.userInfo);

        // 设置工作空间数据
        this.workspaces = homepageData.workspaces;

        // 如果没有当前选中的工作空间，选择第一个活跃的工作空间
        if (!this.currentWorkspace && this.activeWorkspaces.length > 0) {
          this.currentWorkspace = this.activeWorkspaces[0];
        }

        // 如果当前选中的工作空间不在列表中，重新选择
        if (
          this.currentWorkspace &&
          !this.workspaces.find(ws => ws.workspaceId === this.currentWorkspace?.workspaceId)
        ) {
          this.currentWorkspace =
            this.activeWorkspaces.length > 0 ? this.activeWorkspaces[0] : null;
        }
      } catch (error) {
        console.error('加载主页数据失败:', error);
        this.error = '网络错误，请稍后重试';
        this.userInfo = null;
      } finally {
        this.loading = false;
      }
    },

    // 兼容性方法：加载工作空间数据
    async loadWorkspaces() {
      return this.loadHomepageData();
    },

    // 加载用户信息（兼容性方法）
    async loadUserInfo() {
      return this.loadHomepageData();
    },

    // 切换工作空间
    switchWorkspace(workspace: UserWorkspaceDto) {
      if (workspace.isActive) {
        this.currentWorkspace = workspace;
        console.log('切换到工作空间:', workspace.name);
      } else {
        console.warn('尝试切换到非活跃工作空间:', workspace.name);
      }
    },

    // 根据ID切换工作空间
    switchWorkspaceById(workspaceId: string) {
      const workspace = this.workspaces.find(ws => ws.workspaceId === workspaceId);
      if (workspace) {
        this.switchWorkspace(workspace);
      } else {
        console.warn('未找到工作空间:', workspaceId);
      }
    },

    // 清除错误信息
    clearError() {
      this.error = null;
    },

    // 更新用户信息
    updateUserInfo(userInfo: UserInfoDto) {
      this.userInfo = userInfo;
    },

    // 重置状态
    reset() {
      this.userInfo = null;
      this.currentWorkspace = null;
      this.workspaces = [];
      this.loading = false;
      this.error = null;
    },
  },
});
