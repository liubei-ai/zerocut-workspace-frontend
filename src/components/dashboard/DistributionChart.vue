<script lang="ts" setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useTheme } from 'vuetify';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import type { PieChartData } from '@/types/stats';

interface Props {
  data: PieChartData[];
  loading?: boolean;
  height?: number | string;
  title?: string;
  subtitle?: string;
  chartType?: 'pie' | 'doughnut' | 'bar';
  showLegend?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
  radius?: [string, string] | string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: 400,
  chartType: 'pie',
  showLegend: true,
  showLabels: true,
  showPercentage: true,
  radius: '70%',
});

const emit = defineEmits<{
  itemClick: [item: PieChartData];
  legendClick: [name: string];
  'update:chartType': [type: 'pie' | 'doughnut' | 'bar'];
}>();

const { current } = useTheme();
const chartRef = ref<InstanceType<typeof VChart>>();

// 主题颜色
const colors = computed(() => {
  const isDark = current.value.dark;
  return {
    primary: '#1976D2',
    secondary: '#424242',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    purple: '#9C27B0',
    teal: '#009688',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    background: isDark ? '#121212' : '#FFFFFF',
    gridLine: isDark ? '#333333' : '#E0E0E0',
  };
});

// 默认颜色调色板
const colorPalette = computed(() => [
  colors.value.primary,
  colors.value.success,
  colors.value.warning,
  colors.value.error,
  colors.value.info,
  colors.value.purple,
  colors.value.teal,
  colors.value.secondary,
]);

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  const theme = colors.value;

  if (props.chartType === 'bar') {
    return {
      title: props.title
        ? {
          text: props.title,
          subtext: props.subtitle,
          left: 'left',
          textStyle: {
            color: theme.text,
            fontSize: 16,
            fontWeight: 'bold',
          },
          subtextStyle: {
            color: theme.textSecondary,
            fontSize: 12,
          },
        }
        : undefined,

      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.background,
        borderColor: theme.gridLine,
        textStyle: {
          color: theme.text,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const param = params[0];
          const percentage = props.data.find(item => item.name === param.name)?.percentage || 0;
          return `
            <div style="margin-bottom: 4px; font-weight: bold;">${param.name}</div>
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
              <span>数量: ${param.value.toLocaleString()}</span>
            </div>
            <div style="margin-top: 4px; color: ${theme.textSecondary};">
              占比: ${percentage.toFixed(1)}%
            </div>
          `;
        },
      },

      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: props.title ? 80 : 50,
        containLabel: true,
      },

      xAxis: {
        type: 'category',
        data: props.data.map(item => item.name),
        axisLine: {
          lineStyle: {
            color: theme.gridLine,
          },
        },
        axisLabel: {
          color: theme.textSecondary,
          interval: 0,
          rotate: props.data.length > 6 ? 45 : 0,
        },
      },

      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: theme.gridLine,
          },
        },
        axisLabel: {
          color: theme.textSecondary,
          formatter: (value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toString();
          },
        },
        splitLine: {
          lineStyle: {
            color: theme.gridLine,
            type: 'dashed',
          },
        },
      },

      series: [
        {
          type: 'bar',
          data: props.data.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colorPalette.value[index % colorPalette.value.length],
            },
          })),
          barWidth: '60%',
          label: props.showLabels
            ? {
              show: true,
              position: 'top',
              color: theme.text,
              formatter: props.showPercentage
                ? (params: any) => `${params.data.percentage?.toFixed(1) || '0'}%`
                : '{c}',
            }
            : undefined,
        },
      ],
    };
  }

  // 饼图/环形图配置
  return {
    title: props.title
      ? {
        text: props.title,
        subtext: props.subtitle,
        left: 'left',
        textStyle: {
          color: theme.text,
          fontSize: 16,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: theme.textSecondary,
          fontSize: 12,
        },
      }
      : undefined,

    tooltip: {
      trigger: 'item',
      backgroundColor: theme.background,
      borderColor: theme.gridLine,
      textStyle: {
        color: theme.text,
      },
      formatter: (params: any) => {
        return `
          <div style="margin-bottom: 4px; font-weight: bold;">${params.name}</div>
          <div style="display: flex; align-items: center;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span>数量: ${params.value.toLocaleString()}</span>
          </div>
          <div style="margin-top: 4px; color: ${theme.textSecondary};">
            占比: ${params.percent}%
          </div>
        `;
      },
    },

    legend: props.showLegend
      ? {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          color: theme.text,
        },
        itemGap: 10,
      }
      : undefined,

    series: [
      {
        type: 'pie',
        radius:
          props.chartType === 'doughnut'
            ? Array.isArray(props.radius)
              ? props.radius
              : ['40%', props.radius]
            : props.radius,
        center: ['40%', '50%'],
        data: props.data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: colorPalette.value[index % colorPalette.value.length],
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: props.showLabels
          ? {
            show: true,
            color: theme.text,
            formatter: props.showPercentage ? '{b}: {d}%' : '{b}: {c}',
          }
          : {
            show: false,
          },
        labelLine: {
          show: props.showLabels,
        },
      },
    ],
  };
});

// 监听数据变化，重新渲染图表
watch(
  () => props.data,
  () => {
    nextTick(() => {
      chartRef.value?.resize();
    });
  },
  { deep: true }
);

// 图表事件处理
const handleItemClick = (params: any) => {
  const item = props.data.find(d => d.name === params.name);
  if (item) {
    emit('itemClick', item);
  }
};

const handleLegendClick = (params: any) => {
  emit('legendClick', params.name);
};

// 暴露方法
defineExpose({
  resize: () => chartRef.value?.resize(),
  getInstance: () => chartRef.value,
});
</script>

<template>
  <v-card class="pa-4" elevation="2">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex align-center justify-center"
      :style="{ height: typeof height === 'number' ? `${height}px` : height }"
    >
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Chart -->
    <div v-else>
      <!-- Chart Type Selector -->
      <div v-if="!title" class="d-flex justify-end mb-3">
        <v-btn-toggle
          :model-value="chartType"
          @update:model-value="$emit('update:chartType', $event)"
          mandatory
          variant="outlined"
          size="small"
        >
          <v-btn value="pie" icon="mdi-chart-pie" />
          <v-btn value="doughnut" icon="mdi-chart-donut" />
          <v-btn value="bar" icon="mdi-chart-bar" />
        </v-btn-toggle>
      </div>

      <VChart
        ref="chartRef"
        :option="chartOptions"
        :style="{ height: typeof height === 'number' ? `${height}px` : height }"
        autoresize
        @click="handleItemClick"
        @legendselectchanged="handleLegendClick"
      />
    </div>

    <!-- Data Summary -->
    <div v-if="!loading && data.length > 0" class="mt-4">
      <v-divider class="mb-3" />
      <div class="text-caption text-medium-emphasis mb-2">数据概览</div>
      <div class="d-flex flex-wrap gap-2">
        <v-chip
          v-for="(item, index) in data.slice(0, 5)"
          :key="item.name"
          :color="colorPalette[index % colorPalette.length]"
          variant="outlined"
          size="small"
        >
          {{ item.name }}: {{ item.value.toLocaleString() }}
        </v-chip>
        <v-chip v-if="data.length > 5" variant="outlined" size="small" color="grey">
          +{{ data.length - 5 }} 更多
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
/* 确保图表容器正确显示 */
:deep(.echarts) {
  width: 100% !important;
}

.gap-2 {
  gap: 8px;
}
</style>
