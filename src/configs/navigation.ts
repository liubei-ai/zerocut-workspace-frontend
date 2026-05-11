import { Permission } from '@/constants/permissions';

import menuAdmin from './menus/admin.menu';
import menuStudio from './menus/studio.menu';
import menuZeroCut from './menus/zerocut.menu';

interface MenuItem {
  key: string;
  permission?: string;
  [k: string]: unknown;
}

interface MenuGroup {
  key: string;
  items: MenuItem[];
}

// 生产环境菜单（只包含 zerocut）
const productionMenus: MenuGroup[] = [
  {
    key: 'menu.zerocut',
    items: menuStudio,
  },
  {
    key: 'menu.plansAndBilling',
    items: menuZeroCut,
  },
];

interface PermissionAware {
  hasPermission(perm: string | string[]): boolean;
}

/**
 * 根据用户权限生成侧栏菜单：
 *  - admin 组只在用户拥有 ADMIN_ACCESS 时插入
 *  - admin 子项各自的 permission 字段进一步过滤
 *  - 子项被全部过滤掉的组一并隐藏
 */
export function generateNavigation(userStore: PermissionAware): { menu: MenuGroup[] } {
  const baseMenus: MenuGroup[] = productionMenus.map(group => ({
    ...group,
    items: group.items.filter(item => !item.permission || userStore.hasPermission(item.permission)),
  }));

  if (userStore.hasPermission(Permission.ADMIN_ACCESS)) {
    const adminGroup: MenuGroup = {
      key: 'menu.admin',
      items: menuAdmin.filter(item => !item.permission || userStore.hasPermission(item.permission)),
    };
    if (adminGroup.items.length > 0) {
      const plansAndBillingIndex = baseMenus.findIndex(g => g.key === 'menu.plansAndBilling');
      const zerocutIndex = baseMenus.findIndex(g => g.key === 'menu.zerocut');
      const insertIndex = plansAndBillingIndex !== -1 ? plansAndBillingIndex : zerocutIndex;
      if (insertIndex !== -1) baseMenus.splice(insertIndex + 1, 0, adminGroup);
      else baseMenus.push(adminGroup);
    }
  }

  return {
    menu: baseMenus.filter(group => group.items.length > 0),
  };
}

// 默认导出（向后兼容）— 不含权限过滤
export default {
  menu: productionMenus,
};
