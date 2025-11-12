export default [
  {
    icon: 'mdi-file-lock-outline',
    key: 'menu.auth',
    regex: /^\/auth/,
    items: [
      {
        icon: 'mdi-login',
        key: 'menu.authLogin',
        link: '/auth/signin',
      },
      {
        icon: 'mdi-logout',
        key: 'menu.authRegister',
        link: '/auth/signup',
      },
      {
        icon: 'mdi-email-check',
        key: 'menu.authVerify',
        link: '/auth/verify-email',
      },
      {
        icon: 'mdi-file-outline',
        key: 'menu.authForgot',
        link: '/auth/forgot-password',
      },
      {
        icon: 'mdi-file-outline',
        key: 'menu.authReset',
        link: '/auth/reset-password',
      },
    ],
  },
  {
    icon: 'mdi-file-cancel-outline',
    key: 'menu.errorPages',
    regex: /^\/error/,
    items: [
      {
        icon: 'mdi-note-remove',
        key: 'menu.errorNotFound',
        link: '/error/not-found',
      },
      {
        icon: 'mdi-note-remove-outline',
        key: 'menu.errorUnexpected',
        link: '/error/unexpected',
      },
    ],
  },
  {
    icon: 'mdi-file-cog-outline',
    key: 'menu.utilityPages',
    regex: /^\/utility/,
    items: [
      {
        icon: 'mdi-wrench-clock',
        key: 'menu.utilityMaintenance',
        link: '/utility/maintenance',
      },
      {
        icon: 'mdi-timer-sand',
        key: 'menu.utilitySoon',
        link: '/utility/coming-soon',
      },
      {
        icon: 'mdi-comment-question-outline',
        key: 'menu.utilityHelp',
        link: '/utility/help',
      },
    ],
  },
];
