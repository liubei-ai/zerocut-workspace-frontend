<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { CreditsDailySourceStatItem } from '@/api/adminApi';

const props = defineProps<{
  items: CreditsDailySourceStatItem[];
}>();

const metric = ref<'credits' | 'price'>('credits');

const seriesData = computed(() => {
  const grouped = new Map<string, { day: string; credits: number; price: number }[]>();

  for (const item of props.items) {
    if (!grouped.has(item.source)) {
      grouped.set(item.source, []);
    }
    grouped.get(item.source)!.push({
      day: item.day,
      credits: item.total_credits,
      price: item.total_price,
    });
  }

  // 按 source 生成 series，每条线按日期升序
  const series: { name: string; data: [number, number][] }[] = [];
  for (const [source, dataPoints] of grouped) {
    const sorted = dataPoints.sort((a, b) => a.day.localeCompare(b.day));
    series.push({
      name: source || '未知来源',
      data: sorted.map(d => [
        new Date(d.day).getTime(),
        metric.value === 'credits' ? d.credits : d.price,
      ]),
    });
  }

  return series;
});

const chartOptions = computed(() => ({
  chart: {
    type: 'line' as const,
    height: 400,
    fontFamily: 'inherit',
    toolbar: { show: true },
    zoom: { enabled: true },
  },
  stroke: {
    width: 2.5,
    curve: 'smooth' as const,
  },
  xaxis: {
    type: 'datetime' as const,
    labels: {
      format: 'MM/dd',
      style: { fontSize: '12px' },
    },
  },
  yaxis: {
    title: {
      text: metric.value === 'credits' ? '积分数' : '金额（元）',
    },
    labels: {
      formatter: (val: number) => (metric.value === 'credits' ? val.toFixed(0) : val.toFixed(2)),
    },
  },
  tooltip: {
    x: { format: 'yyyy-MM-dd' },
    y: {
      formatter: (val: number) =>
        metric.value === 'credits' ? `${val.toFixed(0)} 积分` : `${val.toFixed(4)} 元`,
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'left' as const,
  },
  markers: {
    size: 3,
    hover: { size: 5 },
  },
  dataLabels: { enabled: false },
}));
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <v-btn-toggle v-model="metric" mandatory density="compact" color="primary">
        <v-btn value="credits" size="small">积分数</v-btn>
        <v-btn value="price" size="small">金额（元）</v-btn>
      </v-btn-toggle>
    </div>

    <apexchart
      v-if="seriesData.length > 0"
      type="line"
      height="400"
      :options="chartOptions"
      :series="seriesData"
    />

    <v-alert v-else type="info" variant="tonal" class="mt-4"> 暂无积分消耗数据 </v-alert>
  </div>
</template>
