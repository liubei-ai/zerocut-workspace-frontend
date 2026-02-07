import client from './api2client';

/**
 * Backend DTO interface (matches server-side)
 */
export interface MembershipPlanDto {
  code: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'auto_monthly' | 'auto_yearly' | 'one_time_month' | 'one_time_year';
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

export interface CreateSigningSessionParams {
  workspaceId: string;
  planCode: string;
  displayAccountName?: string;
}

export interface SigningSessionResponse {
  signingSessionId: string;
  qrUrl: string;
  expiresAt: string;
}

export interface SigningSessionStatus {
  status: 'signing' | 'signed' | 'expired';
  contractId: string | null;
  subscriptionId: number | null;
}

export type SubscriptionStatus =
  | 'draft'
  | 'signing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export interface SubscriptionDetails {
  subscriptionId: number;
  planCode: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'one_time_month' | 'auto_monthly' | 'auto_yearly' | 'one_time_year';
  status: SubscriptionStatus;
  autoRenew: boolean;
  termStartAt: string | null;
  termEndAt: string | null;
  currentPeriodStartAt: string | null;
  currentPeriodEndAt: string | null;
  monthlyQuota: number;
  remainingInCurrentPeriod: number;
  nextBillingAt: string | null;
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

/**
 * Purchase one-time subscription (monthly or yearly)
 * Uses new unified endpoint that supports both purchase modes
 */
export async function purchaseOneTimeSubscription(params: {
  planCode: string;
  totalAmount: number;
  workspaceId: string;
}) {
  const response = await client.post<{
    codeUrl: string;
    outTradeNo: string;
    subscriptionId: number;
    expiresAt: string;
  }>('/subscriptions/purchase', params);
  return response.data;
}

/**
 * Close one-time subscription order
 * Used when user closes payment dialog or QR expires
 */
export async function closeOneTimeOrder(outTradeNo: string, workspaceId: string) {
  await client.post('/subscriptions/close-order', { outTradeNo, workspaceId });
}

/**
 * Close signing session
 * Called when user closes signing dialog without completing contract
 */
export async function closeSigningSession(signingSessionId: string, workspaceId: string) {
  await client.post('/subscriptions/close-signing-session', { signingSessionId, workspaceId });
}

export async function createSigningSession(params: CreateSigningSessionParams) {
  const response = await client.post<SigningSessionResponse>(
    '/subscriptions/signing-sessions',
    params
  );
  return response.data;
}

export async function getSigningSessionStatus(sessionId: string) {
  const response = await client.get<SigningSessionStatus>(
    `/subscriptions/signing-sessions/${sessionId}`
  );
  return response.data;
}

export async function getCurrentSubscription(workspaceId: string) {
  const response = await client.get<SubscriptionDetails>('/subscriptions/me', {
    params: { workspaceId },
  });
  return response.data;
}

export async function cancelSubscription(params: {
  workspaceId: string;
  subscriptionId: number;
  reason?: string;
}) {
  const response = await client.post<SubscriptionDetails>(
    `/subscriptions/${params.subscriptionId}/cancel`,
    {
      workspaceId: params.workspaceId,
      reason: params.reason,
    }
  );
  return response.data;
}
