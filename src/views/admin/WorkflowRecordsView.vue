<script setup lang="ts">
import {
  type CozeWorkflowItem,
  getWorkflowRecords,
  listCozeWorkflows,
  saveWorkflowMetadata,
  type WorkflowRecordItem,
} from '@/api/adminApi';
import { formatDate } from '@/utils/date';
import { computed, onMounted, ref } from 'vue';

// Tab 状态
const activeTab = ref('records');

// ========== 工作流记录相关 ==========
const recordsLoading = ref(false);
const recordsError = ref('');
const recordItems = ref<WorkflowRecordItem[]>([]);
const recordsPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
const recordFilters = ref<{ workspaceId: string; executeId: string }>({
  workspaceId: '',
  executeId: '',
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'info';
    case 'success':
      return 'success';
    case 'fail':
      return 'error';
    default:
      return 'primary';
  }
};

const isExpired = (expiresAt?: string | Date) => {
  if (!expiresAt) return false;
  const ts = new Date(expiresAt).getTime();
  return Number.isFinite(ts) ? ts < Date.now() : false;
};

const fetchRecords = async () => {
  try {
    recordsLoading.value = true;
    recordsError.value = '';
    const params = {
      executeId: (recordFilters.value.executeId || '').trim() || undefined,
      workspaceId: (recordFilters.value.workspaceId || '').trim() || undefined,
      page: recordsPagination.value.page,
      limit: recordsPagination.value.limit,
    };
    const resp = await getWorkflowRecords(params);
    recordItems.value = resp.list;
    recordsPagination.value = {
      page: resp.page,
      limit: resp.limit,
      total: resp.total,
      totalPages: resp.totalPages,
    };
  } catch {
    recordsError.value = '查询失败';
  } finally {
    recordsLoading.value = false;
  }
};

const handleRecordsPageChange = (page: number) => {
  recordsPagination.value.page = page;
  fetchRecords();
};

const handleRecordsItemsPerPageChange = (itemsPerPage: number) => {
  recordsPagination.value.limit = itemsPerPage;
  recordsPagination.value.page = 1;
  fetchRecords();
};

const resetRecordsFilters = () => {
  recordFilters.value.executeId = '';
  recordFilters.value.workspaceId = '';
  recordsPagination.value.page = 1;
  fetchRecords();
};

// ========== 工作流列表相关 ==========
const workflowsLoading = ref(false);
const workflowsError = ref('');
const workflowItems = ref<CozeWorkflowItem[]>([]);
const workflowsPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

// 元数据编辑 Dialog
const metadataDialog = ref(false);
const editingWorkflow = ref<CozeWorkflowItem | null>(null);
const metadataJsonStr = ref('');
const metadataError = ref('');
const savingMetadata = ref(false);

const fetchWorkflows = async () => {
  try {
    workflowsError.value = '';
    workflowsLoading.value = true;
    const resp = await listCozeWorkflows({
      page: workflowsPagination.value.page,
      limit: workflowsPagination.value.limit,
    });
    const { list, ...pagination } = resp;
    workflowItems.value = list;
    workflowsPagination.value = pagination;
  } catch (err) {
    workflowsError.value = '查询失败';
    console.error('获取工作流列表失败:', err);
  } finally {
    workflowsLoading.value = false;
  }
};

const handleWorkflowsPageChange = (page: number) => {
  workflowsPagination.value.page = page;
  fetchWorkflows();
};

const handleWorkflowsItemsPerPageChange = (itemsPerPage: number) => {
  workflowsPagination.value.limit = itemsPerPage;
  workflowsPagination.value.page = 1;
  fetchWorkflows();
};

const openMetadataDialog = (workflow: CozeWorkflowItem) => {
  editingWorkflow.value = workflow;
  metadataJsonStr.value = workflow.metadata ? JSON.stringify(workflow.metadata, null, 2) : '{}';
  metadataError.value = '';
  metadataDialog.value = true;
};

const closeMetadataDialog = () => {
  metadataDialog.value = false;
  editingWorkflow.value = null;
  metadataJsonStr.value = '';
  metadataError.value = '';
};

const validateAndSaveMetadata = async () => {
  if (!editingWorkflow.value) return;

  try {
    // 验证 JSON 格式
    const metadata = JSON.parse(metadataJsonStr.value);
    metadataError.value = '';
    savingMetadata.value = true;

    await saveWorkflowMetadata(editingWorkflow.value.workflowId, metadata);

    // 更新本地数据
    const index = workflowItems.value.findIndex(
      w => w.workflowId === editingWorkflow.value!.workflowId
    );
    if (index !== -1) {
      workflowItems.value[index].metadata = metadata;
    }

    closeMetadataDialog();
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      metadataError.value = 'JSON 格式错误: ' + err.message;
    } else {
      metadataError.value = '保存失败: ' + (err.message || '未知错误');
    }
  } finally {
    savingMetadata.value = false;
  }
};

const headerSecondaryActions = computed(() => [
  {
    key: 'refresh',
    label: '刷新',
    icon: 'mdi-refresh',
    variant: 'outlined' as const,
    onClick: activeTab.value === 'records' ? fetchRecords : fetchWorkflows,
    loading: activeTab.value === 'records' ? recordsLoading.value : workflowsLoading.value,
  },
]);

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div>
    <ResponsivePageHeader :title="$t('menu.workflows')" :secondary-actions="headerSecondaryActions">
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">管理工作流记录与元数据</p>
      </template>
    </ResponsivePageHeader>

    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="records">工作流记录</v-tab>
      <v-tab value="workflows" @click="activeTab === 'workflows' && fetchWorkflows()">
        工作流列表
      </v-tab>
    </v-tabs>

    <!-- Tab 1: 工作流记录 -->
    <v-window v-model="activeTab">
      <v-window-item value="records">
        <v-card elevation="2" class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="recordFilters.workspaceId"
                  label="工作空间ID"
                  placeholder="输入工作空间ID"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  :disabled="recordsLoading"
                  @update:model-value="val => (recordFilters.workspaceId = (val ?? '').trim())"
                  @click:clear="
                    () => {
                      recordFilters.workspaceId = '';
                      recordsPagination.page = 1;
                      fetchRecords();
                    }
                  "
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="recordFilters.executeId"
                  label="执行ID"
                  placeholder="输入执行ID"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  :disabled="recordsLoading"
                  @update:model-value="val => (recordFilters.executeId = (val ?? '').trim())"
                  @click:clear="
                    () => {
                      recordFilters.executeId = '';
                      recordsPagination.page = 1;
                      fetchRecords();
                    }
                  "
                />
              </v-col>
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-btn
                  color="primary"
                  :loading="recordsLoading"
                  @click="
                    () => {
                      recordsPagination.page = 1;
                      fetchRecords();
                    }
                  "
                >
                  查询
                </v-btn>
                <v-btn
                  variant="outlined"
                  class="ml-2"
                  :disabled="recordsLoading"
                  @click="resetRecordsFilters"
                >
                  重置
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-text-outline</v-icon>
            工作流记录
            <v-spacer />
            <v-chip
              v-if="recordsPagination.total > 0"
              color="primary"
              variant="outlined"
              size="small"
            >
              共 {{ recordsPagination.total }} 条记录
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="recordsError" type="warning" variant="tonal" class="mb-2">
              {{ recordsError }}
            </v-alert>

            <v-data-table-server
              :headers="[
                { title: '状态', key: 'status', sortable: false },
                { title: '调用时间', key: 'startedAt', sortable: false },
                { title: '过期时间', key: 'debugUrlExpiresAt', sortable: false },
                { title: '调试链接', key: 'debugUrl', sortable: false },
                { title: '工作空间', key: 'workspace', sortable: false },
                { title: '所有者', key: 'owner', sortable: false },
                { title: '工作流ID', key: 'workflowId', sortable: false },
                { title: '执行ID', key: 'executeId', sortable: false },
                { title: '来源', key: 'source', sortable: false },
              ]"
              :items="recordItems"
              :loading="recordsLoading"
              :page="recordsPagination.page"
              :items-per-page="recordsPagination.limit"
              :items-length="recordsPagination.total"
              :items-per-page-options="[20, 30, 50, 100]"
              @update:page="handleRecordsPageChange"
              @update:items-per-page="handleRecordsItemsPerPageChange"
            >
              <template #item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  variant="elevated"
                  class="status-chip"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>
              <template #item.debugUrl="{ item }">
                <div>
                  <template v-if="item.debugUrl">
                    <template v-if="!isExpired(item.debugUrlExpiresAt)">
                      <v-btn
                        color="primary"
                        variant="tonal"
                        :href="item.debugUrl"
                        target="_blank"
                        prepend-icon="mdi-open-in-new"
                      >
                        打开
                      </v-btn>
                    </template>
                    <template v-else>
                      <v-chip color="error" variant="flat" size="small">已过期</v-chip>
                    </template>
                  </template>
                  <template v-else>
                    <span class="text-disabled">-</span>
                  </template>
                </div>
              </template>
              <template #item.debugUrlExpiresAt="{ item }">
                <span :class="isExpired(item.debugUrlExpiresAt) ? 'text-error' : 'text-success'">
                  {{ item.debugUrlExpiresAt ? formatDate(item.debugUrlExpiresAt) : '-' }}
                </span>
              </template>
              <template #item.workflowId="{ item }">
                <code class="text-caption">{{ item.workflowId }}</code>
              </template>
              <template #item.executeId="{ item }">
                <code class="text-caption">{{ item.executeId }}</code>
              </template>
              <template #item.startedAt="{ item }">
                <span class="text-body-2">{{ formatDate(item.startedAt) }}</span>
              </template>
              <template #item.source="{ item }">
                <span class="text-body-2">{{ item.source || '-' }}</span>
              </template>
              <template #item.workspace="{ item }">
                <div>
                  <span class="text-body-2">{{ item.workspace?.name || '-' }}</span>
                  <br />
                  <code class="text-caption">{{ item.workspace?.workspaceId || '-' }}</code>
                </div>
              </template>
              <template #item.owner="{ item }">
                <div>
                  <span class="text-body-2">{{
                    item.owner?.name || item.owner?.username || '-'
                  }}</span>
                  <br />
                  <span class="text-caption muted">{{ item.owner?.email || '-' }}</span>
                </div>
              </template>
            </v-data-table-server>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Tab 2: 工作流列表 -->
      <v-window-item value="workflows">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-sitemap</v-icon>
            Coze 工作流列表
            <v-spacer />
          </v-card-title>
          <v-card-text>
            <v-alert v-if="workflowsError" type="warning" variant="tonal" class="mb-2">
              {{ workflowsError }}
            </v-alert>

            <v-data-table-server
              :headers="[
                { title: '工作流名称', key: 'workflow_name', sortable: false },
                { title: '工作流ID', key: 'workflow_id', sortable: false },
                { title: '描述', key: 'description', sortable: false },
                { title: '操作', key: 'actions', sortable: false, align: 'end' },
              ]"
              :items="workflowItems"
              :loading="workflowsLoading"
              :page="workflowsPagination.page"
              :items-per-page="workflowsPagination.limit"
              :items-length="workflowsPagination.total"
              :items-per-page-options="[20, 30, 50, 100]"
              @update:page="handleWorkflowsPageChange"
              @update:items-per-page="handleWorkflowsItemsPerPageChange"
            >
              <template #item.workflow_name="{ item }">
                <div class="d-flex align-center">
                  <v-avatar v-if="item.iconUrl" size="32" class="mr-2">
                    <v-img :src="item.iconUrl" />
                  </v-avatar>
                  <span class="font-weight-medium">{{ item.workflowName }}</span>
                </div>
              </template>
              <template #item.workflow_id="{ item }">
                <code class="text-caption">{{ item.workflowId }}</code>
              </template>
              <template #item.description="{ item }">
                <span class="text-caption text-truncate d-inline-block" style="max-width: 300px">
                  {{ item.description || '-' }}
                </span>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  color="primary"
                  size="small"
                  variant="tonal"
                  @click="openMetadataDialog(item)"
                >
                  编辑元数据
                </v-btn>
              </template>
            </v-data-table-server>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- 元数据编辑 Dialog -->
    <v-dialog v-model="metadataDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-code-json</v-icon>
          编辑工作流元数据
        </v-card-title>
        <v-card-subtitle v-if="editingWorkflow">
          {{ editingWorkflow.workflowName }} ({{ editingWorkflow.workflowId }})
        </v-card-subtitle>
        <v-card-text>
          <v-alert v-if="metadataError" type="error" variant="tonal" class="mb-4">
            {{ metadataError }}
          </v-alert>
          <v-textarea
            v-model="metadataJsonStr"
            label="元数据 (JSON)"
            placeholder='{"key": "value"}'
            rows="15"
            auto-grow
            :disabled="savingMetadata"
          />
          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            请输入有效的 JSON 格式数据。元数据将与工作流关联并可通过公开 API 获取。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="savingMetadata" @click="closeMetadataDialog">
            取消
          </v-btn>
          <v-btn color="primary" :loading="savingMetadata" @click="validateAndSaveMetadata">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

.status-chip {
  font-weight: 600;
  text-transform: uppercase;
}

.muted {
  opacity: 0.85;
}
</style>
