<template>
  <div class="authing-page">
    <v-container fluid class="fill-height d-flex align-center justify-center">
      <div id="authing-guard-container"></div>
    </v-container>

    <!-- 错误提示 -->
    <v-snackbar v-model="showError" color="error" timeout="5000" top>
      {{ error }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showError = false"> 关闭 </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@authing/guard-vue3';

import { useGuard } from '@authing/guard-vue3';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const guard = useGuard();
const error = ref('');
const showError = ref(false);

/**
 * 同站路径白名单：只允许以 `/` 开头、不以 `//` 或 `/\\` 开头的相对路径，
 * 防止 open redirect。与 OAuth 授权页 FR-019 的规则一致。
 */
function isSafeRedirect(value: unknown): value is string {
  return typeof value === 'string' && /^\/(?!\/|\\)/.test(value);
}

// 处理登录成功
guard.on('login', async (authingUser: User) => {
  try {
    if (authingUser) {
      await authStore.setAuthToken(authingUser.token as string);
      // 优先跳回 ?redirect= 指定的同站目标（OAuth 授权页等）；否则默认首页。
      const redirect = route.query.redirect;
      if (isSafeRedirect(redirect)) {
        await router.replace(redirect);
      } else {
        await router.push('/');
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
});

// 处理登录错误
guard.on('login-error', error => {
  console.error('登录失败:', error);
  error.value = error.message || '登录失败，请重试';
  showError.value = true;
});

onMounted(() => {
  guard.start('#authing-guard-container');
});
</script>

<style>
@import '@authing/guard-vue3/dist/esm/guard.min.css';
</style>
