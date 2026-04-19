<script setup lang="ts">
import moment from 'moment';
import { onMounted, ref } from 'vue';

import type { CreditsDailySourceStatItem } from '@/api/adminApi';

import { getCreditsDailySourceStats } from '@/api/adminApi';
import CreditsSourceTrendChart from '@/components/charts/CreditsSourceTrendChart.vue';

const loading = ref(false);
const items = ref<CreditsDailySourceStatItem[]>([]);
const startDate = ref(moment().subtract(30, 'days').format('YYYY-MM-DD'));
const endDate = ref(moment().format('YYYY-MM-DD'));

async function fetchData() {
  loading.value = true;
  try {
    items.value = await getCreditsDailySourceStats({
      startDate: startDate.value,
      endDate: endDate.value,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-chart-line</v-icon>
            积分消耗来源趋势
            <v-spacer />
            <v-text-field
              v-model="startDate"
              type="date"
              label="开始日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-text-field
              v-model="endDate"
              type="date"
              label="结束日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-btn color="primary" variant="tonal" :loading="loading" @click="fetchData">
              查询
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate color="primary" />
            <CreditsSourceTrendChart v-else :items="items" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
