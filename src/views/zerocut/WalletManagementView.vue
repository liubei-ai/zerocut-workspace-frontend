<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  getWalletInfo,
  getWalletRechargeRecords,
  TransactionItem,
  WalletInfo,
} from '~/src/api/walletApi';
import { useWorkspaceStore } from '~/src/stores/workspaceStore';
import { Pagination } from '~/src/types/api';
import { formatDate } from '~/src/utils/date';

// 获取当前工作空间ID
const workspaceStore = useWorkspaceStore();
const workspaceId = workspaceStore.currentWorkspaceId!;

// 路由实例
const router = useRouter();

// 加载状态
const loading = ref(false);
const transactionsLoading = ref(false);

// 错误状态
const error = ref<string | null>(null);

// 钱包信息
const walletInfo = ref<WalletInfo>();

// 充值记录
const transactions = ref<TransactionItem[]>([]);
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// 筛选选项
const filterOptions = ref({
  type: 'all',
  serviceType: 'all',
  dateRange: [null, null] as [Date | null, Date | null],
});

// 获取支付方式图标
const getPaymentMethodIcon = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'alipay':
      return 'mdi-alipay';
    case 'wechat':
      return 'mdi-wechat';
    case 'bank_card':
      return 'mdi-credit-card';
    case 'credit_card':
      return 'mdi-credit-card-outline';
    case 'manual':
      return 'mdi-account-cash';
    case 'bot':
      return 'mdi-robot';
    case 'give':
      return 'mdi-gift';
    default:
      return 'mdi-cash';
  }
};

// 获取支付方式文本
const getPaymentMethodText = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'alipay':
      return '支付宝';
    case 'wechat':
      return '微信支付';
    case 'bank_card':
      return '银行卡';
    case 'credit_card':
      return '信用卡';
    case 'manual':
      return '手动充值';
    case 'bot':
      return '机器人充值';
    case 'give':
      return '积分赠送';
    default:
      return '其他';
  }
};

// 获取支付方式颜色
const getPaymentMethodColor = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'alipay':
      return 'blue';
    case 'wechat':
      return 'green';
    case 'bank_card':
      return 'purple';
    case 'credit_card':
      return 'orange';
    case 'manual':
      return 'grey';
    case 'bot':
      return 'primary';
    default:
      return 'grey';
  }
};

// 计算剩余有效期
const calculateRemainingValidity = (item: TransactionItem) => {
  // 如果没有有效期信息，返回空
  if (!item.creditsValidityDays || !item.paidAt) {
    return null;
  }

  const paidDate = new Date(item.paidAt);
  const expiryDate = new Date(paidDate.getTime() + item.creditsValidityDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remainingMs = expiryDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (remainingDays <= 0) {
    return {
      expired: true,
      remainingDays: 0,
      text: '已过期',
      color: 'error',
    };
  }

  let color = 'success';
  if (remainingDays < 7) {
    color = 'error';
  } else if (remainingDays <= 30) {
    color = 'warning';
  }

  return {
    expired: false,
    remainingDays,
    text: `${remainingDays}天`,
    color,
  };
};

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    loading.value = true;
    error.value = null;
    const wallet = await getWalletInfo(workspaceId);
    walletInfo.value = wallet;
  } catch (err) {
    error.value = '获取钱包信息失败';
    console.error('获取钱包信息失败:', err);
  } finally {
    loading.value = false;
  }
};

// 获取充值记录
const fetchTransactions = async () => {
  try {
    transactionsLoading.value = true;
    const params = {
      workspaceId,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const response = await getWalletRechargeRecords(params);
    const { list, ...rest } = response;
    transactions.value = list;
    pagination.value = rest;
  } catch (err) {
    error.value = '获取充值记录失败';
    console.error('获取充值记录失败:', err);
  } finally {
    transactionsLoading.value = false;
  }
};

// 处理页码变化
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchTransactions();
};

// 处理每页条数变化
const handleItemsPerPageChange = (itemsPerPage: number) => {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1; // 重置到第一页
  fetchTransactions();
};

// 刷新数据
const refreshData = async () => {
  await Promise.all([fetchWalletInfo(), fetchTransactions()]);
};

// 监听筛选条件变化
watch(
  () => [filterOptions.value.type],
  () => {
    pagination.value.page = 1; // 重置到第一页
    fetchTransactions();
  },
  { deep: true }
);

// 组件挂载时获取数据
onMounted(() => {
  refreshData();
});

// 处理充值按钮点击
const handleRecharge = () => {
  router.push('/packages');
};
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">钱包管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">管理您的账户余额和充值明细</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          color="success"
          prepend-icon="mdi-cash-plus"
          @click="handleRecharge"
          variant="elevated"
        >
          充值
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="refreshData" :loading="loading">
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 钱包概览 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-row>
          <!-- 剩余可用积分 -->
          <v-col cols="12" sm="6" md="2.4">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="primary" class="mb-2"> mdi-wallet </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.availableCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">剩余可用积分</div>
            </v-card>
          </v-col>

          <!-- 用户充值金额 -->
          <v-col cols="12" sm="6" md="2.4">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="success" class="mb-2"> mdi-account-cash </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                ¥{{ walletInfo?.userRechargeAmount || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">用户累计充值金额</div>
            </v-card>
          </v-col>

          <!-- 用户充值积分 -->
          <v-col cols="12" sm="6" md="2.4">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="info" class="mb-2"> mdi-cash-plus </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.userRechargeCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">用户累计充值积分</div>
            </v-card>
          </v-col>

          <!-- 平台赠送积分 -->
          <v-col cols="12" sm="6" md="2.4">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="orange" class="mb-2"> mdi-gift </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.platformGiftCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">平台累计赠送积分</div>
            </v-card>
          </v-col>

          <!-- 累计消耗积分 -->
          <v-col cols="12" sm="6" md="2.4">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="error" class="mb-2"> mdi-trending-down </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.totalCreditsConsumption || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">累计消耗积分</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 充值记录表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        充值记录
      </v-card-title>

      <v-data-table-server
        :headers="[
          { title: '时间', key: 'createdAt', sortable: true },
          { title: '金额', key: 'amount', sortable: true },
          { title: '积分', key: 'creditsAmount', sortable: true },
          { title: '剩余积分', key: 'remainingCredits', sortable: true },
          { title: '剩余有效期', key: 'validity', sortable: false },
          { title: '支付方式', key: 'paymentMethod', sortable: false },
          { title: '订单号', key: 'orderNo', sortable: false },
          { title: '第三方订单号', key: 'thirdPartyOrderNo', sortable: false },
        ]"
        :items="transactions"
        item-value="id"
        class="elevation-0"
        :loading="transactionsLoading"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :page="pagination.page"
        @update:items-per-page="handleItemsPerPageChange"
        @update:page="handlePageChange"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.amount="{ item }">
          <span class="text-success font-weight-medium"> ¥{{ Math.abs(item.amount) }} </span>
        </template>

        <template #item.remainingCredits="{ item }">
          <span
            :class="[
              'font-weight-medium',
              (item.remainingCredits || 0) > 0 ? 'text-primary' : 'text-medium-emphasis',
            ]"
          >
            {{ (item.remainingCredits || 0).toLocaleString() }}
          </span>
        </template>

        <template #item.paymentMethod="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :icon="getPaymentMethodIcon(item.paymentMethod)"
              :color="getPaymentMethodColor(item.paymentMethod)"
              size="20"
              class="mr-2"
            ></v-icon>
            {{ getPaymentMethodText(item.paymentMethod) }}
          </div>
        </template>

        <template #item.validity="{ item }">
          <div v-if="(item.remainingCredits || 0) > 0 && calculateRemainingValidity(item)">
            <v-chip :color="calculateRemainingValidity(item)!.color" size="small" variant="flat">
              {{ calculateRemainingValidity(item)!.text }}
            </v-chip>
          </div>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template #item.id="{ item }">
          <code class="text-caption">{{ item.id }}</code>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>
