<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center bg-primary">
      <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
      积分周期统计
    </v-card-title>
    <v-card-text class="pt-4">
      <v-data-table
        :headers="headers"
        :items="creditPeriods"
        :items-per-page="-1"
        density="comfortable"
        class="elevation-0"
      >
        <!-- Period Index Column -->
        <template #item.periodIndex="{ item }">
          <v-chip color="primary" variant="outlined" size="small">
            周期 {{ item.periodIndex }}
          </v-chip>
        </template>

        <!-- Period Dates Column -->
        <template #item.dates="{ item }">
          <div class="text-body-2">
            <div>{{ formatDate(item.periodStartAt) }}</div>
            <div class="text-medium-emphasis">至</div>
            <div>{{ formatDate(item.periodEndAt) }}</div>
          </div>
        </template>

        <!-- Credits Quota Column -->
        <template #item.creditsQuota="{ item }">
          <span class="text-body-1 font-weight-medium">
            {{ formatCredits(item.creditsQuota) }}
          </span>
        </template>

        <!-- Credits Consumed Column -->
        <template #item.creditsConsumed="{ item }">
          <v-chip :color="getConsumedColor(item)" variant="tonal" size="small">
            {{ formatCredits(item.creditsConsumed) }}
          </v-chip>
        </template>

        <!-- Credits Remaining Column -->
        <template #item.creditsRemaining="{ item }">
          <v-chip :color="getRemainingColor(item)" variant="tonal" size="small">
            {{ formatCredits(item.creditsRemaining) }}
          </v-chip>
        </template>

        <!-- Usage Progress Column -->
        <template #item.progress="{ item }">
          <div class="d-flex align-center">
            <v-progress-linear
              :model-value="getUsagePercentage(item)"
              :color="getProgressColor(item)"
              height="20"
              rounded
              class="flex-grow-1"
            >
              <template #default>
                <span class="text-caption font-weight-bold">
                  {{ getUsagePercentage(item).toFixed(1) }}%
                </span>
              </template>
            </v-progress-linear>
          </div>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" variant="elevated" size="small">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Granted Date Column -->
        <template #item.grantedAt="{ item }">
          <span class="text-body-2">
            {{ item.grantedAt ? formatDate(item.grantedAt) : '-' }}
          </span>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-4">
            <v-icon size="48" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-2">暂无积分周期记录</p>
          </div>
        </template>
      </v-data-table>

      <!-- Summary Stats -->
      <v-row v-if="creditPeriods.length > 0" class="mt-4">
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center">
              <div class="text-h6">{{ formatCredits(totalQuota) }}</div>
              <div class="text-caption text-medium-emphasis">总配额</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="warning">
            <v-card-text class="text-center">
              <div class="text-h6">{{ formatCredits(totalConsumed) }}</div>
              <div class="text-caption text-medium-emphasis">已消耗</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center">
              <div class="text-h6">{{ formatCredits(totalRemaining) }}</div>
              <div class="text-caption text-medium-emphasis">剩余</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CreditPeriodItem, PeriodStatus } from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';

const props = defineProps<{
  creditPeriods: CreditPeriodItem[];
}>();

const headers = [
  { title: '周期', key: 'periodIndex', sortable: false },
  { title: '周期时间', key: 'dates', sortable: false },
  { title: '配额', key: 'creditsQuota', sortable: false },
  { title: '已消耗', key: 'creditsConsumed', sortable: false },
  { title: '剩余', key: 'creditsRemaining', sortable: false },
  { title: '使用进度', key: 'progress', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '发放时间', key: 'grantedAt', sortable: false },
];

// Summary calculations
const totalQuota = computed(() =>
  props.creditPeriods.reduce((sum, period) => sum + period.creditsQuota, 0)
);

const totalConsumed = computed(() =>
  props.creditPeriods.reduce((sum, period) => sum + period.creditsConsumed, 0)
);

const totalRemaining = computed(() =>
  props.creditPeriods.reduce((sum, period) => sum + period.creditsRemaining, 0)
);

function formatCredits(amount: number): string {
  return amount.toLocaleString('zh-CN');
}

function getUsagePercentage(item: CreditPeriodItem): number {
  if (item.creditsQuota === 0) return 0;
  return (item.creditsConsumed / item.creditsQuota) * 100;
}

function getProgressColor(item: CreditPeriodItem): string {
  const percentage = getUsagePercentage(item);
  if (percentage >= 90) return 'error';
  if (percentage >= 70) return 'warning';
  return 'success';
}

function getConsumedColor(item: CreditPeriodItem): string {
  const percentage = getUsagePercentage(item);
  if (percentage >= 90) return 'error';
  if (percentage >= 70) return 'warning';
  return 'info';
}

function getRemainingColor(item: CreditPeriodItem): string {
  const percentage = (item.creditsRemaining / item.creditsQuota) * 100;
  if (percentage <= 10) return 'error';
  if (percentage <= 30) return 'warning';
  return 'success';
}

function getStatusColor(status: PeriodStatus): string {
  switch (status) {
    case 'granted':
      return 'success';
    case 'pending':
      return 'grey';
    default:
      return 'primary';
  }
}

function getStatusLabel(status: PeriodStatus): string {
  const labels: Record<PeriodStatus, string> = {
    pending: '待发放',
    granted: '已发放',
  };
  return labels[status] || status;
}
</script>

<style scoped>
/* Component-specific styles */
</style>
