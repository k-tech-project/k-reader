"use strict";
const electron = require("electron");
const IPCChannels = {
  // 窗口控制
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
  WINDOW_GET_BOUNDS: "window:getBounds",
  WINDOW_SET_BOUNDS: "window:setBounds",
  // 文件操作
  FILE_SELECT: "file:select",
  FILE_SELECT_DIRECTORY: "file:selectDirectory",
  FILE_READ: "file:read",
  FILE_WRITE: "file:write",
  FILE_DELETE: "file:delete",
  FILE_EXISTS: "file:exists",
  FILE_GET_INFO: "file:getInfo",
  // 书籍操作
  BOOK_IMPORT: "book:import",
  BOOK_GET: "book:get",
  BOOK_GET_ALL: "book:getAll",
  BOOK_UPDATE: "book:update",
  BOOK_DELETE: "book:delete",
  BOOK_SEARCH: "book:search",
  BOOK_EXTRACT_METADATA: "book:extractMetadata",
  BOOK_EXTRACT_COVER: "book:extractCover",
  // 批注操作
  ANNOTATION_CREATE: "annotation:create",
  ANNOTATION_GET_ALL: "annotation:getAll",
  ANNOTATION_UPDATE: "annotation:update",
  ANNOTATION_DELETE: "annotation:delete",
  ANNOTATION_EXPORT: "annotation:export",
  // 进度操作
  PROGRESS_SAVE: "progress:save",
  PROGRESS_GET: "progress:get",
  PROGRESS_ADD_TIME: "progress:addTime",
  // 标签操作
  TAG_CREATE: "tag:create",
  TAG_GET_ALL: "tag:getAll",
  TAG_ADD_TO_BOOK: "tag:addToBook",
  TAG_REMOVE_FROM_BOOK: "tag:removeFromBook",
  // 设置操作
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_DELETE: "settings:delete",
  SETTINGS_CLEAR: "settings:clear",
  // 数据库操作
  DB_QUERY: "db:query",
  DB_EXECUTE: "db:execute",
  DB_TRANSACTION: "db:transaction",
  // 同步操作
  SYNC_START: "sync:start",
  SYNC_STOP: "sync:stop",
  SYNC_GET_STATUS: "sync:getStatus",
  SYNC_MANUAL: "sync:manual",
  // 系统操作
  SYSTEM_OPEN_EXTERNAL: "system:openExternal",
  SYSTEM_SHOW_ITEM_IN_FOLDER: "system:showItemInFolder",
  SYSTEM_GET_APP_PATH: "system:getAppPath",
  SYSTEM_GET_VERSION: "system:getVersion"
};
const electronAPI = {
  window: {
    minimize: () => electron.ipcRenderer.invoke(IPCChannels.WINDOW_MINIMIZE),
    maximize: () => electron.ipcRenderer.invoke(IPCChannels.WINDOW_MAXIMIZE),
    close: () => electron.ipcRenderer.invoke(IPCChannels.WINDOW_CLOSE),
    getBounds: () => electron.ipcRenderer.invoke(IPCChannels.WINDOW_GET_BOUNDS),
    setBounds: (bounds) => electron.ipcRenderer.invoke(IPCChannels.WINDOW_SET_BOUNDS, bounds)
  },
  file: {
    select: (options) => electron.ipcRenderer.invoke(IPCChannels.FILE_SELECT, options),
    selectDirectory: (options) => electron.ipcRenderer.invoke(IPCChannels.FILE_SELECT_DIRECTORY, options),
    read: (options) => electron.ipcRenderer.invoke(IPCChannels.FILE_READ, options),
    write: (options) => electron.ipcRenderer.invoke(IPCChannels.FILE_WRITE, options),
    delete: (path) => electron.ipcRenderer.invoke(IPCChannels.FILE_DELETE, path),
    exists: (path) => electron.ipcRenderer.invoke(IPCChannels.FILE_EXISTS, path),
    getInfo: (path) => electron.ipcRenderer.invoke(IPCChannels.FILE_GET_INFO, path)
  },
  book: {
    import: (options) => electron.ipcRenderer.invoke(IPCChannels.BOOK_IMPORT, options),
    getAll: (options) => electron.ipcRenderer.invoke(IPCChannels.BOOK_GET_ALL, options),
    get: (id) => electron.ipcRenderer.invoke(IPCChannels.BOOK_GET, id),
    update: (id, updates) => electron.ipcRenderer.invoke(IPCChannels.BOOK_UPDATE, id, updates),
    delete: (id, options) => electron.ipcRenderer.invoke(IPCChannels.BOOK_DELETE, id, options),
    search: (options) => electron.ipcRenderer.invoke(IPCChannels.BOOK_SEARCH, options),
    extractMetadata: (filePath) => electron.ipcRenderer.invoke(IPCChannels.BOOK_EXTRACT_METADATA, filePath),
    extractCover: (filePath) => electron.ipcRenderer.invoke(IPCChannels.BOOK_EXTRACT_COVER, filePath)
  },
  annotation: {
    create: (data) => electron.ipcRenderer.invoke(IPCChannels.ANNOTATION_CREATE, data),
    getAll: (options) => electron.ipcRenderer.invoke(IPCChannels.ANNOTATION_GET_ALL, options),
    update: (id, updates) => electron.ipcRenderer.invoke(IPCChannels.ANNOTATION_UPDATE, id, updates),
    delete: (id) => electron.ipcRenderer.invoke(IPCChannels.ANNOTATION_DELETE, id),
    export: (options) => electron.ipcRenderer.invoke(IPCChannels.ANNOTATION_EXPORT, options)
  },
  progress: {
    save: (data) => electron.ipcRenderer.invoke(IPCChannels.PROGRESS_SAVE, data),
    get: (bookId) => electron.ipcRenderer.invoke(IPCChannels.PROGRESS_GET, bookId),
    addTime: (data) => electron.ipcRenderer.invoke(IPCChannels.PROGRESS_ADD_TIME, data)
  },
  tag: {
    create: (data) => electron.ipcRenderer.invoke(IPCChannels.TAG_CREATE, data),
    getAll: () => electron.ipcRenderer.invoke(IPCChannels.TAG_GET_ALL),
    addToBook: (data) => electron.ipcRenderer.invoke(IPCChannels.TAG_ADD_TO_BOOK, data),
    removeFromBook: (data) => electron.ipcRenderer.invoke(IPCChannels.TAG_REMOVE_FROM_BOOK, data)
  },
  settings: {
    get: (key) => electron.ipcRenderer.invoke(IPCChannels.SETTINGS_GET, key),
    set: (key, value) => electron.ipcRenderer.invoke(IPCChannels.SETTINGS_SET, key, value),
    delete: (key) => electron.ipcRenderer.invoke(IPCChannels.SETTINGS_DELETE, key),
    clear: () => electron.ipcRenderer.invoke(IPCChannels.SETTINGS_CLEAR)
  },
  db: {
    query: (sql, params) => electron.ipcRenderer.invoke(IPCChannels.DB_QUERY, sql, params),
    execute: (sql, params) => electron.ipcRenderer.invoke(IPCChannels.DB_EXECUTE, sql, params),
    transaction: (callback) => electron.ipcRenderer.invoke(IPCChannels.DB_TRANSACTION, callback)
  },
  sync: {
    start: (options) => electron.ipcRenderer.invoke(IPCChannels.SYNC_START, options),
    stop: () => electron.ipcRenderer.invoke(IPCChannels.SYNC_STOP),
    getStatus: () => electron.ipcRenderer.invoke(IPCChannels.SYNC_GET_STATUS),
    manual: (options) => electron.ipcRenderer.invoke(IPCChannels.SYNC_MANUAL, options)
  },
  system: {
    openExternal: (url) => electron.ipcRenderer.invoke(IPCChannels.SYSTEM_OPEN_EXTERNAL, url),
    showItemInFolder: (path) => electron.ipcRenderer.invoke(IPCChannels.SYSTEM_SHOW_ITEM_IN_FOLDER, path),
    getAppPath: (name) => electron.ipcRenderer.invoke(IPCChannels.SYSTEM_GET_APP_PATH, name),
    getVersion: () => electron.ipcRenderer.invoke(IPCChannels.SYSTEM_GET_VERSION)
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
