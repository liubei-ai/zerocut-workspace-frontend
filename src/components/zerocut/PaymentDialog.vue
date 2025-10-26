<template>
  <v-dialog v-model="isOpen" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6 d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-credit-card</v-icon>
        支付订单
      </v-card-title>

      <v-card-text class="px-6 pb-6">
        <!-- 支付状态显示 -->
        <div v-if="paymentStatus === 'creating'" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <div class="text-h6 mb-2">正在创建支付订单...</div>
          <div class="text-body-2 text-medium-emphasis">请稍候</div>
        </div>

        <!-- 两列布局 - 等待支付状态 -->
        <div v-else-if="paymentStatus === 'pending'" class="payment-layout">
          <!-- 左侧：商品信息、订单号、提醒 -->
          <div class="payment-left">
            <!-- 商品信息 -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6 pb-2">
                <v-icon class="mr-2" color="primary">mdi-package-variant</v-icon>
                商品信息
              </v-card-title>
              <v-card-text class="pt-0">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-1 font-weight-medium">{{ packageInfo?.packageName }}</span>
                  <v-chip color="primary" variant="tonal" size="small">
                    {{ packageInfo?.creditsAmount }} 积分
                  </v-chip>
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2 text-medium-emphasis">支付金额</span>
                  <span class="text-h6 font-weight-bold text-primary"
                    >¥{{ packageInfo?.currentPrice }}</span
                  >
                </div>
              </v-card-text>
            </v-card>

            <!-- 订单信息 -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6 pb-2">
                <v-icon class="mr-2" color="info">mdi-receipt</v-icon>
                订单信息
              </v-card-title>
              <v-card-text class="pt-0">
                <div class="d-flex align-center mb-2">
                  <span class="text-body-2 text-medium-emphasis mr-2">订单号：</span>
                  <span class="text-body-2 font-family-monospace">{{ orderInfo?.outTradeNo }}</span>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    class="ml-2"
                    @click="copyOrderNumber"
                  />
                </div>
                <div class="d-flex align-center">
                  <span class="text-body-2 text-medium-emphasis mr-2">创建时间：</span>
                  <span class="text-body-2">{{ formatTime(new Date()) }}</span>
                </div>
              </v-card-text>
            </v-card>

            <!-- 支付协议复选框 -->
            <div v-if="paymentStatus === 'pending'">
              <v-checkbox
                v-model="agreementAccepted"
                color="primary"
                hide-details
                class="agreement-checkbox"
              >
                <template #label>
                  <span class="text-body-2">
                    我已阅读并同意
                    <a
                      href="https://workspace.zerocut.cn/paid_service_agreement.html"
                      target="_blank"
                      class="text-primary text-decoration-none"
                      @click.stop
                    >
                      ZeroCut充值协议
                    </a>
                  </span>
                </template>
              </v-checkbox>
            </div>
          </div>

          <!-- 右侧：二维码、倒计时、支付状态 -->
          <div class="payment-right">
            <!-- 二维码容器 -->
            <div class="qr-code-container">
              <canvas ref="qrCodeCanvas" class="qr-code-canvas" />
              <div class="qr-code-overlay">
                <div class="text-body-2 text-center mt-2 text-medium-emphasis">
                  请使用微信扫码支付
                </div>
                <!-- 倒计时显示 -->
                <div class="text-center mt-2">
                  <div class="text-body-2 text-medium-emphasis">
                    剩余时间：{{ formatCountdown(countdown) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支付成功 -->
        <div v-else-if="paymentStatus === 'success'" class="text-center py-8">
          <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
          <div class="text-h5 mb-2 text-success">支付成功！</div>
          <div class="text-body-1 text-medium-emphasis mb-4">积分已到账，您可以开始使用了</div>
          <div class="text-body-2">订单号：{{ orderInfo?.outTradeNo }}</div>
        </div>

        <!-- 支付失败 -->
        <div v-else-if="paymentStatus === 'failed'" class="text-center py-8">
          <v-icon size="80" color="error" class="mb-4">mdi-close-circle</v-icon>
          <div class="text-h5 mb-2 text-error">支付失败</div>
          <div class="text-body-1 text-medium-emphasis mb-4">
            {{ errorMessage || '支付过程中出现错误，请重试' }}
          </div>
          <div v-if="orderInfo?.outTradeNo" class="text-body-2">
            订单号：{{ orderInfo?.outTradeNo }}
          </div>
        </div>

        <!-- 支付超时 -->
        <div v-else-if="paymentStatus === 'timeout'" class="text-center py-8">
          <v-icon size="80" color="warning" class="mb-4">mdi-clock-alert</v-icon>
          <div class="text-body-1 text-medium-emphasis mb-4">订单已超时，请重新创建订单</div>
          <div v-if="orderInfo?.outTradeNo" class="text-body-2">
            订单号：{{ orderInfo?.outTradeNo }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />

        <!-- 创建订单状态的按钮 -->
        <template v-if="paymentStatus === 'creating'">
          <v-btn variant="text" @click="handleCancel" :disabled="loading"> 取消 </v-btn>
        </template>

        <!-- 等待支付状态的按钮 -->
        <template v-else-if="paymentStatus === 'pending'">
          <v-btn variant="text" @click="handleCancel" class="mr-2"> 取消支付 </v-btn>
        </template>

        <!-- 支付完成状态的按钮 -->
        <template v-else>
          <v-btn color="primary" variant="elevated" @click="handleClose" class="mr-2">
            {{ paymentStatus === 'success' ? '完成' : '关闭' }}
          </v-btn>
          <v-btn
            v-if="paymentStatus === 'failed' || paymentStatus === 'timeout'"
            color="primary"
            variant="outlined"
            @click="handleRetry"
          >
            重新支付
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { CreatePaymentOrderResponse, PackageInfo } from '@/api/packageApi';
import { closeOrder, createWechatPayOrder, queryOrderStatus } from '@/api/packageApi';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import QRCode from 'qrcode';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

interface Props {
  open: boolean;
  packageInfo: PackageInfo | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success', orderInfo: CreatePaymentOrderResponse): void;
  (e: 'cancel'): void;
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// Stores
const snackbarStore = useSnackbarStore();
const workspaceStore = useWorkspaceStore();

// Refs
const qrCodeCanvas = ref<HTMLCanvasElement>();
const orderInfo = ref<CreatePaymentOrderResponse | null>(null);
const paymentStatus = ref<'creating' | 'pending' | 'success' | 'failed' | 'timeout'>('creating');
const paymentCheckStatus = ref<'waiting' | 'checking'>('waiting');
const errorMessage = ref<string>('');
const paymentCheckInterval = ref<number | null>(null);
const countdownInterval = ref<number | null>(null);
const countdown = ref<number>(300); // 5分钟倒计时
const agreementAccepted = ref<boolean>(true); // 支付协议同意状态，默认选中

// Computed
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

// 格式化倒计时显示
const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 格式化时间显示
const formatTime = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 复制订单号
const copyOrderNumber = async () => {
  if (!orderInfo.value?.outTradeNo) return;

  try {
    await navigator.clipboard.writeText(orderInfo.value.outTradeNo);
    snackbarStore.showSuccessMessage('订单号已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    snackbarStore.showErrorMessage('复制失败');
  }
};

// 开始倒计时
const startCountdown = () => {
  countdown.value = 300; // 重置为5分钟
  countdownInterval.value = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      paymentStatus.value = 'timeout';
      stopCountdown();
      stopPaymentStatusCheck();
    }
  }, 1000);
};

// 停止倒计时
const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

// 生成二维码
const generateQRCode = async (codeUrl: string) => {
  if (!qrCodeCanvas.value) return;

  try {
    await QRCode.toCanvas(qrCodeCanvas.value, codeUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('生成二维码失败:', error);
    snackbarStore.showErrorMessage('生成二维码失败');
  }
};

// 创建支付订单
const createPaymentOrder = async () => {
  if (!props.packageInfo) return;

  // 检查是否有当前工作空间
  if (!workspaceStore.currentWorkspaceId) {
    snackbarStore.showErrorMessage('请先选择工作空间');
    return;
  }

  try {
    paymentStatus.value = 'creating';
    errorMessage.value = '';

    const response = await createWechatPayOrder({
      packageCode: props.packageInfo.packageCode,
      totalAmount: parseFloat(props.packageInfo.currentPrice),
      workspaceId: workspaceStore.currentWorkspaceId,
    });

    orderInfo.value = response;
    paymentStatus.value = 'pending';

    // 等待DOM更新后生成二维码
    await nextTick();
    await generateQRCode(response.codeUrl);

    // 开始倒计时和定期检查支付状态
    startCountdown();
    startPaymentStatusCheck();
  } catch (error: any) {
    console.error('创建支付订单失败:', error);
    paymentStatus.value = 'failed';
    errorMessage.value = error.message || '创建支付订单失败';
    snackbarStore.showErrorMessage('创建支付订单失败');
  }
};

// 检查支付状态
const checkPaymentStatus = async () => {
  if (!orderInfo.value) return;

  try {
    paymentCheckStatus.value = 'checking';

    const response = await queryOrderStatus({
      orderId: orderInfo.value.outTradeNo,
      orderType: 'out_trade_no',
    });

    if (response.trade_state === 'SUCCESS') {
      paymentStatus.value = 'success';
      stopPaymentStatusCheck();
      stopCountdown();

      // 发出success事件
      emit('success', orderInfo.value);
    } else if (response.trade_state === 'CLOSED' || response.trade_state === 'REVOKED') {
      paymentStatus.value = 'failed';
      errorMessage.value = '订单已关闭或被撤销';
      stopPaymentStatusCheck();
      stopCountdown();
    } else if (response.trade_state === 'PAYERROR') {
      paymentStatus.value = 'failed';
      errorMessage.value = '支付失败';
      stopPaymentStatusCheck();
      stopCountdown();
    }
    // 其他状态继续等待
  } catch (error: any) {
    console.error('查询支付状态失败:', error);
    // 查询失败不改变状态，继续等待
  } finally {
    paymentCheckStatus.value = 'waiting';
  }
};

// 开始定期检查支付状态
const startPaymentStatusCheck = () => {
  // 每2秒检查一次支付状态，更频繁的检查
  paymentCheckInterval.value = window.setInterval(() => {
    checkPaymentStatus();
  }, 2000);
};

// 停止检查支付状态
const stopPaymentStatusCheck = () => {
  if (paymentCheckInterval.value) {
    clearInterval(paymentCheckInterval.value);
    paymentCheckInterval.value = null;
  }
};

// 处理取消
const handleCancel = async () => {
  stopPaymentStatusCheck();
  stopCountdown();

  // 如果有订单信息，调用关闭订单API
  if (orderInfo.value?.outTradeNo) {
    try {
      await closeOrder(orderInfo.value.outTradeNo);
      console.log('订单已关闭:', orderInfo.value.outTradeNo);
    } catch (error) {
      console.error('关闭订单失败:', error);
      // 即使关闭订单失败，也继续执行取消操作
    }
  }

  emit('cancel');
  emit('update:open', false);
};

// 处理关闭
const handleClose = () => {
  stopPaymentStatusCheck();
  stopCountdown();
  emit('update:open', false);
};

// 处理重试
const handleRetry = () => {
  emit('retry');
  createPaymentOrder();
};

// 重置状态
const resetState = () => {
  orderInfo.value = null;
  paymentStatus.value = 'creating';
  paymentCheckStatus.value = 'waiting';
  errorMessage.value = '';
  countdown.value = 300;
  agreementAccepted.value = true; // 重置协议同意状态为默认选中
  stopPaymentStatusCheck();
  stopCountdown();
};

// 监听对话框打开
watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.packageInfo) {
      resetState();
      createPaymentOrder();
    } else if (!newOpen) {
      stopPaymentStatusCheck();
      stopCountdown();
    }
  }
);

// 组件卸载时清理
onUnmounted(() => {
  stopPaymentStatusCheck();
  stopCountdown();
});
</script>

<style scoped>
/* 两列布局 */
.payment-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.payment-left {
  display: flex;
  flex-direction: column;
}

.payment-right {
  display: flex;
  flex-direction: column;
}

/* 二维码容器 */
.qr-code-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 9px;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 12px;
  border: 2px dashed rgba(var(--v-border-color), 0.2);
  position: relative;
}

.qr-code-canvas {
  border-radius: 8px;
  background-color: white;
}

.qr-code-overlay {
  width: 100%;
}

/* 卡片样式 */
.v-card {
  border-radius: 16px;
}

.v-alert {
  border-radius: 12px;
}

/* 支付步骤样式 */
.payment-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 紧凑样式 */
.compact-alert {
  padding: 12px 16px !important;
}

.compact-steps {
  gap: 8px !important;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.step-title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
}

.step-desc {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.2;
}

/* 旋转动画 */
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .payment-right {
    order: -1;
  }
}

/* 等宽字体 */
.font-family-monospace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.agreement-checkbox :deep(.v-label) {
  opacity: 1;
  line-height: 1.4;
}

.agreement-checkbox a {
  font-weight: 500;
}

.agreement-checkbox a:hover {
  text-decoration: underline !important;
}
</style>
