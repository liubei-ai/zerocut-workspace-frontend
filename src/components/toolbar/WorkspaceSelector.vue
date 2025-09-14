<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { UserWorkspaceDto } from '@/types/api';
import { computed, onMounted, ref } from 'vue';

const workspaceStore = useWorkspaceStore();
const menuOpen = ref(false);

// 计算属性
const currentWorkspace = computed(() => workspaceStore.currentWorkspace);
const workspaces = computed(() => workspaceStore.activeWorkspaces);
const loading = computed(() => workspaceStore.loading);
const error = computed(() => workspaceStore.error);

// 显示的工作空间名称（截断长名称）
const displayName = computed(() => {
  if (!currentWorkspace.value) return '选择工作空间';
  const name = currentWorkspace.value.name;
  return name.length > 15 ? name.substring(0, 15) + '...' : name;
});

// 处理工作空间切换
const handleWorkspaceSelect = (workspace: UserWorkspaceDto) => {
  workspaceStore.switchWorkspace(workspace);
  menuOpen.value = false;
};

// 重新加载工作空间
const handleRefresh = () => {
  workspaceStore.loadWorkspaces();
};

// 组件挂载时加载数据
onMounted(() => {
  if (workspaces.value.length === 0) {
    workspaceStore.loadWorkspaces();
  }
});
</script>

<template>
  <div class="workspace-selector">
    <!-- 工作空间选择按钮 -->
    <v-menu
      v-model="menuOpen"
      :close-on-content-click="false"
      location="bottom start"
      offset="8"
      min-width="280"
      max-width="320"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="workspace-btn"
          :loading="loading"
          :disabled="loading"
        >
          <div class="d-flex align-center">
            <!-- 工作空间图标 -->
            <v-icon class="mr-2" size="20">
              {{ currentWorkspace ? 'mdi-domain' : 'mdi-domain-plus' }}
            </v-icon>

            <!-- 工作空间名称 -->
            <span class="workspace-name text-body-2">
              {{ displayName }}
            </span>

            <!-- 下拉箭头 -->
            <v-icon class="ml-1" size="16">
              {{ menuOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </div>
        </v-btn>
      </template>

      <!-- 下拉菜单内容 -->
      <v-card>
        <!-- 菜单头部 -->
        <v-card-title class="d-flex align-center justify-space-between pa-3">
          <span class="text-subtitle-2">选择工作空间</span>
          <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            @click="handleRefresh"
            :loading="loading"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <!-- 错误提示 -->
        <v-alert v-if="error" type="error" variant="tonal" class="ma-3" density="compact">
          {{ error }}
          <template v-slot:append>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="workspaceStore.clearError()"
            ></v-btn>
          </template>
        </v-alert>

        <!-- 加载状态 -->
        <div v-if="loading" class="pa-4 text-center">
          <v-progress-circular indeterminate size="24"></v-progress-circular>
          <div class="text-caption mt-2">加载中...</div>
        </div>

        <!-- 工作空间列表 -->
        <v-list v-else-if="workspaces.length > 0" density="compact">
          <v-list-item
            v-for="workspace in workspaces"
            :key="workspace.workspaceId"
            @click="handleWorkspaceSelect(workspace)"
            :active="currentWorkspace?.workspaceId === workspace.workspaceId"
            class="workspace-item"
          >
            <template v-slot:prepend>
              <v-icon color="primary" size="20"> mdi-domain </v-icon>
            </template>

            <v-list-item-title class="text-body-2">
              {{ workspace.name }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              {{ workspace.description || '暂无描述' }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <!-- 当前选中标识 -->
              <v-icon
                v-if="currentWorkspace?.workspaceId === workspace.workspaceId"
                color="primary"
                size="16"
              >
                mdi-check
              </v-icon>

              <!-- 角色标识 -->
              <v-chip
                v-else
                :color="workspace.currentUserRole === 'owner' ? 'primary' : 'default'"
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                {{ workspace.currentUserRole === 'owner' ? '拥有者' : '成员' }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <!-- 空状态 -->
        <div v-else class="pa-4 text-center">
          <v-icon size="48" color="grey-lighten-1" class="mb-2"> mdi-domain-off </v-icon>
          <div class="text-body-2 text-grey-darken-1">暂无可用工作空间</div>
          <div class="text-caption text-grey">请联系管理员添加您到工作空间</div>
        </div>

        <!-- 菜单底部 -->
        <v-divider></v-divider>
        <v-card-actions class="pa-2">
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-cog"
            @click="menuOpen = false"
            to="/workspace/settings"
          >
            工作空间设置
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" size="small" @click="menuOpen = false"> 关闭 </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<style scoped lang="scss">
.workspace-selector {
  .workspace-btn {
    text-transform: none;
    font-weight: normal;

    .workspace-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .workspace-item {
    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.04);
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .workspace-selector {
    .workspace-btn {
      .workspace-name {
        max-width: 80px;
      }
    }
  }
}
</style>
