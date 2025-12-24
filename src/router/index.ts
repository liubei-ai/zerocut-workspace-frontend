import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import AdminRoutes from './admin.routes';
import { auth0Routes, authingRoutes } from './auth.routes';
import ZerocutRoutes from './zerocut.routes';

const authType = import.meta.env.VITE_AUTH_MODE;
const authRouteName = authType === 'auth0' ? 'auth-auth0' : 'auth-authing';

export const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    meta: {},
  },
  ...(authType === 'auth0' ? auth0Routes : authingRoutes),
  ...ZerocutRoutes,
  ...AdminRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'error',
    component: () => import(/* webpackChunkName: "error" */ '@/views/errors/NotFoundPage.vue'),
  },
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
      return { name: authRouteName, query: { redirect: to.fullPath } };
    } else {
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
