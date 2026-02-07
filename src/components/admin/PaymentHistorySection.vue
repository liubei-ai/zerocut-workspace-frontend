<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center bg-primary">
      <v-icon class="mr-2">mdi-cash-multiple</v-icon>
      支付历史
    </v-card-title>
    <v-card-text class="pt-4">
      <v-data-table
        :headers="headers"
        :items="orders"
        :items-per-page="-1"
        density="comfortable"
        class="elevation-0"
      >
        <!-- Order Number Column -->
        <template #item.orderNo="{ item }">
          <code class="order-code">{{ item.orderNo }}</code>
        </template>

        <!-- Amount Column -->
        <template #item.amountCents="{ item }">
          <span class="text-body-1 font-weight-medium">
            {{ formatCurrency(item.amountCents, item.currency) }}
          </span>
        </template>

        <!-- Purpose Column -->
        <template #item.purpose="{ item }">
          <v-chip :color="getPurposeColor(item.purpose)" variant="tonal" size="small">
            {{ getPurposeLabel(item.purpose) }}
          </v-chip>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" variant="elevated" size="small">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Attempt Column -->
        <template #item.attemptNo="{ item }">
          <v-chip variant="outlined" size="small"> 第 {{ item.attemptNo }} 次 </v-chip>
        </template>

        <!-- Scheduled Date Column -->
        <template #item.scheduledAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.scheduledAt) }}</span>
        </template>

        <!-- Paid Date Column -->
        <template #item.paidAt="{ item }">
          <span class="text-body-2">
            {{ item.paidAt ? formatDate(item.paidAt) : '-' }}
          </span>
        </template>

        <!-- Transaction Details Column -->
        <template #item.details="{ item }">
          <!-- WeChat Transaction ID for successful orders -->
          <div v-if="item.status === 'success' && item.wechatTransactionId" class="mb-1">
            <v-chip color="success" variant="tonal" size="x-small" prepend-icon="mdi-wechat">
              {{ item.wechatTransactionId }}
            </v-chip>
          </div>

          <!-- Failure info for failed orders -->
          <div v-if="item.status === 'failed' && (item.failCode || item.failMessage)">
            <v-chip color="error" variant="tonal" size="x-small" class="mb-1">
              错误代码: {{ item.failCode || 'N/A' }}
            </v-chip>
            <div v-if="item.failMessage" class="text-caption text-error mt-1">
              {{ item.failMessage }}
            </div>
          </div>

          <!-- Empty state for other statuses -->
          <span
            v-if="item.status !== 'success' && item.status !== 'failed'"
            class="text-medium-emphasis"
          >
            -
          </span>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-4">
            <v-icon size="48" color="grey-lighten-1">mdi-cash-remove</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-2">暂无支付记录</p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { SubscriptionOrderItem, OrderStatus, OrderPurpose } from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';

defineProps<{
  orders: SubscriptionOrderItem[];
}>();

const headers = [
  { title: '订单号', key: 'orderNo', sortable: false },
  { title: '金额', key: 'amountCents', sortable: false },
  { title: '用途', key: 'purpose', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '尝试次数', key: 'attemptNo', sortable: false },
  { title: '计划扣款时间', key: 'scheduledAt', sortable: false },
  { title: '实际支付时间', key: 'paidAt', sortable: false },
  { title: '交易详情', key: 'details', sortable: false },
];

function formatCurrency(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  const symbol = currency === 'CNY' ? '¥' : currency;
  return `${symbol}${amount.toFixed(2)}`;
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'processing':
      return 'info';
    case 'created':
      return 'grey';
    default:
      return 'primary';
  }
}

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    created: '已创建',
    processing: '处理中',
    success: '成功',
    failed: '失败',
  };
  return labels[status] || status;
}

function getPurposeColor(purpose: OrderPurpose): string {
  switch (purpose) {
    case 'initial':
      return 'primary';
    case 'renewal':
      return 'info';
    default:
      return 'grey';
  }
}

function getPurposeLabel(purpose: OrderPurpose): string {
  const labels: Record<OrderPurpose, string> = {
    initial: '首次购买',
    renewal: '续费',
  };
  return labels[purpose] || purpose;
}
</script>

<style scoped>
.order-code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}
</style>
