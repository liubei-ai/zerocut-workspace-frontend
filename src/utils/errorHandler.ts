import type { ApiError } from '@/types/api';

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * 处理后的错误信息
 */
export interface ProcessedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code: number;
  details?: any;
  shouldRetry: boolean;
  retryAfter?: number;
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理API错误
   */
  static processApiError(error: ApiError): ProcessedError {
    const { code, message, details } = error;

    // 根据错误码分类错误类型
    const type = this.classifyErrorType(code);
    const severity = this.determineSeverity(code, type);
    const userMessage = this.generateUserMessage(type, code, message);
    const shouldRetry = this.shouldRetry(code, type);
    const retryAfter = this.getRetryDelay(code);

    return {
      type,
      severity,
      message,
      userMessage,
      code,
      details,
      shouldRetry,
      retryAfter,
    };
  }

  /**
   * 分类错误类型
   */
  private static classifyErrorType(code: number): ErrorType {
    if (code === 0) return ErrorType.NETWORK;
    if (code === 401) return ErrorType.AUTHENTICATION;
    if (code === 403) return ErrorType.AUTHORIZATION;
    if (code >= 400 && code < 500) return ErrorType.VALIDATION;
    if (code >= 500) return ErrorType.SERVER;
    return ErrorType.UNKNOWN;
  }

  /**
   * 确定错误严重程度
   */
  private static determineSeverity(code: number, type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.NETWORK:
        return ErrorSeverity.HIGH;
      case ErrorType.AUTHENTICATION:
        return ErrorSeverity.CRITICAL;
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.VALIDATION:
        return ErrorSeverity.MEDIUM;
      case ErrorType.SERVER:
        return code >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 生成用户友好的错误消息
   */
  private static generateUserMessage(type: ErrorType, code: number, message: string): string {
    switch (type) {
      case ErrorType.NETWORK:
        return '网络连接失败，请检查网络设置后重试';
      case ErrorType.AUTHENTICATION:
        return '登录已过期，请重新登录';
      case ErrorType.AUTHORIZATION:
        return '您没有权限执行此操作';
      case ErrorType.VALIDATION:
        return message || '请求参数有误，请检查后重试';
      case ErrorType.SERVER:
        return '服务器暂时无法处理请求，请稍后重试';
      default:
        return message || '操作失败，请重试';
    }
  }

  /**
   * 判断是否应该重试
   */
  private static shouldRetry(code: number, type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK:
        return true;
      case ErrorType.SERVER:
        return code >= 500 && code !== 501; // 501 Not Implemented 不应重试
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.VALIDATION:
        return false;
      default:
        return false;
    }
  }

  /**
   * 获取重试延迟时间（毫秒）
   */
  private static getRetryDelay(code: number): number | undefined {
    if (code === 429) return 5000; // Rate limit - 5秒后重试
    if (code >= 500) return 3000; // 服务器错误 - 3秒后重试
    if (code === 0) return 2000; // 网络错误 - 2秒后重试
    return undefined;
  }

  /**
   * 记录错误日志
   */
  static logError(error: ProcessedError, context?: string): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    const logData = {
      code: error.code,
      context,
      details: error.details,
      timestamp: new Date().toISOString(),
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  /**
   * 获取日志级别
   */
  private static getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }
}

/**
 * 创建重试函数
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): () => Promise<T> {
  return async (): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        // 指数退避延迟
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}
