export const authingRoutes = [
  {
    path: '/auth/authing',
    name: 'auth-authing',
    component: () => import(/* webpackChunkName: "auth-authing" */ '@/views/auth/AuthingPage.vue'),
    meta: {
      layout: 'auth',
      title: 'Authing认证',
    },
  },
];

export const auth0Routes = [
  {
    path: '/auth/auth0',
    name: 'auth-auth0',
    component: () => import(/* webpackChunkName: "auth-auth0" */ '@/views/auth/Auth0Page.vue'),
    meta: {
      layout: 'auth',
      title: 'Auth0认证',
    },
  },
  {
    path: '/auth/auth0/callback',
    name: 'auth-auth0-callback',
    component: () =>
      import(/* webpackChunkName: "auth-auth0-callback" */ '@/views/auth/Auth0Callback.vue'),
    meta: {
      layout: 'auth',
      title: 'Auth0认证回调',
    },
  },
];
