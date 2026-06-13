<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { AmountConsumptionRecord } from '@/types/api';

import { getSubAccountConsumptionRecords } from '@/api/subAccountApi';
import { useSubAccountStore } from '@/stores/subAccountStore';

const { t } = useI18n();
const router = useRouter();
const subAccountStore = useSubAccountStore();

const records = ref<AmountConsumptionRecord[]>([]);
const startDate = ref(''); // datetime-local 字符串 YYYY-MM-DDTHH:mm
const endDate = ref('');
const preset = ref<'today' | 'week1' | 'week2' | 'month1' | 'month3' | 'custom'>('today');
const loading = ref(false);
const exporting = ref(false);
const error = ref('');

const currentKey = () => subAccountStore.session?.apiKeyMasked ?? '';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
const formatTime = (value: string) => new Date(value).toLocaleString();
const formatAmount = (value: number) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const presetOptions = () => [
  { value: 'today', title: t('zerocut.subAccount.consumption.presets.today') },
  { value: 'week1', title: t('zerocut.subAccount.consumption.presets.week1') },
  { value: 'week2', title: t('zerocut.subAccount.consumption.presets.week2') },
  { value: 'month1', title: t('zerocut.subAccount.consumption.presets.month1') },
  { value: 'month3', title: t('zerocut.subAccount.consumption.presets.month3') },
  { value: 'custom', title: t('zerocut.subAccount.consumption.presets.custom') },
];

const headers = () => [
  { title: t('zerocut.subAccount.consumption.columns.createdAt'), key: 'createdAt' },
  {
    title: t('zerocut.subAccount.consumption.columns.amount'),
    key: 'amount',
    align: 'end' as const,
  },
  { title: t('zerocut.subAccount.consumption.columns.detail'), key: 'reason' },
  {
    title: t('zerocut.subAccount.consumption.outputTokens'),
    key: 'outputTokens',
    align: 'end' as const,
  },
  { title: t('zerocut.subAccount.consumption.columns.transactionId'), key: 'transactionId' },
];

// 根据预设计算起止时间并写回输入框
const applyPreset = (key: typeof preset.value) => {
  preset.value = key;
  if (key === 'custom') return;
  const now = new Date();
  const start = new Date(now);
  if (key === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (key === 'week1') {
    start.setDate(now.getDate() - 7);
  } else if (key === 'week2') {
    start.setDate(now.getDate() - 14);
  } else if (key === 'month1') {
    start.setMonth(now.getMonth() - 1);
  } else if (key === 'month3') {
    start.setMonth(now.getMonth() - 3);
  }
  startDate.value = toLocalInput(start);
  endDate.value = toLocalInput(now);
};

// 拉取该范围内全部记录（分页累加，供表格展示与导出）
const fetchAll = async (): Promise<AmountConsumptionRecord[]> => {
  const collected: AmountConsumptionRecord[] = [];
  const pageSize = 100;
  const MAX_PAGES = 100; // 安全上限：最多 1 万条
  let page = 1;
  let total = Infinity;
  const params = {
    startDate: startDate.value ? new Date(startDate.value).toISOString() : undefined,
    endDate: endDate.value ? new Date(endDate.value).toISOString() : undefined,
  };
  while (collected.length < total && page <= MAX_PAGES) {
    const res = await getSubAccountConsumptionRecords({ ...params, page, pageSize });
    total = res.total || 0;
    const list = res.list || [];
    collected.push(...list);
    if (list.length < pageSize) break;
    page += 1;
  }
  return collected;
};

const handleSessionError = (e: unknown): boolean => {
  if ((e as { code?: number })?.code === 401) {
    subAccountStore.clear();
    router.replace({ name: 'sub-account-login' });
    return true;
  }
  return false;
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    records.value = await fetchAll();
  } catch (e) {
    if (handleSessionError(e)) return;
    error.value = t('zerocut.subAccount.consumption.loadFail');
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  applyPreset('today');
  load();
};

const exportCsv = async () => {
  if (!records.value.length || exporting.value) return;
  exporting.value = true;
  try {
    const cols = [
      t('zerocut.subAccount.consumption.columns.createdAt'),
      t('zerocut.subAccount.consumption.columns.amount'),
      t('zerocut.subAccount.consumption.columns.detail'),
      t('zerocut.subAccount.consumption.outputTokens'),
      t('zerocut.subAccount.consumption.columns.transactionId'),
    ];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.map(esc).join(',')];
    for (const r of records.value) {
      lines.push(
        [
          formatTime(r.createdAt),
          r.amount,
          r.displayDetails?.reason ?? '',
          r.displayDetails?.outputTokens ?? '',
          r.transactionId,
        ]
          .map(esc)
          .join(',')
      );
    }
    // 加 UTF-8 BOM，保证 Excel 正确识别中文
    const csv = '﻿' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // 文件名：{workspaceId}_{apiKey后8位}_{时间起点}.csv
    const ws = subAccountStore.session?.workspaceId || 'workspace';
    const last8 = (subAccountStore.session?.apiKeyMasked || '').slice(-8) || 'apikey';
    const startStamp = (startDate.value || toLocalInput(new Date())).replace(/[-:T]/g, '');
    a.href = url;
    a.download = `${ws}_${last8}_${startStamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
};

const logout = async () => {
  await subAccountStore.logout();
  router.replace({ name: 'sub-account-login' });
};

onMounted(() => {
  applyPreset('today');
  load();
});
</script>

<template>
  <div class="pa-4 text-left">
    <div class="d-flex align-center justify-space-between mb-1">
      <h2 class="text-h6">{{ t('zerocut.subAccount.consumption.title') }}</h2>
      <v-btn variant="text" size="small" @click="logout">
        {{ t('zerocut.subAccount.consumption.logout') }}
      </v-btn>
    </div>
    <p class="text-caption text-medium-emphasis mb-4">
      {{ t('zerocut.subAccount.consumption.currentKey') }}: {{ currentKey() }}
    </p>

    <!-- 桌面端：一行展示；移动端：堆叠 -->
    <div class="d-flex flex-column flex-md-row align-md-end ga-2 mb-3">
      <v-select
        :model-value="preset"
        :items="presetOptions()"
        :label="t('zerocut.subAccount.consumption.presetLabel')"
        variant="outlined"
        density="compact"
        hide-details
        class="filter-field"
        @update:model-value="applyPreset"
      ></v-select>
      <v-text-field
        v-model="startDate"
        :label="t('zerocut.subAccount.consumption.startDate')"
        type="datetime-local"
        variant="outlined"
        density="compact"
        hide-details
        class="filter-field"
        @update:model-value="preset = 'custom'"
      ></v-text-field>
      <v-text-field
        v-model="endDate"
        :label="t('zerocut.subAccount.consumption.endDate')"
        type="datetime-local"
        variant="outlined"
        density="compact"
        hide-details
        class="filter-field"
        @update:model-value="preset = 'custom'"
      ></v-text-field>
      <div class="d-flex ga-2 flex-wrap">
        <v-btn color="primary" size="small" :loading="loading" @click="load">
          {{ t('zerocut.subAccount.consumption.search') }}
        </v-btn>
        <v-btn variant="text" size="small" @click="reset">
          {{ t('zerocut.subAccount.consumption.reset') }}
        </v-btn>
      </div>
      <v-spacer class="d-none d-md-block"></v-spacer>
      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-download"
        :disabled="!records.length"
        :loading="exporting"
        @click="exportCsv"
      >
        {{ t('zerocut.subAccount.consumption.export') }}
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-3">
      {{ error }}
    </v-alert>

    <v-data-table
      :headers="headers()"
      :items="records"
      :loading="loading"
      :items-per-page="50"
      density="compact"
      class="text-caption"
      :no-data-text="t('zerocut.subAccount.consumption.empty')"
    >
      <template #[`item.createdAt`]="{ item }">
        {{ formatTime(item.createdAt) }}
      </template>
      <template #[`item.amount`]="{ item }">
        {{ formatAmount(item.amount) }}
      </template>
      <template #[`item.reason`]="{ item }">
        {{ item.displayDetails?.reason ?? '-' }}
      </template>
      <template #[`item.outputTokens`]="{ item }">
        {{
          item.displayDetails?.outputTokens != null
            ? item.displayDetails.outputTokens.toLocaleString()
            : '-'
        }}
      </template>
    </v-data-table>
  </div>
</template>

<style scoped lang="scss">
// 桌面端各筛选项等宽撑开；移动端（堆叠）自然占满整行
.filter-field {
  flex: 1 1 auto;
  min-width: 180px;
}
</style>
