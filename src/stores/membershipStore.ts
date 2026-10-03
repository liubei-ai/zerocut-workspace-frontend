import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { getCurrentSubscription, type SubscriptionDetails } from '@/api/membershipApi';
import { getWalletInfo, type WalletInfo } from '@/api/walletApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { hasMembershipEntitlement } from '@/utils/membershipEntitlement';

export const useMembershipStore = defineStore('membership', () => {
  const subscription = ref<SubscriptionDetails | null>(null);
  const firstMonthPromoEligible = ref(false);
  const walletInfo = ref<WalletInfo | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  const workspaceStore = useWorkspaceStore();
  let generation = 0;
  let inFlight: Promise<void> | undefined;
  watch(
    () => workspaceStore.currentWorkspaceId,
    () => {
      generation++;
      inFlight = undefined;
      subscription.value = null;
      walletInfo.value = null;
      firstMonthPromoEligible.value = false;
      initialized.value = false;
      loading.value = false;
    },
    { flush: 'sync' }
  );

  const effectiveMembershipStatuses = new Set<SubscriptionDetails['status']>([
    'active',
    'past_due',
    'canceled',
  ]);

  const isMembershipEffectiveStatus = (
    status: SubscriptionDetails['status'] | null | undefined
  ): boolean => {
    if (!status) return false;
    return effectiveMembershipStatuses.has(status);
  };

  // Backward-compatible field name, now means "has effective membership entitlement".
  const hasActiveSubscription = computed(() => hasMembershipEntitlement(subscription.value));
  const isExpired = computed(
    () => !!subscription.value && !hasMembershipEntitlement(subscription.value)
  );
  const availableCredits = computed(() => walletInfo.value?.availableCredits ?? 0);
  const expiryDate = computed(
    () =>
      subscription.value?.entitlementEndsAt ??
      subscription.value?.termEndAt ??
      subscription.value?.currentPeriodEndAt ??
      null
  );
  const tierI18nKey = computed(() =>
    subscription.value ? `zerocut.membership.tiers.${subscription.value.tier}` : null
  );

  function fetchMembership() {
    if (inFlight) return inFlight;
    const workspaceId = workspaceStore.currentWorkspaceId;
    const version = generation;
    if (!workspaceId) return Promise.resolve();
    loading.value = true;
    const request = (async () => {
      try {
        const me = await getCurrentSubscription(workspaceId);
        const wallet = await getWalletInfo(workspaceId);
        if (version !== generation || workspaceId !== workspaceStore.currentWorkspaceId) return;
        subscription.value = me.subscription;
        firstMonthPromoEligible.value = me.firstMonthPromoEligible;
        walletInfo.value = wallet;
        initialized.value = true;
      } finally {
        if (version === generation) {
          loading.value = false;
          inFlight = undefined;
        }
      }
    })();
    inFlight = request;
    return request;
  }
  function initialize() {
    return initialized.value ? Promise.resolve() : fetchMembership();
  }
  function refresh() {
    return fetchMembership();
  }

  return {
    subscription,
    firstMonthPromoEligible,
    walletInfo,
    loading,
    initialized,
    hasActiveSubscription,
    isExpired,
    availableCredits,
    expiryDate,
    tierI18nKey,
    isMembershipEffectiveStatus,
    initialize,
    refresh,
  };
});
