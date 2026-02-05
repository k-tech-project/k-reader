/**
 * 统一的错误处理工具
 */

import { logger } from './Logger';

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: string,
    public data?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: string, data?: any) {
    super(message, 'VALIDATION_ERROR', 400, context, data);
  }
}

/**
 * 未找到错误
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: string, data?: any) {
    super(message, 'NOT_FOUND', 404, context, data);
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: string, error?: Error) {
    super(message, 'DATABASE_ERROR', 500, context, { originalError: error?.message });
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends AppError {
  constructor(message: string, context?: string, error?: Error) {
    super(message, 'FILE_SYSTEM_ERROR', 500, context, { originalError: error?.message });
  }
}

/**
 * EPUB 解析错误
 */
export class EpubParseError extends AppError {
  constructor(message: string, context?: string, error?: Error) {
    super(message, 'EPUB_PARSE_ERROR', 400, context, { originalError: error?.message });
  }
}

/**
 * IPC 通信错误
 */
export class IPCError extends AppError {
  constructor(message: string, context?: string, error?: Error) {
    super(message, 'IPC_ERROR', 500, context, { originalError: error?.message });
  }
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误并记录日志
   */
  static handle(error: unknown, context?: string): AppError {
    // 如果已经是 AppError,直接返回
    if (error instanceof AppError) {
      logger.error(error.message, context || error.context, error, error.data);
      return error;
    }

    // 如果是标准 Error
    if (error instanceof Error) {
      logger.error(error.message, context, error);
      return new AppError(
        error.message,
        'UNKNOWN_ERROR',
        500,
        context,
        { originalError: error.message }
      );
    }

    // 其他类型的错误
    const message = String(error);
    logger.error(message, context);
    return new AppError(message, 'UNKNOWN_ERROR', 500, context);
  }

  /**
   * 格式化错误信息用于显示
   */
  static format(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  /**
   * 包装异步函数,自动处理错误
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    context?: string,
    errorMessage?: string
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const appError = this.handle(error, context);
      throw new AppError(
        errorMessage || appError.message,
        appError.code,
        appError.statusCode,
        context,
        appError.data
      );
    }
  }

  /**
   * 包装同步函数,自动处理错误
   */
  static wrapSync<T>(
    fn: () => T,
    context?: string,
    errorMessage?: string
  ): T {
    try {
      return fn();
    } catch (error) {
      const appError = this.handle(error, context);
      throw new AppError(
        errorMessage || appError.message,
        appError.code,
        appError.statusCode,
        context,
        appError.data
      );
    }
  }
}

/**
 * Try-Catch 辅助函数
 */
export async function tryAsync<T, E = AppError>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, E]> {
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
}

/**
 * 同步 Try-Catch 辅助函数
 */
export function trySync<T, E = AppError>(
  fn: () => T
): [T, null] | [null, E] {
  try {
    const data = fn();
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
}
