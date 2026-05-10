<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { WalletInfo } from '@/api/walletApi';

import { getWalletInfo } from '@/api/walletApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const router = useRouter();
const workspaceStore = useWorkspaceStore();
const { t } = useI18n();

// 响应式数据
const walletInfo = ref<WalletInfo | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性
const workspaceId = computed(() => workspaceStore.currentWorkspaceId || '');
const availableCredits = computed(() => walletInfo.value?.availableCredits || 0);

// 获取钱包信息
const fetchWalletData = async () => {
  if (!workspaceId.value) return;

  try {
    loading.value = true;
    error.value = null;
    walletInfo.value = await getWalletInfo(workspaceId.value);
  } catch (err) {
    console.error('Failed to fetch wallet data:', err);
    error.value = '获取积分信息失败';
  } finally {
    loading.value = false;
  }
};

// 处理充值按钮点击
const handleRecharge = () => {
  router.push('/packages');
};

// 生命周期
onMounted(() => {
  fetchWalletData();
});
</script>

<template>
  <v-card class="credits-section" elevation="2">
    <v-card-text class="pa-4 pa-md-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="py-4 text-center">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <div class="text-body-2 mt-2">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="py-4 text-center">
        <v-icon color="error" size="32" class="mb-2">mdi-alert-circle</v-icon>
        <div class="text-body-2 text-error">{{ error }}</div>
        <v-btn size="small" variant="text" color="primary" @click="fetchWalletData" class="mt-2">
          重试
        </v-btn>
      </div>

      <!-- 正常状态 -->
      <div v-else>
        <!-- 积分余额显示 -->
        <div class="mb-4">
          <div class="d-flex align-center mb-2">
            <v-icon color="primary" class="mr-2" :size="$vuetify.display.xs ? 20 : 24"
              >mdi-wallet</v-icon
            >
            <span class="text-subtitle-1 font-weight-medium">{{
              t('zerocut.wallet.availableCredits')
            }}</span>
          </div>
          <div class="credits-amount">
            {{ availableCredits.toLocaleString() }}
            <span class="credits-unit">积分</span>
          </div>
        </div>

        <!-- 充值按钮 -->
        <v-btn
          color="primary"
          variant="flat"
          :size="$vuetify.display.xs ? 'default' : 'large'"
          block
          class="mb-3"
          @click="handleRecharge"
        >
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          {{ t('zerocut.wallet.recharge') }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.credits-section {
  height: 100%;
  transition: all 0.3s ease;
}

.credits-section:hover {
  transform: translateY(-2px);
}

/* 积分数量显示 */
.credits-amount {
  font-size: 2rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  line-height: 1.2;
}

.credits-unit {
  font-size: 1rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-left: 0.25rem;
}

/* 响应式字体大小 */
@media (max-width: 600px) {
  .credits-amount {
    font-size: 1.75rem;
  }

  .credits-unit {
    font-size: 0.875rem;
  }
}
</style>
