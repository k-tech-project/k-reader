/**
 * Modal 模态框组件
 * 用于显示对话框、确认框等
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { X } from '../../utils/icons';

export interface ModalOptions {
  title: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showFooter?: boolean;
  closeOnOverlay?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalStore {
  isOpen: boolean;
  options: ModalOptions | null;
  open: (options: ModalOptions) => void;
  close: () => void;
}

// Modal Store
export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  options: null,

  open: (options) => {
    set({ isOpen: true, options });
  },

  close: () => {
    set({ isOpen: false, options: null });
  },
}));

// 便捷方法
export const modal = {
  confirm: (options: Omit<ModalOptions, 'confirmText' | 'cancelText' | 'showFooter'>) => {
    return new Promise<boolean>((resolve) => {
      const store = useModalStore.getState();
      store.open({
        ...options,
        confirmText: '确认',
        cancelText: '取消',
        showFooter: true,
        onConfirm: () => {
          options.onConfirm?.();
          resolve(true);
          store.close();
        },
        onCancel: () => {
          options.onCancel?.();
          resolve(false);
          store.close();
        },
      });
    });
  },

  alert: (options: Omit<ModalOptions, 'confirmText' | 'showFooter'>) => {
    return new Promise<void>((resolve) => {
      const store = useModalStore.getState();
      store.open({
        ...options,
        confirmText: '确定',
        showFooter: true,
        onConfirm: () => {
          options.onConfirm?.();
          resolve();
          store.close();
        },
        onCancel: () => {
          store.close();
          resolve();
        },
      });
    });
  },

  custom: (options: ModalOptions) => {
    useModalStore.getState().open(options);
  },

  close: () => {
    useModalStore.getState().close();
  },
};

// Modal 组件
export function Modal() {
  const { isOpen, options, close } = useModalStore();

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options?.closeOnOverlay !== false) {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, options]);

  if (!isOpen || !options) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && options.closeOnOverlay !== false) {
      close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-full ${sizes[options.size || 'md']} mx-4 rounded-lg bg-white shadow-xl dark:bg-gray-800 animate-in zoom-in-95 duration-200`}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {options.title}
          </h3>
          <button
            onClick={close}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          {options.content}
        </div>

        {/* 底部按钮 */}
        {options.showFooter !== false && (
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            {options.onCancel && (
              <button
                onClick={() => {
                  options.onCancel?.();
                  close();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {options.cancelText || '取消'}
              </button>
            )}
            {options.onConfirm && (
              <button
                onClick={() => {
                  options.onConfirm?.();
                  close();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {options.confirmText || '确认'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
