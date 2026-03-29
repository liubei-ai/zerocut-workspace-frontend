<script setup lang="ts">
import { width } from 'happy-dom/lib/PropertySymbol';
import { computed, onMounted, ref } from 'vue';

import type {
  CookieItem,
  CreateXiaoYanqueAccountParams,
  XiaoYanqueAccountListItem,
} from '@/api/xiaoyanqueApi';

import {
  createXiaoYanqueAccount,
  deleteXiaoYanqueAccount,
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

// Expand rows
const expandedRows = ref<number[]>([]);

// Create dialog
const createDialogOpen = ref(false);
const createForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
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

// Delete dialog
const deleteDialogOpen = ref(false);
const deletingAccount = ref<XiaoYanqueAccountListItem | null>(null);
const deleteLoading = ref(false);

const phoneRules = [
  (v: string) => !!v || '手机号不能为空',
  (v: string) => /^1[3-9]\d{9}$/.test(v) || '请输入有效的中国手机号（11位）',
];

const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: '手机号', key: 'phone', sortable: false, width: '150px' },
  { title: '状态', key: 'status', sortable: false, width: '120px' },
  { title: '最近到期时间', key: 'nearestExpiry', sortable: false, width: '180px' },
  { title: '创建时间', key: 'createdAt', sortable: false, width: '160px' },
  { title: '更新时间', key: 'updatedAt', sortable: false, width: '160px' },
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

const formatRelative = (ts: number | null): string => {
  if (ts == null) return '-';
  const diffSeconds = ts - Math.floor(Date.now() / 1000);
  if (diffSeconds <= 0) return '已过期';
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  if (diffSeconds < 3600) return rtf.format(Math.ceil(diffSeconds / 60), 'minute');
  if (diffSeconds < 86400) return rtf.format(Math.ceil(diffSeconds / 3600), 'hour');
  if (diffSeconds < 86400 * 30) return rtf.format(Math.ceil(diffSeconds / 86400), 'day');
  return new Date(ts * 1000).toLocaleDateString('zh-CN');
};

const fetchList = async () => {
  loading.value = true;
  try {
    const result = await listXiaoYanqueAccounts({
      page: page.value,
      limit: limit.value,
      phone: searchPhone.value || undefined,
    });
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
  const validation = await createForm.value?.validate();
  if (!validation?.valid) return;
  const cookies = parseCookies(createCookiesText.value);
  if (!cookies) {
    createError.value = 'Cookies 必须是合法的 JSON 数组';
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

const openDelete = (item: XiaoYanqueAccountListItem) => {
  deletingAccount.value = item;
  deleteDialogOpen.value = true;
};

const submitDelete = async () => {
  if (!deletingAccount.value) return;
  deleteLoading.value = true;
  try {
    await deleteXiaoYanqueAccount(deletingAccount.value.id);
    showSnackbar('删除成功', 'success');
    deleteDialogOpen.value = false;
    expandedRows.value = [];
    await fetchList();
  } catch (e: any) {
    showSnackbar(e?.message || '删除失败', 'error');
  } finally {
    deleteLoading.value = false;
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

      <v-data-table
        v-model:expanded="expandedRows"
        :headers="headers"
        :items="accounts"
        :loading="loading"
        item-value="id"
        show-expand
        single-expand
        hide-default-footer
      >
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.nearestExpiry="{ item }">
          <v-tooltip :text="item.nearestExpiry ? formatUnix(item.nearestExpiry) : '-'">
            <template #activator="{ props }">
              <span v-bind="props">{{ formatRelative(item.nearestExpiry) }}</span>
            </template>
          </v-tooltip>
        </template>
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0">
              <div class="pa-4">
                <v-table density="compact" class="mb-4">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Domain</th>
                      <th>到期时间</th>
                      <th>Session</th>
                      <th>Secure</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(cookie, i) in item.cookies" :key="i">
                      <td>{{ cookie.name }}</td>
                      <td>{{ cookie.domain }}</td>
                      <td>
                        <v-tooltip
                          v-if="cookie.expirationDate"
                          :text="formatUnix(cookie.expirationDate)"
                        >
                          <template #activator="{ props }">
                            <span v-bind="props">{{ formatRelative(cookie.expirationDate) }}</span>
                          </template>
                        </v-tooltip>
                        <span v-else>Session</span>
                      </td>
                      <td>
                        <v-icon :color="cookie.session ? 'success' : 'default'" size="small">
                          {{ cookie.session ? 'mdi-check' : 'mdi-minus' }}
                        </v-icon>
                      </td>
                      <td>
                        <v-icon :color="cookie.secure ? 'success' : 'default'" size="small">
                          {{ cookie.secure ? 'mdi-check' : 'mdi-minus' }}
                        </v-icon>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div class="d-flex ga-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-pencil"
                    @click="openUpdate(item)"
                  >
                    更新 Cookies
                  </v-btn>
                  <v-btn
                    size="small"
                    color="error"
                    variant="outlined"
                    prepend-icon="mdi-delete"
                    @click="openDelete(item)"
                  >
                    删除账号
                  </v-btn>
                </div>
              </div>
            </td>
          </tr>
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
          <v-form ref="createForm">
            <v-text-field
              v-model="createPhone"
              label="手机号"
              placeholder="输入账号手机号"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :rules="phoneRules"
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
          </v-form>
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

    <!-- Delete Confirm Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定删除账号 <strong>{{ deletingAccount?.phone }}</strong> 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialogOpen = false">取消</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
