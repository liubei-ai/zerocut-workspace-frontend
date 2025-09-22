<script setup lang="ts">
import { useStatsStore } from '@/stores/statsStore';
import type { HeatmapChartData, MetricCardData, TrendChartData } from '@/types/stats';
import MetricCard from '~/src/components/dashboard/MetricCard.vue';

import { computed, onMounted, ref } from 'vue';

const statsStore = useStatsStore();

// 加载状态
const loading = ref(true);

// 计算属性：指标卡片数据 - 使用statsStore的summaryCards
const metricCards = computed(() => {
  return statsStore.summaryCards.map(card => ({
    ...card,
    subtitle: '',
    previousValue: 0,
    changeLabel: '',
    variant: 'default',
    actionIcon: 'mdi-chevron-right',
    format: 'number' as const,
    description: '',
  }));
});

// 计算属性：趋势图表数据
const trendChartData = computed<TrendChartData>(() => {
  if (statsStore.trendData.series.length > 0) {
    return {
      categories: statsStore.trendData.series[0]?.data.map((_, index) => `Day ${index + 1}`) || [],
      series: statsStore.trendData.series.map(s => ({
        ...s,
        color: s.name === '图片生成' ? '#1976d2' : s.name === '视频生成' ? '#388e3c' : '#ff9800',
      })),
    };
  }

  // 默认数据
  return {
    categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    series: [
      {
        name: '图片生成',
        data: [120, 132, 101, 134, 90, 230, 210],
        type: 'line' as const,
        color: '#1976d2',
      },
      {
        name: '视频生成',
        data: [80, 92, 71, 94, 60, 180, 160],
        type: 'line' as const,
        color: '#388e3c',
      },
    ],
  };
});

// 计算属性：分布图表数据
const distributionChartData = computed(() => {
  if (statsStore.distributionData.length > 0) {
    return statsStore.distributionData;
  }

  // 默认数据
  return [
    { name: '图片生成', value: 65, percentage: 65 },
    { name: '视频生成', value: 35, percentage: 35 },
  ];
});

// 计算属性：热力图数据
const heatmapChartData = computed(() => {
  if (statsStore.heatmapData.length > 0) {
    return statsStore.heatmapData;
  }

  // 默认数据
  const defaultData: HeatmapChartData[] = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      defaultData.push({
        hour,
        day: days[day],
        value: Math.floor(Math.random() * 100),
      });
    }
  }

  return defaultData;
});

// 最近活动 - 使用模拟数据
const recentActivities = ref([
  {
    id: 1,
    type: 'video',
    title: '生成营销视频',
    time: '2分钟前',
    status: 'completed',
  },
  {
    id: 2,
    type: 'image',
    title: '创建产品图片',
    time: '5分钟前',
    status: 'processing',
  },
  {
    id: 3,
    type: 'video',
    title: '制作宣传片',
    time: '10分钟前',
    status: 'completed',
  },
]);

// 工作空间信息 - 使用模拟数据
const workspaceInfo = ref({
  name: '默认工作空间',
  members: 5,
  storage: {
    used: 2.4,
    total: 10,
  },
});

// 生命周期
onMounted(async () => {
  try {
    loading.value = true;

    // 设置日期范围为最近7天
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    statsStore.setDateRange({ start: startDate, end: endDate });

    // 获取数据
    await statsStore.refreshData();
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
});

// 事件处理
const handleMetricAction = (metric: MetricCardData) => {
  console.log('Metric action clicked:', metric.title);
  // 可以导航到详细页面或显示更多信息
};

const handleChartInteraction = (data: any) => {
  console.log('Chart interaction:', data);
  // 处理图表交互事件
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'info';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return 'mdi-video';
    case 'image':
      return 'mdi-image';
    default:
      return 'mdi-file';
  }
};

// 导出图表方法
const trendChart = ref();
const distributionChart = ref();
const heatmapChart = ref();

const exportTrendChart = () => {
  const chartInstance = trendChart.value?.getInstance();
  if (chartInstance) {
    chartInstance.getDataURL({
      type: 'png',
      backgroundColor: '#fff',
    });
  }
};

const exportDistributionChart = () => {
  const chartInstance = distributionChart.value?.getInstance();
  if (chartInstance) {
    chartInstance.getDataURL({
      type: 'png',
      backgroundColor: '#fff',
    });
  }
};

const exportHeatmapChart = () => {
  const chartInstance = heatmapChart.value?.getInstance();
  if (chartInstance) {
    chartInstance.getDataURL({
      type: 'png',
      backgroundColor: '#fff',
    });
  }
};
</script>

<template>
  <div class="pa-6">
    页面标题
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">数据看板</h1>
      <p class="text-subtitle-1 text-medium-emphasis">实时监控您的视频创作数据和使用情况</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-h6">加载数据中...</div>
    </div>

    <div v-else>
      <!-- 统计卡片 -->
      <v-row class="mb-6">
        <v-col v-for="metric in metricCards" :key="metric.title" cols="12" sm="6" md="3">
          <MetricCard
            :data="{
              ...metric,
              unit: '',
              color:
                metric.variant === 'primary'
                  ? '#1976d2'
                  : metric.variant === 'secondary'
                    ? '#9c27b0'
                    : metric.variant === 'success'
                      ? '#388e3c'
                      : '#ff9800',
            }"
            @click="handleMetricAction"
            @action="handleMetricAction"
          />
        </v-col>
      </v-row>

      <!-- 主要内容区域 -->
      <v-row>
        <!-- 趋势图表 -->
        <v-col cols="12" lg="8">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-areaspline</v-icon>
                使用趋势
              </div>
              <v-btn variant="text" size="small" @click="exportTrendChart"> 导出图表 </v-btn>
            </v-card-title>
            <v-card-text>
              <TrendChart
                ref="trendChart"
                :data="trendChartData"
                :height="300"
                @chart-click="handleChartInteraction"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 分布图表 -->
        <v-col cols="12" lg="4">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-pie</v-icon>
                内容类型分布
              </div>
              <v-btn variant="text" size="small" @click="exportDistributionChart"> 导出图表 </v-btn>
            </v-card-title>
            <v-card-text>
              <DistributionChart
                ref="distributionChart"
                :data="distributionChartData"
                :height="300"
                @chart-click="handleChartInteraction"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 第二行图表 -->
      <v-row class="mt-6">
        <!-- 热力图 -->
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-box</v-icon>
                活动热力图
              </div>
              <v-btn variant="text" size="small" @click="exportHeatmapChart"> 导出图表 </v-btn>
            </v-card-title>
            <v-card-text>
              <HeatmapChart
                ref="heatmapChart"
                :data="heatmapChartData"
                :height="200"
                @chart-click="handleChartInteraction"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 侧边栏信息 -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <!-- 工作空间信息 -->
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-domain</v-icon>
              工作空间
            </v-card-title>
            <v-card-text>
              <div class="mb-3">
                <div class="text-subtitle-1 font-weight-medium">
                  {{ workspaceInfo.name }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ workspaceInfo.members }} 名成员
                </div>
              </div>

              <div class="mb-2">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">存储使用</span>
                  <span class="text-body-2">
                    {{ workspaceInfo.storage.used }}GB / {{ workspaceInfo.storage.total }}GB
                  </span>
                </div>
                <v-progress-linear
                  :model-value="(workspaceInfo.storage.used / workspaceInfo.storage.total) * 100"
                  color="primary"
                  height="6"
                  rounded
                ></v-progress-linear>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <!-- 最近活动 -->
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-clock-outline</v-icon>
              最近活动
            </v-card-title>
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item v-for="activity in recentActivities" :key="activity.id" class="px-4">
                  <template #prepend>
                    <v-avatar size="32" :color="getStatusColor(activity.status)">
                      <v-icon :icon="getTypeIcon(activity.type)" size="16"></v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-body-2">
                    {{ activity.title }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ activity.time }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-chip :color="getStatusColor(activity.status)" size="small" variant="tonal">
                      {{
                        activity.status === 'completed'
                          ? '完成'
                          : activity.status === 'processing'
                            ? '处理中'
                            : '失败'
                      }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions>
              <v-btn variant="text" color="primary" block> 查看全部活动 </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
