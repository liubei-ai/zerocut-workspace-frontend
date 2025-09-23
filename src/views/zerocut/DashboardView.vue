<script setup lang="ts">
import StatisticsChart from '@/components/dashboard/StatisticsChart.vue';
import { useStatsStore } from '@/stores/statsStore';
import type { MetricCardData } from '@/types/stats';

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

// 使用 statsStore 中的统计图表数据
const statisticsChartData = computed(() => statsStore.statisticsChartData);

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
</script>

<template>
  <div class="pa-6">
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
          <v-card class="pa-4 text-center" elevation="2" hover @click="handleMetricAction(metric)">
            <v-icon size="48" :color="metric.color" class="mb-2">
              {{ metric.icon }}
            </v-icon>
            <div class="text-h4 font-weight-bold mb-1">
              {{ metric.value.toLocaleString() }}
              <span class="text-h6 text-medium-emphasis ml-1">{{ metric.unit }}</span>
            </div>
            <div class="text-subtitle-2 text-medium-emphasis">{{ metric.title }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="12">
          <!-- 统计图表 -->
          <v-card class="mb-6" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
              <span>使用统计趋势</span>
              <v-spacer></v-spacer>
              <v-chip size="small" color="success" variant="outlined">
                {{ statsStore.selectedDateRange.start }} 至 {{ statsStore.selectedDateRange.end }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <StatisticsChart
                title="日常使用统计"
                :categories="statisticsChartData.categories"
                :series="statisticsChartData.series"
                height="400px"
                :show-legend="true"
                :smooth="true"
              />
            </v-card-text>
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
