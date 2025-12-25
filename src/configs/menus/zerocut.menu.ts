const zerocutMenu = [
  {
    key: 'menu.studio',
    link: 'https://studio.zerocut.cn/auth/authing?redirect=/projects',
    icon: 'mdi-video-plus',
    external: true,
  },
  {
    key: 'menu.dashboard',
    link: '/dashboard',
    icon: 'mdi-view-dashboard-outline',
  },
  {
    key: 'menu.apikeys',
    link: '/apikey',
    icon: 'mdi-key-variant',
  },
  {
    key: 'menu.usage',
    link: '/usage',
    icon: 'mdi-chart-line',
  },
  {
    key: 'menu.wallet',
    link: '/wallet',
    icon: 'mdi-wallet-outline',
  },
];

if (import.meta.env.VITE_PACKAGE_PAGE_ENABLE === 'true') {
  zerocutMenu.push({
    key: 'menu.packages',
    link: '/packages',
    icon: 'mdi-gift',
  });
}

zerocutMenu.push({
  key: 'menu.guide',
  link: 'https://liubeiai.feishu.cn/wiki/AuUnwr7beigRy1klOXDcnuu0nAg?from=zerocut_workspace',
  icon: 'mdi-open-in-new',
  external: true,
});

export default zerocutMenu;
