<script setup lang="ts">
import {
  getExpiredCredits,
  getWalletInfo,
  getWalletRechargeRecords,
  getWorkspaceConsumptionRecords,
  type CreditsConsumptionItem,
  type ExpiredCreditItem,
  type ExpiredCreditsResponse,
  type QueryCreditsConsumptionParams,
  type TransactionItem,
  type WalletInfo,
} from '@/api/walletApi';
import WalletOverview from '@/components/admin/WalletOverview.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useAdminWorkspaceStore } from '@/stores/adminWorkspaceStore';
import { formatDate } from '@/utils/date';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const workspaceId = route.params.workspaceId as string;
const adminWorkspaceStore = useAdminWorkspaceStore();
const currentWorkspace = computed(() => adminWorkspaceStore.currentWorkspace);

const pageLoading = ref(false);
const tab = ref<'overview' | 'recharge' | 'consumption' | 'expired'>('overview');

const walletInfo = ref<WalletInfo | undefined>(undefined);

const rechargeLoading = ref(false);
const rechargeItems = ref<TransactionItem[]>([]);
const rechargePagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const consumptionLoading = ref(false);
const consumptionItems = ref<CreditsConsumptionItem[]>([]);
const consumptionPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const consumptionFilters = ref<QueryCreditsConsumptionParams>({
  serviceType: '',
  startDate: '',
  endDate: '',
});

const expiredLoading = ref(false);
const expiredItems = ref<ExpiredCreditItem[]>([]);
const expiredSummary = ref<{
  totalExpiredCredits: number;
  byPaymentMethod: Record<string, number>;
}>({ totalExpiredCredits: 0, byPaymentMethod: {} });
const expiredPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const expiredFilter = ref<{ paymentMethod: string | null }>({ paymentMethod: null });

function getPaymentMethodIcon(paymentMethod: string) {
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
}

function getPaymentMethodText(paymentMethod: string) {
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
    case 'bagelpay':
      return 'BagelPay';
    default:
      return '其他';
  }
}

function getPaymentMethodColor(paymentMethod: string) {
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
}

function calculateRemainingValidity(item: TransactionItem) {
  if (!item.creditsValidityDays || !item.paidAt) return null;
  const paidDate = new Date(item.paidAt);
  const expiryDate = new Date(paidDate.getTime() + item.creditsValidityDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remainingMs = expiryDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  if (remainingDays <= 0)
    return { expired: true, remainingDays: 0, text: '已过期', color: 'error' };
  let color = 'success';
  if (remainingDays < 7) color = 'error';
  else if (remainingDays <= 30) color = 'warning';
  return { expired: false, remainingDays, text: `${remainingDays}天`, color };
}

function shouldShowValidity(item: TransactionItem) {
  const v = calculateRemainingValidity(item);
  if (!v) return false;
  if (v.expired) return true;
  return (item.remainingCredits ?? 0) > 0;
}

async function fetchWallet() {
  walletInfo.value = await getWalletInfo(workspaceId);
}

async function fetchRecharge() {
  rechargeLoading.value = true;
  try {
    const res = await getWalletRechargeRecords({
      workspaceId,
      page: rechargePagination.value.page,
      limit: rechargePagination.value.limit,
    });
    rechargeItems.value = res.list;
    rechargePagination.value = {
      page: res.page,
      limit: res.limit,
      total: res.total,
      totalPages: res.totalPages,
    };
  } finally {
    rechargeLoading.value = false;
  }
}

async function fetchConsumption() {
  consumptionLoading.value = true;
  try {
    const params: QueryCreditsConsumptionParams = {
      page: consumptionPagination.value.page,
      limit: consumptionPagination.value.limit,
      serviceType: consumptionFilters.value.serviceType || undefined,
      startDate: consumptionFilters.value.startDate || undefined,
      endDate: consumptionFilters.value.endDate || undefined,
    };
    const res = await getWorkspaceConsumptionRecords(workspaceId, params);
    consumptionItems.value = res.list;
    consumptionPagination.value = {
      page: res.page,
      limit: res.limit,
      total: res.total,
      totalPages: res.totalPages,
    };
  } finally {
    consumptionLoading.value = false;
  }
}

async function fetchExpired() {
  expiredLoading.value = true;
  try {
    const res: ExpiredCreditsResponse = await getExpiredCredits({
      workspaceId,
      page: expiredPagination.value.page,
      limit: expiredPagination.value.limit,
      paymentMethod: expiredFilter.value.paymentMethod || undefined,
    });
    expiredItems.value = res.list;
    expiredSummary.value = res.summary;
    expiredPagination.value = res.pagination;
  } finally {
    expiredLoading.value = false;
  }
}

async function refreshAll() {
  pageLoading.value = true;
  try {
    await Promise.all([fetchWallet(), fetchRecharge(), fetchConsumption(), fetchExpired()]);
  } finally {
    pageLoading.value = false;
  }
}

function handleRechargePageChange(page: number) {
  rechargePagination.value.page = page;
  fetchRecharge();
}

function handleRechargeItemsPerPageChange(limit: number) {
  rechargePagination.value.limit = limit;
  rechargePagination.value.page = 1;
  fetchRecharge();
}

function handleConsumptionPageChange(page: number) {
  consumptionPagination.value.page = page;
  fetchConsumption();
}

function handleConsumptionItemsPerPageChange(limit: number) {
  consumptionPagination.value.limit = limit;
  consumptionPagination.value.page = 1;
  fetchConsumption();
}

function resetConsumptionFilters() {
  consumptionFilters.value = { serviceType: '', startDate: '', endDate: '' };
  consumptionPagination.value.page = 1;
  fetchConsumption();
}

function handleExpiredPageChange(page: number) {
  expiredPagination.value.page = page;
  fetchExpired();
}

function handleExpiredItemsPerPageChange(limit: number) {
  expiredPagination.value.limit = limit;
  expiredPagination.value.page = 1;
  fetchExpired();
}

watch(
  () => route.params.workspaceId,
  newId => {
    if (typeof newId === 'string') {
      rechargePagination.value.page = 1;
      consumptionPagination.value.page = 1;
      expiredPagination.value.page = 1;
      refreshAll();
    }
  }
);

watch(
  () => expiredFilter.value.paymentMethod,
  () => {
    expiredPagination.value.page = 1;
    fetchExpired();
  }
);

onMounted(refreshAll);
</script>

<template>
  <div>
    <ResponsivePageHeader
      title="工作区详情"
      :show-back="true"
      :secondary-actions="[
        {
          key: 'refresh',
          label: '刷新',
          icon: 'mdi-refresh',
          variant: 'outlined',
          loading: pageLoading,
          onClick: refreshAll,
        },
      ]"
    >
      <template #description>
        <div class="text-medium-emphasis text-sm sm:text-base break-all">
          {{ currentWorkspace?.name }} (ID: {{ workspaceId }})
        </div>
        <div class="mt-2">
          <v-alert
            v-if="!currentWorkspace"
            type="warning"
            variant="tonal"
            density="comfortable"
            title="未获取到工作空间信息"
            text="请从工作空间列表页进入本页面以便展示名称与所有者信息。"
          />
          <div v-else class="d-flex flex-column gap-1">
            <div class="text-medium-emphasis text-sm sm:text-base">
              所有者：
              <span class="font-weight-medium">{{ currentWorkspace.ownerName || '未知' }}</span>
              <span class="ml-2">{{ currentWorkspace.ownerEmail || '邮箱未知' }}</span>
              <span v-if="currentWorkspace.ownerPhone" class="ml-2">{{
                currentWorkspace.ownerPhone
              }}</span>
            </div>
          </div>
        </div>
      </template>
    </ResponsivePageHeader>

    <v-card elevation="2" class="mb-4">
      <v-tabs v-model="tab" align-tabs="start">
        <v-tab value="overview">钱包概览</v-tab>
        <v-tab value="recharge">充值记录</v-tab>
        <v-tab value="consumption">消费记录</v-tab>
        <v-tab value="expired">过期积分</v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-window v-model="tab">
        <v-window-item value="overview">
          <WalletOverview :wallet-info="walletInfo" @view-expired="tab = 'expired'" />
        </v-window-item>
        <v-window-item value="recharge">
          <v-card flat>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
              充值记录列表
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
              ]"
              :items="rechargeItems"
              :loading="rechargeLoading"
              :items-per-page="rechargePagination.limit"
              :page="rechargePagination.page"
              :items-length="rechargePagination.total"
              :server-items-length="rechargePagination.total"
              @update:page="handleRechargePageChange"
              @update:items-per-page="handleRechargeItemsPerPageChange"
              class="elevation-0"
            >
              <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
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
                  <v-chip
                    :color="calculateRemainingValidity(item)!.color"
                    size="small"
                    variant="flat"
                  >
                    {{ calculateRemainingValidity(item)!.text }}
                  </v-chip>
                </div>
                <span v-else class="text-medium-emphasis">-</span>
              </template>
              <template #item.orderNo="{ item }"
                ><code class="text-caption">{{ item.orderNo }}</code></template
              >
            </v-data-table-server>
          </v-card>
        </v-window-item>
        <v-window-item value="consumption">
          <v-card flat class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-filter</v-icon>
              筛选条件
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="consumptionFilters.serviceType"
                    :items="[
                      { title: '全部', value: '' },
                      { title: 'LLM调用', value: 'LLM调用' },
                      { title: 'other', value: 'other' },
                    ]"
                    label="服务类型"
                    variant="outlined"
                    density="comfortable"
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="consumptionFilters.startDate"
                    label="开始日期"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="consumptionFilters.endDate"
                    label="结束日期"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    clearable
                  />
                </v-col>
              </v-row>
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-magnify"
                  @click="
                    () => {
                      consumptionPagination.page = 1;
                      fetchConsumption();
                    }
                  "
                  >搜索</v-btn
                >
                <v-btn variant="text" prepend-icon="mdi-backspace" @click="resetConsumptionFilters"
                  >重置</v-btn
                >
              </div>
            </v-card-text>
          </v-card>
          <v-card flat>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-file-document</v-icon>
              消费记录列表
            </v-card-title>
            <v-data-table-server
              :headers="[
                { title: '交易ID', key: 'transactionId', sortable: false, width: '220px' },
                { title: '服务类型', key: 'serviceType', sortable: false, width: '120px' },
                {
                  title: '消费积分',
                  key: 'creditsAmount',
                  sortable: false,
                  width: '120px',
                  align: 'end',
                },
                { title: '创建时间', key: 'createdAt', sortable: false, width: '160px' },
                { title: '服务详情', key: 'serviceDetails', sortable: false },
              ]"
              :items="consumptionItems"
              :loading="consumptionLoading"
              :items-per-page="consumptionPagination.limit"
              :page="consumptionPagination.page"
              :items-length="consumptionPagination.total"
              :server-items-length="consumptionPagination.total"
              @update:page="handleConsumptionPageChange"
              @update:items-per-page="handleConsumptionItemsPerPageChange"
              class="elevation-0"
            >
              <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
              <template #item.serviceDetails="{ item }">{{ item.serviceDetails }}</template>
              <template #item.creditsAmount="{ item }">
                <div class="text-right">
                  <span class="font-weight-medium">{{ item.creditsAmount }}</span>
                  <span class="text-caption ml-1">积分</span>
                </div>
              </template>
            </v-data-table-server>
          </v-card>
        </v-window-item>
        <v-window-item value="expired">
          <v-card flat>
            <v-card-text>
              <div class="d-flex flex-wrap ga-2 mb-4">
                <v-chip color="green" variant="flat" size="small"
                  >微信：{{ expiredSummary.byPaymentMethod?.wechat || 0 }}</v-chip
                >
                <v-chip color="blue" variant="flat" size="small"
                  >支付宝：{{ expiredSummary.byPaymentMethod?.alipay || 0 }}</v-chip
                >
                <v-chip color="grey" variant="flat" size="small"
                  >手动：{{ expiredSummary.byPaymentMethod?.manual || 0 }}</v-chip
                >
                <v-chip color="orange" variant="flat" size="small"
                  >赠送：{{ expiredSummary.byPaymentMethod?.give || 0 }}</v-chip
                >
                <v-select
                  label="充值类型过滤"
                  :items="[
                    { title: '全部', value: null },
                    { title: '微信支付', value: 'wechat' },
                    { title: '支付宝', value: 'alipay' },
                    { title: '手动充值', value: 'manual' },
                    { title: '积分赠送', value: 'give' },
                    { title: '机器人充值', value: 'bot' },
                  ]"
                  v-model="expiredFilter.paymentMethod"
                  density="compact"
                  style="max-width: 260px"
                ></v-select>
              </div>
              <v-data-table-server
                :headers="[
                  { title: '过期时间', key: 'expiredAt', sortable: true },
                  { title: '过期积分', key: 'expiredCredits', sortable: true },
                  { title: '支付方式', key: 'paymentMethod', sortable: false },
                  { title: '订单号', key: 'orderNo', sortable: false },
                ]"
                :items="expiredItems"
                item-value="id"
                class="elevation-0"
                :loading="expiredLoading"
                :items-per-page="expiredPagination.limit"
                :items-length="expiredPagination.total"
                :page="expiredPagination.page"
                @update:items-per-page="handleExpiredItemsPerPageChange"
                @update:page="handleExpiredPageChange"
              >
                <template #item.expiredAt="{ item }">{{ formatDate(item.expiredAt) }}</template>
                <template #item.expiredCredits="{ item }">
                  <span
                    v-if="(item.expiredCredits || 0) > 0"
                    class="font-weight-medium text-error"
                    >{{ (item.expiredCredits || 0).toLocaleString() }}</span
                  >
                  <span v-else class="text-medium-emphasis">-</span>
                </template>
                <template #item.paymentMethod="{ item }">
                  <div class="d-flex align-center">
                    <v-icon
                      :icon="getPaymentMethodIcon(item.recharge.paymentMethod)"
                      :color="getPaymentMethodColor(item.recharge.paymentMethod)"
                      size="20"
                      class="mr-2"
                    ></v-icon>
                    {{ getPaymentMethodText(item.recharge.paymentMethod) }}
                  </div>
                </template>
                <template #item.orderNo="{ item }"
                  ><code class="text-caption">{{ item.recharge.orderNo }}</code></template
                >
              </v-data-table-server>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
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
.v-data-table {
  border-radius: 8px;
}
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>
