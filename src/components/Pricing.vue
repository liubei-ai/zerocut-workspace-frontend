<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type Cycle = 'monthly' | 'yearly';
type PricingOption = {
  type: Cycle;
  price: number;
  currency: string;
  productUrl?: string;
};
type PricingPlan = {
  tier: string;
  color: string;
  colorClass: string;
  features: string[];
  options: PricingOption[];
};

const props = defineProps<{ plans: PricingPlan[]; loading?: boolean }>();
const selectedCycle = ref<Cycle>('monthly');

function displayOption(plan: PricingPlan) {
  const prefer = plan.options.find(o => o.type === selectedCycle.value);
  if (prefer) return prefer;
  const fallbackOrder: Cycle[] = ['monthly', 'yearly'];
  for (const c of fallbackOrder) {
    const opt = plan.options.find(o => o.type === c);
    if (opt) return opt;
  }
  return undefined;
}

const hasCycle = computed(() => {
  const types = new Set<Cycle>();
  props.plans.forEach(p => p.options.forEach(o => types.add(o.type)));
  return types;
});

const hasMonthly = computed(() => hasCycle.value.has('monthly'));
const hasYearly = computed(() => hasCycle.value.has('yearly'));

function ensureSelectedCycle() {
  if (selectedCycle.value === 'monthly' && !hasMonthly.value) {
    selectedCycle.value = hasYearly.value ? 'yearly' : selectedCycle.value;
  } else if (selectedCycle.value === 'yearly' && !hasYearly.value) {
    selectedCycle.value = hasMonthly.value ? 'monthly' : selectedCycle.value;
  }
}

watch(() => props.plans, ensureSelectedCycle, { immediate: true });

const sortedPlans = computed(() => {
  const arr = [...props.plans];
  const priceOf = (p: PricingPlan) => {
    const opt =
      p.options.find(o => o.type === selectedCycle.value) ||
      p.options.find(o => o.type === 'monthly') ||
      p.options.find(o => o.type === 'yearly');
    return opt ? opt.price : Number.POSITIVE_INFINITY;
  };
  return arr.sort((a, b) => priceOf(a) - priceOf(b));
});
</script>

<template>
  <v-card class="my-5" rounded color="grey-50">
    <div class="pa-10">
      <v-card max-width="1600" class="mx-auto" variant="flat" color="transparent">
        <div class="d-flex justify-center mb-6">
          <v-btn-toggle v-model="selectedCycle" mandatory density="comfortable" class="mr-3">
            <v-btn v-if="hasMonthly" value="monthly">Monthly</v-btn>
            <v-btn v-if="hasYearly" value="yearly">Yearly</v-btn>
          </v-btn-toggle>
          <v-progress-circular
            v-if="props.loading"
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>
        <v-item-group mandatory selected-class="active-card">
          <v-row align="stretch">
            <v-col cols="12" md="4" v-for="plan in sortedPlans" :key="plan.tier">
              <v-item v-slot="{ selectedClass, toggle }">
                <v-card
                  elevation="0"
                  height="100%"
                  class="base-card mx-auto pa-5 d-flex flex-column justify-center"
                  :class="selectedClass"
                  @click="toggle"
                  color="#F6FAFE"
                >
                  <div>
                    <h3 class="font-weight-bold text-h6 mb-5 text-center" :class="plan.colorClass">
                      {{ plan.tier }}
                    </h3>
                    <v-card elevation="0" class="text-center">
                      <h1 class="font-weight-black text-h4 my-10 text-color">
                        <span>
                          {{ displayOption(plan)?.price ?? '-' }}
                          {{ (displayOption(plan)?.currency || '').toUpperCase() }}
                        </span>
                      </h1>
                      <p class="font-weight-bold">
                        <span v-if="displayOption(plan)?.type === 'monthly'">/ month</span>
                        <span v-else-if="displayOption(plan)?.type === 'yearly'">/ year</span>
                        <span v-else>/ one-time</span>
                      </p>
                      <p class="px-5 pt-5">
                        <v-btn
                          size="x-large"
                          class="text-white my-5"
                          block
                          :color="plan.color"
                          :href="displayOption(plan)?.productUrl"
                          target="_blank"
                        >
                          Subscribe
                        </v-btn>
                      </p>
                    </v-card>
                    <div class="px-5 py-10">
                      <h3 :class="plan.colorClass" class="mb-5">
                        {{ plan.tier }}
                      </h3>
                      <div>
                        <div
                          class="text-color text-body-2 font-weight-medium mb-3"
                          v-for="feature in plan.features"
                          :key="feature"
                        >
                          <v-btn size="20" icon class="mr-2">
                            <v-icon size="14" :color="plan.color">mdi-check</v-icon></v-btn
                          >

                          {{ feature }}
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-item-group>
      </v-card>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.base-card {
  transition: 0.3s ease-out;
  border: 1px solid #eaf2fa;
}

.active-card {
  border: 1px solid #e5e5e5;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
  transition: 0.3s ease-out;
}

.text-color {
  color: #1d1b84;
}

.pro-color {
  color: #4945ff;
}

.team-color {
  color: #ac56f5;
}

.community-color {
  color: #13bb70;
}
</style>
