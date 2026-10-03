import type { SubscriptionDetails } from '@/api/membershipApi';

export function hasMembershipEntitlement(
  subscription: SubscriptionDetails | null | undefined,
  now = Date.now()
): boolean {
  if (!subscription) return false;
  const yearly = ['auto_yearly', 'one_time_year'].includes(subscription.purchaseMode);
  const end =
    subscription.entitlementEndsAt ??
    (yearly
      ? (subscription.termEndAt ?? subscription.currentPeriodEndAt)
      : (subscription.currentPeriodEndAt ?? subscription.termEndAt));
  const withinPeriod =
    (!end || new Date(end).getTime() > now) &&
    (!subscription.termStartAt || new Date(subscription.termStartAt).getTime() <= now);
  if (subscription.entitlementActive !== undefined)
    return subscription.entitlementActive && withinPeriod;
  return ['active', 'past_due', 'canceled'].includes(subscription.status) && withinPeriod;
}

export function canCancelMembershipRenewal(
  subscription: SubscriptionDetails | null | undefined
): boolean {
  if (!subscription) return false;
  if (subscription.canCancelAutoRenewal !== undefined) return subscription.canCancelAutoRenewal;
  return (
    subscription.autoRenew &&
    ['active', 'past_due'].includes(subscription.lifecycleStatus ?? subscription.status)
  );
}
