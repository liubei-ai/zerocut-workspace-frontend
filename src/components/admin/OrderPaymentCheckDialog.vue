<template>
  <v-dialog v-model="isOpen" max-width="640px" persistent>
    <v-card>
      <v-card-title class="text-h5 d-flex align-center px-6 pt-6">
        <v-icon class="mr-2">mdi-credit-card-search</v-icon>
        微信支付状态检查
      </v-card-title>

      <v-card-subtitle v-if="order" class="px-6 pb-2">
        商户订单号：<code class="order-code">{{ order.orderNo }}</code>
      </v-card-subtitle>

      <v-card-text class="px-6 pt-2">
        <!-- Loading -->
        <div v-if="phase === 'loading'" class="py-6 text-center">
          <v-progress-circular indeterminate color="primary" size="40" />
          <p class="text-body-2 text-medium-emphasis mt-3">正在向微信查询订单状态…</p>
        </div>

        <!-- Confirming backfill -->
        <div v-else-if="phase === 'confirming'" class="py-6 text-center">
          <v-progress-circular indeterminate color="warning" size="40" />
          <p class="text-body-2 text-medium-emphasis mt-3">正在补发…</p>
        </div>

        <!-- Query failed -->
        <v-alert
          v-else-if="phase === 'error' || (checkResult && !checkResult.queryOk)"
          type="error"
          variant="tonal"
          density="comfortable"
        >
          <div class="font-weight-medium mb-1">查询失败</div>
          <div class="text-body-2">{{ errorMessage || checkResult?.message }}</div>
        </v-alert>

        <!-- Checked: branches by tradeState -->
        <template v-else-if="phase === 'checked' && checkResult">
          <!-- SUCCESS + can backfill -->
          <template v-if="checkResult.canBackfill">
            <v-alert type="success" variant="tonal" density="comfortable" class="mb-4">
              <div class="font-weight-medium">微信侧已支付，可补发本期积分</div>
            </v-alert>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">微信交易号</span>
                <code class="order-code">{{ checkResult.wechatTransactionId }}</code>
              </div>
              <div class="info-row">
                <span class="info-label">商户订单号</span>
                <code class="order-code">{{ checkResult.orderNo }}</code>
              </div>
              <div v-if="checkResult.wechatTotalFee != null" class="info-row">
                <span class="info-label">微信侧金额</span>
                <span>¥{{ (checkResult.wechatTotalFee / 100).toFixed(2) }}</span>
              </div>

              <template v-if="checkResult.grantPreview">
                <v-divider class="my-2" />
                <div v-if="checkResult.grantPreview.periodIndex != null" class="info-row">
                  <span class="info-label">待发放周期</span>
                  <span>
                    第 {{ checkResult.grantPreview.periodIndex }} 期
                    <span
                      v-if="
                        checkResult.grantPreview.periodStartAt &&
                        checkResult.grantPreview.periodEndAt
                      "
                      class="text-medium-emphasis text-caption"
                    >
                      （{{ formatDate(checkResult.grantPreview.periodStartAt) }} ~
                      {{ formatDate(checkResult.grantPreview.periodEndAt) }}）
                    </span>
                  </span>
                </div>
                <div
                  v-else-if="
                    checkResult.grantPreview.periodStartAt && checkResult.grantPreview.periodEndAt
                  "
                  class="info-row"
                >
                  <span class="info-label">预计周期</span>
                  <span class="text-medium-emphasis text-caption">
                    {{ formatDate(checkResult.grantPreview.periodStartAt) }} ~
                    {{ formatDate(checkResult.grantPreview.periodEndAt) }}
                  </span>
                </div>
                <div v-if="checkResult.grantPreview.planName" class="info-row">
                  <span class="info-label">所属计划</span>
                  <span>{{ checkResult.grantPreview.planName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">应发积分</span>
                  <span class="text-primary font-weight-medium">
                    {{ checkResult.grantPreview.creditsQuota }} 积分
                    <v-chip
                      v-if="checkResult.grantPreview.source === 'plan_default'"
                      size="x-small"
                      variant="outlined"
                      class="ml-1"
                    >
                      按计划默认值
                    </v-chip>
                  </span>
                </div>
              </template>
            </div>

            <v-alert
              type="warning"
              variant="tonal"
              density="compact"
              class="text-caption mt-4"
              icon="mdi-information-outline"
            >
              确认补发后，周期窗口会按当前服务器时间重新锚定，与微信回调路径保持一致。
            </v-alert>
          </template>

          <!-- REFUND: 微信侧已退款 -->
          <template v-else-if="checkResult.needsRefundMark">
            <v-alert type="warning" variant="tonal" density="comfortable" class="mb-4">
              <div class="font-weight-medium mb-1">微信侧已退款</div>
              <div class="text-body-2">
                将把订单状态标记为「已退款」。不会变更订阅或周期，已发放的积分流水不会回收。
              </div>
            </v-alert>

            <div class="info-grid">
              <div v-if="checkResult.wechatTransactionId" class="info-row">
                <span class="info-label">微信交易号</span>
                <code class="order-code">{{ checkResult.wechatTransactionId }}</code>
              </div>
              <div class="info-row">
                <span class="info-label">商户订单号</span>
                <code class="order-code">{{ checkResult.orderNo }}</code>
              </div>
              <div v-if="checkResult.wechatTotalFee != null" class="info-row">
                <span class="info-label">微信侧金额</span>
                <span>¥{{ (checkResult.wechatTotalFee / 100).toFixed(2) }}</span>
              </div>
            </div>
          </template>

          <!-- NOTPAY / USERPAYING -->
          <template
            v-else-if="
              checkResult.tradeState === 'NOTPAY' || checkResult.tradeState === 'USERPAYING'
            "
          >
            <v-alert type="info" variant="tonal" density="comfortable">
              <div class="font-weight-medium mb-1">
                {{ checkResult.tradeStateDesc || checkResult.tradeState }}
              </div>
              <div class="text-body-2">{{ checkResult.message }}</div>
            </v-alert>
          </template>

          <!-- CLOSED / REVOKED / PAYERROR -->
          <template
            v-else-if="
              checkResult.tradeState === 'CLOSED' ||
              checkResult.tradeState === 'REVOKED' ||
              checkResult.tradeState === 'PAYERROR'
            "
          >
            <v-alert type="error" variant="tonal" density="comfortable">
              <div class="font-weight-medium mb-1">
                {{ checkResult.tradeStateDesc || checkResult.tradeState }}
              </div>
              <div class="text-body-2">{{ checkResult.message }}</div>
            </v-alert>
          </template>

          <!-- Unknown -->
          <template v-else>
            <v-alert type="warning" variant="tonal" density="comfortable">
              <div class="font-weight-medium mb-1">未识别的支付状态</div>
              <div class="text-body-2">{{ checkResult.message }}</div>
            </v-alert>
          </template>
        </template>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-btn
          v-if="phase === 'error' || (checkResult && !checkResult.queryOk)"
          variant="text"
          @click="runCheck"
          :disabled="phase === 'loading'"
        >
          重试
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="handleClose" :disabled="phase === 'confirming'"> 关闭 </v-btn>
        <v-btn
          v-if="canShowPrimaryButton"
          :color="primaryButtonColor"
          variant="elevated"
          :loading="phase === 'confirming'"
          :disabled="phase !== 'checked'"
          @click="handleBackfill"
        >
          {{ primaryButtonLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import {
  backfillOrderPayment,
  checkOrderPayment,
  type OrderPaymentCheckResult,
  type SubscriptionOrderItem,
} from '@/api/memberAdminApi';
import { extractApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/date';

interface Props {
  open: boolean;
  order: SubscriptionOrderItem | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

type Phase = 'idle' | 'loading' | 'checked' | 'confirming' | 'error';

const phase = ref<Phase>('idle');
const checkResult = ref<OrderPaymentCheckResult | null>(null);
const errorMessage = ref<string>('');

const snackbar = reactive({
  show: false,
  color: 'success',
  message: '',
});

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const canShowPrimaryButton = computed(() => {
  if (!checkResult.value || !checkResult.value.queryOk) return false;
  return checkResult.value.canBackfill || checkResult.value.needsRefundMark;
});

const primaryButtonLabel = computed(() => {
  if (!checkResult.value) return '';
  if (checkResult.value.canBackfill) return '确认补发';
  if (checkResult.value.needsRefundMark) return '确认标记退款';
  return '';
});

const primaryButtonColor = computed(() => {
  if (!checkResult.value) return 'primary';
  if (checkResult.value.canBackfill) return 'warning';
  if (checkResult.value.needsRefundMark) return 'purple';
  return 'primary';
});

function showToast(message: string, color: 'success' | 'error' = 'success') {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
}

async function runCheck() {
  if (!props.order) return;
  phase.value = 'loading';
  errorMessage.value = '';
  checkResult.value = null;
  try {
    checkResult.value = await checkOrderPayment(props.order.orderId);
    phase.value = 'checked';
  } catch (err: unknown) {
    errorMessage.value = extractApiErrorMessage(err, '查询微信支付状态失败');
    phase.value = 'error';
  }
}

async function handleBackfill() {
  if (!props.order || !checkResult.value) return;
  phase.value = 'confirming';
  try {
    const result = await backfillOrderPayment(props.order.orderId);
    const tip =
      result.action === 'marked_refunded'
        ? '订单已标记为退款'
        : `补发成功，共发放 ${result.creditsGranted ?? 0} 积分`;
    showToast(tip, 'success');
    emit('refresh');
    emit('update:open', false);
  } catch (err: unknown) {
    showToast(extractApiErrorMessage(err, '补发失败'), 'error');
    phase.value = 'checked';
  }
}

function handleClose() {
  emit('update:open', false);
}

watch(
  () => props.open,
  async newOpen => {
    if (newOpen && props.order) {
      await runCheck();
    } else if (!newOpen) {
      phase.value = 'idle';
      checkResult.value = null;
      errorMessage.value = '';
    }
  }
);
</script>

<style scoped>
.order-code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  word-break: break-all;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.info-label {
  color: rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}
</style>
