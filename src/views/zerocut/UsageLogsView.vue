<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 筛选选项
const filters = ref({
  dateRange: ['2024-01-01', '2024-01-31'],
  service: 'all',
  status: 'all',
});

// 服务类型选项
const serviceOptions = [
  { value: 'all', title: '全部服务' },
  { value: 'video', title: '视频生成' },
  { value: 'image', title: '图片生成' },
  { value: 'audio', title: '音频生成' },
  { value: 'text', title: '文本处理' },
];

// 状态选项
const statusOptions = [
  { value: 'all', title: '全部状态' },
  { value: 'success', title: '成功' },
  { value: 'failed', title: '失败' },
  { value: 'processing', title: '处理中' },
];

// 使用日志数据
const usageLogs = ref([
  {
    id: 1,
    timestamp: '2024-01-20 14:30:25',
    service: 'video',
    operation: '生成营销视频',
    duration: '2分30秒',
    tokens: 1250,
    cost: 0.125,
    status: 'success',
    apiKey: 'zc_prod_****1234',
    requestId: 'req_abc123',
    fileSize: '15.2MB',
  },
  {
    id: 2,
    timestamp: '2024-01-20 14:25:10',
    service: 'image',
    operation: '创建产品图片',
    duration: '45秒',
    tokens: 800,
    cost: 0.08,
    status: 'success',
    apiKey: 'zc_prod_****1234',
    requestId: 'req_def456',
    fileSize: '2.8MB',
  },
  {
    id: 3,
    timestamp: '2024-01-20 14:20:05',
    service: 'video',
    operation: '制作宣传片',
    duration: '失败',
    tokens: 0,
    cost: 0,
    status: 'failed',
    apiKey: 'zc_test_****5678',
    requestId: 'req_ghi789',
    fileSize: '-',
    errorMessage: '输入参数无效',
  },
  {
    id: 4,
    timestamp: '2024-01-20 14:15:30',
    service: 'audio',
    operation: '生成背景音乐',
    duration: '1分15秒',
    tokens: 600,
    cost: 0.06,
    status: 'success',
    apiKey: 'zc_prod_****1234',
    requestId: 'req_jkl012',
    fileSize: '4.5MB',
  },
  {
    id: 5,
    timestamp: '2024-01-20 14:10:15',
    service: 'text',
    operation: '文本摘要生成',
    duration: '处理中',
    tokens: 300,
    cost: 0.03,
    status: 'processing',
    apiKey: 'zc_prod_****1234',
    requestId: 'req_mno345',
    fileSize: '-',
  },
]);

// 统计数据
const stats = computed(() => {
  const filtered = filteredLogs.value;
  return {
    totalRequests: filtered.length,
    successRequests: filtered.filter(log => log.status === 'success').length,
    failedRequests: filtered.filter(log => log.status === 'failed').length,
    totalTokens: filtered.reduce((sum, log) => sum + log.tokens, 0),
    totalCost: filtered.reduce((sum, log) => sum + log.cost, 0),
    avgDuration: '1分45秒', // 简化计算
  };
});

// 筛选后的日志
const filteredLogs = computed(() => {
  return usageLogs.value.filter(log => {
    // 服务类型筛选
    if (filters.value.service !== 'all' && log.service !== filters.value.service) {
      return false;
    }

    // 状态筛选
    if (filters.value.status !== 'all' && log.status !== filters.value.status) {
      return false;
    }

    // 日期范围筛选（简化实现）
    return true;
  });
});

// 获取服务图标
const getServiceIcon = (service: string) => {
  switch (service) {
    case 'video':
      return 'mdi-video';
    case 'image':
      return 'mdi-image';
    case 'audio':
      return 'mdi-music';
    case 'text':
      return 'mdi-text';
    default:
      return 'mdi-cog';
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'processing':
      return 'warning';
    default:
      return 'grey';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功';
    case 'failed':
      return '失败';
    case 'processing':
      return '处理中';
    default:
      return '未知';
  }
};

// 导出数据
const exportData = () => {
  // 模拟导出功能
  console.log('导出使用日志数据');
};

// 查看详情
const viewDetails = (log: any) => {
  console.log('查看详情:', log);
};

onMounted(() => {
  console.log('UsageLogs mounted');
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">使用日志</h1>
        <p class="text-subtitle-1 text-medium-emphasis">查看详细的API使用记录和消费统计</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-download" @click="exportData"> 导出数据 </v-btn>
    </div>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-filter</v-icon>
        筛选条件
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.service"
              :items="serviceOptions"
              item-title="title"
              item-value="value"
              label="服务类型"
              prepend-inner-icon="mdi-cog"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="状态"
              prepend-inner-icon="mdi-check-circle"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              label="日期范围"
              prepend-inner-icon="mdi-calendar"
              readonly
              value="2024-01-01 至 2024-01-31"
              hint="点击选择日期范围"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="primary" class="mb-2"> mdi-chart-bar </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.totalRequests }}
          </div>
          <div class="text-caption text-medium-emphasis">总请求数</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="success" class="mb-2"> mdi-check-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.successRequests }}
          </div>
          <div class="text-caption text-medium-emphasis">成功请求</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="error" class="mb-2"> mdi-close-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.failedRequests }}
          </div>
          <div class="text-caption text-medium-emphasis">失败请求</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="info" class="mb-2"> mdi-coin </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.totalTokens.toLocaleString() }}
          </div>
          <div class="text-caption text-medium-emphasis">消耗令牌</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="warning" class="mb-2"> mdi-currency-usd </v-icon>
          <div class="text-h6 font-weight-bold mb-1">${{ stats.totalCost.toFixed(2) }}</div>
          <div class="text-caption text-medium-emphasis">总费用</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="purple" class="mb-2"> mdi-clock </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.avgDuration }}
          </div>
          <div class="text-caption text-medium-emphasis">平均耗时</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 使用日志表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        使用记录
      </v-card-title>

      <v-data-table
        :headers="[
          { title: '时间', key: 'timestamp', sortable: true },
          { title: '服务', key: 'service', sortable: true },
          { title: '操作', key: 'operation', sortable: false },
          { title: '耗时', key: 'duration', sortable: false },
          { title: '令牌', key: 'tokens', sortable: true },
          { title: '费用', key: 'cost', sortable: true },
          { title: '状态', key: 'status', sortable: true },
          { title: 'API密钥', key: 'apiKey', sortable: false },
          { title: '文件大小', key: 'fileSize', sortable: false },
          { title: '操作', key: 'actions', sortable: false },
        ]"
        :items="filteredLogs"
        item-value="id"
        class="elevation-0"
        :items-per-page="10"
      >
        <template #item.service="{ item }">
          <div class="d-flex align-center">
            <v-icon :icon="getServiceIcon(item.service)" size="20" class="mr-2"></v-icon>
            {{ serviceOptions.find(s => s.value === item.service)?.title || item.service }}
          </div>
        </template>

        <template #item.tokens="{ item }">
          {{ item.tokens.toLocaleString() }}
        </template>

        <template #item.cost="{ item }">
          <span v-if="item.cost > 0">${{ item.cost.toFixed(3) }}</span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.apiKey="{ item }">
          <code class="text-caption">{{ item.apiKey }}</code>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="primary"
              @click="viewDetails(item)"
            ></v-btn>
            <v-btn
              icon="mdi-download"
              size="small"
              variant="text"
              color="secondary"
              :disabled="item.status !== 'success'"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
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
  font-size: 0.75rem;
}
</style>
