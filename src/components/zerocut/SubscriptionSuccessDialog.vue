<template>
  <v-dialog v-model="dialog" max-width="560" persistent>
    <v-card class="text-center pa-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <v-card-text class="text-body-1 mt-4">
          {{ t('zerocut.subscriptionSuccess.loading') }}
        </v-card-text>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="py-4">
        <v-icon color="warning" size="80" class="mb-4"> mdi-alert-circle </v-icon>
        <v-card-title class="text-h5 font-weight-bold mb-2">
          {{ t('zerocut.subscriptionSuccess.errorLoading') }}
        </v-card-title>
        <v-card-text class="text-body-1 mb-4">
          {{ error }}
        </v-card-text>
        <v-btn color="primary" size="large" variant="flat" @click="handleViewDetails">
          {{ t('zerocut.subscriptionSuccess.viewDetailsAnyway') }}
        </v-btn>
      </div>

      <!-- 成功状态 -->
      <div v-else-if="subscription" class="py-4">
        <!-- Celebration Icon -->
        <v-icon color="success" size="80" class="celebration-icon mb-4"> mdi-party-popper </v-icon>

        <!-- Title + Subtitle -->
        <v-card-title class="text-h5 font-weight-bold mb-2">
          {{ t('zerocut.subscriptionSuccess.title') }}
        </v-card-title>
        <v-card-subtitle class="text-body-1 mb-4">
          {{ t('zerocut.subscriptionSuccess.subtitle') }}
        </v-card-subtitle>

        <!-- 信息卡片 -->
        <v-card variant="tonal" color="primary" class="mx-4 mb-6">
          <v-list density="compact" bg-color="transparent">
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-crown</v-icon>
              </template>
              <v-list-item-title class="text-body-2 text-medium-emphasis">
                {{ t('zerocut.subscriptionSuccess.labels.plan') }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1 font-weight-medium">
                {{ planName }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-wallet-giftcard</v-icon>
              </template>
              <v-list-item-title class="text-body-2 text-medium-emphasis">
                {{ t('zerocut.subscriptionSuccess.labels.monthlyCredits') }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1 font-weight-medium">
                {{ monthlyCreditsText }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-refresh</v-icon>
              </template>
              <v-list-item-title class="text-body-2 text-medium-emphasis">
                {{ t('zerocut.subscriptionSuccess.labels.subscriptionType') }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1 font-weight-medium">
                {{ subscriptionTypeText }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-calendar-range</v-icon>
              </template>
              <v-list-item-title class="text-body-2 text-medium-emphasis">
                {{ t('zerocut.subscriptionSuccess.labels.currentPeriod') }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-1 font-weight-medium">
                {{ periodText }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- 主按钮 -->
        <v-btn color="primary" size="large" variant="flat" @click="handleViewDetails">
          {{ t('zerocut.subscriptionSuccess.viewDetailsButton') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCurrentSubscription, type SubscriptionDetails } from '@/api/membershipApi';

const { t } = useI18n();

// Props
interface Props {
  modelValue: boolean;
  subscriptionId: number | null;
  workspaceId: string | null;
}

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'view-details'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const subscription = ref<SubscriptionDetails | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性：对话框显示状态
const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

// 计算属性：计划名称
const planName = computed(() =>
  subscription.value ? t(`zerocut.membership.tiers.${subscription.value.tier}`) : ''
);

// 计算属性：订阅类型 + 续费方式
const subscriptionTypeText = computed(() => {
  if (!subscription.value) return '';
  const cycleLabel = t(`zerocut.membership.cycles.${subscription.value.purchaseMode}`);
  const renewLabel = subscription.value.autoRenew
    ? t('zerocut.subscriptionSuccess.autoRenew')
    : t('zerocut.subscriptionSuccess.oneTime');
  return `${cycleLabel}${t('zerocut.subscriptionSuccess.separator')}${renewLabel}`;
});

// 计算属性：周期时间
const periodText = computed(() => {
  if (!subscription.value?.currentPeriodStartAt || !subscription.value?.currentPeriodEndAt) {
    return '-';
  }
  return `${formatDateShort(subscription.value.currentPeriodStartAt)} - ${formatDateShort(subscription.value.currentPeriodEndAt)}`;
});

// 计算属性：每月积分
const monthlyCreditsText = computed(() => {
  if (!subscription.value) return '-';
  return `${subscription.value.monthlyQuota} ${t('zerocut.subscriptionSuccess.creditsUnit')}`;
});

// 日期格式化函数（YYYY-MM-DD）
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 监听弹窗打开，获取订阅数据
watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen && props.subscriptionId && props.workspaceId) {
      loading.value = true;
      error.value = null;
      try {
        subscription.value = await getCurrentSubscription(props.workspaceId);
      } catch (err: any) {
        error.value = err.message || t('zerocut.subscriptionSuccess.errorLoading');
      } finally {
        loading.value = false;
      }
    }
  }
);

// 事件处理：查看详情
function handleViewDetails() {
  emit('view-details');
  dialog.value = false;
  emit('close');
}
</script>

<style scoped>
.celebration-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
