<script setup lang="ts">
import {
  getWalletInfo,
  getWalletRechargeRecords,
  TransactionItem,
  WalletInfo,
} from '@/api/walletApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import ExpiredCreditsDialog from '@/components/zerocut/ExpiredCreditsDialog.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Pagination } from '@/types/api';
import { formatDate } from '@/utils/date';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

// 获取当前工作空间ID
const workspaceStore = useWorkspaceStore();
const workspaceId = workspaceStore.currentWorkspaceId!;

// 路由实例
const router = useRouter();

// i18n
const { t } = useI18n();

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
    case 'bagelpay':
      return 'mdi-account-group';
    case 'subscription':
      return 'mdi-crown';
    default:
      return 'mdi-cash';
  }
};

// 获取支付方式文本
const getPaymentMethodText = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'alipay':
      return t('zerocut.wallet.payment.alipay');
    case 'wechat':
      return t('zerocut.wallet.payment.wechat');
    case 'bank_card':
      return t('zerocut.wallet.payment.bankCard');
    case 'credit_card':
      return t('zerocut.wallet.payment.creditCard');
    case 'manual':
      return t('zerocut.wallet.payment.manual');
    case 'bot':
      return t('zerocut.wallet.payment.bot');
    case 'give':
      return t('zerocut.wallet.payment.gift');
    case 'bagelpay':
      return t('zerocut.wallet.payment.bagelpay');
    case 'subscription':
      return t('zerocut.wallet.payment.subscription');
    default:
      return t('zerocut.wallet.payment.other');
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
    case 'subscription':
      return 'amber';
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
      text: t('zerocut.wallet.expired'),
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
    text: `${remainingDays}${t('zerocut.wallet.daysSuffix')}`,
    color,
  };
};

// 是否需要在“剩余有效期”列展示内容
// 规则：
// - 如果有有效期信息并且已过期，显示“已过期”（即使剩余积分为 0）
// - 如果未过期且剩余积分 > 0，显示剩余天数
// - 其它情况显示 “-”
const shouldShowValidity = (item: TransactionItem) => {
  const validity = calculateRemainingValidity(item);
  if (!validity) return false;
  if (validity.expired) return true;
  return (item.remainingCredits ?? 0) > 0;
};

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    loading.value = true;
    error.value = null;
    const wallet = await getWalletInfo(workspaceId);
    walletInfo.value = wallet;
  } catch (err) {
    error.value = t('zerocut.wallet.fetchInfoFailed');
    console.error(t('zerocut.wallet.fetchInfoFailed') + ':', err);
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
    error.value = t('zerocut.wallet.fetchTransactionsFailed');
    console.error(t('zerocut.wallet.fetchTransactionsFailed') + ':', err);
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

// 过期积分对话框开关
const expiredDialog = ref(false);

const openExpiredDialog = () => {
  expiredDialog.value = true;
};

const headerPrimaryActions = [
  {
    key: 'recharge',
    label: t('zerocut.wallet.recharge'),
    icon: 'mdi-cash-plus',
    color: 'success',
    variant: 'elevated' as const,
    onClick: handleRecharge,
  },
];

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: t('common.refresh'),
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    onClick: refreshData,
    loading: loading.value,
  },
]);
</script>

<template>
  <div>
    <ResponsivePageHeader
      :title="$t('menu.wallet')"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    >
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">{{ $t('zerocut.wallet.subtitle') }}</p>
      </template>
    </ResponsivePageHeader>

    <!-- 钱包概览 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-row>
          <!-- 剩余可用积分 -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="primary" class="mb-2"> mdi-wallet </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.availableCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('zerocut.wallet.availableCredits') }}
              </div>
            </v-card>
          </v-col>

          <!-- 用户充值金额 -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="success" class="mb-2"> mdi-account-cash </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                ¥{{ walletInfo?.userRechargeAmount || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('zerocut.wallet.userRechargeAmount') }}
              </div>
            </v-card>
          </v-col>

          <!-- 用户充值积分 -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="info" class="mb-2"> mdi-cash-plus </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.userRechargeCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('zerocut.wallet.userRechargeCredits') }}
              </div>
            </v-card>
          </v-col>

          <!-- 平台赠送积分 -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="orange" class="mb-2"> mdi-gift </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.platformGiftCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('zerocut.wallet.platformGiftCredits') }}
              </div>
            </v-card>
          </v-col>

          <!-- 累计消耗积分 -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="error" class="mb-2"> mdi-trending-down </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.totalCreditsConsumption || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('zerocut.wallet.totalCreditsConsumption') }}
              </div>
            </v-card>
          </v-col>

          <!-- 总过期积分（概览） -->
          <v-col cols="12" sm="6" md="3" lg="3" xl="3">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="error" class="mb-2"> mdi-alert </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                {{ walletInfo?.totalExpiredCredits || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                <v-btn variant="text" size="small" color="primary" @click="openExpiredDialog">
                  {{ $t('zerocut.wallet.viewExpiredCredits') }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 充值记录表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        {{ $t('zerocut.wallet.rechargeRecords') }}
      </v-card-title>

      <v-data-table-server
        :headers="[
          { title: $t('zerocut.wallet.columns.time'), key: 'createdAt', sortable: true },
          { title: $t('zerocut.wallet.columns.amount'), key: 'amount', sortable: true },
          { title: $t('zerocut.wallet.columns.credits'), key: 'creditsAmount', sortable: true },
          {
            title: $t('zerocut.wallet.columns.remainingCredits'),
            key: 'remainingCredits',
            sortable: true,
          },
          {
            title: $t('zerocut.wallet.columns.remainingValidity'),
            key: 'validity',
            sortable: false,
          },
          {
            title: $t('zerocut.wallet.columns.paymentMethod'),
            key: 'paymentMethod',
            sortable: false,
          },
          { title: $t('zerocut.wallet.columns.orderNo'), key: 'orderNo', sortable: false },
          {
            title: $t('zerocut.wallet.columns.thirdPartyOrderNo'),
            key: 'thirdPartyOrderNo',
            sortable: false,
          },
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
          <!-- 显示规则调整：当值为 0 时也显示为 "0"，仅在值为 null/undefined 时显示 "-" -->
          <span
            v-if="item.remainingCredits !== undefined && item.remainingCredits !== null"
            class="font-weight-medium text-primary"
          >
            {{ (item.remainingCredits ?? 0).toLocaleString() }}
          </span>
          <span v-else class="text-medium-emphasis">-</span>
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
          <div v-if="shouldShowValidity(item)">
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

  <!-- 已过期积分对话框：业务组件化 -->
  <ExpiredCreditsDialog v-model="expiredDialog" :workspace-id="workspaceId" />
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
