<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChatGPTStore } from '@/stores/chatGPTStore';
import { ChatModel } from '@/api/chatApi';

// 获取store和router
const router = useRouter();
const chatStore = useChatGPTStore();

// 定义当前选中的标签页
const currentTab = ref('创意策划');
const tabs = ['创意策划', '文生图', '图生视频'];

// 用户输入
const userInput = ref('');
const isLoading = ref(false);

// 选择/取消选择模型
const selectedModels = ref<ChatModel[]>([]);
const toggleModelSelection = (model: ChatModel) => {
  const index = selectedModels.value.findIndex(m => m.modelName === model.modelName);
  if (index === -1) {
    selectedModels.value.push(model);
  } else {
    selectedModels.value.splice(index, 1);
  }
};

// 计算AI选中状态提示信息
const selectionMessage = computed(() => {
  if (selectedModels.value.length === 0) {
    return '请至少选择一个AI模型以开始创意对话';
  }
  return `已选中 ${selectedModels.value.length} 个AI，开始提问吧！`;
});

// 初始化
onMounted(() => {
  // 使用store里的方法获取模型列表
  chatStore.fetchAvailableModels();
});

// 发送消息并跳转到聊天页面
const sendMessage = () => {
  if (!userInput.value.trim() || selectedModels.value.length === 0) return;

  isLoading.value = true;

  // 1. 保存用户输入和选择的模型
  const userPrompt = userInput.value;

  // 2. 将选择的第一个模型设置为当前模型
  if (selectedModels.value.length > 0) {
    chatStore.updateModel(selectedModels.value[0].modelName);
  }

  // 3. 收集所有选中模型的modelName
  const selectedModelNames = selectedModels.value.map(model => model.modelName);

  // 4. 跳转到聊天页面，并传递初始消息和选中的模型
  router.push({
    path: '/ai/chatbot_v1',
    query: {
      initialMessage: userPrompt,
      models: selectedModelNames.join(','), // 用逗号分隔多个模型名称
    },
  });

  // 重置输入
  userInput.value = '';
  isLoading.value = false;
};
</script>

<template>
  <div class="dashboard-container pa-4">
    <!-- 顶部标签页 -->
    <v-card flat class="mb-4">
      <v-tabs v-model="currentTab" bg-color="background">
        <v-tab v-for="tab in tabs" :key="tab" :value="tab" class="px-6">
          {{ tab }}
        </v-tab>
        <v-tab disabled append-icon="mdi-plus"></v-tab>
      </v-tabs>
    </v-card>

    <!-- 主内容区域 -->
    <v-window v-model="currentTab">
      <!-- 创意策划标签页内容 -->
      <v-window-item value="创意策划">
        <!-- 加载中状态 -->
        <div v-if="chatStore.isLoadingModels" class="my-6 text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">加载可用模型中...</div>
        </div>

        <!-- 错误信息 -->
        <v-alert v-if="chatStore.modelLoadError" type="warning" class="mb-4">
          {{ chatStore.modelLoadError }}
        </v-alert>

        <!-- 模型列表 -->
        <div v-if="!chatStore.isLoadingModels" class="model-grid mb-6">
          <v-row>
            <v-col
              v-for="model in chatStore.availableModels"
              :key="model.modelName"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
            >
              <v-card
                :class="['model-card', { selected: selectedModels.some(m => m.modelName === model.modelName) }]"
                @click="toggleModelSelection(model)"
                height="60"
                variant="outlined"
              >
                <v-card-text class="d-flex align-center pa-2">
                  <div>
                    <v-avatar size="36" class="me-2">
                      <v-img :src="`/src/assets/images/avatars/avatar_assistant.jpg`"></v-img>
                    </v-avatar>
                  </div>
                  <div class="flex-grow-1 text-truncate">{{ model.modelName }}</div>
                  <v-icon v-if="selectedModels.some(m => m.modelName === model.modelName)" color="primary" class="ms-1">
                    mdi-check-circle
                  </v-icon>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 模型选择标题和状态提示 -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div
            class="status-message"
            :class="{ 'text-success': selectedModels.length > 0, 'text-medium-emphasis': selectedModels.length === 0 }"
          >
            <v-icon
              :icon="selectedModels.length > 0 ? 'mdi-check-circle' : 'mdi-information-outline'"
              class="me-1"
              size="small"
            ></v-icon>
            {{ selectionMessage }}
          </div>
        </div>

        <!-- 文本输入框 -->
        <v-card class="input-card mb-4" variant="outlined" elevation="2" rounded="lg">
          <v-card-text class="input-container pa-0">
            <v-textarea
              v-model="userInput"
              variant="plain"
              rows="3"
              hide-details
              class="input-textarea px-4 pt-4 pb-12"
              placeholder="描述您的创意需求，例如：'我需要一个科技感十足的Logo设计方案' 或 '帮我策划一个环保主题的营销活动'"
              @keydown.enter="sendMessage"
              no-resize
              auto-grow
              bg-color="background"
            ></v-textarea>

            <div class="send-button-container">
              <v-btn
                class="mb-1"
                color="primary"
                variant="elevated"
                icon
                :loading="isLoading"
                :disabled="isLoading || !userInput.trim() || selectedModels.length === 0"
                @click="sendMessage"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- 其他标签页占位符 -->
      <v-window-item value="文生图">
        <div class="pa-4">文生图功能正在开发中...</div>
      </v-window-item>

      <v-window-item value="图生视频">
        <div class="pa-4">图生视频功能正在开发中...</div>
      </v-window-item>
    </v-window>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.model-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }

  &.selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

.input-card {
  transition: all 0.3s ease;
  overflow: visible;
  background-color: transparent !important;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }
}

.input-container {
  position: relative;
}

.input-textarea {
  font-size: 16px;
  line-height: 1.5;
  border-radius: 12px;
  transition: all 0.3s;
  background-color: rgba(var(--v-theme-surface), 1) !important;

  &::placeholder {
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-style: italic;
    font-size: 15px;
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
  }
}

.send-button-container {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 2;
}

.send-btn {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:not(:disabled):hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:not(:disabled):active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.status-message {
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}
</style>
