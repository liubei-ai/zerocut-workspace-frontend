<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { VideoWorkflowSource } from '@/types/api';

import ProjectOverviewList from './ProjectOverviewList.vue';

const { t } = useI18n();
const source = ref<VideoWorkflowSource>('workflow');
</script>

<template>
  <div>
    <v-tabs v-model="source" color="primary" class="mb-4">
      <v-tab value="workflow">{{ t('zerocut.usage.records.source.workflow') }}</v-tab>
      <v-tab value="api">{{ t('zerocut.usage.records.source.api') }}</v-tab>
    </v-tabs>

    <ProjectOverviewList :source="source" />
  </div>
</template>
