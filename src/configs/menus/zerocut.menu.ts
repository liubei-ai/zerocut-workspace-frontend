const zerocutMenu = [
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
  key: 'menu.membership',
  link: '/membership',
  icon: 'mdi-account-check-outline',
});

if (import.meta.env.VITE_MEMBER_PRICE_ENABLE === 'true') {
  zerocutMenu.push({
    key: 'menu.pricing',
    link: '/bagelpay/products',
    icon: 'mdi-shopping-outline',
  });
}

export default zerocutMenu;
