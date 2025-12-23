/**
 * main.js
 *
 */

// Components
import App from './App.vue';

// Composables
import '@/styles/main.scss';
import { createAuth0 } from '@auth0/auth0-vue';
import { createGuard } from '@authing/guard-vue3';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue';
import MasonryWall from '@yeger/vue-masonry-wall';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createApp } from 'vue';
import VueVirtualScroller from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import VueApexCharts from 'vue3-apexcharts';
import Vue3Lottie from 'vue3-lottie';
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import 'vue3-perfect-scrollbar/style.css';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';
import router from './router';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

app.use(router);
app.use(PerfectScrollbarPlugin);
app.use(MasonryWall);
app.use(VueVirtualScroller);
app.use(VueApexCharts);
app.use(pinia);
app.use(i18n);
app.use(Vue3Lottie, { name: 'LottieAnimation' });
app.use(autoAnimatePlugin);

if (import.meta.env.VITE_AUTH_MODE === 'authing') {
  app.use(
    createGuard({
      appId: import.meta.env.VITE_AUTHING_APP_ID,
    })
  );
} else if (import.meta.env.VITE_AUTH_MODE === 'auth0') {
  app.use(
    createAuth0({
      domain: import.meta.env.VITE_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
      authorizationParams: { redirect_uri: import.meta.env.VITE_AUTH0_CALLBACK_URL },
      cacheLocation: 'localstorage', // 将状态持久化到本地存储
      useRefreshTokens: true, // 强烈建议开启，配合持久化使用
    }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  );
}

app.use(vuetify);
app.mount('#app');
