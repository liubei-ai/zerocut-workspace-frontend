<template>
  <v-dialog v-model="isOpen" max-width="800px">
    <v-card>
      <!-- 成功状态头部 -->
      <v-card-title class="d-flex align-center pa-6">
        <v-icon size="48" color="success" class="mr-4">mdi-check-circle</v-icon>
        <div>
          <h2 class="text-h5 font-weight-bold text-success">充值成功！</h2>
          <p class="text-subtitle-1 text-medium-emphasis mt-1">充值操作已完成</p>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- 充值信息卡片 -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="primary">mdi-cash-plus</v-icon>
            充值详情
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-currency-cny</v-icon>
                  <span class="text-body-2 text-medium-emphasis">充值金额</span>
                </div>
                <div class="text-h6 font-weight-medium text-success">¥{{ result?.amount }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-primary">mdi-star</v-icon>
                  <span class="text-body-2 text-medium-emphasis">实际到账积分</span>
                </div>
                <div class="text-h5 font-weight-bold text-primary d-flex align-center">
                  {{ result?.creditsAmount || 0 }}
                  <v-chip color="primary" variant="tonal" size="small" class="ml-2">积分</v-chip>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-check-circle</v-icon>
                  <span class="text-body-2 text-medium-emphasis">充值状态</span>
                </div>
                <v-chip color="success" variant="tonal" size="small">
                  {{ getStatusText(result?.status) }}
                </v-chip>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-credit-card</v-icon>
                  <span class="text-body-2 text-medium-emphasis">支付方式</span>
                </div>
                <div class="text-body-1">{{ getPaymentMethodText(result?.paymentMethod) }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-calendar</v-icon>
                  <span class="text-body-2 text-medium-emphasis">创建时间</span>
                </div>
                <div class="text-body-1">{{ formatDate(result?.createdAt) }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-update</v-icon>
                  <span class="text-body-2 text-medium-emphasis">更新时间</span>
                </div>
                <div class="text-body-1">{{ formatDate(result?.updatedAt) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 工作空间信息卡片 -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="primary">mdi-domain</v-icon>
            工作空间信息
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-identifier</v-icon>
                  <span class="text-body-2 text-medium-emphasis">工作空间ID</span>
                </div>
                <div class="text-body-1 font-weight-medium">{{ result?.workspaceId }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-3">
                  <v-icon size="20" class="mr-2 text-medium-emphasis">mdi-domain</v-icon>
                  <span class="text-body-2 text-medium-emphasis">工作空间名称</span>
                </div>
                <div class="text-body-1 font-weight-medium">{{ workspace?.name }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 支付详情（如果有） -->
        <v-card
          v-if="result?.paymentDetails && Object.keys(result.paymentDetails).length > 0"
          variant="outlined"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            支付详情
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4">
            <pre class="text-body-2">{{ JSON.stringify(result?.paymentDetails, null, 2) }}</pre>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          @click="handleClose"
          prepend-icon="mdi-check"
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { RechargeResponse, WorkspaceListItem } from '@/api/adminApi';
import { computed } from 'vue';

interface Props {
  open: boolean;
  result: RechargeResponse | null;
  workspace: WorkspaceListItem | null;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 获取状态文本
const getStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };
  return statusMap[status || ''] || status || '未知';
};

// 获取支付方式文本
const getPaymentMethodText = (method?: string) => {
  const methodMap: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行转账',
    manual: '手动充值',
    give: '积分赠送',
    admin: '管理员充值',
    bagelpay: 'BagelPay',
  };
  return methodMap[method || ''] || method || '未知';
};

// 处理关闭
const handleClose = () => {
  emit('update:open', false);
  emit('close');
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card--variant-outlined {
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

pre {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}
</style>
