<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { computed } from 'vue';

interface Props {
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain';
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large';
  color?: string;
  icon?: string;
  text?: string;
  block?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  size: 'default',
  color: 'primary',
  icon: 'mdi-video-plus',
  text: '进入Studio',
  block: false,
  class: '',
});

const workspaceStore = useWorkspaceStore();

// 构建Studio URL，包含当前工作空间的重定向参数
const studioUrl = computed(() => {
  const baseUrl = 'https://studio.zerocut.cn/auth/authing';
  const redirectPath = '/projects';

  // 如果有当前工作空间，可以在URL中包含工作空间信息
  if (workspaceStore.currentWorkspace) {
    return `${baseUrl}?redirect=${redirectPath}&workspace=${workspaceStore.currentWorkspace.workspaceId}`;
  }

  return `${baseUrl}?redirect=${redirectPath}`;
});

// 处理跳转到Studio
const handleLaunchStudio = () => {
  // 在新标签页中打开Studio
  window.open(studioUrl.value, '_blank', 'noopener,noreferrer');
};
</script>

<template>
  <v-btn
    :variant="variant"
    :size="size"
    :color="color"
    :block="block"
    :class="['studio-launch-btn', props.class]"
    :prepend-icon="icon"
    @click="handleLaunchStudio"
  >
    {{ text }}
  </v-btn>
</template>

<style scoped lang="scss">
.studio-launch-btn {
  font-weight: 600;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
  }

  transition: all 0.2s ease-in-out;
}
</style>
