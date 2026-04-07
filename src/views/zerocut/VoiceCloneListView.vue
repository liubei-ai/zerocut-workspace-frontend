<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { VoiceClone } from '@/types/api';

import { getVoiceClones } from '@/api/workspaceApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';

const { t } = useI18n();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const error = ref('');
const voiceClones = ref<VoiceClone[]>([]);

const workspaceId = computed(() => workspaceStore.currentWorkspaceId);

const fetchVoiceClones = async () => {
  if (!workspaceId.value) {
    voiceClones.value = [];
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    voiceClones.value = await getVoiceClones(workspaceId.value);
  } catch (err: any) {
    console.error('获取复刻音色列表失败:', err);
    error.value = err?.message || t('zerocut.voiceClones.errors.fetchFailed');
    voiceClones.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchVoiceClones();
});

watch(workspaceId, () => {
  fetchVoiceClones();
});
</script>

<template>
  <div>
    <ResponsivePageHeader :title="t('zerocut.voiceClones.title')">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">
          {{ t('zerocut.voiceClones.subtitle') }}
        </p>
      </template>
    </ResponsivePageHeader>

    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ t('zerocut.voiceClones.listTitle') }}</span>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="fetchVoiceClones"
        >
          {{ t('common.refresh') }}
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="[
          { title: t('zerocut.voiceClones.columns.voiceId'), key: 'voice_id', sortable: false },
          { title: t('zerocut.voiceClones.columns.voiceName'), key: 'voice_name', sortable: false },
          { title: t('zerocut.voiceClones.columns.demoAudio'), key: 'demo_audio', sortable: false },
          { title: t('zerocut.voiceClones.columns.updatedAt'), key: 'updatedAt', sortable: false },
        ]"
        :items="voiceClones"
        :loading="loading"
        :no-data-text="t('zerocut.voiceClones.empty')"
        item-value="id"
      >
        <template #item.demo_audio="{ item }">
          <div class="py-2">
            <audio :src="item.demo_audio" controls preload="none" style="max-width: 280px" />
          </div>
        </template>

        <template #item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
