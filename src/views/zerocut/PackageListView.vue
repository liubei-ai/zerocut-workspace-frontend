<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  getPackageList,
  type CreatePaymentOrderResponse,
  type PackageInfo,
} from '~/src/api/packageApi';
import PackageCard from '~/src/components/zerocut/PackageCard.vue';
import PaymentDialog from '~/src/components/zerocut/PaymentDialog.vue';
import RechargeSuccessOverlay from '~/src/components/zerocut/RechargeSuccessOverlay.vue';
import { useSnackbarStore } from '~/src/stores/snackbarStore';

// 状态管理
const snackbarStore = useSnackbarStore();
const router = useRouter();

// i18n
const { t } = useI18n();

// 加载状态
const loading = ref(false);

// 数据状态
const packages = ref<PackageInfo[]>([]);

// 支付对话框状态
const paymentDialog = ref(false);
const selectedPackage = ref<PackageInfo | null>(null);

// 充值成功浮层状态
const successOverlay = ref(false);
const successOrderInfo = ref<CreatePaymentOrderResponse | null>(null);

// 错误处理
const showError = (message: string) => {
  snackbarStore.showErrorMessage(message);
};

const showSuccess = (message: string) => {
  snackbarStore.showSuccessMessage(message);
};

// 获取套餐列表
const fetchPackages = async () => {
  try {
    loading.value = true;
    const packageList = await getPackageList();
    packages.value = packageList.filter(pkg => pkg.isActive);
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    snackbarStore.showErrorMessage(t('zerocut.packages.fetch_failed'));
  } finally {
    loading.value = false;
  }
};

// 处理购买按钮点击
const handlePurchase = (pkg: PackageInfo) => {
  selectedPackage.value = pkg;
  paymentDialog.value = true;
};

// 处理支付成功
const handlePaymentSuccess = (orderInfo: CreatePaymentOrderResponse) => {
  successOrderInfo.value = orderInfo;
  paymentDialog.value = false;
  successOverlay.value = true;
};

// 处理支付取消
const handlePaymentCancel = () => {
  paymentDialog.value = false;
  selectedPackage.value = null;
};

// 处理支付重试
const handlePaymentRetry = () => {
  // 重试逻辑可以在这里实现，比如重新生成订单
  console.log('支付重试');
};

// 处理充值成功浮层关闭
const handleSuccessOverlayClose = () => {
  successOverlay.value = false;
  selectedPackage.value = null;
  successOrderInfo.value = null;
  // 刷新套餐列表以更新用户积分显示
  fetchPackages();
};

// 处理查看钱包
const handleViewWallet = () => {
  successOverlay.value = false;
  selectedPackage.value = null;
  successOrderInfo.value = null;
  // 跳转到钱包页面
  router.push('/wallet');
};

// 组件挂载时获取数据
onMounted(() => {
  fetchPackages();
});
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-bold mb-1 text-2xl sm:text-3xl">{{ t('zerocut.packages.title') }}</h1>
        </div>
        <div class="flex flex-wrap gap-2 sm:justify-end">
          <v-btn
            class="!hidden sm:inline-flex"
            variant="outlined"
            color="primary"
            prepend-icon="mdi-refresh"
            @click="fetchPackages"
            :loading="loading"
          >
            {{ t('common.refresh') }}
          </v-btn>
          <v-menu class="sm:hidden">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined" icon="mdi-dots-horizontal" size="small" />
            </template>
            <v-list>
              <v-list-item @click="fetchPackages">
                <v-icon class="mr-2">mdi-refresh</v-icon>
                {{ t('common.refresh') }}
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- 积分购买说明 -->
    <v-card class="mb-6" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="info">mdi-information-outline</v-icon>
        {{ t('zerocut.packages.purchaseInfo.title') }}
      </v-card-title>
      <v-card-text>
        <v-list density="compact" class="pa-0">
          <v-list-item class="px-0">
            <v-list-item-title class="text-body-2">
              <span class="font-weight-medium">1.</span> 购买后的积分，以订单计，有效期为
              <span class="font-weight-bold text-primary">{{
                t('zerocut.packages.purchaseInfo.days_value', { days: 365 })
              }}</span
              >，{{ t('zerocut.packages.purchaseInfo.validity_clear') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="px-0">
            <v-list-item-title class="text-body-2">
              <span class="font-weight-medium">2.</span>
              {{ t('zerocut.packages.purchaseInfo.consume_priority') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="px-0">
            <v-list-item-title class="text-body-2">
              <span class="font-weight-medium">3.</span>
              {{ t('zerocut.packages.purchaseInfo.concurrency_prefix') }}
              <span class="font-weight-bold text-primary">{{ 5 }}</span
              >，{{ t('zerocut.packages.purchaseInfo.concurrency_desc') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- 套餐列表 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-subtitle-1 mt-4">{{ t('zerocut.packages.loading') }}</div>
    </div>

    <v-row v-else>
      <v-col v-for="pkg in packages" :key="pkg.id" cols="12" sm="6" md="4" lg="3">
        <PackageCard :package-info="pkg" @purchase="handlePurchase" />
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <div v-if="!loading && packages.length === 0" class="text-center py-12">
      <v-icon size="96" color="grey-lighten-2" class="mb-4">mdi-package-variant-closed</v-icon>
      <div class="text-h6 text-medium-emphasis mb-2">{{ t('zerocut.packages.empty.title') }}</div>
      <div class="text-body-2 text-medium-emphasis">{{ t('zerocut.packages.empty.subtitle') }}</div>
    </div>

    <!-- 支付对话框 -->
    <PaymentDialog
      v-model:open="paymentDialog"
      :package-info="selectedPackage"
      @success="handlePaymentSuccess"
      @cancel="handlePaymentCancel"
      @retry="handlePaymentRetry"
    />

    <!-- 充值成功浮层 -->
    <RechargeSuccessOverlay
      v-model:open="successOverlay"
      :credits-amount="selectedPackage?.creditsAmount || 0"
      :order-number="successOrderInfo?.outTradeNo || ''"
      @close="handleSuccessOverlayClose"
      @view-wallet="handleViewWallet"
    />
  </div>
</template>

<style scoped>
.package-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.package-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.v-card {
  transition: all 0.3s ease;
}

.text-decoration-line-through {
  text-decoration: line-through;
}
</style>
