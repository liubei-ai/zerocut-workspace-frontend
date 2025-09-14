<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  getWalletInfo,
  getWalletTransactions,
  TransactionItem,
  WalletInfo,
} from '~/src/api/walletApi';
import { useWorkspaceStore } from '~/src/stores/workspaceStore';
import { Pagination } from '~/src/types/api';

// 获取当前工作空间ID
const workspaceStore = useWorkspaceStore();
const workspaceId = workspaceStore.currentWorkspaceId!;

// 加载状态
const loading = ref(false);
const transactionsLoading = ref(false);

// 错误状态
const error = ref<string | null>(null);

// 钱包信息
const walletInfo = ref<WalletInfo>();

// 交易记录
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

const transactionTypes = [
  { value: 'all', title: '全部类型' },
  { value: 'transaction', title: '消耗' },
  { value: 'recharge', title: '充值' },
];

const serviceTypes = [
  { value: 'all', title: '全部服务' },
  { value: 'video_generation', title: '视频生成' },
  { value: 'image_generation', title: '图片生成' },
  { value: 'audio_generation', title: '音频生成' },
];

// 筛选后的交易记录
const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    // 类型筛选
    if (filterOptions.value.type !== 'all' && transaction.type !== filterOptions.value.type) {
      return false;
    }

    // 服务类型筛选
    if (
      filterOptions.value.serviceType !== 'all' &&
      transaction.serviceType !== filterOptions.value.serviceType
    ) {
      return false;
    }

    // 日期筛选
    if (filterOptions.value.dateRange[0] && filterOptions.value.dateRange[1]) {
      const transactionDate = new Date(transaction.createdAt);
      if (
        transactionDate < filterOptions.value.dateRange[0] ||
        transactionDate > filterOptions.value.dateRange[1]
      ) {
        return false;
      }
    }

    return true;
  });
});

// 统计数据
const transactionStats = computed(() => {
  const filtered = filteredTransactions.value;
  return {
    totalTransactions: filtered.length,
    totaltransaction: Math.abs(
      filtered.filter(t => t.type === 'transaction').reduce((sum, t) => sum + Number(t.amount), 0)
    ),
    totalRecharge: filtered
      .filter(t => t.type === 'recharge')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  };
});

// 获取交易类型图标
const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'transaction':
      return 'mdi-minus-circle';
    case 'recharge':
      return 'mdi-undo';
    default:
      return 'mdi-swap-horizontal';
  }
};

// 获取交易类型颜色
const getTransactionColor = (type: string) => {
  switch (type) {
    case 'recharge':
      return 'success';
    case 'transaction':
      return 'error';
    default:
      return 'info';
  }
};

// 获取交易类型文本
const getTransactionTypeText = (type: string) => {
  switch (type) {
    case 'transaction':
      return '消耗';
    case 'recharge':
      return '充值';
    default:
      return '其他';
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
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

// 获取交易记录
const fetchTransactions = async () => {
  try {
    transactionsLoading.value = true;
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      type: filterOptions.value.type === 'all' ? undefined : filterOptions.value.type,
      serviceType:
        filterOptions.value.serviceType === 'all' ? undefined : filterOptions.value.serviceType,
    };
    const response = await getWalletTransactions(workspaceId, params);
    const { list, ...rest } = response;
    transactions.value = list;
    pagination.value = rest;
  } catch (err) {
    error.value = '获取交易记录失败';
    console.error('获取交易记录失败:', err);
  } finally {
    transactionsLoading.value = false;
  }
};

// 刷新数据
const refreshData = async () => {
  await Promise.all([fetchWalletInfo(), fetchTransactions()]);
};

// 组件挂载时获取数据
onMounted(() => {
  refreshData();
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">钱包管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">管理您的账户余额和消耗明细</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="refreshData" :loading="loading">
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 钱包概览 -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="pa-6" elevation="2">
          <div class="d-flex align-center mb-4">
            <v-icon size="48" color="primary" class="mr-4"> mdi-wallet </v-icon>
            <div>
              <div class="text-h4 font-weight-bold">¥{{ walletInfo?.creditsBalance }}</div>
              <div class="text-subtitle-1 text-medium-emphasis">可用积分</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="6">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="success" class="mb-2"> mdi-trending-up </v-icon>
              <div class="text-h6 font-weight-bold mb-1">{{ walletInfo?.totalCreditsAdded }}</div>
              <div class="text-caption text-medium-emphasis">累计充值积分</div>
            </v-card>
          </v-col>

          <v-col cols="6">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="error" class="mb-2"> mdi-trending-down </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                ¥{{ walletInfo?.totalCreditsConsumption }}
              </div>
              <div class="text-caption text-medium-emphasis">累计消耗</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        筛选条件
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filterOptions.type"
              :items="transactionTypes"
              item-title="title"
              item-value="value"
              label="交易类型"
              prepend-inner-icon="mdi-swap-horizontal"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="filterOptions.serviceType"
              :items="serviceTypes"
              item-title="title"
              item-value="value"
              label="服务类型"
              prepend-inner-icon="mdi-check-circle"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              label="日期范围"
              prepend-inner-icon="mdi-calendar"
              readonly
              value="2024-01-01 至 2024-01-31"
              hint="点击选择日期范围"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="primary" class="mb-2"> mdi-format-list-numbered </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ transactionStats.totalTransactions }}
          </div>
          <div class="text-caption text-medium-emphasis">总交易数</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="error" class="mb-2"> mdi-minus-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">¥{{ transactionStats.totaltransaction }}</div>
          <div class="text-caption text-medium-emphasis">消耗积分</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="success" class="mb-2"> mdi-plus-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">¥{{ transactionStats.totalRecharge }}</div>
          <div class="text-caption text-medium-emphasis">充值积分</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 交易记录表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        交易记录
      </v-card-title>

      <v-data-table
        :headers="[
          { title: '时间', key: 'createdAt', sortable: true },
          { title: '交易类型', key: 'transactionType', sortable: true },
          // { title: '服务类型', key: 'serviceType', sortable: true },
          { title: '描述', key: 'description', sortable: false },
          { title: '金额', key: 'amount', sortable: true },
          { title: '订单号', key: 'orderNo', sortable: false },
        ]"
        :items="filteredTransactions"
        item-value="id"
        class="elevation-0"
        :items-per-page="pagination.limit"
        :loading="loading"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.transactionType="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :icon="getTransactionIcon(item.type)"
              :color="getTransactionColor(item.type)"
              size="20"
              class="mr-2"
            ></v-icon>
            {{ getTransactionTypeText(item.type) }}
          </div>
        </template>

        <!-- <template #item.serviceType="{ item }">
          {{ getServiceTypeText(item.serviceType) }}
        </template> -->

        <template #item.amount="{ item }">
          <span
            :class="{
              'text-success': item.type === 'recharge',
              'text-error': item.type === 'transaction',
            }"
            class="font-weight-medium"
          >
            {{ item.type === 'recharge' ? '+' : '-' }}¥{{ Math.abs(item.amount) }}
          </span>
        </template>

        <template #item.id="{ item }">
          <code class="text-caption">{{ item.id }}</code>
        </template>
      </v-data-table>
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
