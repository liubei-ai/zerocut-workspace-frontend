<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import type { ProjectMeta, VideoWorkflowSource, VideoWorkflowRecordItem } from '@/types/api';

import { listVideoProjectRecords } from '@/api/videoWorkflowApi';
import { getConsumptionByTransactionId, type CreditsConsumptionItem } from '@/api/walletApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const workspaceStore = useWorkspaceStore();

const props = defineProps<{
  workspaceId?: string;
  backRoute?: RouteLocationRaw;
}>();

const projectId = computed(() => Number(route.params.projectId));
const source = computed<VideoWorkflowSource>(() =>
  route.query.source === 'api' ? 'api' : 'workflow'
);
const resolvedWorkspaceId = computed(() => props.workspaceId || workspaceStore.currentWorkspaceId);

const loading = ref(false);
const error = ref('');
const project = ref<ProjectMeta | null>(null);
const records = ref<VideoWorkflowRecordItem[]>([]);
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
  return raw.filter((u): u is string => typeof u === 'string' && !!u.trim()).map(u => u.trim());
});

const fetchRecords = async () => {
  const workspaceId = resolvedWorkspaceId.value;
  if (!workspaceId || !projectId.value) return;
  try {
    loading.value = true;
    error.value = '';
    const res = await listVideoProjectRecords(workspaceId, projectId.value, {
      source: source.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
    });
    project.value = res.project;
    records.value = res.list || [];
    pagination.value = {
      page: res.page || 1,
      limit: res.limit || 10,
      total: res.total || 0,
      totalPages: res.totalPages || 0,
    };
  } catch (err) {
    console.error('获取项目工作流记录失败:', err);
    error.value = (err as any).message || t('zerocut.usage.records.errors.fetchRecordsFail');
    records.value = [];
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
  if (!workspaceId || !transactionId) return;
  consumptionItem.value = null;
  consumptionError.value = '';
  consumptionLoading.value = true;
  consumptionDialog.value = true;
  try {
    consumptionItem.value = await getConsumptionByTransactionId(workspaceId, transactionId);
  } catch (err) {
    console.error('查询消费记录失败:', err);
    consumptionError.value =
      (err as any)?.message || t('zerocut.usage.records.errors.fetchConsumptionFail');
  } finally {
    consumptionLoading.value = false;
  }
};

const formatJson = (value?: Record<string, any> | null) => {
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

watch([projectId, source, resolvedWorkspaceId], () => {
  pagination.value.page = 1;
  fetchRecords();
});

onMounted(fetchRecords);

const goBack = () => {
  router.push(props.backRoute ?? { path: '/usage', query: { tab: 'usage' } });
};
</script>

<template>
  <div>
    <ResponsivePageHeader
      :title="project?.projectName || t('zerocut.usage.records.detail.title')"
      :secondary-actions="[
        {
          key: 'back',
          label: t('common.back'),
          icon: 'mdi-arrow-left',
          variant: 'text',
          onClick: goBack,
        },
      ]"
    >
      <template #description>
        <div class="d-flex align-center flex-wrap gap-2">
          <v-chip size="small" variant="tonal">
            {{
              source === 'workflow'
                ? t('zerocut.usage.records.source.workflow')
                : t('zerocut.usage.records.source.api')
            }}
          </v-chip>
          <v-chip v-if="project?.status" size="small" variant="tonal">
            {{ project.status }}
          </v-chip>
          <span v-if="project" class="text-caption text-medium-emphasis">
            {{ t('zerocut.usage.records.detail.createdAt') }}: {{ formatDate(project.createdAt) }}
          </span>
        </div>
      </template>
    </ResponsivePageHeader>

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
          ...(source === 'api'
            ? [
                {
                  title: t('zerocut.usage.records.columns.apiKey'),
                  key: 'apiKey',
                  sortable: false,
                },
              ]
            : []),
          {
            title: t('zerocut.usage.records.columns.transactionId'),
            key: 'transactionId',
            sortable: false,
          },
          { title: t('zerocut.usage.records.columns.actions'), key: 'actions', sortable: false },
        ]"
        :items="records"
        item-value="id"
        class="elevation-0"
        :loading="loading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @update:page="
          (p: number) => {
            pagination.page = p;
            fetchRecords();
          }
        "
        @update:items-per-page="
          (n: number) => {
            pagination.limit = n;
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
            <div class="text-h6 text-grey-darken-1 mb-2">
              {{ t('zerocut.usage.records.empty.detailTitle') }}
            </div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="900">
      <v-card>
        <v-card-title>
          {{ t('zerocut.usage.records.detail.dialogTitle') }}
        </v-card-title>
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
            <div v-if="detailRecord.transactionId" class="text-caption text-medium-emphasis">
              {{ t('zerocut.usage.records.detail.linkedTransaction') }}:
              <code>{{ detailRecord.transactionId }}</code>
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
        <v-card-title>
          {{ t('zerocut.usage.records.consumption.dialogTitle') }}
        </v-card-title>
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
              <div
                v-for="(url, idx) in consumptionUrls"
                :key="`consumption-url-${idx}`"
                class="mb-1"
              >
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
