import type { Directive } from 'vue';

import type { Permission } from '@/constants/permissions';

import { useUserStore } from '@/stores/userStore';

type PermissionValue = Permission | Permission[] | string | string[];

/**
 * v-permission：按钮 / 字段级权限指令。
 *
 * 没有权限时直接从 DOM 移除（而不是 display:none），更安全也更干净。
 *
 * 用法：
 *   <el-button v-permission="Permission.WALLET_GRANT">发放积分</el-button>
 *   <el-button v-permission="[Permission.WORKSPACE_READ, Permission.WORKSPACE_WRITE]">编辑</el-button>
 *
 * 需要灰态 + tooltip 提示时不要用本指令，直接组合 :disabled + el-tooltip。
 */
export const vPermission: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    const userStore = useUserStore();
    const list = Array.isArray(binding.value) ? binding.value : [binding.value];
    if (!userStore.hasPermission(list)) {
      el.parentNode?.removeChild(el);
    }
  },
};
