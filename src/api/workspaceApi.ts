import type {
  ApiKey,
  ConsumptionRecord,
  CreateApiKeyRequest,
  RechargeRecord,
  WorkspaceDetails,
  WorkspaceMember,
} from '../types/api';
import client from './client';

/**
 * 获取工作空间详情
 * @param workspaceId 工作空间ID
 * @returns 工作空间详细信息
 */
export async function getWorkspaceDetails(workspaceId: string): Promise<WorkspaceDetails> {
  const response = await client.get(`/workspaces/${workspaceId}/details`);
  return response.data;
}

/**
 * 获取工作空间成员列表
 * @param workspaceId 工作空间ID
 * @returns 成员列表
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await client.get(`/workspaces/${workspaceId}/members`);
  return response.data;
}

/**
 * 添加工作空间成员
 * @param workspaceId 工作空间ID
 * @param memberData 成员信息
 * @returns 添加结果
 */
export async function addWorkspaceMember(
  workspaceId: string,
  memberData: { email: string; role: string }
): Promise<WorkspaceMember> {
  const response = await client.post(`/workspaces/${workspaceId}/members`, memberData);
  return response.data;
}

/**
 * 移除工作空间成员
 * @param workspaceId 工作空间ID
 * @param memberId 成员ID
 * @returns 移除结果
 */
export async function removeWorkspaceMember(workspaceId: string, memberId: number): Promise<void> {
  const response = await client.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  return response.data;
}

/**
 * 更新成员角色
 * @param workspaceId 工作空间ID
 * @param memberId 成员ID
 * @param role 新角色
 * @returns 更新结果
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: number,
  role: string
): Promise<WorkspaceMember> {
  const response = await client.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
  return response.data;
}

/**
 * 获取API密钥列表
 * @param workspaceId 工作空间ID
 * @returns API密钥列表
 */
export async function getApiKeys(workspaceId: string) {
  const response = await client.get<ApiKey[]>(`/workspaces/${workspaceId}/api-keys`);
  return response.data;
}

/**
 * 创建API密钥
 * @param workspaceId 工作空间ID
 * @param keyData 密钥信息
 * @returns 创建的API密钥响应
 */
export async function createApiKey(workspaceId: string, keyData: CreateApiKeyRequest) {
  const response = await client.post<ApiKey & { apiKey: string }>(
    `/workspaces/${workspaceId}/api-keys`,
    keyData
  );
  return response.data;
}

/**
 * 删除API密钥
 * @param workspaceId 工作空间ID
 * @param keyId 密钥ID
 * @returns 删除结果
 */
export async function deleteApiKey(workspaceId: string, keyId: number) {
  const response = await client.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`);
  return response.data;
}

/**
 * 更新API密钥状态
 * @param workspaceId 工作空间ID
 * @param keyId 密钥ID
 * @param status 新状态
 * @returns 更新结果
 */
export async function updateApiKeyStatus(workspaceId: string, keyId: number, status: string) {
  const response = await client.put<ApiKey>(`/workspaces/${workspaceId}/api-keys/${keyId}`, {
    status,
  });
  return response.data;
}

/**
 * 获取消费记录
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 消费记录列表
 */
export async function getConsumptionRecords(
  workspaceId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ records: ConsumptionRecord[]; total: number }> {
  const response = await client.get(`/workspaces/${workspaceId}/credits/consumption-records`, {
    params,
  });
  return response.data;
}

/**
 * 获取充值记录
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 充值记录列表
 */
export async function getRechargeRecords(
  workspaceId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ records: RechargeRecord[]; total: number }> {
  const response = await client.get(`/workspaces/${workspaceId}/credits/recharge-records`, {
    params,
  });
  return response.data;
}

/**
 * 更新工作空间信息
 * @param workspaceId 工作空间ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export async function updateWorkspace(
  workspaceId: string,
  updateData: {
    name?: string;
    description?: string;
    settings?: any;
  }
): Promise<WorkspaceDetails> {
  const response = await client.patch(`/workspaces/${workspaceId}`, updateData);
  return response.data;
}
