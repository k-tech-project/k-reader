/**
 * 全局错误处理工具
 * 处理未捕获的错误和 Promise 拒绝
 */

import { showToast } from '../components/Toast';

/**
 * 设置全局错误处理器
 */
export function setupGlobalErrorHandlers(): void {
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // 阻止默认的错误处理（避免在控制台显示）
    event.preventDefault();

    // 显示用户友好的错误提示
    const message = getErrorMessage(event.reason);
    showToast({
      type: 'error',
      message: `操作失败: ${message}`,
      duration: 5000,
    });

    // TODO: 发送错误日志到监控服务
    // logErrorToService('unhandledRejection', event.reason);
  });

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);

    // 显示用户友好的错误提示
    const message = getErrorMessage(event.error);
    showToast({
      type: 'error',
      message: `发生错误: ${message}`,
      duration: 5000,
    });

    // TODO: 发送错误日志到监控服务
    // logErrorToService('error', event.error);
  });

  // 捕获资源加载错误（图片、脚本等）
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement;

      // 只处理资源加载错误
      if (target && target.tagName) {
        console.error('Resource loading error:', target);

        // 如果是图片加载失败，可以设置默认图片
        if (target.tagName === 'IMG') {
          const img = target as HTMLImageElement;
          img.src = '/placeholder-image.png'; // 设置默认图片
        }
      }
    },
    true // 使用捕获阶段
  );

  console.log('[ErrorHandler] Global error handlers setup complete');
}

/**
 * 从错误对象中提取友好的错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return '未知错误';
  }

  // 如果是 Error 对象
  if (error instanceof Error) {
    return error.message || '发生了一个错误';
  }

  // 如果是字符串
  if (typeof error === 'string') {
    return error;
  }

  // 如果是对象，尝试提取消息
  if (typeof error === 'object') {
    const err = error as any;
    if (err.message) {
      return err.message;
    }
    if (err.error) {
      return getErrorMessage(err.error);
    }
    if (err.msg) {
      return err.msg;
    }
  }

  // 其他情况，转换为字符串
  return String(error);
}

/**
 * 处理异步操作错误的辅助函数
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error);

    // 显示错误提示
    const message = errorMessage || getErrorMessage(error);
    showToast({
      type: 'error',
      message,
      duration: 5000,
    });

    return [null, error as Error];
  }
}

/**
 * 带重试的异步操作
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        onRetry?.(attempt, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * 防抖函数（带错误处理）
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      try {
        fn.apply(this, args);
      } catch (error) {
        console.error('Debounced function error:', error);
        const message = getErrorMessage(error);
        showToast({
          type: 'error',
          message: `操作失败: ${message}`,
        });
      }
    }, delay);
  };
}

/**
 * 节流函数（带错误处理）
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      try {
        fn.apply(this, args);
      } catch (error) {
        console.error('Throttled function error:', error);
        const message = getErrorMessage(error);
        showToast({
          type: 'error',
          message: `操作失败: ${message}`,
        });
      }
    }
  };
}
