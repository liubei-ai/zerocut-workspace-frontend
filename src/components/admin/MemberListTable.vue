<template>
  <!-- Search Filter Card -->
  <v-card elevation="2" class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-filter</v-icon>
      搜索过滤
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.ownerEmail"
            label="所有者邮箱"
            placeholder="搜索所有者邮箱"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-email"
            @input="debouncedSearch"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.ownerPhone"
            label="所有者手机号"
            placeholder="搜索手机号"
            variant="outlined"
            density="comfortable"
            clearable
            prepend-inner-icon="mdi-phone"
            @input="debouncedSearch"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            label="订阅状态"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-flag"
            @update:model-value="handleSearch"
          />
        </v-col>
        <v-col cols="12" md="3" class="flex gap-2">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="handleSearch">
            搜索
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="handleReset"
          >
            重置
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-card elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-account-multiple</v-icon>
      会员列表
      <v-spacer />
      <v-chip v-if="pagination.total > 0" color="primary" variant="outlined" size="small">
        共 {{ pagination.total }} 条记录
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="error" type="warning" variant="tonal" class="mb-2">
        {{ error }}
      </v-alert>

      <v-data-table-server
        :headers="headers"
        :items="items"
        :loading="loading"
        :page="pagination.page"
        :items-per-page="pagination.limit"
        :items-length="pagination.total"
        :items-per-page-options="[10, 20, 50, 100]"
        item-value="subscriptionId"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
      >
        <!-- Status Column -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" variant="elevated" size="small">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Purchase Mode Column -->
        <template #item.purchaseMode="{ item }">
          <v-chip :color="getPurchaseModeColor(item.purchaseMode)" variant="tonal" size="small">
            {{ getPurchaseModeLabel(item.purchaseMode) }}
          </v-chip>
        </template>

        <!-- Tier Column -->
        <template #item.tier="{ item }">
          <v-chip :color="getTierColor(item.tier)" variant="outlined" size="small">
            {{ getTierLabel(item.tier) }}
          </v-chip>
        </template>

        <!-- Auto Renew Column -->
        <template #item.autoRenew="{ item }">
          <v-icon :color="item.autoRenew ? 'success' : 'grey'" size="small">
            {{ item.autoRenew ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
        </template>

        <!-- Date Columns -->
        <template #item.currentPeriod="{ item }">
          <div>
            <p class="text-caption">{{ formatDateShort(item.currentPeriodStartAt) }}</p>
            <p class="text-caption">{{ formatDateShort(item.currentPeriodEndAt) }}</p>
          </div>
        </template>

        <template #item.contractTerm="{ item }">
          <div>
            <p class="text-caption">{{ formatDateShort(item.termStartAt) }}</p>
            <p class="text-caption">{{ formatDateShort(item.termEndAt) }}</p>
          </div>
        </template>

        <!-- Workspace Info Column -->
        <template #item.workspaceInfo="{ item }">
          <div class="workspace-info">
            <div class="text-body-2 font-weight-medium">{{ item.workspaceName }}</div>
            <code class="text-caption">{{ item.workspaceId }}</code>
          </div>
        </template>

        <!-- Plan Code Column -->
        <template #item.planCode="{ item }">
          <span class="text-body-2">{{ item.planCode }}</span>
        </template>

        <!-- Owner Info Column -->
        <template #item.ownerInfo="{ item }">
          <div class="owner-info">
            <div v-if="item.ownerName" class="text-body-2 font-weight-medium">
              {{ item.ownerName }}
            </div>
            <div v-if="item.ownerEmail" class="text-caption text-medium-emphasis">
              {{ item.ownerEmail }}
            </div>
            <div v-if="item.ownerPhone" class="text-caption text-medium-emphasis">
              {{ item.ownerPhone }}
            </div>
            <div
              v-if="!item.ownerName && !item.ownerEmail && !item.ownerPhone"
              class="text-caption text-disabled"
            >
              无所有者信息
            </div>
          </div>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            variant="text"
            size="small"
            @click="router.push(`/admin/members/${item.subscriptionId}`)"
          >
            查看详情
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import {
  getMemberList,
  type MemberListItem,
  type MembershipTier,
  type MemberSummary,
  type PurchaseMode,
  type SubscriptionStatus,
} from '@/api/memberAdminApi';
import { formatDateShort } from '@/utils/date';
import { useDebounceFn } from '@vueuse/core';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const items = ref<MemberListItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  status: 'active' as SubscriptionStatus | undefined,
  purchaseMode: undefined as PurchaseMode | undefined,
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
});

const statusOptions: Array<{ value: SubscriptionStatus | undefined; label: string }> = [
  { value: undefined, label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'signing', label: '签约中' },
  { value: 'active', label: '活跃' },
  { value: 'past_due', label: '逾期' },
  { value: 'canceled', label: '已取消' },
  { value: 'expired', label: '已过期' },
];

const headers = [
  { title: '工作空间', key: 'workspaceInfo', sortable: false, width: '200px' },
  { title: '所有者信息', key: 'ownerInfo', sortable: false, width: '200px' },
  { title: '等级', key: 'tier', sortable: false },
  { title: '购买模式', key: 'purchaseMode', sortable: false },
  { title: '状态', key: 'status', sortable: false },
  { title: '自动续费', key: 'autoRenew', sortable: false },
  { title: '当前周期', key: 'currentPeriod', sortable: false, width: '180px' },
  { title: '签约时间', key: 'contractTerm', sortable: false, width: '180px' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const },
];

const emit = defineEmits<{
  summaryUpdated: [summary: MemberSummary];
}>();

async function loadMembers() {
  loading.value = true;
  error.value = null;

  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    // Add filters only if they have values
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.purchaseMode) params.purchaseMode = filters.value.purchaseMode;
    if (filters.value.ownerName?.trim()) params.ownerName = filters.value.ownerName.trim();
    if (filters.value.ownerEmail?.trim()) params.ownerEmail = filters.value.ownerEmail.trim();
    if (filters.value.ownerPhone?.trim()) params.ownerPhone = filters.value.ownerPhone.trim();

    const response = await getMemberList(params);

    items.value = response.list;
    pagination.value = {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    };

    // Emit summary update to parent
    emit('summaryUpdated', response.summary);
  } catch (err: any) {
    console.error('Failed to load member list:', err);
    error.value = err.response?.data?.message || '加载会员列表失败';
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn(() => {
  pagination.value.page = 1;
  loadMembers();
}, 500);

function handleSearch() {
  pagination.value.page = 1;
  loadMembers();
}

function handleReset() {
  filters.value = {
    status: 'active',
    purchaseMode: undefined,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  };
  pagination.value.page = 1;
  loadMembers();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  loadMembers();
}

function handleItemsPerPageChange(itemsPerPage: number) {
  pagination.value.limit = itemsPerPage;
  pagination.value.page = 1;
  loadMembers();
}

function getStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'past_due':
      return 'warning';
    case 'canceled':
      return 'error';
    case 'expired':
      return 'grey';
    case 'signing':
      return 'info';
    case 'draft':
      return 'grey-lighten-1';
    default:
      return 'primary';
  }
}

function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    draft: '草稿',
    signing: '签约中',
    active: '活跃',
    past_due: '逾期',
    canceled: '已取消',
    expired: '已过期',
  };
  return labels[status] || status;
}

function getPurchaseModeColor(mode: PurchaseMode): string {
  switch (mode) {
    case 'auto_monthly':
      return 'success';
    case 'auto_yearly':
      return 'info';
    case 'one_time_month':
      return 'warning';
    default:
      return 'primary';
  }
}

function getPurchaseModeLabel(mode: PurchaseMode): string {
  const labels: Record<PurchaseMode, string> = {
    one_time_month: '一次性月度',
    one_time_year: '一次性年度',
    auto_monthly: '按月续费',
    auto_yearly: '按年续费',
  };
  return labels[mode] || mode;
}

function getTierColor(tier: MembershipTier): string {
  switch (tier) {
    case 'basic':
      return 'grey';
    case 'standard':
      return 'primary';
    case 'premium':
      return 'purple';
    default:
      return 'primary';
  }
}

function getTierLabel(tier: MembershipTier): string {
  const labels: Record<MembershipTier, string> = {
    basic: '基础版',
    standard: '标准版',
    premium: '高级版',
  };
  return labels[tier] || tier;
}

onMounted(() => {
  loadMembers();
});

defineExpose({
  loadMembers,
});
</script>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.owner-info {
  line-height: 1.4;
  min-width: 180px;
}

.owner-info > div {
  padding: 1px 0;
}

.workspace-info {
  line-height: 1.4;
  min-width: 180px;
}

.workspace-info > div {
  padding: 1px 0;
}
</style>
