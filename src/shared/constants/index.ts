/**
 * 共享常量定义
 */

import type { AppSettings } from '../types';

// ========== IPC通道常量 ==========

export const IPCChannels = {
  // 窗口控制
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_GET_BOUNDS: 'window:getBounds',
  WINDOW_SET_BOUNDS: 'window:setBounds',

  // 文件操作
  FILE_SELECT: 'file:select',
  FILE_SELECT_DIRECTORY: 'file:selectDirectory',
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_DELETE: 'file:delete',
  FILE_EXISTS: 'file:exists',
  FILE_GET_INFO: 'file:getInfo',

  // 书籍操作
  BOOK_IMPORT: 'book:import',
  BOOK_GET: 'book:get',
  BOOK_GET_ALL: 'book:getAll',
  BOOK_UPDATE: 'book:update',
  BOOK_DELETE: 'book:delete',
  BOOK_SEARCH: 'book:search',
  BOOK_EXTRACT_METADATA: 'book:extractMetadata',
  BOOK_EXTRACT_COVER: 'book:extractCover',

  // 批注操作
  ANNOTATION_CREATE: 'annotation:create',
  ANNOTATION_GET: 'annotation:get',
  ANNOTATION_GET_ALL: 'annotation:getAll',
  ANNOTATION_UPDATE: 'annotation:update',
  ANNOTATION_DELETE: 'annotation:delete',
  ANNOTATION_EXPORT: 'annotation:export',

  // 进度操作
  PROGRESS_SAVE: 'progress:save',
  PROGRESS_GET: 'progress:get',
  PROGRESS_ADD_TIME: 'progress:addTime',

  // 标签操作
  TAG_CREATE: 'tag:create',
  TAG_GET_ALL: 'tag:getAll',
  TAG_GET_BY_BOOK: 'tag:getByBook',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',
  TAG_ADD_TO_BOOK: 'tag:addToBook',
  TAG_REMOVE_FROM_BOOK: 'tag:removeFromBook',

  // 书架操作
  COLLECTION_CREATE: 'collection:create',
  COLLECTION_GET_ALL: 'collection:getAll',
  COLLECTION_GET: 'collection:get',
  COLLECTION_UPDATE: 'collection:update',
  COLLECTION_DELETE: 'collection:delete',
  COLLECTION_ADD_BOOK: 'collection:addBook',
  COLLECTION_REMOVE_BOOK: 'collection:removeBook',
  COLLECTION_GET_BOOKS: 'collection:getBooks',
  COLLECTION_GET_BY_BOOK: 'collection:getByBook',

  // 生词本操作
  WORDBOOK_ADD: 'wordbook:add',
  WORDBOOK_GET_ALL: 'wordbook:getAll',
  WORDBOOK_GET: 'wordbook:get',
  WORDBOOK_UPDATE: 'wordbook:update',
  WORDBOOK_DELETE: 'wordbook:delete',
  WORDBOOK_SEARCH: 'wordbook:search',
  WORDBOOK_GET_BY_BOOK: 'wordbook:getByBook',
  WORDBOOK_GET_STATS: 'wordbook:getStats',

  // 设置操作
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_DELETE: 'settings:delete',
  SETTINGS_CLEAR: 'settings:clear',

  // 数据库操作
  DB_QUERY: 'db:query',
  DB_EXECUTE: 'db:execute',
  DB_TRANSACTION: 'db:transaction',

  // 同步操作
  SYNC_START: 'sync:start',
  SYNC_STOP: 'sync:stop',
  SYNC_GET_STATUS: 'sync:getStatus',
  SYNC_MANUAL: 'sync:manual',

  // 系统操作
  SYSTEM_OPEN_EXTERNAL: 'system:openExternal',
  SYSTEM_SHOW_ITEM_IN_FOLDER: 'system:showItemInFolder',
  SYSTEM_GET_APP_PATH: 'system:getAppPath',
  SYSTEM_GET_VERSION: 'system:getVersion',
} as const;

// ========== 默认设置 ==========

export const DEFAULT_SETTINGS: AppSettings = {
  reader: {
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 1.6,
    marginWidth: 60,
    readingMode: 'paginated',
    flowMode: 'auto',
    pageAnimation: true,
    autoSaveProgress: true,
  },
  appearance: {
    theme: 'light',
    darkMode: false,
    primaryColor: '#3b82f6',
    language: 'zh-CN',
  },
  sync: {
    enabled: false,
    autoSync: true,
    syncInterval: 5,
    syncOnStartup: true,
    conflictResolution: 'newest',
  },
  ai: {
    enabled: false,
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  },
  tts: {
    enabled: false,
    engine: 'system',
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  },
  translation: {
    enabled: false,
    provider: 'youdao',
    sourceLang: 'en',
    targetLang: 'zh-CN',
    autoDetect: true,
  },
  shortcuts: {},
};

// ========== 应用常量 ==========

export const APP_NAME = 'K-Reader';
export const APP_VERSION = '1.0.0';

// ========== 文件格式常量 ==========

export const SUPPORTED_FORMATS = {
  BOOK: ['.epub'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

// ========== 数据库常量 ==========

export const DB_NAME = 'kreader.db';
export const DB_VERSION = 1;

// ========== 错误代码常量 ==========

export const ErrorCodes = {
  // 通用错误
  SUCCESS: 'SUCCESS',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 业务错误
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  BOOK_NOT_FOUND: 'BOOK_NOT_FOUND',
  BOOK_ALREADY_EXISTS: 'BOOK_ALREADY_EXISTS',
  ANNOTATION_NOT_FOUND: 'ANNOTATION_NOT_FOUND',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
} as const;
