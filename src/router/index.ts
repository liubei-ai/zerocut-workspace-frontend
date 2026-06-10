import { createRouter, createWebHistory } from 'vue-router';

import { useSubAccountStore } from '../stores/subAccountStore';
import { useUserStore } from '../stores/userStore';
import AdminRoutes from './admin.routes';
import { auth0Routes, authingRoutes } from './auth.routes';
import { oauthRoutes } from './oauth.routes';
import subAccountRoutes from './sub-account.routes';
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
  ...oauthRoutes,
  ...subAccountRoutes,
  ...ZerocutRoutes,
  ...AdminRoutes,
  {
    path: '/403',
    name: 'forbidden',
    component: () => import(/* webpackChunkName: "error" */ '@/views/errors/ForbiddenPage.vue'),
  },
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
    return data.code === 401 ? null : data.data;
  } catch {
    return null;
  }
}

// Global navigation guard for authentication
router.beforeEach(async to => {
  const userStore = useUserStore();

  // 子账号路由：与主站登录态隔离，未登录则跳子账号登录页（不跳主站登录）
  const requiresSubAccount = to.matched.some(record => record.meta.requiresSubAccount);
  if (requiresSubAccount) {
    const subAccountStore = useSubAccountStore();
    if (!subAccountStore.isLoggedIn) {
      return { name: 'sub-account-login', query: { redirect: to.fullPath } };
    }
    return true;
  }

  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !userStore.isLoggedIn) {
    const userInfo = await checkAuthorization();
    if (!userInfo) {
      return { name: authRouteName, query: { redirect: to.fullPath } };
    } else {
      userStore.updateUserInfo(userInfo);
    }
  }

  // 收集所有匹配路由的 permissions 元数据（AND 语义：每条都要满足）
  const requiredPermissions = to.matched.flatMap(record => {
    const m = record.meta as { permissions?: string[] };
    return Array.isArray(m.permissions) ? m.permissions : [];
  });
  if (requiredPermissions.length > 0 && !userStore.hasPermission(requiredPermissions)) {
    return { path: '/403' };
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userStore.isLoggedIn && to.path.startsWith('/auth/')) {
    return '/';
  }

  return true;
});

export default router;
