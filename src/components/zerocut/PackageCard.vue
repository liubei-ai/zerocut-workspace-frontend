<script setup lang="ts">
import { computed } from 'vue';

import type { PackageInfo } from '@/api/packageApi';

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

// 是否有折扣（依据服务端下发的 currentPriceCents/originalPriceCents 整数比较）
const hasDiscount = computed(
  (): boolean => props.packageInfo.currentPriceCents < props.packageInfo.originalPriceCents
);

// 获取折扣标签颜色
const getDiscountColor = computed((): string => {
  if (!hasDiscount.value) return 'grey';
  if (props.packageInfo.discountPercent >= 50) return 'error';
  if (props.packageInfo.discountPercent >= 20) return 'warning';
  return 'success';
});

// 获取折扣标签文本
const getDiscountText = computed((): string => {
  if (!hasDiscount.value) return '';
  return `${props.packageInfo.discountPercent}% OFF`;
});

// 是否显示折扣标签
const showDiscountChip = computed((): boolean => hasDiscount.value);

// 处理购买点击
const handlePurchase = () => {
  if (!props.disabled) {
    emit('purchase', props.packageInfo);
  }
};
</script>

<template>
  <v-card
    class="package-card d-flex flex-column h-100"
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
    <v-card-text class="d-flex flex-column flex-grow-1">
      <!-- 积分数量 -->
      <div class="mb-4 text-center">
        <v-icon size="48" color="primary" class="mb-2">mdi-star-circle</v-icon>
        <div class="text-h4 font-weight-bold text-primary">
          {{ packageInfo.creditsAmount.toLocaleString() }}
        </div>
        <div class="text-subtitle-2 text-medium-emphasis">积分</div>
      </div>

      <!-- 价格信息 -->
      <div class="mb-4 text-center">
        <!-- 原价（如果有折扣） -->
        <div v-if="hasDiscount" class="mb-1">
          <span class="text-decoration-line-through text-medium-emphasis">
            ¥{{ packageInfo.originalPriceYuan }}
          </span>
        </div>

        <!-- 现价 -->
        <div class="text-h5 font-weight-bold" :class="hasDiscount ? 'text-success' : ''">
          ¥{{ packageInfo.currentPriceYuan }}
        </div>

        <!-- 节省金额 -->
        <div v-if="hasDiscount" class="text-caption text-success">
          节省 ¥{{ packageInfo.savingsYuan }}
        </div>
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
