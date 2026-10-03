import client from './api2client';

// Public contract: specs/008-membership-upgrade/contracts/membership-upgrade.openapi.json
export type UpgradeError = {
  code: number;
  message: string;
  errorCode: string | null;
  details?: Array<string> | null;
  timestamp?: string;
  path?: string;
  method?: string;
};
export type UpgradePlan = {
  id: string;
  code: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'one_time_month' | 'auto_monthly';
  monthlyCredits: string;
  priceCents: number;
};
export type UpgradeSourceMembership = {
  subscriptionId: string;
  plan: UpgradeSourcePlan;
  validUntil: string;
  autoRenew: boolean;
  version: number;
};
export type UpgradeCreditBatch = {
  transactionId: string;
  remainingCredits: string;
  expiresAt: string | null;
};
export type UpgradeCreditResult = {
  oldAvailableCredits: string;
  oldBatches: Array<UpgradeCreditBatch>;
  newCredits: string;
  totalAvailableCredits: string;
  newExpiresAt: string | null;
  snapshotAt: string;
};
export type UpgradeRenewal = {
  applicable: boolean;
  state: 'not_applicable' | 'pending' | 'ready' | 'terminated' | 'failed';
  amountCents: number | null;
  paymentRequestAt: string | null;
  estimatedChargeAt: string | null;
  periodBoundaryAt: string | null;
  timingIsEstimate: boolean;
};
export type UpgradeOption = {
  targetPlan: UpgradePlan;
  classification: 'allowed' | 'forbidden' | 'not_upgrade';
  reasonCode: string | null;
  available: boolean;
  previewOnly: boolean;
};
export type UpgradeOptions = {
  canManage: boolean;
  source: UpgradeSourceMembership | null;
  activeUpgradeId: string | null;
  options: Array<UpgradeOption>;
  businessTimezone: 'Asia/Shanghai';
};
export type UpgradeQuoteRequest = { targetPlanCode: string; upgradeId?: string };
export type UpgradeQuote = {
  id: string;
  upgradeId: string | null;
  source: UpgradeSourceMembership;
  target: UpgradePlan;
  amountCents: number;
  currency: 'CNY';
  credits: UpgradeCreditResult;
  estimatedStartAt: string;
  estimatedEndAt: string;
  renewal: UpgradeRenewal;
  businessTimezone: 'Asia/Shanghai';
  expiresAt: string;
  requiresCancelOriginalRenewal: boolean;
  noticeCodes: Array<string>;
  pricingFingerprint: string;
};
export type UpgradeCreateRequest = {
  quoteId: string;
  acknowledgeCancellationConsequences: true;
  paymentPresentation: 'native' | 'jsapi' | 'pure_signing';
};
export type UpgradeContinueRequest = {
  action: 'retry' | 'prepare' | 'confirm_quote';
  quoteId?: string;
  paymentPresentation?: 'native' | 'jsapi' | 'pure_signing';
};
export type UpgradeAbandonRequest = { reason?: string };
export type UpgradeJsapiParams = {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
};
export type UpgradeNextAction = {
  type:
    | 'WAIT'
    | 'WAIT_QUERY'
    | 'RECONFIRM'
    | 'AUTHORIZE'
    | 'PAY_NATIVE'
    | 'PAY_JSAPI'
    | 'RETRY'
    | 'CONTACT_SUPPORT'
    | 'NONE';
  signingUrl?: string;
  codeUrl?: string;
  jsapiParams?: UpgradeJsapiParams;
  expiresAt?: string;
  pollAfterSeconds?: number;
};
export type UpgradePayment = {
  state:
    | 'not_started'
    | 'pending'
    | 'unknown'
    | 'confirmed'
    | 'definitively_failed'
    | 'zero_settled';
  amountCents: number;
  orderNo: string | null;
  channel: 'papay_v2' | 'wechat_native_v3' | 'wechat_jsapi_v3' | 'internal_zero' | null;
  confirmedAt: string | null;
};
export type UpgradeFulfillment = {
  state: 'pending' | 'committed' | 'frozen';
  subscriptionId: string | null;
  startedAt: string | null;
  endsAt: string | null;
  credits: UpgradeCreditResult | null;
};
export type UpgradeRefund = {
  state: 'none' | 'requested' | 'processing' | 'succeeded' | 'failed' | 'unknown';
  amountCents: number | null;
  confirmedAt: string | null;
};
export type UpgradeSupport = {
  required: boolean;
  firstFailureAt: string | null;
  manualReviewAt: string | null;
  userUpdateDueAt: string | null;
  lastUserNotifiedAt: string | null;
  userVisibleProgress: string | null;
};
export type UpgradeUpgrade = {
  id: string;
  state:
    | 'WAITING_SOURCE_PAYMENT'
    | 'CANCELING'
    | 'RECONFIRM_REQUIRED'
    | 'AUTHORIZING'
    | 'PAYMENT_PENDING'
    | 'PAYMENT_UNKNOWN'
    | 'FULFILLING'
    | 'RENEWAL_PENDING'
    | 'COMPLETED'
    | 'MANUAL_REVIEW'
    | 'REFUND_PENDING'
    | 'REFUNDED'
    | 'ABANDONED'
    | 'FAILED';
  version: number;
  sourceSubscriptionId: string;
  targetPlan: UpgradePlan;
  cancellationState: 'not_required' | 'pending' | 'unknown' | 'confirmed' | 'failed';
  cancellationConfirmedAt: string | null;
  payment: UpgradePayment;
  fulfillment: UpgradeFulfillment;
  renewal: UpgradeRenewal;
  refund: UpgradeRefund;
  support: UpgradeSupport;
  nextAction: UpgradeNextAction;
  allowedActions: Array<'retry' | 'prepare' | 'confirm_quote' | 'abandon'>;
  businessTimezone: 'Asia/Shanghai';
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};
export type UpgradeAdminList = {
  items: Array<UpgradeAdminUpgradeSummary>;
  nextCursor: string | null;
};
export type UpgradeAdminAction = {
  action: 'reconcile' | 'record_progress' | 'refund_undelivered' | 'reconcile_order';
  orderId?: string;
  resolution?: 'compensated_offline' | 'refunded_offline';
  resolutionEvidence?: string;
  reason: string;
  userVisibleProgress?: string;
  notificationChannel?: string;
  notificationEvidence?: string;
};
export type UpgradeOptionsResponse = { code: 200; message: string; data: UpgradeOptions };
export type UpgradeQuoteResponse = { code: 200; message: string; data: UpgradeQuote };
export type UpgradeUpgradeResponse = { code: 200; message: string; data: UpgradeUpgrade };
export type UpgradeAdminListResponse = { code: 200; message: string; data: UpgradeAdminList };
export type UpgradeActiveResponse = { code: 200; message: string; data: UpgradeUpgrade | null };
export type UpgradeSourcePlan = {
  id: string;
  code: string;
  tier: 'basic' | 'standard' | 'premium';
  purchaseMode: 'one_time_month' | 'auto_monthly' | 'one_time_year' | 'auto_yearly';
  monthlyCredits: string;
  priceCents: number;
};
export type UpgradeAdminUpgradeCaseOwner = { userId: string; displayName: string };
export type UpgradeAdminUpgradeActor = {
  kind: 'user' | 'admin' | 'system' | 'provider';
  userId: string | null;
  displayName: string | null;
};
export type UpgradeAdminUpgradeNotification = {
  channel: string;
  deliveredAt: string;
  evidenceSummary: string;
};
export type UpgradeAdminUpgradeAuditEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  receivedAt: string;
  actor: UpgradeAdminUpgradeActor;
  reason: string | null;
  resolution: string | null;
  evidenceSummary: string | null;
  userVisibleProgress: string | null;
  notification: UpgradeAdminUpgradeNotification | null;
};
export type UpgradeAdminUpgradeSummary = {
  unresolvedOrderCount?: number;
  upgrade: UpgradeUpgrade;
  accountId: string;
  workspaceId: string;
  caseOwner: UpgradeAdminUpgradeCaseOwner | null;
  allowedAdminActions: Array<
    'reconcile' | 'record_progress' | 'refund_undelivered' | 'reconcile_order'
  >;
};
export type UpgradeAdminUpgradeDetail = {
  renewalIssues?: Array<UpgradeRenewalIssue>;
  upgrade: UpgradeUpgrade;
  accountId: string;
  workspaceId: string;
  caseOwner: UpgradeAdminUpgradeCaseOwner | null;
  allowedAdminActions: Array<
    'reconcile' | 'record_progress' | 'refund_undelivered' | 'reconcile_order'
  >;
  auditEvents: Array<UpgradeAdminUpgradeAuditEvent>;
  auditNextCursor: string | null;
};
export type UpgradeAdminUpgradeDetailResponse = {
  code: 200;
  message: string;
  data: UpgradeAdminUpgradeDetail;
};

const params = (workspaceId: string) => ({ params: { workspaceId } });
const postConfig = (workspaceId: string, key: string) => ({
  ...params(workspaceId),
  headers: { 'Idempotency-Key': key },
});
export const membershipUpgradeApi = {
  async options(workspaceId: string) {
    return (await client.get<UpgradeOptions>('/subscriptions/upgrade-options', params(workspaceId)))
      .data;
  },
  async quote(workspaceId: string, body: UpgradeQuoteRequest, key: string) {
    return (
      await client.post<UpgradeQuote>(
        '/subscriptions/upgrade-quotes',
        body,
        postConfig(workspaceId, key)
      )
    ).data;
  },
  async create(workspaceId: string, body: UpgradeCreateRequest, key: string) {
    return (
      await client.post<UpgradeUpgrade>(
        '/subscriptions/upgrades',
        body,
        postConfig(workspaceId, key)
      )
    ).data;
  },
  async active(workspaceId: string) {
    return (
      await client.get<UpgradeUpgrade | null>('/subscriptions/upgrades/active', params(workspaceId))
    ).data;
  },
  async detail(workspaceId: string, id: string) {
    return (
      await client.get<UpgradeUpgrade>(
        `/subscriptions/upgrades/${encodeURIComponent(id)}`,
        params(workspaceId)
      )
    ).data;
  },
  async continue(workspaceId: string, id: string, body: UpgradeContinueRequest, key: string) {
    return (
      await client.post<UpgradeUpgrade>(
        `/subscriptions/upgrades/${encodeURIComponent(id)}/continue`,
        body,
        postConfig(workspaceId, key)
      )
    ).data;
  },
  async abandon(workspaceId: string, id: string, body: UpgradeAbandonRequest, key: string) {
    return (
      await client.post<UpgradeUpgrade>(
        `/subscriptions/upgrades/${encodeURIComponent(id)}/abandon`,
        body,
        postConfig(workspaceId, key)
      )
    ).data;
  },
};

export type UpgradeRenewalIssue = {
  orderOrigin?: 'source' | 'target';
  orderId: string;
  orderNo: string;
  periodStartAt: string | null;
  periodEndAt: string | null;
  errorCode: string | null;
  state: 'pending' | 'review' | 'resolved';
  firstFailureAt: string | null;
  manualReviewAt: string | null;
  userUpdateDueAt: string | null;
};
