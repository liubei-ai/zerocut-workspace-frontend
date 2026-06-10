<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import type { AmountConsumptionRecord } from '@/types/api';

import { getSubAccountConsumptionRecords } from '@/api/subAccountApi';
import { useSubAccountStore } from '@/stores/subAccountStore';

const { t } = useI18n();
const router = useRouter();
const subAccountStore = useSubAccountStore();

const records = ref<AmountConsumptionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
const error = ref('');

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
const currentKey = computed(() => subAccountStore.session?.apiKeyMasked ?? '');

const formatAmount = (value: number) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatTime = (value: string) => new Date(value).toLocaleString();

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await getSubAccountConsumptionRecords({
      startDate: startDate.value ? new Date(startDate.value).toISOString() : undefined,
      endDate: endDate.value ? new Date(endDate.value).toISOString() : undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
    records.value = res.list || [];
    total.value = res.total || 0;
  } catch (e) {
    const code = (e as { code?: number })?.code;
    if (code === 401) {
      // 会话失效 → 回登录页
      subAccountStore.clear();
      router.replace({ name: 'sub-account-login' });
      return;
    }
    error.value = t('zerocut.subAccount.consumption.loadFail');
  } finally {
    loading.value = false;
  }
};

const search = () => {
  page.value = 1;
  load();
};

const reset = () => {
  startDate.value = '';
  endDate.value = '';
  page.value = 1;
  load();
};

const goPage = (next: number) => {
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
  load();
};

const logout = async () => {
  await subAccountStore.logout();
  router.replace({ name: 'sub-account-login' });
};

onMounted(load);
</script>

<template>
  <div class="pa-4 text-left">
    <div class="d-flex align-center justify-space-between mb-1">
      <h2 class="text-h6">{{ t('zerocut.subAccount.consumption.title') }}</h2>
      <v-btn variant="text" size="small" @click="logout">
        {{ t('zerocut.subAccount.consumption.logout') }}
      </v-btn>
    </div>
    <p class="text-caption text-medium-emphasis mb-4">
      {{ t('zerocut.subAccount.consumption.currentKey') }}: {{ currentKey }}
    </p>

    <div class="d-flex flex-column ga-2 mb-3">
      <v-text-field
        v-model="startDate"
        :label="t('zerocut.subAccount.consumption.startDate')"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
      ></v-text-field>
      <v-text-field
        v-model="endDate"
        :label="t('zerocut.subAccount.consumption.endDate')"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
      ></v-text-field>
      <div class="d-flex ga-2">
        <v-btn color="primary" size="small" :loading="loading" @click="search">
          {{ t('zerocut.subAccount.consumption.search') }}
        </v-btn>
        <v-btn variant="text" size="small" @click="reset">
          {{ t('zerocut.subAccount.consumption.reset') }}
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-3">
      {{ error }}
    </v-alert>

    <v-list v-if="records.length" lines="two" density="compact">
      <v-list-item v-for="record in records" :key="record.id" class="px-0">
        <template #title>
          <span class="font-weight-medium">{{ formatAmount(record.amount) }}</span>
        </template>
        <template #subtitle>
          <span class="text-caption">{{ formatTime(record.createdAt) }}</span>
          <span v-if="record.displayDetails?.reason" class="text-caption">
            · {{ record.displayDetails.reason }}
          </span>
        </template>
      </v-list-item>
    </v-list>

    <div v-else-if="!loading" class="text-medium-emphasis py-8 text-center">
      {{ t('zerocut.subAccount.consumption.empty') }}
    </div>

    <div v-if="total > 0" class="d-flex align-center ga-3 mt-3 justify-center">
      <v-btn
        icon="mdi-chevron-left"
        size="small"
        variant="text"
        :disabled="page <= 1"
        @click="goPage(page - 1)"
      ></v-btn>
      <span class="text-caption">{{ page }} / {{ totalPages }}</span>
      <v-btn
        icon="mdi-chevron-right"
        size="small"
        variant="text"
        :disabled="page >= totalPages"
        @click="goPage(page + 1)"
      ></v-btn>
    </div>
  </div>
</template>
