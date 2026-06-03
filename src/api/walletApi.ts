import { PaginationResponse } from '../types/api';
import client from './api2client';

// 后端钱包信息响应类型
export interface WalletInfo {
  // 按充值类型分类统计（金额单位：人民币分；展示用 *Yuan 字符串）
  userRechargeAmountCents: number;
  userRechargeAmountYuan: string;
  userRechargeCredits: number; // 用户充值积分（wechat/alipay）
  platformGiftCredits: number; // 平台赠送积分（bot/manual/give）
  totalCreditsConsumption: number; // 保留：总消耗积分
  availableCredits: number; // 剩余可用积分
  totalExpiredCredits: number; // 总过期积分（账户维度）
}

// 后端交易记录项类型
export interface TransactionItem {
  id: string;
  amountCents: number;
  /** Pre-formatted yuan string (e.g. "9.99") */
  amountYuan: string;
  creditsAmount: number;
  createdAt: string;
  orderNo: string;
  paymentMethod: string;
  thirdPartyOrderNo?: string;
  paidAt?: string;
  creditsValidityDays?: number;
  remainingCredits?: number | string; // 剩余积分数量（前端显示规则在视图中处理）
  status?: string; // 充值记录状态：success / refunded 等
  rechargeRecordId?: number; // 关联 RechargeRecord 主键，管理端退款接口需要
  subscriptionId?: number; // 订阅行：所属订阅ID（用于周期积分清零）
  periodId?: number; // 订阅行：所属周期ID（用于周期积分清零）
}

// 充值积分清零响应
export interface RefundRechargeResponse {
  rechargeRecordId: number;
  orderNo: string;
  refundedCredits: number;
  status: string;
}
/**
 * 获取钱包信息
 * @param workspaceId 工作空间ID
 * @returns 钱包信息
 */
export async function getWalletInfo(workspaceId: string) {
  const response = await client.get<WalletInfo>(`/wallet/info`, { params: { workspaceId } });
  return response.data;
}

/**
 * 获取钱包交易记录
 * @param params 查询参数
 * @returns 交易记录列表
 */
export async function getWalletRechargeRecords(params?: {
  workspaceId: string;
  page?: number;
  limit?: number;
  transactionType?: string;
}) {
  const response = await client.get<PaginationResponse<TransactionItem>>(
    `/wallet/recharge/records`,
    { params }
  );
  return response.data;
}

// 已过期积分列表项
export interface ExpiredCreditItem {
  id: string; // EXPIRE 交易ID
  expiredCredits: number; // 过期积分（绝对值）
  expiredAt: string; // 过期时间（交易创建时间）
  recharge: {
    id: string;
    orderNo: string;
    paymentMethod: string;
  };
}

// 已过期积分响应
export interface ExpiredCreditsResponse {
  list: ExpiredCreditItem[];
  summary: {
    totalExpiredCredits: number;
    byPaymentMethod: Record<string, number>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 获取已过期积分列表与汇总
 */
export async function getExpiredCredits(params: {
  workspaceId: string;
  page?: number;
  limit?: number;
  paymentMethod?: string;
}): Promise<ExpiredCreditsResponse> {
  const response = await client.get<ExpiredCreditsResponse>(`/wallet/credits/expired/records`, {
    params,
  });
  return response.data;
}

// 消费记录查询参数
export interface QueryCreditsConsumptionParams {
  apiKeyId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

// 消费记录项
export interface CreditsConsumptionItem {
  id: number;
  transactionId: string;
  prompt?: string;
  serviceDetails?: Record<string, any>;
  displayDetails?: {
    reason?: string;
    urls?: string[];
    prompt?: string;
  };
  creditsAmount: number;
  apiKeyId?: string;
  createdAt: string;
}

/**
 * 获取指定工作空间的积分消费记录（管理员）
 */
export async function getWorkspaceConsumptionRecords(
  workspaceId: string,
  params: QueryCreditsConsumptionParams = {}
) {
  const response = await client.get<PaginationResponse<CreditsConsumptionItem>>(
    `/wallet/credits/consumption/records`,
    { params: { ...params, workspaceId } }
  );
  return response.data;
}

/**
 * 充值记录积分清零（管理员；扣减剩余可用积分并标记为已退款）
 */
export async function refundWorkspaceRecharge(rechargeRecordId: number, reason: string) {
  const response = await client.post<RefundRechargeResponse>(
    `/admin/recharge/${rechargeRecordId}/refund`,
    { reason }
  );
  return response.data;
}

/**
 * 通过 transactionId 查询单条积分消费记录（用于工作流记录详情联动）
 */
export async function getConsumptionByTransactionId(workspaceId: string, transactionId: string) {
  const response = await client.get<CreditsConsumptionItem>(
    `/wallet/credits/consumption/by-transaction/${encodeURIComponent(transactionId)}`,
    { params: { workspaceId } }
  );
  return response.data;
}
