import { defineStore } from 'pinia';

export interface AdminWorkspaceInfo {
  workspaceId: string;
  name?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  creditsBalance?: number;
  createdAt?: string;
  memberCount?: number;
}

export const useAdminWorkspaceStore = defineStore('adminWorkspace', {
  state: () => ({
    currentWorkspace: null as AdminWorkspaceInfo | null,
  }),
  actions: {
    setCurrentWorkspace(info: AdminWorkspaceInfo) {
      this.currentWorkspace = info;
    },
    clearCurrentWorkspace() {
      this.currentWorkspace = null;
    },
  },
});
