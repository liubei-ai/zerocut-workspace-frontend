export const oauthRoutes = [
  {
    /**
     * OAuth 授权确认页（App Worker → Cerevox Sandbox 接入主入口）。
     *
     * `requiresAuth: false`：本页自身负责未登录的跳登录处理（FR-015 状态 2），
     * 不能交给 router 守卫先跳走，否则 URL 参数合法性校验（状态 1）会被绕过。
     *
     * 见 specs/006-oauth-authorize-service/spec.md FR-015。
     */
    path: '/oauth/authorize',
    name: 'oauth-authorize',
    component: () => import(/* webpackChunkName: "oauth" */ '@/views/oauth/AuthorizePage.vue'),
    meta: {
      layout: 'auth',
      title: 'OAuth 授权',
    },
  },
];
