<script setup lang="ts">
import type { QueryAuditLogParams, SystemConfigAuditItem } from '@/api/adminApi';
import { getSystemConfigAuditLogs } from '@/api/adminApi';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';

// 响应式数据
const loading = ref(false);
const auditLogs = ref<SystemConfigAuditItem[]>([]);
const searchConfigKey = ref('');
const selectedAction = ref('');
const selectedOperatorType = ref('');
const dateRange = ref<[string, string] | null>(null);

// 分页参数
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// 搜索过滤条件
const searchFilters = computed(() => ({
  configKey: searchConfigKey.value || undefined,
  action: selectedAction.value || undefined,
  operatorType: selectedOperatorType.value || undefined,
  startDate: dateRange.value?.[0] || undefined,
  endDate: dateRange.value?.[1] || undefined,
}));

// 操作类型选项
const actionOptions = [
  { title: '全部', value: '' },
  { title: '查看', value: 'view' },
  { title: '创建', value: 'create' },
  { title: '更新', value: 'update' },
  { title: '删除', value: 'delete' },
];

// 操作者类型选项
const operatorTypeOptions = [
  { title: '全部', value: '' },
  { title: '管理员', value: 'admin' },
  { title: '机器人', value: 'bot' },
  { title: '系统', value: 'system' },
];

// 获取审计日志列表
const fetchAuditLogs = async () => {
  try {
    loading.value = true;
    const params: QueryAuditLogParams = {
      ...searchFilters.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getSystemConfigAuditLogs(params);
    auditLogs.value = response.list;
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error('获取审计日志失败:', error);
    showSnackbar('获取审计日志失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1;
  fetchAuditLogs();
};

// 防抖搜索
const debouncedSearch = useDebounceFn(handleSearch, 500);

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchAuditLogs();
};

// 处理每页条数变化
const handleItemsPerPageChange = (itemsPerPage: number) => {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1;
  fetchAuditLogs();
};

// 重置搜索条件
const resetSearch = () => {
  searchConfigKey.value = '';
  selectedAction.value = '';
  selectedOperatorType.value = '';
  dateRange.value = null;
  pagination.value.page = 1;
  fetchAuditLogs();
};

// 显示提示信息
const showSnackbar = (message: string, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

// 格式化操作类型
const formatAction = (action: string) => {
  const actionMap: Record<string, string> = {
    VIEW: '查看',
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
  };
  return actionMap[action] || action;
};

// 格式化操作者类型
const formatOperatorType = (type: string) => {
  const typeMap: Record<string, string> = {
    admin: '管理员',
    bot: '机器人',
    system: '系统',
  };
  return typeMap[type] || type;
};

// 获取操作类型颜色
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    VIEW: 'blue',
    CREATE: 'green',
    UPDATE: 'orange',
    DELETE: 'red',
  };
  return colorMap[action] || 'grey';
};

// 获取操作者类型颜色
const getOperatorTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    admin: 'purple',
    bot: 'teal',
    system: 'indigo',
  };
  return colorMap[type] || 'grey';
};

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 格式化变更字段
const formatChangedFields = (fields: string[] | null | undefined) => {
  if (!fields || fields.length === 0) return '-';
  return fields.join(', ');
};

// 查看审计详情
const viewAuditDetail = (auditLog: SystemConfigAuditItem) => {
  // TODO: 实现审计详情查看功能
  console.log('查看审计详情:', auditLog);
  showSnackbar('审计详情功能待实现', 'info');
};

// 组件挂载时获取数据
onMounted(() => {
  fetchAuditLogs();
});
</script>

<template>
  <div class="system-config-audit-page">
    <!-- 页面标题 -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">系统配置审计日志</h1>
        <p class="text-body-1 text-medium-emphasis">查看系统配置的变更历史记录和操作日志</p>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row>
          <!-- 关键词搜索 -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchConfigKey"
              label="搜索配置键"
              placeholder="输入配置键"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-magnify"
              clearable
              @input="debouncedSearch"
            />
          </v-col>

          <!-- 操作类型筛选 -->
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedAction"
              label="操作类型"
              :items="actionOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="handleSearch"
            />
          </v-col>

          <!-- 操作者类型筛选 -->
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedOperatorType"
              label="操作者类型"
              :items="operatorTypeOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="handleSearch"
            />
          </v-col>

          <!-- 日期范围筛选 -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="dateRange"
              label="日期范围"
              placeholder="选择日期范围"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar-range"
              readonly
              clearable
              @click:clear="
                dateRange = null;
                handleSearch();
              "
            />
          </v-col>

          <!-- 操作按钮 -->
          <v-col cols="12" md="2">
            <div class="d-flex gap-2">
              <v-btn color="primary" variant="flat" @click="handleSearch" :loading="loading">
                搜索
              </v-btn>
              <v-btn variant="outlined" @click="resetSearch" :disabled="loading"> 重置 </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 审计日志列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-history</v-icon>
        审计日志
        <v-spacer />
        <v-chip v-if="pagination.total > 0" color="primary" variant="outlined" size="small">
          共 {{ pagination.total }} 条记录
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="[
          { title: '配置键', key: 'configKey', sortable: false },
          { title: '操作类型', key: 'action', sortable: false },
          { title: '操作者', key: 'operatorId', sortable: false },
          { title: '操作者类型', key: 'operatorType', sortable: false },
          { title: '变更字段', key: 'changedFields', sortable: false },
          { title: 'IP地址', key: 'ipAddress', sortable: false },
          { title: '操作时间', key: 'createdAt', sortable: false },
          { title: '操作', key: 'actions', sortable: false },
        ]"
        :items="auditLogs"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :items-length="pagination.total"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
        no-data-text="暂无审计日志"
        loading-text="加载中..."
        items-per-page-text="每页显示"
        page-text="{0}-{1} 共 {2} 条"
      >
        <!-- 配置键 -->
        <template #item.configKey="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2" size="small">mdi-key</v-icon>
            <code class="text-caption">{{ item.configKey }}</code>
          </div>
        </template>

        <!-- 操作类型 -->
        <template #item.action="{ item }">
          <v-chip :color="getActionColor(item.action)" variant="flat" size="small">
            {{ formatAction(item.action) }}
          </v-chip>
        </template>

        <!-- 操作者 -->
        <template #item.operatorId="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2" size="small">
              {{ item.operatorType === 'bot' ? 'mdi-robot' : 'mdi-account' }}
            </v-icon>
            <span class="text-body-2">{{ item.operatorName || '-' }}</span>
          </div>
        </template>

        <!-- 操作者类型 -->
        <template #item.operatorType="{ item }">
          <v-chip :color="getOperatorTypeColor(item.operatorType)" variant="outlined" size="small">
            {{ formatOperatorType(item.operatorType) }}
          </v-chip>
        </template>

        <!-- 变更字段 -->
        <template #item.changedFields="{ item }">
          <span class="text-body-2">{{ formatChangedFields(item.changedFields) }}</span>
        </template>

        <!-- IP地址 -->
        <template #item.ipAddress="{ item }">
          <span class="text-body-2">{{ item.ipAddress || '-' }}</span>
        </template>

        <!-- 操作时间 -->
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDateTime(item.createdAt) }}</span>
        </template>

        <!-- 操作 -->
        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" size="small" @click="viewAuditDetail(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- 提示信息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.system-config-audit-page {
  padding: 24px;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}
</style>
