<template>
  <v-row>
    <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" md="3">
      <v-card elevation="2" class="h-100">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2 text-medium-emphasis">
              {{ card.title }}
            </div>
            <v-icon :color="card.color" size="24">
              {{ card.icon }}
            </v-icon>
          </div>
          <div class="text-h4 font-weight-bold" :class="`text-${card.color}`">
            {{ card.value }}
          </div>
          <div v-if="card.subtitle" class="text-caption text-medium-emphasis mt-1">
            {{ card.subtitle }}
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MemberSummary } from '@/api/memberAdminApi';

const props = defineProps<{
  summary: MemberSummary | null;
  loading?: boolean;
}>();

const cards = computed(() => {
  if (!props.summary) {
    return [
      { title: '总会员数', value: '-', color: 'primary', icon: 'mdi-account-group' },
      { title: '按月续费', value: '-', color: 'success', icon: 'mdi-calendar-month' },
      { title: '按年续费', value: '-', color: 'info', icon: 'mdi-calendar' },
      { title: '一次性会员', value: '-', color: 'warning', icon: 'mdi-account' },
    ];
  }

  return [
    {
      title: '总会员数',
      value: props.summary.totalMembers.toLocaleString(),
      color: 'primary',
      icon: 'mdi-account-group',
      subtitle: '活跃/待付/已取消',
    },
    {
      title: '按月续费',
      value: props.summary.autoMonthlyMembers.toLocaleString(),
      color: 'success',
      icon: 'mdi-calendar-month',
      subtitle: '自动月度订阅',
    },
    {
      title: '按年续费',
      value: props.summary.autoYearlyMembers.toLocaleString(),
      color: 'info',
      icon: 'mdi-calendar',
      subtitle: '自动年度订阅',
    },
    {
      title: '一次性会员',
      value: props.summary.oneTimeMembers.toLocaleString(),
      color: 'warning',
      icon: 'mdi-account',
      subtitle: '一次性购买',
    },
  ];
});
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
