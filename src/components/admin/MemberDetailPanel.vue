<template>
  <v-card elevation="0" class="member-detail-panel">
    <v-card-text class="py-2">
      <v-row v-if="loading" class="my-2">
        <v-col cols="12">
          <v-skeleton-loader type="article"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else-if="detail">
        <!-- Subscription Overview Section -->
        <v-row class="mb-2">
          <v-col cols="12">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-information-outline</v-icon>
              订阅概览
            </h3>
          </v-col>
        </v-row>

        <v-row class="mb-3">
          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-identifier</v-icon>
                </template>
                <v-list-item-title class="text-body-2">订阅ID</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  detail.subscriptionId
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-briefcase</v-icon>
                </template>
                <v-list-item-title class="text-body-2">工作空间</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  <code class="text-caption">{{ detail.workspaceId }}</code>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-tag</v-icon>
                </template>
                <v-list-item-title class="text-body-2">计划代码</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  detail.planCode
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-shield-star</v-icon>
                </template>
                <v-list-item-title class="text-body-2">会员等级</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getTierColor(detail.tier)"
                    variant="outlined"
                    size="x-small"
                    class="text-caption"
                  >
                    {{ getTierLabel(detail.tier) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-calendar-sync</v-icon>
                </template>
                <v-list-item-title class="text-body-2">购买模式</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getPurchaseModeColor(detail.purchaseMode)"
                    variant="tonal"
                    size="x-small"
                    class="text-caption"
                  >
                    {{ getPurchaseModeLabel(detail.purchaseMode) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon :color="getStatusColor(detail.status)" size="small" class="mr-2"
                    >mdi-circle</v-icon
                  >
                </template>
                <v-list-item-title class="text-body-2">状态</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="getStatusColor(detail.status)"
                    variant="elevated"
                    size="x-small"
                    class="text-caption"
                  >
                    {{ getStatusLabel(detail.status) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon :color="detail.autoRenew ? 'success' : 'grey'" size="small" class="mr-2">
                    {{ detail.autoRenew ? 'mdi-refresh-auto' : 'mdi-refresh-off' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-body-2">自动续费</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="detail.autoRenew ? 'success' : 'grey'"
                    variant="tonal"
                    size="x-small"
                    class="text-caption"
                  >
                    {{ detail.autoRenew ? '已启用' : '未启用' }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.contractId" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2"
                    >mdi-file-document-outline</v-icon
                  >
                </template>
                <v-list-item-title class="text-body-2">合约ID</v-list-item-title>
                <v-list-item-subtitle>
                  <code class="text-caption">{{ detail.contractId }}</code>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.billingAnchorDay" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-calendar-clock</v-icon>
                </template>
                <v-list-item-title class="text-body-2">计费锚点日</v-list-item-title>
                <v-list-item-subtitle class="text-body-2"
                  >每月 {{ detail.billingAnchorDay }} 日</v-list-item-subtitle
                >
              </v-list-item>

              <v-list-item class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="primary" size="small" class="mr-2">mdi-calendar-plus</v-icon>
                </template>
                <v-list-item-title class="text-body-2">创建时间</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.createdAt)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <v-divider class="my-2"></v-divider>

        <!-- Lifecycle Dates Section -->
        <v-row class="mb-2">
          <v-col cols="12">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-calendar-range</v-icon>
              周期信息
            </h3>
          </v-col>
        </v-row>

        <v-row class="mb-3">
          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-if="detail.termStartAt" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="success" size="small" class="mr-2">mdi-calendar-start</v-icon>
                </template>
                <v-list-item-title class="text-body-2">订阅期开始</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.termStartAt)
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.termEndAt" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="error" size="small" class="mr-2">mdi-calendar-end</v-icon>
                </template>
                <v-list-item-title class="text-body-2">订阅期结束</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.termEndAt)
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.currentPeriodStartAt" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="info" size="small" class="mr-2">mdi-calendar-arrow-right</v-icon>
                </template>
                <v-list-item-title class="text-body-2">当前周期开始</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.currentPeriodStartAt)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-if="detail.currentPeriodEndAt" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="info" size="small" class="mr-2">mdi-calendar-arrow-left</v-icon>
                </template>
                <v-list-item-title class="text-body-2">当前周期结束</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.currentPeriodEndAt)
                }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item v-if="detail.nextActionAt" class="px-0 min-h-auto py-1">
                <template #prepend>
                  <v-icon color="warning" size="small" class="mr-2">mdi-calendar-clock</v-icon>
                </template>
                <v-list-item-title class="text-body-2">下次操作时间</v-list-item-title>
                <v-list-item-subtitle class="text-body-2">{{
                  formatDate(detail.nextActionAt)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <!-- Cancellation Info Section (if applicable) -->
        <template v-if="detail.cancelAt || detail.cancelReason">
          <v-divider class="my-2"></v-divider>

          <v-row class="mb-2">
            <v-col cols="12">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">
                <v-icon class="mr-1" size="small" color="error">mdi-cancel</v-icon>
                取消信息
              </h3>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item v-if="detail.cancelAt" class="px-0 min-h-auto py-1">
                  <template #prepend>
                    <v-icon color="error" size="small" class="mr-2">mdi-calendar-remove</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">计划取消时间</v-list-item-title>
                  <v-list-item-subtitle class="text-body-2">{{
                    formatDate(detail.cancelAt)
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="detail.cancelReason" class="px-0 min-h-auto py-1">
                  <template #prepend>
                    <v-icon color="error" size="small" class="mr-2"
                      >mdi-comment-text-outline</v-icon
                    >
                  </template>
                  <v-list-item-title class="text-body-2">取消原因</v-list-item-title>
                  <v-list-item-subtitle class="text-body-2">{{
                    detail.cancelReason
                  }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </template>
      </div>

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
        {{ error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import {
  getMemberDetail,
  type MemberDetail,
  type MembershipTier,
  type PurchaseMode,
  type SubscriptionStatus,
} from '@/api/memberAdminApi';
import { formatDate } from '@/utils/date';
import { ref, watch } from 'vue';

const props = defineProps<{
  subscriptionId: number;
}>();

const detail = ref<MemberDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function loadDetail() {
  loading.value = true;
  error.value = null;

  try {
    detail.value = await getMemberDetail(props.subscriptionId);
  } catch (err: any) {
    console.error('Failed to load member detail:', err);
    error.value = err.response?.data?.message || '加载会员详情失败';
  } finally {
    loading.value = false;
  }
}

// Watch for subscription ID changes
watch(
  () => props.subscriptionId,
  () => {
    loadDetail();
  },
  { immediate: true }
);

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
    one_time_year: '一次性年度',
    auto_monthly: '按月续费',
    auto_yearly: '按年续费',
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
.member-detail-panel {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.min-h-auto {
  min-height: auto !important;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8rem;
}

:deep(.v-list-item__prepend) {
  width: auto;
  min-width: 24px;
}

:deep(.v-list-item-title) {
  font-size: 0.875rem;
  line-height: 1.2;
}

:deep(.v-list-item-subtitle) {
  font-size: 0.875rem;
  line-height: 1.2;
}
</style>
