/**
 * UI状态管理
 */
import { create } from 'zustand';

interface UIState {
  // 侧边栏
  sidebarOpen: boolean;
  sidebarTab: 'toc' | 'annotations' | 'search';

  // 工具栏
  toolbarVisible: boolean;

  // 加载状态
  loading: boolean;

  // 操作
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: 'toc' | 'annotations' | 'search') => void;
  setToolbarVisible: (visible: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  sidebarOpen: false,
  sidebarTab: 'toc',
  toolbarVisible: true,
  loading: false,

  // 操作
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setToolbarVisible: (visible) => set({ toolbarVisible: visible }),
  setLoading: (loading) => set({ loading: loading }),
}));
