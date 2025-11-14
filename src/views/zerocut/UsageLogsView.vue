<script setup lang="ts">
import { getConsumptionRecords } from '@/api/workspaceApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ConsumptionRecord } from '@/types/api';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

// 服务类型选项（本地化）
const serviceOptions = [
  { value: '', title: t('zerocut.usage.service.all') },
  { value: 'video_generation', title: t('zerocut.usage.service.video') },
  { value: 'image_generation', title: t('zerocut.usage.service.image') },
  { value: 'audio_generation', title: t('zerocut.usage.service.audio') },
  { value: 'text_generation', title: t('zerocut.usage.service.text') },
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
    // 统一错误提示本地化
    error.value = (err as any).message || t('zerocut.usage.errors.fetchFail');
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
    error.value = t('zerocut.usage.errors.invalidDateRange');
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
  <div>
    <ResponsivePageHeader :title="t('zerocut.usage.title')">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">{{ t('zerocut.usage.subtitle') }}</p>
      </template>
    </ResponsivePageHeader>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        {{ t('zerocut.usage.filters.title') }}
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange[0]"
              :label="t('zerocut.usage.filters.startDate')"
              type="date"
              prepend-inner-icon="mdi-calendar"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange[1]"
              :label="t('zerocut.usage.filters.endDate')"
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
              {{ t('common.search') }}
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="handleReset"
              :disabled="loading"
            >
              {{ t('common.reset') }}
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
        {{ t('zerocut.usage.table.title') }}
      </v-card-title>

      <v-data-table-server
        :headers="[
          { title: t('zerocut.usage.table.columns.time'), key: 'createdAt', sortable: true },
          {
            title: t('zerocut.usage.table.columns.serviceType'),
            key: 'serviceType',
            sortable: true,
          },
          {
            title: t('zerocut.usage.table.columns.creditsAmount'),
            key: 'creditsAmount',
            sortable: true,
          },
          {
            title: t('zerocut.usage.table.columns.reason'),
            key: 'serviceDetails',
            sortable: false,
          },
          {
            title: t('zerocut.usage.table.columns.transactionId'),
            key: 'transactionId',
            sortable: false,
          },
          { title: t('zerocut.usage.table.columns.apiKeyId'), key: 'apiKeyId', sortable: false },
          // { title: t('zerocut.usage.table.columns.actions'), key: 'actions', sortable: false },
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
            {{ item.serviceDetails?.reason || t('common.unknown') }}
          </div>
        </template>

        <template #item.apiKeyId="{ item }">
          <code class="text-caption">{{ item.apiKeyId || t('common.unknown') }}</code>
        </template>

        <!-- 空状态 -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-file-document-outline
            </v-icon>
            <div class="text-h6 text-grey-darken-1 mb-2">{{ t('zerocut.usage.empty.title') }}</div>
            <div class="text-body-2 text-grey">
              {{
                error
                  ? t('zerocut.usage.empty.subtitle.failed')
                  : t('zerocut.usage.empty.subtitle.noResult')
              }}
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
// i18n const { t } = useI18n();
