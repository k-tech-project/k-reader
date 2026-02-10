/**
 * 共享类型定义
 * 用于主进程和渲染进程之间的数据交互
 */

// ========== 书籍相关类型 ==========

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishDate?: Date;
  isbn?: string;
  language: string;
  description?: string;
  coverUrl?: string;
  filePath: string;
  fileSize: number;
  format: 'epub' | 'pdf';
  addedAt: Date;
  lastReadAt?: Date;
  readingTime: number;
  progress: number;
  tags: string[];
  collections: string[];
  metadata?: BookMetadata;
}

export interface BookMetadata {
  identifier?: string;
  creator?: string;
  contributor?: string;
  rights?: string;
  modifiedDate?: Date;
  spine?: SpineItem[];
  toc?: TOCItem[];
}

export interface SpineItem {
  id: string;
  href: string;
  mediaType: string;
}

export interface TOCItem {
  id: string;
  label: string;
  href: string;
  parent?: string;
  children?: TOCItem[];
}

// ========== 批注相关类型 ==========

export type AnnotationType = 'highlight' | 'underline' | 'note' | 'bookmark';

export interface Annotation {
  id: string;
  bookId: string;
  type: AnnotationType;
  cfi: string;
  cfiRange?: string;
  selectedText?: string;
  note?: string;
  color?: string;
  chapterIndex?: number;
  chapterTitle?: string;
  pageNumber?: number;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  tags?: string[];
}

// ========== 阅读进度相关类型 ==========

export interface ReadingProgress {
  bookId: string;
  currentCFI: string;
  currentChapter: number;
  progressPercentage: number;
  totalPages?: number;
  currentPage?: number;
  readingTime: number;
  lastReadAt: Date;
  locations?: Location[];
  synced: boolean;
}

export interface Location {
  cfi: string;
  percentage: number;
  timestamp: Date;
}

// ========== 设置相关类型 ==========

export interface AppSettings {
  reader: ReaderSettings;
  appearance: AppearanceSettings;
  sync: SyncSettings;
  ai: AISettings;
  tts: TTSSettings;
  translation: TranslationSettings;
  shortcuts: ShortcutSettings;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  marginWidth: number;
  readingMode: 'paginated' | 'scrolled';
  flowMode: 'auto' | 'paginated' | 'scrolled-doc';
  pageAnimation: boolean;
  autoSaveProgress: boolean;
}

export interface AppearanceSettings {
  theme: string;
  customThemes?: Theme[];
  darkMode: boolean;
  primaryColor: string;
  language: string;
}

export interface Theme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  colors?: Record<string, string>;
}

export interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  syncOnStartup: boolean;
  conflictResolution: 'local' | 'remote' | 'newest' | 'manual';
}

export interface AISettings {
  enabled: boolean;
  provider: 'openai' | 'claude' | 'zhipu' | 'qianwen' | 'custom';
  apiKey: string;
  baseURL?: string; // 自定义 API 端点（用于国内模型或代理）
  model: string;
  temperature: number;
  maxTokens: number;
}

// 章节总结接口
export interface ChapterSummary {
  id: string;
  bookId: string;
  chapterIndex: number;
  chapterTitle?: string;
  summary: string;
  model: string;
  createdAt: Date;
}

export interface TTSSettings {
  enabled: boolean;
  engine: 'system' | 'cloud';
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface TranslationSettings {
  enabled: boolean;
  provider: 'youdao' | 'deepl' | 'google';
  sourceLang: string;
  targetLang: string;
  autoDetect: boolean;
}

export interface ShortcutSettings {
  [key: string]: string;
}

// ========== 标签和书架类型 ==========

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  bookCount?: number;
}

// ========== 同步相关类型 ==========

export interface SyncStatus {
  isRunning: boolean;
  lastSyncAt?: Date;
  isSyncing: boolean;
  progress: number;
  error?: string;
}

export interface SyncOperation {
  id: string;
  action: 'create' | 'update' | 'delete';
  resourceType: 'book' | 'annotation' | 'progress' | 'settings';
  resourceId: string;
  data?: any;
  timestamp: number;
  retries: number;
}

// ========== 窗口相关类型 ==========

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ========== 文件相关类型 ==========

export interface FileInfo {
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
  isFile: boolean;
}

export interface SelectFileOptions {
  title?: string;
  filters?: FileFilter[];
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

// ========== API响应类型 ==========

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
  timestamp: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// ========== 导出结果类型 ==========

export interface ExportResult {
  success: boolean;
  filePath?: string;
  data?: string;
  error?: string;
}

// ========== 版本信息类型 ==========

export interface VersionInfo {
  app: string;
  electron: string;
  chrome: string;
  node: string;
}

// ========== 翻译和词典类型 ==========

export interface WordBookEntry {
  id: string;
  word: string;
  translation?: string;
  definition?: string;
  language: string;
  bookId?: string;
  context?: string;
  createdAt: Date;
}

export interface TranslationHistory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  createdAt: Date;
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider?: string;
}

export interface DictEntry {
  word: string;
  pronunciation?: string;
  definitions: DictDefinition[];
  examples?: string[];
  synonyms?: string[];
}

export interface DictDefinition {
  partOfSpeech: string;
  definition: string;
  examples?: string[];
}

