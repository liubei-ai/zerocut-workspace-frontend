const subAccountRoutes = [
  {
    path: '/sub-account/login',
    name: 'sub-account-login',
    component: () =>
      import(/* webpackChunkName: "sub-account" */ '@/views/sub-account/SubAccountLoginView.vue'),
    meta: {
      layout: 'auth',
      title: '子账号登录',
    },
  },
  {
    path: '/sub-account/consumption',
    name: 'sub-account-consumption',
    component: () =>
      import(
        /* webpackChunkName: "sub-account" */ '@/views/sub-account/SubAccountConsumptionView.vue'
      ),
    meta: {
      layout: 'auth',
      title: '消费记录',
      requiresSubAccount: true,
      wide: true,
    },
  },
];

export default subAccountRoutes;
