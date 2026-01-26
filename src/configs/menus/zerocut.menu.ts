const zerocutMenu = [
  {
    key: 'menu.studio',
    link: import.meta.env.VITE_ZEROCUT_STUDIO_PROJECT,
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
  {
    key: 'menu.membership',
    link: '/membership',
    icon: 'mdi-account-check-outline',
  },
];

if (import.meta.env.VITE_PACKAGE_PAGE_ENABLE === 'true') {
  zerocutMenu.push({
    key: 'menu.packages',
    link: '/packages',
    icon: 'mdi-gift',
  });
}

if (import.meta.env.VITE_PRO_GUIDE_ENABLE === 'true') {
  zerocutMenu.push({
    key: 'menu.guide',
    link: 'https://liubeiai.feishu.cn/wiki/AuUnwr7beigRy1klOXDcnuu0nAg?from=zerocut_workspace',
    icon: 'mdi-open-in-new',
    external: true,
  });
}

if (import.meta.env.VITE_MEMBER_PRICE_ENABLE === 'true') {
  zerocutMenu.push({
    key: 'menu.pricing',
    link: '/bagelpay/products',
    icon: 'mdi-shopping-outline',
  });
}

export default zerocutMenu;
