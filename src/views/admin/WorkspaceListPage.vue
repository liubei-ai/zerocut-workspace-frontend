<script setup lang="ts">
import type { QueryWorkspacesParams, RechargeResponse, WorkspaceListItem } from '@/api/adminApi';
import { createRecharge, getWorkspaceList } from '@/api/adminApi';
import RechargeDialog from '@/components/admin/RechargeDialog.vue';
import RechargeResultDialog from '@/components/admin/RechargeResultDialog.vue';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';

// 响应式数据
const loading = ref(false);
const rechargeLoading = ref(false);
const workspaces = ref<WorkspaceListItem[]>([]);
const rechargeDialogOpen = ref(false);
const selectedWorkspace = ref<WorkspaceListItem | null>(null);
const rechargeResultDialogOpen = ref(false);
const rechargeResult = ref<RechargeResponse | null>(null);

// 分页信息
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// 搜索过滤器
const searchFilters = ref<QueryWorkspacesParams>({
  email: '',
  name: '',
});

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// 表格头部配置
const headers = [
  { title: '工作空间', key: 'name', sortable: false, width: '200px' },
  { title: '所有者', key: 'owner', sortable: false, width: '200px' },
  {
    title: '积分余额',
    key: 'creditsBalance',
    sortable: false,
    width: '120px',
    align: 'end' as const,
  },
  {
    title: '成员数量',
    key: 'memberCount',
    sortable: false,
    width: '100px',
    align: 'center' as const,
  },
  { title: '创建时间', key: 'createdAt', sortable: false, width: '120px' },
  { title: '操作', key: 'actions', sortable: false, width: '100px', align: 'center' as const },
];

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 获取工作空间列表
const fetchWorkspaces = async () => {
  try {
    loading.value = true;
    const params: QueryWorkspacesParams = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...searchFilters.value,
    };
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (
        params[key as keyof QueryWorkspacesParams] === '' ||
        params[key as keyof QueryWorkspacesParams] === undefined
      ) {
        delete params[key as keyof QueryWorkspacesParams];
      }
    });
    const response = await getWorkspaceList(params);
    workspaces.value = response.list;
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error('获取工作空间列表失败:', error);
    showSnackbar('获取工作空间列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1;
  fetchWorkspaces();
};

// 防抖搜索
const debouncedSearch = useDebounceFn(handleSearch, 500);

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchWorkspaces();
};

// 处理每页条数变化
const handleItemsPerPageChange = (itemsPerPage: number) => {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1;
  fetchWorkspaces();
};

// 刷新列表
const refreshList = () => {
  fetchWorkspaces();
};

// 打开充值弹窗
const openRechargeDialog = (workspace: WorkspaceListItem) => {
  selectedWorkspace.value = workspace;
  rechargeDialogOpen.value = true;
};

// 处理充值
const handleRecharge = async (data: {
  amount: number;
  paymentMethod: 'manual' | 'give';
  thirdPartyOrderNo?: string;
}) => {
  if (!selectedWorkspace.value) return;

  try {
    rechargeLoading.value = true;

    const rechargeData = {
      workspaceId: selectedWorkspace.value.workspaceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      thirdPartyOrderNo: data.thirdPartyOrderNo,
    };

    const result = await createRecharge(rechargeData);

    // 保存充值结果并显示结果弹窗
    rechargeResult.value = {
      ...result,
      workspaceId: selectedWorkspace.value.workspaceId,
    };
    rechargeResultDialogOpen.value = true;

    // 关闭充值弹窗
    rechargeDialogOpen.value = false;

    // 刷新列表
    await fetchWorkspaces();
  } catch (error) {
    console.error('充值失败:', error);
    const errorMessage = error?.response?.data?.message || '充值失败，请重试';
    showSnackbar(errorMessage, 'error');
  } finally {
    rechargeLoading.value = false;
  }
};

// 统计数据
const stats = computed(() => ({
  total: pagination.value.total,
  active: workspaces.value.filter(w => w.isActive).length,
  totalMembers: workspaces.value.reduce((sum, w) => sum + w.memberCount, 0),
  totalCredits: workspaces.value.reduce((sum, w) => sum + w.creditsBalance, 0),
}));

// 处理充值结果弹窗关闭
const handleRechargeResultClose = () => {
  rechargeResultDialogOpen.value = false;
  rechargeResult.value = null;
  selectedWorkspace.value = null;
};

// 显示提示信息
const showSnackbar = (
  message: string,
  color: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

// 组件挂载时获取数据
onMounted(() => {
  fetchWorkspaces();
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">工作空间管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">管理所有工作空间和充值操作</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="refreshList"
          :loading="loading"
        >
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2">mdi-domain</v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.total }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总工作空间</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 搜索过滤器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        搜索过滤
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchFilters.email"
              label="用户邮箱"
              placeholder="搜索用户邮箱"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-email"
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchFilters.name"
              label="工作空间名称"
              placeholder="搜索工作空间名称"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-domain"
              @input="debouncedSearch"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 工作空间列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        工作空间列表
      </v-card-title>

      <v-data-table-server
        :headers="headers"
        :items="workspaces"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :items-length="pagination.total"
        :server-items-length="pagination.total"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
        class="elevation-0"
      >
        <!-- 工作空间名称 -->
        <template #item.name="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">ID: {{ item.workspaceId }}</div>
          </div>
        </template>

        <!-- 所有者信息 -->
        <template #item.owner="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="mr-2">
              <v-icon icon="mdi-account" size="16"></v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium text-body-2">{{ item.ownerUsername }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.ownerEmail }}
              </div>
            </div>
          </div>
        </template>

        <!-- 积分余额 -->
        <template #item.creditsBalance="{ item }">
          <div class="text-right">
            <span class="font-weight-medium">{{ item.creditsBalance }}</span>
            <span class="text-caption ml-1">积分</span>
          </div>
        </template>

        <!-- 成员数量 -->
        <template #item.memberCount="{ item }">
          <div class="text-center">
            <v-chip variant="outlined" size="small"> {{ item.memberCount }} 人 </v-chip>
          </div>
        </template>

        <!-- 创建时间 -->
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <!-- 操作按钮 -->
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            @click="openRechargeDialog(item)"
            :loading="rechargeLoading"
            prepend-icon="mdi-cash-plus"
          >
            充值
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 充值弹窗 -->
    <RechargeDialog
      v-model:open="rechargeDialogOpen"
      :workspace="selectedWorkspace"
      :loading="rechargeLoading"
      @confirm="handleRecharge"
    />

    <!-- 充值结果弹窗 -->
    <RechargeResultDialog
      v-model:open="rechargeResultDialogOpen"
      :result="rechargeResult"
      :workspace="selectedWorkspace"
      @close="handleRechargeResultClose"
    />

    <!-- 结果提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="5000" location="top">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> 关闭 </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

.v-data-table {
  border-radius: 8px;
}
</style>
