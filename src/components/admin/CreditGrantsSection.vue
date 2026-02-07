<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center bg-primary">
      <v-icon class="mr-2">mdi-gift-outline</v-icon>
      积分发放历史
    </v-card-title>
    <v-card-text class="pt-4">
      <v-data-table
        :headers="headers"
        :items="creditGrants"
        :items-per-page="-1"
        density="comfortable"
        class="elevation-0"
      >
        <!-- Transaction ID Column -->
        <template #item.txnId="{ item }">
          <code class="txn-code">{{ item.txnId }}</code>
        </template>

        <!-- Credits Amount Column -->
        <template #item.creditsAmount="{ item }">
          <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-plus">
            {{ formatCredits(item.creditsAmount) }}
          </v-chip>
        </template>

        <!-- Granted Date Column -->
        <template #item.grantedAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.grantedAt) }}</span>
        </template>

        <!-- Expires Date Column -->
        <template #item.expiresAt="{ item }">
          <div class="d-flex align-center">
            <span class="text-body-2">{{ formatDate(item.expiresAt) }}</span>
            <v-chip
              v-if="isExpired(item.expiresAt)"
              color="error"
              variant="text"
              size="x-small"
              class="ml-2"
            >
              已过期
            </v-chip>
            <v-chip
              v-else-if="isExpiringSoon(item.expiresAt)"
              color="warning"
              variant="text"
              size="x-small"
              class="ml-2"
            >
              即将过期
            </v-chip>
          </div>
        </template>

        <!-- Description Column -->
        <template #item.description="{ item }">
          <span class="text-body-2">{{ item.description }}</span>
        </template>

        <!-- Period Link Column -->
        <template #item.periodId="{ item }">
          <v-chip v-if="item.periodId" variant="outlined" size="small">
            周期 #{{ item.periodId }}
          </v-chip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-4">
            <v-icon size="48" color="grey-lighten-1">mdi-gift-off-outline</v-icon>
            <p class="text-body-1 text-medium-emphasis mt-2">暂无积分发放记录</p>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { CreditGrantItem } from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';

defineProps<{
  creditGrants: CreditGrantItem[];
}>();

const headers = [
  { title: '交易ID', key: 'txnId', sortable: false },
  { title: '积分数量', key: 'creditsAmount', sortable: false },
  { title: '发放时间', key: 'grantedAt', sortable: false },
  { title: '过期时间', key: 'expiresAt', sortable: false },
  { title: '描述', key: 'description', sortable: false },
  { title: '关联周期', key: 'periodId', sortable: false },
];

function formatCredits(amount: number): string {
  return amount.toLocaleString('zh-CN');
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function isExpiringSoon(expiresAt: string): boolean {
  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
}
</script>

<style scoped>
.txn-code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}
</style>
