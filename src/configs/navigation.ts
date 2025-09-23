import menuAi from './menus/ai.menu';
import menuApps from './menus/apps.menu';
import menuCharts from './menus/charts.menu';
import menuData from './menus/data.menu';
import menuLanding from './menus/landing.menu';
import menuPages from './menus/pages.menu';
import menuUI from './menus/ui.menu';
import menuUML from './menus/uml.menu';
import menuZeroCut from './menus/zerocut.menu';

// 开发环境模版菜单
const developmentMenus = [
  // {
  //   text: 'dashboard',
  //   key: 'menu.dashboard',
  //   items: [
  //     {
  //       key: 'menu.dashboard',
  //       text: 'Dashboard',
  //       link: '/demo/dashboard',
  //       icon: 'mdi-view-dashboard-outline',
  //     },
  //   ],
  // },
  {
    text: 'chatgpt',
    items: menuAi,
  },
  {
    text: 'Landing',
    items: menuLanding,
  },
  {
    text: 'UI - Theme Preview',
    items: menuUI,
  },
  {
    text: 'Pages',
    key: 'menu.pages',
    items: menuPages,
  },
  {
    text: 'Apps',
    items: menuApps,
  },
  {
    text: 'Data',
    items: menuData,
  },
  {
    text: 'Charts',
    key: 'menu.charts',
    items: menuCharts,
  },
  {
    text: 'UML',
    key: 'menu.uml',
    items: menuUML,
  },
];

// 生产环境菜单（只包含zerocut）
const productionMenus = [
  {
    text: 'zerocut',
    key: 'menu.zerocut',
    items: menuZeroCut,
  },
];

export default {
  menu: [
    ...productionMenus,
    // 开发环境下显示模版菜单
    ...(import.meta.env.DEV ? developmentMenus : []),
  ],
};
