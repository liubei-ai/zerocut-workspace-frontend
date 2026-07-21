<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { ProjectOverviewItem, VideoWorkflowSource } from '@/types/api';

import { listVideoProjects } from '@/api/videoWorkflowApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';

interface Props {
  source: VideoWorkflowSource;
  workspaceId?: string;
  projectDetailRouteName?: string;
  projectDetailRouteParams?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  workspaceId: undefined,
  projectDetailRouteName: 'UsageProjectDetail',
  projectDetailRouteParams: () => ({}),
});

const { t } = useI18n();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const resolvedWorkspaceId = computed(() => props.workspaceId || workspaceStore.currentWorkspaceId);

const loading = ref(false);
const error = ref('');
const items = ref<ProjectOverviewItem[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const fetchProjects = async () => {
  const workspaceId = resolvedWorkspaceId.value;
  if (!workspaceId) return;
  try {
    loading.value = true;
    error.value = '';
    const res = await listVideoProjects(workspaceId, {
      source: props.source,
      page: pagination.value.page,
      limit: pagination.value.limit,
    });
    items.value = res.list || [];
    pagination.value = {
      page: res.page || 1,
      limit: res.limit || 10,
      total: res.total || 0,
      totalPages: res.totalPages || 0,
    };
  } catch (err) {
    console.error('获取项目列表失败:', err);
    error.value = (err as any).message || t('zerocut.usage.records.errors.fetchProjectsFail');
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const onRowClick = (_e: unknown, { item }: { item: ProjectOverviewItem }) => {
  router.push({
    name: props.projectDetailRouteName,
    params: { ...props.projectDetailRouteParams, projectId: String(item.id) },
    query: { source: props.source },
  });
};

const formatCredits = (n: number) => Number(n || 0).toLocaleString();

watch([() => props.source, resolvedWorkspaceId], () => {
  pagination.value.page = 1;
  fetchProjects();
});

onMounted(fetchProjects);

defineExpose({ refresh: fetchProjects });
</script>

<template>
  <div>
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card elevation="2">
      <v-data-table-server
        :headers="[
          {
            title: t('zerocut.usage.records.columns.projectName'),
            key: 'projectName',
            sortable: false,
          },
          {
            title: t('zerocut.usage.records.columns.callCount'),
            key: 'callCount',
            sortable: false,
            align: 'end',
          },
          {
            title: t('zerocut.usage.records.columns.creditsConsumed'),
            key: 'creditsConsumed',
            sortable: false,
            align: 'end',
          },
          {
            title: t('zerocut.usage.records.columns.lastCalledAt'),
            key: 'lastCalledAt',
            sortable: false,
          },
        ]"
        :items="items"
        item-value="id"
        class="elevation-0 cursor-pointer"
        :loading="loading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @click:row="onRowClick"
        @update:page="
          (p: number) => {
            pagination.page = p;
            fetchProjects();
          }
        "
        @update:items-per-page="
          (n: number) => {
            pagination.limit = n;
            pagination.page = 1;
            fetchProjects();
          }
        "
      >
        <template #item.projectName="{ item }">
          <div class="d-flex align-center">
            <v-icon size="20" class="mr-2" color="primary">mdi-folder-multiple-outline</v-icon>
            <span class="font-weight-medium">{{ item.projectName }}</span>
          </div>
        </template>

        <template #item.callCount="{ item }">
          {{ formatCredits(item.callCount) }}
        </template>

        <template #item.creditsConsumed="{ item }">
          <span class="text-error font-weight-medium">
            -{{ formatCredits(item.creditsConsumed) }}
          </span>
        </template>

        <template #item.lastCalledAt="{ item }">
          {{ item.lastCalledAt ? formatDate(item.lastCalledAt) : '—' }}
        </template>

        <template #no-data>
          <div class="py-8 text-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4"> mdi-folder-open-outline </v-icon>
            <div class="text-h6 text-grey-darken-1 mb-2">
              {{ t('zerocut.usage.records.empty.title') }}
            </div>
            <div class="text-body-2 text-grey">
              {{ t('zerocut.usage.records.empty.subtitle') }}
            </div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<style scoped>
:deep(.v-data-table__tr) {
  cursor: pointer;
}
</style>
