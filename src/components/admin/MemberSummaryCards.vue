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
import type { MemberSummary } from '@/api/memberAdminApi';
import { computed } from 'vue';

const props = defineProps<{
  summary: MemberSummary | null;
  loading?: boolean;
}>();

const cards = computed(() => {
  if (!props.summary) {
    return [
      {
        title: '总会员数',
        value: '-',
        color: 'primary',
        icon: 'mdi-account-group',
        subtitle: '活跃/待付/已取消',
      },
      { title: '按月续费', value: '-', color: 'success', icon: 'mdi-calendar-month', subtitle: '' },
      { title: '一次性月度会员', value: '-', color: 'warning', icon: 'mdi-account', subtitle: '' },
      { title: '一次性年度会员', value: '-', color: 'warning', icon: 'mdi-account', subtitle: '' },
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
      title: '连续包月',
      value: props.summary.autoMonthlyMembers.toLocaleString(),
      color: 'success',
      icon: 'mdi-calendar-month',
      subtitle: '',
    },
    {
      title: '按月支付',
      value: props.summary.oneTimeMembers.toLocaleString(),
      color: 'warning',
      icon: 'mdi-account',
      subtitle: '',
    },
    {
      title: '按年支付',
      value: props.summary.oneTimeYearMembers.toLocaleString(),
      color: 'warning',
      icon: 'mdi-calendar',
      subtitle: '',
    },
  ];
});
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
