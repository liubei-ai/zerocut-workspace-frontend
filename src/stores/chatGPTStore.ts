import { defineStore } from 'pinia';
import { getAvailableModels, type ChatModel } from '@/api/chatApi';

export const useChatGPTStore = defineStore('chatGPT', {
  state: () => ({
    configDialog: false,
    apiKey: '',
    proxyUrl: 'https://api.openai-proxy.com',

    prompt: 'you are a helpful assistant',
    model: 'moonshot-v1-8k',
    availableModels: [] as ChatModel[],
    selectedModel: null as ChatModel | null,
    isLoadingModels: false,
    modelLoadError: '',
  }),

  persist: {
    storage: localStorage,
    pick: ['prompt', 'apiKey', 'proxyUrl', 'model'],
  },

  getters: {
    // If you have set up an API key, please use your own key. If not, please use the one I provided.
    // getApiKey: (state) => state.apiKey || import.meta.env.VITE_OPENAI_API_KEY,
    getApiKey: state => state.apiKey,

    // 获取当前可选模型列表
    getAvailableModels: state => state.availableModels,

    // 获取当前选中的模型
    getCurrentModel: state => state.selectedModel,
  },

  actions: {
    updatePropmpt() {},

    // 更新模型
    updateModel(model: string) {
      this.model = model;
      // 如果availableModels不为空，同时更新selectedModel
      if (this.availableModels.length > 0) {
        this.selectedModel = this.availableModels.find(m => m.modelName === model) || this.availableModels[0];
      }
    },

    // 获取可用模型列表
    async fetchAvailableModels() {
      this.isLoadingModels = true;
      this.modelLoadError = '';

      try {
        const response = await getAvailableModels();
        // client.ts拦截器处理后，response.data直接是API返回的data字段内容
        if (response && response.data && response.data.models && Array.isArray(response.data.models)) {
          this.availableModels = response.data.models;

          // 设置默认选中模型
          // 尝试选择当前model（如moonshot-v1-8k）
          const defaultModel = this.availableModels.find(m => m.modelName === this.model);

          if (defaultModel) {
            this.selectedModel = defaultModel;
          } else if (this.availableModels.length > 0) {
            // 如果找不到moonshot-v1-8k，使用第一个可用模型
            this.selectedModel = this.availableModels[0];
            this.model = this.selectedModel.modelName;
          }
        }
      } catch (error: any) {
        this.modelLoadError = error.message || '获取模型列表失败';
        console.error('获取模型列表失败', error);
      } finally {
        this.isLoadingModels = false;
      }
    },

    // 选择指定模型
    selectModel(modelName: string) {
      const model = this.availableModels.find(m => m.modelName === modelName);
      if (model) {
        this.selectedModel = model;
        this.model = modelName;
      }
    },
  },
});
