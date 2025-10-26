import { useAuthStore } from '@/stores/authStore';
import { createRouter, createWebHistory } from 'vue-router';
import AdminRoutes from './admin.routes';
import ZerocutRoutes from './zerocut.routes';

export const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: {},
  },
  {
    path: '/auth/authing',
    name: 'auth-authing',
    component: () => import(/* webpackChunkName: "auth-authing" */ '@/views/auth/AuthingPage.vue'),
    meta: {
      layout: 'auth',
      title: 'Authing认证',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'error',
    component: () => import(/* webpackChunkName: "error" */ '@/views/errors/NotFoundPage.vue'),
  },
  // ...LandingRoutes,
  // ...ChartsRoutes,
  ...ZerocutRoutes,
  ...AdminRoutes,
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Global navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth) {
    // 简化逻辑：只检查本地状态，401错误由API层统一处理
    if (!authStore.isAuthenticated) {
      // 如果本地没有认证状态，直接跳转到登录页
      next({
        name: 'auth-authing',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (authStore.isAuthenticated && to.path.startsWith('/auth/')) {
    next('/');
    return;
  }

  next();
});

export default router;
