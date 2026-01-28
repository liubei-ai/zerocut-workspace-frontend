import client from './api2client';

/**
 * Backend DTO interface (matches server-side)
 */
export interface MembershipPlanDto {
  code: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'one_time_month' | 'auto_monthly' | 'auto_yearly';
  priceCents: number;
  priceYuan: number;
  currency: string;
  monthlyCredits: number;
  billingIntervalMonths: number;
  isActive: boolean;
  wechatPapayPlanId?: string;
  features: IMembershipPlanFeature[];
}

export interface IMembershipPlanFeature {
  key: string;
  i18nKey?: string;
  i18nParams?: Record<string, any>;
  label?: string;
  description?: string;
  value: number | string | boolean;
  unit?: string;
  icon?: string;
  group?: string;
  highlight?: boolean;
  order?: number;
}

export interface CreateMembershipPaymentOrderParams {
  planCode: string;
  totalAmount: number;
  workspaceId: string;
}

export interface CreateMembershipPaymentOrderResponse {
  codeUrl: string;
  outTradeNo: string;
}

/**
 * Get all membership plans
 * @param activeOnly - Only return active plans (default true)
 */
export async function getMembershipPlans(activeOnly = true) {
  const response = await client.get<MembershipPlanDto[]>('/subscriptions/membership-plans', {
    params: { activeOnly },
  });
  return response.data;
}

export async function createMembershipWechatPayOrder(params: CreateMembershipPaymentOrderParams) {
  const response = await client.post<CreateMembershipPaymentOrderResponse>(
    '/wechat-pay-native/create-membership-order',
    params
  );
  return response.data;
}

export async function closeMembershipOrder(outTradeNo: string, workspaceId: string) {
  await client.post('/wechat-pay-native/close-membership-order', { outTradeNo, workspaceId });
}
