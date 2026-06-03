<template>
  <v-container fluid>
    <!-- Breadcrumb Navigation -->
    <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4">
      <template #divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <!-- Loading State -->
    <div v-if="loading" class="mt-4">
      <v-skeleton-loader type="article, article, article"></v-skeleton-loader>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4">
      {{ error }}
    </v-alert>

    <!-- Detail Content -->
    <div v-else-if="detail">
      <!-- Page Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-btn icon variant="text" @click="goBack" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div>
              <h1 class="text-h4">会员详情</h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                订阅ID: {{ detail.subscriptionId }} | 工作空间: {{ detail.workspaceId }}
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Subscription Overview Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <SubscriptionOverviewSection :detail="detail" />
        </v-col>
      </v-row>

      <!-- Lifecycle Dates Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <LifecycleDatesSection :detail="detail" />
        </v-col>
      </v-row>

      <!-- Payment History Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <PaymentHistorySection :orders="detail.orders" @check="handleCheckOrder" />
        </v-col>
      </v-row>

      <!-- Credit Grants Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <CreditGrantsSection :credit-grants="detail.creditGrants" />
        </v-col>
      </v-row>

      <!-- Credit Periods Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <CreditPeriodsSection
            :credit-periods="detail.creditPeriods"
            :can-refund="canRefundPeriod"
            @refund="openRefundDialog"
          />
        </v-col>
      </v-row>
    </div>

    <OrderPaymentCheckDialog
      v-model:open="checkDialogOpen"
      :order="checkDialogOrder"
      @refresh="loadDetail"
    />

    <v-dialog v-model="refundDialog.show" max-width="520" :persistent="refundDialog.loading">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-cash-refund</v-icon>
          确认周期积分清零
        </v-card-title>
        <v-card-text>
          <v-alert
            type="warning"
            variant="tonal"
            density="comfortable"
            class="mb-4"
            text="将从账户余额扣减该周期「剩余可用积分」，并把周期标记为已撤销。已消费部分不会追回，操作不可撤销，订阅本身不会被取消。"
          />
          <div v-if="refundDialog.target" class="text-body-2 mb-3">
            <div>周期：周期 {{ refundDialog.target.periodIndex }}</div>
            <div>配额：{{ refundDialog.target.creditsQuota.toLocaleString('zh-CN') }}</div>
            <div>
              剩余可用积分：
              <span class="font-weight-medium text-error">
                {{ refundDialog.target.creditsRemaining.toLocaleString('zh-CN') }}
              </span>
            </div>
          </div>
          <v-textarea
            v-model="refundDialog.reason"
            label="退款原因（必填）"
            variant="outlined"
            density="comfortable"
            rows="3"
            counter="500"
            maxlength="500"
            :disabled="refundDialog.loading"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="refundDialog.loading" @click="closeRefundDialog">
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="refundDialog.loading"
            :disabled="!refundDialog.reason.trim()"
            @click="confirmRefundPeriod"
          >
            确认清零
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  getMemberDetail,
  refundSubscriptionPeriod,
  type CreditPeriodItem,
  type MemberDetail,
  type SubscriptionOrderItem,
} from '@/api/memberAdminApi';
import CreditGrantsSection from '@/components/admin/CreditGrantsSection.vue';
import CreditPeriodsSection from '@/components/admin/CreditPeriodsSection.vue';
import LifecycleDatesSection from '@/components/admin/LifecycleDatesSection.vue';
import OrderPaymentCheckDialog from '@/components/admin/OrderPaymentCheckDialog.vue';
import PaymentHistorySection from '@/components/admin/PaymentHistorySection.vue';
import SubscriptionOverviewSection from '@/components/admin/SubscriptionOverviewSection.vue';
import { Permission } from '@/constants/permissions';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const router = useRouter();

const detail = ref<MemberDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const checkDialogOpen = ref(false);
const checkDialogOrder = ref<SubscriptionOrderItem | null>(null);

function handleCheckOrder(order: SubscriptionOrderItem) {
  checkDialogOrder.value = order;
  checkDialogOpen.value = true;
}

const userStore = useUserStore();
const snackbar = useSnackbarStore();
const canRefundPeriod = computed(() => userStore.hasPermission(Permission.WALLET_GRANT));

// 积分清零弹窗
const refundDialog = ref<{
  show: boolean;
  loading: boolean;
  target: CreditPeriodItem | null;
  reason: string;
}>({ show: false, loading: false, target: null, reason: '' });

function openRefundDialog(item: CreditPeriodItem) {
  refundDialog.value = { show: true, loading: false, target: item, reason: '' };
}

function closeRefundDialog() {
  if (refundDialog.value.loading) return;
  refundDialog.value.show = false;
}

async function confirmRefundPeriod() {
  const target = refundDialog.value.target;
  const reason = refundDialog.value.reason.trim();
  if (!target || !subscriptionId.value) {
    snackbar.showErrorMessage('缺少周期或订阅ID，无法清零');
    return;
  }
  if (!reason) {
    snackbar.showErrorMessage('请填写退款原因');
    return;
  }
  refundDialog.value.loading = true;
  try {
    const res = await refundSubscriptionPeriod(subscriptionId.value, target.periodId, reason);
    snackbar.showSuccessMessage(`周期积分清零成功，扣减 ${res.refundedCredits} 积分`);
    refundDialog.value.show = false;
    await loadDetail();
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    const msg = err?.response?.data?.message || err?.message || '未知错误';
    snackbar.showErrorMessage(`周期积分清零失败：${msg}`);
  } finally {
    refundDialog.value.loading = false;
  }
}

const subscriptionId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

const breadcrumbs = computed(() => [
  {
    title: '会员管理',
    disabled: false,
    href: '/admin/members',
  },
  {
    title: '会员详情',
    disabled: true,
  },
]);

async function loadDetail() {
  if (!subscriptionId.value) {
    error.value = '无效的订阅ID';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    detail.value = await getMemberDetail(subscriptionId.value);
  } catch (err: any) {
    console.error('Failed to load member detail:', err);
    error.value = err.response?.data?.message || '加载会员详情失败';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/admin/members');
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
/* Page-specific styles */
</style>
