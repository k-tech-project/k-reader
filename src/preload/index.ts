/**
 * Preload脚本 - 暴露API给渲染进程
 */
import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannels } from '@shared/constants';
import type {
  WindowBounds,
  SelectFileOptions,
  FileInfo,
  Book,
  BookMetadata,
  Annotation,
  ReadingProgress,
  Tag,
  ExportResult,
  VersionInfo,
} from '@shared/types';

// 定义ElectronAPI接口
interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    getBounds: () => Promise<WindowBounds | null>;
    setBounds: (bounds: Partial<WindowBounds>) => Promise<void>;
  };

  file: {
    select: (options: SelectFileOptions) => Promise<string[]>;
    selectDirectory: (options: any) => Promise<string | null>;
    read: (options: any) => Promise<string | Buffer>;
    write: (options: any) => Promise<void>;
    delete: (path: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    getInfo: (path: string) => Promise<FileInfo | null>;
  };

  book: {
    import: (options: any) => Promise<Book>;
    getAll: (options?: any) => Promise<Book[]>;
    get: (id: string) => Promise<Book | null>;
    update: (id: string, updates: Partial<Book>) => Promise<void>;
    delete: (id: string, options?: any) => Promise<void>;
    search: (options: any) => Promise<Book[]>;
    extractMetadata: (filePath: string) => Promise<BookMetadata>;
    extractCover: (filePath: string) => Promise<string>;
  };

  annotation: {
    create: (data: any) => Promise<Annotation>;
    getAll: (options: any) => Promise<Annotation[]>;
    update: (id: string, updates: Partial<Annotation>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    export: (options: any) => Promise<ExportResult>;
  };

  progress: {
    save: (data: any) => Promise<void>;
    get: (bookId: string) => Promise<ReadingProgress | null>;
    addTime: (data: any) => Promise<void>;
  };

  tag: {
    create: (data: any) => Promise<Tag>;
    getAll: () => Promise<Tag[]>;
    addToBook: (data: any) => Promise<void>;
    removeFromBook: (data: any) => Promise<void>;
  };

  settings: {
    get: (key?: string) => Promise<any>;
    set: (key: string | Record<string, any>, value?: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };

  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>;
    execute: (sql: string, params?: any[]) => Promise<any>;
    transaction: (callback: any) => Promise<void>;
  };

  sync: {
    start: (options: any) => Promise<void>;
    stop: () => Promise<void>;
    getStatus: () => Promise<any>;
    manual: (options: any) => Promise<void>;
  };

  system: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
    getAppPath: (name: string) => Promise<string>;
    getVersion: () => Promise<VersionInfo>;
  };
}

// 实现API
const electronAPI: ElectronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke(IPCChannels.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPCChannels.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPCChannels.WINDOW_CLOSE),
    getBounds: () => ipcRenderer.invoke(IPCChannels.WINDOW_GET_BOUNDS),
    setBounds: (bounds) => ipcRenderer.invoke(IPCChannels.WINDOW_SET_BOUNDS, bounds),
  },

  file: {
    select: (options) => ipcRenderer.invoke(IPCChannels.FILE_SELECT, options),
    selectDirectory: (options) => ipcRenderer.invoke(IPCChannels.FILE_SELECT_DIRECTORY, options),
    read: (options) => ipcRenderer.invoke(IPCChannels.FILE_READ, options),
    write: (options) => ipcRenderer.invoke(IPCChannels.FILE_WRITE, options),
    delete: (path) => ipcRenderer.invoke(IPCChannels.FILE_DELETE, path),
    exists: (path) => ipcRenderer.invoke(IPCChannels.FILE_EXISTS, path),
    getInfo: (path) => ipcRenderer.invoke(IPCChannels.FILE_GET_INFO, path),
  },

  book: {
    import: (options) => ipcRenderer.invoke(IPCChannels.BOOK_IMPORT, options),
    getAll: (options) => ipcRenderer.invoke(IPCChannels.BOOK_GET_ALL, options),
    get: (id) => ipcRenderer.invoke(IPCChannels.BOOK_GET, id),
    update: (id, updates) => ipcRenderer.invoke(IPCChannels.BOOK_UPDATE, id, updates),
    delete: (id, options) => ipcRenderer.invoke(IPCChannels.BOOK_DELETE, id, options),
    search: (options) => ipcRenderer.invoke(IPCChannels.BOOK_SEARCH, options),
    extractMetadata: (filePath) => ipcRenderer.invoke(IPCChannels.BOOK_EXTRACT_METADATA, filePath),
    extractCover: (filePath) => ipcRenderer.invoke(IPCChannels.BOOK_EXTRACT_COVER, filePath),
  },

  annotation: {
    create: (data) => ipcRenderer.invoke(IPCChannels.ANNOTATION_CREATE, data),
    getAll: (options) => ipcRenderer.invoke(IPCChannels.ANNOTATION_GET_ALL, options),
    update: (id, updates) => ipcRenderer.invoke(IPCChannels.ANNOTATION_UPDATE, id, updates),
    delete: (id) => ipcRenderer.invoke(IPCChannels.ANNOTATION_DELETE, id),
    export: (options) => ipcRenderer.invoke(IPCChannels.ANNOTATION_EXPORT, options),
  },

  progress: {
    save: (data) => ipcRenderer.invoke(IPCChannels.PROGRESS_SAVE, data),
    get: (bookId) => ipcRenderer.invoke(IPCChannels.PROGRESS_GET, bookId),
    addTime: (data) => ipcRenderer.invoke(IPCChannels.PROGRESS_ADD_TIME, data),
  },

  tag: {
    create: (data) => ipcRenderer.invoke(IPCChannels.TAG_CREATE, data),
    getAll: () => ipcRenderer.invoke(IPCChannels.TAG_GET_ALL),
    addToBook: (data) => ipcRenderer.invoke(IPCChannels.TAG_ADD_TO_BOOK, data),
    removeFromBook: (data) => ipcRenderer.invoke(IPCChannels.TAG_REMOVE_FROM_BOOK, data),
  },

  settings: {
    get: (key) => ipcRenderer.invoke(IPCChannels.SETTINGS_GET, key),
    set: (key, value) => ipcRenderer.invoke(IPCChannels.SETTINGS_SET, key, value),
    delete: (key) => ipcRenderer.invoke(IPCChannels.SETTINGS_DELETE, key),
    clear: () => ipcRenderer.invoke(IPCChannels.SETTINGS_CLEAR),
  },

  db: {
    query: (sql, params) => ipcRenderer.invoke(IPCChannels.DB_QUERY, sql, params),
    execute: (sql, params) => ipcRenderer.invoke(IPCChannels.DB_EXECUTE, sql, params),
    transaction: (callback) => ipcRenderer.invoke(IPCChannels.DB_TRANSACTION, callback),
  },

  sync: {
    start: (options) => ipcRenderer.invoke(IPCChannels.SYNC_START, options),
    stop: () => ipcRenderer.invoke(IPCChannels.SYNC_STOP),
    getStatus: () => ipcRenderer.invoke(IPCChannels.SYNC_GET_STATUS),
    manual: (options) => ipcRenderer.invoke(IPCChannels.SYNC_MANUAL, options),
  },

  system: {
    openExternal: (url) => ipcRenderer.invoke(IPCChannels.SYSTEM_OPEN_EXTERNAL, url),
    showItemInFolder: (path) => ipcRenderer.invoke(IPCChannels.SYSTEM_SHOW_ITEM_IN_FOLDER, path),
    getAppPath: (name) => ipcRenderer.invoke(IPCChannels.SYSTEM_GET_APP_PATH, name),
    getVersion: () => ipcRenderer.invoke(IPCChannels.SYSTEM_GET_VERSION),
  },
};

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
