import { PaginationResponse } from '../types/api';
import client from './api2Client';

// 后端钱包信息响应类型
export interface WalletInfo {
  creditsBalance: number;
  totalAmountAdded: number;
  totalCreditsAdded: number;
  totalCreditsConsumption: number;
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
}
/**
 * 获取钱包信息
 * @param workspaceId 工作空间ID
 * @returns 钱包信息
 */
export async function getWalletInfo(workspaceId: string) {
  const response = await client.get<WalletInfo>(`/wallet/${workspaceId}/info`);
  return response.data;
}

/**
 * 获取钱包交易记录
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 交易记录列表
 */
export async function getWalletRechargeRecords(
  workspaceId: string,
  params?: {
    page?: number;
    limit?: number;
    transactionType?: string;
    serviceType?: string;
  }
) {
  const response = await client.get<PaginationResponse<TransactionItem>>(
    `/wallet/${workspaceId}/recharge/records`,
    {
      params,
    }
  );
  return response.data;
}

// 充值提现功能暂不实现，相关接口已移除
// 统计、导出、通知等高级功能暂不实现，专注于核心钱包信息和交易记录功能
