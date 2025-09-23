import { getUserDailyStats, getUserHourlyStats } from '@/api/statsApi';
import type {
  ComputedStatsData,
  DailyStatsData,
  DashboardState,
  DateRange,
  HeatmapChartData,
  HourlyStatsData,
  MetricCardData,
  MetricType,
  PieChartData,
  StatisticsChartData,
  TrendChartData,
} from '@/types/stats';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useStatsStore = defineStore('stats', () => {
  // 状态
  const hourlyData = ref<HourlyStatsData | null>(null);
  const dailyData = ref<DailyStatsData | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedDateRange = ref<DateRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天前
    end: new Date().toISOString().split('T')[0], // 今天
  });

  const selectedMetric = ref<MetricType>('image_count');
  const lastUpdated = ref<string | null>(null);

  // 计算属性 - 概览卡片数据
  const summaryCards = computed((): MetricCardData[] => {
    if (!dailyData.value) return [];

    const { summary } = dailyData.value;
    const cards: MetricCardData[] = [
      {
        title: '图片生成',
        value: summary.total_image_count,
        unit: '张',
        icon: 'mdi-image',
        color: 'primary',
      },
      {
        title: '视频生成',
        value: summary.total_video_count,
        unit: '个',
        icon: 'mdi-video',
        color: 'secondary',
      },
      {
        title: '视频时长',
        value: Math.round(summary.total_video_duration / 60), // 转换为分钟
        unit: '分钟',
        icon: 'mdi-clock',
        color: 'success',
      },
      {
        title: 'TTS语音',
        value: summary.total_tts_count,
        unit: '个',
        icon: 'mdi-microphone',
        color: 'info',
      },
      {
        title: '背景音乐',
        value: summary.total_bgm_count,
        unit: '个',
        icon: 'mdi-music',
        color: 'error',
      },
      {
        title: '消耗积分',
        value: summary.total_points_consumed,
        unit: '积分',
        icon: 'mdi-coin',
        color: 'warning',
      },
    ];

    return cards;
  });

  // 计算属性 - 趋势图表数据
  const trendData = computed((): TrendChartData => {
    if (!dailyData.value) {
      return { categories: [], series: [] };
    }

    const { daily_data } = dailyData.value;
    const categories = daily_data.map(item => item.date);

    const series = [
      {
        name: '图片生成',
        data: daily_data.map(item => item.image_count),
        type: 'line' as const,
      },
      {
        name: '视频生成',
        data: daily_data.map(item => item.video_count),
        type: 'line' as const,
      },
      {
        name: '视频时长(分钟)',
        data: daily_data.map(item => Math.round(item.video_duration / 60)),
        type: 'line' as const,
      },
      {
        name: '消耗积分',
        data: daily_data.map(item => item.points_consumed),
        type: 'line' as const,
      },
    ];

    return { categories, series };
  });

  // 计算属性 - 分布饼图数据
  const distributionData = computed((): PieChartData[] => {
    if (!dailyData.value) return [];

    const { summary } = dailyData.value;
    const total = summary.total_image_count + summary.total_video_count;

    if (total === 0) return [];

    return [
      {
        name: '图片生成',
        value: summary.total_image_count,
        percentage: Math.round((summary.total_image_count / total) * 100),
      },
      {
        name: '视频生成',
        value: summary.total_video_count,
        percentage: Math.round((summary.total_video_count / total) * 100),
      },
    ];
  });

  // 计算属性 - 热力图数据
  const heatmapData = computed((): HeatmapChartData[] => {
    if (!hourlyData.value) return [];

    const { hourly_data, date } = hourlyData.value;

    return hourly_data.map(item => ({
      hour: item.hour,
      day: date,
      value: item[selectedMetric.value],
    }));
  });

  // 计算属性 - 统计图表数据
  const statisticsChartData = computed((): StatisticsChartData => {
    if (!dailyData.value?.daily_data) {
      return { categories: [], series: [] };
    }

    const { daily_data } = dailyData.value;

    const categories = daily_data.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const series = [
      {
        name: '图片生成',
        data: daily_data.map(item => item.image_count),
        type: 'bar' as const,
        color: '#1976d2',
      },
      {
        name: '视频生成',
        data: daily_data.map(item => item.video_count),
        type: 'bar' as const,
        color: '#388e3c',
      },
      {
        name: '视频时长(秒)',
        data: daily_data.map(item => item.video_duration),
        type: 'line' as const,
        color: '#ff9800',
      },
      {
        name: '积分消耗',
        data: daily_data.map(item => item.points_consumed),
        type: 'line' as const,
        color: '#e91e63',
      },
    ];

    return {
      categories,
      series,
    };
  });

  // 计算属性 - 仪表板状态
  const dashboardState = computed(
    (): DashboardState => ({
      loading: loading.value,
      error: error.value,
      selectedDateRange: selectedDateRange.value,
      selectedMetric: selectedMetric.value,
      lastUpdated: lastUpdated.value,
    })
  );

  // 计算属性 - 所有计算数据
  const computedData = computed(
    (): ComputedStatsData => ({
      summaryCards: summaryCards.value,
      trendData: trendData.value,
      distributionData: distributionData.value,
      heatmapData: heatmapData.value,
      statisticsChartData: statisticsChartData.value,
      comparisonData: [], // 暂时为空，后续可扩展
    })
  );

  // 工具函数
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Actions
  const fetchHourlyStats = async (date: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getUserHourlyStats({ date });
      hourlyData.value = response;
    } catch (err) {
      error.value = err.message || '网络错误';
      console.error('获取小时统计数据失败:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchDailyStats = async (start: string, end: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getUserDailyStats({ start, end });
      dailyData.value = response;
    } catch (err) {
      error.value = err.message || '网络错误';
      console.error('获取日统计数据失败:', err);
    } finally {
      loading.value = false;
    }
  };

  const refreshData = async () => {
    const promises: Promise<void>[] = [];

    // 获取日统计数据
    promises.push(fetchDailyStats(selectedDateRange.value.start, selectedDateRange.value.end));

    // 获取今天的小时统计数据
    // const today = new Date().toISOString().split('T')[0];
    // promises.push(fetchHourlyStats(today));

    await Promise.all(promises);
  };

  const setDateRange = (range: DateRange) => {
    selectedDateRange.value = range;
  };

  const setMetric = (metric: MetricType) => {
    selectedMetric.value = metric;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    hourlyData.value = null;
    dailyData.value = null;
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
  };

  return {
    // 状态
    hourlyData,
    dailyData,
    loading,
    error,
    selectedDateRange,
    selectedMetric,
    lastUpdated,

    // 计算属性
    summaryCards,
    trendData,
    distributionData,
    heatmapData,
    statisticsChartData,
    dashboardState,
    computedData,

    // 工具函数
    formatDuration,
    formatNumber,

    // Actions
    fetchHourlyStats,
    fetchDailyStats,
    refreshData,
    setDateRange,
    setMetric,
    clearError,
    reset,
  };
});
