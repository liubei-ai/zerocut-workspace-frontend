import apiClient from './api2client';

// 接口类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatModel {
  modelName: string;
  apiUrl: string;
  apiKey: string;
}

// 原始API响应结构
export interface ModelsApiResponse {
  code: number;
  message: string;
  data: {
    models: ChatModel[];
  };
  timestamp: string;
}

// client.ts拦截器处理后的响应结构
export interface ModelsResponse {
  models: ChatModel[];
}

// 获取所有可用的聊天模型
export const getAvailableModels = () => {
  return apiClient.get<any>('/chat/models');
};

// 非流式聊天接口
export const sendChatRequest = (data: {
  messages: Message[];
  model: string;
  max_tokens?: number;
}) => {
  return apiClient.post('/chat', data);
};

// Redis聊天接口（阻塞）
export const streamChatRequest = (data: {
  messages: Message[];
  model: string;
  transportType: 'redis';
}) => {
  return apiClient.post('/chat/stream', data, {
    responseType: 'stream',
  });
};

// Redis聊天接口（异步）
export const createStreamChat = (data: {
  messages: Message[];
  model: string;
  max_tokens?: number;
  transportType: 'redis';
}) => {
  return apiClient.post('/chat/stream/create', data);
};

// 异步读取redis聊天记录
export const getChatHistories = (sessionId: string) => {
  return apiClient.get('/chat/stream/histories', {
    params: { sessionId },
  });
};

// 创建流式聊天连接（使用原生fetch API）
export const createStreamChatConnection = async (data: {
  model: string;
  messages: Message[];
  transportType: string;
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  return fetch(`${apiBaseUrl}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Enable cookies
  });
};

// 创建EventSource连接用于异步流式聊天
export const createEventSourceConnection = (sessionId: string) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  return new EventSource(`${apiBaseUrl}/chat/stream/histories?sessionId=${sessionId}`);
};
