<script setup lang="ts">
import moment from 'moment';
import { onMounted, ref } from 'vue';

import type { CreditsDailySourceStatItem, WorkspaceCreditsLeaderboardItem } from '@/api/adminApi';

import { getCreditsDailySourceStats, getWorkspaceCreditsLeaderboard } from '@/api/adminApi';
import CreditsSourceTrendChart from '@/components/charts/CreditsSourceTrendChart.vue';

// 趋势图独立状态
const trendLoading = ref(false);
const items = ref<CreditsDailySourceStatItem[]>([]);
const trendStartDate = ref(moment().subtract(30, 'days').format('YYYY-MM-DD'));
const trendEndDate = ref(moment().format('YYYY-MM-DD'));

// 消耗榜独立状态
const leaderboardLoading = ref(false);
const leaderboardItems = ref<WorkspaceCreditsLeaderboardItem[]>([]);
const leaderboardStartDate = ref(moment().subtract(1, 'days').format('YYYY-MM-DD'));
const leaderboardEndDate = ref(moment().subtract(1, 'days').format('YYYY-MM-DD'));

const leaderboardHeaders = [
  { title: '排名', key: 'rank', width: 60, align: 'center' as const },
  { title: '工作区名', key: 'workspace_name' },
  { title: 'Owner 手机', key: 'owner_phone', width: 150 },
  { title: 'Owner 姓名', key: 'owner_name', width: 120 },
  { title: '消耗积分', key: 'total_credits', width: 120, align: 'end' as const },
  { title: '消耗次数', key: 'total_count', width: 100, align: 'end' as const },
];

async function fetchTrend() {
  trendLoading.value = true;
  try {
    items.value = await getCreditsDailySourceStats({
      startDate: trendStartDate.value,
      endDate: trendEndDate.value,
    });
  } finally {
    trendLoading.value = false;
  }
}

async function fetchLeaderboard() {
  leaderboardLoading.value = true;
  try {
    leaderboardItems.value = await getWorkspaceCreditsLeaderboard({
      startDate: leaderboardStartDate.value,
      endDate: leaderboardEndDate.value,
    });
  } finally {
    leaderboardLoading.value = false;
  }
}

onMounted(() => {
  fetchTrend();
  fetchLeaderboard();
});
</script>

<template>
  <v-container fluid>
    <!-- 积分消耗来源趋势 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-chart-line</v-icon>
            积分消耗来源趋势
            <v-spacer />
            <v-text-field
              v-model="trendStartDate"
              type="date"
              label="开始日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-text-field
              v-model="trendEndDate"
              type="date"
              label="结束日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-btn color="primary" variant="tonal" :loading="trendLoading" @click="fetchTrend">
              查询
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-progress-linear v-if="trendLoading" indeterminate color="primary" />
            <CreditsSourceTrendChart v-else :items="items" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 工作区维度消耗榜 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-trophy-outline</v-icon>
            工作区消耗榜 · Top 10
            <v-spacer />
            <v-text-field
              v-model="leaderboardStartDate"
              type="date"
              label="开始日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-text-field
              v-model="leaderboardEndDate"
              type="date"
              label="结束日期"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
              class="mr-2"
            />
            <v-btn
              color="primary"
              variant="tonal"
              :loading="leaderboardLoading"
              @click="fetchLeaderboard"
            >
              查询
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-progress-linear v-if="leaderboardLoading" indeterminate color="primary" />
            <v-data-table
              v-else
              :headers="leaderboardHeaders"
              :items="leaderboardItems"
              :items-per-page="-1"
              hide-default-footer
              no-data-text="暂无数据"
              density="comfortable"
            >
              <template #[`item.rank`]="{ index }">
                <span :class="index < 3 ? 'font-weight-bold text-primary' : ''">
                  {{ index + 1 }}
                </span>
              </template>
              <template #[`item.owner_phone`]="{ item }">
                {{ item.owner_phone ?? '—' }}
              </template>
              <template #[`item.owner_name`]="{ item }">
                {{ item.owner_name ?? '—' }}
              </template>
              <template #[`item.total_credits`]="{ item }">
                {{ item.total_credits.toLocaleString() }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
