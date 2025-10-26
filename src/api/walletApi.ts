import { PaginationResponse } from '../types/api';
import client from './api2client';

// 后端钱包信息响应类型
export interface WalletInfo {
  // 按充值类型分类统计
  userRechargeAmount: number; // 用户充值金额（wechat/alipay）
  userRechargeCredits: number; // 用户充值积分（wechat/alipay）
  platformGiftCredits: number; // 平台赠送积分（bot/manual/give）
  totalCreditsConsumption: number; // 保留：总消耗积分
  availableCredits: number; // 剩余可用积分
}

// 后端交易记录项类型
export interface TransactionItem {
  id: string;
  amount: number;
  creditsAmount: number;
  description: string;
  createdAt: string;
  orderNo: string;
  paymentMethod: string;
  thirdPartyOrderNo?: string;
  paidAt?: string;
  creditsValidityDays?: number;
  remainingCredits?: number; // 剩余积分数量
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
  serviceType?: string;
}) {
  const response = await client.get<PaginationResponse<TransactionItem>>(
    `/wallet/recharge/records`,
    { params }
  );
  return response.data;
}

// 充值提现功能暂不实现，相关接口已移除
// 统计、导出、通知等高级功能暂不实现，专注于核心钱包信息和交易记录功能
