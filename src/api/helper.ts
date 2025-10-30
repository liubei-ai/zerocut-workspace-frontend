let authStore;

const getAuthStore = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/stores/authStore');
    authStore = useAuthStore();
  }
  return authStore;
};

// 处理认证失败的函数
export const handleAuthFailure = async () => {
  try {
    const store = await getAuthStore();
    await store.logout();
  } catch (error) {
    console.error('Handle auth failure error:', error);
  }
};
