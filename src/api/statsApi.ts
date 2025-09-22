import type { ApiResponse, UserStatDaily, UserStatHourly } from '../types/api';
import type {
  DailyStatsParams,
  DailyStatsResponse,
  HourlyStatsParams,
  HourlyStatsResponse,
} from '../types/stats';
import client from './apiClient';

/**
 * 获取用户小时统计数据 (新版API)
 * @param params 查询参数
 * @returns 小时统计数据
 */
export async function getUserHourlyStats(params: HourlyStatsParams): Promise<HourlyStatsResponse> {
  const response = await client.get('/user-stat/hourly', {
    params: {
      username: params.username,
      date: params.date,
    },
  });
  return response.data;
}

/**
 * 获取用户日统计数据 (新版API)
 * @param params 查询参数
 * @returns 日统计数据
 */
export async function getUserDailyStats(params: DailyStatsParams): Promise<DailyStatsResponse> {
  const response = await client.get('/user-stat/daily', {
    params: {
      username: params.username,
      start: params.start,
      end: params.end,
    },
  });
  return response.data;
}

/**
 * 获取用户小时统计数据 (旧版API - 保持兼容性)
 * @param params 查询参数
 * @returns 小时统计数据
 */
export async function getUserStatHourly(params: {
  startDate: string;
  endDate: string;
  userId?: string;
}): Promise<ApiResponse<UserStatHourly[]>> {
  const response = await client.get('/api/user-stat/hourly', { params });
  return response.data;
}

/**
 * 获取用户日统计数据 (旧版API - 保持兼容性)
 * @param params 查询参数
 * @returns 日统计数据
 */
export async function getUserStatDaily(params: {
  startDate: string;
  endDate: string;
  userId?: string;
}): Promise<ApiResponse<UserStatDaily[]>> {
  const response = await client.get('/api/user-stat/daily', { params });
  return response.data;
}

/**
 * 获取工作空间统计概览
 * @param workspaceId 工作空间ID
 * @param period 统计周期
 * @returns 统计概览
 */
export async function getWorkspaceOverview(
  workspaceId: string,
  period: 'today' | 'week' | 'month' | 'year' = 'today'
): Promise<
  ApiResponse<{
    totalRequests: number;
    totalTokens: number;
    totalCost: string;
    activeUsers: number;
    apiCalls: number;
    successRate: number;
  }>
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/overview`, {
    params: { period },
  });
  return response.data;
}

/**
 * 获取API使用统计
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns API使用统计
 */
export async function getApiUsageStats(
  workspaceId: string,
  params: {
    startDate: string;
    endDate: string;
    apiKeyId?: string;
    groupBy?: 'hour' | 'day' | 'week';
  }
): Promise<
  ApiResponse<
    Array<{
      period: string;
      requests: number;
      successCount: number;
      errorCount: number;
      avgResponseTime: number;
    }>
  >
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/api-usage`, {
    params,
  });
  return response.data;
}

/**
 * 获取用户活跃度统计
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 用户活跃度统计
 */
export async function getUserActivityStats(
  workspaceId: string,
  params: {
    startDate: string;
    endDate: string;
    groupBy?: 'hour' | 'day';
  }
): Promise<
  ApiResponse<
    Array<{
      period: string;
      activeUsers: number;
      newUsers: number;
      totalSessions: number;
      avgSessionDuration: number;
    }>
  >
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/user-activity`, {
    params,
  });
  return response.data;
}

/**
 * 获取成本分析统计
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 成本分析统计
 */
export async function getCostAnalysis(
  workspaceId: string,
  params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }
): Promise<
  ApiResponse<
    Array<{
      period: string;
      totalCost: string;
      apiCost: string;
      storageCost: string;
      bandwidthCost: string;
      breakdown: Array<{
        category: string;
        cost: string;
        percentage: number;
      }>;
    }>
  >
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/cost-analysis`, {
    params,
  });
  return response.data;
}

/**
 * 获取错误统计
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 错误统计
 */
export async function getErrorStats(
  workspaceId: string,
  params: {
    startDate: string;
    endDate: string;
    errorType?: string;
  }
): Promise<
  ApiResponse<
    Array<{
      errorType: string;
      errorCode: string;
      count: number;
      percentage: number;
      lastOccurred: string;
    }>
  >
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/errors`, {
    params,
  });
  return response.data;
}

/**
 * 获取性能统计
 * @param workspaceId 工作空间ID
 * @param params 查询参数
 * @returns 性能统计
 */
export async function getPerformanceStats(
  workspaceId: string,
  params: {
    startDate: string;
    endDate: string;
    endpoint?: string;
  }
): Promise<
  ApiResponse<{
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  }>
> {
  const response = await client.get(`/api/stats/workspace/${workspaceId}/performance`, {
    params,
  });
  return response.data;
}

/**
 * 导出统计报告
 * @param workspaceId 工作空间ID
 * @param params 导出参数
 * @returns 导出文件URL
 */
export async function exportStatsReport(
  workspaceId: string,
  params: {
    reportType: 'overview' | 'usage' | 'cost' | 'performance';
    format: 'pdf' | 'excel' | 'csv';
    startDate: string;
    endDate: string;
  }
): Promise<ApiResponse<{ downloadUrl: string }>> {
  const response = await client.post(`/api/stats/workspace/${workspaceId}/export`, params);
  return response.data;
}
