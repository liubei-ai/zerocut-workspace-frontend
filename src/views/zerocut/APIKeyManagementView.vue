<script setup lang="ts">
import { debounce } from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from '@/types/api';

import {
  createApiKey,
  deleteApiKey,
  generateOtt,
  getApiKeys,
  updateApiKey,
} from '@/api/workspaceApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';

const { t } = useI18n();

// 加载状态
const loading = ref(false);
const creating = ref(false);
const deleting = ref(false);
const updatingToken = ref(false);

// 对话框状态
const createTokenDialog = ref(false);
const deleteTokenDialog = ref(false);
const editTokenDialog = ref(false);
const selectedToken = ref<ApiKey | null>(null);
const createdTokenKey = ref<string>('');
const editForm = ref({
  name: '',
  expiresAt: '',
  creditsLimit: '',
});

// OTT state
const ottDialog = ref(false);
const ottGenerating = ref<number | null>(null);
const ottData = ref<{
  ott: string;
  expiresAt: string;
  expiresIn: number;
} | null>(null);
const countdown = ref(180);
let countdownTimer: NodeJS.Timeout | null = null;

// 新密钥表单
const newToken = ref({
  name: '',
  expiresAt: '',
  creditsLimit: '',
});

const headerPrimaryActions = computed(() => [
  {
    key: 'create',
    label: t('zerocut.apikeys.actions.create'),
    icon: 'mdi-plus',
    color: 'success',
    variant: 'flat' as const,
    loading: loading.value,
    onClick: () => (createTokenDialog.value = true),
  },
]);

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: t('common.refresh'),
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    loading: loading.value,
    onClick: loadTokens,
  },
]);

// 表单验证规则
const nameRules = [
  (v: string) => !!v || t('zerocut.apikeys.rules.nameRequired'),
  (v: string) => v.length >= 3 || t('zerocut.apikeys.rules.nameMin'),
  (v: string) => v.length <= 50 || t('zerocut.apikeys.rules.nameMax'),
];

const snackbarStore = useSnackbarStore();
const workspaceStore = useWorkspaceStore();

// 密钥列表
const tokens = ref<ApiKey[]>([]);

// 加载密钥列表
const loadTokens = async () => {
  loading.value = true;
  try {
    const workspaceId = workspaceStore.currentWorkspaceId;
    if (!workspaceId) {
      showError(t('zerocut.apikeys.errors.noWorkspace'));
      return;
    }
    const apikeys = await getApiKeys(workspaceId);
    tokens.value = apikeys;
  } catch (error) {
    console.error('加载密钥列表失败:', error);
    showError(t('zerocut.apikeys.errors.loadFail'));
  } finally {
    loading.value = false;
  }
};

// 统计数据
const stats = computed(() => ({
  total: tokens.value.length,
  active: tokens.value.filter(t => t.status === 'active').length,
  expired: tokens.value.filter(t => t.status !== 'active').length,
  totalUsage: tokens.value.length, // API Key类型没有usageCount字段，暂时使用总数
}));

// 创建密钥
const createToken = async () => {
  if (!newToken.value.name || newToken.value.name.length < 3) {
    showError(t('zerocut.apikeys.errors.invalidName'));
    return;
  }

  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) {
    showError(t('zerocut.apikeys.errors.noWorkspace'));
    return;
  }

  creating.value = true;
  try {
    const parsedCreateLimit = Number.parseInt(newToken.value.creditsLimit, 10);
    if (
      newToken.value.creditsLimit &&
      (!Number.isInteger(parsedCreateLimit) || parsedCreateLimit < 1)
    ) {
      showError(t('zerocut.apikeys.errors.invalidLimit'));
      return;
    }

    const request: CreateApiKeyRequest = {
      name: newToken.value.name,
      expiresAt: newToken.value.expiresAt
        ? new Date(newToken.value.expiresAt).toISOString()
        : undefined,
      creditsLimit: newToken.value.creditsLimit ? parsedCreateLimit : undefined,
    };

    const apiKeyInfo = await createApiKey(workspaceId, request);
    createdTokenKey.value = apiKeyInfo.apiKey || '';

    // 重新加载密钥列表
    await loadTokens();
    createTokenDialog.value = false;
    resetForm();
    showSuccess(t('zerocut.apikeys.messages.createSuccess'));
  } catch (error) {
    console.error('创建密钥失败:', error);
    showError(t('zerocut.apikeys.errors.createFail'));
  } finally {
    creating.value = false;
  }
};

// 删除密钥
const deleteToken = async () => {
  if (!selectedToken.value) return;

  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) {
    showError(t('zerocut.apikeys.errors.noWorkspace'));
    return;
  }

  deleting.value = true;
  try {
    await deleteApiKey(workspaceId, selectedToken.value!.id);
    await loadTokens();
    showSuccess(t('zerocut.apikeys.messages.deleteSuccess'));
  } catch (error) {
    console.error('删除密钥失败:', error);
    showError(t('zerocut.apikeys.errors.deleteFail'));
  } finally {
    deleting.value = false;
    deleteTokenDialog.value = false;
    selectedToken.value = null;
  }
};

// 重置表单
const resetForm = () => {
  newToken.value = {
    name: '',
    expiresAt: '',
    creditsLimit: '',
  };
};

const formatDateInput = (value: string | null | undefined) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const openEditTokenDialog = (token: ApiKey) => {
  selectedToken.value = token;
  editForm.value.name = token.name || '';
  editForm.value.expiresAt = formatDateInput(token.expiresAt);
  editForm.value.creditsLimit =
    token.creditsLimit == null ? '' : String(Math.trunc(token.creditsLimit));
  editTokenDialog.value = true;
};

const saveTokenEdits = async () => {
  if (!selectedToken.value) return;

  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) {
    showError(t('zerocut.apikeys.errors.noWorkspace'));
    return;
  }

  const trimmedName = editForm.value.name.trim();
  if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 50) {
    showError(t('zerocut.apikeys.errors.invalidName'));
    return;
  }

  const nextLimit = Number.parseInt(editForm.value.creditsLimit, 10);
  if (!Number.isInteger(nextLimit) || nextLimit < 1) {
    showError(t('zerocut.apikeys.errors.invalidLimit'));
    return;
  }

  const currentLimit = selectedToken.value.creditsLimit;
  if (currentLimit != null && nextLimit < currentLimit) {
    showError(t('zerocut.apikeys.errors.limitOnlyIncrease'));
    return;
  }

  updatingToken.value = true;
  try {
    const payload: UpdateApiKeyRequest = {
      name: trimmedName,
      creditsLimit: nextLimit,
      expiresAt: editForm.value.expiresAt ? new Date(editForm.value.expiresAt).toISOString() : null,
    };
    await updateApiKey(workspaceId, selectedToken.value.id, payload);
    await loadTokens();
    showSuccess(t('zerocut.apikeys.messages.updateSuccess'));
    editTokenDialog.value = false;
    selectedToken.value = null;
  } catch (error) {
    console.error('更新密钥失败:', error);
    showError(t('zerocut.apikeys.errors.updateFail'));
  } finally {
    updatingToken.value = false;
  }
};

// 复制密钥
const copyToken = async (token: ApiKey) => {
  try {
    const keyToCopy = token.apiKey || token.apiKeyPrefix;
    await navigator.clipboard.writeText(keyToCopy);
    showSuccess(t('zerocut.apikeys.messages.copySuccess'));
  } catch (error) {
    console.error('复制失败:', error);
    showError(t('zerocut.apikeys.errors.copyFail'));
  }
};

const copyMCPConfig = async (token: ApiKey) => {
  const mcpConfigTemplate = `
{
  "mcpServers": {
    "cerevox-zerocut": {
      "command": "npx",
      "args": [
        "-y",
        "zerocut"
      ],
      "env": {
        "CEREVOX_API_KEY": "${token.apiKey || token.apiKeyPrefix}",
        "ZEROCUT_PROJECT_CWD": "\${workspaceFolder}",
        "RUN_MCP_TIMEOUT_MS": "900000"
      }
    }
  }
}`;
  try {
    await navigator.clipboard.writeText(mcpConfigTemplate);
    showSuccess(t('zerocut.apikeys.messages.copyMcpSuccess'));
  } catch (error) {
    console.error('复制失败:', error);
    showError(t('zerocut.apikeys.errors.copyMcpFail'));
  }
};

/**
 * 生成 OTT
 */
const handleGenerateOtt = debounce(async (apiKeyId: number) => {
  if (ottGenerating.value) return;

  ottGenerating.value = apiKeyId;

  try {
    const workspaceId = workspaceStore.currentWorkspaceId;
    if (!workspaceId) {
      showError(t('zerocut.apikeys.errors.noWorkspace'));
      return;
    }

    const result = await generateOtt(workspaceId, apiKeyId);
    ottData.value = result;
    ottDialog.value = true;
    startCountdown();
  } catch (error: any) {
    console.error('Failed to generate OTT:', error);
    showError(error.message || '生成临时令牌失败');
  } finally {
    ottGenerating.value = null;
  }
}, 300);

/**
 * 启动倒计时
 */
const startCountdown = () => {
  countdown.value = 180;
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!);
      countdownTimer = null;
    }
  }, 1000);
};

/**
 * 关闭 OTT 弹窗
 */
const closeOttDialog = () => {
  ottDialog.value = false;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

/**
 * 复制 OTT
 */
const copyOtt = async () => {
  if (!ottData.value) return;
  try {
    await navigator.clipboard.writeText(ottData.value.ott);
    showSuccess(t('zerocut.apikeys.ott.ottCopied'));
  } catch (error) {
    console.error('Failed to copy OTT:', error);
  }
};

/**
 * 使用示例
 */
const usageExample = computed(() => {
  if (!ottData.value) return '';
  // 获取 API Base URL
  let apiUrl = import.meta.env.VITE_API2_BASE_URL || window.location.origin;
  // 如果是相对路径（开发环境），使用 localhost:9527
  if (apiUrl.startsWith('/')) {
    apiUrl = `http://localhost:9527${apiUrl}`;
  }
  return `curl -X POST ${apiUrl}/open/ott/exchange \\
  -H "Content-Type: application/json" \\
  -d '{"ott":"${ottData.value.ott}"}'`;
});

/**
 * 复制使用示例
 */
const copyExample = async () => {
  try {
    await navigator.clipboard.writeText(usageExample.value);
    showSuccess(t('zerocut.apikeys.ott.ottCopied'));
  } catch (error) {
    console.error('Failed to copy example:', error);
  }
};

// 显示错误提示
const showError = (message: string) => {
  snackbarStore.showErrorMessage(message);
};

// 显示成功提示
const showSuccess = (message: string) => {
  snackbarStore.showSuccessMessage(message);
};

// 组件挂载时加载数据
onMounted(() => {
  loadTokens();
});

/**
 * 清理定时器（组件卸载时）
 */
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
    case 'revoked':
      return 'warning';
    default:
      return 'grey';
  }
};

const formatCredits = (value: number | null | undefined) =>
  value == null ? '--' : Math.max(0, Number(value)).toLocaleString();

const getLimitLabel = (token: ApiKey | null) => {
  if (!token) return '--';
  return token.creditsLimit == null
    ? t('zerocut.apikeys.limit.unlimited')
    : formatCredits(token.creditsLimit);
};

const getConsumedLabel = (token: ApiKey | null) => {
  if (!token) return '--';
  return formatCredits(token.creditsConsumed);
};

const getRemainingLabel = (token: ApiKey | null) => {
  if (!token) return '--';
  if (token.creditsLimit == null) {
    return t('zerocut.apikeys.limit.unlimited');
  }
  const remaining = Math.max(0, token.creditsLimit - token.creditsConsumed);
  return remaining.toLocaleString();
};

const getRemainingPercent = (token: ApiKey) => {
  if (token.creditsLimit == null || token.creditsLimit <= 0) return null;
  const remaining = Math.max(0, token.creditsLimit - token.creditsConsumed);
  return Math.max(0, Math.min(100, Math.round((remaining / token.creditsLimit) * 100)));
};

const getUsedPercent = (token: ApiKey) => {
  if (token.creditsLimit == null || token.creditsLimit <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((token.creditsConsumed / token.creditsLimit) * 100)));
};
</script>

<template>
  <div>
    <ResponsivePageHeader
      :title="t('zerocut.apikeys.title')"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    >
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">{{ t('zerocut.apikeys.subtitle') }}</p>
      </template>
    </ResponsivePageHeader>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2"> mdi-key-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.total }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ t('zerocut.apikeys.stats.total') }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="success" class="mb-2"> mdi-check-circle-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.active }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ t('zerocut.apikeys.stats.active') }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="error" class="mb-2"> mdi-clock-alert-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.expired }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ t('zerocut.apikeys.stats.expired') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 密钥列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        {{ t('zerocut.apikeys.table.title') }}
      </v-card-title>

      <v-data-table
        :headers="[
          {
            title: t('zerocut.apikeys.table.columns.name'),
            key: 'name',
            sortable: true,
            width: '160px',
          },
          {
            title: t('zerocut.apikeys.table.columns.key'),
            key: 'key',
            sortable: false,
            width: '400px',
          },
          {
            title: t('zerocut.apikeys.table.columns.quota'),
            key: 'quota',
            sortable: false,
            width: '30px',
          },
          { title: t('zerocut.apikeys.table.columns.status'), key: 'status', sortable: true },
          { title: t('zerocut.apikeys.table.columns.expiresAt'), key: 'expiresAt', sortable: true },
          { title: t('zerocut.apikeys.table.columns.actions'), key: 'actions', sortable: false },
        ]"
        :items="tokens"
        item-value="id"
        class="elevation-0"
        :loading="loading"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #item.key="{ item }">
          <div class="d-flex align-center">
            <span class="text-caption mr-2">{{ maskApiKey(item.apiKeyPrefix) }}</span>
            <v-btn icon="mdi-key" size="x-small" variant="text" @click="copyToken(item)"></v-btn>
            <v-btn
              icon="mdi-robot"
              size="x-small"
              variant="text"
              :tooltip="t('zerocut.apikeys.copyMCP.tooltip')"
              @click="copyMCPConfig(item)"
              >MCP</v-btn
            >
            <v-btn
              icon="mdi-clock-fast"
              size="x-small"
              variant="text"
              :loading="ottGenerating === item.id"
              :disabled="item.status !== 'active' || ottGenerating === item.id"
              @click="handleGenerateOtt(item.id)"
            >
              <v-icon>mdi-clock-fast</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ t('zerocut.apikeys.ott.generateOtt') }}
              </v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #item.lastUsedAt="{ item }">
          {{ item.lastUsedAt || t('zerocut.apikeys.neverUsed') }}
        </template>

        <template #item.quota="{ item }">
          <div class="quota-cell">
            <div v-if="getUsedPercent(item) !== null">
              <div class="quota-progress-label">
                {{ getConsumedLabel(item) }} / {{ getLimitLabel(item) }}
              </div>
              <v-progress-linear
                :model-value="getUsedPercent(item) || 0"
                color="success"
                height="8"
                rounded
              ></v-progress-linear>
            </div>
            <div v-else class="quota-progress-label quota-unlimited">
              {{ t('zerocut.apikeys.limit.unlimited') }}
            </div>
            <v-tooltip activator="parent" location="top" max-width="420">
              <div class="quota-tooltip">
                <div class="quota-row">
                  <span>{{ t('zerocut.apikeys.quota.used') }}:</span>
                  <strong>{{ getConsumedLabel(item) }}</strong>
                </div>
                <div class="quota-row">
                  <span>{{ t('zerocut.apikeys.quota.remaining') }}:</span>
                  <strong>
                    {{ getRemainingLabel(item) }}
                    <template v-if="getRemainingPercent(item) !== null">
                      ({{ getRemainingPercent(item) }}%)
                    </template>
                  </strong>
                </div>
                <div class="quota-row">
                  <span>{{ t('zerocut.apikeys.quota.total') }}:</span>
                  <strong>{{ getLimitLabel(item) }}</strong>
                </div>
              </div>
            </v-tooltip>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{
              item.status === 'active'
                ? t('zerocut.apikeys.status.active')
                : item.status === 'inactive'
                  ? t('zerocut.apikeys.status.disabled')
                  : t('zerocut.apikeys.status.revoked')
            }}
          </v-chip>
        </template>

        <template #item.expiresAt="{ item }">
          {{ item.expiresAt ? formatDate(item.expiresAt) : t('zerocut.apikeys.neverExpire') }}
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-pencil-outline"
            @click="openEditTokenDialog(item)"
          >
            {{ t('zerocut.apikeys.actions.edit') }}
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建密钥对话框 -->
    <v-dialog v-model="createTokenDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus</v-icon>
          {{ t('zerocut.apikeys.dialog.create.title') }}
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newToken.name"
              :label="t('zerocut.apikeys.dialog.create.nameLabel')"
              :placeholder="t('zerocut.apikeys.dialog.create.namePlaceholder')"
              :rules="nameRules"
              required
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="newToken.expiresAt"
              :label="t('zerocut.apikeys.dialog.create.expireLabel')"
              type="date"
              :hint="t('zerocut.apikeys.dialog.create.expireHint')"
              persistent-hint
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="newToken.creditsLimit"
              :label="t('zerocut.apikeys.dialog.create.limitLabel')"
              type="number"
              min="1"
              :hint="t('zerocut.apikeys.dialog.create.limitHint')"
              persistent-hint
              class="mb-2"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              createTokenDialog = false;
              resetForm();
            "
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="createToken"
            :disabled="!newToken.name || creating"
            :loading="creating"
          >
            {{ t('common.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editTokenDialog" max-width="520">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-pencil-outline</v-icon>
          {{ t('zerocut.apikeys.dialog.edit.title') }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="editForm.name"
            :label="t('zerocut.apikeys.dialog.edit.nameLabel')"
            :rules="nameRules"
            required
            class="mb-3"
          ></v-text-field>

          <v-text-field
            v-model="editForm.expiresAt"
            :label="t('zerocut.apikeys.dialog.edit.expireLabel')"
            type="date"
            :hint="t('zerocut.apikeys.dialog.edit.expireHint')"
            persistent-hint
            class="mb-3"
          ></v-text-field>

          <div class="text-caption text-medium-emphasis mb-4">
            {{ t('zerocut.apikeys.dialog.edit.limitHint') }}
          </div>

          <v-text-field
            v-model="editForm.creditsLimit"
            :label="t('zerocut.apikeys.dialog.edit.limitLabel')"
            type="number"
            min="1"
            variant="outlined"
          ></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              editTokenDialog = false;
              selectedToken = null;
            "
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="primary" variant="flat" :loading="updatingToken" @click="saveTokenEdits">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteTokenDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          {{ t('zerocut.apikeys.dialog.delete.title') }}
        </v-card-title>

        <v-card-text>
          {{ t('zerocut.apikeys.dialog.delete.content', { name: selectedToken?.name }) }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              deleteTokenDialog = false;
              selectedToken = null;
            "
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" @click="deleteToken" :loading="deleting">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- OTT Dialog -->
    <v-dialog v-model="ottDialog" max-width="700" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-clock-fast</v-icon>
          {{ t('zerocut.apikeys.ott.ottTitle') }}
          <v-spacer></v-spacer>
          <v-chip color="warning" size="small" variant="tonal">
            {{ Math.floor(countdown / 60) }}:{{ String(countdown % 60).padStart(2, '0') }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            {{ t('zerocut.apikeys.ott.ottWarning') }}
          </v-alert>

          <v-text-field
            :model-value="ottData?.ott"
            :label="t('zerocut.apikeys.ott.ottToken')"
            readonly
            variant="outlined"
            class="mb-4"
          >
            <template #append-inner>
              <v-btn icon="mdi-content-copy" size="small" variant="text" @click="copyOtt"></v-btn>
            </template>
          </v-text-field>

          <v-card variant="outlined" class="pa-3 mb-3">
            <div class="text-subtitle-2 d-flex align-center mb-2">
              <v-icon class="mr-2" size="20">mdi-code-braces</v-icon>
              {{ t('zerocut.apikeys.ott.ottUsageExample') }}
            </div>
            <pre
              class="text-caption pa-2 rounded"
              style="
                background-color: rgba(0, 0, 0, 0.05);
                overflow-x: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
              "
            ><code>{{ usageExample }}</code></pre>
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-content-copy"
              class="mt-2"
              @click="copyExample"
            >
              {{ t('common.copy') }}
            </v-btn>
          </v-card>

          <v-alert type="info" variant="tonal" density="compact">
            {{ t('zerocut.apikeys.ott.ottDescription') }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeOttDialog">
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.quota-cell {
  min-width: 240px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.04);
}

.quota-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.quota-progress-wrap {
  margin-top: 8px;
}

.quota-progress-label {
  text-align: center;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 12px;
}

.quota-unlimited {
  margin-bottom: 0;
}

.quota-tooltip {
  min-width: 260px;
  padding: 4px 2px;
}
</style>
