/**
 * 阅读器状态管理
 */
import { create } from 'zustand';
import type { ReaderSettings } from '@shared/types';

interface ReaderState extends ReaderSettings {
  // 当前阅读位置
  currentCFI: string;
  currentChapter: number;
  progress: number;

  // 主题
  theme: string;

  // 操作
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  setCurrentCFI: (cfi: string) => void;
  setCurrentChapter: (chapter: number) => void;
  setProgress: (progress: number) => void;
  setTheme: (theme: string) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  // 初始状态 - 默认阅读器设置
  fontSize: 16,
  fontFamily: 'serif',
  lineHeight: 1.6,
  marginWidth: 60,
  readingMode: 'paginated',
  flowMode: 'auto',
  pageAnimation: true,
  autoSaveProgress: true,

  // 阅读位置
  currentCFI: '',
  currentChapter: 0,
  progress: 0,

  // 主题
  theme: 'light',

  // 操作
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setCurrentCFI: (cfi) => set({ currentCFI: cfi }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setProgress: (progress) => set({ progress }),
  setTheme: (theme) => set({ theme }),
}));
