<template>
  <v-container fluid>
    <ResponsivePageHeader
      :title="detail?.channel.name ?? '渠道详情'"
      :subtitle="detail?.channel.note ?? ''"
      show-back
    />

    <v-card v-if="detail" class="mb-4">
      <v-card-text class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div class="text-grey text-sm">平台</div>
          <div class="text-base font-semibold">{{ platformLabel(detail.channel.platform) }}</div>
        </div>
        <div>
          <div class="text-grey text-sm">联系人</div>
          <div class="text-base">{{ detail.channel.contact || '—' }}</div>
        </div>
        <div>
          <div class="text-grey text-sm">归因窗口期</div>
          <div class="text-base">{{ detail.channel.attributionWindowDays }} 天</div>
        </div>
        <div>
          <div class="text-grey text-sm">创建时间</div>
          <div class="text-base">{{ formatDate(detail.channel.createdAt) }}</div>
        </div>
      </v-card-text>
    </v-card>

    <v-tabs v-model="activeTab" color="primary" class="mb-2">
      <v-tab value="codes">邀请码（{{ detail?.inviteCodes.length ?? 0 }}）</v-tab>
      <v-tab value="users">用户明细（{{ usersTotal }}）</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- 邀请码 Tab -->
      <v-window-item value="codes">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>邀请码列表</span>
            <v-spacer />
            <v-btn
              v-if="canWrite"
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              @click="codeDialogOpen = true"
            >
              生成邀请码
            </v-btn>
          </v-card-title>
          <v-data-table
            :headers="codeHeaders"
            :items="detail?.inviteCodes ?? []"
            :loading="loading"
          >
            <template #item.code="{ item }">
              <div class="d-inline-flex align-center ga-2">
                <code class="font-mono">{{ item.code }}</code>
                <v-btn
                  icon="mdi-content-copy"
                  size="x-small"
                  variant="text"
                  density="compact"
                  @click="copyInviteLink(item.code)"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                  <v-tooltip activator="parent" location="top" text="复制推广链接" />
                </v-btn>
              </div>
            </template>
            <template #item.enabled="{ item }">
              <v-switch
                :model-value="item.enabled"
                :disabled="!canWrite"
                hide-details
                density="compact"
                color="primary"
                inset
                @update:model-value="toggleCodeEnabled(item.id, $event)"
              />
            </template>
            <template #item.expiresAt="{ item }">
              {{ item.expiresAt ? formatDate(item.expiresAt) : '长期有效' }}
            </template>
            <template #item.gmvCents="{ item }"> ¥ {{ formatYuan(item.gmvCents) }} </template>
            <template #item.actions="{ item }">
              <v-btn
                v-if="canWrite"
                icon
                size="small"
                variant="text"
                color="error"
                @click="openDeleteDialog(item)"
              >
                <v-icon>mdi-delete</v-icon>
                <v-tooltip activator="parent" location="top" text="删除邀请码" />
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- 用户明细 Tab -->
      <v-window-item value="users">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>注册用户</span>
            <v-spacer />
            <v-checkbox
              v-model="paidOnly"
              label="仅看付费用户"
              hide-details
              density="compact"
              @update:model-value="loadUsers(1)"
            />
          </v-card-title>
          <v-data-table-server
            :headers="userHeaders"
            :items="users"
            :loading="usersLoading"
            :items-length="usersTotal"
            :items-per-page="usersLimit"
            :page="usersPage"
            @update:page="loadUsers"
            @update:items-per-page="onLimitChange"
            no-data-text="该渠道暂无注册用户"
          >
            <template #item.userPhone="{ item }">
              {{ item.userPhone || item.userEmail || item.userName || '—' }}
            </template>
            <template #item.registeredAt="{ item }">
              {{ formatDate(item.registeredAt) }}
            </template>
            <template #item.landingHost="{ item }">
              <v-chip size="x-small" variant="tonal">{{ item.landingHost || '—' }}</v-chip>
            </template>
            <template #item.rechargeCents="{ item }">
              ¥ {{ formatYuan(item.rechargeCents) }}
            </template>
            <template #item.subscriptionCents="{ item }">
              ¥ {{ formatYuan(item.subscriptionCents) }}
            </template>
            <template #item.giveCents="{ item }">
              <span class="text-grey">¥ {{ formatYuan(item.giveCents) }}</span>
            </template>
            <template #item.gmvCents="{ item }">
              <span class="font-bold">¥ {{ formatYuan(item.gmvCents) }}</span>
            </template>
          </v-data-table-server>
        </v-card>
      </v-window-item>
    </v-window>

    <ReferralInviteCodeFormDialog
      v-if="detail"
      v-model="codeDialogOpen"
      :channel-id="detail.channel.id"
      @created="loadDetail"
    />

    <v-dialog v-model="deleteDialogOpen" max-width="460">
      <v-card>
        <v-card-title class="text-h6">确认删除邀请码</v-card-title>
        <v-card-text>
          <div class="mb-2">
            确定要删除邀请码
            <code class="mx-1 font-mono">{{ inviteCodeToDelete?.code }}</code>
            吗？
          </div>
          <v-alert
            v-if="(inviteCodeToDelete?.registeredUsers ?? 0) > 0"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            此码已带来 <b>{{ inviteCodeToDelete?.registeredUsers }}</b> 个注册用户。
            删除后历史归因仍保留，但此邀请链接将立即失效，无法再用于拉新。
          </v-alert>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialogOpen = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  type ReferralChannelDetail,
  type ReferralChannelPlatform,
  type ReferralChannelUserRow,
  type ReferralInviteCodeWithStats,
  deleteInviteCode,
  getReferralChannelDetail,
  listChannelUsers,
  updateInviteCode,
} from '@/api/referralApi';
import ReferralInviteCodeFormDialog from '@/components/admin/ReferralInviteCodeFormDialog.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { Permission } from '@/constants/permissions';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useUserStore } from '@/stores/userStore';

const route = useRoute();
const userStore = useUserStore();
const snackbarStore = useSnackbarStore();

const channelId = computed(() => Number(route.params.id));
const detail = ref<ReferralChannelDetail | null>(null);
const loading = ref(false);

const activeTab = ref<'codes' | 'users'>('codes');
const codeDialogOpen = ref(false);

const users = ref<ReferralChannelUserRow[]>([]);
const usersTotal = ref(0);
const usersLoading = ref(false);
const usersPage = ref(1);
const usersLimit = ref(20);
const paidOnly = ref(false);

const snackbar = reactive({ show: false, message: '', color: 'success' });

const deleteDialogOpen = ref(false);
const deleting = ref(false);
const inviteCodeToDelete = ref<ReferralInviteCodeWithStats | null>(null);

const canWrite = computed(() => userStore.hasPermission(Permission.REFERRAL_WRITE));

const codeHeaders = [
  { title: '邀请码', key: 'code' },
  { title: '备注', key: 'remark' },
  { title: '启用', key: 'enabled' },
  { title: '过期时间', key: 'expiresAt' },
  { title: '注册数', key: 'registeredUsers', align: 'end' as const },
  { title: 'GMV (元)', key: 'gmvCents', align: 'end' as const },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
];

const userHeaders = [
  { title: '联系方式', key: 'userPhone' },
  { title: '邀请码', key: 'inviteCode' },
  { title: '注册时间', key: 'registeredAt' },
  { title: '落地域名', key: 'landingHost' },
  { title: '积分充值 (元)', key: 'rechargeCents', align: 'end' as const },
  { title: '会员订阅 (元)', key: 'subscriptionCents', align: 'end' as const },
  { title: '积分赠送 (元)', key: 'giveCents', align: 'end' as const },
  { title: '合计 GMV (元)', key: 'gmvCents', align: 'end' as const },
];

async function loadDetail() {
  loading.value = true;
  try {
    detail.value = await getReferralChannelDetail(channelId.value);
  } catch (err) {
    snackbar.message = `加载失败：${(err as Error).message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
}

async function loadUsers(page = 1) {
  usersPage.value = page;
  usersLoading.value = true;
  try {
    const res = await listChannelUsers(channelId.value, {
      page,
      limit: usersLimit.value,
      paidOnly: paidOnly.value ? 'true' : undefined,
    });
    users.value = res.list;
    usersTotal.value = res.total;
  } catch (err) {
    snackbar.message = `加载用户明细失败：${(err as Error).message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    usersLoading.value = false;
  }
}

function onLimitChange(limit: number) {
  usersLimit.value = limit;
  loadUsers(1);
}

async function toggleCodeEnabled(id: number, enabled: boolean) {
  try {
    await updateInviteCode(id, { enabled });
    snackbar.message = enabled ? '邀请码已启用' : '邀请码已禁用';
    snackbar.color = 'success';
    snackbar.show = true;
    loadDetail();
  } catch (err) {
    snackbar.message = `操作失败：${(err as Error).message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  }
}

async function copyInviteLink(code: string) {
  const link = `https://workspace.zerocut.cn/?ref=${code}`;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    snackbarStore.showSuccessMessage('已复制推广链接');
  } catch {
    snackbarStore.showErrorMessage('复制失败，请手动选中复制');
  }
}

function openDeleteDialog(item: ReferralInviteCodeWithStats) {
  inviteCodeToDelete.value = item;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!inviteCodeToDelete.value) return;
  deleting.value = true;
  try {
    await deleteInviteCode(inviteCodeToDelete.value.id);
    snackbarStore.showSuccessMessage('邀请码已删除');
    deleteDialogOpen.value = false;
    inviteCodeToDelete.value = null;
    await loadDetail();
  } catch (err) {
    snackbarStore.showErrorMessage(`删除失败：${(err as Error).message}`);
  } finally {
    deleting.value = false;
  }
}

function formatYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}
function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}
function platformLabel(p: ReferralChannelPlatform): string {
  return {
    wechat: '微信公众号',
    xhs: '小红书',
    bilibili: 'B 站',
    douyin: '抖音',
    other: '其他',
  }[p];
}

onMounted(() => {
  loadDetail();
  loadUsers();
});
</script>
