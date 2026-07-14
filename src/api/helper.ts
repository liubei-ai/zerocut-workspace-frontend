let authStore;
let workspaceAccessDeniedHandling: Promise<void> | null = null;

const getAuthStore = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/stores/authStore');
    authStore = useAuthStore();
  }
  return authStore;
};

// 处理认证失败的函数（401：登录态失效 → 登出 + 跳登录页）
export const handleAuthFailure = async () => {
  try {
    const store = await getAuthStore();
    await store.logout();
  } catch (error) {
    console.error('Handle auth failure error:', error);
  }
};

// 处理权限不足（403：登录态有效但权限不够 → 跳 /403）
// 不要登出 —— 否则用户会被反复踢到登录页，而真正的问题只是缺权限。
export const handleForbidden = async () => {
  try {
    const { default: router } = await import('@/router');
    // 已经在 /403 时不再跳转，避免重复 push 触发路由告警
    if (router.currentRoute.value.path !== '/403') {
      await router.push({ path: '/403' });
    }
  } catch (error) {
    console.error('Handle forbidden error:', error);
  }
};

/**
 * 工作空间成员关系变更后，浏览器可能仍持有旧的 workspaceId。
 * 刷新本账号可访问空间并提示用户；绝不重放触发 403 的请求，避免写操作重复执行。
 */
export const handleWorkspaceAccessDenied = async () => {
  if (workspaceAccessDeniedHandling) {
    return workspaceAccessDeniedHandling;
  }

  workspaceAccessDeniedHandling = (async () => {
    try {
      const [{ useWorkspaceStore }, { useSnackbarStore }] = await Promise.all([
        import('@/stores/workspaceStore'),
        import('@/stores/snackbarStore'),
      ]);
      const workspaceStore = useWorkspaceStore();
      await workspaceStore.loadWorkspaces();
      const snackbarStore = useSnackbarStore();
      if (workspaceStore.error) {
        snackbarStore.showErrorMessage('无法刷新工作空间，请稍后重试');
      } else if (workspaceStore.currentWorkspace) {
        snackbarStore.showWarningMessage('当前工作空间不可访问，已切换到可用工作空间');
      } else {
        snackbarStore.showWarningMessage('当前账号没有可访问的工作空间');
      }
    } catch (error) {
      console.error('Handle workspace access denied error:', error);
    } finally {
      workspaceAccessDeniedHandling = null;
    }
  })();

  return workspaceAccessDeniedHandling;
};
