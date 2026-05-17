import type { PaginationResponse } from '@/types/api';

import apiClient from './api2client';

// Enums
export type SubscriptionStatus =
  | 'draft'
  | 'signing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';
export type PurchaseMode = 'one_time_month' | 'one_time_year' | 'auto_monthly' | 'auto_yearly';
export type MembershipTier = 'basic' | 'standard' | 'premium';
export type OrderPurpose = 'initial' | 'renewal';
export type OrderStatus = 'created' | 'processing' | 'success' | 'failed' | 'refunded';
export type PeriodStatus = 'pending' | 'granted';
export type MemberContractStatus = 'none' | 'signing' | 'signed' | 'terminated' | 'paid_not_signed';

// Member Summary
export interface MemberSummary {
  totalMembers: number;
  oneTimeMembers: number;
  oneTimeYearMembers: number;
  autoMonthlyMembers: number;
  autoYearlyMembers: number;
}

// Member List Item
export interface MemberListItem {
  subscriptionId: number;
  accountId: number;
  workspaceId: string;
  workspaceName: string;
  planCode: string;
  tier: MembershipTier;
  purchaseMode: PurchaseMode;
  status: SubscriptionStatus;
  autoRenew: boolean;
  contractStatus: MemberContractStatus;
  contractId: string | null;
  currentPeriodStartAt: string | null;
  currentPeriodEndAt: string | null;
  createdAt: string;
  termStartAt: string | null;
  termEndAt: string | null;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

// Member List Response
export interface MemberListResponse extends PaginationResponse<MemberListItem> {
  summary: MemberSummary;
}

// Subscription Order Item
export interface SubscriptionOrderItem {
  orderId: number;
  orderNo: string;
  amountCents: number;
  /** Pre-formatted yuan string for display (e.g. "9.99"). */
  amountYuan: string;
  currency: string;
  purpose: OrderPurpose;
  status: OrderStatus;
  attemptNo: number;
  scheduledAt: string;
  paidAt: string | null;
  wechatTransactionId: string | null;
  failCode: string | null;
  failMessage: string | null;
}

// Credit Grant Item
export interface CreditGrantItem {
  transactionId: number;
  txnId: string;
  creditsAmount: number;
  grantedAt: string;
  expiresAt: string;
  description: string;
  periodId: number | null;
}

// Credit Period Item
export interface CreditPeriodItem {
  periodId: number;
  periodIndex: number;
  periodStartAt: string;
  periodEndAt: string;
  creditsQuota: number;
  creditsConsumed: number;
  creditsRemaining: number;
  status: PeriodStatus;
  grantedAt: string | null;
}

// Member Detail
export interface MemberDetail {
  subscriptionId: number;
  accountId: number;
  workspaceId: string;
  planCode: string;
  tier: MembershipTier;
  purchaseMode: PurchaseMode;
  status: SubscriptionStatus;
  autoRenew: boolean;
  termStartAt: string | null;
  termEndAt: string | null;
  currentPeriodStartAt: string | null;
  currentPeriodEndAt: string | null;
  billingAnchorDay: number | null;
  nextActionAt: string | null;
  cancelAt: string | null;
  cancelReason: string | null;
  contractId: string | null;
  orders: SubscriptionOrderItem[];
  creditGrants: CreditGrantItem[];
  creditPeriods: CreditPeriodItem[];
  createdAt: string;
}

// Query Parameters
export interface QueryMembersParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  purchaseMode?: PurchaseMode;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

/**
 * Get paginated member list
 */
export async function getMemberList(params: QueryMembersParams = {}): Promise<MemberListResponse> {
  const response = await apiClient.get<MemberListResponse>('/admin/members', { params });
  return response.data;
}

/**
 * Get member detail by subscription ID
 */
export async function getMemberDetail(subscriptionId: number): Promise<MemberDetail> {
  const response = await apiClient.get<MemberDetail>(`/admin/members/${subscriptionId}`);
  return response.data;
}

// ============================================================
// 单笔订单的微信支付检查 / 补发
// ============================================================

export interface GrantPreview {
  source: 'pending_period' | 'plan_default';
  periodId?: number;
  periodIndex?: number;
  periodStartAt?: string;
  periodEndAt?: string;
  creditsQuota: number;
  planName?: string;
}

export interface OrderPaymentCheckResult {
  orderId: number;
  orderNo: string;
  localStatus: 'created' | 'processing';
  queryOk: boolean;
  tradeState?: string;
  tradeStateDesc?: string;
  wechatTransactionId?: string;
  wechatTotalFee?: number;
  canBackfill: boolean;
  needsRefundMark: boolean;
  grantPreview?: GrantPreview;
  message?: string;
}

export interface OrderPaymentBackfillResult {
  orderId: number;
  orderNo: string;
  action: 'promoted_success' | 'marked_refunded';
  wechatTransactionId?: string;
  grantedPeriodId?: number;
  creditsGranted?: number;
}

/**
 * 检查待回填订单的真实微信支付状态（不产生副作用）
 */
export async function checkOrderPayment(orderId: number): Promise<OrderPaymentCheckResult> {
  const response = await apiClient.get<OrderPaymentCheckResult>(
    `/admin/members/orders/${orderId}/payment-check`
  );
  return response.data;
}

/**
 * 对已支付但本地仍为 pending 的订单执行补发
 */
export async function backfillOrderPayment(orderId: number): Promise<OrderPaymentBackfillResult> {
  const response = await apiClient.post<OrderPaymentBackfillResult>(
    `/admin/members/orders/${orderId}/payment-backfill`
  );
  return response.data;
}

export interface RefundOrderResult {
  orderId: number;
  orderNo: string;
  refundId: string;
  outRefundNo: string;
  refundAmountCents: number;
  refundedAt: string;
}

/**
 * 对微信侧 SUCCESS 但本地仍 pending 的订单发起微信退款
 */
export async function refundOrderPayment(
  orderId: number,
  reason?: string
): Promise<RefundOrderResult> {
  const response = await apiClient.post<RefundOrderResult>(
    `/admin/members/orders/${orderId}/refund`,
    { reason }
  );
  return response.data;
}

// ============================================================
// Admin Grant Membership (005-admin-grant-membership)
// ============================================================

export type GrantablePlanCode = 'BASIC_ONE_TIME' | 'STANDARD_ONE_TIME' | 'PREMIUM_ONE_TIME';

// 与后端 GRANTABLE_PLAN_CODES (grant-members.dto.ts) 对齐的运行时白名单。
// 顺序即 v-select 中的展示顺序（基础 → 标准 → 高级）。
export const GRANTABLE_PLAN_CODES: readonly GrantablePlanCode[] = [
  'BASIC_ONE_TIME',
  'STANDARD_ONE_TIME',
  'PREMIUM_ONE_TIME',
] as const;

export interface LookupRequest {
  phones: string[];
}

export interface LookupUser {
  userId: number;
  name: string;
  registeredAt: string;
}

export interface LookupWorkspace {
  workspaceId: string;
  name: string;
  isDefault: boolean;
}

export interface LookupCurrentSubscription {
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEndAt?: string;
}

export interface LookupResultItem {
  phone: string;
  found: boolean;
  user?: LookupUser;
  workspaces?: LookupWorkspace[];
  currentSubscription?: LookupCurrentSubscription;
  currentCredits?: number;
  reason?: string;
}

export interface LookupResultSummary {
  total: number;
  found: number;
  notFound: number;
}

export interface LookupResult {
  summary: LookupResultSummary;
  results: LookupResultItem[];
}

export interface GrantItem {
  workspaceId: string;
  phone: string;
  /**
   * 开通月数（1-12）。每个账号可独立设置。
   * 后端默认 1；UI 这里也设为可选以兼容老调用，但建议显式传入。
   */
  periods?: number;
}

export interface GrantRequest {
  items: GrantItem[];
  planCode: GrantablePlanCode;
  remark: string;
  clientRequestId: string;
}

export type GrantResultStatus = 'success' | 'skipped' | 'failed';

export interface GrantResultItem {
  workspaceId: string;
  phone: string;
  status: GrantResultStatus;
  subscriptionId?: number;
  orderId?: number;
  orderNo?: string;
  creditsGranted?: number;
  currentCredits?: number;
  failureReason?: string;
}

export interface GrantResultSummary {
  total: number;
  success: number;
  skipped: number;
  failed: number;
}

export interface GrantResult {
  batchId: number;
  summary: GrantResultSummary;
  results: GrantResultItem[];
}

/**
 * Lookup users + workspaces + subscription state by a batch of phones.
 * Read-only; safe to retry.
 */
export async function lookupMembersByPhones(payload: LookupRequest): Promise<LookupResult> {
  const response = await apiClient.post<LookupResult>('/admin/members/lookup-by-phones', payload);
  return response.data;
}

/**
 * Batch grant membership subscriptions to selected workspaces.
 * Idempotent within a 10-minute window keyed by `clientRequestId`.
 */
export async function grantMemberships(payload: GrantRequest): Promise<GrantResult> {
  const response = await apiClient.post<GrantResult>('/admin/members/grant', payload);
  return response.data;
}
