<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { nextTick, onMounted } from 'vue';
import { MdPreview } from 'md-editor-v3';
import { useRoute } from 'vue-router';
import { scrollToBottom } from '@/utils/common';
import { useChatGPTStore } from '@/stores/chatGPTStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { read, countAndCompleteCodeBlocks } from '@/utils/aiUtils';
import AnimationChat from '@/components/animations/AnimationChat1.vue';
import AnimationAi from '@/components/animations/AnimationBot1.vue';
import { createStreamChatConnection, type Message } from '@/api/chatApi';
import ApiKeyDialog from '@/components/ApiKeyDialog.vue';
import 'md-editor-v3/lib/preview.css';

// 扩展消息接口，支持多模型
interface ExtendedMessage extends Message {
  modelName?: string; // 回答来自哪个模型
}

const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();
const route = useRoute();

// User Input Message
const userMessage = ref('');

// Prompt Message
const promptMessage = computed<Message[]>(() => {
  return [
    {
      content: chatGPTStore.prompt,
      role: 'system' as const,
    },
  ];
});

// Message List
const messages = ref<ExtendedMessage[]>([]);

const requestMessages = computed(() => {
  if (messages.value.length <= 10) {
    return [...promptMessage.value, ...messages.value];
  } else {
    // 截取最新的10条信息
    const slicedMessages = messages.value.slice(-10);
    return [...promptMessage.value, ...slicedMessages];
  }
});

// 记录每个模型的加载状态
const loadingModels = ref(new Set<string>());
const isLoading = computed(() => loadingModels.value.size > 0);

// 记录查询参数中的模型列表
const selectedModelNames = ref<string[]>([]);

// 初始化时加载模型列表和处理初始消息
onMounted(async () => {
  await chatGPTStore.fetchAvailableModels();

  // 获取查询参数中的模型列表
  const modelsParam = route.query.models as string;
  if (modelsParam) {
    selectedModelNames.value = modelsParam.split(',');
  } else {
    // 如果没有传递模型参数，使用当前选定的模型
    selectedModelNames.value = [chatGPTStore.model];
  }

  // 处理从Dashboard传递来的初始消息
  const initialMessage = route.query.initialMessage as string;
  if (initialMessage) {
    // 直接添加初始消息并发送
    messages.value.push({
      content: initialMessage,
      role: 'user',
    });

    // 为每个选中的模型创建AI回复
    await createMultiModelCompletions(initialMessage);
  }
});

// Send Messsage
const sendMessage = async () => {
  if (userMessage.value) {
    const message = userMessage.value;

    // Add the message to the list
    messages.value.push({
      content: message,
      role: 'user',
    });

    // Clear the input
    userMessage.value = '';

    // Create completions for multiple models
    await createMultiModelCompletions(message);
  }
};

// 为每个模型创建单独的回复
const createMultiModelCompletions = async (message: string) => {
  // 使用查询参数中的模型列表进行回复
  const modelPromises = selectedModelNames.value.map(modelName => createCompletionForModel(modelName));

  // 并行处理所有模型的响应，这样模型之间不会互相等待
  await Promise.all(modelPromises);
};

// 为单个模型创建回复
const createCompletionForModel = async (modelName: string) => {
  try {
    // 标记该模型为加载中
    loadingModels.value.add(modelName);

    // 使用chatApi中的createStreamChatConnection方法
    const completion = await createStreamChatConnection({
      messages: requestMessages.value,
      model: modelName,
      transportType: 'sse',
    });

    // Handle errors
    if (!completion.ok) {
      const errorData = await completion.json();
      snackbarStore.showErrorMessage(`${modelName} 回复失败: ${errorData.message || '请求失败'}`);
      loadingModels.value.delete(modelName);
      return;
    }

    // Create a reader
    const reader = completion.body?.getReader();
    if (!reader) {
      snackbarStore.showErrorMessage(`${modelName} 无法读取流式响应`);
      loadingModels.value.delete(modelName);
      return;
    }

    // Add the bot message with model name and track its position
    const messageIndex = messages.value.length;
    messages.value.push({
      content: '',
      role: 'assistant',
      modelName: modelName, // 标记哪个模型的回复
    });

    // Read the stream and specify which message to update
    await read(reader, messages, messageIndex);

    // 完成后移除加载状态
    loadingModels.value.delete(modelName);
  } catch (error: any) {
    snackbarStore.showErrorMessage(`${modelName} 回复失败: ${error.message || '请求失败'}`);
    loadingModels.value.delete(modelName);
  }
};

watch(
  () => messages.value,
  val => {
    if (val) {
      nextTick(() => {
        scrollToBottom(document.querySelector('.message-container'));
      });
    }
  },
  {
    deep: true,
  }
);

const displayMessages = computed(() => {
  if (messages.value.length === 0) return [];

  const messagesCopy = messages.value.slice(); // 创建原始数组的副本

  // 处理每条消息，确保代码块完整
  return messagesCopy.map(message => {
    if (message.role === 'assistant') {
      return {
        ...message,
        content: countAndCompleteCodeBlocks(message.content),
      };
    }
    return message;
  });
});

// 获取模型的显示名称
const getModelDisplayName = (modelName: string) => {
  const model = chatGPTStore.availableModels.find(m => m.modelName === modelName);
  return model ? model.modelName : modelName;
};

const handleKeydown = e => {
  if (e.key === 'Enter' && (e.altKey || e.shiftKey)) {
    // 当同时按下 alt或者shift 和 enter 时，插入一个换行符
    e.preventDefault();
    userMessage.value += '\n';
  } else if (e.key === 'Enter') {
    // 当只按下 enter 时，发送消息
    e.preventDefault();
    sendMessage();
  }
};

const inputRow = ref(1);
</script>

<template>
  <div class="chat-bot">
    <div class="messsage-area">
      <perfect-scrollbar v-if="messages.length > 0" class="message-container">
        <template v-for="(message, index) in displayMessages" :key="index">
          <!-- 用户消息 -->
          <div v-if="message.role === 'user'">
            <div class="pa-4 user-message">
              <v-avatar class="ml-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_user.jpg" alt="user" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-text>
                  <b>{{ message.content }}</b>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- AI回复 -->
          <div v-else-if="message.role === 'assistant'">
            <div class="pa-2 pa-md-5 assistant-message">
              <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="ai" />
              </v-avatar>
              <div class="d-flex flex-column" style="width: 100%">
                <!-- 显示模型名称 -->
                <div class="mb-1 text-caption text-medium-emphasis" v-if="message.modelName">
                  <v-chip size="small" color="primary" variant="flat" class="mb-2">
                    {{ getModelDisplayName(message.modelName) }}
                  </v-chip>
                </div>
                <v-card>
                  <div>
                    <MdPreview :modelValue="message.content" class="font-1" />
                  </div>
                </v-card>
              </div>
            </div>
          </div>
        </template>

        <!-- 加载状态显示 -->
        <div v-if="isLoading">
          <div class="pa-6">
            <div class="message">
              <AnimationAi :size="100" />
              <div v-if="loadingModels.size > 0" class="mt-2 text-center">
                <template v-for="modelName in Array.from(loadingModels)" :key="modelName">
                  <v-chip size="small" color="primary" variant="outlined" class="mr-1 mb-1">
                    {{ getModelDisplayName(modelName) }}
                  </v-chip>
                </template>
                <span class="ml-1">正在思考...</span>
              </div>
            </div>
          </div>
        </div>
      </perfect-scrollbar>
      <div class="no-message-container" v-else>
        <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">Chat With Me</h1>
        <AnimationChat :size="300" />
      </div>
    </div>
    <div class="input-area">
      <v-sheet color="transparent" elevation="0" class="input-panel d-flex align-end pa-1">
        <transition name="fade">
          <v-textarea
            class="mx-2"
            color="primary"
            type="text"
            clearable
            variant="solo"
            ref="input"
            v-model="userMessage"
            placeholder="Ask Anything"
            hide-details
            @keydown="handleKeydown"
            :rows="inputRow"
            @focus="inputRow = 3"
            @blur="inputRow = 1"
          >
          </v-textarea>
        </transition>

        <v-btn class="mb-1" color="primary" variant="elevated" icon :loading="isLoading" :disabled="isLoading">
          <v-icon @click="sendMessage">mdi-send</v-icon>
        </v-btn>
      </v-sheet>
      <ApiKeyDialog />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-bot {
  background-repeat: repeat;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .messsage-area {
    flex: 1;
    height: 100%;
  }

  .input-area {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 1rem;
    align-items: center;

    .input-panel {
      border-radius: 5px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .model-selector {
      border-radius: 5px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 0.5rem;

      .model-select {
        max-width: 300px;
      }
    }
  }
}

.user-message {
  display: flex;
  align-content: center;
  justify-content: end;
  flex-direction: row-reverse;
}

.assistant-message {
  display: flex;
  align-content: center;
  justify-content: start;
  flex-direction: row;
}

.message {
  margin: 0 auto;
  max-width: 1200px;
  display: flex;
}

.message-container {
  height: calc(100vh - 200px);
}

.no-message-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  h1 {
    font-size: 2rem;
    font-weight: 500;
  }
}

:deep(.md-editor-preview-wrapper) {
  padding: 5px 15px;
}

.font-1 {
  font-size: 13px !important;
}

@media screen and (max-width: 768px) {
  :deep(#md-editor-v3-preview),
  .user-message {
    font-size: 14px !important;
  }

  .message-container {
    height: calc(100vh - 220px);
  }

  .input-area {
    .model-selector {
      .model-select {
        max-width: 100%;
      }
    }
  }
}
</style>
