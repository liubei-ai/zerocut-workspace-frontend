<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 对话框状态
const createTokenDialog = ref(false);
const deleteTokenDialog = ref(false);
const selectedToken = ref<any>(null);

// 新令牌表单
const newToken = ref({
  name: '',
  description: '',
  permissions: ['read'],
  expiresAt: null as string | null,
});

// 权限选项
const permissionOptions = [
  { value: 'read', title: '读取权限', description: '查看数据和资源' },
  { value: 'write', title: '写入权限', description: '创建和修改资源' },
  { value: 'delete', title: '删除权限', description: '删除资源' },
  { value: 'admin', title: '管理员权限', description: '完全访问权限' },
];

// 令牌列表
const tokens = ref([
  {
    id: 1,
    name: '生产环境API',
    description: '用于生产环境的API访问',
    key: 'zc_prod_****************************',
    permissions: ['read', 'write'],
    createdAt: '2024-01-15',
    lastUsed: '2024-01-20',
    expiresAt: '2024-12-31',
    status: 'active',
    usageCount: 1247,
  },
  {
    id: 2,
    name: '测试环境API',
    description: '用于开发和测试',
    key: 'zc_test_****************************',
    permissions: ['read'],
    createdAt: '2024-01-10',
    lastUsed: '2024-01-19',
    expiresAt: null,
    status: 'active',
    usageCount: 456,
  },
  {
    id: 3,
    name: '临时访问令牌',
    description: '临时项目使用',
    key: 'zc_temp_****************************',
    permissions: ['read', 'write'],
    createdAt: '2024-01-01',
    lastUsed: '2024-01-05',
    expiresAt: '2024-01-25',
    status: 'expired',
    usageCount: 89,
  },
] as Array<{
  id: number;
  name: string;
  description: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  status: string;
  usageCount: number;
}>);

// 统计数据
const stats = computed(() => ({
  total: tokens.value.length,
  active: tokens.value.filter(t => t.status === 'active').length,
  expired: tokens.value.filter(t => t.status === 'expired').length,
  totalUsage: tokens.value.reduce((sum, t) => sum + t.usageCount, 0),
}));

// 创建令牌
const createToken = () => {
  // 模拟创建令牌
  const newTokenData = {
    id: Date.now(),
    name: newToken.value.name,
    description: newToken.value.description,
    key: `zc_${Date.now()}_****************************`,
    permissions: newToken.value.permissions,
    createdAt: new Date().toISOString().split('T')[0],
    lastUsed: null,
    expiresAt: newToken.value.expiresAt,
    status: 'active',
    usageCount: 0,
  };

  tokens.value.unshift(newTokenData);
  createTokenDialog.value = false;
  resetForm();
};

// 删除令牌
const deleteToken = () => {
  if (selectedToken.value) {
    const index = tokens.value.findIndex(t => t.id === selectedToken.value.id);
    if (index > -1) {
      tokens.value.splice(index, 1);
    }
  }
  deleteTokenDialog.value = false;
  selectedToken.value = null;
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
const copyToken = (token: any) => {
  navigator.clipboard.writeText(token.key);
  // 这里可以添加提示消息
};

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
const openDeleteDialog = (token: any) => {
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
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createTokenDialog = true">
        创建令牌
      </v-btn>
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
      >
        <template #item.key="{ item }">
          <div class="d-flex align-center">
            <code class="text-caption mr-2">{{ item.key }}</code>
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
          {{ item.lastUsed || '从未使用' }}
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

        <template #item.usageCount="{ item }">
          {{ item.usageCount.toLocaleString() }}
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
              required
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="newToken.description"
              label="描述"
              placeholder="输入令牌用途描述"
              rows="3"
              class="mb-4"
            ></v-textarea>

            <v-select
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
            </v-select>

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
          <v-btn color="primary" variant="flat" @click="createToken" :disabled="!newToken.name">
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
          <v-btn color="error" variant="flat" @click="deleteToken"> 删除 </v-btn>
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
