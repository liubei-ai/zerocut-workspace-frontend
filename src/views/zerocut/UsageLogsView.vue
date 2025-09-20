<script setup lang="ts">
import { getConsumptionRecords } from '@/api/workspaceApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ConsumptionRecord } from '@/types/api';
import { onMounted, ref } from 'vue';
import { formatDate } from '~/src/utils/date';

// 使用工作空间store
const workspaceStore = useWorkspaceStore();

// 数据状态
const loading = ref(false);
const usageLogs = ref<ConsumptionRecord[]>([]);
const error = ref('');
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

// 筛选选项
const filters = ref({
  dateRange: [],
  serviceType: '',
  apiKeyId: '',
});

// 服务类型选项
const serviceOptions = [
  { value: '', title: '全部服务' },
  { value: 'video_generation', title: '视频生成' },
  { value: 'image_generation', title: '图片生成' },
  { value: 'audio_generation', title: '音频生成' },
  { value: 'text_generation', title: '文本处理' },
];

// 获取数据函数
const fetchConsumptionRecords = async () => {
  try {
    loading.value = true;
    error.value = '';

    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    if (filters.value.serviceType) {
      Object.assign(params, { serviceType: filters.value.serviceType });
    }

    if (filters.value.apiKeyId) {
      Object.assign(params, { apiKeyId: filters.value.apiKeyId });
    }

    // 添加时间范围参数
    if (filters.value.dateRange[0]) {
      Object.assign(params, { startDate: filters.value.dateRange[0] });
    }

    if (filters.value.dateRange[1]) {
      Object.assign(params, { endDate: filters.value.dateRange[1] });
    }

    const workspaceId = workspaceStore.currentWorkspaceId!;
    const response = await getConsumptionRecords(workspaceId, params);
    usageLogs.value = response.list || [];
    pagination.value = {
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 10,
      totalPages: response.totalPages || 0,
    };
  } catch (err) {
    console.error('获取消费记录失败:', err);
    error.value = err.message || '获取数据失败，请稍后重试';
    usageLogs.value = [];
  } finally {
    loading.value = false;
  }
};

// 服务图标
const getServiceIcon = (serviceType: string) => {
  const icons = {
    video: 'mdi-video',
    image: 'mdi-image',
    audio: 'mdi-music',
    text: 'mdi-text',
  };
  return icons[serviceType] || 'mdi-help-circle';
};

// 格式化积分数量
const formatCredits = (amount: number) => {
  return Math.abs(amount).toLocaleString();
};

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchConsumptionRecords();
};

// 处理每页条数变化
const handleItemsPerPageChange = (itemsPerPage: number) => {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1; // 重置到第一页
  fetchConsumptionRecords();
};

// 搜索函数
const handleSearch = () => {
  pagination.value.page = 1; // 重置到第一页
  fetchConsumptionRecords();
};

// 重置筛选条件
const handleReset = () => {
  filters.value = {
    dateRange: [],
    serviceType: '',
    apiKeyId: '',
  };
  pagination.value.page = 1;
  fetchConsumptionRecords();
};

// 验证时间范围
const validateDateRange = () => {
  const [startDate, endDate] = filters.value.dateRange;
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    error.value = '结束日期不能早于开始日期';
    return false;
  }
  error.value = '';
  return true;
};

// 挂载时获取数据
onMounted(() => {
  fetchConsumptionRecords();
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">使用日志</h1>
        <p class="text-subtitle-1 text-medium-emphasis">查看详细的积分使用记录</p>
      </div>
    </div>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        筛选条件
      </v-card-title>
      <v-card-text>
        <v-row>
          <!-- <v-col cols="12" md="3">
            <v-select
              v-model="filters.serviceType"
              :items="serviceOptions"
              item-title="title"
              item-value="value"
              label="服务类型"
              prepend-inner-icon="mdi-cog"
            ></v-select>
          </v-col> -->

          <!-- <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.apiKeyId"
              label="API密钥ID"
              prepend-inner-icon="mdi-key"
              clearable
            ></v-text-field>
          </v-col> -->

          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange[0]"
              label="开始日期"
              type="date"
              prepend-inner-icon="mdi-calendar"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange[1]"
              label="结束日期"
              type="date"
              prepend-inner-icon="mdi-calendar"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6" class="d-flex align-center gap-3">
            <v-btn
              color="primary"
              prepend-icon="mdi-magnify"
              @click="
                () => {
                  if (validateDateRange()) handleSearch();
                }
              "
              :loading="loading"
            >
              搜索
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="handleReset"
              :disabled="loading"
            >
              重置
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 错误提示 -->
    <v-alert v-if="error" type="error" dismissible @click:close="error = ''" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- 使用日志表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        使用记录
      </v-card-title>

      <v-data-table-server
        :headers="[
          { title: '时间', key: 'createdAt', sortable: true },
          { title: '服务类型', key: 'serviceType', sortable: true },
          { title: '消耗数量', key: 'creditsAmount', sortable: true },
          { title: '消耗原因', key: 'serviceDetails', sortable: false },
          { title: '交易ID', key: 'transactionId', sortable: false },
          { title: 'API密钥ID', key: 'apiKeyId', sortable: false },
          // { title: '操作', key: 'actions', sortable: false },
        ]"
        :items="usageLogs"
        item-value="id"
        class="elevation-0"
        :loading="loading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @update:items-per-page="handleItemsPerPageChange"
        @update:page="handlePageChange"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.serviceType="{ item }">
          <div class="d-flex align-center">
            <v-icon :icon="getServiceIcon(item.serviceType || '')" size="20" class="mr-2"></v-icon>
            {{ serviceOptions.find(s => s.value === item.serviceType)?.title || item.serviceType }}
          </div>
        </template>

        <template #item.creditsAmount="{ item }">
          <span class="text-error font-weight-medium"
            >-{{ formatCredits(item.creditsAmount) }}</span
          >
        </template>

        <template #item.serviceDetails="{ item }">
          <div class="d-flex align-center">
            {{ item.serviceDetails?.reason || 'unknown' }}
          </div>
        </template>

        <template #item.apiKeyId="{ item }">
          <code class="text-caption">{{ item.apiKeyId || '未知' }}</code>
        </template>

        <!-- 空状态 -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-file-document-outline
            </v-icon>
            <div class="text-h6 text-grey-darken-1 mb-2">暂无使用记录</div>
            <div class="text-body-2 text-grey">
              {{ error ? '数据加载失败' : '当前筛选条件下没有找到相关记录' }}
            </div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>
