<script setup lang="ts">
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import {
  cancelSubscription,
  getCurrentSubscription,
  getMembershipPlans,
  type MembershipPlanDto,
  type SubscriptionDetails,
} from '@/api/membershipApi';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ApiError } from '@/types/api';
import { formatDate } from '@/utils/date';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const snackbarStore = useSnackbarStore();
const { t } = useI18n();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const cancelDialogOpen = ref(false);
const cancelling = ref(false);
const cancelReason = ref('');

const loading = ref(false);
const error = ref<string | null>(null);
const subscription = ref<SubscriptionDetails | null>(null);
const membershipPlans = ref<MembershipPlanDto[]>([]);

const workspaceId = computed(() => workspaceStore.currentWorkspaceId);
const workspaceName = computed(() => workspaceStore.currentWorkspaceName);

const currentPlan = computed(() => {
  if (!subscription.value) return null;
  return membershipPlans.value.find(p => p.code === subscription.value?.planCode) ?? null;
});

const planName = computed(() => {
  if (currentPlan.value?.name) return currentPlan.value.name;
  if (!subscription.value) return '';
  if (subscription.value.tier === 'basic') return t('zerocut.membership.tiers.basic');
  if (subscription.value.tier === 'standard') return t('zerocut.membership.tiers.standard');
  if (subscription.value.tier === 'premium') return t('zerocut.membership.tiers.premium');
  return t('zerocut.membership.tiers.unknown', { tier: subscription.value.tier });
});

const billingModeText = computed(() => {
  if (!subscription.value) return '';
  if (subscription.value.purchaseMode === 'auto_yearly') {
    return t('zerocut.membership.priceList.headers.autoYearly');
  }
  if (subscription.value.purchaseMode === 'auto_monthly') {
    return t('zerocut.membership.priceList.headers.autoMonthly');
  }
  return t('zerocut.membership.priceList.headers.oneTime');
});

const statusChip = computed(() => {
  const status = subscription.value?.status;
  if (status === 'active') {
    return { color: 'success', text: t('zerocut.plansAndBilling.status.active') };
  }
  if (status === 'past_due') {
    return { color: 'warning', text: t('zerocut.plansAndBilling.status.active') };
  }
  if (status === 'canceled') {
    return { color: 'info', text: t('zerocut.plansAndBilling.status.canceled') };
  }
  return { color: 'default', text: t('common.unknown') };
});

const priceText = computed(() => {
  if (!currentPlan.value) return '-';
  const currency = currentPlan.value.currency;
  if (currency === 'CNY') return `¥${currentPlan.value.priceYuan}`;
  return `${currentPlan.value.priceYuan} ${currency}`;
});

const nextBillingText = computed(() => {
  if (!subscription.value?.nextBillingAt) return '-';
  return formatDate(subscription.value.nextBillingAt);
});

const currentPeriodEndText = computed(() => {
  if (!subscription.value?.currentPeriodEndAt) return '-';
  return formatDate(subscription.value.currentPeriodEndAt);
});

const canCancel = computed(() => {
  if (!subscription.value) return false;
  return subscription.value.status === 'active' || subscription.value.status === 'past_due';
});

function openCancelDialog() {
  cancelReason.value = '';
  cancelDialogOpen.value = true;
}

async function loadData() {
  if (!workspaceId.value) {
    error.value = '缺少工作空间信息，请刷新页面后重试';
    subscription.value = null;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const [plansResult, subscriptionResult] = await Promise.all([
      getMembershipPlans(false),
      (async () => {
        try {
          return await getCurrentSubscription(workspaceId.value!);
        } catch (e) {
          const err = e as ApiError;
          if (err?.code === 404) return null;
          throw e;
        }
      })(),
    ]);

    membershipPlans.value = plansResult ?? [];
    subscription.value = subscriptionResult;
  } catch (e) {
    const err = e as ApiError;
    error.value = err?.message || '加载失败，请稍后重试';
    subscription.value = null;
  } finally {
    loading.value = false;
  }
}

async function confirmCancel() {
  if (!subscription.value || !workspaceId.value) return;

  try {
    cancelling.value = true;
    const updated = await cancelSubscription({
      workspaceId: workspaceId.value,
      subscriptionId: subscription.value.subscriptionId,
      reason: cancelReason.value.trim() ? cancelReason.value.trim() : undefined,
    });

    subscription.value = updated;
    snackbarStore.showSuccessMessage(t('zerocut.plansAndBilling.messages.cancelSuccess'));
    cancelDialogOpen.value = false;
  } catch (e) {
    const err = e as ApiError;
    snackbarStore.showErrorMessage(err?.message || '取消失败，请稍后重试');
  } finally {
    cancelling.value = false;
  }
}

onMounted(() => {
  loadData();
});

watch(
  () => workspaceId.value,
  () => {
    loadData();
  }
);
</script>

<template>
  <div>
    <ResponsivePageHeader
      :title="t('zerocut.plansAndBilling.title')"
      :subtitle="t('zerocut.plansAndBilling.subtitle')"
    />

    <v-row>
      <v-col cols="12" md="7">
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-h6 font-weight-bold">
              {{ t('zerocut.plansAndBilling.sections.current') }}
            </div>
            <v-chip v-if="subscription" size="small" variant="tonal" :color="statusChip.color">
              {{ statusChip.text }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="workspaceName" variant="tonal" type="info" class="mb-4">
              <div class="text-body-2">当前工作空间：{{ workspaceName }}</div>
            </v-alert>

            <div v-if="loading">
              <v-skeleton-loader type="list-item-three-line, list-item-three-line" />
            </div>

            <div v-else-if="error">
              <v-alert variant="tonal" type="error" class="mb-4">
                {{ error }}
              </v-alert>
              <v-btn variant="outlined" @click="loadData">{{ t('common.refresh') }}</v-btn>
            </div>

            <div v-else-if="!subscription">
              <v-alert variant="tonal" type="info" class="mb-4"> 暂无生效中的会员订阅 </v-alert>
              <v-btn color="primary" variant="elevated" @click="router.push('/membership')">
                {{ t('zerocut.plansAndBilling.cancel.viewPlans') }}
              </v-btn>
            </div>

            <v-list v-else density="compact" class="pa-0">
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.plan') }}：
                  <span class="font-weight-medium">{{ planName }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.billingMode') }}：
                  <span class="font-weight-medium">{{ billingModeText }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.price') }}：
                  <span class="font-weight-medium text-primary">
                    {{ priceText }}
                  </span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  当前周期剩余积分：
                  <span class="font-weight-medium">
                    {{ subscription.remainingInCurrentPeriod }}
                  </span>
                  <span class="text-medium-emphasis"> / {{ subscription.monthlyQuota }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.nextBillingAt') }}：
                  <span class="font-weight-medium">{{ nextBillingText }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.currentPeriodEndAt') }}：
                  <span class="font-weight-medium">{{ currentPeriodEndText }}</span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            {{ t('zerocut.plansAndBilling.sections.cancel') }}
          </v-card-title>
          <v-card-text>
            <div class="text-body-2 text-medium-emphasis mb-3">
              {{ t('zerocut.plansAndBilling.cancel.description') }}
            </div>
            <v-alert variant="tonal" type="info" class="mb-4">
              <div class="text-body-2">
                {{ t('zerocut.plansAndBilling.cancel.pathTitle') }}
              </div>
              <div class="text-body-2 mt-1">
                {{ t('zerocut.plansAndBilling.cancel.path') }}
              </div>
            </v-alert>
            <v-btn
              color="error"
              variant="outlined"
              :disabled="!canCancel"
              @click="openCancelDialog"
            >
              {{ t('zerocut.plansAndBilling.cancel.button') }}
            </v-btn>
            <v-btn class="ml-2" variant="text" @click="router.push('/membership')">
              {{ t('zerocut.plansAndBilling.cancel.viewPlans') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="cancelDialogOpen" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          {{ t('zerocut.plansAndBilling.cancel.dialogTitle') }}
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('zerocut.plansAndBilling.cancel.dialogDesc') }}
          </div>
          <v-textarea
            v-model="cancelReason"
            class="mt-4"
            variant="outlined"
            label="取消原因（可选）"
            :counter="200"
            :maxlength="200"
            rows="3"
            auto-grow
          />
          <div
            v-if="subscription?.currentPeriodEndAt"
            class="text-body-2 text-medium-emphasis mt-2"
          >
            取消后仍可使用至：{{ currentPeriodEndText }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="cancelling" @click="cancelDialogOpen = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="elevated" :loading="cancelling" @click="confirmCancel">
            {{ t('zerocut.plansAndBilling.cancel.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
