/**
 * 阅读器模块类型定义
 */

import type { Book } from '@shared/types';

// EPUB.js 类型
export interface EpubBookOptions {
  encoding?: string;
  replacements?: string;
  openAs?: string;
}

export interface EpubRenditionOptions {
  width?: number | string;
  height?: number | string;
  spread?: 'none' | 'always' | 'auto';
  flow?: 'paginated' | 'scrolled' | 'scrolled-doc' | 'auto';
  layout?: 'pre-paginated' | 'reflowable';
  stylesheet?: string;
  allowScriptedContent?: boolean;
  allowPopups?: boolean;
}

// 阅读器状态
export interface ReaderLocation {
  start: {
    cfi: string;
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
  end: {
    cfi: string;
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
  atStart: boolean;
  atEnd: boolean;
}

// 阅读器设置
export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  marginWidth: number;
  readingMode: 'paginated' | 'scrolled';
  theme: ReaderTheme;
  pageAnimation: PageAnimationType;
}

// 翻页动画类型
export type PageAnimationType = 'none' | 'fade' | 'slide' | 'scale';

// 翻页动画配置
export const PAGE_ANIMATIONS: Record<PageAnimationType, { name: string; description: string }> = {
  none: { name: '无动画', description: '无过渡效果' },
  fade: { name: '淡入淡出', description: '页面渐变过渡' },
  slide: { name: '滑动', description: '页面滑动切换' },
  scale: { name: '缩放', description: '页面缩放过渡' },
};

// 阅读器主题
export interface ReaderTheme {
  id: string;
  name: string;
  background: string;
  color: string;
  linkColor?: string;
  fontFamily?: string;
}

// 预设主题
export const PRESET_THEMES: Record<string, ReaderTheme> = {
  light: {
    id: 'light',
    name: '浅色',
    background: '#ffffff',
    color: '#000000',
    linkColor: '#0000ff',
  },
  dark: {
    id: 'dark',
    name: '深色',
    background: '#1a1a1a',
    color: '#e0e0e0',
    linkColor: '#64b5f6',
  },
  sepia: {
    id: 'sepia',
    name: '护眼',
    background: '#f4ecd8',
    color: '#5c4b37',
    linkColor: '#8b4513',
  },
};

// 目录项
export interface TOCItem {
  id: string;
  label: string;
  href: string;
  parent?: string;
  children?: TOCItem[];
}

// 阅读器事件
export type ReaderEventType =
  | 'ready'
  | 'loaded'
  | 'locationChanged'
  | 'rendered'
  | 'relocated'
  | 'selected'
  | 'chapterChanged';

export interface ReaderEvent {
  type: ReaderEventType;
  data: any;
}

// 阅读器初始化选项
export interface EpubReaderInitOptions {
  book: Book;
  element: HTMLElement;
  initialCfi?: string;
  settings?: Partial<ReaderSettings>;
}
