<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { VideoWorkflowRecordItem, VideoWorkflowSource } from '@/types/api';

import { listVideoWorkflowRecords } from '@/api/videoWorkflowApi';
import { getConsumptionByTransactionId, type CreditsConsumptionItem } from '@/api/walletApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';

const props = defineProps<{
  source: VideoWorkflowSource;
  workspaceId?: string;
}>();

const { t } = useI18n();
const workspaceStore = useWorkspaceStore();
const resolvedWorkspaceId = computed(() => props.workspaceId || workspaceStore.currentWorkspaceId);

const loading = ref(false);
const error = ref('');
const items = ref<VideoWorkflowRecordItem[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const detailDialog = ref(false);
const detailRecord = ref<VideoWorkflowRecordItem | null>(null);

const consumptionDialog = ref(false);
const consumptionLoading = ref(false);
const consumptionError = ref('');
const consumptionItem = ref<CreditsConsumptionItem | null>(null);

const consumptionReason = computed(() => {
  const raw = consumptionItem.value?.displayDetails?.reason;
  return typeof raw === 'string' ? raw : '';
});

const consumptionPrompt = computed(() => {
  const item = consumptionItem.value;
  if (!item) return '';
  const raw = item.prompt ?? item.displayDetails?.prompt;
  return typeof raw === 'string' ? raw : '';
});

const consumptionUrls = computed<string[]>(() => {
  const raw = consumptionItem.value?.displayDetails?.urls;
  if (typeof raw === 'string') return raw.trim() ? [raw.trim()] : [];
  if (!Array.isArray(raw)) return [];
  return raw.filter((url): url is string => typeof url === 'string' && !!url.trim());
});

const fetchRecords = async () => {
  const workspaceId = resolvedWorkspaceId.value;
  if (!workspaceId) return;

  try {
    loading.value = true;
    error.value = '';
    const response = await listVideoWorkflowRecords(workspaceId, {
      source: props.source,
      page: pagination.value.page,
      limit: pagination.value.limit,
    });
    items.value = response.list || [];
    pagination.value = {
      page: response.page || 1,
      limit: response.limit || 10,
      total: response.total || 0,
      totalPages: response.totalPages || 0,
    };
  } catch (err) {
    console.error('获取工作区使用记录失败:', err);
    error.value =
      (err instanceof Error ? err.message : '') ||
      t('zerocut.usage.records.errors.fetchRecordsFail');
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const openDetail = (record: VideoWorkflowRecordItem) => {
  detailRecord.value = record;
  detailDialog.value = true;
};

const openConsumption = async (transactionId: string) => {
  const workspaceId = resolvedWorkspaceId.value;
  if (!workspaceId) return;

  consumptionItem.value = null;
  consumptionError.value = '';
  consumptionLoading.value = true;
  consumptionDialog.value = true;
  try {
    consumptionItem.value = await getConsumptionByTransactionId(workspaceId, transactionId);
  } catch (err) {
    console.error('查询消费记录失败:', err);
    consumptionError.value =
      (err instanceof Error ? err.message : '') ||
      t('zerocut.usage.records.errors.fetchConsumptionFail');
  } finally {
    consumptionLoading.value = false;
  }
};

const formatJson = (value?: unknown) => {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const statusColor = (status: string) => {
  const upper = (status || '').toUpperCase();
  if (upper === 'SUCCESS' || upper === 'COMPLETED') return 'success';
  if (upper === 'FAILED' || upper === 'FAIL') return 'error';
  if (upper === 'RUNNING' || upper === 'PENDING') return 'info';
  return undefined;
};

watch([() => props.source, resolvedWorkspaceId], () => {
  pagination.value.page = 1;
  fetchRecords();
});

onMounted(fetchRecords);

defineExpose({ refresh: fetchRecords });
</script>

<template>
  <div>
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card elevation="2">
      <v-data-table-server
        :headers="[
          {
            title: t('zerocut.usage.records.columns.time'),
            key: 'createdAt',
            sortable: false,
          },
          { title: t('zerocut.usage.records.columns.model'), key: 'type', sortable: false },
          { title: t('zerocut.usage.records.columns.status'), key: 'status', sortable: false },
          {
            title: t('zerocut.usage.records.columns.creditsAmount'),
            key: 'creditsAmount',
            sortable: false,
            align: 'end',
          },
          ...(source === 'workflow'
            ? [
                {
                  title: t('zerocut.usage.records.columns.uid'),
                  key: 'uid',
                  sortable: false,
                },
              ]
            : [
                {
                  title: t('zerocut.usage.records.columns.apiKey'),
                  key: 'apiKey',
                  sortable: false,
                },
              ]),
          {
            title: t('zerocut.usage.records.columns.transactionId'),
            key: 'transactionId',
            sortable: false,
          },
          { title: t('zerocut.usage.records.columns.actions'), key: 'actions', sortable: false },
        ]"
        :items="items"
        item-value="id"
        class="elevation-0"
        :loading="loading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @update:page="
          (page: number) => {
            pagination.page = page;
            fetchRecords();
          }
        "
        @update:items-per-page="
          (limit: number) => {
            pagination.limit = limit;
            pagination.page = 1;
            fetchRecords();
          }
        "
      >
        <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.creditsAmount="{ item }">
          <span v-if="typeof item.creditsAmount === 'number'" class="text-error font-weight-medium">
            -{{ item.creditsAmount.toLocaleString() }}
          </span>
          <span v-else class="text-grey">—</span>
        </template>

        <template #item.uid="{ item }">
          <code class="text-caption">{{ item.uid ?? '—' }}</code>
        </template>

        <template #item.apiKey="{ item }">
          <code class="text-caption">{{ item.apiKey ? maskApiKey(item.apiKey) : '—' }}</code>
        </template>

        <template #item.transactionId="{ item }">
          <div v-if="item.transactionId" class="d-flex align-center gap-2">
            <code class="text-caption">{{ item.transactionId }}</code>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-receipt-text-outline"
              @click="openConsumption(item.transactionId)"
            >
              {{ t('zerocut.usage.records.consumption.viewBtn') }}
            </v-btn>
          </div>
          <span v-else class="text-grey">—</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-eye-outline"
            @click="openDetail(item)"
          >
            {{ t('zerocut.usage.records.detail.viewIo') }}
          </v-btn>
        </template>

        <template #no-data>
          <div class="py-8 text-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-file-document-outline
            </v-icon>
            <div class="text-h6 text-grey-darken-1">暂无使用记录</div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="900">
      <v-card>
        <v-card-title>{{ t('zerocut.usage.records.detail.dialogTitle') }}</v-card-title>
        <v-card-text>
          <div v-if="detailRecord" class="d-flex flex-column gap-4">
            <div>
              <div class="text-subtitle-2 mb-1">
                {{ t('zerocut.usage.records.detail.paramLabel') }}
              </div>
              <pre class="json-block">{{ formatJson(detailRecord.param) || '—' }}</pre>
            </div>
            <div>
              <div class="text-subtitle-2 mb-1">
                {{ t('zerocut.usage.records.detail.outputLabel') }}
              </div>
              <pre class="json-block">{{ formatJson(detailRecord.output) || '—' }}</pre>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">{{ t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="consumptionDialog" max-width="900">
      <v-card>
        <v-card-title>{{ t('zerocut.usage.records.consumption.dialogTitle') }}</v-card-title>
        <v-card-text>
          <div v-if="consumptionLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-alert v-else-if="consumptionError" type="error" variant="tonal" class="mb-2">
            {{ consumptionError }}
          </v-alert>
          <div v-else-if="consumptionItem" class="d-flex flex-column gap-3">
            <div class="d-flex flex-wrap gap-4">
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('zerocut.usage.records.consumption.creditsAmountLabel') }}
                </div>
                <div class="text-error font-weight-medium">
                  {{ consumptionItem.creditsAmount.toLocaleString() }}
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('zerocut.usage.records.consumption.createdAtLabel') }}
                </div>
                <div>{{ formatDate(consumptionItem.createdAt) }}</div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('zerocut.usage.records.detail.linkedTransaction') }}
                </div>
                <code class="text-caption">{{ consumptionItem.transactionId }}</code>
              </div>
            </div>

            <div v-if="consumptionReason">
              <div class="text-subtitle-2 mb-1">
                {{ t('zerocut.usage.records.consumption.reasonLabel') }}
              </div>
              <div>{{ consumptionReason }}</div>
            </div>

            <div v-if="consumptionUrls.length > 0">
              <div class="text-subtitle-2 mb-1">
                {{ t('zerocut.usage.records.consumption.outputsLabel') }}
              </div>
              <div v-for="(url, index) in consumptionUrls" :key="index" class="mb-1">
                <a :href="url" target="_blank" rel="noopener noreferrer" class="url-link">
                  {{ url }}
                </a>
              </div>
            </div>

            <div v-if="consumptionPrompt">
              <div class="text-subtitle-2 mb-1">
                {{ t('zerocut.usage.records.consumption.promptLabel') }}
              </div>
              <pre class="json-block">{{ consumptionPrompt }}</pre>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="consumptionDialog = false">{{ t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.json-block {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

.url-link {
  word-break: break-all;
}
</style>
