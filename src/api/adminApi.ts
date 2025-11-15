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
  ownerName?: string; // 工作空间所有者真实姓名
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
  phone?: string;
  ownerName?: string;
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

// 系统配置项接口
export interface SystemConfigItem {
  id: number;
  configKey: string;
  name: string;
  configValue: string;
  valueType: 'string' | 'number' | 'decimal' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// 系统配置枚举选项接口
export interface SystemConfigEnumOption {
  label: string;
  value: string;
  description: string;
}

// 系统配置枚举响应接口
export interface SystemConfigEnumsResponse {
  valueTypes: SystemConfigEnumOption[];
  categories: SystemConfigEnumOption[];
}

// 查询系统配置参数接口
export interface QuerySystemConfigParams {
  configKey?: string;
  name?: string;
  category?: string;
  isEditable?: boolean;
}

// 创建系统配置参数接口
export interface CreateSystemConfigParams {
  configKey: string;
  name: string;
  configValue: string;
  valueType: 'string' | 'number' | 'decimal' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  isEditable?: boolean;
  defaultValue?: string;
  validationRule?: string;
  sortOrder?: number;
}

// 更新系统配置参数接口
export interface UpdateSystemConfigParams {
  name?: string;
  configValue?: string;
  description?: string;
}

// 批量系统配置参数接口
export interface BatchSystemConfigParams {
  updates?: Array<{
    configKey: string;
    name?: string;
    configValue?: string;
    description?: string;
  }>;
  deletes?: string[];
}

// 系统配置审计日志接口
export interface SystemConfigAuditItem {
  id: number;
  configKey: string;
  action: 'create' | 'update' | 'delete' | 'view';
  operatorId?: number;
  operatorName?: string;
  operatorType: 'admin' | 'bot';
  oldValue?: string;
  newValue?: string;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
  createdAt: string;
}

// 查询审计日志参数接口
export interface QueryAuditLogParams {
  page?: number;
  limit?: number;
  configKey?: string;
  action?: string;
  operatorType?: string;
  startDate?: string;
  endDate?: string;
}

// 系统配置列表响应接口
export interface SystemConfigListResponse {
  configs: SystemConfigItem[];
  total: number;
  categoryStats?: Record<string, number>;
}

/**
 * 获取系统配置列表
 */
export async function getSystemConfigList(params: QuerySystemConfigParams = {}) {
  const response = await apiClient.get<SystemConfigListResponse>('/admin/system-config', {
    params,
  });
  return response.data;
}

/**
 * 创建系统配置
 */
export async function createSystemConfig(params: CreateSystemConfigParams) {
  const response = await apiClient.post<SystemConfigItem>('/admin/system-config', params);
  return response.data;
}

/**
 * 更新系统配置
 */
export async function updateSystemConfig(configKey: string, params: UpdateSystemConfigParams) {
  const response = await apiClient.put<SystemConfigItem>(
    `/admin/system-config/${configKey}`,
    params
  );
  return response.data;
}

/**
 * 删除系统配置
 */
export async function deleteSystemConfig(configKey: string) {
  const response = await apiClient.delete(`/admin/system-config/${configKey}`);
  return response.data;
}

/**
 * 批量操作系统配置
 */
export async function batchSystemConfig(params: BatchSystemConfigParams) {
  const response = await apiClient.post('/admin/system-config/batch', params);
  return response.data;
}

/**
 * 获取系统配置审计日志
 */
export async function getSystemConfigAuditLogs(params: QueryAuditLogParams = {}) {
  const response = await apiClient.get<PaginationResponse<SystemConfigAuditItem>>(
    '/admin/system-config/audit-logs',
    { params }
  );
  return response.data;
}

/**
 * 获取系统配置枚举
 */
export async function getSystemConfigEnums() {
  const response = await apiClient.get<SystemConfigEnumsResponse>('/admin/system-config/enums');
  return response.data;
}

// 工作流记录类型
export type WorkflowRunStatus = 'pending' | 'running' | 'success' | 'fail';

export interface WorkflowRecordItem {
  workflowId: string;
  executeId: string;
  status: WorkflowRunStatus;
  debugUrl?: string;
  debugUrlExpiresAt?: string;
  startedAt: string;
  endedAt?: string;
  source?: string;
}

export interface QueryWorkflowRecordsParams {
  page?: number;
  limit?: number;
  status?: WorkflowRunStatus;
  workflowId?: string;
  executeId?: string;
}

export async function getWorkflowRecords(params: QueryWorkflowRecordsParams = {}) {
  const response = await apiClient.get<PaginationResponse<WorkflowRecordItem>>(
    '/admin/workflows/records',
    { params }
  );
  return response.data;
}
