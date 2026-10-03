import { describe, it, expect } from 'vite-plus/test';

import type { SubscriptionDetails } from '@/api/membershipApi';

import { hasMembershipEntitlement, canCancelMembershipRenewal } from './membershipEntitlement';
const details = (extra: Partial<SubscriptionDetails> = {}) =>
  ({
    status: 'active',
    autoRenew: true,
    purchaseMode: 'auto_monthly',
    currentPeriodEndAt: '2099-01-01',
    ...extra,
  }) as SubscriptionDetails;
describe('paid entitlement and renewal authorization', () => {
  it('allows cancellation after entitlement expiry with additive server fields', () => {
    const sub = details({
      status: 'expired',
      lifecycleStatus: 'past_due',
      entitlementActive: false,
      canCancelAutoRenewal: true,
    });
    expect(hasMembershipEntitlement(sub)).toBe(false);
    expect(canCancelMembershipRenewal(sub)).toBe(true);
  });
  it('supports old responses without disabling cancellation at the period boundary', () => {
    const sub = details({ status: 'past_due', currentPeriodEndAt: '2020-01-01' });
    expect(hasMembershipEntitlement(sub)).toBe(false);
    expect(canCancelMembershipRenewal(sub)).toBe(true);
  });
  it('keeps annual benefits beyond the monthly credit period', () => {
    const sub = details({
      purchaseMode: 'one_time_year',
      autoRenew: false,
      currentPeriodEndAt: '2020-01-01',
      termEndAt: '2099-01-01',
    });
    expect(hasMembershipEntitlement(sub)).toBe(true);
    expect(canCancelMembershipRenewal(sub)).toBe(false);
  });
  it('does not let cached entitlement true extend past its actual end', () => {
    expect(
      hasMembershipEntitlement(
        details({ entitlementActive: true, entitlementEndsAt: '2020-01-01' })
      )
    ).toBe(false);
  });
  it('keeps canceled benefits but never enables a canceled renewal', () => {
    const sub = details({ status: 'canceled', autoRenew: false });
    expect(hasMembershipEntitlement(sub)).toBe(true);
    expect(canCancelMembershipRenewal(sub)).toBe(false);
  });
});
