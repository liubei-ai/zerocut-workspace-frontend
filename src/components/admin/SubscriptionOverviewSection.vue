<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center bg-primary">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      订阅概览
    </v-card-title>
    <v-card-text class="pt-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-list density="comfortable" class="bg-transparent">
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-identifier</v-icon>
              </template>
              <v-list-item-title>订阅ID</v-list-item-title>
              <v-list-item-subtitle>{{ detail.subscriptionId }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-briefcase</v-icon>
              </template>
              <v-list-item-title>工作空间</v-list-item-title>
              <v-list-item-subtitle>
                <code class="workspace-code">{{ detail.workspaceId }}</code>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-tag</v-icon>
              </template>
              <v-list-item-title>计划代码</v-list-item-title>
              <v-list-item-subtitle>{{ detail.planCode }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-shield-star</v-icon>
              </template>
              <v-list-item-title>会员等级</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getTierColor(detail.tier)" variant="outlined" size="small">
                  {{ getTierLabel(detail.tier) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-calendar-sync</v-icon>
              </template>
              <v-list-item-title>购买模式</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="getPurchaseModeColor(detail.purchaseMode)"
                  variant="tonal"
                  size="small"
                >
                  {{ getPurchaseModeLabel(detail.purchaseMode) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="12" md="6">
          <v-list density="comfortable" class="bg-transparent">
            <v-list-item>
              <template #prepend>
                <v-icon :color="getStatusColor(detail.status)">mdi-circle</v-icon>
              </template>
              <v-list-item-title>状态</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getStatusColor(detail.status)" variant="elevated" size="small">
                  {{ getStatusLabel(detail.status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon :color="detail.autoRenew ? 'success' : 'grey'">
                  {{ detail.autoRenew ? 'mdi-refresh-auto' : 'mdi-refresh-off' }}
                </v-icon>
              </template>
              <v-list-item-title>自动续费</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="detail.autoRenew ? 'success' : 'grey'" variant="tonal" size="small">
                  {{ detail.autoRenew ? '已启用' : '未启用' }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="detail.contractId">
              <template #prepend>
                <v-icon color="primary">mdi-file-document-outline</v-icon>
              </template>
              <v-list-item-title>合约ID</v-list-item-title>
              <v-list-item-subtitle>
                <code class="workspace-code">{{ detail.contractId }}</code>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="detail.billingAnchorDay">
              <template #prepend>
                <v-icon color="primary">mdi-calendar-clock</v-icon>
              </template>
              <v-list-item-title>计费锚点日</v-list-item-title>
              <v-list-item-subtitle>每月 {{ detail.billingAnchorDay }} 日</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-calendar-plus</v-icon>
              </template>
              <v-list-item-title>创建时间</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(detail.createdAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <!-- Cancellation Information -->
      <template v-if="detail.cancelAt || detail.cancelReason">
        <v-divider class="my-4"></v-divider>
        <v-row>
          <v-col cols="12">
            <h3 class="text-h6 mb-3 text-error">
              <v-icon class="mr-2">mdi-cancel</v-icon>
              取消信息
            </h3>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="comfortable" class="bg-transparent">
              <v-list-item v-if="detail.cancelAt">
                <template #prepend>
                  <v-icon color="error">mdi-calendar-remove</v-icon>
                </template>
                <v-list-item-title>计划取消时间</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(detail.cancelAt) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.cancelReason">
                <template #prepend>
                  <v-icon color="error">mdi-comment-text-outline</v-icon>
                </template>
                <v-list-item-title>取消原因</v-list-item-title>
                <v-list-item-subtitle>{{ detail.cancelReason }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type {
  MemberDetail,
  MembershipTier,
  PurchaseMode,
  SubscriptionStatus,
} from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';

defineProps<{
  detail: MemberDetail;
}>();

function getStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'canceled':
      return 'error';
    case 'expired':
      return 'grey';
    case 'signing':
      return 'info';
    case 'draft':
      return 'grey-lighten-1';
    default:
      return 'primary';
  }
}

function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    draft: '草稿',
    signing: '签约中',
    active: '活跃',
    past_due: '逾期',
    canceled: '已取消',
    expired: '已过期',
  };
  return labels[status] || status;
}

function getPurchaseModeColor(mode: PurchaseMode): string {
  switch (mode) {
    case 'auto_monthly':
      return 'success';
    case 'auto_yearly':
      return 'info';
    case 'one_time_month':
      return 'warning';
    default:
      return 'primary';
  }
}

function getPurchaseModeLabel(mode: PurchaseMode): string {
  const labels: Record<PurchaseMode, string> = {
    one_time_month: '一次性月度',
    auto_monthly: '按月续费',
    auto_yearly: '按年续费',
    one_time_year: '一次性年度',
  };
  return labels[mode] || mode;
}

function getTierColor(tier: MembershipTier): string {
  switch (tier) {
    case 'basic':
      return 'grey';
    case 'pro':
      return 'primary';
    case 'enterprise':
      return 'purple';
    default:
      return 'primary';
  }
}

function getTierLabel(tier: MembershipTier): string {
  const labels: Record<MembershipTier, string> = {
    basic: '基础版',
    pro: '专业版',
    enterprise: '企业版',
  };
  return labels[tier] || tier;
}
</script>

<style scoped>
.workspace-code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}
</style>
