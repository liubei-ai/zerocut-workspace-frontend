<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { VideoWorkflowSource } from '@/types/api';

import ProjectOverviewList from './ProjectOverviewList.vue';
import WorkspaceUsageRecordsList from './WorkspaceUsageRecordsList.vue';

interface Props {
  workspaceId?: string;
  projectDetailRouteName?: string;
  projectDetailRouteParams?: Record<string, string>;
  mode?: 'projects' | 'records';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'projects',
});

const { t } = useI18n();
const source = ref<VideoWorkflowSource>('workflow');
const projectOverviewList = ref<InstanceType<typeof ProjectOverviewList> | null>(null);
const workspaceUsageRecordsList = ref<InstanceType<typeof WorkspaceUsageRecordsList> | null>(null);

const refresh = async () => {
  if (props.mode === 'records') {
    await workspaceUsageRecordsList.value?.refresh();
  } else {
    await projectOverviewList.value?.refresh();
  }
};

defineExpose({ refresh });
</script>

<template>
  <div>
    <v-tabs v-model="source" color="primary" class="mb-4">
      <v-tab value="workflow">{{ t('zerocut.usage.records.source.workflow') }}</v-tab>
      <v-tab value="api">{{ t('zerocut.usage.records.source.api') }}</v-tab>
    </v-tabs>

    <ProjectOverviewList
      v-if="props.mode === 'projects'"
      ref="projectOverviewList"
      :source="source"
      :workspace-id="props.workspaceId"
      :project-detail-route-name="props.projectDetailRouteName"
      :project-detail-route-params="props.projectDetailRouteParams"
    />
    <WorkspaceUsageRecordsList
      v-else
      ref="workspaceUsageRecordsList"
      :source="source"
      :workspace-id="props.workspaceId"
    />
  </div>
</template>
