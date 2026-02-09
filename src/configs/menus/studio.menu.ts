const studioMenu = [
  {
    key: 'menu.dashboard',
    link: '/dashboard',
    icon: 'mdi-view-dashboard-outline',
  },
  {
    key: 'menu.resourceAdmin',
    link: '/resource-admin',
    icon: 'mdi-folder-multiple-outline',
  },
  {
    key: 'menu.studio',
    link: import.meta.env.VITE_ZEROCUT_STUDIO_PROJECT,
    icon: 'mdi-video-plus',
    external: true,
  },
];

if (import.meta.env.VITE_PRO_GUIDE_ENABLE === 'true') {
  studioMenu.push({
    key: 'menu.guide',
    link: import.meta.env.VITE_ZEROCUT_PRO_URL,
    icon: 'mdi-open-in-new',
    external: true,
  });
}

export default studioMenu;
