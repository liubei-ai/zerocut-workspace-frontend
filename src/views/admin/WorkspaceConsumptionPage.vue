<script setup lang="ts">
import {
  getWorkspaceConsumptionRecords,
  type CreditsConsumptionItem,
  type QueryCreditsConsumptionParams,
} from '@/api/adminApi';
import { useAdminWorkspaceStore } from '@/stores/adminWorkspaceStore';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const workspaceId = route.params.workspaceId as string;
const adminWorkspaceStore = useAdminWorkspaceStore();
const currentWorkspace = computed(() => adminWorkspaceStore.currentWorkspace);

const loading = ref(false);
const items = ref<CreditsConsumptionItem[]>([]);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const filters = ref<QueryCreditsConsumptionParams>({
  serviceType: '',
  startDate: '',
  endDate: '',
});

const headers = [
  { title: '交易ID', key: 'transactionId', sortable: false, width: '220px' },
  { title: '服务类型', key: 'serviceType', sortable: false, width: '120px' },
  {
    title: '消费积分',
    key: 'creditsAmount',
    sortable: false,
    width: '120px',
    align: 'end' as const,
  },
  { title: '创建时间', key: 'createdAt', sortable: false, width: '160px' },
  { title: '服务详情', key: 'serviceDetails', sortable: false },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const params: QueryCreditsConsumptionParams = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      serviceType: filters.value.serviceType || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
    };
    const res = await getWorkspaceConsumptionRecords(workspaceId, params);
    items.value = res.list;
    pagination.value = {
      page: res.page,
      limit: res.limit,
      total: res.total,
      totalPages: res.totalPages,
    };
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchData();
}

function handleItemsPerPageChange(limit: number) {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchData();
}

function resetFilters() {
  filters.value = { serviceType: '', startDate: '', endDate: '' };
  pagination.value.page = 1;
  fetchData();
}

onMounted(fetchData);

watch(
  () => route.params.workspaceId,
  newId => {
    if (typeof newId === 'string') {
      pagination.value.page = 1;
      fetchData();
    }
  }
);
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">工作空间消费记录</h1>
        <div class="text-medium-emphasis">{{ currentWorkspace?.name }} (ID: {{ workspaceId }})</div>
        <div class="mt-2">
          <v-alert
            v-if="!currentWorkspace"
            type="warning"
            variant="tonal"
            density="comfortable"
            title="未获取到工作空间信息"
            text="请从工作空间列表页进入本页面以便展示名称与所有者信息。"
          />
          <div v-else class="d-flex flex-column gap-1">
            <div class="text-body-2 text-medium-emphasis">
              所有者：
              <span class="font-weight-medium">{{ currentWorkspace.ownerName || '未知' }}</span>
              <span class="ml-2">{{ currentWorkspace.ownerEmail || '邮箱未知' }}</span>
              <span v-if="currentWorkspace.ownerPhone" class="ml-2">{{
                currentWorkspace.ownerPhone
              }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="router.back()">
          返回
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchData">
          刷新
        </v-btn>
      </div>
    </div>

    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        筛选条件
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.serviceType"
              :items="[
                { title: '全部', value: '' },
                { title: 'LLM调用', value: 'LLM调用' },
                { title: 'other', value: 'other' },
              ]"
              label="服务类型"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.startDate"
              label="开始日期"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.endDate"
              label="结束日期"
              type="date"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>
        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-magnify"
            @click="
              () => {
                pagination.page = 1;
                fetchData();
              }
            "
          >
            搜索
          </v-btn>
          <v-btn variant="text" prepend-icon="mdi-backspace" @click="resetFilters"> 重置 </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-file-document</v-icon>
        消费记录列表
      </v-card-title>

      <v-data-table-server
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :items-length="pagination.total"
        :server-items-length="pagination.total"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
        class="elevation-0"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.serviceDetails="{ item }">
          {{ item.serviceDetails }}
        </template>
        <template #item.creditsAmount="{ item }">
          <div class="text-right">
            <span class="font-weight-medium">{{ item.creditsAmount }}</span>
            <span class="text-caption ml-1">积分</span>
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
.v-data-table {
  border-radius: 8px;
}
</style>
