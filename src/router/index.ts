import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/userStore';
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
  const userStore = useUserStore();

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin);

  if (requiresAuth) {
    // 简化逻辑：只检查本地状态，401错误由API层统一处理
    if (!userStore.isLoggedIn) {
      // 如果本地没有认证状态，直接跳转到登录页
      next({
        name: 'auth-authing',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // Check super admin permission
  if (requiresSuperAdmin) {
    // 确保用户信息已加载
    if (!userStore.userInfo) {
      await userStore.loadUserInfo();
    }

    // 检查是否为超级管理员
    if (!userStore.isSuperAdmin) {
      // 非超级管理员访问管理员页面，重定向到首页
      next('/dashboard');
      return;
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userStore.isLoggedIn && to.path.startsWith('/auth/')) {
    next('/');
    return;
  }

  next();
});

export default router;
