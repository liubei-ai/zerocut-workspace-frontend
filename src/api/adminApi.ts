import type { PaginationResponse } from '@/types/api';
import apiClient from './api2client';

// 工作空间列表项接口
export interface WorkspaceListItem {
  id: number;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  ownerId: number;
  ownerEmail: string;
  ownerPhone?: string;
  ownerUsername: string;
  memberCount: number;
  creditsBalance: number;
  createdAt: string;
  updatedAt: string;
}

// 查询工作空间参数接口
export interface QueryWorkspacesParams {
  page?: number;
  limit?: number;
  email?: string;
  name?: string;
}

// 充值请求参数接口
export interface CreateRechargeParams {
  workspaceId?: string;
  amount: number;
  thirdPartyOrderNo?: string;
  paymentMethod?: 'manual' | 'give';
  paymentDetails?: Record<string, any>;
}

// 充值响应接口
export interface RechargeResponse {
  id: number;
  orderNo: string;
  workspaceId: string;
  amount: number;
  creditsAmount: number;
  status: string;
  paymentMethod: string;
  thirdPartyOrderNo?: string;
  paymentDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取工作空间列表
 */
export async function getWorkspaceList(params: QueryWorkspacesParams = {}) {
  const response = await apiClient.get<PaginationResponse<WorkspaceListItem>>(
    '/admin/workspace/list',
    { params }
  );
  return response.data;
}

/**
 * 创建充值记录
 */
export const createRecharge = async (params: CreateRechargeParams): Promise<RechargeResponse> => {
  const response = await apiClient.post<RechargeResponse>('/admin/recharge/create', params);
  return response.data;
};
