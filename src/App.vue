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
import { useAuthStore } from './stores/authStore';

let isSynced = false;

const theme = useTheme();
const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
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

// authing 监听登录成功是在 AuthingPage.vue 中完成的
// auth0 的监听登录成功需要在 App.vue 一个全局的位置监听
watch(
  [isAuthenticated, isLoading],
  async ([isAuth, loading]) => {
    if (isAuth && !loading && !isSynced) {
      try {
        isSynced = true;
        const token = await getAccessTokenSilently();
        await authStore.setAuthingUser(token);
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
