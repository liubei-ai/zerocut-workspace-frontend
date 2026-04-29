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
                  :loading="plansLoading"
                  :disabled="plansLoading || planOptions.length === 0"
                  required
                />
                <v-alert
                  v-if="plansLoadError && !plansLoading"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  套餐加载失败。<a href="#" class="text-primary" @click.prevent="loadPlans">重试</a>
                </v-alert>
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
                :disabled="normalizedPhones.length === 0 || !remark || !planCode || plansLoading"
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
              确认开通 {{ pendingNewGrantCount }} 人<template
                v-if="selectedAlreadySubscribedCount > 0"
                >（另 {{ selectedAlreadySubscribedCount }} 人已有订阅将被跳过）</template
              >
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
import { computed, h, onMounted, ref, watch } from 'vue';

import { type MembershipPlanItem, getMembershipPlans } from '@/api/adminApi';
import {
  GRANTABLE_PLAN_CODES,
  type GrantablePlanCode,
  type GrantItem,
  type GrantResult,
  type GrantResultItem,
  type LookupResult,
  type LookupResultItem,
  grantMemberships,
  lookupMembersByPhones,
} from '@/api/memberAdminApi';
import { useSnackbarStore } from '@/stores/snackbarStore';

import { downloadGrantResultCsv } from './utils/exportGrantCsv';
import { normalizePhones } from './utils/normalizePhones';

// api2client rejects with plain `{ code, message, details }` objects (see api2client.ts),
// not Error instances — so a vanilla `instanceof Error` check would always fall through
// to `String(err)` → "[object Object]".
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m) return m;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

const snackbar = useSnackbarStore();

const MAX_PHONES = 200;

// 套餐选项动态从 /admin/membership-plans 拉取，避免硬编码价格/积分与运营调价不一致。
// 实际开通时后端会再用 planCode 反查 MembershipPlan 表，UI 这里仅负责展示与默认值。
const planOptions = ref<Array<{ value: GrantablePlanCode; label: string }>>([]);
const plansLoading = ref(false);
const plansLoadError = ref(false);

const planLabelOf = (code: GrantablePlanCode | '') =>
  (code && planOptions.value.find(p => p.value === code)?.label) || code || '';

// State ----------------------------------------------------------------------
const step1Form = ref<any>(null);

const currentStep = ref(1);
// 等套餐列表从后端加载完再设默认值（loadPlans 中会自动选 STANDARD_ONE_TIME）。
const planCode = ref<GrantablePlanCode | ''>('');
const remark = ref('');
const phonesRaw = ref('');

const lookupLoading = ref(false);
const grantLoading = ref(false);

const lookupResult = ref<LookupResult | null>(null);
const grantResult = ref<GrantResult | null>(null);

// Stable across retries within the same submission attempt — backend uses this
// as the idempotency key in a 10-minute window. Regenerated per fresh batch
// (after a successful step-1 lookup) so a retried network failure does NOT
// produce a duplicate grant.
const clientRequestId = ref('');

const stepperItems = [
  { title: '录入手机号', value: 1 },
  { title: '预览与勾选', value: 2 },
  { title: '执行结果', value: 3 },
];

// Step 1 derived state -------------------------------------------------------
const allParsedPhones = computed(() => normalizePhones(phonesRaw.value));
const normalizedPhones = computed(() => allParsedPhones.value.slice(0, MAX_PHONES));

const phoneHint = computed(() => {
  const total = normalizedPhones.value.length;
  return total === 0 ? '尚未识别到有效手机号' : `已识别 ${total} 个有效手机号（去重后）`;
});

const phoneOverflowWarning = computed(() => {
  const total = allParsedPhones.value.length;
  if (total > MAX_PHONES) {
    return `单次最多 ${MAX_PHONES} 个手机号，已自动截取前 ${MAX_PHONES} 个；多余 ${total - MAX_PHONES} 个被忽略。`;
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

// 已勾选行中已经存在订阅的人数 —— 提交后会被后端 skip。
// 单独展示，避免按钮上"开通 N 人"的承诺与实际"成功 N-M 人"不一致。
const selectedAlreadySubscribedCount = computed(() => {
  const selectedSet = new Set(selectedRowKeys.value);
  return foundTableRows.value.filter(
    row => selectedSet.has(row.rowKey) && !!row.currentSubscription
  ).length;
});

const pendingNewGrantCount = computed(
  () => pendingItems.value.length - selectedAlreadySubscribedCount.value
);

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
async function loadPlans() {
  plansLoading.value = true;
  plansLoadError.value = false;
  try {
    const list = await getMembershipPlans({
      purchaseMode: 'one_time_month',
      isActive: true,
    });
    // 过滤出 GRANTABLE 白名单内的 plan；按白名单顺序排列（基础 → 标准 → 高级）。
    const grantableSet = new Set<string>(GRANTABLE_PLAN_CODES);
    const byCode = new Map<GrantablePlanCode, MembershipPlanItem>();
    for (const p of list) {
      if (grantableSet.has(p.code)) {
        byCode.set(p.code as GrantablePlanCode, p);
      }
    }
    planOptions.value = GRANTABLE_PLAN_CODES.flatMap(code => {
      const p = byCode.get(code);
      if (!p) return [];
      const priceYuan = p.priceYuan ?? p.priceCents / 100;
      return [
        {
          value: code,
          label: `${p.name}（月付版）¥${priceYuan}/月 · ${p.monthlyCredits} 积分`,
        },
      ];
    });
    // 默认选中 STANDARD_ONE_TIME；若被禁用就退化到第一个可用项。
    if (!planCode.value || !planOptions.value.some(o => o.value === planCode.value)) {
      planCode.value =
        planOptions.value.find(o => o.value === 'STANDARD_ONE_TIME')?.value ??
        planOptions.value[0]?.value ??
        '';
    }
  } catch (err: unknown) {
    plansLoadError.value = true;
    const msg = extractErrorMessage(err);
    console.error('[grant] load plans failed:', msg);
    snackbar.showErrorMessage(`加载套餐列表失败：${msg}`);
  } finally {
    plansLoading.value = false;
  }
}

onMounted(loadPlans);

async function onSubmitStep1() {
  if (normalizedPhones.value.length === 0) return;
  if (!remark.value) return;
  if (!planCode.value) return;

  // Vuetify 3 的 validate() 是异步的；早期 PR 评审里被多次指出忽略 await 会让校验形同虚设。
  const validation = await step1Form.value?.validate();
  if (validation && validation.valid === false) return;

  lookupLoading.value = true;
  try {
    const res = await lookupMembersByPhones({ phones: normalizedPhones.value });
    lookupResult.value = res;
    // 新一批查询成功 → 为本批次生成新的 clientRequestId；
    // 后续 step2 的所有重试都会复用它，使后端 10 分钟幂等窗口生效。
    clientRequestId.value = crypto.randomUUID();
    currentStep.value = 2;
  } catch (err: unknown) {
    const msg = extractErrorMessage(err);
    console.error('[grant] lookup failed:', msg);
    snackbar.showErrorMessage(`查询失败：${msg}`);
  } finally {
    lookupLoading.value = false;
  }
}

async function onSubmitStep2() {
  if (pendingItems.value.length === 0) return;
  if (!planCode.value) return;
  if (!clientRequestId.value) {
    // 没有 lookup 就不应该到 step2，但兜底兼容 hot-reload / 异常路径。
    clientRequestId.value = crypto.randomUUID();
  }

  const submitPlanCode = planCode.value;
  grantLoading.value = true;
  try {
    const res = await grantMemberships({
      items: pendingItems.value,
      planCode: submitPlanCode,
      periods: 1,
      remark: remark.value,
      clientRequestId: clientRequestId.value,
    });
    grantResult.value = res;
    currentStep.value = 3;
  } catch (err: unknown) {
    const msg = extractErrorMessage(err);
    console.error('[grant] submit failed:', msg);
    snackbar.showErrorMessage(`开通失败：${msg}`);
    // 失败时保留 clientRequestId，让用户重试时复用同一个 ID 触发后端幂等。
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
  clientRequestId.value = '';
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
