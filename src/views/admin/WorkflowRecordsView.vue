<script setup lang="ts">
import { listWorkflowRecords } from '@/api/workflowApi';
import { useAdminWorkspaceStore } from '@/stores/adminWorkspaceStore';
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';

const store = useAdminWorkspaceStore();

const loading = ref(false);
const items = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const status = ref<string | undefined>(undefined);
const q = ref<string>('');

const hasWorkspace = computed(() => !!store.currentWorkspace?.workspaceId);

async function fetchData() {
  if (!hasWorkspace.value) return;
  loading.value = true;
  try {
    const data = await listWorkflowRecords(store.currentWorkspace!.workspaceId, {
      status: status.value,
      page: page.value,
      pageSize: pageSize.value,
      q: q.value?.trim() || undefined,
    });
    items.value = data.items || [];
    total.value = data.pagination?.total || 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  fetchData();
}

function formatDate(val?: string | Date) {
  if (!val) return '-';
  return moment(val).format('YYYY-MM-DD HH:mm:ss');
}

function canOpenDebug(row: any) {
  return !!row.debugUrl && !row.debugUrlExpired;
}

function openDebug(row: any) {
  if (canOpenDebug(row)) window.open(row.debugUrl, '_blank');
}

onMounted(fetchData);
</script>

<template>
  <div class="pa-4">
    <div v-if="!hasWorkspace" class="text-caption text-error">
      {{ $t('zerocut.apikeys.errors.noWorkspace') }}
    </div>

    <v-card v-else>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-h6">{{ $t('menu.workflows') }}</div>
        <v-btn variant="text" color="primary" @click="fetchData">{{ $t('common.refresh') }}</v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              :items="[
                { title: '全部', value: undefined },
                { title: 'pending', value: 'pending' },
                { title: 'running', value: 'running' },
                { title: 'success', value: 'success' },
                { title: 'fail', value: 'fail' },
              ]"
              v-model="status"
              label="状态"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="q" label="workflowId / executeId" density="compact" />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-end">
            <v-btn color="primary" class="mr-2" @click="onSearch">{{ $t('common.search') }}</v-btn>
            <v-btn
              variant="tonal"
              @click="
                q = '';
                status = undefined;
                onSearch();
              "
              >{{ $t('common.reset') }}</v-btn
            >
          </v-col>
        </v-row>

        <v-data-table
          :items="items"
          :loading="loading"
          :items-per-page="pageSize"
          v-model:page="page"
          :headers="[
            { title: 'workflowId', key: 'workflowId' },
            { title: 'executeId', key: 'executeId' },
            { title: 'status', key: 'status' },
            { title: 'startedAt', key: 'startedAt' },
            { title: 'endedAt', key: 'endedAt' },
            { title: 'debug', key: 'debug' },
          ]"
          class="mt-4"
        >
          <template #item.startedAt="{ item }">
            {{ formatDate(item.startedAt) }}
          </template>
          <template #item.endedAt="{ item }">
            {{ formatDate(item.endedAt) }}
          </template>
          <template #item.debug="{ item }">
            <v-btn
              :disabled="!canOpenDebug(item)"
              color="primary"
              size="small"
              @click="openDebug(item)"
            >
              {{ item.debugUrlExpired ? '链接过期' : '打开调试' }}
            </v-btn>
          </template>
          <template #bottom>
            <div class="d-flex justify-end pa-3">
              <v-pagination
                v-model="page"
                :length="Math.ceil(total / pageSize) || 1"
                @update:modelValue="fetchData"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped></style>
