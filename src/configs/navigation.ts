import menuCharts from './menus/charts.menu';
import menuLanding from './menus/landing.menu';
import menuPages from './menus/pages.menu';
import menuUI from './menus/ui.menu';
import menuZeroCut from './menus/zerocut.menu';

// 开发环境模版菜单
const developmentMenus = [
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
    text: 'Charts',
    key: 'menu.charts',
    items: menuCharts,
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
