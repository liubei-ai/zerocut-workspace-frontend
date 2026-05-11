let authStore;

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
