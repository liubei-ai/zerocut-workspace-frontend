import client from './api2client';

/**
 * Backend DTO interface (matches server-side)
 */
export interface MembershipPlanDto {
  code: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'one_time_month' | 'auto_monthly' | 'auto_yearly';
  priceCents: number;
  priceYuan: number;
  currency: string;
  monthlyCredits: number;
  billingIntervalMonths: number;
  isActive: boolean;
  wechatPapayPlanId?: string;
}

/**
 * Get all membership plans
 * @param activeOnly - Only return active plans (default true)
 */
export async function getMembershipPlans(activeOnly: boolean = true): Promise<MembershipPlanDto[]> {
  const response = await client.get<MembershipPlanDto[]>('/subscriptions/membership-plans', {
    params: { activeOnly },
  });
  return response.data;
}
