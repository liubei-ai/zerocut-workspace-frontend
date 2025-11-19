<script setup lang="ts">
import { getWorkflowRecords, type WorkflowRecordItem } from '@/api/adminApi';
import { formatDate } from '@/utils/date';
import { computed, onMounted, ref } from 'vue';

const loading = ref(false);
const error = ref('');
const items = ref<WorkflowRecordItem[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const filters = ref<{ workspaceId: string; executeId: string }>({ workspaceId: '', executeId: '' });

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

const isExpired = (expiresAt?: string | Date) => {
  if (!expiresAt) return false;
  const ts = new Date(expiresAt).getTime();
  return Number.isFinite(ts) ? ts < Date.now() : false;
};

const fetchRecords = async () => {
  try {
    loading.value = true;
    error.value = '';
    const params = {
      executeId: (filters.value.executeId || '').trim() || undefined,
      workspaceId: (filters.value.workspaceId || '').trim() || undefined,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const resp = await getWorkflowRecords(params);
    items.value = resp.list;
    pagination.value = {
      page: resp.page,
      limit: resp.limit,
      total: resp.total,
      totalPages: resp.totalPages,
    };
  } catch {
    error.value = '查询失败';
  } finally {
    loading.value = false;
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

const resetFilters = () => {
  filters.value.executeId = '';
  filters.value.workspaceId = '';
  pagination.value.page = 1;
  fetchRecords();
};

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    onClick: fetchRecords,
    loading: loading.value,
  },
]);

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div>
    <ResponsivePageHeader :title="$t('menu.workflows')" :secondary-actions="headerSecondaryActions">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">通过执行ID查询记录列表</p>
      </template>
    </ResponsivePageHeader>

    <v-card elevation="2" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.workspaceId"
              @update:modelValue="val => (filters.workspaceId = (val ?? '').trim())"
              @click:clear="
                () => {
                  filters.workspaceId = '';
                  pagination.page = 1;
                  fetchRecords();
                }
              "
              label="工作空间ID"
              placeholder="输入工作空间ID"
              clearable
              prepend-inner-icon="mdi-magnify"
              :disabled="loading"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.executeId"
              @update:modelValue="val => (filters.executeId = (val ?? '').trim())"
              @click:clear="
                () => {
                  filters.executeId = '';
                  pagination.page = 1;
                  fetchRecords();
                }
              "
              label="执行ID"
              placeholder="输入执行ID"
              clearable
              prepend-inner-icon="mdi-magnify"
              :disabled="loading"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn
              color="primary"
              :loading="loading"
              @click="
                () => {
                  pagination.page = 1;
                  fetchRecords();
                }
              "
            >查询</v-btn
            >
            <v-btn
              variant="outlined"
              class="ml-2"
              :disabled="loading"
              @click="resetFilters"
            >重置</v-btn
            >
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-clipboard-text-outline</v-icon>
        工作流记录
        <v-spacer />
        <v-chip v-if="pagination.total > 0" color="primary" variant="outlined" size="small">
          共 {{ pagination.total }} 条记录
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="warning" variant="tonal" class="mb-2">{{ error }}</v-alert>

        <v-data-table-server
          :headers="[
            { title: '状态', key: 'status', sortable: false },
            { title: '调用时间', key: 'startedAt', sortable: false },
            { title: '过期时间', key: 'debugUrlExpiresAt', sortable: false },
            { title: '调试链接', key: 'debugUrl', sortable: false },
            { title: '工作空间', key: 'workspace', sortable: false },
            { title: '所有者', key: 'owner', sortable: false },
            { title: '工作流ID', key: 'workflowId', sortable: false },
            { title: '执行ID', key: 'executeId', sortable: false },
            { title: '来源', key: 'source', sortable: false },
          ]"
          :items="items"
          :loading="loading"
          :page="pagination.page"
          :items-per-page="pagination.limit"
          :items-length="pagination.total"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
        >
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              variant="elevated"
              class="status-chip"
              size="small"
            >
              {{ item.status }}
            </v-chip>
          </template>
          <template #item.debugUrl="{ item }">
            <div>
              <template v-if="item.debugUrl">
                <template v-if="!isExpired(item.debugUrlExpiresAt)">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    :href="item.debugUrl"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                  >打开</v-btn
                  >
                </template>
                <template v-else>
                  <v-chip color="error" variant="flat" size="small">已过期</v-chip>
                </template>
              </template>
              <template v-else>
                <span class="text-disabled">-</span>
              </template>
            </div>
          </template>
          <template #item.debugUrlExpiresAt="{ item }">
            <span :class="isExpired(item.debugUrlExpiresAt) ? 'text-error' : 'text-success'">
              {{ item.debugUrlExpiresAt ? formatDate(item.debugUrlExpiresAt) : '-' }}
            </span>
          </template>
          <template #item.workflowId="{ item }">
            <code class="text-caption">{{ item.workflowId }}</code>
          </template>
          <template #item.executeId="{ item }">
            <code class="text-caption">{{ item.executeId }}</code>
          </template>
          <template #item.startedAt="{ item }">
            <span class="text-body-2">{{ formatDate(item.startedAt) }}</span>
          </template>
          <template #item.source="{ item }">
            <span class="text-body-2">{{ item.source || '-' }}</span>
          </template>
          <template #item.workspace="{ item }">
            <div>
              <span class="text-body-2">{{ item.workspace?.name || '-' }}</span>
              <br>
              <code class="text-caption">{{ item.workspace?.workspaceId || '-' }}</code>
            </div>
          </template>
          <template #item.owner="{ item }">
            <div>
              <span class="text-body-2">{{ item.owner?.name || item.owner?.username || '-' }}</span>
              <br>
              <span class="text-caption muted">{{ item.owner?.email || '-' }}</span>
            </div>
          </template>
        </v-data-table-server>
      </v-card-text>
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
.status-chip {
  font-weight: 600;
  text-transform: uppercase;
}
.muted {
  opacity: 0.85;
}
</style>
