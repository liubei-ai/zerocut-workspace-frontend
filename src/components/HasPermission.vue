<script setup lang="ts">
import { computed } from 'vue';

import type { Permission } from '@/constants/permissions';

import { useUserStore } from '@/stores/userStore';

/**
 * 模块级权限包装组件。命中权限时渲染默认插槽；
 * 未命中渲染 `fallback` 插槽（可放占位 / 联系管理员提示）。
 *
 * 用法：
 *   <HasPermission :permission="Permission.WALLET_GRANT">
 *     <CreditGrantPanel />
 *     <template #fallback>
 *       <el-tag type="info">联系财务发放积分</el-tag>
 *     </template>
 *   </HasPermission>
 *
 * any=true 切换为 OR 语义；省略时为 AND。
 */
const props = defineProps<{
  permission: Permission | Permission[] | string | string[];
  any?: boolean;
}>();

const userStore = useUserStore();

const allowed = computed(() => {
  const list = Array.isArray(props.permission) ? props.permission : [props.permission];
  return props.any ? userStore.hasAnyPermission(list) : userStore.hasPermission(list);
});
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
