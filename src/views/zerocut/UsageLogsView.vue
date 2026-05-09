<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import ConsumptionRecordsTab from '@/components/zerocut/usage/ConsumptionRecordsTab.vue';
import UsageRecordsTab from '@/components/zerocut/usage/UsageRecordsTab.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

type TabKey = 'consumption' | 'usage';

const activeTab = ref<TabKey>(route.query.tab === 'usage' ? 'usage' : 'consumption');

watch(activeTab, value => {
  if (route.query.tab === value) return;
  router.replace({ query: { ...route.query, tab: value } });
});
</script>

<template>
  <div>
    <ResponsivePageHeader :title="t('zerocut.usage.title')">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">{{ t('zerocut.usage.subtitle') }}</p>
      </template>
    </ResponsivePageHeader>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="consumption">{{ t('zerocut.usage.tabs.consumption') }}</v-tab>
      <v-tab value="usage">{{ t('zerocut.usage.tabs.usage') }}</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="consumption">
        <ConsumptionRecordsTab />
      </v-window-item>
      <v-window-item value="usage">
        <UsageRecordsTab />
      </v-window-item>
    </v-window>
  </div>
</template>
