import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { getCurrentSubscription, type SubscriptionDetails } from '@/api/membershipApi';
import { getWalletInfo, type WalletInfo } from '@/api/walletApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export const useMembershipStore = defineStore('membership', () => {
  const subscription = ref<SubscriptionDetails | null>(null);
  const walletInfo = ref<WalletInfo | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

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
  const hasActiveSubscription = computed(() =>
    isMembershipEffectiveStatus(subscription.value?.status)
  );
  const isExpired = computed(() => subscription.value?.status === 'expired');
  const availableCredits = computed(() => walletInfo.value?.availableCredits ?? 0);
  const expiryDate = computed(
    () => subscription.value?.termEndAt ?? subscription.value?.currentPeriodEndAt ?? null
  );
  const tierI18nKey = computed(() =>
    subscription.value ? `zerocut.membership.tiers.${subscription.value.tier}` : null
  );

  async function initialize() {
    if (initialized.value) return;
    if (loading.value) return;

    const workspaceStore = useWorkspaceStore();
    loading.value = true;
    try {
      const workspaceId = workspaceStore.currentWorkspaceId;
      if (workspaceId) {
        subscription.value = await getCurrentSubscription(workspaceId);
        if (isMembershipEffectiveStatus(subscription.value?.status)) {
          walletInfo.value = await getWalletInfo(workspaceId);
        }
      }
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function refresh() {
    initialized.value = false;
    subscription.value = null;
    walletInfo.value = null;
    await initialize();
  }

  return {
    subscription,
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
