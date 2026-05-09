<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import type { ProjectMeta, VideoWorkflowSource, VideoWorkflowRecordItem } from '@/types/api';

import { listVideoProjectRecords } from '@/api/videoWorkflowApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const workspaceStore = useWorkspaceStore();

const projectId = computed(() => Number(route.params.projectId));
const source = computed<VideoWorkflowSource>(() =>
  route.query.source === 'api' ? 'api' : 'workflow'
);

const loading = ref(false);
const error = ref('');
const project = ref<ProjectMeta | null>(null);
const records = ref<VideoWorkflowRecordItem[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const detailDialog = ref(false);
const detailRecord = ref<VideoWorkflowRecordItem | null>(null);

const fetchRecords = async () => {
  const workspaceId = workspaceStore.currentWorkspaceId;
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

watch([projectId, source], () => {
  pagination.value.page = 1;
  fetchRecords();
});

onMounted(fetchRecords);

const goBack = () => {
  router.push({ path: '/usage', query: { tab: 'usage' } });
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
          { title: t('zerocut.usage.records.columns.type'), key: 'type', sortable: false },
          { title: t('zerocut.usage.records.columns.status'), key: 'status', sortable: false },
          {
            title: t('zerocut.usage.records.columns.creditsAmount'),
            key: 'creditsAmount',
            sortable: false,
            align: 'end',
          },
          source === 'api'
            ? {
                title: t('zerocut.usage.records.columns.apiKey'),
                key: 'apiKey',
                sortable: false,
              }
            : { title: t('zerocut.usage.records.columns.uid'), key: 'uid', sortable: false },
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

        <template #item.uid="{ item }">
          {{ item.uid ?? '—' }}
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
}
</style>
