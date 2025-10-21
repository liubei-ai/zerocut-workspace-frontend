<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6 d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-credit-card</v-icon>
        支付订单
      </v-card-title>

      <v-card-subtitle class="px-6 pb-4">
        {{ packageInfo?.packageName }} - ¥{{ packageInfo?.originalPrice }}
      </v-card-subtitle>

      <v-card-text class="px-6">
        <!-- 支付状态显示 -->
        <div v-if="paymentStatus === 'creating'" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <div class="text-h6 mb-2">正在创建支付订单...</div>
          <div class="text-body-2 text-medium-emphasis">请稍候</div>
        </div>

        <!-- 二维码显示 -->
        <div v-else-if="paymentStatus === 'pending'" class="text-center">
          <div class="mb-4">
            <div class="text-h6 mb-2">请使用微信扫码支付</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              订单号：{{ orderInfo?.outTradeNo }}
            </div>
          </div>

          <!-- 二维码容器 -->
          <div class="qr-code-container mb-4">
            <canvas ref="qrCodeCanvas" class="qr-code-canvas" />
          </div>

          <!-- 支付状态检查 -->
          <div class="mb-4">
            <v-chip
              :color="paymentCheckStatus === 'checking' ? 'orange' : 'blue'"
              variant="tonal"
              size="small"
              class="mb-2"
            >
              <v-icon start size="small">
                {{ paymentCheckStatus === 'checking' ? 'mdi-loading' : 'mdi-information' }}
              </v-icon>
              {{ paymentCheckStatus === 'checking' ? '正在检查支付状态...' : '等待支付完成' }}
            </v-chip>
          </div>

          <!-- 支付说明 -->
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <div class="mb-2">
                <v-icon size="small" class="mr-1">mdi-numeric-1-circle</v-icon>
                打开微信，扫描上方二维码
              </div>
              <div class="mb-2">
                <v-icon size="small" class="mr-1">mdi-numeric-2-circle</v-icon>
                确认支付金额并完成支付
              </div>
              <div>
                <v-icon size="small" class="mr-1">mdi-numeric-3-circle</v-icon>
                支付成功后将自动跳转
              </div>
            </div>
          </v-alert>
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
          <div class="text-h5 mb-2 text-warning">支付超时</div>
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
          <v-btn
            color="primary"
            variant="outlined"
            @click="checkPaymentStatus"
            :loading="paymentCheckStatus === 'checking'"
          >
            检查支付状态
          </v-btn>
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
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import { createWechatPayOrder, queryOrderStatus } from '@/api/packageApi';
import type { PackageInfo, CreatePaymentOrderResponse } from '@/api/packageApi';
import { useSnackbarStore } from '@/stores/snackbarStore';

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

// Refs
const qrCodeCanvas = ref<HTMLCanvasElement>();
const orderInfo = ref<CreatePaymentOrderResponse | null>(null);
const paymentStatus = ref<'creating' | 'pending' | 'success' | 'failed' | 'timeout'>('creating');
const paymentCheckStatus = ref<'waiting' | 'checking'>('waiting');
const errorMessage = ref<string>('');
const paymentCheckInterval = ref<number | null>(null);

// Computed
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

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

  try {
    paymentStatus.value = 'creating';
    errorMessage.value = '';

    const response = await createWechatPayOrder({
      packageCode: props.packageInfo.packageCode,
      totalAmount: parseFloat(props.packageInfo.currentPrice),
    });

    orderInfo.value = response;
    paymentStatus.value = 'pending';

    // 等待DOM更新后生成二维码
    await nextTick();
    await generateQRCode(response.codeUrl);

    // 开始定期检查支付状态
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
      emit('success', orderInfo.value);
    } else if (response.trade_state === 'CLOSED' || response.trade_state === 'REVOKED') {
      paymentStatus.value = 'failed';
      errorMessage.value = '订单已关闭或被撤销';
      stopPaymentStatusCheck();
    } else if (response.trade_state === 'PAYERROR') {
      paymentStatus.value = 'failed';
      errorMessage.value = '支付失败';
      stopPaymentStatusCheck();
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
  // 每3秒检查一次支付状态
  paymentCheckInterval.value = window.setInterval(() => {
    checkPaymentStatus();
  }, 3000);

  // 5分钟后超时
  setTimeout(
    () => {
      if (paymentStatus.value === 'pending') {
        paymentStatus.value = 'timeout';
        stopPaymentStatusCheck();
      }
    },
    5 * 60 * 1000
  );
};

// 停止检查支付状态
const stopPaymentStatusCheck = () => {
  if (paymentCheckInterval.value) {
    clearInterval(paymentCheckInterval.value);
    paymentCheckInterval.value = null;
  }
};

// 处理取消
const handleCancel = () => {
  stopPaymentStatusCheck();
  emit('cancel');
  emit('update:open', false);
};

// 处理关闭
const handleClose = () => {
  stopPaymentStatusCheck();
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
  stopPaymentStatusCheck();
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
    }
  }
);

// 组件卸载时清理
onUnmounted(() => {
  stopPaymentStatusCheck();
});
</script>

<style scoped>
.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 12px;
  border: 2px dashed rgba(var(--v-border-color), 0.2);
}

.qr-code-canvas {
  border-radius: 8px;
  background-color: white;
}

.v-card {
  border-radius: 16px;
}

.v-alert {
  border-radius: 12px;
}
</style>
