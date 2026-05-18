<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { CreditsDailySourceStatItem } from '@/api/adminApi';

const props = defineProps<{
  items: CreditsDailySourceStatItem[];
}>();

const metric = ref<'credits' | 'price'>('credits');

const UNKNOWN_SOURCE = '未知来源';

const SOURCE_LABELS: Record<string, string> = {
  admin_give: '系统赠与',
  admin_manual: '手动充值',
  Newbie: '新用户赠送',
  subscription_grant: '会员订阅',
  wechat_recharge: '积分套餐',
};

const SOURCE_ALIASES: Record<string, string> = {
  wechat_subscription: 'subscription_grant',
};

function normalizeSource(source: string): string {
  const key = source || UNKNOWN_SOURCE;
  return SOURCE_ALIASES[key] ?? key;
}

const seriesData = computed(() => {
  const grouped = new Map<string, Map<string, { credits: number; price: number }>>();

  for (const item of props.items) {
    const key = normalizeSource(item.source);
    let byDay = grouped.get(key);
    if (!byDay) {
      byDay = new Map();
      grouped.set(key, byDay);
    }
    const prev = byDay.get(item.day) ?? { credits: 0, price: 0 };
    byDay.set(item.day, {
      credits: prev.credits + item.total_credits,
      price: prev.price + item.total_price,
    });
  }

  // 按 source 生成 series，每条线按日期升序
  const series: { name: string; data: [number, number][] }[] = [];
  for (const [source, byDay] of grouped) {
    const sorted = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    series.push({
      name: SOURCE_LABELS[source] ?? source,
      data: sorted.map(([day, v]) => [
        new Date(day).getTime(),
        metric.value === 'credits' ? v.credits : v.price,
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
