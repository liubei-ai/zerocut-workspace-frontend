<template>
  <v-container fluid>
    <ResponsivePageHeader
      title="推广渠道管理"
      subtitle="管理 KOL / 自媒体推广渠道与邀请码，跟踪渠道带来的注册和消费"
      :primary-actions="headerActions"
    />

    <v-card flat class="mb-4">
      <v-card-text class="pa-4">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div class="text-grey text-sm">渠道总数</div>
            <div class="text-2xl font-bold">{{ totalChannels }}</div>
          </div>
          <div>
            <div class="text-grey text-sm">累计邀请码</div>
            <div class="text-2xl font-bold">{{ totalInviteCodes }}</div>
          </div>
          <div>
            <div class="text-grey text-sm">累计注册用户</div>
            <div class="text-2xl font-bold">{{ totalRegistered }}</div>
          </div>
          <div>
            <div class="text-grey text-sm">累计 GMV (元)</div>
            <div class="text-2xl font-bold">¥ {{ formatYuan(totalGmvCents) }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="channels"
        :loading="loading"
        no-data-text="暂无渠道，点击右上角创建第一个渠道"
        loading-text="加载中..."
      >
        <template #item.platform="{ item }">
          <v-chip size="small" :color="platformColor(item.platform)" variant="tonal">
            {{ platformLabel(item.platform) }}
          </v-chip>
        </template>
        <template #item.gmvCents="{ item }">
          <span class="font-mono">¥ {{ formatYuan(item.gmvCents) }}</span>
        </template>
        <template #item.attributionWindowDays="{ item }">
          <span>{{ item.attributionWindowDays }} 天</span>
        </template>
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :to="{ name: 'admin-referral-channel-detail', params: { id: item.id } }"
          >
            详情
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <ReferralChannelFormDialog
      v-model="formDialogOpen"
      :submit-handler="handleCreate"
      title="新建推广渠道"
      @submitted="loadChannels"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  type CreateChannelPayload,
  type ReferralChannelPlatform,
  type ReferralChannelWithStats,
  createReferralChannel,
  listReferralChannels,
} from '@/api/referralApi';
import ReferralChannelFormDialog from '@/components/admin/ReferralChannelFormDialog.vue';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { Permission } from '@/constants/permissions';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const channels = ref<ReferralChannelWithStats[]>([]);
const loading = ref(false);
const formDialogOpen = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const headers = [
  { title: '渠道名', key: 'name' },
  { title: '平台', key: 'platform' },
  { title: '邀请码数', key: 'inviteCodeCount', align: 'end' as const },
  { title: '注册数', key: 'registeredUsers', align: 'end' as const },
  { title: '付费用户', key: 'paidUsers', align: 'end' as const },
  { title: 'GMV (元)', key: 'gmvCents', align: 'end' as const },
  { title: '窗口期', key: 'attributionWindowDays' },
  { title: '创建时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
];

const headerActions = computed(() =>
  userStore.hasPermission(Permission.REFERRAL_WRITE)
    ? [
        {
          key: 'create',
          label: '新建渠道',
          icon: 'mdi-plus',
          color: 'primary',
          variant: 'flat' as const,
          onClick: () => (formDialogOpen.value = true),
        },
      ]
    : []
);

const totalChannels = computed(() => channels.value.length);
const totalInviteCodes = computed(() =>
  channels.value.reduce((sum, c) => sum + c.inviteCodeCount, 0)
);
const totalRegistered = computed(() =>
  channels.value.reduce((sum, c) => sum + c.registeredUsers, 0)
);
const totalGmvCents = computed(() => channels.value.reduce((sum, c) => sum + c.gmvCents, 0));

async function loadChannels() {
  loading.value = true;
  try {
    channels.value = await listReferralChannels();
  } catch (err) {
    snackbar.message = `加载渠道列表失败：${(err as Error).message}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
}

async function handleCreate(payload: CreateChannelPayload) {
  await createReferralChannel(payload);
  snackbar.message = '渠道创建成功';
  snackbar.color = 'success';
  snackbar.show = true;
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
function platformColor(p: ReferralChannelPlatform): string {
  return {
    wechat: 'green',
    xhs: 'pink',
    bilibili: 'blue',
    douyin: 'grey-darken-2',
    other: 'grey',
  }[p];
}

onMounted(loadChannels);
</script>
