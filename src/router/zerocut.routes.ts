// Zerocut 视频 Agent 管理台路由配置
// 对应新的扁平化菜单结构

import { authGuard } from '@auth0/auth0-vue';

const zerocutRoutes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '数据看板',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "dashboard" */ '@/views/zerocut/DashboardView.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/apikey',
    name: 'APIKeys',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: 'API 密钥管理',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "token-management" */ '@/views/zerocut/APIKeyManagementView.vue'),
  },
  {
    path: '/usage',
    name: 'Usage',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '使用日志',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "usage-logs" */ '@/views/zerocut/UsageLogsView.vue'),
  },
  {
    path: '/wallet',
    name: 'Wallet',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '钱包管理',
      category: 'ZeroCut',
    },
    component: () =>
      import(
        /* webpackChunkName: "wallet-management" */ '@/views/zerocut/WalletManagementView.vue'
      ),
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '个人设置',
      category: 'ZeroCut',
    },
    component: () =>
      import(
        /* webpackChunkName: "personal-settings" */ '@/views/zerocut/PersonalSettingsView.vue'
      ),
  },
  {
    path: '/members',
    name: 'Members',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '成员管理',
      category: 'ZeroCut',
    },
    component: () =>
      import(
        /* webpackChunkName: "member-management" */ '@/views/zerocut/MemberManagementView.vue'
      ),
  },
];

if (import.meta.env.VITE_PACKAGE_PAGE_ENABLE === 'true') {
  zerocutRoutes.push({
    path: '/packages',
    name: 'Packages',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '积分套餐',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "package-list" */ '@/views/zerocut/PackageListView.vue'),
  });
}

export default zerocutRoutes;
