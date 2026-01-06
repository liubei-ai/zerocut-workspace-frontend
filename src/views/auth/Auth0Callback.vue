<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import { useAuth0 } from '@auth0/auth0-vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const isSyncing = ref(false);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { error, isAuthenticated, isLoading, getAccessTokenSilently, handleRedirectCallback } =
  useAuth0();

const displayError = computed(() => {
  if (!error.value) {
    return '';
  }

  const err = error.value as unknown as { message?: string };
  return err.message ?? String(error.value);
});

// 调用 handleRedirectCallback 后，isAuth 变为 true, loading 变为 false
// 然后调用 getAccessTokenSilently 获取 token，同步 token 到服务端，然后跳转到 redirectTarget
onMounted(async () => {
  try {
    await handleRedirectCallback();
  } catch (error) {
    console.error('auth0 回调处理失败', error);
  }
});

watch(
  [isAuthenticated, isLoading],
  async ([isAuth, loading]) => {
    if (isAuth && !loading && !isSyncing.value) {
      try {
        isSyncing.value = true;
        // 获取 jwt token，需要设置 authorizationParams.audience，否则拿到 token 是纯前端用的
        const token = await getAccessTokenSilently();
        // 同步 token 到服务端，一定要同步完后再跳转
        await authStore.setAuthToken(token);
        // 跳转到 redirect 参数指定的路径
        await router.replace((route.query.redirect as string) ?? '/dashboard');
      } catch (error) {
        console.error('❌ 同步会话失败', error);
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <p id="page-description">
      <span v-if="isLoading">Signing you in, please wait...</span>
      <span v-else-if="displayError">{{ displayError }}</span>
      <span v-else>Redirecting...</span>
    </p>
  </div>
</template>
