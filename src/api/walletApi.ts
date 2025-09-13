import type { ApiResponse, WalletInfo, WalletTransaction } from '../types/api';
import client from './client';

/**
 * 获取钱包信息
 * @param workspaceId 工作空间ID
 * @returns 钱包信息
 */
export async function getWalletInfo(workspaceId: string): Promise<ApiResponse<WalletInfo>> {
  const response = await client.get(`/wallet/${workspaceId}/info`);
  return response.data;
}

/**
 * 获取钱包余额
 * @param workspaceId 工作空间ID
 * @returns 钱包余额信息
 */
export async function getWalletBalance(
  workspaceId: string
): Promise<ApiResponse<{ balance: string; currency: string }>> {
  const response = await client.get(`/api/wallet/balance`, {
    params: { workspaceId },
  });
  return response.data;
}

/**
 * 获取钱包交易记录
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 交易记录列表
 */
export async function getWalletTransactions(
  workspaceId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<{ transactions: WalletTransaction[]; total: number }>> {
  const response = await client.get(`/wallet/${workspaceId}/transactions`, {
    params,
  });
  return response.data;
}

/**
 * 创建充值订单
 * @param workspaceId 工作空间ID
 * @param rechargeData 充值信息
 * @returns 充值订单信息
 */
export async function createRechargeOrder(
  workspaceId: string,
  rechargeData: {
    amount: string;
    paymentMethod: string;
    currency?: string;
  }
): Promise<ApiResponse<{ orderId: string; paymentUrl?: string }>> {
  const response = await client.post(`/wallet/${workspaceId}/recharge`, rechargeData);
  return response.data;
}

/**
 * 查询充值订单状态
 * @param workspaceId 工作空间ID
 * @param orderId 订单ID
 * @returns 订单状态
 */
export async function getRechargeOrderStatus(
  workspaceId: string,
  orderId: string
): Promise<ApiResponse<{ status: string; amount: string; createdAt: string }>> {
  const response = await client.get(`/wallet/${workspaceId}/recharge/${orderId}`);
  return response.data;
}

/**
 * 获取支付方式列表
 * @returns 支付方式列表
 */
export async function getPaymentMethods(): Promise<
  ApiResponse<{ methods: Array<{ id: string; name: string; enabled: boolean }> }>
> {
  const response = await client.get('/wallet/payment-methods');
  return response.data;
}

/**
 * 获取钱包统计信息
 * @param workspaceId 工作空间ID
 * @param period 统计周期
 * @returns 统计信息
 */
export async function getWalletStats(
  workspaceId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<
  ApiResponse<{
    totalIncome: string;
    totalExpense: string;
    transactionCount: number;
    averageTransaction: string;
  }>
> {
  const response = await client.get(`/wallet/${workspaceId}/stats`, {
    params: { period },
  });
  return response.data;
}

/**
 * 导出钱包交易记录
 * @param workspaceId 工作空间ID
 * @param params 导出参数
 * @returns 导出文件URL
 */
export async function exportTransactions(
  workspaceId: string,
  params: {
    format: 'csv' | 'excel';
    startDate: string;
    endDate: string;
    type?: string;
  }
): Promise<ApiResponse<{ downloadUrl: string }>> {
  const response = await client.post(`/wallet/${workspaceId}/export`, params);
  return response.data;
}

/**
 * 设置钱包通知配置
 * @param workspaceId 工作空间ID
 * @param notificationConfig 通知配置
 * @returns 设置结果
 */
export async function setWalletNotifications(
  workspaceId: string,
  notificationConfig: {
    lowBalanceAlert: boolean;
    lowBalanceThreshold?: string;
    transactionNotification: boolean;
    emailNotification: boolean;
  }
): Promise<ApiResponse<void>> {
  const response = await client.patch(`/wallet/${workspaceId}/notifications`, notificationConfig);
  return response.data;
}
