<template>
  <v-dialog v-model="isOpen" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6 d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-credit-card</v-icon>
        购买会员
      </v-card-title>

      <v-card-text class="px-6 pb-6">
        <div v-if="paymentStatus === 'creating'" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <div class="text-h6 mb-2">正在创建支付订单...</div>
          <div class="text-body-2 text-medium-emphasis">请稍候</div>
        </div>

        <div v-else-if="paymentStatus === 'pending'" class="payment-layout">
          <div class="payment-left">
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6 pb-2">
                <v-icon class="mr-2" color="primary">mdi-crown</v-icon>
                商品信息
              </v-card-title>
              <v-card-text class="pt-0">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-body-1 font-weight-medium">{{ planTitle }}</span>
                  <v-chip color="primary" variant="tonal" size="small">
                    {{ membershipPlan?.monthlyCredits }} 积分/月
                  </v-chip>
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2 text-medium-emphasis">支付金额</span>
                  <span class="text-h6 font-weight-bold text-primary"
                    >¥{{ membershipPlan?.priceYuan }}</span
                  >
                </div>
              </v-card-text>
            </v-card>

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

          <div class="payment-right">
            <div class="qr-code-container">
              <canvas ref="qrCodeCanvas" class="qr-code-canvas" />
              <div class="qr-code-overlay">
                <div class="text-body-2 text-center mt-2 text-medium-emphasis">
                  请使用微信扫码支付
                </div>
                <div class="text-center mt-2">
                  <div class="text-body-2 text-medium-emphasis">
                    剩余时间：{{ formatCountdown(countdown) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="paymentStatus === 'success'" class="text-center py-8">
          <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
          <div class="text-h5 mb-2 text-success">支付成功！</div>
          <div class="text-body-1 text-medium-emphasis mb-4">积分已到账，您可以开始使用了</div>
          <div class="text-body-2">订单号：{{ orderInfo?.outTradeNo }}</div>
        </div>

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

        <template v-if="paymentStatus === 'creating'">
          <v-btn variant="text" @click="handleCancel" :disabled="loading">取消</v-btn>
        </template>

        <template v-else-if="paymentStatus === 'pending'">
          <v-btn variant="text" @click="handleCancel" class="mr-2">取消支付</v-btn>
        </template>

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
import {
  createMembershipWechatPayOrder,
  closeMembershipOrder,
  type CreateMembershipPaymentOrderResponse,
  type MembershipPlanDto,
} from '@/api/membershipApi';
import { queryOrderStatus } from '@/api/packageApi';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import QRCode from 'qrcode';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

interface Props {
  open: boolean;
  membershipPlan: MembershipPlanDto | null;
  title?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success', orderInfo: CreateMembershipPaymentOrderResponse): void;
  (e: 'cancel'): void;
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: undefined,
});

const emit = defineEmits<Emits>();

const snackbarStore = useSnackbarStore();
const workspaceStore = useWorkspaceStore();

const qrCodeCanvas = ref<HTMLCanvasElement>();
const orderInfo = ref<CreateMembershipPaymentOrderResponse | null>(null);
const paymentStatus = ref<'creating' | 'pending' | 'success' | 'failed' | 'timeout'>('creating');
const paymentCheckInterval = ref<number | null>(null);
const countdownInterval = ref<number | null>(null);
const countdown = ref<number>(300);
const agreementAccepted = ref<boolean>(true);
const errorMessage = ref<string>('');

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const planTitle = computed(() => props.title || props.membershipPlan?.code || '');

const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

const copyOrderNumber = async () => {
  if (!orderInfo.value?.outTradeNo) return;
  try {
    await navigator.clipboard.writeText(orderInfo.value.outTradeNo);
    snackbarStore.showSuccessMessage('订单号已复制到剪贴板');
  } catch {
    snackbarStore.showErrorMessage('复制失败');
  }
};

const startCountdown = () => {
  countdown.value = 300;
  countdownInterval.value = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      paymentStatus.value = 'timeout';
      stopCountdown();
      stopPaymentStatusCheck();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

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
  } catch {
    snackbarStore.showErrorMessage('生成二维码失败');
  }
};

const checkPaymentStatus = async () => {
  if (!orderInfo.value) return;
  try {
    const response = await queryOrderStatus({
      orderId: orderInfo.value.outTradeNo,
      orderType: 'out_trade_no',
    });

    if (response.trade_state === 'SUCCESS') {
      paymentStatus.value = 'success';
      stopPaymentStatusCheck();
      stopCountdown();
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
  } catch (error) {
    console.warn('查询支付状态失败:', error);
  }
};

const startPaymentStatusCheck = () => {
  paymentCheckInterval.value = window.setInterval(() => {
    checkPaymentStatus();
  }, 2000);
};

const stopPaymentStatusCheck = () => {
  if (paymentCheckInterval.value) {
    clearInterval(paymentCheckInterval.value);
    paymentCheckInterval.value = null;
  }
};

const createPaymentOrder = async () => {
  if (!props.membershipPlan) return;

  if (!workspaceStore.currentWorkspaceId) {
    snackbarStore.showErrorMessage('请先选择工作空间');
    return;
  }

  try {
    paymentStatus.value = 'creating';
    errorMessage.value = '';

    const response = await createMembershipWechatPayOrder({
      planCode: props.membershipPlan.code,
      totalAmount: props.membershipPlan.priceYuan,
      workspaceId: workspaceStore.currentWorkspaceId,
    });

    orderInfo.value = response;
    paymentStatus.value = 'pending';

    await nextTick();
    await generateQRCode(response.codeUrl);

    startCountdown();
    startPaymentStatusCheck();
  } catch (error: unknown) {
    paymentStatus.value = 'failed';
    let message: string | null = null;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        message = maybeMessage;
      }
    }
    errorMessage.value = message || '创建支付订单失败';
    snackbarStore.showErrorMessage('创建支付订单失败');
  }
};

const handleCancel = async () => {
  stopPaymentStatusCheck();
  stopCountdown();

  if (orderInfo.value?.outTradeNo && workspaceStore.currentWorkspaceId) {
    try {
      await closeMembershipOrder(orderInfo.value.outTradeNo, workspaceStore.currentWorkspaceId);
    } catch (error) {
      console.warn('关闭会员订单失败:', error);
    }
  }

  emit('cancel');
  emit('update:open', false);
};

const handleClose = () => {
  stopPaymentStatusCheck();
  stopCountdown();
  emit('update:open', false);
};

const handleRetry = () => {
  emit('retry');
  createPaymentOrder();
};

const resetState = () => {
  orderInfo.value = null;
  paymentStatus.value = 'creating';
  errorMessage.value = '';
  countdown.value = 300;
  agreementAccepted.value = true;
  stopPaymentStatusCheck();
  stopCountdown();
};

watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.membershipPlan) {
      resetState();
      createPaymentOrder();
    } else if (!newOpen) {
      stopPaymentStatusCheck();
      stopCountdown();
    }
  }
);

onUnmounted(() => {
  stopPaymentStatusCheck();
  stopCountdown();
});
</script>

<style scoped>
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

.v-card {
  border-radius: 16px;
}

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

@media (max-width: 768px) {
  .payment-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .payment-right {
    order: -1;
  }
}
</style>
