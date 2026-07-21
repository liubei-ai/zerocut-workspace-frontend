<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { refundSubscriptionPeriod } from '@/api/memberAdminApi';
import {
  getExpiredCredits,
  getWalletInfo,
  getWalletRechargeRecords,
  getWorkspaceConsumptionRecords,
  refundWorkspaceRecharge,
  type CreditsConsumptionItem,
  type ExpiredCreditItem,
  type ExpiredCreditsResponse,
  type QueryCreditsConsumptionParams,
  type TransactionItem,
  type WalletInfo,
} from '@/api/walletApi';
import WalletOverview from '@/components/admin/WalletOverview.vue';
import ConsumptionDetailsCell from '@/components/common/ConsumptionDetailsCell.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import UsageRecordsTab from '@/components/zerocut/usage/UsageRecordsTab.vue';
import { Permission } from '@/constants/permissions';
import { useAdminWorkspaceStore } from '@/stores/adminWorkspaceStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useUserStore } from '@/stores/userStore';
import { formatDate } from '@/utils/date';

const route = useRoute();
const router = useRouter();
const workspaceId = computed(() => String(route.params.workspaceId));
const adminWorkspaceStore = useAdminWorkspaceStore();
const currentWorkspace = computed(() => adminWorkspaceStore.currentWorkspace);
const userStore = useUserStore();
const snackbar = useSnackbarStore();

const canRefundRecharge = computed(() => userStore.hasPermission(Permission.WALLET_GRANT));

const pageLoading = ref(false);

type TabValue = 'overview' | 'recharge' | 'consumption' | 'usage' | 'expired';

// 按权限动态渲染的 tab 列表
const visibleTabs = computed<{ value: TabValue; label: string }[]>(() => {
  const all: { value: TabValue; label: string; perm: string }[] = [
    { value: 'overview', label: '钱包概览', perm: Permission.WALLET_READ },
    { value: 'recharge', label: '充值记录', perm: Permission.WALLET_RECHARGE_RECORDS_READ },
    { value: 'consumption', label: '消费记录', perm: Permission.WALLET_READ },
    { value: 'usage', label: '使用日志', perm: Permission.WORKSPACE_READ },
    { value: 'expired', label: '过期积分', perm: Permission.WALLET_READ },
  ];
  return all
    .filter(t => userStore.hasPermission(t.perm))
    .map(({ value, label }) => ({ value, label }));
});

function getVisibleTab(value: unknown): TabValue | undefined {
  if (typeof value !== 'string') return undefined;
  return visibleTabs.value.some(item => item.value === value) ? (value as TabValue) : undefined;
}

const tab = ref<TabValue>(
  getVisibleTab(route.query.tab) ?? visibleTabs.value[0]?.value ?? 'overview'
);
const usageRecordsTab = ref<InstanceType<typeof UsageRecordsTab> | null>(null);

const walletInfo = ref<WalletInfo | undefined>(undefined);

const rechargeLoading = ref(false);
const rechargeItems = ref<TransactionItem[]>([]);
const rechargePagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const consumptionLoading = ref(false);
const consumptionItems = ref<CreditsConsumptionItem[]>([]);
const consumptionPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });
const consumptionFilters = ref<QueryCreditsConsumptionParams>({
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
    case 'subscription':
      return 'mdi-crown';
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
    case 'subscription':
      return '会员订阅';
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
    case 'subscription':
      return 'amber';
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

// 是否展示该行的「积分清零」按钮
function canRefundItem(item: TransactionItem): boolean {
  if (!canRefundRecharge.value) return false;
  if (item.status !== 'success') return false;
  const isSubscription = !!(item.subscriptionId && item.periodId);
  const isRecharge = !!item.rechargeRecordId;
  if (!isSubscription && !isRecharge) return false;
  // 积分过期后会自动清零，无需再手动清零（适用于充值、赠送、会员订阅等所有类型）
  if (calculateRemainingValidity(item)?.expired) return false;
  return true;
}

async function fetchWallet() {
  walletInfo.value = await getWalletInfo(workspaceId.value);
}

// 充值积分清零（退款）弹窗状态
const refundDialog = ref<{
  show: boolean;
  loading: boolean;
  target: TransactionItem | null;
  reason: string;
}>({ show: false, loading: false, target: null, reason: '' });

function openRefundDialog(item: TransactionItem) {
  refundDialog.value = {
    show: true,
    loading: false,
    target: item,
    reason: '',
  };
}

function closeRefundDialog() {
  if (refundDialog.value.loading) return;
  refundDialog.value.show = false;
}

async function confirmRefund() {
  const target = refundDialog.value.target;
  const reason = refundDialog.value.reason.trim();
  if (!reason) {
    snackbar.showErrorMessage('请填写退款原因');
    return;
  }
  refundDialog.value.loading = true;
  try {
    let refundedCredits: number;
    if (target?.rechargeRecordId) {
      // 普通充值：按充值记录退款
      ({ refundedCredits } = await refundWorkspaceRecharge(target.rechargeRecordId, reason));
    } else if (target?.subscriptionId && target?.periodId) {
      // 会员订阅发放：按订阅周期退款
      ({ refundedCredits } = await refundSubscriptionPeriod(
        target.subscriptionId,
        target.periodId,
        reason
      ));
    } else {
      snackbar.showErrorMessage('该记录无法定位清零目标');
      return;
    }
    snackbar.showSuccessMessage(`积分清零成功，扣减 ${refundedCredits} 积分`);
    refundDialog.value.show = false;
    await Promise.all([fetchWallet(), fetchRecharge()]);
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    const msg = err?.response?.data?.message || err?.message || '未知错误';
    snackbar.showErrorMessage(`积分清零失败：${msg}`);
  } finally {
    refundDialog.value.loading = false;
  }
}

async function fetchRecharge() {
  rechargeLoading.value = true;
  try {
    const res = await getWalletRechargeRecords({
      workspaceId: workspaceId.value,
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
      startDate: consumptionFilters.value.startDate || undefined,
      endDate: consumptionFilters.value.endDate || undefined,
    };
    const res = await getWorkspaceConsumptionRecords(workspaceId.value, params);
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
      workspaceId: workspaceId.value,
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

async function loadPage(includeUsage = false) {
  pageLoading.value = true;
  try {
    const requests: Promise<unknown>[] = [];
    if (userStore.hasPermission(Permission.WALLET_READ)) {
      requests.push(fetchWallet(), fetchConsumption(), fetchExpired());
    }
    if (userStore.hasPermission(Permission.WALLET_RECHARGE_RECORDS_READ)) {
      requests.push(fetchRecharge());
    }
    if (includeUsage && userStore.hasPermission(Permission.WORKSPACE_READ)) {
      const usageRefresh = usageRecordsTab.value?.refresh();
      if (usageRefresh) requests.push(usageRefresh);
    }
    await Promise.all(requests);
  } finally {
    pageLoading.value = false;
  }
}

function refreshAll() {
  return loadPage(true);
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
  consumptionFilters.value = { startDate: '', endDate: '' };
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
      loadPage();
    }
  }
);

watch(tab, value => {
  if (route.query.tab === value) return;
  router.replace({ query: { ...route.query, tab: value } });
});

watch(
  () => route.query.tab,
  value => {
    const requestedTab = getVisibleTab(value);
    if (requestedTab && requestedTab !== tab.value) tab.value = requestedTab;
  }
);

watch(visibleTabs, tabs => {
  if (tabs.some(item => item.value === tab.value)) return;
  tab.value = getVisibleTab(route.query.tab) ?? tabs[0]?.value ?? 'overview';
});

watch(
  () => expiredFilter.value.paymentMethod,
  () => {
    if (!userStore.hasPermission(Permission.WALLET_READ)) return;
    expiredPagination.value.page = 1;
    fetchExpired();
  }
);

onMounted(() => loadPage());
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
        <div class="text-medium-emphasis text-sm break-all sm:text-base">
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

    <v-card v-if="visibleTabs.length > 0" elevation="2" class="mb-4">
      <v-tabs v-model="tab" align-tabs="start">
        <v-tab v-for="t in visibleTabs" :key="t.value" :value="t.value">{{ t.label }}</v-tab>
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
                { title: '金额', key: 'amountYuan', sortable: false },
                { title: '积分', key: 'creditsAmount', sortable: true },
                { title: '剩余积分', key: 'remainingCredits', sortable: true },
                { title: '剩余有效期', key: 'validity', sortable: false },
                { title: '支付方式', key: 'paymentMethod', sortable: false },
                { title: '状态', key: 'status', sortable: false },
                { title: '订单号', key: 'orderNo', sortable: false },
                { title: '操作', key: 'actions', sortable: false, align: 'end' },
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
              <template #item.status="{ item }">
                <v-chip v-if="item.status === 'refunded'" color="error" size="small" variant="flat"
                  >已退款</v-chip
                >
                <v-chip
                  v-else-if="item.status === 'success' || !item.status"
                  color="success"
                  size="small"
                  variant="tonal"
                  >已成功</v-chip
                >
                <v-chip v-else color="grey" size="small" variant="tonal">{{ item.status }}</v-chip>
              </template>
              <template #item.orderNo="{ item }"
                ><code class="text-caption">{{ item.orderNo }}</code></template
              >
              <template #item.actions="{ item }">
                <v-btn
                  v-if="canRefundItem(item)"
                  color="error"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-cash-refund"
                  @click="openRefundDialog(item)"
                >
                  积分清零
                </v-btn>
                <span v-else class="text-medium-emphasis text-caption">-</span>
              </template>
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
                <v-col cols="12" md="6">
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
                    >
                      搜索</v-btn
                    >
                    <v-btn
                      variant="text"
                      prepend-icon="mdi-backspace"
                      @click="resetConsumptionFilters"
                    >
                      重置
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
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
                {
                  title: '消费积分',
                  key: 'creditsAmount',
                  sortable: false,
                  width: '120px',
                  align: 'end',
                },
                { title: '创建时间', key: 'createdAt', sortable: false, width: '160px' },
                { title: '元数据', key: 'serviceDetails', sortable: false },
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
              <template #item.serviceDetails="{ item }">
                <ConsumptionDetailsCell
                  :item="item"
                  mode="button"
                  :show-metadata="true"
                  reason-label="消耗原因"
                  outputs-label="生成物"
                  prompt-label="提示词"
                  view-all-label="查看全部"
                  expand-label="展开"
                  close-label="关闭"
                  action-label="查看元数据"
                  action-tooltip="查看提示词、生成物与元数据"
                  dialog-title="元数据"
                  metadata-label="元数据"
                  no-outputs-text="无"
                  no-prompt-text="无"
                  no-metadata-text="无"
                  empty-text="-"
                />
              </template>
              <template #item.creditsAmount="{ item }">
                <div class="text-right">
                  <span class="font-weight-medium">{{ item.creditsAmount }}</span>
                  <span class="text-caption ml-1">积分</span>
                </div>
              </template>
            </v-data-table-server>
          </v-card>
        </v-window-item>
        <v-window-item value="usage">
          <div class="pa-4">
            <UsageRecordsTab ref="usageRecordsTab" mode="records" :workspace-id="workspaceId" />
          </div>
        </v-window-item>
        <v-window-item value="expired">
          <v-card flat>
            <v-card-text>
              <div class="d-flex ga-2 mb-4 flex-wrap">
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

    <v-alert
      v-else
      type="info"
      variant="tonal"
      density="comfortable"
      title="无可查看的工作区信息"
      text="当前账号没有查看该工作空间数据的权限。"
    />

    <v-dialog v-model="refundDialog.show" max-width="520" :persistent="refundDialog.loading">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-cash-refund</v-icon>
          确认积分清零
        </v-card-title>
        <v-card-text>
          <v-alert
            type="warning"
            variant="tonal"
            density="comfortable"
            class="mb-4"
            text="将从账户余额扣减该笔充值的「剩余可用积分」，并把该充值记录标记为已退款。已消费部分不会追回，操作不可撤销。"
          />
          <div v-if="refundDialog.target" class="text-body-2 mb-3">
            <div>
              订单号：<code class="text-caption">{{ refundDialog.target.orderNo }}</code>
            </div>
            <div>原积分：{{ refundDialog.target.creditsAmount }}</div>
            <div>
              剩余可用积分：
              <span class="font-weight-medium text-error">
                {{ refundDialog.target.remainingCredits ?? '-' }}
              </span>
            </div>
          </div>
          <v-textarea
            v-model="refundDialog.reason"
            label="退款原因（必填）"
            variant="outlined"
            density="comfortable"
            rows="3"
            counter="500"
            maxlength="500"
            :disabled="refundDialog.loading"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="refundDialog.loading" @click="closeRefundDialog">
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="refundDialog.loading"
            :disabled="!refundDialog.reason.trim()"
            @click="confirmRefund"
          >
            确认清零
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
