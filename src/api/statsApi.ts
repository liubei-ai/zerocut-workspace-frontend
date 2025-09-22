import type {
  DailyStatsData,
  DailyStatsParams,
  HourlyStatsData,
  HourlyStatsParams,
} from '../types/stats';
import client from './apiClient';

/**
 * 获取用户小时统计数据 (新版API)
 * @param params 查询参数
 * @returns 小时统计数据
 */
export async function getUserHourlyStats(params: HourlyStatsParams) {
  const response = await client.get<HourlyStatsData>('/user-stat/hourly', { params });
  return response.data;
}

/**
 * 获取用户日统计数据 (新版API)
 * @param params 查询参数
 * @returns 日统计数据
 */
export async function getUserDailyStats(params: DailyStatsParams) {
  const response = await client.get<DailyStatsData>('/user-stat/daily', { params });
  return response.data;
}
