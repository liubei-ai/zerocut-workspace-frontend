<script setup lang="ts">
import type { WalletInfo } from '@/api/walletApi';
import { getWalletInfo, getWalletRechargeRecords } from '@/api/walletApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const workspaceStore = useWorkspaceStore();

// 响应式数据
const walletInfo = ref<WalletInfo | null>(null);
const isNewUser = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

// 计算属性
const workspaceId = computed(() => workspaceStore.currentWorkspaceId || '');
const availableCredits = computed(() => walletInfo.value?.availableCredits || 0);

// 新人优惠信息
const newUserPromotion = {
  discount: '50%',
  price: '99',
  credits: '4000',
  originalPrice: '198',
};

// 获取钱包信息和新人资格
const fetchWalletData = async () => {
  if (!workspaceId.value) return;

  try {
    loading.value = true;
    error.value = null;

    // 并行获取钱包信息和充值记录
    const [wallet, recordsResponse] = await Promise.all([
      getWalletInfo(workspaceId.value),
      getWalletRechargeRecords({ workspaceId: workspaceId.value }),
    ]);

    walletInfo.value = wallet;
    // 方案A：通过充值记录判断新人资格（没有充值记录即为新人）
    isNewUser.value = recordsResponse.list.length === 0;
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

// 处理新人优惠点击
const handleNewUserPromotion = () => {
  router.push('/packages?highlight=newuser');
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
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <div class="mt-2 text-body-2">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-4">
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
            <span class="text-subtitle-1 font-weight-medium">可用积分</span>
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
          立即充值
        </v-btn>

        <!-- 新人优惠（条件显示） -->
        <v-card
          v-if="isNewUser"
          class="new-user-promotion"
          color="orange-lighten-5"
          variant="outlined"
          @click="handleNewUserPromotion"
          style="cursor: pointer"
        >
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-2">
              <v-icon color="orange" size="20" class="mr-1">mdi-fire</v-icon>
              <span class="promotion-title">新人专享</span>
            </div>
            <div class="promotion-price mb-2">
              <span class="original-price"> {{ newUserPromotion.originalPrice }} RMB </span>
              <span class="current-price"> {{ newUserPromotion.price }} RMB </span>
              <v-chip size="x-small" color="orange" variant="flat" class="ml-2">
                {{ newUserPromotion.discount }} OFF
              </v-chip>
            </div>
            <div class="promotion-credits">获得 {{ newUserPromotion.credits }} 积分</div>
          </v-card-text>
        </v-card>
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

/* 新人优惠卡片 */
.new-user-promotion {
  transition: all 0.2s ease;
}

.new-user-promotion:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
}

.promotion-title {
  font-size: 0.875rem;
  font-weight: bold;
  color: rgb(var(--v-theme-orange));
}

.promotion-price {
  font-size: 0.875rem;
}

.original-price {
  text-decoration: line-through;
  color: rgb(var(--v-theme-on-surface-variant));
}

.current-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: rgb(var(--v-theme-orange));
  margin-left: 0.5rem;
}

.promotion-credits {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* 小屏幕优化 */
@media (max-width: 600px) {
  .promotion-title {
    font-size: 0.8rem;
  }

  .current-price {
    font-size: 1.1rem;
  }

  .promotion-price,
  .promotion-credits {
    font-size: 0.8rem;
  }
}
</style>
