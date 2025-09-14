import type { ApiError } from '@/types/api';
import { ErrorHandler, ErrorType, type ProcessedError } from './errorHandler';

// 消息显示接口
interface MessageService {
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
}

// 默认消息服务实现（使用console和可选的通知）
class DefaultMessageService implements MessageService {
  success(message: string): void {
    console.log(`✅ ${message}`);
    this.showNotification(message, 'success');
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
    this.showNotification(message, 'error');
  }

  warning(message: string): void {
    console.warn(`⚠️ ${message}`);
    this.showNotification(message, 'warning');
  }

  info(message: string): void {
    console.info(`ℹ️ ${message}`);
    this.showNotification(message, 'info');
  }

  private showNotification(message: string, type: string): void {
    // 尝试使用浏览器通知API（如果用户允许）
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        icon: this.getIconForType(type),
        tag: 'api-notification',
      });
    }
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }
}

// 全局消息服务实例
let messageService: MessageService = new DefaultMessageService();

// 设置自定义消息服务（例如Vuetify的snackbar）
export function setMessageService(service: MessageService): void {
  messageService = service;
}

/**
 * API调用选项
 */
export interface ApiCallOptions {
  showErrorMessage?: boolean; // 是否显示错误消息
  showSuccessMessage?: boolean; // 是否显示成功消息
  successMessage?: string; // 自定义成功消息
  enableRetry?: boolean; // 是否启用重试
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟
  context?: string; // 错误上下文
  silent?: boolean; // 静默模式，不显示任何消息
}

/**
 * API调用结果
 */
export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: ProcessedError;
}

/**
 * API调用包装器
 */
export class ApiWrapper {
  /**
   * 包装API调用，提供统一的错误处理和重试机制
   */
  static async call<T>(
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<ApiCallResult<T>> {
    const {
      showErrorMessage = true,
      showSuccessMessage = false,
      successMessage,
      enableRetry = false,
      maxRetries = 3,
      retryDelay = 1000,
      context,
      silent = false,
    } = options;

    try {
      let result: T;

      if (enableRetry) {
        result = await this.executeWithRetry(apiCall, maxRetries, retryDelay);
      } else {
        result = await apiCall();
      }

      // 显示成功消息
      if (!silent && showSuccessMessage && successMessage) {
        messageService.success(successMessage);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const processedError = this.processError(error, context);

      // 记录错误日志
      ErrorHandler.logError(processedError, context);

      // 显示错误消息
      if (!silent && showErrorMessage) {
        this.showErrorMessage(processedError);
      }

      return {
        success: false,
        error: processedError,
      };
    }
  }

  /**
   * 执行带重试的API调用
   */
  private static async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          throw error;
        }

        // 检查是否应该重试
        const processedError = this.processError(error);
        if (!processedError.shouldRetry) {
          throw error;
        }

        // 计算延迟时间
        const delay = processedError.retryAfter || baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 处理错误
   */
  private static processError(error: any, context?: string): ProcessedError {
    // 如果已经是ProcessedError，直接返回
    if (error && typeof error === 'object' && 'type' in error) {
      return error as ProcessedError;
    }

    // 如果是ApiError，使用ErrorHandler处理
    if (error && typeof error === 'object' && 'code' in error) {
      return ErrorHandler.processApiError(error as ApiError);
    }

    // 其他类型的错误
    return {
      type: ErrorType.UNKNOWN,
      severity: 'MEDIUM' as any,
      message: error?.message || 'Unknown error',
      userMessage: '操作失败，请重试',
      code: -1,
      details: error,
      shouldRetry: false,
    };
  }

  /**
   * 显示错误消息
   */
  private static showErrorMessage(error: ProcessedError): void {
    const messageType = this.getMessageType(error.type);

    switch (messageType) {
      case 'error':
        messageService.error(error.userMessage);
        break;
      case 'warning':
        messageService.warning(error.userMessage);
        break;
      default:
        messageService.info(error.userMessage);
    }
  }

  /**
   * 获取消息类型
   */
  private static getMessageType(errorType: ErrorType): 'error' | 'warning' | 'info' {
    switch (errorType) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.SERVER:
        return 'error';
      case ErrorType.NETWORK:
      case ErrorType.VALIDATION:
        return 'warning';
      default:
        return 'info';
    }
  }
}

/**
 * 便捷的API调用函数
 */
export async function apiCall<T>(
  apiFunction: () => Promise<T>,
  options?: ApiCallOptions
): Promise<ApiCallResult<T>> {
  return ApiWrapper.call(apiFunction, options);
}

/**
 * 带加载状态的API调用
 */
export async function apiCallWithLoading<T>(
  apiFunction: () => Promise<T>,
  loadingRef: { value: boolean },
  options?: ApiCallOptions
): Promise<ApiCallResult<T>> {
  loadingRef.value = true;
  try {
    return await ApiWrapper.call(apiFunction, options);
  } finally {
    loadingRef.value = false;
  }
}
