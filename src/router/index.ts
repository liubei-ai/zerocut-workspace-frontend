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

async function checkAuthorization() {
  try {
    const url = `${import.meta.env.VITE_API2_BASE_URL}/self/profile`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    console.log('checkAuthorization', data);
    return data.code === 401 ? null : data.data;
  } catch (error) {
    console.log('checkAuthorization error:', error);
    return null;
  }
}

// Global navigation guard for authentication
router.beforeEach(async to => {
  const userStore = useUserStore();

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin);

  if (requiresAuth && !userStore.isLoggedIn) {
    const userInfo = await checkAuthorization();
    if (!userInfo) {
      console.log('checkAuthorization failed, redirecting to auth-authing');
      return { name: 'auth-authing', query: { redirect: to.fullPath } };
    } else {
      console.log('checkAuthorization success, userInfo:', userInfo);
      userStore.updateUserInfo(userInfo);
    }
  }

  // Check super admin permission
  if (requiresSuperAdmin && !userStore.isSuperAdmin) {
    return '/';
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userStore.isLoggedIn && to.path.startsWith('/auth/')) {
    return '/';
  }

  return true;
});

export default router;
