import { getHomepageData } from '@/api/userApi';
import type { UserWorkspaceDto } from '@/types/api';
import { defineStore } from 'pinia';

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
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
    pick: ['currentWorkspace'],
  },

  getters: {
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
    // 加载工作空间数据
    async loadWorkspaces() {
      this.loading = true;
      this.error = null;

      try {
        const homagePageData = await getHomepageData();
        this.workspaces = homagePageData.workspaces;

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
        console.error('加载工作空间失败:', error);
        this.error = '网络错误，请稍后重试';
      } finally {
        this.loading = false;
      }
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

    // 重置状态
    reset() {
      this.currentWorkspace = null;
      this.workspaces = [];
      this.loading = false;
      this.error = null;
    },
  },
});
