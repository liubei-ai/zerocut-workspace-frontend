import { getWorkspaces } from '@/api/userApi';
import type { UserWorkspaceDto } from '@/types/api';
import { defineStore } from 'pinia';

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    // 当前工作空间
    currentWorkspace: null as UserWorkspaceDto | null,
    // 工作空间列表
    workspaces: [] as UserWorkspaceDto[],
    // 加载状态
    loading: false,
    // 错误信息
    error: null as string | null,
  }),

  persist: {
    storage: localStorage,
    pick: ['currentWorkspace', 'workspaces'],
  },

  getters: {
    currentWorkspaceId: state => state.currentWorkspace?.workspaceId || null,
    currentWorkspaceName: state => state.currentWorkspace?.name || '',
    hasWorkspaces: state => state.workspaces.length > 0,
    activeWorkspaces: state => state.workspaces.filter(ws => ws.isActive),
  },

  actions: {
    // 加载工作空间数据
    async loadWorkspaces() {
      if (this.loading) return;

      this.loading = true;
      this.error = null;

      try {
        const workspaces = await getWorkspaces();

        // 如果没有当前工作空间，设置第一个为当前工作空间
        this.workspaces = workspaces;
        if (!this.currentWorkspace && this.workspaces.length > 0) {
          this.currentWorkspace = this.workspaces[0];
        }
      } catch (error) {
        this.error = error.message || '加载工作空间数据失败';
        console.error('Failed to load workspace data:', error);
      } finally {
        this.loading = false;
      }
    },

    // 兼容性方法：加载主页数据
    async loadHomepageData() {
      return this.loadWorkspaces();
    },

    // 设置当前工作空间
    setCurrentWorkspace(workspace: UserWorkspaceDto) {
      this.currentWorkspace = workspace;
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
