<script setup lang="ts">
import { createApiKey, deleteApiKey, getApiKeys } from '@/api/workspaceApi';
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ApiKey, CreateApiKeyRequest } from '@/types/api';
import { formatDate } from '@/utils/date';
import { maskApiKey } from '@/utils/stringUtils';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 加载状态
const loading = ref(false);
const creating = ref(false);
const deleting = ref(false);

// 对话框状态
const createTokenDialog = ref(false);
const deleteTokenDialog = ref(false);
const selectedToken = ref<ApiKey | null>(null);
const createdTokenKey = ref<string>('');

// 新密钥表单
const newToken = ref({
  name: '',
  description: '',
  permissions: [] as string[],
  expiresAt: '',
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

const descriptionRules = [
  (v: string) => !v || v.length <= 200 || t('zerocut.apikeys.rules.descMax'),
];

// 权限选项（暂时隐藏）
// const permissionOptions = [
//   { value: 'read', title: '读取权限', description: '查看数据和资源' },
//   { value: 'write', title: '写入权限', description: '创建和修改资源' },
//   { value: 'delete', title: '删除权限', description: '删除资源' },
//   { value: 'admin', title: '管理员权限', description: '完全访问权限' },
// ];

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
  expired: tokens.value.filter(t => t.status === 'expired').length,
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
    const request: CreateApiKeyRequest = {
      name: newToken.value.name,
      description: newToken.value.description,
      expiresAt: newToken.value.expiresAt
        ? new Date(newToken.value.expiresAt).toISOString()
        : undefined,
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
    description: '',
    permissions: ['read'],
    expiresAt: '',
  };
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
        "ZEROCUT_PROJECT_CWD": "\${workspaceFolder}"
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

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'expired':
      return 'error';
    case 'disabled':
      return 'warning';
    default:
      return 'grey';
  }
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
          { title: t('zerocut.apikeys.table.columns.name'), key: 'name', sortable: true },
          {
            title: t('zerocut.apikeys.table.columns.description'),
            key: 'description',
            sortable: false,
          },
          {
            title: t('zerocut.apikeys.table.columns.key'),
            key: 'key',
            sortable: false,
            width: '240px',
          },
          { title: t('zerocut.apikeys.table.columns.creator'), key: 'creator', sortable: true },
          { title: t('zerocut.apikeys.table.columns.createdAt'), key: 'createdAt', sortable: true },
          { title: t('zerocut.apikeys.table.columns.expiresAt'), key: 'expiresAt', sortable: true },
          { title: t('zerocut.apikeys.table.columns.status'), key: 'status', sortable: true },
          // { title: t('zerocut.apikeys.table.columns.actions'), key: 'actions', sortable: false },
          // { title: t('zerocut.apikeys.table.columns.lastUsedAt'), key: 'lastUsedAt', sortable: true },
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
            <code class="text-caption mr-2">{{ maskApiKey(item.apiKeyPrefix) }}</code>
            <v-btn icon="mdi-key" size="x-small" variant="text" @click="copyToken(item)"></v-btn>
            <v-btn
              icon="mdi-robot"
              size="x-small"
              variant="text"
              :tooltip="t('zerocut.apikeys.copyMCP.tooltip')"
              @click="copyMCPConfig(item)"
              >MCP</v-btn
            >
          </div>
        </template>

        <template #item.creator="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="mr-2">
              <v-icon icon="mdi-account" size="16"></v-icon>
            </v-avatar>
            <span class="text-body-2">
              {{
                item.creator?.username || item.creator?.email || t('zerocut.apikeys.unknownUser')
              }}
            </span>
          </div>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.lastUsedAt="{ item }">
          {{ item.lastUsedAt || t('zerocut.apikeys.neverUsed') }}
        </template>

        <template #item.expiresAt="{ item }">
          {{ item.expiresAt ? formatDate(item.expiresAt) : t('zerocut.apikeys.neverExpire') }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{
              item.status === 'active'
                ? t('zerocut.apikeys.status.active')
                : item.status === 'expired'
                  ? t('zerocut.apikeys.status.expired')
                  : t('zerocut.apikeys.status.disabled')
            }}
          </v-chip>
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

            <v-textarea
              v-model="newToken.description"
              :label="t('zerocut.apikeys.dialog.create.descLabel')"
              :placeholder="t('zerocut.apikeys.dialog.create.descPlaceholder')"
              :rules="descriptionRules"
              rows="3"
              class="mb-4"
            ></v-textarea>

            <!-- 权限选择暂时隐藏 -->
            <!-- <v-select
              v-model="newToken.permissions"
              :items="permissionOptions"
              item-title="title"
              item-value="value"
              label="权限"
              multiple
              chips
              class="mb-4"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    {{ item.raw.description }}
                  </template>
                </v-list-item>
              </template>
            </v-select> -->

            <v-text-field
              v-model="newToken.expiresAt"
              :label="t('zerocut.apikeys.dialog.create.expireLabel')"
              type="date"
              :hint="t('zerocut.apikeys.dialog.create.expireHint')"
              persistent-hint
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
</style>
