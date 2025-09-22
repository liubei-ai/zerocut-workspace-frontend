<script lang="ts" setup>
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import type { MetricCardData } from '@/types/stats';
import PercentTrend from '@/components/common/PercentTrend.vue';

interface Props {
  data: MetricCardData;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  variant: 'default',
});

const emit = defineEmits<{
  click: [data: MetricCardData];
  action: [data: MetricCardData];
}>();

const { current } = useTheme();

const cardClasses = computed(() => {
  const baseClasses = 'd-flex flex-column pa-4 cursor-pointer transition-all';

  switch (props.variant) {
    case 'primary':
      return `${baseClasses} bg-primary-darken-4`;
    case 'success':
      return `${baseClasses} bg-success-darken-4`;
    case 'warning':
      return `${baseClasses} bg-warning-darken-4`;
    case 'error':
      return `${baseClasses} bg-error-darken-4`;
    default:
      return `${baseClasses} bg-surface-variant`;
  }
});

const iconColor = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'primary';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'primary';
  }
});

const formatValue = (value: number, format?: string): string => {
  if (format === 'currency') {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }

  if (format === 'duration') {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  // 数字格式化
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
};

const handleClick = () => {
  emit('click', props.data);
};
</script>

<template>
  <v-card
    :class="cardClasses"
    :theme="variant === 'default' ? (current.dark ? 'dark' : 'light') : 'dark'"
    elevation="2"
    hover
    @click="handleClick"
  >
    <!-- Loading State -->
    <div v-if="loading" class="d-flex align-center justify-center" style="min-height: 120px">
      <v-progress-circular indeterminate :color="iconColor" size="32" />
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header -->
      <div class="d-flex align-center mb-3">
        <v-icon v-if="data.icon" :icon="data.icon" :color="iconColor" size="24" class="mr-3" />
        <div class="flex-grow-1">
          <div class="text-body-2 text-medium-emphasis">
            {{ data.title }}
          </div>
          <div v-if="data.subtitle" class="text-caption text-disabled">
            {{ data.subtitle }}
          </div>
        </div>
        <v-btn
          v-if="data.actionIcon"
          :icon="data.actionIcon"
          variant="text"
          size="small"
          :color="iconColor"
          @click.stop="$emit('action', data)"
        />
      </div>

      <!-- Main Value -->
      <div class="mb-2">
        <div class="text-h4 font-weight-bold">
          {{ formatValue(data.value, data.format) }}
        </div>
      </div>

      <!-- Trend and Change -->
      <div v-if="data.change !== undefined" class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <PercentTrend :value="data.change" class="mr-2" />
          <span class="text-caption text-medium-emphasis">
            {{ data.changeLabel || 'vs. last period' }}
          </span>
        </div>

        <div v-if="data.previousValue !== undefined" class="text-caption text-disabled text-right">
          {{ $t('dashboard.previous') }}: {{ formatValue(data.previousValue, data.format) }}
        </div>
      </div>

      <!-- Additional Info -->
      <div v-if="data.description" class="text-caption text-disabled mt-2">
        {{ data.description }}
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
