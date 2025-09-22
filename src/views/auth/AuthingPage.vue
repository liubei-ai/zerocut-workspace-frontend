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
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@authing/guard-vue3';
import { useGuard } from '@authing/guard-vue3';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const guard = useGuard();
const error = ref('');
const showError = ref(false);

// 处理登录成功
guard.on('login', async (authingUser: User) => {
  try {
    if (authingUser) {
      console.log('登录成功，用户信息:', authingUser);
      await authStore.setAuthingUser(authingUser);
      await router.push('/dashboard');
    }

    // 刷新页面以解决样式冲突问题
    // window.location.reload();
  } catch (error) {
    console.error('Login failed:', error);
    // 可以在这里显示错误消息
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
