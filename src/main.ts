/**
 * main.js
 *
 */

// Components
import App from './App.vue';

// Composables
import '@/styles/main.scss';
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
app.use(createGuard({ appId: '68aed701dc9d45f8f1a17ba0' }));

app.use(vuetify);
app.mount('#app');
