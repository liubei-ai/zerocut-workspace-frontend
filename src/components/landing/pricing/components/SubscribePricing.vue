<!--
* @Component: SubscribePricing
* @Maintainer: J.K. Yang
* @Description: Subscription pricing cards component with dynamic data support
-->
<script setup lang="ts">
/**
 * Component plan data type
 */
import { useI18n } from 'vue-i18n';

/**
 * Structured price display for yearly plans
 */
export interface PriceDisplay {
  main: string; // Main price "¥699/年"
  monthlyEquivalent?: string; // Monthly equivalent "相当于¥58.25/月"
  discount?: string; // Discount label "省41%"
}

export interface SubscriptionPlan {
  planName: string; // Plan name (e.g., "基础会员")
  price: string | PriceDisplay; // Display price (string for monthly, PriceDisplay for yearly)
  credits: string; // Credit amount (e.g., "2,500 积分/月")
  features: string[]; // Feature list
  productId: string; // SKU code (for subscription)
}

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    plans: SubscriptionPlan[];
    loading?: boolean;
    embedded?: boolean;
  }>(),
  {
    loading: false,
    embedded: false,
  }
);

const emit = defineEmits<{
  (e: 'subscribe', productId: string, planName: string): void;
}>();

/**
 * Handle subscribe button click
 */
function onSubscribe(plan: SubscriptionPlan) {
  emit('subscribe', plan.productId, plan.planName);
}
</script>

<template>
  <v-card
    v-if="!props.embedded"
    class="my-5 subscribe-pricing-card"
    rounded="lg"
    variant="outlined"
  >
    <div class="pa-5">
      <!-- Loading state -->
      <div v-if="props.loading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="text-h6 mt-4 subscribe-muted">{{ t('zerocut.membership.loading') }}</div>
      </div>

      <!-- Plan cards -->
      <v-card v-else max-width="1600" class="mx-auto" variant="flat" color="transparent">
        <v-item-group mandatory selected-class="active-card">
          <v-row align="stretch">
            <v-col cols="12" md="4" v-for="plan in props.plans" :key="plan.productId">
              <v-item v-slot="{ selectedClass, toggle }">
                <v-card
                  theme="light"
                  elevation="0"
                  height="100%"
                  class="base-card text-center mx-auto pa-10 pa-md-15 d-flex flex-column justify-center"
                  :class="selectedClass"
                  @click="toggle"
                >
                  <div>
                    <h3 class="font-weight-bold text-h5 mt-5 mb-10">
                      {{ plan.planName }}
                    </h3>
                    <div class="price-container mt-5 mb-10">
                      <template v-if="typeof plan.price === 'string'">
                        <h1 class="font-weight-black text-h3">
                          <span class="text-primary">{{ plan.price }}</span>
                        </h1>
                      </template>
                      <template v-else>
                        <h1 class="font-weight-black text-h3 price-main">
                          <span class="text-primary">{{ plan.price.main }}</span>
                        </h1>
                        <div
                          v-if="plan.price.monthlyEquivalent"
                          class="price-details d-flex flex-column flex-sm-row align-center justify-center mt-2 ga-2"
                        >
                          <span class="price-monthly text-body-2">
                            {{ plan.price.monthlyEquivalent }}
                          </span>
                          <v-chip
                            v-if="plan.price.discount"
                            size="small"
                            color="error"
                            variant="flat"
                            class="price-discount"
                          >
                            {{ plan.price.discount }}
                          </v-chip>
                        </div>
                      </template>
                    </div>

                    <div class="text-h6 font-weight-bold mb-10">
                      {{ plan.credits }}
                    </div>
                    <div>
                      <div
                        v-for="(feature, index) in plan.features"
                        :key="index"
                        class="mb-2 subscribe-feature"
                      >
                        {{ feature }}
                      </div>
                    </div>

                    <v-btn color="primary" size="large" class="mt-10" @click="onSubscribe(plan)">
                      {{ t('zerocut.membership.actions.subscribe') }}
                    </v-btn>
                  </div>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-item-group>
      </v-card>
    </div>
  </v-card>
  <div v-else class="subscribe-pricing-embedded pa-5">
    <!-- Loading state -->
    <div v-if="props.loading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-h6 mt-4 subscribe-muted">{{ t('zerocut.membership.loading') }}</div>
    </div>

    <!-- Plan cards -->
    <v-card v-else max-width="1600" class="mx-auto" variant="flat" color="transparent">
      <v-item-group mandatory selected-class="active-card">
        <v-row align="stretch">
          <v-col cols="12" md="4" v-for="plan in props.plans" :key="plan.productId">
            <v-item v-slot="{ selectedClass, toggle }">
              <v-card
                theme="light"
                elevation="0"
                height="100%"
                class="base-card text-center mx-auto pa-10 pa-md-15 d-flex flex-column justify-center"
                :class="selectedClass"
                @click="toggle"
              >
                <div>
                  <h3 class="font-weight-bold text-h5 mt-5 mb-10">
                    {{ plan.planName }}
                  </h3>
                  <div class="price-container mt-5 mb-10">
                    <template v-if="typeof plan.price === 'string'">
                      <h1 class="font-weight-black text-h3">
                        <span class="text-primary">{{ plan.price }}</span>
                      </h1>
                    </template>
                    <template v-else>
                      <h1 class="font-weight-black text-h3 price-main">
                        <span class="text-primary">{{ plan.price.main }}</span>
                      </h1>
                      <div
                        v-if="plan.price.monthlyEquivalent"
                        class="price-details d-flex flex-column flex-sm-row align-center justify-center mt-2 ga-2"
                      >
                        <span class="price-monthly text-body-2">
                          {{ plan.price.monthlyEquivalent }}
                        </span>
                        <v-chip
                          v-if="plan.price.discount"
                          size="small"
                          color="error"
                          variant="flat"
                          class="price-discount"
                        >
                          {{ plan.price.discount }}
                        </v-chip>
                      </div>
                    </template>
                  </div>

                  <div class="text-h6 font-weight-bold mb-10">
                    {{ plan.credits }}
                  </div>
                  <div>
                    <div
                      v-for="(feature, index) in plan.features"
                      :key="index"
                      class="mb-2 subscribe-feature"
                    >
                      {{ feature }}
                    </div>
                  </div>

                  <v-btn color="primary" size="large" class="mt-10" @click="onSubscribe(plan)">
                    {{ t('zerocut.membership.actions.subscribe') }}
                  </v-btn>
                </div>
              </v-card>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.subscribe-pricing-card {
  background: rgb(var(--v-theme-surface));
}

.subscribe-pricing-embedded {
  background: transparent;
}

.subscribe-muted {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.base-card {
  transition: all 0.3s ease-out;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background: rgb(var(--v-theme-surface));
}

.active-card {
  border: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
  box-shadow:
    0px 12px 28px rgba(112, 92, 246, 0.15),
    0px 4px 12px rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
  transition: 0.3s ease-out;
}

.subscribe-feature {
  color: rgba(var(--v-theme-on-surface), 0.78);
}

/* Price display styles */
.price-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.price-main {
  line-height: 1.2;
}

.price-details {
  gap: 8px;
}

.price-monthly {
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 400;
  opacity: 0.9;
}

.price-discount {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Responsive: small screens stack vertically */
@media (max-width: 600px) {
  .price-details {
    flex-direction: column !important;
  }
}
</style>
