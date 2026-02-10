"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");
const uuid = require("uuid");
const Database = require("better-sqlite3");
const JSZip = require("jszip");
const xml2js = require("xml2js");
const promises = require("fs/promises");
const crypto = require("crypto");
const openai = require("@langchain/openai");
const tiktoken = require("tiktoken");
const anthropic = require("@langchain/anthropic");
const textsplitters = require("@langchain/textsplitters");
const CryptoJS = require("crypto-js");
let store$1 = null;
function getStore$1() {
  if (!store$1) {
    store$1 = new Store();
  }
  return store$1;
}
class WindowManager {
  /**
   * 创建主窗口
   */
  static createMainWindow() {
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const savedBounds = getStore$1().get("windowBounds");
    const defaultBounds = {
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      x: void 0,
      y: void 0
    };
    const bounds = savedBounds || defaultBounds;
    let icon = void 0;
    if (process.platform !== "darwin") {
      const iconPath = path.join(process.resourcesPath || path.join(__dirname, "../../.."), "resources", "icon.png");
      if (process.env.NODE_ENV === "development") {
        const devIconPath = path.join(process.cwd(), "resources", "icon.png");
        if (fs.existsSync(devIconPath)) {
          icon = electron.nativeImage.createFromPath(devIconPath);
        }
      } else if (fs.existsSync(iconPath)) {
        icon = electron.nativeImage.createFromPath(iconPath);
      }
    }
    const window = new electron.BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      frame: process.platform === "darwin",
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
      icon,
      // 设置应用图标
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: true
      }
    });
    window.once("ready-to-show", () => {
      window.show();
    });
    const saveBounds = () => {
      if (!window.isMaximized() && !window.isMinimized()) {
        const bounds2 = window.getBounds();
        getStore$1().set("windowBounds", bounds2);
      }
    };
    window.on("resize", saveBounds);
    window.on("move", saveBounds);
    return window;
  }
  /**
   * 最小化窗口
   */
  static minimize(window) {
    window.minimize();
  }
  /**
   * 最大化/还原窗口
   */
  static toggleMaximize(window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
  /**
   * 关闭窗口
   */
  static close(window) {
    window.close();
  }
  /**
   * 获取窗口边界
   */
  static getBounds(window) {
    return window.getBounds();
  }
  /**
   * 设置窗口边界
   */
  static setBounds(window, bounds) {
    window.setBounds(bounds);
  }
}
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
  TAG_GET_BY_BOOK: "tag:getByBook",
  TAG_UPDATE: "tag:update",
  TAG_DELETE: "tag:delete",
  TAG_ADD_TO_BOOK: "tag:addToBook",
  TAG_REMOVE_FROM_BOOK: "tag:removeFromBook",
  // 书架操作
  COLLECTION_CREATE: "collection:create",
  COLLECTION_GET_ALL: "collection:getAll",
  COLLECTION_GET: "collection:get",
  COLLECTION_UPDATE: "collection:update",
  COLLECTION_DELETE: "collection:delete",
  COLLECTION_ADD_BOOK: "collection:addBook",
  COLLECTION_REMOVE_BOOK: "collection:removeBook",
  COLLECTION_GET_BOOKS: "collection:getBooks",
  COLLECTION_GET_BY_BOOK: "collection:getByBook",
  // 生词本操作
  WORDBOOK_ADD: "wordbook:add",
  WORDBOOK_GET_ALL: "wordbook:getAll",
  WORDBOOK_GET: "wordbook:get",
  WORDBOOK_UPDATE: "wordbook:update",
  WORDBOOK_DELETE: "wordbook:delete",
  WORDBOOK_SEARCH: "wordbook:search",
  WORDBOOK_GET_BY_BOOK: "wordbook:getByBook",
  WORDBOOK_GET_STATS: "wordbook:getStats",
  // 设置操作
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  SETTINGS_DELETE: "settings:delete",
  SETTINGS_CLEAR: "settings:clear",
  // 数据库操作
  DB_QUERY: "db:query",
  DB_EXECUTE: "db:execute",
  DB_TRANSACTION: "db:transaction",
  // AI 操作
  AI_SUMMARIZE_CHAPTER: "ai:summarizeChapter",
  AI_SUMMARIZE_CHAPTERS: "ai:summarizeChapters",
  AI_GET_SUMMARY: "ai:getSummary",
  AI_GET_ALL_SUMMARIES: "ai:getAllSummaries",
  AI_DELETE_SUMMARY: "ai:deleteSummary",
  AI_CHECK_CONFIG: "ai:checkConfig",
  // 系统操作
  SYSTEM_OPEN_EXTERNAL: "system:openExternal",
  SYSTEM_SHOW_ITEM_IN_FOLDER: "system:showItemInFolder",
  SYSTEM_GET_APP_PATH: "system:getAppPath",
  SYSTEM_GET_VERSION: "system:getVersion"
};
const DEFAULT_SETTINGS = {
  reader: {
    fontSize: 16,
    fontFamily: "serif",
    lineHeight: 1.6,
    marginWidth: 60,
    readingMode: "paginated",
    flowMode: "auto",
    pageAnimation: true,
    autoSaveProgress: true
  },
  appearance: {
    theme: "light",
    darkMode: false,
    primaryColor: "#3b82f6",
    language: "zh-CN"
  },
  sync: {
    enabled: false,
    autoSync: true,
    syncInterval: 5,
    syncOnStartup: true,
    conflictResolution: "newest"
  },
  ai: {
    enabled: false,
    provider: "openai",
    apiKey: "",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 1e3
  },
  tts: {
    enabled: false,
    engine: "system",
    voice: "default",
    rate: 1,
    pitch: 1,
    volume: 1
  },
  translation: {
    enabled: false,
    provider: "youdao",
    sourceLang: "en",
    targetLang: "zh-CN",
    autoDetect: true
  },
  shortcuts: {}
};
const DB_NAME = "kreader.db";
class WindowHandlers {
  /**
   * 最小化窗口
   */
  static minimize(window) {
    WindowManager.minimize(window);
  }
  /**
   * 最大化/还原窗口
   */
  static toggleMaximize(window) {
    WindowManager.toggleMaximize(window);
  }
  /**
   * 关闭窗口
   */
  static close(window) {
    WindowManager.close(window);
  }
  /**
   * 获取窗口边界
   */
  static getBounds(window) {
    return WindowManager.getBounds(window);
  }
  /**
   * 设置窗口边界
   */
  static setBounds(window, bounds) {
    WindowManager.setBounds(window, bounds);
  }
}
class FileHandlers {
  /**
   * 选择文件
   */
  static async select(options) {
    const win = electron.BrowserWindow.getFocusedWindow() || electron.BrowserWindow.getAllWindows()[0];
    if (!win) {
      return [];
    }
    const result = await electron.dialog.showOpenDialog(win, {
      title: options.title || "选择文件",
      filters: options.filters?.map((f) => ({
        name: f.name,
        extensions: f.extensions
      })),
      properties: options.properties || ["openFile"]
    });
    if (result.canceled) {
      return [];
    }
    return result.filePaths;
  }
  /**
   * 选择目录
   */
  static async selectDirectory(options) {
    const win = electron.BrowserWindow.getFocusedWindow() || electron.BrowserWindow.getAllWindows()[0];
    if (!win) {
      return null;
    }
    const result = await electron.dialog.showOpenDialog(win, {
      title: options.title || "选择目录",
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  }
  /**
   * 读取文件
   */
  static async read(filePath) {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      console.error("Failed to read file:", error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }
  /**
   * 读取文本文件
   */
  static async readText(filePath, encoding = "utf-8") {
    try {
      return await fs.promises.readFile(filePath, encoding);
    } catch (error) {
      console.error("Failed to read text file:", error);
      throw new Error(`Failed to read text file: ${filePath}`);
    }
  }
  /**
   * 写入文件
   */
  static async write(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(filePath, data);
    } catch (error) {
      console.error("Failed to write file:", error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }
  /**
   * 删除文件
   */
  static async delete(filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw new Error(`Failed to delete file: ${filePath}`);
    }
  }
  /**
   * 检查文件是否存在
   */
  static async exists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * 获取文件信息
   */
  static async getInfo(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      console.error("Failed to get file info:", error);
      return null;
    }
  }
  /**
   * 复制文件
   */
  static async copy(sourcePath, targetPath) {
    try {
      const dir = path.dirname(targetPath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.copyFile(sourcePath, targetPath);
    } catch (error) {
      console.error("Failed to copy file:", error);
      throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}`);
    }
  }
  /**
   * 移动文件
   */
  static async move(sourcePath, targetPath) {
    try {
      const dir = path.dirname(targetPath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.rename(sourcePath, targetPath);
    } catch (error) {
      console.error("Failed to move file:", error);
      throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}`);
    }
  }
  /**
   * 创建目录
   */
  static async mkdir(dirPath, recursive = true) {
    try {
      await fs.promises.mkdir(dirPath, { recursive });
    } catch (error) {
      console.error("Failed to create directory:", error);
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }
  /**
   * 读取目录内容
   */
  static async readdir(dirPath) {
    try {
      return await fs.promises.readdir(dirPath);
    } catch (error) {
      console.error("Failed to read directory:", error);
      throw new Error(`Failed to read directory: ${dirPath}`);
    }
  }
  /**
   * 获取文件扩展名
   */
  static getExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }
  /**
   * 获取文件名（不含扩展名）
   */
  static getBaseName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }
  /**
   * 获取目录名
   */
  static getDirName(filePath) {
    return path.dirname(filePath);
  }
  /**
   * 拼接路径
   */
  static join(...paths) {
    return path.join(...paths);
  }
  /**
   * 规范化路径
   */
  static normalize(filePath) {
    return path.normalize(filePath);
  }
  /**
   * 获取用户数据目录
   */
  static getUserDataPath() {
    const { app } = require("electron");
    return app.getPath("userData");
  }
  /**
   * 获取临时目录
   */
  static getTempPath() {
    const { app } = require("electron");
    return app.getPath("temp");
  }
  /**
   * 获取应用资源路径
   */
  static getResourcePath() {
    const { app } = require("electron");
    return app.getPath("userData");
  }
}
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
class Logger {
  static instance;
  logLevel = 1;
  logs = [];
  maxLogs = 1e3;
  // 最多保留1000条日志
  constructor() {
    if (process.env.NODE_ENV === "development") {
      this.logLevel = 0;
    }
  }
  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  /**
   * 设置日志级别
   */
  setLogLevel(level) {
    this.logLevel = level;
  }
  /**
   * 记录日志
   */
  log(level, message, context, data, error2) {
    if (level < this.logLevel) {
      return;
    }
    const entry = {
      level,
      timestamp: /* @__PURE__ */ new Date(),
      message,
      context,
      data,
      error: error2
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.outputToConsole(entry);
  }
  /**
   * 输出到控制台
   */
  outputToConsole(entry) {
    const levelStr = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : "";
    const prefix = `[${timestamp}] [${levelStr}]${context}`;
    switch (entry.level) {
      case 0:
        console.debug(prefix, entry.message, entry.data || "");
        break;
      case 1:
        console.info(prefix, entry.message, entry.data || "");
        break;
      case 2:
        console.warn(prefix, entry.message, entry.data || "");
        break;
      case 3:
        console.error(prefix, entry.message, entry.error || entry.data || "");
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }
  /**
   * Debug 级别日志
   */
  debug(message, context, data) {
    this.log(0, message, context, data);
  }
  /**
   * Info 级别日志
   */
  info(message, context, data) {
    this.log(1, message, context, data);
  }
  /**
   * Warn 级别日志
   */
  warn(message, context, data) {
    this.log(2, message, context, data);
  }
  /**
   * Error 级别日志
   */
  error(message, context, error2, data) {
    this.log(3, message, context, data, error2);
  }
  /**
   * 获取所有日志
   */
  getLogs() {
    return [...this.logs];
  }
  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
  }
  /**
   * 导出日志为 JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
const logger = Logger.getInstance();
class AppError extends Error {
  constructor(message, code, statusCode, context, data) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.data = data;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
class ValidationError extends AppError {
  constructor(message, context, data) {
    super(message, "VALIDATION_ERROR", 400, context, data);
  }
}
class NotFoundError extends AppError {
  constructor(message, context, data) {
    super(message, "NOT_FOUND", 404, context, data);
  }
}
class DatabaseError extends AppError {
  constructor(message, context, error) {
    super(message, "DATABASE_ERROR", 500, context, { originalError: error?.message });
  }
}
class EpubParseError extends AppError {
  constructor(message, context, error) {
    super(message, "EPUB_PARSE_ERROR", 400, context, { originalError: error?.message });
  }
}
class DatabaseService {
  static instance;
  db = null;
  isInitialized = false;
  constructor() {
  }
  /**
   * 获取单例实例
   */
  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  /**
   * 初始化数据库
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn("Database already initialized", "DatabaseService");
      return;
    }
    try {
      const userDataPath = electron.app.getPath("userData");
      const dbPath = path.join(userDataPath, DB_NAME);
      logger.info(`Initializing database at ${dbPath}`, "DatabaseService");
      this.db = new Database(dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("synchronous = NORMAL");
      this.db.pragma("cache_size = -64000");
      this.db.pragma("temp_store = MEMORY");
      this.db.pragma("mmap_size = 30000000000");
      this.db.pragma("foreign_keys = ON");
      this.createTables();
      this.isInitialized = true;
      logger.info("Database initialized successfully", "DatabaseService");
    } catch (error) {
      logger.error("Failed to initialize database", "DatabaseService", error);
      throw new DatabaseError("Failed to initialize database", "DatabaseService", error);
    }
  }
  /**
   * 创建数据库表
   */
  createTables() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        publish_date INTEGER,
        isbn TEXT,
        language TEXT,
        description TEXT,
        cover_path TEXT,
        file_path TEXT NOT NULL UNIQUE,
        file_size INTEGER,
        format TEXT CHECK(format IN ('epub', 'pdf')),
        added_at INTEGER NOT NULL,
        last_read_at INTEGER,
        reading_time INTEGER DEFAULT 0,
        progress REAL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
      CREATE INDEX IF NOT EXISTS idx_books_last_read ON books(last_read_at DESC);
      CREATE INDEX IF NOT EXISTS idx_books_progress ON books(progress);
      CREATE INDEX IF NOT EXISTS idx_books_added ON books(added_at DESC);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('highlight', 'underline', 'note', 'bookmark')),
        cfi TEXT NOT NULL,
        cfi_range TEXT,
        selected_text TEXT,
        note TEXT,
        color TEXT,
        chapter_index INTEGER,
        chapter_title TEXT,
        page_number INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_annotations_book ON annotations(book_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(type);
      CREATE INDEX IF NOT EXISTS idx_annotations_created ON annotations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_annotations_book_type ON annotations(book_id, type);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        book_id TEXT PRIMARY KEY,
        current_cfi TEXT NOT NULL,
        current_chapter INTEGER DEFAULT 0,
        progress_percentage REAL DEFAULT 0,
        total_pages INTEGER,
        current_page INTEGER,
        reading_time INTEGER DEFAULT 0,
        last_read_at INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS book_tags (
        book_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY(book_id, tag_id),
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS collection_books (
        collection_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY(collection_id, book_id),
        FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wordbook (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        translation TEXT,
        definition TEXT,
        language TEXT DEFAULT 'en',
        book_id TEXT,
        context TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_wordbook_word ON wordbook(word);
      CREATE INDEX IF NOT EXISTS idx_wordbook_language ON wordbook(language);
      CREATE INDEX IF NOT EXISTS idx_wordbook_book ON wordbook(book_id);
      CREATE INDEX IF NOT EXISTS idx_wordbook_lang_word ON wordbook(language, word);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS translation_history (
        id TEXT PRIMARY KEY,
        source_text TEXT NOT NULL,
        target_text TEXT NOT NULL,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        provider TEXT DEFAULT 'auto',
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_translation_history_created ON translation_history(created_at DESC);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapter_summaries (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        chapter_index INTEGER NOT NULL,
        chapter_title TEXT,
        summary TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(book_id, chapter_index),
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_chapter_summaries_book ON chapter_summaries(book_id);
      CREATE INDEX IF NOT EXISTS idx_chapter_summaries_book_chapter ON chapter_summaries(book_id, chapter_index);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_cache (
        id TEXT PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        response TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON ai_cache(created_at DESC);
    `);
  }
  /**
   * 获取数据库实例
   */
  getDatabase() {
    if (!this.db || !this.isInitialized) {
      throw new DatabaseError("Database not initialized", "DatabaseService");
    }
    return this.db;
  }
  /**
   * 执行查询(SELECT)
   */
  query(sql, params = []) {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const results = stmt.all(...params);
      logger.debug(`Query executed: ${sql}`, "DatabaseService", { rows: results.length });
      return results;
    } catch (error) {
      logger.error(`Query failed: ${sql}`, "DatabaseService", error, { params });
      throw new DatabaseError(`Query failed: ${sql}`, "DatabaseService", error);
    }
  }
  /**
   * 获取单行数据
   */
  queryOne(sql, params = []) {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const result = stmt.get(...params);
      logger.debug(`QueryOne executed: ${sql}`, "DatabaseService", { found: !!result });
      return result || null;
    } catch (error) {
      logger.error(`QueryOne failed: ${sql}`, "DatabaseService", error, { params });
      throw new DatabaseError(`QueryOne failed: ${sql}`, "DatabaseService", error);
    }
  }
  /**
   * 执行写操作(INSERT/UPDATE/DELETE)
   */
  execute(sql, params = []) {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      logger.debug(`Execute: ${sql}`, "DatabaseService", { changes: result.changes });
      return result;
    } catch (error) {
      logger.error(`Execute failed: ${sql}`, "DatabaseService", error, { params });
      throw new DatabaseError(`Execute failed: ${sql}`, "DatabaseService", error);
    }
  }
  /**
   * 执行事务
   */
  transaction(fn) {
    try {
      const db = this.getDatabase();
      const transaction = db.transaction(fn);
      const result = transaction(db);
      logger.debug("Transaction completed successfully", "DatabaseService");
      return result;
    } catch (error) {
      logger.error("Transaction failed", "DatabaseService", error);
      throw new DatabaseError("Transaction failed", "DatabaseService", error);
    }
  }
  /**
   * 批量插入(使用事务优化性能)
   */
  bulkInsert(sql, dataList) {
    this.transaction((db) => {
      const stmt = db.prepare(sql);
      for (const data of dataList) {
        stmt.run(...data);
      }
    });
    logger.info(`Bulk inserted ${dataList.length} rows`, "DatabaseService");
  }
  /**
   * 检查表是否存在
   */
  tableExists(tableName) {
    try {
      const result = this.queryOne(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result ? result.count > 0 : false;
    } catch (error) {
      logger.error(`Failed to check table existence: ${tableName}`, "DatabaseService", error);
      return false;
    }
  }
  /**
   * 备份数据库
   */
  async backup(targetPath) {
    try {
      const db = this.getDatabase();
      await db.backup(targetPath);
      logger.info(`Database backed up to ${targetPath}`, "DatabaseService");
    } catch (error) {
      logger.error("Database backup failed", "DatabaseService", error);
      throw new DatabaseError("Database backup failed", "DatabaseService", error);
    }
  }
  /**
   * 优化数据库(VACUUM)
   */
  optimize() {
    try {
      const db = this.getDatabase();
      db.exec("VACUUM");
      logger.info("Database optimized", "DatabaseService");
    } catch (error) {
      logger.error("Database optimization failed", "DatabaseService", error);
      throw new DatabaseError("Database optimization failed", "DatabaseService", error);
    }
  }
  /**
   * 获取数据库统计信息
   */
  getStats() {
    try {
      if (!this.isInitialized || !this.db) {
        return { isInitialized: false, tables: 0 };
      }
      const tables = this.query(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return {
        isInitialized: true,
        tables: tables.length
      };
    } catch (error) {
      logger.error("Failed to get database stats", "DatabaseService", error);
      return { isInitialized: this.isInitialized, tables: 0 };
    }
  }
  /**
   * 关闭数据库
   */
  async close() {
    if (this.db) {
      try {
        logger.info("Closing database", "DatabaseService");
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        logger.info("Database closed successfully", "DatabaseService");
      } catch (error) {
        logger.error("Failed to close database", "DatabaseService", error);
        throw new DatabaseError("Failed to close database", "DatabaseService", error);
      }
    }
  }
}
class EpubParser {
  /**
   * 解析 EPUB 文件
   */
  static async parse(filePath) {
    logger.info(`Starting to parse EPUB file: ${filePath}`, "EpubParser");
    try {
      const buffer = await promises.readFile(filePath);
      const zip = await JSZip.loadAsync(buffer);
      const containerFile = zip.file("META-INF/container.xml");
      if (!containerFile) {
        throw new EpubParseError("Invalid EPUB file: container.xml not found", "EpubParser");
      }
      const containerXml = await containerFile.async("string");
      const container = await xml2js.parseStringPromise(containerXml);
      const rootfilePath = container?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.["full-path"];
      if (!rootfilePath) {
        throw new EpubParseError("Invalid EPUB file: rootfile path not found", "EpubParser");
      }
      logger.debug(`Found rootfile: ${rootfilePath}`, "EpubParser");
      const rootfileDir = path.dirname(rootfilePath);
      const opfFile = zip.file(rootfilePath);
      if (!opfFile) {
        throw new EpubParseError("Invalid EPUB file: OPF file not found", "EpubParser");
      }
      const opfContent = await opfFile.async("string");
      const opf = await xml2js.parseStringPromise(opfContent);
      const packageNode = opf.package;
      if (!packageNode) {
        throw new EpubParseError("Invalid EPUB file: package node not found", "EpubParser");
      }
      logger.debug("Extracting metadata...", "EpubParser");
      const metadata = this.extractMetadata(packageNode.metadata);
      logger.debug("Extracting TOC...", "EpubParser");
      const toc = await this.extractTOC(zip, packageNode, rootfileDir);
      logger.debug("Extracting spine...", "EpubParser");
      const spine = this.extractSpine(packageNode.spine, packageNode.manifest);
      logger.debug("Extracting cover...", "EpubParser");
      const coverPath = await this.extractCover(zip, packageNode.manifest, rootfileDir);
      logger.info(`Successfully parsed EPUB file: ${metadata.title}`, "EpubParser");
      return {
        metadata,
        toc,
        spine,
        coverPath
      };
    } catch (error) {
      if (error instanceof EpubParseError) {
        throw error;
      }
      logger.error("Failed to parse EPUB file", "EpubParser", error);
      throw new EpubParseError(
        `Failed to parse EPUB file: ${error.message}`,
        "EpubParser",
        error
      );
    }
  }
  /**
   * 提取元数据
   */
  static extractMetadata(metadataNode) {
    const meta = metadataNode?.[0];
    const dc = meta?.["dc:metadata"]?.[0] || meta;
    const asText = (value) => {
      if (value === void 0 || value === null) return void 0;
      if (typeof value === "string") return value.trim();
      if (typeof value === "number") return String(value);
      if (Array.isArray(value)) return asText(value[0]);
      if (typeof value === "object") {
        if (typeof value._ === "string") return value._.trim();
      }
      return String(value).trim();
    };
    const getTitle = () => {
      if (meta?.["dc:title"]) return asText(meta["dc:title"]);
      if (meta?.title) return asText(meta.title);
      if (dc?.["dc:title"]) return asText(dc["dc:title"]);
      return "Unknown";
    };
    const getCreator = () => {
      if (meta?.["dc:creator"]) return asText(meta["dc:creator"]);
      if (meta?.creator) return asText(meta.creator);
      if (dc?.["dc:creator"]) return asText(dc["dc:creator"]);
      return "Unknown";
    };
    const getPublisher = () => {
      if (meta?.["dc:publisher"]) return asText(meta["dc:publisher"]);
      if (meta?.publisher) return asText(meta.publisher);
      return void 0;
    };
    const getDate = () => {
      const dateText = asText(meta?.["dc:date"]) || asText(meta?.date);
      if (dateText) {
        const date = new Date(dateText);
        if (!Number.isNaN(date.getTime())) return date;
      }
      return void 0;
    };
    const getISBN = () => {
      const identifiers = meta?.["dc:identifier"] || meta?.identifier || [];
      for (const id of identifiers) {
        const value = asText(id);
        if (typeof value === "string" && (value.includes("isbn:") || value.includes("ISBN"))) {
          return value.replace(/isbn:/i, "");
        }
      }
      return void 0;
    };
    const getLanguage = () => {
      if (meta?.["dc:language"]) return asText(meta["dc:language"]);
      if (meta?.language) return asText(meta.language);
      return void 0;
    };
    const getDescription = () => {
      if (meta?.["dc:description"]) return asText(meta["dc:description"]);
      if (meta?.description) return asText(meta.description);
      return void 0;
    };
    return {
      title: getTitle() || "Unknown Title",
      author: getCreator() || "Unknown Author",
      publisher: getPublisher(),
      publishDate: getDate(),
      isbn: getISBN(),
      language: getLanguage(),
      description: getDescription()
    };
  }
  /**
   * 提取目录
   */
  static async extractTOC(zip, packageNode, rootfileDir) {
    try {
      const manifest = packageNode.manifest?.[0];
      const spine = packageNode.spine?.[0];
      const tocAttr = spine?.$?.toc;
      let ncxPath = null;
      if (tocAttr) {
        const tocItem = manifest?.item?.find((item) => item.$.id === tocAttr);
        if (tocItem) {
          ncxPath = path.join(rootfileDir, tocItem.$.href);
        }
      }
      if (!ncxPath) {
        const ncxItem = manifest?.item?.find(
          (item) => item.$["media-type"]?.includes("ncx") || item.$.href?.endsWith(".ncx")
        );
        if (ncxItem) {
          ncxPath = path.join(rootfileDir, ncxItem.$.href);
        }
      }
      if (!ncxPath) {
        logger.warn("NCX file not found, TOC will be empty", "EpubParser");
        return [];
      }
      const ncxFile = zip.file(ncxPath);
      if (!ncxFile) {
        logger.warn(`NCX file not found in zip: ${ncxPath}`, "EpubParser");
        return [];
      }
      const ncxContent = await ncxFile.async("string");
      const ncx = await xml2js.parseStringPromise(ncxContent);
      const navMap = ncx.ncx?.navMap?.[0];
      const toc = this.parseNavMap(navMap?.navPoint || [], "");
      logger.debug(`Extracted ${toc.length} TOC items`, "EpubParser");
      return toc;
    } catch (error) {
      logger.warn("Failed to parse TOC, returning empty array", "EpubParser", error);
      return [];
    }
  }
  /**
   * 解析导航点
   */
  static parseNavMap(navPoints, parent) {
    return navPoints.map((point, index) => {
      const label = point.navLabel?.[0]?.text?.[0] || "Section";
      const src = point.content?.[0]?.$.src || "";
      const id = `${parent}${index}`;
      const item = {
        id,
        label,
        href: src,
        parent: parent || void 0
      };
      if (point.navPoint && point.navPoint.length > 0) {
        item.children = this.parseNavMap(point.navPoint, `${id}-`);
      }
      return item;
    });
  }
  /**
   * 提取 spine（阅读顺序）
   */
  static extractSpine(spineNode, manifestNode) {
    const spine = spineNode?.[0];
    const manifest = manifestNode?.[0];
    const itemrefs = spine?.itemref || [];
    return itemrefs.map((itemref) => {
      const idref = itemref.$.idref;
      const item = manifest?.item?.find((i) => i.$.id === idref);
      return {
        id: idref,
        href: item?.$.href || "",
        mediaType: item?.$["media-type"] || ""
      };
    });
  }
  /**
   * 提取封面
   */
  static async extractCover(zip, manifestNode, rootfileDir) {
    const manifest = manifestNode?.[0];
    const meta = manifest?.meta || [];
    const items = manifest?.item || [];
    const coverMeta = meta.find((m) => m.$.name === "cover");
    let coverItem;
    if (coverMeta) {
      const coverId = coverMeta.$.content;
      coverItem = items.find((i) => i.$.id === coverId);
    }
    if (!coverItem) {
      coverItem = items.find(
        (i) => typeof i.$?.properties === "string" && i.$.properties.includes("cover-image")
      );
    }
    if (!coverItem) {
      coverItem = items.find((i) => {
        const href = String(i.$?.href || "").toLowerCase();
        const mediaType = String(i.$?.["media-type"] || "").toLowerCase();
        return mediaType.startsWith("image/") && href.includes("cover");
      });
    }
    if (!coverItem) {
      return void 0;
    }
    const coverPath = path.join(rootfileDir, coverItem.$.href);
    const coverFile = zip.file(coverPath);
    if (!coverFile) {
      return void 0;
    }
    return coverPath;
  }
  /**
   * 提取封面图片数据
   */
  static async extractCoverData(filePath) {
    try {
      const buffer = await promises.readFile(filePath);
      const zip = await JSZip.loadAsync(buffer);
      const parseResult = await this.parse(filePath);
      if (!parseResult.coverPath) {
        return null;
      }
      const coverFile = zip.file(parseResult.coverPath);
      if (!coverFile) {
        return null;
      }
      const data = await coverFile.async("nodebuffer");
      return data;
    } catch (error) {
      console.error("Failed to extract cover data:", error);
      return null;
    }
  }
  /**
   * 验证 EPUB 文件
   */
  static async validate(filePath) {
    try {
      const buffer = await promises.readFile(filePath);
      const zip = await JSZip.loadAsync(buffer);
      const hasContainer = zip.file("META-INF/container.xml") !== null;
      if (!hasContainer) {
        return false;
      }
      const containerXml = await zip.file("META-INF/container.xml")?.async("string");
      if (!containerXml) {
        return false;
      }
      const container = await xml2js.parseStringPromise(containerXml);
      const rootfilePath = container?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.["full-path"];
      if (!rootfilePath) {
        return false;
      }
      const hasOpf = zip.file(rootfilePath) !== null;
      return hasOpf;
    } catch {
      return false;
    }
  }
}
class BookHandlers {
  /**
   * 导入书籍
   */
  static async import(filePath) {
    try {
      const startedAt = Date.now();
      logger.info(`Import started: ${filePath}`, "BookHandlers");
      const exists = await FileHandlers.exists(filePath);
      if (!exists) {
        throw new Error("File not found");
      }
      logger.debug("File exists", "BookHandlers");
      const db = DatabaseService.getInstance().getDatabase();
      const existing = db.prepare("SELECT id FROM books WHERE file_path = ?").get(filePath);
      if (existing) {
        throw new Error("Book already imported");
      }
      logger.debug("Not imported yet", "BookHandlers");
      const epubData = await EpubParser.parse(filePath);
      logger.debug("EPUB parsed", "BookHandlers");
      const fileInfo = await FileHandlers.getInfo(filePath);
      if (!fileInfo) {
        throw new Error("Failed to get file info");
      }
      logger.debug(`File info size=${fileInfo.size}`, "BookHandlers");
      const bookId = uuid.v4();
      const userDataPath = FileHandlers.getUserDataPath();
      const booksDir = path.join(userDataPath, "books");
      await FileHandlers.mkdir(booksDir, true);
      logger.debug(`Books dir ready: ${booksDir}`, "BookHandlers");
      const bookFileName = `${bookId}.epub`;
      const destPath = path.join(booksDir, bookFileName);
      await FileHandlers.copy(filePath, destPath);
      logger.debug(`Book copied to ${destPath}`, "BookHandlers");
      let coverUrl;
      const coverData = await EpubParser.extractCoverData(filePath);
      if (coverData) {
        const coverDir = path.join(userDataPath, "covers");
        await FileHandlers.mkdir(coverDir, true);
        const coverFileName = `${bookId}.jpg`;
        const coverPath = path.join(coverDir, coverFileName);
        await FileHandlers.write(coverPath, coverData);
        coverUrl = coverPath;
        logger.debug(`Cover written: ${coverPath} (${coverData.length} bytes)`, "BookHandlers");
      } else {
        logger.debug("No cover data found", "BookHandlers");
      }
      const now = Math.floor(Date.now() / 1e3);
      const book = {
        id: bookId,
        title: epubData.metadata.title,
        author: epubData.metadata.author,
        publisher: epubData.metadata.publisher || "",
        publishDate: epubData.metadata.publishDate,
        isbn: epubData.metadata.isbn,
        language: epubData.metadata.language || "zh-CN",
        description: epubData.metadata.description,
        coverUrl,
        filePath: destPath,
        fileSize: fileInfo.size,
        format: "epub",
        addedAt: new Date(now * 1e3),
        readingTime: 0,
        progress: 0,
        tags: [],
        collections: [],
        metadata: {
          identifier: epubData.metadata.isbn,
          creator: epubData.metadata.author,
          spine: epubData.spine,
          toc: epubData.toc
        }
      };
      const stmt = db.prepare(`
        INSERT INTO books (
          id, title, author, publisher, publish_date, isbn, language,
          description, cover_path, file_path, file_size, format, added_at,
          metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const params = [
        book.id,
        book.title,
        book.author,
        book.publisher,
        book.publishDate ? Math.floor(book.publishDate.getTime() / 1e3) : null,
        book.isbn || null,
        book.language,
        book.description || null,
        book.coverUrl || null,
        book.filePath,
        book.fileSize,
        book.format,
        Math.floor(book.addedAt.getTime() / 1e3),
        JSON.stringify(book.metadata)
      ];
      logger.debug("Inserting book into DB", "BookHandlers");
      stmt.run(params);
      logger.info(`Import completed in ${Date.now() - startedAt}ms`, "BookHandlers");
      return book;
    } catch (error) {
      console.error("Failed to import book:", error);
      throw error;
    }
  }
  /**
   * 获取所有书籍
   */
  static async getAll(options) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const sortBy = options?.sortBy || "addedAt";
      const order = options?.order || "desc";
      const orderClause = order === "asc" ? "ASC" : "DESC";
      let orderBy = "added_at";
      if (sortBy === "lastReadAt") orderBy = "last_read_at";
      if (sortBy === "title") orderBy = "title";
      const rows = db.prepare(`
          SELECT * FROM books
          ORDER BY ${orderBy} ${orderClause}
        `).all();
      return rows.map(this.mapRowToBook);
    } catch (error) {
      console.error("Failed to get all books:", error);
      return [];
    }
  }
  /**
   * 获取单本书籍
   */
  static async get(id) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const row = db.prepare("SELECT * FROM books WHERE id = ?").get(id);
      if (!row) {
        return null;
      }
      return this.mapRowToBook(row);
    } catch (error) {
      console.error("Failed to get book:", error);
      return null;
    }
  }
  /**
   * 更新书籍
   */
  static async update(id, updates) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const fields = [];
      const values = [];
      if (updates.title !== void 0) {
        fields.push("title = ?");
        values.push(updates.title);
      }
      if (updates.author !== void 0) {
        fields.push("author = ?");
        values.push(updates.author);
      }
      if (updates.publisher !== void 0) {
        fields.push("publisher = ?");
        values.push(updates.publisher);
      }
      if (updates.description !== void 0) {
        fields.push("description = ?");
        values.push(updates.description);
      }
      if (fields.length === 0) {
        return;
      }
      fields.push("updated_at = ?");
      values.push(Math.floor(Date.now() / 1e3));
      values.push(id);
      const stmt = db.prepare(`
        UPDATE books
        SET ${fields.join(", ")}
        WHERE id = ?
      `);
      stmt.run(...values);
    } catch (error) {
      console.error("Failed to update book:", error);
      throw error;
    }
  }
  /**
   * 删除书籍
   */
  static async delete(id, options) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const book = await this.get(id);
      if (!book) {
        throw new Error("Book not found");
      }
      db.prepare("DELETE FROM books WHERE id = ?").run(id);
      if (book.coverUrl) {
        try {
          await FileHandlers.delete(book.coverUrl);
        } catch {
        }
      }
      if (options?.deleteFile) {
        try {
          await FileHandlers.delete(book.filePath);
        } catch {
        }
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
      throw error;
    }
  }
  /**
   * 搜索书籍
   */
  static async search(options) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      let sql = "";
      let params = [];
      if (options.field === "title") {
        sql = "SELECT * FROM books WHERE title LIKE ?";
        params.push(`%${options.query}%`);
      } else if (options.field === "author") {
        sql = "SELECT * FROM books WHERE author LIKE ?";
        params.push(`%${options.query}%`);
      } else {
        sql = "SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR description LIKE ?";
        params.push(`%${options.query}%`, `%${options.query}%`, `%${options.query}%`);
      }
      const rows = db.prepare(sql).all(...params);
      return rows.map(this.mapRowToBook);
    } catch (error) {
      console.error("Failed to search books:", error);
      return [];
    }
  }
  /**
   * 提取元数据
   */
  static async extractMetadata(filePath) {
    try {
      const epubData = await EpubParser.parse(filePath);
      return {
        identifier: epubData.metadata.isbn,
        creator: epubData.metadata.author,
        contributor: epubData.metadata.publisher,
        rights: void 0,
        modifiedDate: epubData.metadata.publishDate,
        spine: epubData.spine,
        toc: epubData.toc
      };
    } catch (error) {
      console.error("Failed to extract metadata:", error);
      throw new Error("Failed to extract metadata");
    }
  }
  /**
   * 提取封面
   */
  static async extractCover(filePath) {
    try {
      const coverData = await EpubParser.extractCoverData(filePath);
      if (!coverData) {
        throw new Error("No cover found");
      }
      const tempPath = path.join(FileHandlers.getTempPath(), `cover_${Date.now()}.jpg`);
      await FileHandlers.write(tempPath, coverData);
      return tempPath;
    } catch (error) {
      console.error("Failed to extract cover:", error);
      throw new Error("Failed to extract cover");
    }
  }
  /**
   * 将数据库行映射为 Book 对象
   */
  static mapRowToBook(row) {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      publisher: row.publisher || "",
      publishDate: row.publish_date ? new Date(row.publish_date * 1e3) : void 0,
      isbn: row.isbn || void 0,
      language: row.language || "zh-CN",
      description: row.description || void 0,
      coverUrl: row.cover_path || void 0,
      filePath: row.file_path,
      fileSize: row.file_size,
      format: row.format,
      addedAt: new Date(row.added_at * 1e3),
      lastReadAt: row.last_read_at ? new Date(row.last_read_at * 1e3) : void 0,
      readingTime: row.reading_time || 0,
      progress: row.progress || 0,
      tags: [],
      // TODO: 从数据库加载标签
      collections: [],
      // TODO: 从数据库加载书架
      metadata: row.metadata ? JSON.parse(row.metadata) : void 0
    };
  }
}
class AnnotationHandlers {
  /**
   * 创建批注
   */
  static async create(data) {
    try {
      if (!data.bookId || !data.type || !data.cfi) {
        throw new ValidationError("Missing required fields: bookId, type, cfi", "AnnotationHandlers");
      }
      const db = DatabaseService.getInstance();
      const now = Math.floor(Date.now() / 1e3);
      const annotation = {
        id: uuid.v4(),
        bookId: data.bookId,
        type: data.type,
        cfi: data.cfi,
        cfiRange: data.cfiRange || "",
        selectedText: data.selectedText || "",
        note: data.note || "",
        color: data.color || "#ffeb3b",
        chapterIndex: data.chapterIndex || 0,
        chapterTitle: data.chapterTitle || "",
        createdAt: new Date(now * 1e3),
        updatedAt: new Date(now * 1e3),
        synced: false
      };
      db.execute(
        `INSERT INTO annotations 
        (id, book_id, type, cfi, cfi_range, selected_text, note, color, chapter_index, chapter_title, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          annotation.id,
          annotation.bookId,
          annotation.type,
          annotation.cfi,
          annotation.cfiRange,
          annotation.selectedText,
          annotation.note,
          annotation.color,
          annotation.chapterIndex,
          annotation.chapterTitle,
          now,
          now,
          0
        ]
      );
      logger.info(`Annotation created: ${annotation.id} (${annotation.type})`, "AnnotationHandlers");
      return annotation;
    } catch (error) {
      logger.error("Failed to create annotation", "AnnotationHandlers", error);
      throw error;
    }
  }
  /**
   * 获取所有批注
   */
  static async getAll(options) {
    try {
      const db = DatabaseService.getInstance();
      let sql = "SELECT * FROM annotations WHERE book_id = ?";
      const params = [options.bookId];
      if (options.type) {
        sql += " AND type = ?";
        params.push(options.type);
      }
      sql += " ORDER BY created_at DESC";
      const results = db.query(sql, params);
      const annotations = results.map((row) => ({
        id: row.id,
        bookId: row.book_id,
        type: row.type,
        cfi: row.cfi,
        cfiRange: row.cfi_range,
        selectedText: row.selected_text,
        note: row.note,
        color: row.color,
        chapterIndex: row.chapter_index,
        chapterTitle: row.chapter_title,
        createdAt: new Date(row.created_at * 1e3),
        updatedAt: new Date(row.updated_at * 1e3),
        synced: row.synced === 1
      }));
      logger.debug(`Retrieved ${annotations.length} annotations for book ${options.bookId}`, "AnnotationHandlers");
      return annotations;
    } catch (error) {
      logger.error("Failed to get annotations", "AnnotationHandlers", error);
      throw new DatabaseError("Failed to get annotations", "AnnotationHandlers", error);
    }
  }
  /**
   * 更新批注
   */
  static async update(id, updates) {
    try {
      const db = DatabaseService.getInstance();
      const now = Math.floor(Date.now() / 1e3);
      const fields = [];
      const params = [];
      if (updates.note !== void 0) {
        fields.push("note = ?");
        params.push(updates.note);
      }
      if (updates.color !== void 0) {
        fields.push("color = ?");
        params.push(updates.color);
      }
      if (updates.selectedText !== void 0) {
        fields.push("selected_text = ?");
        params.push(updates.selectedText);
      }
      if (fields.length === 0) {
        logger.warn("No fields to update", "AnnotationHandlers");
        return;
      }
      fields.push("updated_at = ?");
      params.push(now);
      params.push(id);
      const sql = `UPDATE annotations SET ${fields.join(", ")} WHERE id = ?`;
      const result = db.execute(sql, params);
      if (result.changes === 0) {
        throw new NotFoundError(`Annotation not found: ${id}`, "AnnotationHandlers");
      }
      logger.info(`Annotation updated: ${id}`, "AnnotationHandlers");
    } catch (error) {
      logger.error(`Failed to update annotation: ${id}`, "AnnotationHandlers", error);
      throw error;
    }
  }
  /**
   * 删除批注
   */
  static async delete(id) {
    try {
      const db = DatabaseService.getInstance();
      const result = db.execute("DELETE FROM annotations WHERE id = ?", [id]);
      if (result.changes === 0) {
        throw new NotFoundError(`Annotation not found: ${id}`, "AnnotationHandlers");
      }
      logger.info(`Annotation deleted: ${id}`, "AnnotationHandlers");
    } catch (error) {
      logger.error(`Failed to delete annotation: ${id}`, "AnnotationHandlers", error);
      throw error;
    }
  }
  /**
   * 导出批注
   */
  static async export(options) {
    try {
      const annotations = await this.getAll({ bookId: options.bookId });
      if (annotations.length === 0) {
        return {
          success: false,
          error: "No annotations to export"
        };
      }
      let data;
      if (options.format === "json") {
        data = JSON.stringify(annotations, null, 2);
      } else if (options.format === "markdown") {
        const highlights = annotations.filter((a) => a.type === "highlight");
        const bookmarks = annotations.filter((a) => a.type === "bookmark");
        let markdown = "# 阅读批注导出\n\n";
        markdown += `导出时间: ${(/* @__PURE__ */ new Date()).toLocaleString("zh-CN")}

`;
        if (highlights.length > 0) {
          markdown += `## 高亮批注 (${highlights.length})

`;
          highlights.forEach((annotation, index) => {
            markdown += `### ${index + 1}. ${annotation.selectedText?.substring(0, 30) || "无标题"}...

`;
            if (annotation.selectedText) {
              markdown += `> ${annotation.selectedText}

`;
            }
            if (annotation.note) {
              markdown += `**笔记**: ${annotation.note}

`;
            }
            markdown += `- 位置: ${annotation.chapterTitle || "未知"}
`;
            markdown += `- 时间: ${new Date(annotation.createdAt).toLocaleString("zh-CN")}
`;
            if (annotation.color) {
              markdown += `- 颜色: ${annotation.color}
`;
            }
            markdown += "\n---\n\n";
          });
        }
        if (bookmarks.length > 0) {
          markdown += `## 书签 (${bookmarks.length})

`;
          bookmarks.forEach((bookmark, index) => {
            markdown += `${index + 1}. ${bookmark.chapterTitle || "未知位置"}
`;
            markdown += `   - 时间: ${new Date(bookmark.createdAt).toLocaleString("zh-CN")}

`;
          });
        }
        data = markdown;
      } else {
        return {
          success: false,
          error: "Unsupported format"
        };
      }
      logger.info(`Exported ${annotations.length} annotations for book ${options.bookId} in ${options.format} format`, "AnnotationHandlers");
      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error("Failed to export annotations", "AnnotationHandlers", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
class ProgressHandlers {
  /**
   * 保存进度
   */
  static async save(data) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const now = Math.floor(Date.now() / 1e3);
      const existing = db.prepare("SELECT reading_time FROM reading_progress WHERE book_id = ?").get(data.bookId);
      if (existing) {
        db.prepare(`
          UPDATE reading_progress
          SET current_cfi = ?,
              current_chapter = ?,
              progress_percentage = ?,
              current_page = ?,
              total_pages = ?,
              last_read_at = ?
          WHERE book_id = ?
        `).run(
          data.currentCFI,
          0,
          // current_chapter - 需要从 CFI 计算
          data.progressPercentage,
          data.currentPage || 0,
          data.totalPages || 0,
          now,
          data.bookId
        );
      } else {
        db.prepare(`
          INSERT INTO reading_progress (
            book_id, current_cfi, current_chapter, progress_percentage,
            current_page, total_pages, reading_time, last_read_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          data.bookId,
          data.currentCFI,
          0,
          // current_chapter
          data.progressPercentage,
          data.currentPage || 0,
          data.totalPages || 0,
          now
        );
      }
      db.prepare(`
        UPDATE books
        SET progress = ?,
            last_read_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(data.progressPercentage, now, now, data.bookId);
    } catch (error) {
      console.error("Failed to save progress:", error);
      throw error;
    }
  }
  /**
   * 获取进度
   */
  static async get(bookId) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const row = db.prepare(`
          SELECT *
          FROM reading_progress
          WHERE book_id = ?
        `).get(bookId);
      if (!row) {
        return null;
      }
      return {
        bookId: row.book_id,
        currentCFI: row.current_cfi,
        currentChapter: row.current_chapter,
        progressPercentage: row.progress_percentage,
        totalPages: row.total_pages || void 0,
        currentPage: row.current_page || void 0,
        readingTime: row.reading_time || 0,
        lastReadAt: new Date(row.last_read_at * 1e3),
        locations: row.locations ? JSON.parse(row.locations) : void 0,
        synced: !!row.synced
      };
    } catch (error) {
      console.error("Failed to get progress:", error);
      return null;
    }
  }
  /**
   * 添加阅读时间
   */
  static async addTime(data) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      db.prepare(`
        UPDATE reading_progress
        SET reading_time = reading_time + ?,
            last_read_at = ?
        WHERE book_id = ?
      `).run(data.seconds, Math.floor(Date.now() / 1e3), data.bookId);
      db.prepare(`
        UPDATE books
        SET reading_time = reading_time + ?,
            updated_at = ?
        WHERE id = ?
      `).run(data.seconds, Math.floor(Date.now() / 1e3), data.bookId);
    } catch (error) {
      console.error("Failed to add reading time:", error);
      throw error;
    }
  }
  /**
   * 批量获取进度
   */
  static async getAll(bookIds) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const progressMap = /* @__PURE__ */ new Map();
      if (bookIds.length === 0) {
        return progressMap;
      }
      const placeholders = bookIds.map(() => "?").join(",");
      const rows = db.prepare(`
          SELECT *
          FROM reading_progress
          WHERE book_id IN (${placeholders})
        `).all(...bookIds);
      for (const row of rows) {
        progressMap.set(row.book_id, {
          bookId: row.book_id,
          currentCFI: row.current_cfi,
          currentChapter: row.current_chapter,
          progressPercentage: row.progress_percentage,
          totalPages: row.total_pages || void 0,
          currentPage: row.current_page || void 0,
          readingTime: row.reading_time || 0,
          lastReadAt: new Date(row.last_read_at * 1e3),
          locations: row.locations ? JSON.parse(row.locations) : void 0,
          synced: !!row.synced
        });
      }
      return progressMap;
    } catch (error) {
      console.error("Failed to get all progress:", error);
      return /* @__PURE__ */ new Map();
    }
  }
  /**
   * 删除进度
   */
  static async delete(bookId) {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      db.prepare("DELETE FROM reading_progress WHERE book_id = ?").run(bookId);
    } catch (error) {
      console.error("Failed to delete progress:", error);
      throw error;
    }
  }
}
class TagHandlers {
  /**
   * 创建标签
   */
  static async create(data) {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1e3);
    const tag = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color || "#3B82F6",
      createdAt: new Date(now * 1e3)
    };
    db.execute(
      `INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)`,
      [tag.id, tag.name, tag.color, now]
    );
    return tag;
  }
  /**
   * 获取所有标签
   */
  static async getAll() {
    const db = DatabaseService.getInstance();
    const rows = db.query(`SELECT * FROM tags ORDER BY name ASC`);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at * 1e3)
    }));
  }
  /**
   * 更新标签
   */
  static async update(id, updates) {
    const db = DatabaseService.getInstance();
    const fields = [];
    const params = [];
    if (updates.name) {
      fields.push("name = ?");
      params.push(updates.name);
    }
    if (updates.color) {
      fields.push("color = ?");
      params.push(updates.color);
    }
    if (fields.length === 0) return;
    params.push(id);
    db.execute(`UPDATE tags SET ${fields.join(", ")} WHERE id = ?`, params);
  }
  /**
   * 删除标签
   */
  static async delete(id) {
    const db = DatabaseService.getInstance();
    db.execute(`DELETE FROM book_tags WHERE tag_id = ?`, [id]);
    db.execute(`DELETE FROM tags WHERE id = ?`, [id]);
  }
  /**
   * 添加标签到书籍
   */
  static async addToBook(data) {
    const db = DatabaseService.getInstance();
    const existing = db.execute(
      `SELECT 1 FROM book_tags WHERE book_id = ? AND tag_id = ?`,
      [data.bookId, data.tagId]
    );
    if (existing) return;
    db.execute(
      `INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)`,
      [data.bookId, data.tagId]
    );
  }
  /**
   * 从书籍移除标签
   */
  static async removeFromBook(data) {
    const db = DatabaseService.getInstance();
    db.execute(
      `DELETE FROM book_tags WHERE book_id = ? AND tag_id = ?`,
      [data.bookId, data.tagId]
    );
  }
  /**
   * 获取书籍的标签
   */
  static async getByBook(bookId) {
    const db = DatabaseService.getInstance();
    const rows = db.query(`
      SELECT t.* FROM tags t
      INNER JOIN book_tags bt ON t.id = bt.tag_id
      WHERE bt.book_id = ?
      ORDER BY t.name ASC
    `, [bookId]);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at * 1e3)
    }));
  }
}
class CollectionHandlers {
  /**
   * 创建书架
   */
  static async create(data) {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1e3);
    const collection = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || "",
      createdAt: new Date(now * 1e3)
    };
    db.execute(
      `INSERT INTO collections (id, name, description, created_at) VALUES (?, ?, ?, ?)`,
      [collection.id, collection.name, collection.description, now]
    );
    return collection;
  }
  /**
   * 获取所有书架
   */
  static async getAll() {
    const db = DatabaseService.getInstance();
    const rows = db.execute(`
      SELECT c.*,
        COUNT(cb.book_id) as book_count
      FROM collections c
      LEFT JOIN collection_books cb ON c.id = cb.collection_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      createdAt: new Date(row.created_at * 1e3),
      bookCount: row.book_count || 0
    }));
  }
  /**
   * 获取单个书架
   */
  static async get(id) {
    const db = DatabaseService.getInstance();
    const row = db.execute(`
      SELECT c.*,
        COUNT(cb.book_id) as book_count
      FROM collections c
      LEFT JOIN collection_books cb ON c.id = cb.collection_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]).get();
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      createdAt: new Date(row.created_at * 1e3),
      bookCount: row.book_count || 0
    };
  }
  /**
   * 更新书架
   */
  static async update(id, updates) {
    const db = DatabaseService.getInstance();
    const fields = [];
    const params = [];
    if (updates.name !== void 0) {
      fields.push("name = ?");
      params.push(updates.name);
    }
    if (updates.description !== void 0) {
      fields.push("description = ?");
      params.push(updates.description);
    }
    if (fields.length === 0) return;
    params.push(id);
    db.execute(`UPDATE collections SET ${fields.join(", ")} WHERE id = ?`, params);
  }
  /**
   * 删除书架
   */
  static async delete(id) {
    const db = DatabaseService.getInstance();
    db.execute(`DELETE FROM collection_books WHERE collection_id = ?`, [id]);
    db.execute(`DELETE FROM collections WHERE id = ?`, [id]);
  }
  /**
   * 添加书籍到书架
   */
  static async addBook(data) {
    const db = DatabaseService.getInstance();
    const existing = db.execute(
      `SELECT 1 FROM collection_books WHERE collection_id = ? AND book_id = ?`,
      [data.collectionId, data.bookId]
    );
    if (existing) return;
    db.execute(
      `INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)`,
      [data.collectionId, data.bookId]
    );
  }
  /**
   * 从书架移除书籍
   */
  static async removeBook(data) {
    const db = DatabaseService.getInstance();
    db.execute(
      `DELETE FROM collection_books WHERE collection_id = ? AND book_id = ?`,
      [data.collectionId, data.bookId]
    );
  }
  /**
   * 获取书架的书籍
   */
  static async getBooks(collectionId) {
    const db = DatabaseService.getInstance();
    const rows = db.execute(`
      SELECT book_id
      FROM collection_books
      WHERE collection_id = ?
      ORDER BY added_at DESC
    `, [collectionId]).all();
    return rows.map((row) => row.book_id);
  }
  /**
   * 获取书籍所属的书架
   */
  static async getByBook(bookId) {
    const db = DatabaseService.getInstance();
    const rows = db.execute(`
      SELECT c.*
      FROM collections c
      INNER JOIN collection_books cb ON c.id = cb.collection_id
      WHERE cb.book_id = ?
      ORDER BY c.name ASC
    `, [bookId]).all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      createdAt: new Date(row.created_at * 1e3),
      bookCount: 0
      // 不需要在这个查询中计算
    }));
  }
}
let store = null;
function getStore() {
  if (!store) {
    store = new Store({
      defaults: DEFAULT_SETTINGS
    });
  }
  return store;
}
class SettingsHandlers {
  /**
   * 获取设置
   */
  static get(key) {
    const s = getStore();
    if (key) {
      return s.get(key);
    }
    return s.store;
  }
  /**
   * 设置
   */
  static set(key, value) {
    const s = getStore();
    const isAISettingUpdate = typeof key === "string" ? key === "ai" : typeof key === "object" && "ai" in key;
    if (typeof key === "object") {
      Object.entries(key).forEach(([k, v]) => {
        s.set(k, v);
      });
    } else {
      s.set(key, value);
    }
    if (isAISettingUpdate) {
      Promise.resolve().then(() => ai).then(({ resetSummaryService: resetSummaryService2 }) => {
        console.log("[SettingsHandlers] AI settings updated, resetting SummaryService");
        resetSummaryService2();
      });
    }
  }
  /**
   * 删除设置
   */
  static delete(key) {
    const s = getStore();
    s.delete(key);
  }
  /**
   * 清空所有设置
   */
  static clear() {
    const s = getStore();
    s.clear();
  }
}
class DatabaseHandlers {
  /**
   * 查询
   */
  static async query(_sql, _params) {
    return [];
  }
  /**
   * 执行
   */
  static async execute(_sql, _params) {
    return { changes: 0, lastInsertRowid: 0 };
  }
  /**
   * 事务
   */
  static async transaction(_callback) {
  }
}
class SystemHandlers {
  /**
   * 打开外部链接
   */
  static async openExternal(url) {
    await electron.shell.openExternal(url);
  }
  /**
   * 在文件夹中显示文件
   */
  static showItemInFolder(path2) {
    electron.shell.showItemInFolder(path2);
  }
  /**
   * 获取应用路径
   */
  static getAppPath(name) {
    return electron.app.getPath(name);
  }
  /**
   * 获取版本信息
   */
  static getVersion() {
    return {
      app: electron.app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    };
  }
}
class WordBookHandlers {
  /**
   * 添加生词
   */
  static async add(data) {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1e3);
    const entry = {
      id: crypto.randomUUID(),
      word: data.word,
      translation: data.translation || "",
      definition: data.definition || "",
      language: data.language || "en",
      bookId: data.bookId,
      context: data.context || "",
      createdAt: new Date(now * 1e3)
    };
    try {
      db.execute(
        `INSERT INTO wordbook (id, word, translation, definition, language, book_id, context, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.word, entry.translation, entry.definition, entry.language, entry.bookId, entry.context, now]
      );
      logger.info(`Added word to wordbook: ${entry.word}`);
      return entry;
    } catch (error) {
      logger.error("Failed to add word to wordbook", "WordBookHandlers", error);
      throw error;
    }
  }
  /**
   * 获取所有生词
   */
  static async getAll(options) {
    const db = DatabaseService.getInstance();
    let sql = "SELECT * FROM wordbook";
    const params = [];
    const conditions = [];
    if (options?.language) {
      conditions.push("language = ?");
      params.push(options.language);
    }
    if (options?.bookId) {
      conditions.push("book_id = ?");
      params.push(options.bookId);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY created_at DESC";
    const rows = db.query(sql, params);
    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      translation: row.translation || "",
      definition: row.definition || "",
      language: row.language || "en",
      bookId: row.book_id,
      context: row.context || "",
      createdAt: new Date(row.created_at * 1e3)
    }));
  }
  /**
   * 获取单个生词
   */
  static async get(id) {
    const db = DatabaseService.getInstance();
    const row = db.execute("SELECT * FROM wordbook WHERE id = ?", [id]).get();
    if (!row) return null;
    return {
      id: row.id,
      word: row.word,
      translation: row.translation || "",
      definition: row.definition || "",
      language: row.language || "en",
      bookId: row.book_id,
      context: row.context || "",
      createdAt: new Date(row.created_at * 1e3)
    };
  }
  /**
   * 更新生词
   */
  static async update(id, updates) {
    const db = DatabaseService.getInstance();
    const fields = [];
    const params = [];
    if (updates.translation !== void 0) {
      fields.push("translation = ?");
      params.push(updates.translation);
    }
    if (updates.definition !== void 0) {
      fields.push("definition = ?");
      params.push(updates.definition);
    }
    if (updates.context !== void 0) {
      fields.push("context = ?");
      params.push(updates.context);
    }
    if (fields.length === 0) return;
    params.push(id);
    db.execute(`UPDATE wordbook SET ${fields.join(", ")} WHERE id = ?`, params);
    logger.info(`Updated word in wordbook: ${id}`);
  }
  /**
   * 删除生词
   */
  static async delete(id) {
    const db = DatabaseService.getInstance();
    db.execute("DELETE FROM wordbook WHERE id = ?", [id]);
    logger.info(`Deleted word from wordbook: ${id}`);
  }
  /**
   * 搜索生词
   */
  static async search(query, options) {
    const db = DatabaseService.getInstance();
    let sql = "SELECT * FROM wordbook WHERE word LIKE ?";
    const params = [`%${query}%`];
    if (options?.language) {
      sql += " AND language = ?";
      params.push(options.language);
    }
    sql += " ORDER BY created_at DESC";
    const rows = db.query(sql, params);
    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      translation: row.translation || "",
      definition: row.definition || "",
      language: row.language || "en",
      bookId: row.book_id,
      context: row.context || "",
      createdAt: new Date(row.created_at * 1e3)
    }));
  }
  /**
   * 按书籍获取生词
   */
  static async getByBook(bookId) {
    return this.getAll({ bookId });
  }
  /**
   * 获取统计信息
   */
  static async getStats() {
    const db = DatabaseService.getInstance();
    const totalRow = db.queryOne("SELECT COUNT(*) as count FROM wordbook");
    const totalCount = totalRow?.count || 0;
    const langRows = db.query("SELECT language, COUNT(*) as count FROM wordbook GROUP BY language");
    const byLanguage = {};
    for (const row of langRows) {
      byLanguage[row.language] = row.count;
    }
    return { totalCount, byLanguage };
  }
}
class OpenAIProvider {
  provider = "openai";
  model;
  modelName;
  constructor(config) {
    this.modelName = config.model || "gpt-4o-mini";
    const modelConfig = {
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2e3
    };
    if (config.apiKey) {
      modelConfig.apiKey = config.apiKey;
    }
    if (config.baseURL) {
      modelConfig.configuration = {
        baseURL: config.baseURL
      };
    }
    this.model = new openai.ChatOpenAI(modelConfig);
  }
  async generateText(prompt, _options) {
    const response = await this.model.invoke(prompt);
    return response.content;
  }
  async *generateStream(prompt, _options) {
    const stream = await this.model.stream(prompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }
  countTokens(text) {
    try {
      const encoder = tiktoken.encoding_for_model(this.modelName);
      const tokens = encoder.encode(text);
      encoder.free();
      return tokens.length;
    } catch {
      const encoder = tiktoken.encoding_for_model("gpt-4");
      const tokens = encoder.encode(text);
      encoder.free();
      return tokens.length;
    }
  }
}
class AnthropicProvider {
  provider = "anthropic";
  model;
  modelName;
  constructor(config) {
    this.modelName = config.model || "claude-3-5-sonnet-20241022";
    this.model = new anthropic.ChatAnthropic({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2e3,
      anthropicApiKey: config.apiKey,
      clientOptions: config.baseURL ? {
        baseURL: config.baseURL
      } : void 0
    });
  }
  async generateText(prompt, _options) {
    const response = await this.model.invoke(prompt);
    return response.content;
  }
  async *generateStream(prompt, _options) {
    const stream = await this.model.stream(prompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }
  countTokens(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.3 + otherChars * 0.25);
  }
}
class ZhipuProvider {
  provider = "zhipu";
  model;
  modelName;
  constructor(config) {
    this.modelName = config.model || "glm-4-flash";
    const baseURL = config.baseURL || "https://open.bigmodel.cn/api/paas/v4/";
    console.log("[ZhipuProvider] Initializing with:", {
      model: this.modelName,
      baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKeyLength: config.apiKey?.length
    });
    this.model = new openai.ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2e3,
      apiKey: config.apiKey,
      // 使用 apiKey 而不是 openAIApiKey
      configuration: {
        baseURL
      }
    });
    console.log("[ZhipuProvider] Initialized successfully");
  }
  async generateText(prompt, _options) {
    const response = await this.model.invoke(prompt);
    return response.content;
  }
  async *generateStream(prompt, _options) {
    const stream = await this.model.stream(prompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }
  countTokens(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.3);
  }
}
class QianwenProvider {
  provider = "qianwen";
  model;
  modelName;
  constructor(config) {
    this.modelName = config.model || "qwen-plus";
    this.model = new openai.ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2e3,
      apiKey: config.apiKey,
      // 使用 apiKey
      configuration: {
        baseURL: config.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1"
      }
    });
  }
  async generateText(prompt, _options) {
    const response = await this.model.invoke(prompt);
    return response.content;
  }
  async *generateStream(prompt, _options) {
    const stream = await this.model.stream(prompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }
  countTokens(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.4 + otherChars * 0.3);
  }
}
class CustomProvider {
  provider = "custom";
  model;
  modelName;
  constructor(config) {
    if (!config.baseURL) {
      throw new Error("自定义模型需要配置 Base URL");
    }
    this.modelName = config.model || "gpt-3.5-turbo";
    console.log("[CustomProvider] Initializing with:", {
      model: this.modelName,
      baseURL: config.baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKeyLength: config.apiKey?.length
    });
    this.model = new openai.ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2e3,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.baseURL
      }
    });
    console.log("[CustomProvider] Initialized successfully");
  }
  async generateText(prompt, _options) {
    const response = await this.model.invoke(prompt);
    return response.content;
  }
  async *generateStream(prompt, _options) {
    const stream = await this.model.stream(prompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }
  countTokens(text) {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.3 + otherChars * 0.3);
  }
}
function createProvider(config) {
  console.log("[createProvider] Creating provider with config:", {
    provider: config.provider,
    model: config.model,
    baseURL: config.baseURL,
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey?.length,
    enabled: config.enabled
  });
  if (!config.enabled) {
    throw new Error("AI 功能未启用");
  }
  if (!config.apiKey) {
    throw new Error("请配置 API Key");
  }
  let provider;
  switch (config.provider) {
    case "openai":
      console.log("[createProvider] Creating OpenAIProvider");
      provider = new OpenAIProvider(config);
      break;
    case "claude":
      console.log("[createProvider] Creating AnthropicProvider");
      provider = new AnthropicProvider(config);
      break;
    case "zhipu":
      console.log("[createProvider] Creating ZhipuProvider");
      provider = new ZhipuProvider(config);
      break;
    case "qianwen":
      console.log("[createProvider] Creating QianwenProvider");
      provider = new QianwenProvider(config);
      break;
    case "custom":
      console.log("[createProvider] Creating CustomProvider");
      provider = new CustomProvider(config);
      break;
    default:
      console.error("[createProvider] Unknown provider:", config.provider);
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
  }
  console.log("[createProvider] Provider created successfully:", provider.provider);
  return provider;
}
function createTextSplitter(options = {}) {
  const {
    chunkSize = 2e3,
    chunkOverlap = 200,
    separators = ["\n\n", "\n", "。", "！", "？", "；", "，", ",", " ", ""]
  } = options;
  return new textsplitters.RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators,
    lengthFunction: (text) => text.length
  });
}
async function splitText(text, options) {
  const splitter = createTextSplitter(options);
  return await splitter.splitText(text);
}
function cleanHtml(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10))).replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n/g, "\n\n").trim();
}
function generateCacheKey(content, model, prefix = "ai") {
  const hash = CryptoJS.SHA256(content + model).toString();
  return `${prefix}:${model}:${hash.substring(0, 16)}`;
}
class CacheManager {
  constructor(db) {
    this.db = db;
  }
  /**
   * 获取缓存
   */
  get(cacheKey) {
    const stmt = this.db.prepare(`
      SELECT id, cache_key, response, model, created_at
      FROM ai_cache
      WHERE cache_key = ?
    `);
    const row = stmt.get(cacheKey);
    if (!row) return null;
    return {
      id: row.id,
      cacheKey: row.cache_key,
      response: row.response,
      model: row.model,
      createdAt: new Date(row.created_at * 1e3)
    };
  }
  /**
   * 设置缓存
   */
  set(cacheKey, response, model) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_cache (id, cache_key, response, model)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(uuid.v4(), cacheKey, response, model);
  }
  /**
   * 删除缓存
   */
  delete(cacheKey) {
    const stmt = this.db.prepare(`
      DELETE FROM ai_cache WHERE cache_key = ?
    `);
    stmt.run(cacheKey);
  }
  /**
   * 清理过期缓存
   * @param days 保留最近多少天的缓存
   */
  cleanup(days = 30) {
    const stmt = this.db.prepare(`
      DELETE FROM ai_cache
      WHERE created_at < strftime('%s', 'now', '-${days} days')
    `);
    const result = stmt.run();
    return result.changes;
  }
  /**
   * 获取缓存统计
   */
  getStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(LENGTH(response)) as size
      FROM ai_cache
    `);
    const row = stmt.get();
    return {
      total: row.total || 0,
      size: row.size || 0
    };
  }
}
async function summarizeChunks(llm, chunks) {
  const mapPromises = chunks.map(async (chunk) => {
    const prompt = `请总结以下章节片段的核心要点：

${chunk}

要求：
- 简洁扼要，100-150字
- 提取主要内容和关键信息
- 保持客观准确

总结：`;
    const response = await llm.invoke(prompt);
    return response.content;
  });
  const summaries = await Promise.all(mapPromises);
  const reducePrompt = `以下是同一章节不同部分的总结：

${summaries.join("\n\n---\n\n")}

请将这些总结合并成一个连贯完整的章节摘要，要求：
1. 字数控制在 200-500 字
2. 包含章节的主要内容和核心观点
3. 突出重要人物、事件或概念
4. 保持逻辑连贯，语言流畅
5. 客观准确，不添加原文没有的内容

章节摘要：`;
  const finalResponse = await llm.invoke(reducePrompt);
  return finalResponse.content;
}
async function summarizeShort(llm, text) {
  const prompt = `
请总结以下章节内容，要求：
1. 字数控制在 200-500 字
2. 包含主要内容和核心观点
3. 突出重要人物、事件或概念
4. 保持逻辑连贯，语言流畅

章节内容：
${text}

章节摘要：
`;
  const response = await llm.invoke(prompt);
  return response.content;
}
class SummaryService {
  constructor(db, aiConfig) {
    this.db = db;
    this.aiConfig = aiConfig;
    this.cacheManager = new CacheManager(db);
  }
  cacheManager;
  /**
   * 总结章节内容
   */
  async summarizeChapter(bookId, chapterIndex, options = {}) {
    logger.info(`开始总结章节: bookId=${bookId}, chapterIndex=${chapterIndex}`, "SummaryService");
    if (!options.forceRefresh) {
      const existing = this.getSummaryFromDB(bookId, chapterIndex);
      if (existing) {
        logger.info("从数据库返回已有总结", "SummaryService");
        return existing;
      }
    }
    const { content, title } = await this.getChapterContent(bookId, chapterIndex);
    if (!content || content.trim().length === 0) {
      throw new Error("章节内容为空");
    }
    logger.info(`章节内容长度: ${content.length} 字符`, "SummaryService");
    const cacheKey = generateCacheKey(content, this.aiConfig.model, "summary");
    if (!options.forceRefresh) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        logger.info("从 AI 缓存返回总结", "SummaryService");
        const summary2 = this.saveSummaryToDB(bookId, chapterIndex, title, cached.response, cached.model);
        return summary2;
      }
    }
    const provider = createProvider(this.aiConfig);
    let summaryText;
    const shouldSplit = content.length > (options.chunkSize || 3e3);
    if (shouldSplit) {
      logger.info("章节较长，使用 Map-Reduce 模式总结", "SummaryService");
      const chunks = await splitText(content, {
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap
      });
      logger.info(`分成 ${chunks.length} 个文本块`, "SummaryService");
      summaryText = await summarizeChunks(provider.model, chunks);
    } else {
      logger.info("章节较短，直接总结", "SummaryService");
      summaryText = await summarizeShort(provider.model, content);
    }
    this.cacheManager.set(cacheKey, summaryText, this.aiConfig.model);
    const summary = this.saveSummaryToDB(bookId, chapterIndex, title, summaryText, this.aiConfig.model);
    logger.info("章节总结完成", "SummaryService");
    return summary;
  }
  /**
   * 批量总结多个章节
   */
  async summarizeChapters(bookId, chapterIndices, options = {}) {
    const results = [];
    for (const index of chapterIndices) {
      try {
        const summary = await this.summarizeChapter(bookId, index, options);
        results.push(summary);
      } catch (error) {
        logger.error(`总结章节 ${index} 失败: ${error}`, "SummaryService");
      }
    }
    return results;
  }
  /**
   * 获取已有的总结
   */
  getSummary(bookId, chapterIndex) {
    return this.getSummaryFromDB(bookId, chapterIndex);
  }
  /**
   * 获取书籍的所有总结
   */
  getAllSummaries(bookId) {
    const stmt = this.db.prepare(`
      SELECT id, book_id, chapter_index, chapter_title, summary, model, created_at
      FROM chapter_summaries
      WHERE book_id = ?
      ORDER BY chapter_index
    `);
    const rows = stmt.all(bookId);
    return rows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      chapterIndex: row.chapter_index,
      chapterTitle: row.chapter_title,
      summary: row.summary,
      model: row.model,
      createdAt: new Date(row.created_at * 1e3)
    }));
  }
  /**
   * 删除总结
   */
  deleteSummary(bookId, chapterIndex) {
    const stmt = this.db.prepare(`
      DELETE FROM chapter_summaries
      WHERE book_id = ? AND chapter_index = ?
    `);
    stmt.run(bookId, chapterIndex);
  }
  /**
   * 从数据库获取总结
   */
  getSummaryFromDB(bookId, chapterIndex) {
    const stmt = this.db.prepare(`
      SELECT id, book_id, chapter_index, chapter_title, summary, model, created_at
      FROM chapter_summaries
      WHERE book_id = ? AND chapter_index = ?
    `);
    const row = stmt.get(bookId, chapterIndex);
    if (!row) return null;
    return {
      id: row.id,
      bookId: row.book_id,
      chapterIndex: row.chapter_index,
      chapterTitle: row.chapter_title,
      summary: row.summary,
      model: row.model,
      createdAt: new Date(row.created_at * 1e3)
    };
  }
  /**
   * 保存总结到数据库
   */
  saveSummaryToDB(bookId, chapterIndex, chapterTitle, summary, model) {
    const id = uuid.v4();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapter_summaries 
        (id, book_id, chapter_index, chapter_title, summary, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, bookId, chapterIndex, chapterTitle, summary, model);
    return {
      id,
      bookId,
      chapterIndex,
      chapterTitle,
      summary,
      model,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * 获取章节内容（从 EPUB 文件）
   */
  async getChapterContent(bookId, chapterIndex) {
    const bookStmt = this.db.prepare(`
      SELECT file_path, metadata FROM books WHERE id = ?
    `);
    const book = bookStmt.get(bookId);
    if (!book) {
      throw new Error(`书籍不存在: ${bookId}`);
    }
    const metadata = JSON.parse(book.metadata || "{}");
    const spine = metadata.spine;
    const toc = metadata.toc;
    if (!spine || !spine[chapterIndex]) {
      throw new Error(`章节索引越界: ${chapterIndex}`);
    }
    const chapterItem = spine[chapterIndex];
    const buffer = await promises.readFile(book.file_path);
    const zip = await JSZip.loadAsync(buffer);
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) {
      throw new Error("Invalid EPUB: container.xml not found");
    }
    let chapterFile = zip.file(`OEBPS/${chapterItem.href}`) || zip.file(chapterItem.href);
    if (!chapterFile) {
      const files = Object.keys(zip.files);
      const found = files.find((f) => f.endsWith(chapterItem.href));
      if (found) {
        chapterFile = zip.file(found);
      }
    }
    if (!chapterFile) {
      throw new Error(`章节文件未找到: ${chapterItem.href}`);
    }
    const html = await chapterFile.async("string");
    const content = cleanHtml(html);
    let title;
    if (toc && toc.length > 0) {
      const findInToc = (items) => {
        for (const item of items) {
          if (item.href === chapterItem.href || item.href.includes(chapterItem.id)) {
            return item.label;
          }
          if (item.children) {
            const found = findInToc(item.children);
            if (found) return found;
          }
        }
        return void 0;
      };
      title = findInToc(toc);
    }
    return { content, title };
  }
}
let summaryService = null;
let lastConfigHash = "";
function getSummaryService() {
  const db = DatabaseService.getInstance().getDatabase();
  const aiConfig = SettingsHandlers.get("ai");
  if (!aiConfig || !aiConfig.enabled) {
    throw new Error("AI 功能未启用，请在设置中配置");
  }
  if (!aiConfig.apiKey) {
    throw new Error("请配置 AI API Key");
  }
  const currentConfigHash = JSON.stringify({
    provider: aiConfig.provider,
    apiKey: aiConfig.apiKey.substring(0, 10),
    // 只比较前10个字符
    model: aiConfig.model,
    baseURL: aiConfig.baseURL
  });
  if (summaryService && currentConfigHash !== lastConfigHash) {
    console.log("[AIHandlers] AI config changed, recreating SummaryService");
    console.log("[AIHandlers] Old hash:", lastConfigHash, "New hash:", currentConfigHash);
    console.log("[AIHandlers] New config provider:", aiConfig.provider, "model:", aiConfig.model);
    summaryService = null;
  }
  if (!summaryService) {
    console.log("[AIHandlers] Creating new SummaryService with config:", {
      provider: aiConfig.provider,
      model: aiConfig.model,
      baseURL: aiConfig.baseURL
    });
    summaryService = new SummaryService(db, aiConfig);
    lastConfigHash = currentConfigHash;
  }
  return summaryService;
}
function resetSummaryService() {
  console.log("[AIHandlers] Resetting SummaryService cache");
  summaryService = null;
  lastConfigHash = "";
}
class AIHandlers {
  /**
   * 总结章节
   */
  static async summarizeChapter(bookId, chapterIndex, options) {
    logger.info(`IPC: 总结章节 - bookId=${bookId}, chapterIndex=${chapterIndex}`, "AIHandlers");
    try {
      console.log("[AIHandlers] Getting SummaryService instance...");
      const service = getSummaryService();
      console.log("[AIHandlers] Service obtained, calling summarizeChapter...");
      const result = await service.summarizeChapter(bookId, chapterIndex, options);
      console.log("[AIHandlers] Summarize completed:", result);
      return result;
    } catch (error) {
      logger.error(`总结章节失败: ${error}`, "AIHandlers");
      console.error("[AIHandlers] Summarize error:", error);
      throw error;
    }
  }
  /**
   * 批量总结章节
   */
  static async summarizeChapters(bookId, chapterIndices, options) {
    logger.info(`IPC: 批量总结章节 - bookId=${bookId}, count=${chapterIndices.length}`, "AIHandlers");
    try {
      const service = getSummaryService();
      return await service.summarizeChapters(bookId, chapterIndices, options);
    } catch (error) {
      logger.error(`批量总结章节失败: ${error}`, "AIHandlers");
      throw error;
    }
  }
  /**
   * 获取章节总结
   */
  static getSummary(bookId, chapterIndex) {
    logger.info(`IPC: 获取章节总结 - bookId=${bookId}, chapterIndex=${chapterIndex}`, "AIHandlers");
    console.log("[AIHandlers] getSummary called with:", { bookId, chapterIndex });
    try {
      const service = getSummaryService();
      const result = service.getSummary(bookId, chapterIndex);
      console.log("[AIHandlers] getSummary result:", result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("未启用") || errorMessage.includes("未配置") || errorMessage.includes("API Key")) {
        logger.info(`AI功能未配置，跳过获取总结`, "AIHandlers");
        console.log("[AIHandlers] AI not configured, returning null");
        return null;
      }
      logger.error(`获取章节总结失败: ${error}`, "AIHandlers");
      console.error("[AIHandlers] getSummary error:", error);
      return null;
    }
  }
  /**
   * 获取书籍的所有总结
   */
  static getAllSummaries(bookId) {
    logger.info(`IPC: 获取所有章节总结 - bookId=${bookId}`, "AIHandlers");
    try {
      const service = getSummaryService();
      return service.getAllSummaries(bookId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("未启用") || errorMessage.includes("未配置") || errorMessage.includes("API Key")) {
        logger.info(`AI功能未配置，返回空总结列表`, "AIHandlers");
        return [];
      }
      logger.error(`获取所有章节总结失败: ${error}`, "AIHandlers");
      return [];
    }
  }
  /**
   * 删除章节总结
   */
  static deleteSummary(bookId, chapterIndex) {
    logger.info(`IPC: 删除章节总结 - bookId=${bookId}, chapterIndex=${chapterIndex}`, "AIHandlers");
    try {
      const service = getSummaryService();
      service.deleteSummary(bookId, chapterIndex);
    } catch (error) {
      logger.error(`删除章节总结失败: ${error}`, "AIHandlers");
      throw error;
    }
  }
  /**
   * 检查 AI 配置是否有效
   */
  static checkConfig() {
    console.log("[AIHandlers] checkConfig called");
    try {
      const aiConfig = SettingsHandlers.get("ai");
      console.log("[AIHandlers] Retrieved aiConfig:", aiConfig);
      if (!aiConfig || !aiConfig.enabled) {
        console.log("[AIHandlers] AI not enabled");
        return { valid: false, error: "AI 功能未启用" };
      }
      if (!aiConfig.apiKey) {
        console.log("[AIHandlers] No API key configured");
        return { valid: false, error: "未配置 API Key" };
      }
      if (!aiConfig.provider) {
        console.log("[AIHandlers] No provider selected");
        return { valid: false, error: "未选择 AI 提供商" };
      }
      console.log("[AIHandlers] AI config is valid");
      return { valid: true };
    } catch (error) {
      console.error("[AIHandlers] checkConfig error:", error);
      return { valid: false, error: String(error) };
    }
  }
}
const ai = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AIHandlers,
  resetSummaryService
}, Symbol.toStringTag, { value: "Module" }));
class IPCHandlers {
  /**
   * 注册所有IPC处理器
   */
  static register() {
    this.registerWindowHandlers();
    this.registerFileHandlers();
    this.registerBookHandlers();
    this.registerAnnotationHandlers();
    this.registerProgressHandlers();
    this.registerTagHandlers();
    this.registerCollectionHandlers();
    this.registerWordBookHandlers();
    this.registerSettingsHandlers();
    this.registerDatabaseHandlers();
    this.registerSystemHandlers();
    this.registerAIHandlers();
  }
  /**
   * 注册窗口相关处理器
   */
  static registerWindowHandlers() {
    electron.ipcMain.handle(IPCChannels.WINDOW_MINIMIZE, (event) => {
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.minimize(window);
    });
    electron.ipcMain.handle(IPCChannels.WINDOW_MAXIMIZE, (event) => {
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.toggleMaximize(window);
    });
    electron.ipcMain.handle(IPCChannels.WINDOW_CLOSE, (event) => {
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.close(window);
    });
    electron.ipcMain.handle(IPCChannels.WINDOW_GET_BOUNDS, (event) => {
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      return window ? WindowHandlers.getBounds(window) : null;
    });
    electron.ipcMain.handle(IPCChannels.WINDOW_SET_BOUNDS, (event, bounds) => {
      const window = electron.BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.setBounds(window, bounds);
    });
  }
  /**
   * 注册文件相关处理器
   */
  static registerFileHandlers() {
    electron.ipcMain.handle(IPCChannels.FILE_SELECT, (_event, options) => {
      return FileHandlers.select(options);
    });
    electron.ipcMain.handle(IPCChannels.FILE_SELECT_DIRECTORY, (_event, options) => {
      return FileHandlers.selectDirectory(options);
    });
    electron.ipcMain.handle(IPCChannels.FILE_READ, (_event, filePath) => {
      return FileHandlers.read(filePath);
    });
    electron.ipcMain.handle(IPCChannels.FILE_WRITE, (_event, filePath, data) => {
      return FileHandlers.write(filePath, data);
    });
    electron.ipcMain.handle(IPCChannels.FILE_DELETE, (_event, filePath) => {
      return FileHandlers.delete(filePath);
    });
    electron.ipcMain.handle(IPCChannels.FILE_EXISTS, (_event, filePath) => {
      return FileHandlers.exists(filePath);
    });
    electron.ipcMain.handle(IPCChannels.FILE_GET_INFO, (_event, filePath) => {
      return FileHandlers.getInfo(filePath);
    });
  }
  /**
   * 注册书籍相关处理器
   */
  static registerBookHandlers() {
    electron.ipcMain.handle(IPCChannels.BOOK_IMPORT, (_event, filePath) => {
      return BookHandlers.import(filePath);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_GET_ALL, (_event, options) => {
      return BookHandlers.getAll(options);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_GET, (_event, id) => {
      return BookHandlers.get(id);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_UPDATE, (_event, id, updates) => {
      return BookHandlers.update(id, updates);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_DELETE, (_event, id, options) => {
      return BookHandlers.delete(id, options);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_SEARCH, (_event, options) => {
      return BookHandlers.search(options);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_EXTRACT_METADATA, (_event, filePath) => {
      return BookHandlers.extractMetadata(filePath);
    });
    electron.ipcMain.handle(IPCChannels.BOOK_EXTRACT_COVER, (_event, filePath) => {
      return BookHandlers.extractCover(filePath);
    });
  }
  /**
   * 注册批注相关处理器
   */
  static registerAnnotationHandlers() {
    electron.ipcMain.handle(IPCChannels.ANNOTATION_CREATE, (_event, data) => {
      return AnnotationHandlers.create(data);
    });
    electron.ipcMain.handle(IPCChannels.ANNOTATION_GET_ALL, (_event, options) => {
      return AnnotationHandlers.getAll(options);
    });
    electron.ipcMain.handle(IPCChannels.ANNOTATION_UPDATE, (_event, id, updates) => {
      return AnnotationHandlers.update(id, updates);
    });
    electron.ipcMain.handle(IPCChannels.ANNOTATION_DELETE, (_event, id) => {
      return AnnotationHandlers.delete(id);
    });
    electron.ipcMain.handle(IPCChannels.ANNOTATION_EXPORT, (_event, options) => {
      return AnnotationHandlers.export(options);
    });
  }
  /**
   * 注册进度相关处理器
   */
  static registerProgressHandlers() {
    electron.ipcMain.handle(IPCChannels.PROGRESS_SAVE, (_event, data) => {
      return ProgressHandlers.save(data);
    });
    electron.ipcMain.handle(IPCChannels.PROGRESS_GET, (_event, bookId) => {
      return ProgressHandlers.get(bookId);
    });
    electron.ipcMain.handle(IPCChannels.PROGRESS_ADD_TIME, (_event, data) => {
      return ProgressHandlers.addTime(data);
    });
  }
  /**
   * 注册标签相关处理器
   */
  static registerTagHandlers() {
    electron.ipcMain.handle(IPCChannels.TAG_CREATE, (_event, data) => {
      return TagHandlers.create(data);
    });
    electron.ipcMain.handle(IPCChannels.TAG_GET_ALL, () => {
      return TagHandlers.getAll();
    });
    electron.ipcMain.handle(IPCChannels.TAG_GET_BY_BOOK, (_event, bookId) => {
      return TagHandlers.getByBook(bookId);
    });
    electron.ipcMain.handle(IPCChannels.TAG_UPDATE, (_event, id, updates) => {
      return TagHandlers.update(id, updates);
    });
    electron.ipcMain.handle(IPCChannels.TAG_DELETE, (_event, id) => {
      return TagHandlers.delete(id);
    });
    electron.ipcMain.handle(IPCChannels.TAG_ADD_TO_BOOK, (_event, data) => {
      return TagHandlers.addToBook(data);
    });
    electron.ipcMain.handle(IPCChannels.TAG_REMOVE_FROM_BOOK, (_event, data) => {
      return TagHandlers.removeFromBook(data);
    });
  }
  /**
   * 注册书架相关处理器
   */
  static registerCollectionHandlers() {
    electron.ipcMain.handle(IPCChannels.COLLECTION_CREATE, (_event, data) => {
      return CollectionHandlers.create(data);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_GET_ALL, () => {
      return CollectionHandlers.getAll();
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_GET, (_event, id) => {
      return CollectionHandlers.get(id);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_UPDATE, (_event, id, updates) => {
      return CollectionHandlers.update(id, updates);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_DELETE, (_event, id) => {
      return CollectionHandlers.delete(id);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_ADD_BOOK, (_event, data) => {
      return CollectionHandlers.addBook(data);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_REMOVE_BOOK, (_event, data) => {
      return CollectionHandlers.removeBook(data);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_GET_BOOKS, (_event, collectionId) => {
      return CollectionHandlers.getBooks(collectionId);
    });
    electron.ipcMain.handle(IPCChannels.COLLECTION_GET_BY_BOOK, (_event, bookId) => {
      return CollectionHandlers.getByBook(bookId);
    });
  }
  /**
   * 注册生词本相关处理器
   */
  static registerWordBookHandlers() {
    electron.ipcMain.handle(IPCChannels.WORDBOOK_ADD, (_event, data) => {
      return WordBookHandlers.add(data);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_GET_ALL, (_event, options) => {
      return WordBookHandlers.getAll(options);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_GET, (_event, id) => {
      return WordBookHandlers.get(id);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_UPDATE, (_event, id, updates) => {
      return WordBookHandlers.update(id, updates);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_DELETE, (_event, id) => {
      return WordBookHandlers.delete(id);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_SEARCH, (_event, query, options) => {
      return WordBookHandlers.search(query, options);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_GET_BY_BOOK, (_event, bookId) => {
      return WordBookHandlers.getByBook(bookId);
    });
    electron.ipcMain.handle(IPCChannels.WORDBOOK_GET_STATS, () => {
      return WordBookHandlers.getStats();
    });
  }
  /**
   * 注册设置相关处理器
   */
  static registerSettingsHandlers() {
    electron.ipcMain.handle(IPCChannels.SETTINGS_GET, (_event, key) => {
      return SettingsHandlers.get(key);
    });
    electron.ipcMain.handle(IPCChannels.SETTINGS_SET, (_event, key, value) => {
      return SettingsHandlers.set(key, value);
    });
    electron.ipcMain.handle(IPCChannels.SETTINGS_DELETE, (_event, key) => {
      return SettingsHandlers.delete(key);
    });
    electron.ipcMain.handle(IPCChannels.SETTINGS_CLEAR, () => {
      return SettingsHandlers.clear();
    });
  }
  /**
   * 注册数据库相关处理器
   */
  static registerDatabaseHandlers() {
    electron.ipcMain.handle(IPCChannels.DB_QUERY, (_event, sql, params) => {
      return DatabaseHandlers.query(sql, params);
    });
    electron.ipcMain.handle(IPCChannels.DB_EXECUTE, (_event, sql, params) => {
      return DatabaseHandlers.execute(sql, params);
    });
    electron.ipcMain.handle(IPCChannels.DB_TRANSACTION, (_event, callback) => {
      return DatabaseHandlers.transaction(callback);
    });
  }
  /**
   * 注册系统相关处理器
   */
  static registerSystemHandlers() {
    electron.ipcMain.handle(IPCChannels.SYSTEM_OPEN_EXTERNAL, (_event, url) => {
      return SystemHandlers.openExternal(url);
    });
    electron.ipcMain.handle(IPCChannels.SYSTEM_SHOW_ITEM_IN_FOLDER, (_event, path2) => {
      return SystemHandlers.showItemInFolder(path2);
    });
    electron.ipcMain.handle(IPCChannels.SYSTEM_GET_APP_PATH, (_event, name) => {
      return SystemHandlers.getAppPath(name);
    });
    electron.ipcMain.handle(IPCChannels.SYSTEM_GET_VERSION, () => {
      return SystemHandlers.getVersion();
    });
  }
  /**
   * 注册 AI 相关处理器
   */
  static registerAIHandlers() {
    electron.ipcMain.handle(IPCChannels.AI_SUMMARIZE_CHAPTER, (_event, bookId, chapterIndex, options) => {
      return AIHandlers.summarizeChapter(bookId, chapterIndex, options);
    });
    electron.ipcMain.handle(IPCChannels.AI_SUMMARIZE_CHAPTERS, (_event, bookId, chapterIndices, options) => {
      return AIHandlers.summarizeChapters(bookId, chapterIndices, options);
    });
    electron.ipcMain.handle(IPCChannels.AI_GET_SUMMARY, (_event, bookId, chapterIndex) => {
      return AIHandlers.getSummary(bookId, chapterIndex);
    });
    electron.ipcMain.handle(IPCChannels.AI_GET_ALL_SUMMARIES, (_event, bookId) => {
      return AIHandlers.getAllSummaries(bookId);
    });
    electron.ipcMain.handle(IPCChannels.AI_DELETE_SUMMARY, (_event, bookId, chapterIndex) => {
      return AIHandlers.deleteSummary(bookId, chapterIndex);
    });
    electron.ipcMain.handle(IPCChannels.AI_CHECK_CONFIG, () => {
      return AIHandlers.checkConfig();
    });
  }
}
let mainWindow = null;
const isDev = process.env.NODE_ENV === "development" || !electron.app.isPackaged;
function createWindow() {
  mainWindow = WindowManager.createMainWindow();
  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
async function initialize() {
  try {
    await DatabaseService.getInstance().initialize();
    console.log("Database initialized");
    IPCHandlers.register();
    console.log("IPC handlers registered");
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}
electron.app.whenReady().then(async () => {
  if (process.platform === "win32") {
    electron.app.setAppUserModelId("com.kreader.app");
  }
  if (process.platform === "darwin" && isDev && electron.app.dock) {
    const iconPath = path.join(process.cwd(), "resources", "icon.png");
    console.log("[Main] Looking for icon at:", iconPath);
    console.log("[Main] Icon exists:", fs.existsSync(iconPath));
    if (fs.existsSync(iconPath)) {
      const icon = electron.nativeImage.createFromPath(iconPath);
      console.log("[Main] Icon loaded, size:", icon.getSize());
      electron.app.dock.setIcon(icon);
      console.log("[Main] Dock icon set successfully");
    }
  }
  await initialize();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("will-quit", async () => {
  await DatabaseService.getInstance().close();
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
