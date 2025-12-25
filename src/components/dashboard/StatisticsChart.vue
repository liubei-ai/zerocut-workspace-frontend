<script setup lang="ts">
import echarts, { RenderType, ThemeType, useChart } from '@/plugins/echarts';
import type { EChartsOption } from 'echarts';
import { Ref } from 'vue';

interface ChartSeries {
  name: string;
  data: number[];
  type: 'line' | 'bar';
  color?: string;
}

interface Props {
  title?: string;
  height?: string | number;
  categories: string[];
  series: ChartSeries[];
  backgroundColor?: string;
  showLegend?: boolean;
  smooth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: '350px',
  backgroundColor: '#0f375f',
  showLegend: true,
  smooth: true,
});

const chartEl = ref<HTMLDivElement | null>(null);

const option = computed<EChartsOption>(() => {
  const seriesConfig = props.series.map((item, index) => {
    const baseConfig = {
      name: item.name,
      type: item.type,
      data: item.data,
    };

    if (item.type === 'line') {
      return {
        ...baseConfig,
        smooth: props.smooth,
        showAllSymbol: true,
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: item.color || ['#14c8d4', '#43eec6', '#ff9800', '#e91e63'][index % 4],
        },
      };
    } else {
      return {
        ...baseConfig,
        barWidth: 20,
        itemStyle: {
          borderRadius: 4,
          color:
            item.color ||
            new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#14c8d4' },
              { offset: 1, color: '#43eec6' },
            ]),
        },
      };
    }
  });

  return {
    backgroundColor: props.backgroundColor,
    title: props.title
      ? {
        text: props.title,
        textStyle: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
        },
        left: 'center',
        top: 10,
      }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#14c8d4',
      textStyle: {
        color: '#fff',
      },
    },
    legend: props.showLegend
      ? {
        data: props.series.map(s => s.name),
        textStyle: {
          color: '#ccc',
        },
        top: props.title ? 40 : 20,
      }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: props.title ? (props.showLegend ? 80 : 50) : props.showLegend ? 50 : 20,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.categories,
      axisLine: {
        lineStyle: {
          color: '#ccc',
        },
      },
      axisLabel: {
        color: '#ccc',
        rotate: props.categories.length > 10 ? 45 : 0,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#ccc',
        },
      },
      axisLabel: {
        color: '#ccc',
      },
    },
    series: seriesConfig,
  };
});

const { setOption, showLoading } = useChart(
  chartEl as Ref<HTMLDivElement>,
  true,
  true,
  RenderType.SVGRenderer,
  ThemeType.Light
);

onMounted(() => {
  nextTick(() => {
    showLoading();
    setOption(option.value);
  });
});

watch(
  () => option.value,
  newVal => {
    setOption(newVal);
  },
  { deep: true }
);

// 暴露图表实例方法
const getInstance = () => {
  return chartEl.value;
};

defineExpose({
  getInstance,
});
</script>

<template>
  <v-card :height="height" class="pa-2" rounded="md">
    <div ref="chartEl" :style="{ width: `100%`, height: `100%` }"></div>
  </v-card>
</template>
