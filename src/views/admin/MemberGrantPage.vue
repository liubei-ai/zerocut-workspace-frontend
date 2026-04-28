<template>
  <v-container class="member-grant-page" fluid>
    <v-row align="center" class="mb-4">
      <v-col cols="auto">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-members' }">
          返回会员管理
        </v-btn>
      </v-col>
      <v-col>
        <h2 class="text-h5 mb-0">开通会员（线下成交）</h2>
      </v-col>
    </v-row>

    <v-stepper v-model="currentStep" :items="stepperItems" hide-actions class="elevation-1">
      <!-- ============ Step 1: 录入 ============ -->
      <template #item.1>
        <div class="pa-4">
          <v-form ref="step1Form" @submit.prevent="onSubmitStep1">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="planCode"
                  :items="planOptions"
                  item-title="label"
                  item-value="value"
                  label="选择套餐"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="remark"
                  label="备注（必填，记录销售场景）"
                  placeholder="例：企业 ABC 线下成交 30 单 / 销售：张云剑"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || '备注不能为空', v => v.length <= 500 || '备注最长 500 字']"
                  required
                />
              </v-col>
            </v-row>

            <v-textarea
              v-model="phonesRaw"
              label="手机号列表（支持逗号、换行、空格分隔）"
              placeholder="例如：&#10;13800000001, 13800000002&#10;138-0000-0003 +86 13800000004"
              variant="outlined"
              auto-grow
              rows="6"
              :hint="phoneHint"
              persistent-hint
              :rules="[() => normalizedPhones.length > 0 || '请输入至少 1 个有效手机号']"
            />

            <v-alert
              v-if="phoneOverflowWarning"
              type="warning"
              variant="tonal"
              class="mt-3"
              density="compact"
            >
              {{ phoneOverflowWarning }}
            </v-alert>

            <div class="d-flex mt-4 justify-end">
              <v-btn
                color="primary"
                :loading="lookupLoading"
                :disabled="normalizedPhones.length === 0 || !remark"
                @click="onSubmitStep1"
              >
                查询用户信息
              </v-btn>
            </div>
          </v-form>
        </div>
      </template>

      <!-- ============ Step 2: 预览与勾选 ============ -->
      <template #item.2>
        <div class="pa-4">
          <div class="d-flex ga-3 align-center mb-3 flex-wrap">
            <span class="text-body-2">
              查到 <strong>{{ lookupSummary.found }}</strong> / 共
              <strong>{{ lookupSummary.total }}</strong> 人； 其中
              <strong>{{ alreadySubscribedCount }}</strong> 人已有有效订阅； 当前勾选
              <strong>{{ selectedRowKeys.length }}</strong> 人
            </span>
            <span class="text-caption text-medium-emphasis">
              套餐：{{ planLabelOf(planCode) }}
            </span>
          </div>

          <div v-if="foundTableRows.length === 0" class="text-medium-emphasis mb-4">
            没有找到任何已注册用户。
          </div>

          <v-data-table
            v-else
            v-model="selectedRowKeys"
            :items="foundTableRows"
            :headers="foundHeaders"
            item-value="rowKey"
            show-select
            density="comfortable"
            class="mb-4"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.workspaceId="{ item }">
              <v-select
                v-if="(item.workspaces?.length ?? 0) > 1"
                v-model="workspaceChoice[item.phone]"
                :items="item.workspaces"
                item-title="name"
                item-value="workspaceId"
                density="compact"
                variant="plain"
                hide-details
                style="min-width: 220px"
              />
              <span v-else>{{ item.workspaces?.[0]?.name }} ({{ item.workspaceId }})</span>
            </template>

            <template #item.currentSubscription="{ item }">
              <v-chip
                v-if="item.currentSubscription"
                size="x-small"
                color="warning"
                variant="tonal"
              >
                已有 {{ item.currentSubscription.planCode }}
                {{
                  item.currentSubscription.currentPeriodEndAt
                    ? '至 ' + item.currentSubscription.currentPeriodEndAt.slice(0, 10)
                    : ''
                }}
              </v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </template>

            <template #item.currentCredits="{ item }">
              {{ item.currentCredits ?? '—' }}
            </template>
          </v-data-table>

          <div v-if="notFoundRows.length" class="mb-4">
            <div class="text-subtitle-2 mb-2">未注册手机号（{{ notFoundRows.length }}）</div>
            <v-alert type="warning" variant="tonal" density="compact">
              <div>该手机号尚未注册，请引导用户先注册后再开通：</div>
              <ul class="mt-1">
                <li v-for="r in notFoundRows" :key="r.phone">
                  {{ r.phone }}<span v-if="r.reason"> — {{ r.reason }}</span>
                </li>
              </ul>
            </v-alert>
          </div>

          <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="text" @click="currentStep = 1">上一步</v-btn>
            <v-btn
              color="primary"
              :loading="grantLoading"
              :disabled="pendingItems.length === 0"
              @click="onSubmitStep2"
            >
              确认开通 {{ pendingItems.length }} 人
            </v-btn>
          </div>
        </div>
      </template>

      <!-- ============ Step 3: 结果 ============ -->
      <template #item.3>
        <div class="pa-4">
          <div v-if="!grantResult" class="text-medium-emphasis">尚未提交，无结果。</div>

          <div v-else>
            <v-row class="mb-4" dense>
              <v-col cols="12" sm="3">
                <v-card variant="tonal" color="success">
                  <v-card-text>
                    <div class="text-caption">成功</div>
                    <div class="text-h5">{{ grantResult.summary.success }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="3">
                <v-card variant="tonal" color="warning">
                  <v-card-text>
                    <div class="text-caption">跳过</div>
                    <div class="text-h5">{{ grantResult.summary.skipped }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="3">
                <v-card variant="tonal" color="error">
                  <v-card-text>
                    <div class="text-caption">失败</div>
                    <div class="text-h5">{{ grantResult.summary.failed }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="3">
                <v-card variant="tonal">
                  <v-card-text>
                    <div class="text-caption">合计</div>
                    <div class="text-h5">{{ grantResult.summary.total }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <ResultSection
              v-if="successResults.length"
              title="成功"
              color="success"
              :rows="successResults"
              :columns="successColumns"
            />
            <ResultSection
              v-if="skippedResults.length"
              title="跳过"
              color="warning"
              :rows="skippedResults"
              :columns="skippedFailedColumns"
            />
            <ResultSection
              v-if="failedResults.length"
              title="失败"
              color="error"
              :rows="failedResults"
              :columns="skippedFailedColumns"
            />

            <div class="d-flex ga-2 mt-4 justify-end">
              <v-btn variant="outlined" prepend-icon="mdi-download" @click="onExportCsv">
                导出 CSV
              </v-btn>
              <v-btn variant="text" @click="resetForNextBatch">继续开通</v-btn>
            </div>
          </div>
        </div>
      </template>
    </v-stepper>
  </v-container>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';

import {
  type GrantablePlanCode,
  type GrantItem,
  type GrantResult,
  type GrantResultItem,
  type LookupResult,
  type LookupResultItem,
  grantMemberships,
  lookupMembersByPhones,
} from '@/api/memberAdminApi';

import { downloadGrantResultCsv } from './utils/exportGrantCsv';
import { normalizePhones } from './utils/normalizePhones';

const MAX_PHONES = 200;

const planOptions: Array<{ value: GrantablePlanCode; label: string }> = [
  { value: 'STANDARD_ONE_TIME', label: '标准会员（月付版）¥299/月 · 8000 积分' },
  { value: 'BASIC_ONE_TIME', label: '基础会员（月付版）¥99/月 · 2500 积分' },
  { value: 'PREMIUM_ONE_TIME', label: '高级会员（月付版）¥799/月 · 25000 积分' },
];

const planLabelOf = (code: GrantablePlanCode) =>
  planOptions.find(p => p.value === code)?.label ?? code;

// State ----------------------------------------------------------------------
const currentStep = ref(1);
const planCode = ref<GrantablePlanCode>('STANDARD_ONE_TIME');
const remark = ref('');
const phonesRaw = ref('');

const lookupLoading = ref(false);
const grantLoading = ref(false);

const lookupResult = ref<LookupResult | null>(null);
const grantResult = ref<GrantResult | null>(null);

const stepperItems = [
  { title: '录入手机号', value: 1 },
  { title: '预览与勾选', value: 2 },
  { title: '执行结果', value: 3 },
];

// Step 1 derived state -------------------------------------------------------
const normalizedPhones = computed(() => normalizePhones(phonesRaw.value).slice(0, MAX_PHONES));

const phoneHint = computed(() => {
  const total = normalizedPhones.value.length;
  return total === 0 ? '尚未识别到有效手机号' : `已识别 ${total} 个有效手机号（去重后）`;
});

const phoneOverflowWarning = computed(() => {
  const allParsed = normalizePhones(phonesRaw.value);
  if (allParsed.length > MAX_PHONES) {
    return `单次最多 ${MAX_PHONES} 个手机号，已自动截取前 ${MAX_PHONES} 个；多余 ${allParsed.length - MAX_PHONES} 个被忽略。`;
  }
  return '';
});

// Step 2 derived state -------------------------------------------------------

// Lookup 摘要默认空对象，避免模板里 null check
const lookupSummary = computed(
  () => lookupResult.value?.summary ?? { total: 0, found: 0, notFound: 0 }
);

const foundRows = computed<LookupResultItem[]>(
  () => lookupResult.value?.results.filter(r => r.found) ?? []
);
const notFoundRows = computed<LookupResultItem[]>(
  () => lookupResult.value?.results.filter(r => !r.found) ?? []
);

const alreadySubscribedCount = computed(
  () => foundRows.value.filter(r => !!r.currentSubscription).length
);

const foundHeaders = [
  { title: '手机号', key: 'phone', sortable: false },
  { title: '用户姓名', key: 'userName', sortable: false },
  { title: 'Workspace', key: 'workspaceId', sortable: false },
  { title: '当前订阅', key: 'currentSubscription', sortable: false },
  { title: '当前积分', key: 'currentCredits', sortable: false },
];

// 多 workspace 场景下用户当前选择的 workspaceId（key=phone）
const workspaceChoice = ref<Record<string, string>>({});

// v-data-table 选中行的 rowKey（这里用 phone 作为唯一键）
const selectedRowKeys = ref<string[]>([]);

// 把 foundRows 注入额外字段供模板使用（rowKey + userName + 默认 workspaceId）
type FoundRowView = LookupResultItem & {
  rowKey: string;
  userName: string;
  workspaceId: string;
};

const foundTableRows = computed<FoundRowView[]>(() =>
  foundRows.value.map(r => {
    const defaultWs = r.workspaces?.find(w => w.isDefault) ?? r.workspaces?.[0];
    const chosenWid = workspaceChoice.value[r.phone] ?? defaultWs?.workspaceId ?? '';
    return {
      ...r,
      rowKey: r.phone,
      userName: r.user?.name ?? r.phone,
      workspaceId: chosenWid,
    };
  })
);

// 当 lookup 结果变化，重置默认勾选 + 默认 workspace 选择
watch(
  lookupResult,
  newVal => {
    if (!newVal) {
      selectedRowKeys.value = [];
      workspaceChoice.value = {};
      return;
    }
    const phones: string[] = [];
    const choices: Record<string, string> = {};
    for (const r of newVal.results) {
      if (!r.found || !r.workspaces || r.workspaces.length === 0) continue;
      phones.push(r.phone);
      const def = r.workspaces.find(w => w.isDefault) ?? r.workspaces[0];
      choices[r.phone] = def.workspaceId;
    }
    selectedRowKeys.value = phones;
    workspaceChoice.value = choices;
  },
  { immediate: false }
);

const pendingItems = computed<GrantItem[]>(() => {
  const out: GrantItem[] = [];
  const selectedSet = new Set(selectedRowKeys.value);
  for (const row of foundTableRows.value) {
    if (!selectedSet.has(row.rowKey)) continue;
    if (!row.workspaceId) continue;
    out.push({ workspaceId: row.workspaceId, phone: row.phone });
  }
  return out;
});

// Step 3 derived state -------------------------------------------------------
const successResults = computed<GrantResultItem[]>(
  () => grantResult.value?.results.filter(r => r.status === 'success') ?? []
);
const skippedResults = computed<GrantResultItem[]>(
  () => grantResult.value?.results.filter(r => r.status === 'skipped') ?? []
);
const failedResults = computed<GrantResultItem[]>(
  () => grantResult.value?.results.filter(r => r.status === 'failed') ?? []
);

const successColumns = [
  { key: 'phone', title: '手机号' },
  { key: 'workspaceId', title: 'Workspace' },
  { key: 'orderNo', title: '订单号' },
  { key: 'creditsGranted', title: '发放积分' },
  { key: 'currentCredits', title: '操作后总积分' },
];

const skippedFailedColumns = [
  { key: 'phone', title: '手机号' },
  { key: 'workspaceId', title: 'Workspace' },
  { key: 'failureReason', title: '原因' },
];

// Actions --------------------------------------------------------------------
async function onSubmitStep1() {
  if (normalizedPhones.value.length === 0) return;
  if (!remark.value) return;

  lookupLoading.value = true;
  try {
    // US2/T037: lookup 接口在 US2 阶段实现；当前会得到 NotImplementedException 错误。
    // 为让 US1 happy path 在 US2 落地前也可演示，约定：lookup 失败时降级用空 workspaces 路径。
    // 真正的端到端流程在 US2 完成后才能跑通。
    const res = await lookupMembersByPhones({ phones: normalizedPhones.value });
    lookupResult.value = res;
    currentStep.value = 2;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[grant] lookup failed:', msg);
    alert(`查询失败：${msg}`);
  } finally {
    lookupLoading.value = false;
  }
}

async function onSubmitStep2() {
  if (pendingItems.value.length === 0) return;

  grantLoading.value = true;
  try {
    const clientRequestId = crypto.randomUUID();
    const res = await grantMemberships({
      items: pendingItems.value,
      planCode: planCode.value,
      periods: 1,
      remark: remark.value,
      clientRequestId,
    });
    grantResult.value = res;
    currentStep.value = 3;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[grant] submit failed:', msg);
    alert(`开通失败：${msg}`);
  } finally {
    grantLoading.value = false;
  }
}

function onExportCsv() {
  if (!grantResult.value) return;
  downloadGrantResultCsv(grantResult.value, {
    lookupItems: lookupResult.value?.results,
  });
}

function resetForNextBatch() {
  phonesRaw.value = '';
  remark.value = '';
  lookupResult.value = null;
  grantResult.value = null;
  currentStep.value = 1;
}

// 内联结果区组件（保持本文件单文件可读，无需拆出）
const ResultSection = (props: {
  title: string;
  color: string;
  rows: GrantResultItem[];
  columns: Array<{ key: string; title: string }>;
}) => {
  return h('div', { class: 'mb-4' }, [
    h(
      'div',
      { class: `text-subtitle-1 mb-2 text-${props.color}` },
      `${props.title}（${props.rows.length}）`
    ),
    h('v-data-table', {
      items: props.rows,
      headers: props.columns.map(c => ({
        title: c.title,
        key: c.key,
        sortable: false,
      })),
      density: 'compact',
      hideDefaultFooter: props.rows.length <= 10,
      itemsPerPage: 10,
    }),
  ]);
};
</script>

<style scoped>
.member-grant-page {
  max-width: 1200px;
}
</style>
