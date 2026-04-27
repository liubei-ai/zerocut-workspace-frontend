<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ApiKey, ConsumptionRecord } from '@/types/api';

import { getApiKeys, getConsumptionRecords } from '@/api/workspaceApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';

// 使用工作空间store
const workspaceStore = useWorkspaceStore();

// 数据状态
const loading = ref(false);
const apiKeysLoading = ref(false);
const usageLogs = ref<ConsumptionRecord[]>([]);
const error = ref('');
const apiKeyOptions = ref<Array<{ title: string; value: string }>>([]);
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

// 筛选选项
const filters = ref({
  dateRange: [],
  apiKeyId: '',
});

const { t } = useI18n();
const detailDialog = ref(false);
const detailDialogTitle = ref('');
const detailDialogContent = ref('');
const PROMPT_PREVIEW_LENGTH = 120;
const URL_PREVIEW_COUNT = 2;

const formatApiKeySuffix = (apiKey: string) => {
  if (!apiKey) return t('common.unknown');
  return apiKey.length > 8 ? apiKey.slice(-8) : apiKey;
};

const formatMaskedApiKey = (apiKey?: string) => {
  if (!apiKey) return t('common.unknown');
  return maskApiKey(apiKey);
};

const getReasonText = (item: ConsumptionRecord): string | undefined => {
  const reason = item.displayDetails?.reason ?? item.serviceDetails?.reason;
  return typeof reason === 'string' && reason.trim() ? reason : undefined;
};

const getPromptText = (item: ConsumptionRecord): string | undefined => {
  const prompt = item.displayDetails?.prompt ?? item.serviceDetails?.prompt;
  return typeof prompt === 'string' && prompt.trim() ? prompt : undefined;
};

const getUrls = (item: ConsumptionRecord): string[] => {
  const raw = item.displayDetails?.urls ?? item.serviceDetails?.urls;
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && !!u.trim()).map(u => u.trim());
};

const truncateText = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
};

const getPromptPreview = (item: ConsumptionRecord): string => {
  const prompt = getPromptText(item);
  return prompt ? truncateText(prompt, PROMPT_PREVIEW_LENGTH) : '';
};

const isPromptLong = (item: ConsumptionRecord): boolean => {
  const prompt = getPromptText(item);
  return !!prompt && prompt.length > PROMPT_PREVIEW_LENGTH;
};

const openFullText = (title: string, content: string) => {
  detailDialogTitle.value = title;
  detailDialogContent.value = content;
  detailDialog.value = true;
};

// 获取数据函数
const fetchConsumptionRecords = async () => {
  try {
    loading.value = true;
    error.value = '';

    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

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

const loadApiKeyOptions = async () => {
  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) return;

  try {
    apiKeysLoading.value = true;
    const keys = await getApiKeys(workspaceId);
    apiKeyOptions.value = keys
      .filter((key: ApiKey) => !!key.apiKeyPrefix)
      .map((key: ApiKey) => ({
        title: `${key.name} (${formatApiKeySuffix(key.apiKeyPrefix)})`,
        value: key.apiKeyPrefix,
      }));
  } catch (err) {
    console.error('获取 API Key 列表失败:', err);
    if (!error.value) {
      error.value = t('zerocut.usage.errors.fetchApiKeysFail');
    }
  } finally {
    apiKeysLoading.value = false;
  }
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
  loadApiKeyOptions();
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

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.apiKeyId"
              :label="t('zerocut.usage.filters.apiKeyId')"
              :placeholder="t('zerocut.usage.filters.apiKeyPlaceholder')"
              :items="apiKeyOptions"
              item-title="title"
              item-value="value"
              :no-data-text="t('zerocut.usage.filters.noApiKeys')"
              prepend-inner-icon="mdi-key-outline"
              clearable
              :loading="apiKeysLoading"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3" class="d-flex align-center gap-3">
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

        <template #item.creditsAmount="{ item }">
          <span class="text-error font-weight-medium"
            >-{{ formatCredits(item.creditsAmount) }}</span
          >
        </template>

        <template #item.serviceDetails="{ item }">
          <div class="service-details-cell">
            <div v-if="getReasonText(item)">
              <span class="detail-label">消耗原因：</span>{{ getReasonText(item) }}
            </div>
            <div v-if="getUrls(item).length > 0" class="mt-1">
              <span class="detail-label">生成物：</span>
              <div
                v-for="(url, idx) in getUrls(item).slice(0, URL_PREVIEW_COUNT)"
                :key="`${item.id}-url-${idx}`"
                class="url-line"
              >
                {{ url }}
              </div>
              <v-btn
                v-if="getUrls(item).length > URL_PREVIEW_COUNT"
                size="x-small"
                variant="text"
                class="px-0"
                @click="openFullText('生成物', getUrls(item).join('\n'))"
              >
                查看全部（{{ getUrls(item).length }}）
              </v-btn>
            </div>
            <div v-if="getPromptText(item)" class="mt-1">
              <span class="detail-label">提示词：</span>
              {{ getPromptPreview(item) }}
              <v-btn
                v-if="isPromptLong(item)"
                size="x-small"
                variant="text"
                class="ml-1 px-0"
                @click="openFullText('提示词', getPromptText(item) || '')"
              >
                展开
              </v-btn>
            </div>
            <div
              v-if="!getReasonText(item) && getUrls(item).length === 0 && !getPromptText(item)"
              class="d-flex align-center"
            >
              {{ t('common.unknown') }}
            </div>
          </div>
        </template>

        <template #item.apiKeyId="{ item }">
          <code class="text-caption">{{ formatMaskedApiKey(item.apiKeyId) }}</code>
        </template>

        <!-- 空状态 -->
        <template #no-data>
          <div class="py-8 text-center">
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

    <v-dialog v-model="detailDialog" max-width="900">
      <v-card>
        <v-card-title>{{ detailDialogTitle }}</v-card-title>
        <v-card-text>
          <pre class="dialog-content">{{ detailDialogContent }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.service-details-cell {
  line-height: 1.5;
}

.detail-label {
  font-weight: 600;
}

.url-line {
  word-break: break-all;
}

.dialog-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

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
