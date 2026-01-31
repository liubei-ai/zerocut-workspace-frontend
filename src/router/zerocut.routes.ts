// Zerocut 视频 Agent 管理台路由配置
// 对应新的扁平化菜单结构

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
    path: '/plans-and-billing',
    name: 'PlansAndBilling',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '套餐与账单',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "plans-and-billing" */ '@/views/zerocut/PlansAndBillingView.vue'),
  },
  {
    path: '/membership',
    name: 'Membership',
    meta: {
      requiresAuth: true,
      layout: 'landing',
      title: '会员计划',
      category: 'ZeroCut',
    },
    component: () =>
      import(/* webpackChunkName: "membership-plans" */ '@/views/zerocut/MembershipPlansView.vue'),
  },
  // {
  //   path: '/bagelpay/products',
  //   name: 'BagelPayProducts',
  //   meta: {
  //     requiresAuth: true,
  //     layout: 'landing',
  //     title: '会员',
  //     category: 'ZeroCut',
  //   },
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "bagelpay-products" */ '@/views/zerocut/BagelPayProductListView.vue'
  //     ),
  // },
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
