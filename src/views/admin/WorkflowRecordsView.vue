<script setup lang="ts">
import {
  getWorkflowRecords,
  type QueryWorkflowRecordsParams,
  type WorkflowRecordItem,
} from '@/api/adminApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { formatDate } from '@/utils/date';
import { useDebounceFn } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

const loading = ref(false);
const recordsLoading = ref(false);
const records = ref<WorkflowRecordItem[]>([]);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const filters = ref<{ workflowId: string; executeId: string }>({ workflowId: '', executeId: '' });

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'info';
    case 'success':
      return 'success';
    case 'fail':
      return 'error';
    default:
      return 'primary';
  }
};

const fetchRecords = async () => {
  try {
    recordsLoading.value = true;
    const params: QueryWorkflowRecordsParams = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      workflowId: filters.value.workflowId || undefined,
      executeId: filters.value.executeId || undefined,
    };
    const resp = await getWorkflowRecords(params);
    console.log(resp, 'debug');
    records.value = resp.list;
    pagination.value = {
      page: resp.page,
      limit: resp.limit,
      total: resp.total,
      totalPages: resp.totalPages,
    };
  } finally {
    recordsLoading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchRecords();
};

const handleItemsPerPageChange = (itemsPerPage: number) => {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1;
  fetchRecords();
};

const refreshData = async () => {
  loading.value = true;
  await fetchRecords();
  loading.value = false;
};

const debouncedFetch = useDebounceFn(() => {
  pagination.value.page = 1;
  fetchRecords();
}, 300);

watch(
  () => [filters.value.workflowId, filters.value.executeId],
  () => debouncedFetch(),
  { deep: true }
);

onMounted(() => {
  refreshData();
});

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    onClick: refreshData,
    loading: loading.value,
  },
]);
</script>

<template>
  <div>
    <ResponsivePageHeader :title="$t('menu.workflows')" :secondary-actions="headerSecondaryActions">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">最近7天的工作流执行记录</p>
      </template>
    </ResponsivePageHeader>

    <v-card elevation="2" class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.workflowId"
              label="工作流ID"
              placeholder="输入工作流ID"
              clearable
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.executeId"
              label="执行ID"
              placeholder="输入执行ID"
              clearable
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-clipboard-list-outline</v-icon>
        工作流记录
      </v-card-title>

      <v-data-table-server
        :headers="[
          { title: '调用时间', key: 'startedAt', sortable: true },
          { title: '工作流ID', key: 'workflowId', sortable: true },
          { title: '执行ID', key: 'executeId', sortable: true },
          { title: '状态', key: 'status', sortable: true },
          { title: '调试链接', key: 'debugUrl', sortable: false },
          { title: '过期时间', key: 'debugUrlExpiresAt', sortable: true },
          { title: '来源', key: 'source', sortable: false },
        ]"
        :items="records"
        item-value="executeId"
        class="elevation-0"
        :loading="recordsLoading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @update:items-per-page="handleItemsPerPageChange"
        @update:page="handlePageChange"
      >
        <template #item.startedAt="{ item }">
          {{ formatDate(item.startedAt) }}
        </template>
        <template #item.endedAt="{ item }">
          <span v-if="item.endedAt">{{ formatDate(item.endedAt) }}</span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>
        <template #item.workflowId="{ item }">
          <code class="text-caption">{{ item.workflowId }}</code>
        </template>
        <template #item.executeId="{ item }">
          <code class="text-caption">{{ item.executeId }}</code>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="flat">
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.debugUrl="{ item }">
          <a :href="item.debugUrl" target="_blank">打开</a>
        </template>
        <template #item.debugUrlExpiresAt="{ item }">
          {{ item.debugUrlExpiresAt ? formatDate(item.debugUrlExpiresAt) : '-' }}
        </template>
        <template #item.source="{ item }">
          <span class="text-body-2">{{ item.source || '-' }}</span>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>
