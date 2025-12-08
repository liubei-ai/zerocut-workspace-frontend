<script setup lang="ts">
import { createCheckout, listBagelPayProducts } from '@/api/bagelpayApi';
import Pricing from '@/components/Pricing.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { type Product as BagelPayProduct } from 'bagelpay';
import { onMounted, ref } from 'vue';

type Cycle = 'monthly' | 'yearly' | 'one_time';
type PricingOption = {
  type: Cycle;
  price: number;
  currency: string;
  productUrl: string;
  productId: string;
};
type PricingPlan = {
  tier: string;
  color: string;
  colorClass: string;
  features: string[];
  options: PricingOption[];
};

const loading = ref(false);
const plans = ref<PricingPlan[]>([]);
const error = ref<string | null>(null);

const snackbarStore = useSnackbarStore();
const workspaceStore = useWorkspaceStore();
const currentWorkspaceId = workspaceStore.currentWorkspaceId;

function normalizeTier(name?: string) {
  if (!name) return '';
  const normalized = name.replace('（', '(').replace('）', ')');
  const lower = normalized.toLowerCase();
  if (lower.startsWith('based')) return 'Based';
  if (lower.startsWith('standard')) return 'Standard';
  if (lower.startsWith('senior')) return 'Senior';
  return normalized;
}

function tierColor(tier: string) {
  if (tier === 'Based') return { color: '#13BB70', colorClass: 'community-color' };
  if (tier === 'Standard') return { color: '#4945ff', colorClass: 'pro-color' };
  if (tier === 'Senior') return { color: '#AC56F5', colorClass: 'team-color' };
  return { color: '#4945ff', colorClass: 'pro-color' };
}

function toOption(p: BagelPayProduct): PricingOption | null {
  if (p.billingType === 'subscription' && p.recurringInterval === 'monthly') {
    return {
      type: 'monthly',
      price: p.price!,
      currency: p.currency!,
      productUrl: p.productUrl!,
      productId: p.productId!,
    };
  }
  if (p.billingType === 'subscription' && p.recurringInterval === 'yearly') {
    return {
      type: 'yearly',
      price: p.price!,
      currency: p.currency!,
      productUrl: p.productUrl!,
      productId: p.productId!,
    };
  }
  if (p.billingType === 'single_payment') {
    return {
      type: 'one_time',
      price: p.price!,
      currency: p.currency!,
      productUrl: p.productUrl!,
      productId: p.productId!,
    };
  }
  return null;
}

function extractFeatures(desc?: string) {
  if (!desc) return [] as string[];
  return desc
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function fetchPlans() {
  try {
    loading.value = true;
    error.value = null;
    const res = await listBagelPayProducts();
    const items: BagelPayProduct[] = Array.isArray(res) ? res : res.items || [];
    const map = new Map<string, PricingPlan>();
    items.forEach(p => {
      if (p.isArchive) return;
      const tier = normalizeTier(p.name);
      const opt = toOption(p);
      if (!opt) return;
      const { color, colorClass } = tierColor(tier);
      if (!map.has(tier)) {
        map.set(tier, {
          tier,
          color,
          colorClass,
          features: extractFeatures(p.description),
          options: [opt],
        });
      } else {
        const existing = map.get(tier)!;
        if (!existing.options.find(o => o.type === opt.type)) existing.options.push(opt);
        if (existing.features.length === 0) existing.features = extractFeatures(p.description);
      }
    });
    plans.value = Array.from(map.values());
  } catch (e) {
    error.value = e?.message || 'Failed to load pricing';
  } finally {
    loading.value = false;
  }
}

async function handleClickSubscribe(payload: {
  productId?: string;
  productUrl?: string;
  cycle: Cycle;
  tier: string;
}) {
  try {
    const res = await createCheckout({
      workspaceId: currentWorkspaceId!,
      productId: payload.productId!,
      metadata: { cycle: payload.cycle, tier: payload.tier },
    });
    if (res.checkoutUrl) {
      window.open(res.checkoutUrl, '_blank');
    }
  } catch (error) {
    snackbarStore.showErrorMessage(error?.message || 'Failed to create checkout');
  }
}

onMounted(fetchPlans);
</script>

<template>
  <div>
    <v-alert v-if="error" type="error" class="ma-4">{{ error }}</v-alert>
    <Pricing :plans="plans" :loading="loading" @subscribe="handleClickSubscribe" />
  </div>
</template>

<style lang="scss"></style>
