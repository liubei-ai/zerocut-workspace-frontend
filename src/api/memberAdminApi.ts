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
export type MembershipTier = 'basic' | 'pro' | 'enterprise';
export type OrderPurpose = 'initial' | 'renewal';
export type OrderStatus = 'created' | 'processing' | 'success' | 'failed';
export type PeriodStatus = 'pending' | 'granted';

// Member Summary
export interface MemberSummary {
  totalMembers: number;
  oneTimeMembers: number;
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
 * Get member summary statistics
 */
export async function getMemberSummary(): Promise<MemberSummary> {
  const response = await apiClient.get<MemberSummary>('/admin/members/summary');
  return response.data;
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
