<script setup lang="ts">
import { getWorkflowRecord, getWorkflowStatus, type WorkflowRecordItem } from '@/api/adminApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { formatDate } from '@/utils/date';
import { useIntervalFn } from '@vueuse/core';
import { computed, onUnmounted, ref, watch } from 'vue';

const loading = ref(false);
const record = ref<WorkflowRecordItem | null>(null);
const error = ref('');
const polling = ref(false);
const interval = useIntervalFn(
  async () => {
    if (!record.value) return;
    const resp = await getWorkflowStatus({
      workflowId: record.value.workflowId,
      executeId: record.value.executeId,
    });
    record.value = resp;
    if (resp.status !== 'running') {
      stopPolling();
    }
  },
  3000,
  { immediate: false }
);

const startPolling = () => {
  if (polling.value) return;
  polling.value = true;
  interval.resume();
};

const stopPolling = () => {
  polling.value = false;
  interval.pause();
};

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

const isExpired = (expiresAt?: string) => {
  if (!expiresAt) return false;
  const ts = new Date(expiresAt).getTime();
  return Number.isFinite(ts) ? ts < Date.now() : false;
};

const searchRecord = async () => {
  error.value = '';
  record.value = null;
  if (!filters.value.workflowId || !filters.value.executeId) {
    error.value = '请输入工作流ID和执行ID';
    return;
  }
  try {
    loading.value = true;
    const resp = await getWorkflowRecord({
      workflowId: filters.value.workflowId,
      executeId: filters.value.executeId,
    });
    record.value = resp;
    if (resp.status === 'running') startPolling();
    else stopPolling();
  } catch (e) {
    error.value = '记录不存在';
    stopPolling();
  } finally {
    loading.value = false;
  }
};

const refreshData = async () => {
  await searchRecord();
};

watch(
  () => record.value?.status,
  s => {
    if (s === 'running') startPolling();
    else stopPolling();
  }
);

onUnmounted(() => {
  stopPolling();
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
        <p class="text-medium-emphasis text-sm sm:text-base">通过工作流ID和执行ID查询单条记录</p>
      </template>
    </ResponsivePageHeader>

    <v-card elevation="2" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.workflowId"
              label="工作流ID"
              placeholder="输入工作流ID"
              clearable
              prepend-inner-icon="mdi-magnify"
              :disabled="loading"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.executeId"
              label="执行ID"
              placeholder="输入执行ID"
              clearable
              prepend-inner-icon="mdi-magnify"
              :disabled="loading"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn color="primary" :loading="loading" @click="searchRecord">查询</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-clipboard-text-outline</v-icon>
        查询结果
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="warning" variant="tonal" class="mb-2">{{ error }}</v-alert>
        <div v-if="record">
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <div class="text-subtitle-1 text-medium-emphasis">状态</div>
              <v-chip
                :color="getStatusColor(record.status)"
                size="large"
                variant="elevated"
                class="status-chip"
              >
                {{ record.status }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-subtitle-1 text-medium-emphasis">调试链接</div>
              <div>
                <template v-if="record.debugUrl && !isExpired(record.debugUrlExpiresAt)">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    :href="record.debugUrl"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                    >打开</v-btn
                  >
                </template>
                <template v-else>
                  <v-chip color="error" variant="flat">已过期</v-chip>
                </template>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-subtitle-1 text-medium-emphasis">过期时间</div>
              <div :class="isExpired(record.debugUrlExpiresAt) ? 'text-error' : 'text-success'">
                {{ record.debugUrlExpiresAt ? formatDate(record.debugUrlExpiresAt) : '-' }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="mb-4" />

          <v-row class="muted">
            <v-col cols="12" md="6">
              <div class="text-caption">工作流ID</div>
              <code class="text-caption">{{ record.workflowId }}</code>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption">执行ID</div>
              <code class="text-caption">{{ record.executeId }}</code>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption">调用时间</div>
              <div class="text-body-2">{{ formatDate(record.startedAt) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption">来源</div>
              <div class="text-body-2">{{ record.source || '-' }}</div>
            </v-col>
          </v-row>
        </div>
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
