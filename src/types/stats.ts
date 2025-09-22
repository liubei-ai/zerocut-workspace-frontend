// 统计数据相关类型定义

import type { ApiResponse } from './api';

// 基础统计数据项
export interface BaseStatsItem {
  image_count: number;
  video_count: number;
  video_duration: number;
  points_consumed: number;
}

// 小时统计数据项
export interface HourlyStatsItem extends BaseStatsItem {
  hour: number; // 0-23
}

// 日统计数据项
export interface DailyStatsItem extends BaseStatsItem {
  date: string; // yyyy-mm-dd
}

// 统计汇总数据
export interface StatsSummary {
  total_image_count: number;
  total_video_count: number;
  total_video_duration: number;
  total_points_consumed: number;
}

// 统计分析数据
export interface StatsAnalysis {
  total: number;
  average: number;
  max: number;
  min: number;
}

// 时间百分比分布
export interface TimePercentage {
  hour?: number;
  date?: string;
  percentage: number;
}

// 详细统计分析
export interface DetailedStatsAnalysis {
  image_count: StatsAnalysis & {
    hour_percentages?: TimePercentage[];
    date_percentages?: TimePercentage[];
  };
  video_count: StatsAnalysis & {
    hour_percentages?: TimePercentage[];
    date_percentages?: TimePercentage[];
  };
  video_duration: StatsAnalysis & {
    hour_percentages?: TimePercentage[];
    date_percentages?: TimePercentage[];
  };
  points_consumed: StatsAnalysis & {
    hour_percentages?: TimePercentage[];
    date_percentages?: TimePercentage[];
  };
}

// 小时统计响应数据
export interface HourlyStatsData {
  workspace_id: string;
  username: string;
  date: string;
  hourly_data: HourlyStatsItem[];
  summary: StatsSummary;
  statistics: DetailedStatsAnalysis;
}

// 日统计响应数据
export interface DailyStatsData {
  workspace_id: string;
  username: string;
  start_date: string;
  end_date: string;
  daily_data: DailyStatsItem[];
  summary: StatsSummary;
  statistics: DetailedStatsAnalysis;
}

// API响应类型
export type HourlyStatsResponse = ApiResponse<HourlyStatsData>;
export type DailyStatsResponse = ApiResponse<DailyStatsData>;

// 图表数据类型
export interface ChartDataPoint {
  name: string;
  value: number;
  time?: string | number;
}

export interface TrendChartData {
  categories: (string | number)[];
  series: {
    name: string;
    data: number[];
    type: 'line';
    color?: string;
  }[];
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
}

export interface HeatmapChartData {
  hour: number;
  day: string;
  value: number;
}

// 指标类型枚举
export type MetricType = 'image_count' | 'video_count' | 'video_duration' | 'points_consumed';

// 时间范围类型
export interface DateRange {
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd
}

// 概览卡片数据
export interface MetricCardData {
  title: string;
  subtitle?: string;
  value: number;
  unit: string;
  previousValue?: number;
  change?: number; // 变化百分比
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  actionIcon?: string;
  color: string;
  format?: 'currency' | 'percentage' | 'duration' | 'number';
  description?: string;
}

// 仪表板状态
export interface DashboardState {
  loading: boolean;
  error: string | null;
  selectedDateRange: DateRange;
  selectedMetric: MetricType;
  selectedUsername: string;
  lastUpdated: string | null;
}

// 计算属性数据
export interface ComputedStatsData {
  summaryCards: MetricCardData[];
  trendData: TrendChartData;
  distributionData: PieChartData[];
  heatmapData: HeatmapChartData[];
  comparisonData: ChartDataPoint[];
}

// API请求参数
export interface HourlyStatsParams {
  username: string;
  date: string; // yyyy-mm-dd
}

export interface DailyStatsParams {
  username: string;
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd
}

// 错误类型
export interface StatsError {
  code: number;
  message: string;
  type: 'validation' | 'permission' | 'not_found' | 'server_error';
}

// 数据转换工具函数类型
export interface StatsTransformUtils {
  formatDuration: (seconds: number) => string;
  formatNumber: (num: number) => string;
  calculatePercentageChange: (current: number, previous: number) => number;
  generateTrendData: (
    data: (HourlyStatsItem | DailyStatsItem)[],
    metric: MetricType
  ) => TrendChartData;
  generateDistributionData: (summary: StatsSummary) => PieChartData[];
  generateHeatmapData: (hourlyData: HourlyStatsItem[], metric: MetricType) => HeatmapChartData[];
}
