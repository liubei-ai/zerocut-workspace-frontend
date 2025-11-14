<script setup lang="ts">
import type {
  CreateSystemConfigParams,
  QuerySystemConfigParams,
  SystemConfigEnumsResponse,
  SystemConfigItem,
  UpdateSystemConfigParams,
} from '@/api/adminApi';
import {
  createSystemConfig,
  deleteSystemConfig,
  getSystemConfigEnums,
  getSystemConfigList,
  updateSystemConfig,
} from '@/api/adminApi';
import SystemConfigDialog from '@/components/admin/SystemConfigDialog.vue';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';

// 响应式数据
const loading = ref(false);
const configs = ref<SystemConfigItem[]>([]);
const configDialogOpen = ref(false);
const selectedConfig = ref<SystemConfigItem | null>(null);
const deleteDialogOpen = ref(false);
const configToDelete = ref<SystemConfigItem | null>(null);

// 枚举数据
const enums = ref<SystemConfigEnumsResponse>({
  valueTypes: [],
  categories: [],
});
const enumsLoading = ref(false);

// 弹窗状态
const dialogVisible = ref(false);
const editingConfig = ref<SystemConfigItem | null>(null);

// 数据统计信息
const dataStats = ref({
  total: 0,
  categoryStats: {} as Record<string, number>,
});

// 搜索过滤器
const searchFilters = ref<QuerySystemConfigParams>({
  configKey: '',
  name: '',
  category: '',
  isEditable: undefined,
});

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// 统计信息
const stats = computed(() => {
  const configList = configs.value || [];
  return {
    total: dataStats.value.total,
    editable: configList.filter(c => c.isEditable).length,
    readonly: configList.filter(c => !c.isEditable).length,
  };
});

// 表格头部配置
const headers = [
  { title: '配置键', key: 'configKey', sortable: false, width: '200px' },
  { title: '配置名称', key: 'name', sortable: false, width: '180px' },
  { title: '配置值', key: 'configValue', sortable: false, width: '200px' },
  { title: '值类型', key: 'valueType', sortable: false, width: '100px' },
  { title: '配置分类', key: 'category', sortable: false, width: '120px' },
  { title: '可编辑', key: 'isEditable', sortable: false, width: '100px' },
  { title: '更新时间', key: 'updatedAt', sortable: false, width: '160px' },
  { title: '操作', key: 'actions', sortable: false, width: '120px', align: 'center' as const },
];

// 可编辑状态选项
const editableOptions = [
  { title: '全部', value: undefined },
  { title: '可编辑', value: true },
  { title: '只读', value: false },
];

// 配置分类选项（包含"全部"选项）
const categoryOptions = computed(() => [
  { title: '全部', value: undefined, subtitle: '显示所有分类的配置' },
  ...enums.value.categories.map(item => ({
    title: item.label,
    value: item.value,
    subtitle: item.description,
  })),
]);

// 获取枚举数据
const fetchEnums = async () => {
  try {
    enumsLoading.value = true;
    const response = await getSystemConfigEnums();
    enums.value = response;
  } catch (error) {
    console.error('获取枚举数据失败:', error);
    showSnackbar('获取枚举数据失败', 'error');
  } finally {
    enumsLoading.value = false;
  }
};

// 获取配置列表
const fetchConfigs = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchFilters.value,
    };

    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    console.log('发送请求参数:', params);
    const response = await getSystemConfigList(params);
    console.log('接收到响应:', response);
    configs.value = response.configs;
    console.log('设置configs.value:', configs.value);
    dataStats.value = {
      total: response.total,
      categoryStats: response.categoryStats || {},
    };
    console.log('设置dataStats.value:', dataStats.value);
  } catch (error) {
    console.error('获取系统配置列表失败:', error);
    showSnackbar('获取系统配置列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  fetchConfigs();
};

// 防抖搜索
const debouncedSearch = useDebounceFn(handleSearch, 500);

// 刷新列表
const refreshList = () => {
  fetchConfigs();
};

// 打开新建配置弹窗
const openCreateDialog = () => {
  selectedConfig.value = null;
  configDialogOpen.value = true;
};

// 打开编辑配置弹窗
const openEditDialog = (config: SystemConfigItem) => {
  selectedConfig.value = config;
  configDialogOpen.value = true;
};

// 处理配置保存
const handleConfigSave = async (data: CreateSystemConfigParams | UpdateSystemConfigParams) => {
  try {
    if (selectedConfig.value) {
      // 编辑模式
      await updateSystemConfig(selectedConfig.value.configKey, data as UpdateSystemConfigParams);
      showSnackbar('配置更新成功', 'success');
    } else {
      // 新建模式
      await createSystemConfig(data as CreateSystemConfigParams);
      showSnackbar('配置创建成功', 'success');
    }

    configDialogOpen.value = false;
    refreshList();
  } catch (error) {
    console.error('保存配置失败:', error);
    const message = error.details?.message || '保存配置失败';
    showSnackbar(message, 'error');
  }
};

// 打开删除确认弹窗
const openDeleteDialog = (config: SystemConfigItem) => {
  configToDelete.value = config;
  deleteDialogOpen.value = true;
};

// 确认删除配置
const confirmDelete = async () => {
  if (!configToDelete.value) return;

  try {
    await deleteSystemConfig(configToDelete.value.configKey);
    showSnackbar('配置删除成功', 'success');
    deleteDialogOpen.value = false;
    refreshList();
  } catch (error: any) {
    console.error('删除配置失败:', error);
    const message = error.response?.data?.message || '删除配置失败';
    showSnackbar(message, 'error');
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

// 格式化配置值显示
const formatConfigValue = (value: string, type: string) => {
  if (!value) return '-';

  if (value.length > 50) {
    return value.substring(0, 50) + '...';
  }

  return value;
};

// 获取分类颜色
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'SYSTEM':
      return 'error';
    case 'SECURITY':
      return 'warning';
    case 'FEATURE':
      return 'info';
    case 'UI':
      return 'success';
    default:
      return 'primary';
  }
};

// 获取值类型颜色
const getValueTypeColor = (type: string) => {
  switch (type) {
    case 'STRING':
      return 'primary';
    case 'NUMBER':
    case 'DECIMAL':
      return 'success';
    case 'BOOLEAN':
      return 'warning';
    case 'JSON':
    case 'ARRAY':
      return 'info';
    default:
      return 'default';
  }
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

// 保存配置
const handleSaveConfig = async (data: CreateSystemConfigParams | UpdateSystemConfigParams) => {
  try {
    if (editingConfig.value) {
      // 编辑模式
      await updateSystemConfig(editingConfig.value.configKey, data as UpdateSystemConfigParams);
    } else {
      // 新建模式
      await createSystemConfig(data as CreateSystemConfigParams);
    }

    dialogVisible.value = false;
    await fetchConfigs();
  } catch (error) {
    console.error('保存配置失败:', error);
    throw error; // 让弹窗组件处理错误
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchEnums();
  fetchConfigs();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-bold mb-1 text-2xl sm:text-3xl">系统配置管理</h1>
          <p class="text-medium-emphasis text-sm sm:text-base">管理系统配置参数和权限控制</p>
        </div>
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
            新建配置
          </v-btn>
          <v-btn
            class="!hidden sm:inline-flex"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="refreshList"
            :loading="loading"
          >
            刷新
          </v-btn>
          <v-btn
            class="!hidden sm:inline-flex"
            variant="outlined"
            prepend-icon="mdi-history"
            @click="$router.push({ name: 'admin-system-config-audit' })"
          >
            审计日志
          </v-btn>
          <v-menu class="sm:hidden">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined" icon="mdi-dots-horizontal" size="small" />
            </template>
            <v-list>
              <v-list-item @click="refreshList">
                <v-icon class="mr-2">mdi-refresh</v-icon>
                刷新
              </v-list-item>
              <v-list-item @click="$router.push({ name: 'admin-system-config-audit' })">
                <v-icon class="mr-2">mdi-history</v-icon>
                审计日志
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2">mdi-cog</v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.total }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总配置数</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="success" class="mb-2">mdi-pencil</v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.editable }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">可编辑配置</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="warning" class="mb-2">mdi-lock</v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.readonly }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">只读配置</div>
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
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchFilters.configKey"
              label="配置键"
              placeholder="搜索配置键"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-key"
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchFilters.name"
              label="配置名称"
              placeholder="搜索配置名称"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-tag"
              @input="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="searchFilters.category"
              label="配置分类"
              :items="categoryOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              clearable
              :loading="enumsLoading"
              prepend-inner-icon="mdi-folder"
              @update:model-value="handleSearch"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                  <v-list-item-subtitle v-if="item.raw.subtitle">
                    {{ item.raw.subtitle }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="searchFilters.isEditable"
              label="可编辑状态"
              :items="editableOptions"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="handleSearch"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 配置列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        配置列表
      </v-card-title>

      <v-data-table :headers="headers" :items="configs" :loading="loading" class="elevation-0">
        <!-- 配置键 -->
        <template #item.configKey="{ item }">
          <div class="font-weight-medium text-primary">{{ item.configKey }}</div>
        </template>

        <!-- 配置名称 -->
        <template #item.name="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.name }}</div>
            <div v-if="item.description" class="text-caption text-medium-emphasis">
              {{ item.description }}
            </div>
          </div>
        </template>

        <!-- 配置值 -->
        <template #item.configValue="{ item }">
          <div class="text-body-2">
            <v-tooltip :text="item.configValue" location="top">
              <template #activator="{ props }">
                <span v-bind="props">{{
                  formatConfigValue(item.configValue, item.valueType)
                }}</span>
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- 值类型 -->
        <template #item.valueType="{ item }">
          <v-chip :color="getValueTypeColor(item.valueType)" variant="tonal" size="small">
            {{ item.valueType }}
          </v-chip>
        </template>

        <!-- 分类 -->
        <template #item.category="{ item }">
          <v-chip :color="getCategoryColor(item.category)" variant="tonal" size="small">
            {{ item.category }}
          </v-chip>
        </template>

        <!-- 编辑状态 -->
        <template #item.isEditable="{ item }">
          <v-chip :color="item.isEditable ? 'success' : 'warning'" variant="tonal" size="small">
            {{ item.isEditable ? '可编辑' : '只读' }}
          </v-chip>
        </template>

        <!-- 更新时间 -->
        <template #item.updatedAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.updatedAt) }}</span>
        </template>

        <!-- 操作按钮 -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="openEditDialog(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="openDeleteDialog(item)"
              :disabled="!item.isEditable"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 配置编辑弹窗 -->
    <SystemConfigDialog
      v-model="configDialogOpen"
      :config="selectedConfig"
      @save="handleConfigSave"
    />

    <!-- 删除确认弹窗 -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>
          确定要删除配置 "{{ configToDelete?.name }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 配置编辑弹窗 -->
    <SystemConfigDialog v-model="dialogVisible" :config="editingConfig" @save="handleSaveConfig" />

    <!-- 提示信息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
