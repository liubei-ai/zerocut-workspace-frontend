<template>
  <v-dialog v-model="isOpen" max-width="600px">
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6"> 为工作空间充值 </v-card-title>

      <v-card-subtitle class="px-6 pb-4">
        为 {{ workspace?.name }} ({{ workspace?.workspaceId }}) 充值积分
      </v-card-subtitle>

      <v-card-text class="px-6">
        <v-form ref="form" v-model="formValid">
          <!-- 充值类型选择 -->
          <div class="mb-4">
            <v-label class="text-subtitle-2 mb-2 d-block">充值类型</v-label>
            <v-radio-group v-model="rechargeType" :disabled="loading" inline density="comfortable">
              <v-radio label="手动充值" value="manual" color="primary" />
              <v-radio label="积分赠送" value="give" color="primary" />
            </v-radio-group>
            <v-card
              variant="outlined"
              class="pa-3 mt-2"
              :color="rechargeType === 'manual' ? 'blue-lighten-5' : 'orange-lighten-5'"
            >
              <div class="text-body-2 text-medium-emphasis">
                <template v-if="rechargeType === 'manual'">
                  <v-icon size="small" class="mr-1" color="blue">mdi-cash</v-icon>
                  实际资金充值，用于正常的付费服务
                </template>
                <template v-else>
                  <v-icon size="small" class="mr-1" color="orange">mdi-gift</v-icon>
                  营销赠送或补偿积分，不涉及实际资金
                </template>
              </div>
            </v-card>
          </div>

          <!-- 手动充值表单 -->
          <template v-if="rechargeType === 'manual'">
            <v-text-field
              v-model="amount"
              label="充值金额 (元)"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="请输入充值金额"
              :disabled="loading"
              :rules="amountRules"
              required
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model="creditsAmount"
              label="积分数量 (可选)"
              type="number"
              min="1"
              step="1"
              placeholder="留空则按系统比例计算"
              :disabled="loading"
              :rules="creditsRules"
              variant="outlined"
              density="comfortable"
              :color="exchangeRateColor"
              class="mb-2"
            />

            <!-- 积分输入说明 -->
            <div class="text-caption text-medium-emphasis mb-3 px-2">
              <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
              <span v-if="!creditsAmount || parseInt(creditsAmount) <= 0">
                不填写积分数量时，将按系统默认比例 1:{{ systemExchangeRate }} 计算
              </span>
              <span v-else>
                自定义积分数量将影响兑换比例，当前比例为 1:{{ exchangeRateDisplay }}
              </span>
            </div>

            <!-- 兑换比例提示 -->
            <v-card
              v-if="showExchangeRateInfo"
              variant="outlined"
              class="pa-4 mb-3"
              :color="exchangeRateCardColor"
            >
              <div class="d-flex align-center mb-2">
                <v-icon :color="exchangeRateIconColor" size="20" class="mr-2">
                  {{ exchangeRateIcon }}
                </v-icon>
                <span class="text-subtitle-2 font-weight-medium">充值计算详情</span>
              </div>

              <div class="text-body-2">
                <!-- 充值金额 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-medium-emphasis">充值金额：</span>
                  <span class="font-weight-medium">¥{{ amount }}</span>
                </div>

                <!-- 兑换比例 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-medium-emphasis">兑换比例：</span>
                  <div class="text-right">
                    <div class="font-weight-medium">
                      1元 = {{ exchangeRateDisplay }}积分
                      <v-chip
                        v-if="isCustomExchangeRate"
                        size="x-small"
                        :color="exchangeRateColor"
                        variant="outlined"
                        class="ml-1"
                      >
                        自定义
                      </v-chip>
                    </div>
                    <div v-if="isCustomExchangeRate" class="text-caption text-medium-emphasis">
                      系统默认：1元 = {{ systemExchangeRate }}积分
                    </div>
                  </div>
                </div>

                <!-- 预计到账 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-medium-emphasis">预计到账：</span>
                  <span class="font-weight-medium text-primary">{{ calculatedCredits }} 积分</span>
                </div>

                <!-- 警告信息 -->
                <v-divider v-if="exchangeRateWarning" class="my-2"></v-divider>
                <v-alert
                  v-if="exchangeRateWarning"
                  :type="currentExchangeRate >= 40 ? 'error' : 'warning'"
                  variant="tonal"
                  density="compact"
                  class="text-caption"
                >
                  {{ exchangeRateWarning }}
                </v-alert>
              </div>
            </v-card>
          </template>

          <!-- 积分赠送表单 -->
          <template v-else>
            <v-text-field
              v-model="creditsAmount"
              label="赠送积分数量"
              type="number"
              min="1"
              step="1"
              placeholder="请输入要赠送的积分数量"
              :disabled="loading"
              :rules="creditsRules"
              required
              variant="outlined"
              density="comfortable"
              class="mb-2"
            />

            <!-- 积分赠送说明 -->
            <div class="text-caption text-medium-emphasis mb-3 px-2">
              <v-icon size="14" class="mr-1">mdi-gift-outline</v-icon>
              积分赠送无需实际付费，直接增加用户积分余额
            </div>

            <v-card
              v-if="creditsAmount && parseInt(creditsAmount) > 0"
              variant="outlined"
              class="pa-4 mb-3"
              color="orange-lighten-5"
            >
              <div class="d-flex align-center mb-2">
                <v-icon color="orange" size="20" class="mr-2">mdi-gift</v-icon>
                <span class="text-subtitle-2 font-weight-medium">赠送详情</span>
              </div>

              <div class="text-body-2">
                <!-- 赠送积分 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-medium-emphasis">赠送积分：</span>
                  <span class="font-weight-medium text-primary">{{ creditsAmount }} 积分</span>
                </div>

                <!-- 参考金额 -->
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-medium-emphasis">参考金额：</span>
                  <span class="font-weight-medium">¥{{ referenceAmount }}</span>
                </div>

                <!-- 系统比例 -->
                <div class="d-flex justify-space-between align-center">
                  <span class="text-medium-emphasis">系统比例：</span>
                  <span class="text-caption">1元 = {{ systemExchangeRate }}积分</span>
                </div>
              </div>
            </v-card>
          </template>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="handleCancel" :disabled="loading" class="mr-2"> 取消 </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleConfirm"
          :disabled="!isValid || loading"
          :loading="loading"
        >
          确认充值
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { WorkspaceListItem } from '@/api/adminApi';
import { computed, ref, watch } from 'vue';

interface Props {
  open: boolean;
  workspace: WorkspaceListItem | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (
    e: 'confirm',
    data: {
      amount: number;
      creditsAmount?: number;
      paymentMethod: 'manual' | 'give';
      thirdPartyOrderNo?: string;
    }
  ): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const form = ref();
const formValid = ref(false);
const amount = ref<string>('');
const creditsAmount = ref<string>('');
const rechargeType = ref<'manual' | 'give'>('manual');

// 系统默认兑换比例
const systemExchangeRate = 20;

// 金额验证规则
const amountRules = [
  (v: string) => !!v || '请输入充值金额',
  (v: string) => {
    const num = parseFloat(v);
    return (!isNaN(num) && num >= 0.1) || '充值金额必须大于等于0.1元';
  },
];

// 积分验证规则
const creditsRules = [
  (v: string) => {
    if (!v) return true; // 可选字段
    const num = parseInt(v);
    return (!isNaN(num) && num >= 1 && Number.isInteger(parseFloat(v))) || '积分数量必须是正整数';
  },
];

// 计算当前兑换比例
const currentExchangeRate = computed(() => {
  const amountNum = parseFloat(amount.value);
  const creditsNum = parseInt(creditsAmount.value);

  if (rechargeType.value === 'give') {
    return systemExchangeRate;
  }

  if (amountNum > 0 && creditsNum > 0) {
    return creditsNum / amountNum;
  }

  return systemExchangeRate;
});

// 是否为自定义兑换比例
const isCustomExchangeRate = computed(() => {
  return (
    rechargeType.value === 'manual' &&
    parseFloat(amount.value) > 0 &&
    parseInt(creditsAmount.value) > 0
  );
});

// 兑换比例显示
const exchangeRateDisplay = computed(() => {
  return currentExchangeRate.value.toFixed(2);
});

// 计算的积分数量
const calculatedCredits = computed(() => {
  const amountNum = parseFloat(amount.value);
  if (rechargeType.value === 'manual' && amountNum > 0) {
    if (parseInt(creditsAmount.value) > 0) {
      return parseInt(creditsAmount.value);
    }
    return Math.floor(amountNum * systemExchangeRate);
  }
  return null;
});

// 参考金额（积分赠送时显示）
const referenceAmount = computed(() => {
  const creditsNum = parseInt(creditsAmount.value);
  if (rechargeType.value === 'give' && creditsNum > 0) {
    return (creditsNum / systemExchangeRate).toFixed(2);
  }
  return '0.00';
});

// 兑换比例颜色和样式
const exchangeRateColor = computed(() => {
  if (!isCustomExchangeRate.value) return 'primary';

  const rate = currentExchangeRate.value;
  if (rate >= 40) return 'error';
  if (rate >= 30) return 'warning';
  return 'primary';
});

const exchangeRateCardColor = computed(() => {
  if (!isCustomExchangeRate.value) return 'blue-lighten-5';

  const rate = currentExchangeRate.value;
  if (rate >= 40) return 'red-lighten-5';
  if (rate >= 30) return 'orange-lighten-5';
  return 'blue-lighten-5';
});

const exchangeRateIconColor = computed(() => {
  if (!isCustomExchangeRate.value) return 'blue';

  const rate = currentExchangeRate.value;
  if (rate >= 40) return 'red';
  if (rate >= 30) return 'orange';
  return 'blue';
});

const exchangeRateIcon = computed(() => {
  if (!isCustomExchangeRate.value) return 'mdi-information';

  const rate = currentExchangeRate.value;
  if (rate >= 40) return 'mdi-alert-circle';
  if (rate >= 30) return 'mdi-alert';
  return 'mdi-information';
});

const exchangeRateWarning = computed(() => {
  if (!isCustomExchangeRate.value) return '';

  const rate = currentExchangeRate.value;
  if (rate >= 40) return '兑换比例过高，请谨慎操作！';
  if (rate >= 30) return '兑换比例偏高，请确认是否正确';
  return '';
});

const exchangeRateWarningClass = computed(() => {
  const rate = currentExchangeRate.value;
  if (rate >= 40) return 'text-red';
  if (rate >= 30) return 'text-orange';
  return '';
});

const showExchangeRateInfo = computed(() => {
  return rechargeType.value === 'manual' && parseFloat(amount.value) > 0;
});

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const isValid = computed(() => {
  if (rechargeType.value === 'manual') {
    const amountNum = parseFloat(amount.value);
    const amountValid = !isNaN(amountNum) && amountNum >= 0.1;

    const creditsNum = parseInt(creditsAmount.value);
    const creditsValid = !creditsAmount.value || (!isNaN(creditsNum) && creditsNum >= 1);

    return amountValid && creditsValid && formValid.value;
  } else {
    const creditsNum = parseInt(creditsAmount.value);
    return !isNaN(creditsNum) && creditsNum >= 1 && formValid.value;
  }
});

const handleCancel = () => {
  emit('update:open', false);
};

const handleConfirm = () => {
  if (!isValid.value) return;

  const data: {
    amount: number;
    creditsAmount?: number;
    paymentMethod: 'manual' | 'give';
    thirdPartyOrderNo?: string;
  } = {
    amount: rechargeType.value === 'give' ? 0 : parseFloat(amount.value),
    paymentMethod: rechargeType.value,
  };

  // 添加积分数量
  if (rechargeType.value === 'give') {
    data.creditsAmount = parseInt(creditsAmount.value);
  } else if (creditsAmount.value && parseInt(creditsAmount.value) > 0) {
    data.creditsAmount = parseInt(creditsAmount.value);
  }

  emit('confirm', data);
};

// 重置表单
watch(
  () => props.open,
  newOpen => {
    if (newOpen) {
      amount.value = '';
      creditsAmount.value = '';
      rechargeType.value = 'manual';
      formValid.value = false;
      if (form.value) {
        form.value.resetValidation();
      }
    }
  }
);
</script>

<style scoped>
.text-orange {
  color: #ff9800 !important;
}

.text-red {
  color: #f44336 !important;
}
</style>
