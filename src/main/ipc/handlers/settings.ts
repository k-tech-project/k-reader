/**
 * 设置IPC处理器
 */
import Store from 'electron-store';
import { DEFAULT_SETTINGS } from '@shared/constants';
import type { AppSettings } from '@shared/types';

// 延迟初始化 Store
let store: Store<AppSettings> | null = null;

function getStore(): Store<AppSettings> {
  if (!store) {
    store = new Store<AppSettings>({
      defaults: DEFAULT_SETTINGS,
    });
  }
  return store;
}

export class SettingsHandlers {
  /**
   * 获取设置
   */
  static get(key?: string): any {
    const s = getStore();
    if (key) {
      return s.get(key as any);
    }
    return s.store;
  }

  /**
   * 设置
   */
  static set(key: string | Record<string, any>, value?: any): void {
    const s = getStore();

    // 检测是否是 AI 设置更新
    const isAISettingUpdate = typeof key === 'string'
      ? key === 'ai'
      : typeof key === 'object' && 'ai' in key;

    if (typeof key === 'object') {
      // 批量设置
      Object.entries(key).forEach(([k, v]) => {
        s.set(k as any, v);
      });
    } else {
      // 单个设置
      s.set(key as any, value);
    }

    // 如果是 AI 设置更新，重置 SummaryService 缓存
    if (isAISettingUpdate) {
      // 动态导入避免循环依赖
      import('./ai').then(({ resetSummaryService }) => {
        console.log('[SettingsHandlers] AI settings updated, resetting SummaryService');
        resetSummaryService();
      });
    }
  }

  /**
   * 删除设置
   */
  static delete(key: string): void {
    const s = getStore();
    s.delete(key as any);
  }

  /**
   * 清空所有设置
   */
  static clear(): void {
    const s = getStore();
    s.clear();
  }
}
