/**
 * 设置状态管理
 */
import { create } from 'zustand';
import type { AppSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

interface SettingsState extends AppSettings {
  // 操作
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // 初始状态
  ...DEFAULT_SETTINGS,

  // 操作
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  resetSettings: () => set(DEFAULT_SETTINGS),
}));
