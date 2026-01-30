<template>
  <v-dialog v-model="isOpen" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6 d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-autorenew</v-icon>
        连续订阅签约
      </v-card-title>

      <v-card-text class="px-6 pb-6">
        <div v-if="uiStatus === 'creating'" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <div class="text-h6 mb-2">正在创建签约会话...</div>
          <div class="text-body-2 text-medium-emphasis">请稍候</div>
        </div>

        <div v-else-if="uiStatus === 'pending'" class="payment-layout">
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
                  <span class="text-body-2 text-medium-emphasis">扣费金额</span>
                  <span class="text-h6 font-weight-bold text-primary"
                    >¥{{ membershipPlan?.priceYuan }}</span
                  >
                </div>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6 pb-2">
                <v-icon class="mr-2" color="info">mdi-receipt</v-icon>
                签约会话
              </v-card-title>
              <v-card-text class="pt-0">
                <div class="d-flex align-center mb-2">
                  <span class="text-body-2 text-medium-emphasis mr-2">会话ID：</span>
                  <span class="text-body-2 font-family-monospace">{{
                    signingSession?.signingSessionId
                  }}</span>
                  <v-btn
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    class="ml-2"
                    @click="copySessionId"
                  />
                </div>
                <div class="d-flex align-center">
                  <span class="text-body-2 text-medium-emphasis mr-2">创建时间：</span>
                  <span class="text-body-2">{{ formatTime(new Date()) }}</span>
                </div>
              </v-card-text>
            </v-card>

            <div v-if="uiStatus === 'pending'">
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
                  请使用微信扫码签约
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

        <div v-else-if="uiStatus === 'signed'" class="text-center py-8">
          <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>
          <div class="text-h5 mb-2 text-success">签约成功！</div>
          <div class="text-body-1 text-medium-emphasis mb-4">后续将按周期自动扣费并发放积分</div>
          <div class="text-body-2">会话ID：{{ signingSession?.signingSessionId }}</div>
        </div>

        <div v-else-if="uiStatus === 'timeout'" class="text-center py-8">
          <v-icon size="80" color="warning" class="mb-4">mdi-clock-alert</v-icon>
          <div class="text-body-1 text-medium-emphasis mb-4">签约会话已超时，请重新发起</div>
          <div v-if="signingSession?.signingSessionId" class="text-body-2">
            会话ID：{{ signingSession.signingSessionId }}
          </div>
        </div>

        <div v-else-if="uiStatus === 'failed'" class="text-center py-8">
          <v-icon size="80" color="error" class="mb-4">mdi-close-circle</v-icon>
          <div class="text-h5 mb-2 text-error">签约失败</div>
          <div class="text-body-1 text-medium-emphasis mb-4">
            {{ errorMessage || '签约过程中出现错误，请重试' }}
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />

        <template v-if="uiStatus === 'creating'">
          <v-btn variant="text" @click="handleCancel">取消</v-btn>
        </template>

        <template v-else-if="uiStatus === 'pending'">
          <v-btn variant="text" @click="handleCancel" class="mr-2">取消</v-btn>
        </template>

        <template v-else>
          <v-btn color="primary" variant="elevated" @click="handleClose" class="mr-2">
            {{ uiStatus === 'signed' ? '完成' : '关闭' }}
          </v-btn>
          <v-btn
            v-if="uiStatus === 'failed' || uiStatus === 'timeout'"
            color="primary"
            variant="outlined"
            @click="handleRetry"
          >
            重新发起
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  createSigningSession,
  getSigningSessionStatus,
  type MembershipPlanDto,
  type SigningSessionResponse,
  type SigningSessionStatus,
} from '@/api/membershipApi';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import QRCode from 'qrcode';
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

interface Props {
  open: boolean;
  membershipPlan: MembershipPlanDto | null;
  title?: string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success', payload: SigningSessionStatus): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
});

const emit = defineEmits<Emits>();

const snackbarStore = useSnackbarStore();
const workspaceStore = useWorkspaceStore();

const qrCodeCanvas = ref<HTMLCanvasElement>();
const signingSession = ref<SigningSessionResponse | null>(null);
const uiStatus = ref<'creating' | 'pending' | 'signed' | 'failed' | 'timeout'>('creating');
const pollingInterval = ref<number | null>(null);
const countdownInterval = ref<number | null>(null);
const countdown = ref<number>(600);
const agreementAccepted = ref<boolean>(true);
const errorMessage = ref<string>('');

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const membershipPlan = computed(() => props.membershipPlan);
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

const copySessionId = async () => {
  if (!signingSession.value?.signingSessionId) return;
  try {
    await navigator.clipboard.writeText(signingSession.value.signingSessionId);
    snackbarStore.showSuccessMessage('会话ID已复制到剪贴板');
  } catch {
    snackbarStore.showErrorMessage('复制失败');
  }
};

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

const generateQRCode = async (url: string) => {
  if (!qrCodeCanvas.value) return;
  try {
    await QRCode.toCanvas(qrCodeCanvas.value, url, {
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

const startCountdown = (expiresAtIso: string) => {
  const expiresAtMs = Date.parse(expiresAtIso);
  const initial = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  countdown.value = initial;

  stopCountdown();
  countdownInterval.value = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      uiStatus.value = 'timeout';
      stopCountdown();
      stopPolling();
    }
  }, 1000);
};

const pollSigningStatusOnce = async () => {
  if (!signingSession.value?.signingSessionId) return;

  try {
    const status = await getSigningSessionStatus(signingSession.value.signingSessionId);
    if (status.status === 'signed') {
      uiStatus.value = 'signed';
      stopPolling();
      stopCountdown();
      emit('success', status);
    } else if (status.status === 'expired') {
      uiStatus.value = 'timeout';
      stopPolling();
      stopCountdown();
    }
  } catch {
    return;
  }
};

const startPolling = () => {
  stopPolling();
  pollingInterval.value = window.setInterval(() => {
    pollSigningStatusOnce();
  }, 2000);
};

const resetState = () => {
  signingSession.value = null;
  uiStatus.value = 'creating';
  errorMessage.value = '';
  countdown.value = 600;
  agreementAccepted.value = true;
  stopPolling();
  stopCountdown();
};

const createSession = async () => {
  if (!props.membershipPlan) return;
  if (!workspaceStore.currentWorkspaceId) {
    uiStatus.value = 'failed';
    errorMessage.value = '请先选择工作空间';
    snackbarStore.showErrorMessage('请先选择工作空间');
    return;
  }

  try {
    uiStatus.value = 'creating';
    errorMessage.value = '';

    const session = await createSigningSession({
      workspaceId: workspaceStore.currentWorkspaceId,
      planCode: props.membershipPlan.code,
      displayAccountName: workspaceStore.currentWorkspaceName || undefined,
    });

    signingSession.value = session;
    uiStatus.value = 'pending';

    await nextTick();
    await generateQRCode(session.qrUrl);

    startCountdown(session.expiresAt);
    startPolling();
  } catch (error: unknown) {
    uiStatus.value = 'failed';
    let message: string | null = null;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        message = maybeMessage;
      }
    }
    errorMessage.value = message || '创建签约会话失败';
    snackbarStore.showErrorMessage('创建签约会话失败');
  }
};

const handleCancel = () => {
  stopPolling();
  stopCountdown();
  emit('cancel');
  emit('update:open', false);
};

const handleClose = () => {
  stopPolling();
  stopCountdown();
  emit('update:open', false);
};

const handleRetry = () => {
  resetState();
  createSession();
};

watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.membershipPlan) {
      resetState();
      createSession();
    } else if (!newOpen) {
      stopPolling();
      stopCountdown();
    }
  }
);

onUnmounted(() => {
  stopPolling();
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
