<script setup lang="ts">
import CustomizationMenu from '@/components/CustomizationMenu.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import LandingLayout from '@/layouts/LandingLayout.vue';
import UILayout from '@/layouts/UILayout.vue';

import BackToTop from '@/components/common/BackToTop.vue';
import Snackbar from '@/components/common/Snackbar.vue';
import { useAppStore } from '@/stores/appStore';

import { useAuth0 } from '@auth0/auth0-vue';
import { useTheme } from 'vuetify';

let isSynced = false;

const theme = useTheme();
const route = useRoute();
const appStore = useAppStore();
const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();

const isRouterLoaded = computed(() => {
  if (route.name !== null) return true;
  return false;
});

const layouts = {
  default: DefaultLayout,
  ui: UILayout,
  landing: LandingLayout,
  auth: AuthLayout,
};

type LayoutName = 'default' | 'ui' | 'landing' | 'auth' | 'error';

const currentLayout = computed(() => {
  const layoutName = route.meta.layout as LayoutName;
  if (!layoutName) {
    return DefaultLayout;
  }
  return layouts[layoutName];
});

onMounted(() => {
  theme.global.name.value = appStore.theme;
});

watch(
  [isAuthenticated, isLoading],
  async ([isAuth, loading]) => {
    // 只有当加载结束 且 已经认证成功时 才触发
    if (isAuth && !loading && !isSynced) {
      try {
        isSynced = true;

        // 1. 静默获取 Access Token
        const token = await getAccessTokenSilently();

        // 2. 向 Nest.js 请求写 Cookie
        // 此时 Nest.js 里的 JwtStrategy 会通过这个 Bearer Token 验证你的身份
        console.log('debug auth0', token);
      } catch (error) {
        console.error('❌ 同步会话失败', error);
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <v-app>
    <component :is="currentLayout" v-if="isRouterLoaded">
      <router-view> </router-view>
    </component>
    <CustomizationMenu />
    <BackToTop />
    <Snackbar />
  </v-app>
</template>

<style scoped></style>
