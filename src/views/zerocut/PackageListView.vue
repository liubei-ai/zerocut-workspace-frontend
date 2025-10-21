<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getPackageList, type PackageInfo } from '~/src/api/packageApi';
import PackageCard from '~/src/components/zerocut/PackageCard.vue';
import PaymentDialog from '~/src/components/zerocut/PaymentDialog.vue';
import { useSnackbarStore } from '~/src/stores/snackbarStore';

// 状态管理
const snackbarStore = useSnackbarStore();

// 加载状态
const loading = ref(false);

// 数据状态
const packages = ref<PackageInfo[]>([]);

// 支付对话框状态
const paymentDialog = ref(false);
const selectedPackage = ref<PackageInfo | null>(null);

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
    snackbarStore.showErrorMessage('获取套餐列表失败，请稍后重试');
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
const handlePaymentSuccess = () => {
  showSuccess('支付成功！积分已到账');
  paymentDialog.value = false;
  selectedPackage.value = null;
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

// 组件挂载时获取数据
onMounted(() => {
  fetchPackages();
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">套餐中心</h1>
        <p class="text-subtitle-1 text-medium-emphasis">选择适合您的积分套餐，享受更多服务</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchPackages" :loading="loading">
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 套餐列表 -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="text-subtitle-1 mt-4">加载套餐信息中...</div>
    </div>

    <v-row v-else>
      <v-col v-for="pkg in packages" :key="pkg.id" cols="12" sm="6" md="4" lg="3">
        <PackageCard :package-info="pkg" @purchase="handlePurchase" />
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <div v-if="!loading && packages.length === 0" class="text-center py-12">
      <v-icon size="96" color="grey-lighten-2" class="mb-4">mdi-package-variant-closed</v-icon>
      <div class="text-h6 text-medium-emphasis mb-2">暂无可用套餐</div>
      <div class="text-body-2 text-medium-emphasis">请稍后再试或联系客服</div>
    </div>

    <!-- 支付对话框 -->
    <PaymentDialog
      v-model:open="paymentDialog"
      :package-info="selectedPackage"
      @success="handlePaymentSuccess"
      @cancel="handlePaymentCancel"
      @retry="handlePaymentRetry"
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
