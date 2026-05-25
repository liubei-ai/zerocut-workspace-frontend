<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  CreateOauthAppRequest,
  CreateOauthAppResponse,
  OauthAppListItem,
} from '@/types/oauth';

import { createMyOauthApp, deprecateOauthApp, getMyOauthApps, OauthApiError } from '@/api/oauthApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { OauthAppStatus } from '@/types/oauth';
import { formatDate } from '@/utils/date';

/**
 * OAuth 应用管理（issue #4 PR B）。
 *
 * 关键 UX：
 * - 「废弃」按钮 → 弹窗强制输入完整 ak 才能确认（仿 GitHub 删 repo）。
 * - 创建成功 → 立即弹窗一次性显示完整 sk，关闭后永远只能看到脱敏值。
 * - 列表里所有 sk 都是后端脱敏后的字符串，前端不做任何还原。
 *
 * 见 specs/006-oauth-authorize-service/spec.md 与 quickstart.md。
 */

const { t } = useI18n();
const snackbarStore = useSnackbarStore();

// ── 列表状态 ─────────────────────────────────────────
const loading = ref(false);
const apps = ref<OauthAppListItem[]>([]);

// ── 创建对话框 ───────────────────────────────────────
const createDialog = ref(false);
const creating = ref(false);
const createForm = ref<CreateOauthAppRequest>({
  ak: '',
  redirectUri: '',
  name: '',
});

const akRules = [
  (v: string) => !!v || t('oauth.manage.create.akInvalid'),
  (v: string) => /^[A-Za-z0-9]{8}$/.test(v) || t('oauth.manage.create.akInvalid'),
];
const redirectUriRules = [
  (v: string) => !!v || t('oauth.manage.create.redirectUriInvalid'),
  (v: string) => v.startsWith('https://') || t('oauth.manage.create.redirectUriInvalid'),
];

const createFormValid = computed(
  () =>
    /^[A-Za-z0-9]{8}$/.test(createForm.value.ak) &&
    createForm.value.redirectUri.startsWith('https://')
);

// ── 创建成功弹窗（一次性显示 sk）─────────────────────
const createdDialog = ref(false);
const createdApp = ref<CreateOauthAppResponse | null>(null);

// ── 废弃对话框 ───────────────────────────────────────
const deprecateDialog = ref(false);
const deprecating = ref(false);
const deprecateTarget = ref<OauthAppListItem | null>(null);
const deprecateConfirmInput = ref('');

const canConfirmDeprecate = computed(
  () => deprecateTarget.value !== null && deprecateConfirmInput.value === deprecateTarget.value.ak
);

// ── 统计 ─────────────────────────────────────────────
const stats = computed(() => ({
  total: apps.value.length,
  active: apps.value.filter(a => a.status === OauthAppStatus.ACTIVE).length,
  deprecated: apps.value.filter(a => a.status === OauthAppStatus.DEPRECATED).length,
}));

// ── 顶栏按钮 ─────────────────────────────────────────
const headerPrimaryActions = computed(() => [
  {
    key: 'create',
    label: t('oauth.manage.newApp'),
    icon: 'mdi-plus',
    color: 'primary',
    variant: 'flat' as const,
    onClick: openCreateDialog,
  },
]);

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: t('oauth.manage.refresh'),
    icon: 'mdi-refresh',
    variant: 'text' as const,
    loading: loading.value,
    onClick: loadApps,
  },
]);

// ── 表格 ─────────────────────────────────────────────
const headers = computed(() => [
  { title: t('oauth.manage.table.ak'), key: 'ak', sortable: false },
  { title: t('oauth.manage.table.name'), key: 'name', sortable: false },
  { title: t('oauth.manage.table.redirectUri'), key: 'redirectUri', sortable: false },
  { title: t('oauth.manage.table.sk'), key: 'skMasked', sortable: false },
  { title: t('oauth.manage.table.status'), key: 'status', sortable: false },
  { title: t('oauth.manage.table.createdAt'), key: 'createdAt', sortable: false },
  {
    title: t('oauth.manage.table.actions'),
    key: 'actions',
    sortable: false,
    align: 'end' as const,
  },
]);

// ── 数据加载 ─────────────────────────────────────────
async function loadApps() {
  loading.value = true;
  try {
    apps.value = await getMyOauthApps();
  } catch (error) {
    const msg =
      error instanceof OauthApiError ? error.message : t('oauth.manage.errors.loadFailed');
    snackbarStore.showErrorMessage(msg);
  } finally {
    loading.value = false;
  }
}

// ── 创建 ────────────────────────────────────────────
function openCreateDialog() {
  createForm.value = { ak: '', redirectUri: '', name: '' };
  createDialog.value = true;
}

async function submitCreate() {
  if (!createFormValid.value) return;
  creating.value = true;
  try {
    const payload: CreateOauthAppRequest = {
      ak: createForm.value.ak,
      redirectUri: createForm.value.redirectUri,
    };
    if (createForm.value.name?.trim()) {
      payload.name = createForm.value.name.trim();
    }
    const res = await createMyOauthApp(payload);
    createDialog.value = false;
    createdApp.value = res;
    createdDialog.value = true;
    snackbarStore.showSuccessMessage(t('oauth.manage.messages.createSuccess'));
    await loadApps();
  } catch (error) {
    const msg =
      error instanceof OauthApiError ? error.message : t('oauth.manage.errors.createFailed');
    snackbarStore.showErrorMessage(msg);
  } finally {
    creating.value = false;
  }
}

function closeCreatedDialog() {
  createdDialog.value = false;
  createdApp.value = null;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    snackbarStore.showSuccessMessage(t('oauth.manage.messages.copySuccess'));
  } catch {
    snackbarStore.showErrorMessage('Clipboard unavailable');
  }
}

// ── 废弃 ────────────────────────────────────────────
function openDeprecateDialog(app: OauthAppListItem) {
  deprecateTarget.value = app;
  deprecateConfirmInput.value = '';
  deprecateDialog.value = true;
}

function closeDeprecateDialog() {
  deprecateDialog.value = false;
  deprecateTarget.value = null;
  deprecateConfirmInput.value = '';
}

async function submitDeprecate() {
  if (!canConfirmDeprecate.value || !deprecateTarget.value) return;
  deprecating.value = true;
  try {
    await deprecateOauthApp(deprecateTarget.value.ak);
    snackbarStore.showSuccessMessage(t('oauth.manage.messages.deprecateSuccess'));
    closeDeprecateDialog();
    await loadApps();
  } catch (error) {
    const msg =
      error instanceof OauthApiError ? error.message : t('oauth.manage.errors.deprecateFailed');
    snackbarStore.showErrorMessage(msg);
  } finally {
    deprecating.value = false;
  }
}

// ── 初始化 ───────────────────────────────────────────
onMounted(loadApps);
</script>

<template>
  <div class="oauth-app-management pa-4">
    <ResponsivePageHeader
      :title="t('oauth.manage.title')"
      :subtitle="t('oauth.manage.subtitle')"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    />

    <!-- 统计卡片 -->
    <v-row class="mt-2 mb-4">
      <v-col cols="12" sm="4">
        <v-card variant="outlined">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ t('oauth.manage.stats.total') }}</div>
            <div class="text-h5 mt-1">{{ stats.total }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="outlined">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              {{ t('oauth.manage.stats.active') }}
            </div>
            <div class="text-h5 text-success mt-1">{{ stats.active }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="outlined">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">
              {{ t('oauth.manage.stats.deprecated') }}
            </div>
            <div class="text-h5 text-medium-emphasis mt-1">{{ stats.deprecated }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 数据表 -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="apps"
        :loading="loading"
        :no-data-text="t('oauth.manage.empty')"
        items-per-page="20"
      >
        <template #[`item.ak`]="{ item }">
          <code class="text-body-2">{{ item.ak }}</code>
        </template>
        <template #[`item.redirectUri`]="{ item }">
          <span class="text-caption text-medium-emphasis">{{ item.redirectUri }}</span>
        </template>
        <template #[`item.skMasked`]="{ item }">
          <code class="text-caption text-medium-emphasis">{{ item.skMasked }}</code>
        </template>
        <template #[`item.status`]="{ item }">
          <v-chip
            v-if="item.status === OauthAppStatus.ACTIVE"
            color="success"
            size="small"
            variant="tonal"
          >
            {{ t('oauth.manage.status.active') }}
          </v-chip>
          <v-chip v-else size="small" variant="tonal">
            {{ t('oauth.manage.status.deprecated') }}
          </v-chip>
        </template>
        <template #[`item.createdAt`]="{ item }">
          <span class="text-caption">{{ formatDate(item.createdAt) }}</span>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            color="error"
            variant="text"
            size="small"
            :disabled="item.status !== OauthAppStatus.ACTIVE"
            @click="openDeprecateDialog(item)"
          >
            {{ t('oauth.manage.actions.deprecate') }}
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建对话框 -->
    <v-dialog v-model="createDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ t('oauth.manage.create.title') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="createForm.ak"
            :label="t('oauth.manage.create.akLabel')"
            :hint="t('oauth.manage.create.akHint')"
            :rules="akRules"
            persistent-hint
            maxlength="8"
            class="mb-3"
          />
          <v-text-field
            v-model="createForm.redirectUri"
            :label="t('oauth.manage.create.redirectUriLabel')"
            :hint="t('oauth.manage.create.redirectUriHint')"
            :rules="redirectUriRules"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-model="createForm.name"
            :label="t('oauth.manage.create.nameLabel')"
            :hint="t('oauth.manage.create.nameHint', { ak: createForm.ak || '...' })"
            persistent-hint
            maxlength="120"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="creating" @click="createDialog = false">
            {{ t('oauth.manage.create.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            :disabled="!createFormValid"
            @click="submitCreate"
          >
            {{ t('oauth.manage.create.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 创建成功 / 一次性 sk 显示 -->
    <v-dialog v-model="createdDialog" max-width="640" persistent>
      <v-card>
        <v-card-title class="text-success">
          <v-icon icon="mdi-check-circle" class="mr-2" />
          {{ t('oauth.manage.created.title') }}
        </v-card-title>
        <v-card-text>
          <v-alert
            type="warning"
            variant="tonal"
            :text="t('oauth.manage.created.warning')"
            class="mb-4"
          />

          <div class="text-caption text-medium-emphasis mb-1">
            {{ t('oauth.manage.created.akLabel') }}
          </div>
          <v-text-field
            :model-value="createdApp?.ak ?? ''"
            readonly
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
          >
            <template #append-inner>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-content-copy"
                @click="createdApp && copyToClipboard(createdApp.ak)"
              />
            </template>
          </v-text-field>

          <div class="text-caption text-medium-emphasis mb-1">
            {{ t('oauth.manage.created.skLabel') }}
          </div>
          <v-text-field
            :model-value="createdApp?.sk ?? ''"
            readonly
            density="compact"
            variant="outlined"
            hide-details
            class="font-mono"
          >
            <template #append-inner>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-content-copy"
                @click="createdApp && copyToClipboard(createdApp.sk)"
              />
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="closeCreatedDialog">
            {{ t('oauth.manage.created.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 废弃确认（强制输入 ak）-->
    <v-dialog v-model="deprecateDialog" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-error">
          <v-icon icon="mdi-alert-octagon" class="mr-2" />
          {{ t('oauth.manage.deprecate.title') }}
        </v-card-title>
        <v-card-text>
          <v-alert
            type="error"
            variant="tonal"
            :text="t('oauth.manage.deprecate.warning')"
            class="mb-3"
          />
          <p class="text-body-2 mb-4">
            {{ t('oauth.manage.deprecate.consequences') }}
          </p>
          <p class="text-body-2 mb-2">
            {{ t('oauth.manage.deprecate.confirmHint', { ak: deprecateTarget?.ak ?? '' }) }}
          </p>
          <v-text-field
            v-model="deprecateConfirmInput"
            :placeholder="t('oauth.manage.deprecate.confirmPlaceholder')"
            variant="outlined"
            density="compact"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="deprecating" @click="closeDeprecateDialog">
            {{ t('oauth.manage.deprecate.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deprecating"
            :disabled="!canConfirmDeprecate"
            @click="submitDeprecate"
          >
            {{ t('oauth.manage.deprecate.confirmButton') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
