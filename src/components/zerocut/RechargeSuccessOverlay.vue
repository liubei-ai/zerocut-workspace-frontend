<template>
  <v-overlay v-model="isOpen" class="d-flex align-center justify-center" persistent :z-index="9999">
    <v-card class="success-overlay-card" max-width="480px" width="100%" elevation="24">
      <!-- 关闭按钮 -->
      <v-btn icon="mdi-close" variant="text" size="small" class="close-btn" @click="handleClose" />

      <v-card-text class="text-center pa-8">
        <!-- 成功图标 -->
        <div class="success-icon-container mb-6">
          <v-icon size="80" color="success" class="success-icon"> mdi-check-circle </v-icon>
          <div class="success-ripple"></div>
        </div>

        <!-- 成功标题 -->
        <h2 class="text-h4 font-weight-bold text-success mb-4">充值成功！</h2>

        <!-- 积分信息 -->
        <div class="credits-info mb-6">
          <div class="text-h6 text-medium-emphasis mb-2">到账积分</div>
          <div class="credits-amount">
            <span class="text-h3 font-weight-bold text-primary">
              {{ creditsAmount }}
            </span>
            <span class="text-h6 text-medium-emphasis ml-2"> 积分 </span>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="order-info mb-6">
          <v-chip variant="tonal" color="success" size="small" prepend-icon="mdi-receipt">
            订单号：{{ orderNumber }}
          </v-chip>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <v-btn
            color="primary"
            variant="elevated"
            size="large"
            class="mb-3"
            block
            prepend-icon="mdi-wallet"
            @click="handleViewWallet"
          >
            查看我的钱包
          </v-btn>

          <v-btn variant="text" size="large" block @click="handleClose"> 稍后查看 </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  open: boolean;
  creditsAmount: number;
  orderNumber: string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
  (e: 'view-wallet'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();

// Computed
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

// 处理关闭
const handleClose = () => {
  emit('close');
  emit('update:open', false);
};

// 处理查看钱包
const handleViewWallet = () => {
  emit('view-wallet');
  router.push('/wallet');
  handleClose();
};
</script>

<style scoped>
.success-overlay-card {
  border-radius: 24px;
  position: relative;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}

.success-icon-container {
  position: relative;
  display: inline-block;
}

.success-icon {
  position: relative;
  z-index: 2;
  animation: successBounce 0.6s ease-out;
}

.success-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  border: 2px solid rgb(var(--v-theme-success));
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: rippleEffect 1.5s ease-out infinite;
}

.credits-info {
  padding: 24px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.credits-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.order-info {
  opacity: 0.8;
}

.action-buttons {
  max-width: 280px;
  margin: 0 auto;
}

/* 动画效果 */
@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes rippleEffect {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 600px) {
  .success-overlay-card {
    margin: 16px;
    max-width: none;
  }

  .credits-info {
    padding: 16px;
  }
}
</style>
