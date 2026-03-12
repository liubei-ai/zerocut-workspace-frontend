<script setup lang="ts">
import {
  getMembershipPlans,
  type MembershipPlanDto,
  type SigningSessionStatus,
} from '@/api/membershipApi';
import SubscribePricing, {
  type PriceDisplay,
  type SubscriptionPlan,
} from '@/components/landing/pricing/components/SubscribePricing.vue';
import MembershipPaymentDialog from '@/components/zerocut/MembershipPaymentDialog.vue';
import MembershipSigningDialog from '@/components/zerocut/MembershipSigningDialog.vue';
import SubscriptionSuccessDialog from '@/components/zerocut/SubscriptionSuccessDialog.vue';
import { useMembershipStore } from '@/stores/membershipStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type Cycle = 'monthly' | 'yearly' | 'one_time_month' | 'one_time_year';

interface OrderInfo {
  codeUrl: string;
  outTradeNo: string;
  subscriptionId: number;
  expiresAt: string;
}

const loading = ref(false);
const rawPlans = ref<MembershipPlanDto[]>([]);
const error = ref<string | null>(null);
const selectedCycle = ref<Cycle>('one_time_month');
const membershipPaymentOpen = ref(false);
const selectedPlanForPayment = ref<MembershipPlanDto | null>(null);
const selectedPlanTitle = ref<string>('');
const membershipSigningOpen = ref(false);
const selectedPlanForSigning = ref<MembershipPlanDto | null>(null);
const selectedSigningTitle = ref<string>('');
const subscriptionSuccessOpen = ref(false);
const successSubscriptionId = ref<number | null>(null);

const snackbarStore = useSnackbarStore();
const membershipStore = useMembershipStore();
const workspaceStore = useWorkspaceStore();
const { t, locale } = useI18n();
const router = useRouter();

type PriceListTier = 'basic' | 'standard' | 'premium';

type ModeCell = {
  priceYuan: number;
  unitPriceYuanPer100: number;
  discountZhe: number;
};

type TierComparisonRow = {
  tier: string;
  tierKey: PriceListTier;
  oneTime: ModeCell | undefined;
  autoMonthly: ModeCell | undefined;
  oneTimeYear: ModeCell | undefined;
  benefits: string[];
};

const PRICE_LIST_TIER_ORDER: PriceListTier[] = ['basic', 'standard', 'premium'];

function buildModeCell(params: {
  plan: MembershipPlanDto;
  monthlyCredits: number;
  oneTimeMonthlyPlan?: MembershipPlanDto;
}): ModeCell {
  return {
    priceYuan: params.plan.priceYuan,
    discountZhe: params.plan.discountZhe,
    unitPriceYuanPer100: params.plan.unitPriceYuanPer100,
  };
}

const TIER_NAME_KEYS: Record<string, string> = {
  basic: 'zerocut.membership.tiers.basic',
  standard: 'zerocut.membership.tiers.standard',
  premium: 'zerocut.membership.tiers.premium',
};

function formatPlanFeatures(plan: MembershipPlanDto): string[] {
  const sorted = [...(plan.features ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted
    .map(feature => {
      if (feature.i18nKey) {
        return t(feature.i18nKey, feature.i18nParams ?? {});
      }
      if (feature.label) {
        return feature.label;
      }
      return feature.key;
    })
    .filter(Boolean);
}

function formatPrice(
  plan: MembershipPlanDto,
  allPlans: MembershipPlanDto[]
): string | PriceDisplay {
  if (plan.purchaseMode === 'auto_monthly') {
    return t('zerocut.membership.prices.monthly', { price: plan.priceYuan });
  } else if (plan.purchaseMode === 'one_time_month') {
    // One-time monthly: display as "¥XX/月"
    return t('zerocut.membership.prices.monthly', { price: plan.priceYuan });
  } else if (plan.purchaseMode === 'auto_yearly' || plan.purchaseMode === 'one_time_year') {
    // Yearly plans: return structured price object
    const monthlyPrice = (plan.priceYuan / 12).toFixed(2);

    // Calculate discount percentage based on one_time_month price
    const oneTimeMonthlyPlan = allPlans.find(
      p => p.tier === plan.tier && p.purchaseMode === 'one_time_month'
    );

    let discount: string | undefined;
    if (oneTimeMonthlyPlan && oneTimeMonthlyPlan.priceYuan > 0) {
      const basePrice = oneTimeMonthlyPlan.priceYuan * 12;
      const percent = Math.round((1 - plan.priceYuan / basePrice) * 100);
      if (Number.isFinite(percent) && percent > 0) {
        discount = t('zerocut.membership.prices.discount', { percent });
      }
    }

    return {
      main: t('zerocut.membership.prices.yearly', { price: plan.priceYuan }),
      monthlyEquivalent: t('zerocut.membership.prices.monthlyEquivalent', { price: monthlyPrice }),
      discount,
    };
  } else {
    return t('zerocut.membership.prices.oneTime', { price: plan.priceYuan });
  }
}

function formatCredits(monthlyCredits: number): string {
  return t('zerocut.membership.credits.monthly', {
    credits: monthlyCredits.toLocaleString(),
  });
}

function formatYuanPrice(priceYuan: number): string {
  return t('zerocut.membership.priceList.formats.priceYuan', { price: priceYuan });
}

function formatYuanYearly(priceYuan: number): string {
  return t('zerocut.membership.priceList.formats.priceYearly', { price: priceYuan });
}

function formatUnitPricePer100(unitPriceYuanPer100: number): string {
  return t('zerocut.membership.priceList.formats.unitPricePer100', {
    price: unitPriceYuanPer100.toFixed(2),
  });
}

function formatDiscountPer100(discountZhe: number): string {
  return t('zerocut.membership.priceList.formats.discountPer100', {
    discount: discountZhe.toFixed(1),
  });
}

function getDiscountLabelByUnitPricePer100(plan: MembershipPlanDto): string | undefined {
  const discountZhe = plan.discountZhe;
  if (!Number.isFinite(discountZhe) || discountZhe <= 0 || discountZhe >= 10) return undefined;
  return formatDiscountPer100(discountZhe);
}

const priceComparisonRows = computed<TierComparisonRow[]>(() => {
  locale.value;

  const tierPlanMap = rawPlans.value.reduce(
    (acc, plan) => {
      if (!acc[plan.tier]) {
        acc[plan.tier] = {};
      }
      acc[plan.tier][plan.purchaseMode] = plan;
      return acc;
    },
    {} as Record<
      PriceListTier,
      Partial<Record<MembershipPlanDto['purchaseMode'], MembershipPlanDto>>
    >
  );

  const rows = PRICE_LIST_TIER_ORDER.map(tier => {
    const oneTimeMonthlyPlan = tierPlanMap[tier]?.one_time_month;
    const oneTimeYearlyPlan = tierPlanMap[tier]?.one_time_year;
    const autoMonthlyPlan = tierPlanMap[tier]?.auto_monthly;

    const samplePlan = oneTimeMonthlyPlan || oneTimeYearlyPlan || autoMonthlyPlan;
    if (!samplePlan) {
      return null;
    }

    const tierName = t(TIER_NAME_KEYS[tier]);
    const monthlyCredits = samplePlan.monthlyCredits;
    const monthlyCreditsText = monthlyCredits.toLocaleString();
    const benefits: string[] = [
      t('zerocut.membership.priceList.benefits.monthlyCredits', { credits: monthlyCreditsText }),
      ...formatPlanFeatures(samplePlan),
    ];

    return {
      tier: tierName,
      tierKey: tier,
      oneTime: oneTimeMonthlyPlan
        ? buildModeCell({ plan: oneTimeMonthlyPlan, monthlyCredits, oneTimeMonthlyPlan })
        : undefined,
      autoMonthly: autoMonthlyPlan
        ? buildModeCell({ plan: autoMonthlyPlan, monthlyCredits, oneTimeMonthlyPlan })
        : undefined,
      oneTimeYear: oneTimeYearlyPlan
        ? buildModeCell({ plan: oneTimeYearlyPlan, monthlyCredits, oneTimeMonthlyPlan })
        : undefined,
      benefits,
    };
  });

  return rows.filter((row): row is TierComparisonRow => row !== null);
});

const displayPlans = computed<SubscriptionPlan[]>(() => {
  locale.value;

  const cycleFilterMap: Record<Cycle, string[]> = {
    yearly: ['auto_yearly'],
    monthly: ['auto_monthly'],
    one_time_month: ['one_time_month'],
    one_time_year: ['one_time_year'],
  };

  const allowedModes = cycleFilterMap[selectedCycle.value];
  const filtered = rawPlans.value.filter(p => allowedModes.includes(p.purchaseMode));

  return filtered.map(plan => {
    const basePrice = formatPrice(plan, rawPlans.value);
    const discountLabel = getDiscountLabelByUnitPricePer100(plan);

    const price: string | PriceDisplay = discountLabel
      ? typeof basePrice === 'string'
        ? { main: basePrice, discount: discountLabel }
        : { ...basePrice, discount: discountLabel }
      : basePrice;

    return {
      planName: t(TIER_NAME_KEYS[plan.tier] ?? 'zerocut.membership.tiers.unknown', {
        tier: plan.tier,
      }),
      price,
      credits: formatCredits(plan.monthlyCredits),
      features: formatPlanFeatures(plan),
      productId: plan.code,
      // Mark as current subscription if matches planCode and status is active
      isCurrentSubscription:
        membershipStore.subscription !== null &&
        membershipStore.subscription.planCode === plan.code &&
        membershipStore.subscription.status === 'active',
    };
  });
});

const hasYearly = computed(() => rawPlans.value.some(p => p.purchaseMode === 'auto_yearly'));
const hasMonthly = computed(() => rawPlans.value.some(p => p.purchaseMode === 'auto_monthly'));
const hasOneTimeMonth = computed(() =>
  rawPlans.value.some(p => p.purchaseMode === 'one_time_month')
);
const hasOneTimeYear = computed(() => rawPlans.value.some(p => p.purchaseMode === 'one_time_year'));

const statusBarState = computed<'none' | 'expired' | 'active'>(() => {
  const sub = membershipStore.subscription;
  if (!sub) return 'none';
  if (sub.status === 'expired') return 'expired';
  if (sub.status === 'active') return 'active';
  return 'none';
});

const formattedExpiryDate = computed(() => {
  const date = membershipStore.expiryDate;
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale.value === 'zhHans' ? 'zh-CN' : locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
});

const statusBarClass = computed(() => ({
  'status-none': statusBarState.value === 'none',
  'status-expired': statusBarState.value === 'expired',
  'status-active': statusBarState.value === 'active',
}));

const statusBarIcon = computed(() => {
  if (statusBarState.value === 'expired') return 'mdi-account-clock-outline';
  if (statusBarState.value === 'active') return 'mdi-account-check-outline';
  return 'mdi-account-off-outline';
});

const statusBarIconColor = computed(() => {
  if (statusBarState.value === 'active') return 'primary';
  if (statusBarState.value === 'expired') return 'error';
  return undefined;
});

async function fetchMembershipPlans() {
  try {
    loading.value = true;
    error.value = null;

    const [plans] = await Promise.all([getMembershipPlans(), membershipStore.refresh()]);

    rawPlans.value = plans ?? [];
  } catch (e: unknown) {
    let message: string | null = null;
    if (e instanceof Error) {
      message = e.message;
    } else if (typeof e === 'object' && e !== null && 'message' in e) {
      const maybeMessage = (e as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        message = maybeMessage;
      }
    }
    error.value = message || t('zerocut.membership.errors.fetchPlansFailed');
    snackbarStore.showErrorMessage(error.value);
  } finally {
    loading.value = false;
  }
}

function handleSubscribe(productId: string, planName: string) {
  const plan = rawPlans.value.find(p => p.code === productId);
  if (!plan) {
    snackbarStore.showErrorMessage(t('zerocut.membership.errors.fetchPlansFailed'));
    return;
  }

  if (plan.purchaseMode === 'one_time_month' || plan.purchaseMode === 'one_time_year') {
    selectedPlanForPayment.value = plan;
    selectedPlanTitle.value = planName;
    membershipPaymentOpen.value = true;
    return;
  }

  if (plan.purchaseMode === 'auto_monthly' || plan.purchaseMode === 'auto_yearly') {
    selectedPlanForSigning.value = plan;
    selectedSigningTitle.value = planName;
    membershipSigningOpen.value = true;
    return;
  }

  const cycleName = t(`zerocut.membership.cycles.${selectedCycle.value}`);
  snackbarStore.showInfoMessage(
    t('zerocut.membership.messages.selectedPlan', {
      planName,
      cycle: cycleName,
      productId,
    })
  );
}

function handleMembershipPaymentSuccess(orderInfo: OrderInfo) {
  membershipPaymentOpen.value = false;
  if (selectedPlanForPayment.value) {
    snackbarStore.showSuccessMessage(
      t('zerocut.membership.messages.selectedPlan', {
        planName: selectedPlanTitle.value || selectedPlanForPayment.value.code,
        cycle: t('zerocut.membership.cycles.one_time'),
        productId: selectedPlanForPayment.value.code,
      })
    );
  }
  selectedPlanForPayment.value = null;
  selectedPlanTitle.value = '';

  // 显示订阅成功弹窗
  if (orderInfo.subscriptionId) {
    successSubscriptionId.value = orderInfo.subscriptionId;
    subscriptionSuccessOpen.value = true;
  } else {
    // 如果没有订阅ID，直接跳转到计划页面
    router.push('/plans-and-billing');
  }
}

function handleMembershipPaymentCancel() {
  membershipPaymentOpen.value = false;
  selectedPlanForPayment.value = null;
  selectedPlanTitle.value = '';
}

function handleMembershipSigningSuccess(status: SigningSessionStatus) {
  membershipSigningOpen.value = false;
  const planLabel = selectedSigningTitle.value || selectedPlanForSigning.value?.code || '';
  const suffix = status.subscriptionId ? `（订阅ID：${status.subscriptionId}）` : '';
  snackbarStore.showSuccessMessage(`签约成功：${planLabel}${suffix}`);
  selectedPlanForSigning.value = null;
  selectedSigningTitle.value = '';

  // 显示订阅成功弹窗
  if (status.subscriptionId) {
    successSubscriptionId.value = status.subscriptionId;
    subscriptionSuccessOpen.value = true;
  } else {
    // 如果没有订阅ID，直接跳转到计划页面
    router.push('/plans-and-billing');
  }
}

function handleMembershipSigningCancel() {
  membershipSigningOpen.value = false;
  selectedPlanForSigning.value = null;
  selectedSigningTitle.value = '';
}

// 处理查看订阅详情
function handleSubscriptionSuccessViewDetails() {
  subscriptionSuccessOpen.value = false;
  successSubscriptionId.value = null;
  membershipStore.refresh();
  router.push('/plans-and-billing');
}

// 处理关闭订阅成功弹窗
function handleSubscriptionSuccessClose() {
  subscriptionSuccessOpen.value = false;
  successSubscriptionId.value = null;
  membershipStore.refresh();
}

onMounted(fetchMembershipPlans);
</script>

<template>
  <v-container fluid>
    <!-- Membership Status Bar -->
    <v-card class="membership-status-bar mb-4" :class="statusBarClass" variant="flat">
      <v-card-text class="d-flex align-center justify-space-between py-3 px-5">
        <!-- Left: icon + info -->
        <div class="d-flex align-center ga-3">
          <div class="status-icon-wrap" :class="statusBarClass">
            <v-icon :color="statusBarIconColor" size="20">{{ statusBarIcon }}</v-icon>
          </div>

          <div>
            <template v-if="statusBarState === 'none'">
              <div class="status-label">{{ t('zerocut.membership.statusBar.noMembership') }}</div>
            </template>
            <template v-else-if="statusBarState === 'expired'">
              <div class="status-label status-label--error">
                {{ t('zerocut.membership.statusBar.expired') }}
              </div>
              <div class="status-sub">
                {{ t('zerocut.membership.statusBar.expiredAt', { date: formattedExpiryDate }) }}
              </div>
            </template>
            <template v-else>
              <div class="d-flex align-center ga-2">
                <span class="status-label">
                  {{ membershipStore.tierI18nKey ? t(membershipStore.tierI18nKey) : '' }}
                </span>
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="credits-chip"
                  @click="router.push('/wallet')"
                >
                  <v-icon start size="12">mdi-lightning-bolt</v-icon>
                  {{ membershipStore.availableCredits.toLocaleString() }}
                  {{ t('zerocut.membership.statusBar.creditsUnit') }}
                </v-chip>
              </div>
              <div class="status-sub">
                {{ t('zerocut.membership.statusBar.validUntil', { date: formattedExpiryDate }) }}
              </div>
            </template>
          </div>
        </div>

        <!-- Right: actions -->
        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="statusBarState === 'active'"
            size="small"
            color="primary"
            variant="tonal"
            @click="router.push('/packages')"
          >
            {{ t('zerocut.membership.statusBar.buyCredits') }}
          </v-btn>
          <v-btn size="small" variant="outlined" @click="router.push('/plans-and-billing')">
            {{ t('zerocut.membership.statusBar.manageSubscription') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="section-card mb-6">
      <v-card-text class="d-flex justify-center py-4">
        <v-btn-toggle v-model="selectedCycle" mandatory density="comfortable" color="primary">
          <v-btn v-if="hasOneTimeMonth" value="one_time_month">{{
            t('zerocut.membership.cycles.one_time_month')
          }}</v-btn>
          <v-btn v-if="hasMonthly" value="monthly">{{
            t('zerocut.membership.cycles.monthly')
          }}</v-btn>
          <v-btn v-if="hasOneTimeYear" value="one_time_year">{{
            t('zerocut.membership.cycles.one_time_year')
          }}</v-btn>
          <v-btn v-if="hasYearly" value="yearly">{{ t('zerocut.membership.cycles.yearly') }}</v-btn>
        </v-btn-toggle>
      </v-card-text>
      <v-card-text class="pa-0">
        <SubscribePricing
          embedded
          :plans="displayPlans"
          :loading="loading"
          @subscribe="handleSubscribe"
        />
      </v-card-text>
    </v-card>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card class="section-card mt-6">
      <v-card-title class="text-h6 font-weight-bold text-center">
        {{ t('zerocut.membership.priceList.title') }}
      </v-card-title>
      <v-card-subtitle class="membership-subtitle text-center">
        {{ t('zerocut.membership.priceList.subtitle') }}
      </v-card-subtitle>
      <v-card-text class="pt-4">
        <v-table class="membership-compare-table" density="comfortable">
          <thead>
            <tr>
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.tier') }}</th>
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.oneTime') }}</th>
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.autoMonthly') }}</th>
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.oneTimeYear') }}</th>
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.benefits') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in priceComparisonRows" :key="row.tierKey">
              <td class="tier-cell">
                <div class="font-weight-bold">{{ row.tier }}</div>
              </td>
              <td class="price-cell">
                <template v-if="row.oneTime">
                  <div class="price-main">{{ formatYuanPrice(row.oneTime.priceYuan) }}</div>
                  <div class="price-sub">
                    {{ formatUnitPricePer100(row.oneTime.unitPriceYuanPer100) }}
                  </div>
                  <div class="price-sub">
                    {{ formatDiscountPer100(row.oneTime.discountZhe) }}
                  </div>
                </template>
                <template v-else>-</template>
              </td>
              <td class="price-cell">
                <template v-if="row.autoMonthly">
                  <div class="price-main">{{ formatYuanPrice(row.autoMonthly.priceYuan) }}</div>
                  <div class="price-sub">
                    {{ formatUnitPricePer100(row.autoMonthly.unitPriceYuanPer100) }}
                  </div>
                  <div class="price-sub">
                    {{ formatDiscountPer100(row.autoMonthly.discountZhe) }}
                  </div>
                </template>
                <template v-else>-</template>
              </td>
              <td class="price-cell">
                <template v-if="row.oneTimeYear">
                  <div class="price-main">{{ formatYuanYearly(row.oneTimeYear.priceYuan) }}</div>
                  <div class="price-sub">
                    {{ formatUnitPricePer100(row.oneTimeYear.unitPriceYuanPer100) }}
                  </div>
                  <div class="price-sub">
                    {{ formatDiscountPer100(row.oneTimeYear.discountZhe) }}
                  </div>
                </template>
                <template v-else>-</template>
              </td>
              <td class="benefits-cell">
                <ul class="benefits-list">
                  <li v-for="(b, idx) in row.benefits" :key="idx">
                    {{ b }}
                  </li>
                </ul>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-divider class="my-4"></v-divider>
        <div class="text-body-2 membership-subtitle">
          <div class="font-weight-medium mb-2">
            {{ t('zerocut.membership.priceList.notes.title') }}
          </div>
          <ul class="price-list-notes">
            <li>{{ t('zerocut.membership.priceList.notes.monthlyReset') }}</li>
            <li>{{ t('zerocut.membership.priceList.notes.noRollover') }}</li>
            <li>{{ t('zerocut.membership.priceList.notes.yearlyMonthlyQuota') }}</li>
          </ul>
        </div>
      </v-card-text>
    </v-card>

    <v-card
      v-if="!loading && displayPlans.length === 0 && !error"
      class="section-card text-center pa-8"
      variant="outlined"
    >
      <v-icon size="64" color="grey">mdi-package-variant</v-icon>
      <div class="text-h6 mt-4">{{ t('zerocut.membership.empty.title') }}</div>
      <div class="text-body-2 membership-subtitle mt-2">
        {{ t('zerocut.membership.empty.subtitle') }}
      </div>
    </v-card>

    <MembershipPaymentDialog
      v-model:open="membershipPaymentOpen"
      :membership-plan="selectedPlanForPayment"
      :title="selectedPlanTitle"
      @success="handleMembershipPaymentSuccess"
      @cancel="handleMembershipPaymentCancel"
    />

    <MembershipSigningDialog
      v-model:open="membershipSigningOpen"
      :membership-plan="selectedPlanForSigning"
      :title="selectedSigningTitle"
      @success="handleMembershipSigningSuccess"
      @cancel="handleMembershipSigningCancel"
    />

    <!-- 订阅成功弹窗 -->
    <SubscriptionSuccessDialog
      v-model="subscriptionSuccessOpen"
      :subscription-id="successSubscriptionId"
      :workspace-id="workspaceStore.currentWorkspaceId"
      @view-details="handleSubscriptionSuccessViewDetails"
      @close="handleSubscriptionSuccessClose"
    />
  </v-container>
</template>

<style scoped lang="scss">
.section-card {
  background: rgb(var(--v-theme-surface));
}

.membership-status-bar {
  border-radius: 12px;
  overflow: hidden;

  &.status-none {
    background: rgba(var(--v-theme-on-surface), 0.03);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  }

  &.status-expired {
    background: rgba(var(--v-theme-error), 0.06);
    border: 1px solid rgba(var(--v-theme-error), 0.2);
  }

  &.status-active {
    background: linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.07) 0%,
      rgba(var(--v-theme-primary), 0.03) 100%
    );
    border: 1px solid rgba(var(--v-theme-primary), 0.18);
  }
}

.status-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;

  &.status-none {
    background: rgba(var(--v-theme-on-surface), 0.06);
  }

  &.status-expired {
    background: rgba(var(--v-theme-error), 0.12);
  }

  &.status-active {
    background: rgba(var(--v-theme-primary), 0.1);
  }
}

.status-label {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 0.9);

  &--error {
    color: rgb(var(--v-theme-error));
  }
}

.status-sub {
  font-size: 0.75rem;
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.credits-chip {
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0;

  &:hover {
    opacity: 0.85;
  }
}

.membership-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.price-list-notes {
  margin: 0;
  padding-left: 18px;
}

.membership-compare-table {
  width: 100%;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.membership-compare-table thead th {
  background: rgba(var(--v-theme-on-surface), 0.045);
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 800;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 12px 14px;
}

.membership-compare-table thead th:not(:last-child) {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.membership-compare-table tbody td {
  color: rgba(var(--v-theme-on-surface), 0.86);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 12px 14px;
  vertical-align: top;
}

.membership-compare-table tbody td:not(:last-child) {
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.membership-compare-table tbody tr:nth-child(even) td {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.tier-cell {
  min-width: 120px;
}

.price-cell {
  min-width: 140px;
}

.price-main {
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.92);
  white-space: nowrap;
}

.price-sub {
  margin-top: 4px;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.benefits-cell {
  min-width: 280px;
}

.benefits-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.benefits-list li {
  margin-bottom: 6px;
}

.benefits-list li:last-child {
  margin-bottom: 0;
}
</style>
