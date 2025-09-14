<script setup lang="ts">
import { createApiKey, deleteApiKey, getApiKeys } from '@/api/workspaceApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ApiKey, CreateApiKeyRequest } from '@/types/api';
import { ApiWrapper } from '@/utils/apiWrapper';
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

// 新令牌表单
const newToken = ref({
  name: '',
  description: '',
  permissions: [] as string[],
  expiresAt: null as string | null,
});

// 表单验证规则
const nameRules = [
  (v: string) => !!v || '令牌名称不能为空',
  (v: string) => v.length >= 3 || '令牌名称至少需要3个字符',
  (v: string) => v.length <= 50 || '令牌名称不能超过50个字符',
];

const descriptionRules = [(v: string) => !v || v.length <= 200 || '描述不能超过200个字符'];

// 权限选项（暂时隐藏）
// const permissionOptions = [
//   { value: 'read', title: '读取权限', description: '查看数据和资源' },
//   { value: 'write', title: '写入权限', description: '创建和修改资源' },
//   { value: 'delete', title: '删除权限', description: '删除资源' },
//   { value: 'admin', title: '管理员权限', description: '完全访问权限' },
// ];

// 使用工作空间store
const workspaceStore = useWorkspaceStore();

// 令牌列表
const tokens = ref<ApiKey[]>([]);

// 加载令牌列表
const loadTokens = async () => {
  loading.value = true;
  try {
    const workspaceId = workspaceStore.currentWorkspaceId;
    if (!workspaceId) {
      showError('请先选择工作空间');
      return;
    }
    const result = await ApiWrapper.call(() => getApiKeys(workspaceId));
    if (result.success && result.data) {
      tokens.value = result.data.data || [];
      showSuccess('令牌列表加载成功');
    } else {
      showError('加载令牌列表失败');
    }
  } catch (error) {
    console.error('加载令牌列表失败:', error);
    showError('加载令牌列表时发生错误');
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

// 创建令牌
const createToken = async () => {
  if (!newToken.value.name || newToken.value.name.length < 3) {
    showError('请输入有效的令牌名称（至少3个字符）');
    return;
  }

  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) {
    showError('请先选择工作空间');
    return;
  }

  creating.value = true;
  try {
    const request: CreateApiKeyRequest = {
      name: newToken.value.name,
      description: newToken.value.description,
    };

    const result = await ApiWrapper.call(() => createApiKey(workspaceId, request));
    if (result.success && result.data) {
      // 保存创建的API密钥用于显示
      createdTokenKey.value = result.data.data?.apiKey || '';
      // 重新加载令牌列表
      await loadTokens();
      createTokenDialog.value = false;
      resetForm();
      showSuccess('令牌创建成功');
    } else {
      showError('创建令牌失败');
    }
  } catch (error) {
    console.error('创建令牌失败:', error);
    showError('创建令牌时发生错误');
  } finally {
    creating.value = false;
  }
};

// 删除令牌
const deleteToken = async () => {
  if (!selectedToken.value) return;

  const workspaceId = workspaceStore.currentWorkspaceId;
  if (!workspaceId) {
    showError('请先选择工作空间');
    return;
  }

  deleting.value = true;
  try {
    const result = await ApiWrapper.call(() => deleteApiKey(workspaceId, selectedToken.value!.id));
    if (result.success) {
      // 重新加载令牌列表
      await loadTokens();
      showSuccess('令牌删除成功');
    } else {
      showError('删除令牌失败');
    }
  } catch (error) {
    console.error('删除令牌失败:', error);
    showError('删除令牌时发生错误');
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
    expiresAt: null,
  };
};

// 复制令牌
const copyToken = async (token: ApiKey) => {
  try {
    const keyToCopy = token.apiKey || token.apiKeyPrefix;
    await navigator.clipboard.writeText(keyToCopy);
    showSuccess('令牌已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    showError('复制令牌失败');
  }
};

// 显示错误提示
const showError = (message: string) => {
  // 这里可以集成 Vuetify 的 snackbar 或其他提示组件
  console.error(message);
};

// 显示成功提示
const showSuccess = (message: string) => {
  // 这里可以集成 Vuetify 的 snackbar 或其他提示组件
  console.log(message);
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

// 获取权限标签
const getPermissionLabel = (permission: string) => {
  const option = permissionOptions.find(p => p.value === permission);
  return option ? option.title : permission;
};

// 打开删除对话框
const openDeleteDialog = (token: ApiKey) => {
  selectedToken.value = token;
  deleteTokenDialog.value = true;
};
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">令牌管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">管理您的API访问令牌和权限设置</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createTokenDialog = true"
          :loading="loading"
        >
          创建令牌
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="loadTokens" :loading="loading">
          刷新
        </v-btn>
      </div>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2"> mdi-key-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.total }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总令牌数</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="success" class="mb-2"> mdi-check-circle-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.active }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">活跃令牌</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="error" class="mb-2"> mdi-clock-alert-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.expired }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">已过期</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="info" class="mb-2"> mdi-chart-bar </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.totalUsage.toLocaleString() }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总调用次数</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 令牌列表 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        令牌列表
      </v-card-title>

      <v-data-table
        :headers="[
          { title: '名称', key: 'name', sortable: true },
          { title: '描述', key: 'description', sortable: false },
          { title: '令牌', key: 'key', sortable: false },
          { title: '权限', key: 'permissions', sortable: false },
          { title: '创建时间', key: 'createdAt', sortable: true },
          { title: '最后使用', key: 'lastUsed', sortable: true },
          { title: '过期时间', key: 'expiresAt', sortable: true },
          { title: '状态', key: 'status', sortable: true },
          { title: '使用次数', key: 'usageCount', sortable: true },
          { title: '操作', key: 'actions', sortable: false },
        ]"
        :items="tokens"
        item-value="id"
        class="elevation-0"
        :loading="loading"
      >
        <template #item.key="{ item }">
          <div class="d-flex align-center">
            <code class="text-caption mr-2">{{ item.apiKeyPrefix }}</code>
            <v-btn
              icon="mdi-content-copy"
              size="x-small"
              variant="text"
              @click="copyToken(item)"
            ></v-btn>
          </div>
        </template>

        <template #item.permissions="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="permission in item.permissions"
              :key="permission"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ getPermissionLabel(permission) }}
            </v-chip>
          </div>
        </template>

        <template #item.lastUsed="{ item }">
          {{ item.lastUsedAt || '从未使用' }}
        </template>

        <template #item.expiresAt="{ item }">
          {{ item.expiresAt || '永不过期' }}
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{
              item.status === 'active' ? '活跃' : item.status === 'expired' ? '已过期' : '已禁用'
            }}
          </v-chip>
        </template>

        <template #item.usageCount>
          {{ '暂无数据' }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn icon="mdi-pencil" size="small" variant="text" color="primary"></v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="openDeleteDialog(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建令牌对话框 -->
    <v-dialog v-model="createTokenDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus</v-icon>
          创建新令牌
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newToken.name"
              label="令牌名称"
              placeholder="输入令牌名称"
              :rules="nameRules"
              required
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="newToken.description"
              label="描述"
              placeholder="输入令牌用途描述"
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
              label="过期时间（可选）"
              type="date"
              hint="留空表示永不过期"
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
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="createToken"
            :disabled="!newToken.name || creating"
            :loading="creating"
          >
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteTokenDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          确认删除
        </v-card-title>

        <v-card-text> 确定要删除令牌 "{{ selectedToken?.name }}" 吗？此操作不可撤销。 </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              deleteTokenDialog = false;
              selectedToken = null;
            "
          >
            取消
          </v-btn>
          <v-btn color="error" variant="flat" @click="deleteToken" :loading="deleting">
            删除
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
