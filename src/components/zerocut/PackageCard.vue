<script setup lang="ts">
import type { PackageInfo } from '@/api/packageApi';
import { computed } from 'vue';

// Props定义
interface Props {
  packageInfo: PackageInfo;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

// Events定义
const emit = defineEmits<{
  purchase: [packageInfo: PackageInfo];
  refresh: [packageCode: string];
}>();

// 格式化价格
const formatPrice = (price: string): string => {
  return parseFloat(price).toFixed(2);
};

// 是否有折扣
const hasDiscount = computed((): boolean => {
  return parseFloat(props.packageInfo.currentPrice) < parseFloat(props.packageInfo.originalPrice);
});

// 折扣百分比
const discountPercentage = computed((): number => {
  if (!hasDiscount.value) return 0;
  const current = parseFloat(props.packageInfo.currentPrice);
  const original = parseFloat(props.packageInfo.originalPrice);
  return Math.round((1 - current / original) * 100);
});

// 获取折扣标签颜色
const getDiscountColor = computed((): string => {
  if (!hasDiscount.value) return 'grey';
  if (discountPercentage.value >= 50) return 'error';
  if (discountPercentage.value >= 20) return 'warning';
  return 'success';
});

// 获取折扣标签文本
const getDiscountText = computed((): string => {
  if (!hasDiscount.value) return '';
  return `${discountPercentage.value}% OFF`;
});

// 是否显示折扣标签
const showDiscountChip = computed((): boolean => {
  return hasDiscount.value;
});

// 节省金额
const savedAmount = computed((): string => {
  if (!hasDiscount.value) return '0.00';
  const original = parseFloat(props.packageInfo.originalPrice);
  const current = parseFloat(props.packageInfo.currentPrice);
  return (original - current).toFixed(2);
});

// 处理购买点击
const handlePurchase = () => {
  if (!props.disabled) {
    emit('purchase', props.packageInfo);
  }
};
</script>

<template>
  <v-card
    class="package-card h-100 d-flex flex-column"
    elevation="3"
    :class="{ 'package-card--disabled': disabled }"
  >
    <!-- 套餐头部 -->
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="flex-grow-1">
        <div class="text-h6 font-weight-bold">{{ packageInfo.packageName }}</div>
        <div class="text-caption text-medium-emphasis">{{ packageInfo.packageCode }}</div>
      </div>

      <!-- 折扣标签 -->
      <v-chip
        v-if="showDiscountChip"
        :color="getDiscountColor"
        size="small"
        variant="flat"
        class="ml-2"
      >
        {{ getDiscountText }}
      </v-chip>
    </v-card-title>

    <!-- 套餐内容 -->
    <v-card-text class="flex-grow-1 d-flex flex-column">
      <!-- 积分数量 -->
      <div class="text-center mb-4">
        <v-icon size="48" color="primary" class="mb-2">mdi-star-circle</v-icon>
        <div class="text-h4 font-weight-bold text-primary">
          {{ packageInfo.creditsAmount.toLocaleString() }}
        </div>
        <div class="text-subtitle-2 text-medium-emphasis">积分</div>
      </div>

      <!-- 价格信息 -->
      <div class="text-center mb-4">
        <!-- 原价（如果有折扣） -->
        <div v-if="hasDiscount" class="mb-1">
          <span class="text-decoration-line-through text-medium-emphasis">
            ¥{{ formatPrice(packageInfo.originalPrice) }}
          </span>
        </div>

        <!-- 现价 -->
        <div class="text-h5 font-weight-bold" :class="hasDiscount ? 'text-success' : ''">
          ¥{{ formatPrice(packageInfo.currentPrice) }}
        </div>

        <!-- 节省金额 -->
        <div v-if="hasDiscount" class="text-caption text-success">节省 ¥{{ savedAmount }}</div>
      </div>

      <!-- 套餐描述 -->
      <div v-if="packageInfo.description" class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
        {{ packageInfo.description }}
      </div>

      <!-- 套餐标签 -->
      <div v-if="packageInfo.tags && packageInfo.tags.length > 0" class="mb-3">
        <v-chip
          v-for="tag in packageInfo.tags"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="mr-1 mb-1"
        >
          {{ tag }}
        </v-chip>
      </div>
    </v-card-text>

    <!-- 购买按钮 -->
    <v-card-actions class="pa-4">
      <v-btn
        color="primary"
        variant="flat"
        block
        size="large"
        prepend-icon="mdi-cart"
        @click="handlePurchase"
        :disabled="disabled"
      >
        立即购买
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.package-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.package-card:hover:not(.package-card--disabled) {
  transform: translateY(-4px);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.package-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.v-card {
  transition: all 0.3s ease;
}

.text-decoration-line-through {
  text-decoration: line-through;
}
</style>
