/**
 * Toast 通知组件
 * 用于显示成功、错误、警告和信息提示
 */

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from '../../utils/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Toast Store
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration || 3000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // 自动移除
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () =>
    set({ toasts: [] }),
}));

// 便捷方法
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, duration }),
};

// showToast 函数（兼容旧的调用方式）
export const showToast = (options: Omit<Toast, 'id'>) => {
  useToastStore.getState().addToast(options);
};

// Toast 项组件
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = 50;
      const step = 100 / (toast.duration / interval);
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - step;
        });
      }, interval);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [toast.duration]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
  };

  const progressColors = {
    success: 'bg-green-500 dark:bg-green-400',
    error: 'bg-red-500 dark:bg-red-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    info: 'bg-blue-500 dark:bg-blue-400',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`relative mb-2 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ${colors[toast.type]} animate-in slide-in-from-right duration-300`}
      style={{
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {/* 进度条 */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-full transition-all duration-75 ease-linear ${progressColors[toast.type]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start">
        <Icon className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium pr-2">{toast.message}</p>
        <button
          onClick={onRemove}
          className="ml-3 flex-shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/5 p-1 transition-colors"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Toast 容器组件
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-50 w-96 max-w-full">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
