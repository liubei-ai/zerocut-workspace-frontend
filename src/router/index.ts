import { useAuthStore } from '@/stores/authStore';
import { createRouter, createWebHistory } from 'vue-router';
import AiRoutes from './ai.routes';
import AppsRoutes from './apps.routes';
import AuthRoutes from './auth.routes';
import ChartsRoutes from './charts.routes';
import DataRoutes from './data.routes';
import LandingRoutes from './landing.routes';
import PagesRoutes from './pages.routes';
import UIRoutes from './ui.routes';
import UmlRoutes from './uml.routes';
import UserRoutes from './user.routes';
import UtilityRoutes from './utility.routes';
import ZerocutRoutes from './zerocut.routes';

export const routes = [
  {
    path: '/',
    // redirect: '/dashboard',
    redirect: '/apikey',
    meta: {},
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'error',
    component: () => import(/* webpackChunkName: "error" */ '@/views/errors/NotFoundPage.vue'),
  },
  ...UserRoutes,
  ...LandingRoutes,
  ...AuthRoutes,
  ...PagesRoutes,
  ...UtilityRoutes,
  ...UIRoutes,
  ...AiRoutes,
  ...ZerocutRoutes,
  ...AppsRoutes,
  ...DataRoutes,
  ...ChartsRoutes,
  ...UmlRoutes,
];

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [];

const router = createRouter({
  history: createWebHistory(),
  // hash模式：createWebHashHistory，history模式：createWebHistory
  // process.env.NODE_ENV === "production"

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
    // 如果本地有认证状态，继续访问，如果服务端验证失败会在API层处理
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (authStore.isAuthenticated && to.path.startsWith('/auth/')) {
    next('/dashboard');
    return;
  }

  next();
});

export default router;
