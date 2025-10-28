<script setup lang="ts">
import MainMenu from '@/components/navigation/MainMenu.vue';
import WorkspaceSelector from '@/components/toolbar/WorkspaceSelector.vue';
import { generateNavigation } from '@/configs/navigation';
import { useCustomizeThemeStore } from '@/stores/customizeTheme';
import { useUserStore } from '@/stores/userStore';

const customizeTheme = useCustomizeThemeStore();
const userStore = useUserStore();

// 动态菜单配置
const navigation = computed(() => {
  return generateNavigation(userStore.isSuperAdmin);
});

onMounted(async () => {
  scrollToBottom();

  // 加载用户信息以确保角色信息可用
  if (!userStore.userInfo) {
    await userStore.loadUserInfo();
  }
});

const scrollToBottom = () => {
  const contentArea = document.querySelector('.v-navigation-drawer__content');
  const activeItem = document.querySelector('.v-list-item--active') as HTMLElement;

  setTimeout(() => {
    contentArea?.scrollTo({
      top: activeItem?.offsetTop,
    });
  }, 100);
};
</script>

<template>
  <v-navigation-drawer elevation="1" v-model="customizeTheme.mainSidebar" id="mainMenu">
    <!-- ---------------------------------------------- -->
    <!---Top Area -->
    <!-- ---------------------------------------------- -->
    <template v-if="!customizeTheme.miniSidebar" v-slot:prepend>
      <div class="workspace-selector-container">
        <WorkspaceSelector />
      </div>
    </template>

    <!-- ---------------------------------------------- -->
    <!---Nav List -->
    <!-- ---------------------------------------------- -->
    <div class="main-menu">
      <MainMenu :menu="navigation.menu"></MainMenu>
    </div>
    <!-- ---------------------------------------------- -->
    <!---Bottom Area -->
    <!-- ---------------------------------------------- -->
    <template v-if="!customizeTheme.miniSidebar" v-slot:append></template>
  </v-navigation-drawer>
</template>

<style scoped lang="scss">
.gradient-card {
  background: linear-gradient(
    270deg,
    rgba(var(--v-theme-primary), 0.7) 0,
    rgb(var(--v-theme-primary)) 100%
  );
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.3);
}

.workspace-selector-container {
  padding: 16px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);

  :deep(.workspace-selector) {
    width: 100%;

    .workspace-btn {
      width: 100%;
      justify-content: flex-start;
      padding: 12px 16px;
      min-height: 48px;
      border-radius: 8px;
      background-color: rgba(var(--v-theme-surface-variant), 0.3);

      &:hover {
        background-color: rgba(var(--v-theme-primary), 0.08);
      }

      .workspace-name {
        max-width: 140px;
        font-weight: 500;
      }
    }
  }
}
</style>
