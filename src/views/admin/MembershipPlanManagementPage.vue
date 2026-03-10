<script setup lang="ts">
import type {
  CreateMembershipPlanParams,
  MembershipPlanItem,
  MembershipTier,
  PurchaseMode,
  UpdateMembershipPlanParams,
} from '@/api/adminApi';
import {
  createMembershipPlan,
  deleteMembershipPlan,
  getMembershipPlans as getAdminMembershipPlans,
  updateMembershipPlan,
} from '@/api/adminApi';
import MembershipPlanDialog from '@/components/admin/MembershipPlanDialog.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { computed, onMounted, ref } from 'vue';

const loading = ref(false);
const plans = ref<MembershipPlanItem[]>([]);

const dialogOpen = ref(false);
const editingPlan = ref<MembershipPlanItem | null>(null);

const deleteDialogOpen = ref(false);
const planToDelete = ref<MembershipPlanItem | null>(null);

const purchaseModeFilter = ref<PurchaseMode | ''>('');
const tierFilter = ref<MembershipTier | ''>('');
const isActiveFilter = ref<'active' | 'inactive' | 'all'>('active');

const snackbar = ref({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'warning' | 'info',
});

const purchaseModeOptions: Array<{ title: string; value: PurchaseMode | '' }> = [
  { title: '全部', value: '' },
  { title: '月一次性（one_time_month）', value: 'one_time_month' },
  { title: '月自动续费（auto_monthly）', value: 'auto_monthly' },
  { title: '年一次性（one_time_year）', value: 'one_time_year' },
  { title: '年自动续费（auto_yearly）', value: 'auto_yearly' },
];

const tierOptions: Array<{ title: string; value: MembershipTier | '' }> = [
  { title: '全部', value: '' },
  { title: '基础（basic）', value: 'basic' },
  { title: '标准（standard）', value: 'standard' },
  { title: '高级（premium）', value: 'premium' },
];

const isActiveOptions: Array<{ title: string; value: 'active' | 'inactive' | 'all' }> = [
  { title: '启用', value: 'active' },
  { title: '停用', value: 'inactive' },
  { title: '全部', value: 'all' },
];

const tierRank: Record<string, number> = {
  basic: 0,
  standard: 1,
  premium: 2,
};

const purchaseModeRank: Record<string, number> = {
  one_time_month: 0,
  auto_monthly: 1,
  one_time_year: 2,
  auto_yearly: 3,
};

const baseUnitPriceYuanPer100 = 5;

const headers = [
  { title: 'Code', key: 'code', width: '220px' },
  { title: '名称', key: 'name', width: '220px' },
  { title: 'Tier', key: 'tier', sortable: true, width: '140px' },
  { title: 'PurchaseMode', key: 'purchaseMode', sortable: true, width: '200px' },
  { title: '价格（元）', key: 'priceYuan', width: '120px' },
  { title: '周期积分', key: 'creditsPerPeriod', width: '120px' },
  { title: '100积分单价（元）', key: 'unitPriceYuanPer100', width: '160px' },
  { title: '折扣', key: 'discountText', width: '90px' },
  { title: '启用', key: 'isActive', width: '90px' },
  { title: '更新时间', key: 'updatedAt', width: '180px' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' as const, width: '180px' },
];

const customKeySort = {
  tier: (a: any, b: any) => (tierRank[a] ?? 999) - (tierRank[b] ?? 999),
  purchaseMode: (a: any, b: any) => (purchaseModeRank[a] ?? 999) - (purchaseModeRank[b] ?? 999),
};

const rows = computed(() => {
  return plans.value.map(p => {
    const priceYuan = p.priceCents / 100;
    const creditsPerPeriod = p.monthlyCredits * p.billingIntervalMonths;
    const unitPriceYuanPer100 = creditsPerPeriod > 0 ? (priceYuan * 100) / creditsPerPeriod : 0;
    const discount =
      baseUnitPriceYuanPer100 > 0 ? (unitPriceYuanPer100 / baseUnitPriceYuanPer100) * 10 : 0;

    return {
      ...p,
      priceYuan,
      creditsPerPeriod,
      unitPriceYuanPer100,
      discountText: `${discount.toFixed(1)}折`,
    };
  });
});

const showSnackbar = (
  message: string,
  color: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  snackbar.value = { show: true, message, color };
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: Record<string, string | boolean> = {};
    if (purchaseModeFilter.value) params.purchaseMode = purchaseModeFilter.value;
    if (tierFilter.value) params.tier = tierFilter.value;
    if (isActiveFilter.value !== 'all') params.isActive = isActiveFilter.value === 'active';
    const list = await getAdminMembershipPlans(params);
    plans.value = list;
  } catch (e: any) {
    showSnackbar(e?.message || '获取列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingPlan.value = null;
  dialogOpen.value = true;
};

const openEdit = (item: MembershipPlanItem) => {
  editingPlan.value = item;
  dialogOpen.value = true;
};

const handleSave = async (data: CreateMembershipPlanParams | UpdateMembershipPlanParams) => {
  try {
    if (editingPlan.value) {
      await updateMembershipPlan(editingPlan.value.id, data as UpdateMembershipPlanParams);
      showSnackbar('更新成功', 'success');
    } else {
      await createMembershipPlan(data as CreateMembershipPlanParams);
      showSnackbar('创建成功', 'success');
    }
    dialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    showSnackbar(e?.message || '保存失败', 'error');
  }
};

const openDelete = (item: MembershipPlanItem) => {
  planToDelete.value = item;
  deleteDialogOpen.value = true;
};

const confirmDelete = async () => {
  if (!planToDelete.value) return;
  try {
    await deleteMembershipPlan(planToDelete.value.id);
    showSnackbar('删除成功', 'success');
    deleteDialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    showSnackbar(e?.message || '删除失败', 'error');
  }
};

const formatDate = (s: string) => new Date(s).toLocaleString('zh-CN');

const headerPrimaryActions = computed(() => [
  {
    key: 'create',
    label: '新建会员商品',
    icon: 'mdi-plus',
    color: 'primary',
    variant: 'flat' as const,
    onClick: openCreate,
  },
]);

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    loading: loading.value,
    onClick: fetchList,
  },
]);

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div>
    <ResponsivePageHeader
      title="会员商品管理"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    />
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="purchaseModeFilter"
              :items="purchaseModeOptions"
              label="PurchaseMode 过滤"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchList"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="tierFilter"
              :items="tierOptions"
              label="Tier 过滤"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchList"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="isActiveFilter"
              :items="isActiveOptions"
              label="启用状态"
              variant="outlined"
              density="comfortable"
              @update:model-value="fetchList"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
        商品列表
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading"
        item-key="id"
        density="comfortable"
        :custom-key-sort="customKeySort"
      >
        <template #item.tier="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.tier }}
          </v-chip>
        </template>

        <template #item.purchaseMode="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.purchaseMode }}
          </v-chip>
        </template>

        <template #item.priceYuan="{ item }">
          {{ item.priceYuan.toFixed(2) }}
        </template>

        <template #item.creditsPerPeriod="{ item }">
          {{ item.creditsPerPeriod }}
        </template>

        <template #item.unitPriceYuanPer100="{ item }">
          {{ item.unitPriceYuanPer100.toFixed(2) }}
        </template>

        <template #item.isActive="{ item }">
          <v-chip :color="item.isActive ? 'success' : 'default'" size="small" variant="tonal">
            {{ item.isActive ? '启用' : '停用' }}
          </v-chip>
        </template>

        <template #item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openEdit(item)"> 编辑 </v-btn>
          <v-btn size="small" variant="text" color="error" @click="openDelete(item)"> 删除 </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <MembershipPlanDialog v-model="dialogOpen" :plan="editingPlan" @save="handleSave" />

    <v-dialog v-model="deleteDialogOpen" max-width="520">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          确认删除会员商品 <strong>{{ planToDelete?.name }}</strong
          >（{{ planToDelete?.code }}）？
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialogOpen = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
