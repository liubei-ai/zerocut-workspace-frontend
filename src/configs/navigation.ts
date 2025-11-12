import menuAdmin from './menus/admin.menu';
import menuCharts from './menus/charts.menu';
import menuLanding from './menus/landing.menu';
import menuPages from './menus/pages.menu';
import menuUI from './menus/ui.menu';
import menuZeroCut from './menus/zerocut.menu';

// 开发环境模版菜单
const developmentMenus = [
  {
    text: 'Landing',
    key: 'menu.landing',
    items: menuLanding,
  },
  {
    text: 'UI - Theme Preview',
    key: 'menu.uiPreview',
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

// 生成动态菜单的函数
export function generateNavigation(isSuperAdmin = false) {
  const baseMenus = [
    ...productionMenus,
    // 开发环境下显示模版菜单
    ...(import.meta.env.DEV ? developmentMenus : []),
  ];

  // 如果用户是超级管理员，在 zerocut 菜单后面添加管理员菜单
  if (isSuperAdmin) {
    // 找到 zerocut 菜单的位置，在其后插入管理员菜单
    const zerocutIndex = baseMenus.findIndex(menu => menu.key === 'menu.zerocut');
    if (zerocutIndex !== -1) {
      baseMenus.splice(zerocutIndex + 1, 0, {
        text: 'Admin',
        key: 'menu.admin',
        items: menuAdmin,
      });
    } else {
      // 如果没找到 zerocut 菜单，就添加到最后
      baseMenus.push({
        text: 'Admin',
        key: 'menu.admin',
        items: menuAdmin,
      });
    }
  }

  return {
    menu: baseMenus,
  };
}

// 默认导出（向后兼容）
export default {
  menu: [
    ...productionMenus,
    // 开发环境下显示模版菜单
    ...(import.meta.env.DEV ? developmentMenus : []),
  ],
};
