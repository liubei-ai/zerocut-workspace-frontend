import menuAdmin from './menus/admin.menu';
import menuZeroCut from './menus/zerocut.menu';

// 生产环境菜单（只包含zerocut）
const productionMenus = [
  {
    key: 'menu.zerocut',
    items: menuZeroCut,
  },
];

// 生成动态菜单的函数
export function generateNavigation(isSuperAdmin = false) {
  const baseMenus = [...productionMenus];

  // 如果用户是超级管理员，在 zerocut 菜单后面添加管理员菜单
  if (isSuperAdmin) {
    // 找到 zerocut 菜单的位置，在其后插入管理员菜单
    const zerocutIndex = baseMenus.findIndex(menu => menu.key === 'menu.zerocut');
    if (zerocutIndex !== -1) {
      baseMenus.splice(zerocutIndex + 1, 0, {
        key: 'menu.admin',
        items: menuAdmin,
      });
    } else {
      // 如果没找到 zerocut 菜单，就添加到最后
      baseMenus.push({
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
  menu: productionMenus,
};
