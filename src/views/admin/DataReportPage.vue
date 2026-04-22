<script setup lang="ts">
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';

import type { CreditsDailySourceStatItem, WorkspaceCreditsLeaderboardItem } from '@/api/adminApi';

import { getCreditsDailySourceStats, getWorkspaceCreditsLeaderboard } from '@/api/adminApi';
import CreditsSourceTrendChart from '@/components/charts/CreditsSourceTrendChart.vue';

// 趋势图独立状态
const trendLoading = ref(false);
const items = ref<CreditsDailySourceStatItem[]>([]);
const trendStartDate = ref(moment().subtract(30, 'days').format('YYYY-MM-DD'));
const trendEndDate = ref(moment().format('YYYY-MM-DD'));

// 每日明细表格状态
const tableMetric = ref<'credits' | 'price'>('credits');

interface PivotRow {
  day: string;
  sources: Record<string, { credits: number; price: number }>;
  totalCredits: number;
  totalPrice: number;
}

const UNKNOWN_SOURCE = '未知来源';

const SOURCE_LABELS: Record<string, string> = {
  admin_give: '系统赠与',
  admin_manual: '手动充值',
  Newbie: '新用户赠送',
  subscription_grant: '会员订阅',
  wechat_recharge: '积分套餐',
};

function labelOfSource(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

const pivotSources = computed<string[]>(() => {
  const set = new Set<string>();
  for (const item of items.value) {
    set.add(item.source || UNKNOWN_SOURCE);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
});

const pivotRows = computed<PivotRow[]>(() => {
  const byDay = new Map<string, PivotRow>();
  for (const item of items.value) {
    const source = item.source || UNKNOWN_SOURCE;
    let row = byDay.get(item.day);
    if (!row) {
      row = { day: item.day, sources: {}, totalCredits: 0, totalPrice: 0 };
      byDay.set(item.day, row);
    }
    const prev = row.sources[source] ?? { credits: 0, price: 0 };
    row.sources[source] = {
      credits: prev.credits + item.total_credits,
      price: prev.price + item.total_price,
    };
    row.totalCredits += item.total_credits;
    row.totalPrice += item.total_price;
  }
  return [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day));
});

const pivotHeaders = computed(() => {
  const sourceHeaders = pivotSources.value.map(source => ({
    title: labelOfSource(source),
    key: source,
    align: 'end' as const,
    sortable: false,
  }));
  return [
    { title: '日期', key: 'day', sortable: true },
    ...sourceHeaders,
    { title: '合计', key: 'total', align: 'end' as const, sortable: true },
  ];
});

function formatCell(value: number | undefined, metric: 'credits' | 'price') {
  if (value === undefined) return '—';
  if (metric === 'credits') return value.toLocaleString();
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function exportCsv() {
  if (pivotRows.value.length === 0) return;
  const sources = pivotSources.value;
  const metric = tableMetric.value;
  const header = ['日期', ...sources.map(labelOfSource), '合计'];
  const lines: string[] = [header.join(',')];
  for (const row of pivotRows.value) {
    const cells: string[] = [row.day];
    for (const source of sources) {
      const cell = row.sources[source];
      if (!cell) {
        cells.push('');
        continue;
      }
      const v = metric === 'credits' ? cell.credits : cell.price;
      cells.push(metric === 'credits' ? String(v) : v.toFixed(4));
    }
    const total = metric === 'credits' ? row.totalCredits : row.totalPrice;
    cells.push(metric === 'credits' ? String(total) : total.toFixed(4));
    lines.push(cells.join(','));
  }
  const csv = '\ufeff' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `credits-daily-${metric}-${trendStartDate.value}_${trendEndDate.value}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 消耗榜独立状态
const leaderboardLoading = ref(false);
const leaderboardItems = ref<WorkspaceCreditsLeaderboardItem[]>([]);
const leaderboardStartDate = ref(moment().subtract(1, 'days').format('YYYY-MM-DD'));
const leaderboardEndDate = ref(moment().subtract(1, 'days').format('YYYY-MM-DD'));

const leaderboardHeaders = [
  { title: '排名', key: 'rank', width: 60, align: 'center' as const },
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
            <template v-else>
              <CreditsSourceTrendChart :items="items" />

              <v-divider class="my-4" />

              <div class="d-flex align-center mb-3">
                <v-icon start>mdi-table</v-icon>
                <span class="text-subtitle-1 font-weight-medium">每日明细</span>
                <v-spacer />
                <v-btn-toggle
                  v-model="tableMetric"
                  mandatory
                  density="compact"
                  color="primary"
                  class="mr-2"
                >
                  <v-btn value="credits" size="small">积分数</v-btn>
                  <v-btn value="price" size="small">金额（元）</v-btn>
                </v-btn-toggle>
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-download"
                  :disabled="pivotRows.length === 0"
                  @click="exportCsv"
                >
                  导出 CSV
                </v-btn>
              </div>

              <v-data-table
                :headers="pivotHeaders"
                :items="pivotRows"
                :items-per-page="-1"
                hide-default-footer
                no-data-text="暂无数据"
                density="comfortable"
              >
                <template
                  v-for="source in pivotSources"
                  #[`item.${source}`]="{ item }"
                  :key="source"
                >
                  {{
                    formatCell(
                      tableMetric === 'credits'
                        ? item.sources[source]?.credits
                        : item.sources[source]?.price,
                      tableMetric
                    )
                  }}
                </template>
                <template #[`item.total`]="{ item }">
                  {{
                    formatCell(
                      tableMetric === 'credits' ? item.totalCredits : item.totalPrice,
                      tableMetric
                    )
                  }}
                </template>
              </v-data-table>
            </template>
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
