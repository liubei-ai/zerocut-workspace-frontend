<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type {
  CookieItem,
  CreateXiaoYanqueAccountParams,
  XiaoYanqueAccountListItem,
} from '@/api/xiaoyanqueApi';

import {
  createXiaoYanqueAccount,
  listXiaoYanqueAccounts,
  updateXiaoYanqueAccountCookies,
} from '@/api/xiaoyanqueApi';

const loading = ref(false);
const accounts = ref<XiaoYanqueAccountListItem[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);
const searchPhone = ref('');

const snackbar = ref({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error' | 'warning' | 'info',
});

// Create dialog
const createDialogOpen = ref(false);
const createPhone = ref('');
const createCookiesText = ref('');
const createLoading = ref(false);
const createError = ref('');

// Update dialog
const updateDialogOpen = ref(false);
const updatingAccount = ref<XiaoYanqueAccountListItem | null>(null);
const updateCookiesText = ref('');
const updateLoading = ref(false);
const updateError = ref('');

const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: '手机号', key: 'phone', sortable: false },
  { title: '状态', key: 'status', sortable: false, width: '120px' },
  { title: '最近到期时间', key: 'nearestExpiry', sortable: false, width: '180px' },
  { title: '创建时间', key: 'createdAt', sortable: false, width: '160px' },
  { title: '更新时间', key: 'updatedAt', sortable: false, width: '160px' },
  { title: '操作', key: 'actions', sortable: false, width: '100px', align: 'center' as const },
];

const statusColor = (status: string) => {
  if (status === 'normal') return 'success';
  if (status === 'expiring_soon') return 'warning';
  return 'error';
};

const statusLabel = (status: string) => {
  if (status === 'normal') return '正常';
  if (status === 'expiring_soon') return '即将过期';
  return '已过期';
};

const formatDate = (s: string) => new Date(s).toLocaleString('zh-CN');
const formatUnix = (ts: number | null) => {
  if (ts == null) return '-';
  return new Date(ts * 1000).toLocaleString('zh-CN');
};

const fetchList = async () => {
  loading.value = true;
  try {
    const result = await listXiaoYanqueAccounts({
      page: page.value,
      limit: limit.value,
      phone: searchPhone.value || undefined,
    });
    debugger;
    accounts.value = result?.list ?? [];
    total.value = result?.total ?? 0;
  } catch (e: any) {
    showSnackbar(e?.message || '获取列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

const parseCookies = (text: string): CookieItem[] | null => {
  try {
    const parsed = JSON.parse(text.trim());
    if (!Array.isArray(parsed)) return null;
    return parsed as CookieItem[];
  } catch {
    return null;
  }
};

const openCreate = () => {
  createPhone.value = '';
  createCookiesText.value = '';
  createError.value = '';
  createDialogOpen.value = true;
};

const submitCreate = async () => {
  createError.value = '';
  const cookies = parseCookies(createCookiesText.value);
  if (!cookies) {
    createError.value = 'Cookies 必须是合法的 JSON 数组';
    return;
  }
  if (!createPhone.value.trim()) {
    createError.value = '手机号不能为空';
    return;
  }
  createLoading.value = true;
  try {
    const params: CreateXiaoYanqueAccountParams = {
      phone: createPhone.value.trim(),
      cookies,
    };
    await createXiaoYanqueAccount(params);
    showSnackbar('创建成功', 'success');
    createDialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    createError.value = e?.message || '创建失败';
  } finally {
    createLoading.value = false;
  }
};

const openUpdate = (item: XiaoYanqueAccountListItem) => {
  updatingAccount.value = item;
  updateCookiesText.value = '';
  updateError.value = '';
  updateDialogOpen.value = true;
};

const submitUpdate = async () => {
  if (!updatingAccount.value) return;
  updateError.value = '';
  const cookies = parseCookies(updateCookiesText.value);
  if (!cookies) {
    updateError.value = 'Cookies 必须是合法的 JSON 数组';
    return;
  }
  updateLoading.value = true;
  try {
    await updateXiaoYanqueAccountCookies(updatingAccount.value.id, { cookies });
    showSnackbar('更新成功', 'success');
    updateDialogOpen.value = false;
    await fetchList();
  } catch (e: any) {
    updateError.value = e?.message || '更新失败';
  } finally {
    updateLoading.value = false;
  }
};

const showSnackbar = (
  message: string,
  color: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  snackbar.value = { show: true, message, color };
};

const totalPages = computed(() => Math.ceil(total.value / limit.value));

const onPageChange = (newPage: number) => {
  page.value = newPage;
  fetchList();
};

const onSearch = () => {
  page.value = 1;
  fetchList();
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div>
    <v-card class="mb-4" elevation="0">
      <v-card-title class="text-h5 font-weight-bold pt-6 pb-2">小云雀账号管理</v-card-title>
      <v-card-subtitle>管理小云雀账号的 Cookies，供工作流调用</v-card-subtitle>
    </v-card>

    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="searchPhone"
              label="手机号搜索"
              placeholder="输入手机号关键词"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="mdi-magnify"
              @keyup.enter="onSearch"
              @click:clear="onSearch"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" variant="outlined" @click="onSearch">搜索</v-btn>
          </v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
              新增账号
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              :loading="loading"
              @click="fetchList"
            >
              刷新
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-cookie</v-icon>
        账号列表
        <v-chip class="ml-2" size="small">共 {{ total }} 条</v-chip>
      </v-card-title>

      <v-data-table :headers="headers" :items="accounts" :loading="loading" hide-default-footer>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.nearestExpiry="{ item }">
          {{ formatUnix(item.nearestExpiry) }}
        </template>
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="small" variant="text" color="primary" @click="openUpdate(item)">
            更新 Cookies
          </v-btn>
        </template>
      </v-data-table>

      <v-card-actions v-if="totalPages > 1" class="justify-center py-4">
        <v-pagination
          v-model="page"
          :length="totalPages"
          rounded
          @update:model-value="onPageChange"
        />
      </v-card-actions>
    </v-card>

    <!-- Create Dialog -->
    <v-dialog v-model="createDialogOpen" max-width="640" persistent>
      <v-card>
        <v-card-title class="text-h6">新增小云雀账号</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="createPhone"
            label="手机号"
            placeholder="输入账号手机号"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="createCookiesText"
            label="Cookies (JSON 数组)"
            placeholder='粘贴 cookies JSON 数组，例如 [{"domain":".xyq.jianying.com",...}]'
            variant="outlined"
            rows="10"
            auto-grow
            :error-messages="createError ? [createError] : []"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="createDialogOpen = false">取消</v-btn>
          <v-btn color="primary" :loading="createLoading" @click="submitCreate">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Update Cookies Dialog -->
    <v-dialog v-model="updateDialogOpen" max-width="640" persistent>
      <v-card>
        <v-card-title class="text-h6"> 更新 Cookies —— {{ updatingAccount?.phone }} </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="updateCookiesText"
            label="新 Cookies (JSON 数组)"
            placeholder="粘贴新的 cookies JSON 数组（将完全覆盖现有 cookies）"
            variant="outlined"
            rows="10"
            auto-grow
            :error-messages="updateError ? [updateError] : []"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="updateDialogOpen = false">取消</v-btn>
          <v-btn color="primary" :loading="updateLoading" @click="submitUpdate">更新</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
