<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { nextTick, onMounted } from 'vue';
import { MdPreview } from 'md-editor-v3';
import { scrollToBottom } from '@/utils/common';
import { useChatGPTStore } from '@/stores/chatGPTStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { read, countAndCompleteCodeBlocks } from '@/utils/aiUtils';
import AnimationChat from '@/components/animations/AnimationChat1.vue';
import AnimationAi from '@/components/animations/AnimationBot1.vue';
import { createStreamChatConnection, type Message } from '@/api/chatApi';
import ApiKeyDialog from '@/components/ApiKeyDialog.vue';
import 'md-editor-v3/lib/preview.css';

const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

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
const messages = ref<Message[]>([]);

const requestMessages = computed(() => {
  if (messages.value.length <= 10) {
    return [...promptMessage.value, ...messages.value];
  } else {
    // 截取最新的10条信息
    const slicedMessages = messages.value.slice(-10);
    return [...promptMessage.value, ...slicedMessages];
  }
});

const isLoading = ref(false);

// 初始化时加载模型列表
onMounted(async () => {
  await chatGPTStore.fetchAvailableModels();
});

// Send Messsage
const sendMessage = async () => {
  if (userMessage.value) {
    // Add the message to the list
    messages.value.push({
      content: userMessage.value,
      role: 'user',
    });

    // Clear the input
    userMessage.value = '';

    // Create a completion
    await createCompletion();
  }
};

const createCompletion = async () => {
  try {
    isLoading.value = true;

    // 使用当前选择的模型
    const currentModel = chatGPTStore.model || 'moonshot-v1-8k';

    // 使用chatApi中的createStreamChatConnection方法
    const completion = await createStreamChatConnection({
      messages: requestMessages.value,
      model: currentModel,
      transportType: 'sse',
    });

    // Handle errors
    if (!completion.ok) {
      const errorData = await completion.json();
      snackbarStore.showErrorMessage(errorData.message || '请求失败');
      isLoading.value = false;
      return;
    }

    // Create a reader
    const reader = completion.body?.getReader();
    if (!reader) {
      snackbarStore.showErrorMessage('无法读取流式响应');
      isLoading.value = false;
      return;
    }

    // Add the bot message
    messages.value.push({
      content: '',
      role: 'assistant',
    });

    // Read the stream
    await read(reader, messages);
    isLoading.value = false;
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.message || '请求失败');
    isLoading.value = false;
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
  const lastMessage = messagesCopy[messagesCopy.length - 1];

  if (lastMessage) {
    const updatedLastMessage = {
      ...lastMessage,
      content: countAndCompleteCodeBlocks(lastMessage.content),
    };
    messagesCopy[messagesCopy.length - 1] = updatedLastMessage;
  }

  return messagesCopy;
});

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

// 模型选择相关
const modelSelectOpen = ref(false);
const isModelLoading = computed(() => chatGPTStore.isLoadingModels);
const availableModels = computed(() => chatGPTStore.availableModels);
const selectedModel = computed({
  get: () => chatGPTStore.model,
  set: value => chatGPTStore.updateModel(value),
});

// 刷新模型列表
const refreshModels = async () => {
  await chatGPTStore.fetchAvailableModels();
};
</script>

<template>
  <div class="chat-bot">
    <div class="messsage-area">
      <perfect-scrollbar v-if="messages.length > 0" class="message-container">
        <template v-for="message in displayMessages">
          <div v-if="message.role === 'user'">
            <div class="pa-4 user-message">
              <v-avatar class="ml-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_user.jpg" alt="alt" />
              </v-avatar>
              <v-card class="gradient gray text-pre-wrap" theme="dark">
                <v-card-text>
                  <b> {{ message.content }}</b></v-card-text
                >
              </v-card>
            </div>
          </div>
          <div v-else>
            <div class="pa-2 pa-md-5 assistant-message">
              <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
                <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="alt" />
              </v-avatar>
              <v-card>
                <div>
                  <MdPreview :modelValue="message.content" class="font-1" />
                </div>
              </v-card>
            </div>
          </div>
        </template>
        <div v-if="isLoading">
          <div class="pa-6">
            <div class="message">
              <AnimationAi :size="100" />
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
      <v-sheet color="transparent" elevation="0" class="model-selector mb-2 d-flex align-center">
        <v-select
          v-model="selectedModel"
          :items="availableModels"
          item-title="modelName"
          item-value="modelName"
          variant="outlined"
          density="compact"
          label="选择模型"
          :loading="isModelLoading"
          class="model-select"
          hide-details
        >
          <template v-slot:prepend>
            <v-icon color="primary">mdi-robot</v-icon>
          </template>
          <template v-slot:append>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              density="compact"
              size="small"
              color="primary"
              @click="refreshModels"
              :loading="isModelLoading"
            ></v-btn>
          </template>
        </v-select>
      </v-sheet>

      <v-sheet color="transparent" elevation="0" class="input-panel d-flex align-end pa-1">
        <v-btn class="mb-1" variant="elevated" icon @click="chatGPTStore.configDialog = true">
          <v-icon size="30" class="text-primary">mdi-cog-outline</v-icon>
          <v-tooltip activator="parent" location="top" text="ChatGPT Config"></v-tooltip>
        </v-btn>
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
