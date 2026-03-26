<script lang="ts" setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useTheme } from 'vuetify';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import type { TrendChartData } from '@/types/stats';

interface Props {
  data: TrendChartData;
  loading?: boolean;
  height?: number | string;
  title?: string;
  subtitle?: string;
  showToolbox?: boolean;
  showDataZoom?: boolean;
  smooth?: boolean;
  area?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: 400,
  showToolbox: true,
  showDataZoom: true,
  smooth: true,
  area: false,
});

const emit = defineEmits<{
  legendClick: [name: string];
  dataZoom: [start: number, end: number];
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
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    background: isDark ? '#121212' : '#FFFFFF',
    gridLine: isDark ? '#333333' : '#E0E0E0',
  };
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  const theme = colors.value;

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
        if (!Array.isArray(params)) return '';

        let result = `<div style="margin-bottom: 4px; font-weight: bold;">${params[0].axisValue}</div>`;

        params.forEach((param: any) => {
          const value =
            typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
          result += `
            <div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: bold;">${value}</span>
            </div>
          `;
        });

        return result;
      },
    },

    legend: {
      top: props.title ? 40 : 10,
      textStyle: {
        color: theme.text,
      },
      itemGap: 20,
    },

    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showDataZoom ? '15%' : '3%',
      top: props.title ? 80 : 50,
      containLabel: true,
    },

    toolbox: props.showToolbox
      ? {
          feature: {
            saveAsImage: {
              title: '保存为图片',
              iconStyle: {
                borderColor: theme.text,
              },
            },
            restore: {
              title: '重置',
              iconStyle: {
                borderColor: theme.text,
              },
            },
            dataView: {
              title: '数据视图',
              iconStyle: {
                borderColor: theme.text,
              },
              readOnly: true,
            },
          },
          iconStyle: {
            borderColor: theme.text,
          },
          emphasis: {
            iconStyle: {
              borderColor: theme.primary,
            },
          },
        }
      : undefined,

    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.categories,
      axisLine: {
        lineStyle: {
          color: theme.gridLine,
        },
      },
      axisLabel: {
        color: theme.textSecondary,
        formatter: (value: string) => {
          // 格式化日期显示
          const date = new Date(value);
          if (isNaN(date.getTime())) return value;

          const now = new Date();
          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) return '今天';
          if (diffDays === 1) return '昨天';
          if (diffDays < 7) return `${diffDays}天前`;

          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
      splitLine: {
        show: false,
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

    dataZoom: props.showDataZoom
      ? [
          {
            type: 'inside',
            start: 0,
            end: 100,
          },
          {
            start: 0,
            end: 100,
            handleIcon:
              'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.3h6.6V19.6z',
            handleSize: '80%',
            handleStyle: {
              color: theme.primary,
            },
            textStyle: {
              color: theme.textSecondary,
            },
          },
        ]
      : undefined,

    series: props.data.series.map((serie, index) => ({
      name: serie.name,
      type: 'line',
      smooth: props.smooth,
      symbol: 'circle',
      symbolSize: 6,
      data: serie.data,
      lineStyle: {
        width: 2,
        color:
          serie.color ||
          [theme.primary, theme.secondary, theme.success, theme.warning, theme.error, theme.info][
            index % 6
          ],
      },
      itemStyle: {
        color:
          serie.color ||
          [theme.primary, theme.secondary, theme.success, theme.warning, theme.error, theme.info][
            index % 6
          ],
      },
      areaStyle: props.area
        ? {
            opacity: 0.1,
            color:
              serie.color ||
              [
                theme.primary,
                theme.secondary,
                theme.success,
                theme.warning,
                theme.error,
                theme.info,
              ][index % 6],
          }
        : undefined,
      emphasis: {
        focus: 'series',
      },
    })),
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
const handleLegendClick = (params: any) => {
  emit('legendClick', params.name);
};

const handleDataZoom = (params: any) => {
  emit('dataZoom', params.start, params.end);
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
      <VChart
        ref="chartRef"
        :option="chartOptions"
        :style="{ height: typeof height === 'number' ? `${height}px` : height }"
        autoresize
        @legendselectchanged="handleLegendClick"
        @datazoom="handleDataZoom"
      />
    </div>
  </v-card>
</template>

<style scoped>
/* 确保图表容器正确显示 */
:deep(.echarts) {
  width: 100% !important;
}
</style>
