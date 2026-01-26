<script setup lang="ts">
import { getMembershipPlans, type MembershipPlanDto } from '@/api/membershipApi';
import SubscribePricing, {
  type SubscriptionPlan,
} from '@/components/landing/pricing/components/SubscribePricing.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type Cycle = 'monthly' | 'yearly' | 'one_time';

const loading = ref(false);
const rawPlans = ref<MembershipPlanDto[]>([]);
const error = ref<string | null>(null);
const selectedCycle = ref<Cycle>('yearly'); // Default to yearly

const snackbarStore = useSnackbarStore();
const { t, locale } = useI18n();

type PriceListTier = 'basic' | 'standard' | 'premium';

type ModeCell = {
  priceYuan: number;
  unitPriceYuanPerCredit: number;
  discountTextKey: string;
};

type TierComparisonRow = {
  tier: PriceListTier;
  monthlyCredits: number;
  oneTime: ModeCell;
  autoMonthly: ModeCell;
  autoYearly: ModeCell;
};

const PRICE_COMPARISON_ROWS: TierComparisonRow[] = [
  {
    tier: 'basic',
    monthlyCredits: 2500,
    oneTime: {
      priceYuan: 99,
      unitPriceYuanPerCredit: 0.04,
      discountTextKey: 'zerocut.membership.priceList.discounts.basic.oneTimeMonth',
    },
    autoMonthly: {
      priceYuan: 88,
      unitPriceYuanPerCredit: 0.035,
      discountTextKey: 'zerocut.membership.priceList.discounts.basic.autoMonthly',
    },
    autoYearly: {
      priceYuan: 888,
      unitPriceYuanPerCredit: 0.03,
      discountTextKey: 'zerocut.membership.priceList.discounts.basic.autoYearly',
    },
  },
  {
    tier: 'standard',
    monthlyCredits: 8000,
    oneTime: {
      priceYuan: 299,
      unitPriceYuanPerCredit: 0.037,
      discountTextKey: 'zerocut.membership.priceList.discounts.standard.oneTimeMonth',
    },
    autoMonthly: {
      priceYuan: 265,
      unitPriceYuanPerCredit: 0.033,
      discountTextKey: 'zerocut.membership.priceList.discounts.standard.autoMonthly',
    },
    autoYearly: {
      priceYuan: 2650,
      unitPriceYuanPerCredit: 0.028,
      discountTextKey: 'zerocut.membership.priceList.discounts.standard.autoYearly',
    },
  },
  {
    tier: 'premium',
    monthlyCredits: 25000,
    oneTime: {
      priceYuan: 799,
      unitPriceYuanPerCredit: 0.032,
      discountTextKey: 'zerocut.membership.priceList.discounts.premium.oneTimeMonth',
    },
    autoMonthly: {
      priceYuan: 699,
      unitPriceYuanPerCredit: 0.028,
      discountTextKey: 'zerocut.membership.priceList.discounts.premium.autoMonthly',
    },
    autoYearly: {
      priceYuan: 6990,
      unitPriceYuanPerCredit: 0.023,
      discountTextKey: 'zerocut.membership.priceList.discounts.premium.autoYearly',
    },
  },
];

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
const TIER_FEATURE_KEYS: Record<string, string[]> = {
  basic: [
    'zerocut.membership.priceList.benefits.quotas.basic',
    'zerocut.membership.priceList.benefits.universal.allModels',
    'zerocut.membership.priceList.benefits.universal.hdVideo',
    'zerocut.membership.priceList.benefits.universal.noWatermark',
  ],
  standard: [
    'zerocut.membership.priceList.benefits.quotas.standard',
    'zerocut.membership.priceList.benefits.universal.allModels',
    'zerocut.membership.priceList.benefits.universal.hdVideo',
    'zerocut.membership.priceList.benefits.universal.noWatermark',
  ],
  premium: [
    'zerocut.membership.priceList.benefits.quotas.premium',
    'zerocut.membership.priceList.benefits.universal.allModels',
    'zerocut.membership.priceList.benefits.universal.hdVideo',
    'zerocut.membership.priceList.benefits.universal.noWatermark',
  ],
};

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

const priceComparisonRows = computed(() => {
  locale.value;
  return PRICE_COMPARISON_ROWS.map(row => {
    const tierName = t(TIER_NAME_KEYS[row.tier]);
    const monthlyCredits = row.monthlyCredits.toLocaleString();
    const benefits: string[] = [
      t('zerocut.membership.priceList.benefits.monthlyCredits', { credits: monthlyCredits }),
      t(`zerocut.membership.priceList.benefits.quotas.${row.tier}`),
      t('zerocut.membership.priceList.benefits.universal.allModels'),
      t('zerocut.membership.priceList.benefits.universal.hdVideo'),
      t('zerocut.membership.priceList.benefits.universal.noWatermark'),
    ];
    return {
      tier: tierName,
      tierKey: row.tier,
      oneTime: row.oneTime,
      autoMonthly: row.autoMonthly,
      autoYearly: row.autoYearly,
      benefits,
    };
  });
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
    features: (TIER_FEATURE_KEYS[plan.tier] || []).map(key => t(key)),
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
  const cycleName = t(`zerocut.membership.cycles.${selectedCycle.value}`);
  snackbarStore.showInfoMessage(
    t('zerocut.membership.messages.selectedPlan', {
      planName,
      cycle: cycleName,
      productId,
    })
  );

  // TODO Phase 3: Call subscription signing API
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
                <div class="price-main">{{ formatYuanPrice(row.oneTime.priceYuan) }}</div>
                <div class="price-sub">
                  {{ formatUnitPrice(row.oneTime.unitPriceYuanPerCredit) }}
                </div>
                <div class="price-sub">{{ t(row.oneTime.discountTextKey) }}</div>
              </td>
              <td class="price-cell">
                <div class="price-main">{{ formatYuanPrice(row.autoMonthly.priceYuan) }}</div>
                <div class="price-sub">
                  {{ formatUnitPrice(row.autoMonthly.unitPriceYuanPerCredit) }}
                </div>
                <div class="price-sub">{{ t(row.autoMonthly.discountTextKey) }}</div>
              </td>
              <td class="price-cell">
                <div class="price-main">{{ formatYuanYearly(row.autoYearly.priceYuan) }}</div>
                <div class="price-sub">
                  {{ formatUnitPrice(row.autoYearly.unitPriceYuanPerCredit) }}
                </div>
                <div class="price-sub">{{ t(row.autoYearly.discountTextKey) }}</div>
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
