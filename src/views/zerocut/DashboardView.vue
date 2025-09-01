<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 数据统计
const stats = ref({
  totalVideos: 1247,
  totalImages: 3856,
  totalUsage: 89.5,
  activeProjects: 23,
});

// 趋势数据
const trendData = ref({
  videoGeneration: [120, 132, 101, 134, 90, 230, 210],
  imageGeneration: [220, 182, 191, 234, 290, 330, 310],
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
});

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: 'video',
    title: '生成营销视频',
    time: '2分钟前',
    status: 'completed',
  },
  {
    id: 2,
    type: 'image',
    title: '创建产品图片',
    time: '5分钟前',
    status: 'processing',
  },
  {
    id: 3,
    type: 'video',
    title: '制作宣传片',
    time: '10分钟前',
    status: 'completed',
  },
]);

// 工作空间信息
const workspaceInfo = ref({
  name: '默认工作空间',
  members: 5,
  storage: {
    used: 2.4,
    total: 10,
  },
});

onMounted(() => {
  // 模拟数据加载
  console.log('Dashboard mounted');
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'info';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return 'mdi-video';
    case 'image':
      return 'mdi-image';
    default:
      return 'mdi-file';
  }
};
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">数据看板</h1>
      <p class="text-subtitle-1 text-medium-emphasis">实时监控您的视频创作数据和使用情况</p>
    </div>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2"> mdi-video-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.totalVideos.toLocaleString() }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总视频数量</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="secondary" class="mb-2"> mdi-image-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.totalImages.toLocaleString() }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">总图片数量</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="success" class="mb-2"> mdi-chart-line </v-icon>
          <div class="text-h4 font-weight-bold mb-1">{{ stats.totalUsage }}%</div>
          <div class="text-subtitle-2 text-medium-emphasis">使用率</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="warning" class="mb-2"> mdi-folder-multiple-outline </v-icon>
          <div class="text-h4 font-weight-bold mb-1">
            {{ stats.activeProjects }}
          </div>
          <div class="text-subtitle-2 text-medium-emphasis">活跃项目</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 主要内容区域 -->
    <v-row>
      <!-- 趋势图表 -->
      <v-col cols="12" lg="8">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-areaspline</v-icon>
            使用趋势
          </v-card-title>
          <v-card-text>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1"> mdi-chart-line </v-icon>
              <div class="text-h6 mt-4 text-medium-emphasis">图表组件待集成</div>
              <div class="text-body-2 text-medium-emphasis">这里将显示视频和图片生成的趋势图表</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 侧边栏 -->
      <v-col cols="12" lg="4">
        <!-- 工作空间信息 -->
        <v-card class="mb-4" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-domain</v-icon>
            工作空间
          </v-card-title>
          <v-card-text>
            <div class="mb-3">
              <div class="text-subtitle-1 font-weight-medium">
                {{ workspaceInfo.name }}
              </div>
              <div class="text-body-2 text-medium-emphasis">{{ workspaceInfo.members }} 名成员</div>
            </div>

            <div class="mb-2">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">存储使用</span>
                <span class="text-body-2">
                  {{ workspaceInfo.storage.used }}GB / {{ workspaceInfo.storage.total }}GB
                </span>
              </div>
              <v-progress-linear
                :model-value="(workspaceInfo.storage.used / workspaceInfo.storage.total) * 100"
                color="primary"
                height="6"
                rounded
              ></v-progress-linear>
            </div>
          </v-card-text>
        </v-card>

        <!-- 最近活动 -->
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            最近活动
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item v-for="activity in recentActivities" :key="activity.id" class="px-4">
                <template #prepend>
                  <v-avatar size="32" :color="getStatusColor(activity.status)">
                    <v-icon :icon="getTypeIcon(activity.type)" size="16"></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-body-2">
                  {{ activity.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ activity.time }}
                </v-list-item-subtitle>

                <template #append>
                  <v-chip :color="getStatusColor(activity.status)" size="small" variant="tonal">
                    {{
                      activity.status === 'completed'
                        ? '完成'
                        : activity.status === 'processing'
                          ? '处理中'
                          : '失败'
                    }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" color="primary" block> 查看全部活动 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
