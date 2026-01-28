<script setup lang="ts">
import { getMembershipPlans, type MembershipPlanDto } from '@/api/membershipApi';
import SubscribePricing, {
  type SubscriptionPlan,
} from '@/components/landing/pricing/components/SubscribePricing.vue';
import MembershipPaymentDialog from '@/components/zerocut/MembershipPaymentDialog.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type Cycle = 'monthly' | 'yearly' | 'one_time';

const loading = ref(false);
const rawPlans = ref<MembershipPlanDto[]>([]);
const error = ref<string | null>(null);
const selectedCycle = ref<Cycle>('yearly'); // Default to yearly
const membershipPaymentOpen = ref(false);
const selectedPlanForPayment = ref<MembershipPlanDto | null>(null);
const selectedPlanTitle = ref<string>('');

const snackbarStore = useSnackbarStore();
const { t, locale } = useI18n();

type PriceListTier = 'basic' | 'standard' | 'premium';

type ModeCell = {
  priceYuan: number;
  unitPriceYuanPerCredit: number;
  discountText?: string;
};

type TierComparisonRow = {
  tier: string;
  tierKey: PriceListTier;
  oneTime: ModeCell | undefined;
  autoMonthly: ModeCell | undefined;
  autoYearly: ModeCell | undefined;
  benefits: string[];
};

const PRICE_LIST_TIER_ORDER: PriceListTier[] = ['basic', 'standard', 'premium'];

function buildModeCell(params: {
  plan: MembershipPlanDto;
  monthlyCredits: number;
  oneTimeMonthlyPlan?: MembershipPlanDto;
}): ModeCell {
  const isYearly = params.plan.purchaseMode === 'auto_yearly';
  const intervalMonths = isYearly ? params.plan.billingIntervalMonths : 1;
  const totalCredits = params.monthlyCredits * intervalMonths;
  const unitPriceYuanPerCredit =
    totalCredits > 0 ? params.plan.priceYuan / totalCredits : params.plan.priceYuan;

  let discountText: string | undefined;
  if (params.oneTimeMonthlyPlan && params.oneTimeMonthlyPlan.priceYuan > 0) {
    const basePrice = params.oneTimeMonthlyPlan.priceYuan * intervalMonths;
    const percent = Math.round((1 - params.plan.priceYuan / basePrice) * 100);
    if (Number.isFinite(percent) && percent > 0) {
      discountText = t('zerocut.membership.priceList.formats.savePercent', { percent });
    }
  }

  return {
    priceYuan: params.plan.priceYuan,
    unitPriceYuanPerCredit,
    discountText,
  };
}

/**
 * Tier name mapping
 */
const TIER_NAME_KEYS: Record<string, string> = {
  basic: 'zerocut.membership.tiers.basic',
  standard: 'zerocut.membership.tiers.standard',
  premium: 'zerocut.membership.tiers.premium',
};

/**
 * Tier feature descriptions
 */
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

/**
 * Format price display
 */
function formatPrice(plan: MembershipPlanDto): string {
  if (plan.purchaseMode === 'auto_monthly') {
    return t('zerocut.membership.prices.monthly', { price: plan.priceYuan });
  } else if (plan.purchaseMode === 'auto_yearly') {
    return t('zerocut.membership.prices.yearly', { price: plan.priceYuan });
  } else {
    return t('zerocut.membership.prices.oneTime', { price: plan.priceYuan });
  }
}

/**
 * Format credits display
 */
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

function formatUnitPrice(unitPriceYuanPerCredit: number): string {
  return t('zerocut.membership.priceList.formats.unitPrice', {
    price: unitPriceYuanPerCredit.toFixed(3),
  });
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
    const oneTimePlan = tierPlanMap[tier]?.one_time_month;
    const autoMonthlyPlan = tierPlanMap[tier]?.auto_monthly;
    const autoYearlyPlan = tierPlanMap[tier]?.auto_yearly;

    const samplePlan = oneTimePlan || autoMonthlyPlan || autoYearlyPlan;
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
      oneTime: oneTimePlan
        ? buildModeCell({ plan: oneTimePlan, monthlyCredits, oneTimeMonthlyPlan: oneTimePlan })
        : undefined,
      autoMonthly: autoMonthlyPlan
        ? buildModeCell({ plan: autoMonthlyPlan, monthlyCredits, oneTimeMonthlyPlan: oneTimePlan })
        : undefined,
      autoYearly: autoYearlyPlan
        ? buildModeCell({ plan: autoYearlyPlan, monthlyCredits, oneTimeMonthlyPlan: oneTimePlan })
        : undefined,
      benefits,
    };
  });

  return rows.filter((row): row is TierComparisonRow => row !== null);
});

/**
 * Filter and convert to display format
 */
const displayPlans = computed<SubscriptionPlan[]>(() => {
  locale.value;

  // Filter by selected cycle
  const cycleFilterMap: Record<Cycle, string[]> = {
    yearly: ['auto_yearly'],
    monthly: ['auto_monthly'],
    one_time: ['one_time_month'],
  };

  const allowedModes = cycleFilterMap[selectedCycle.value];
  const filtered = rawPlans.value.filter(p => allowedModes.includes(p.purchaseMode));

  // Convert to SubscriptionPlan format
  return filtered.map(plan => ({
    planName: t(TIER_NAME_KEYS[plan.tier] ?? 'zerocut.membership.tiers.unknown', {
      tier: plan.tier,
    }),
    price: formatPrice(plan),
    credits: formatCredits(plan.monthlyCredits),
    features: formatPlanFeatures(plan),
    productId: plan.code,
  }));
});

/**
 * Check if specific cycle plans exist
 */
const hasYearly = computed(() => rawPlans.value.some(p => p.purchaseMode === 'auto_yearly'));
const hasMonthly = computed(() => rawPlans.value.some(p => p.purchaseMode === 'auto_monthly'));
const hasOneTime = computed(() => rawPlans.value.some(p => p.purchaseMode === 'one_time_month'));

/**
 * Fetch membership plans data
 */
async function fetchMembershipPlans() {
  try {
    loading.value = true;
    error.value = null;
    rawPlans.value = await getMembershipPlans(true);
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

/**
 * Handle subscribe button click
 */
function handleSubscribe(productId: string, planName: string) {
  const plan = rawPlans.value.find(p => p.code === productId);
  if (!plan) {
    snackbarStore.showErrorMessage(t('zerocut.membership.errors.fetchPlansFailed'));
    return;
  }

  if (selectedCycle.value === 'one_time' && plan.purchaseMode === 'one_time_month') {
    selectedPlanForPayment.value = plan;
    selectedPlanTitle.value = planName;
    membershipPaymentOpen.value = true;
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

function handleMembershipPaymentSuccess() {
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
}

function handleMembershipPaymentCancel() {
  membershipPaymentOpen.value = false;
  selectedPlanForPayment.value = null;
  selectedPlanTitle.value = '';
}

onMounted(fetchMembershipPlans);
</script>

<template>
  <v-container fluid>
    <v-card class="section-card mb-6">
      <v-card-text class="d-flex justify-center py-4">
        <v-btn-toggle v-model="selectedCycle" mandatory density="comfortable" color="primary">
          <v-btn v-if="hasYearly" value="yearly">{{ t('zerocut.membership.cycles.yearly') }}</v-btn>
          <v-btn v-if="hasMonthly" value="monthly">{{
            t('zerocut.membership.cycles.monthly')
          }}</v-btn>
          <v-btn v-if="hasOneTime" value="one_time">{{
            t('zerocut.membership.cycles.one_time')
          }}</v-btn>
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

    <!-- Error alert -->
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
              <th class="text-left">{{ t('zerocut.membership.priceList.headers.autoYearly') }}</th>
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
                    {{ formatUnitPrice(row.oneTime.unitPriceYuanPerCredit) }}
                  </div>
                  <div v-if="row.oneTime.discountText" class="price-sub">
                    {{ row.oneTime.discountText }}
                  </div>
                </template>
                <template v-else>-</template>
              </td>
              <td class="price-cell">
                <template v-if="row.autoMonthly">
                  <div class="price-main">{{ formatYuanPrice(row.autoMonthly.priceYuan) }}</div>
                  <div class="price-sub">
                    {{ formatUnitPrice(row.autoMonthly.unitPriceYuanPerCredit) }}
                  </div>
                  <div v-if="row.autoMonthly.discountText" class="price-sub">
                    {{ row.autoMonthly.discountText }}
                  </div>
                </template>
                <template v-else>-</template>
              </td>
              <td class="price-cell">
                <template v-if="row.autoYearly">
                  <div class="price-main">{{ formatYuanYearly(row.autoYearly.priceYuan) }}</div>
                  <div class="price-sub">
                    {{ formatUnitPrice(row.autoYearly.unitPriceYuanPerCredit) }}
                  </div>
                  <div v-if="row.autoYearly.discountText" class="price-sub">
                    {{ row.autoYearly.discountText }}
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

    <!-- Empty state -->
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
  </v-container>
</template>

<style scoped lang="scss">
.section-card {
  background: rgb(var(--v-theme-surface));
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
