"use strict";
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const fs = require("fs");
const uuid = require("uuid");
const Database = require("better-sqlite3");
const JSZip = require("jszip");
const xml2js = require("xml2js");
const promises = require("fs/promises");
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
    const window = new electron.BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      frame: process.platform === "darwin",
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
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
  // 最多保留1000条日志
  constructor() {
    this.logLevel = 1;
    this.logs = [];
    this.maxLogs = 1e3;
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
    const getTitle = () => {
      if (meta?.["dc:title"]) return meta["dc:title"][0];
      if (meta?.title) return meta.title[0]?._ || meta.title[0];
      if (dc?.["dc:title"]) return dc["dc:title"][0];
      return "Unknown";
    };
    const getCreator = () => {
      if (meta?.["dc:creator"]) return meta["dc:creator"][0];
      if (meta?.creator) return meta.creator[0]?._ || meta.creator[0];
      if (dc?.["dc:creator"]) return dc["dc:creator"][0];
      return "Unknown";
    };
    const getPublisher = () => {
      if (meta?.["dc:publisher"]) return meta["dc:publisher"][0];
      if (meta?.publisher) return meta.publisher[0];
      return void 0;
    };
    const getDate = () => {
      if (meta?.["dc:date"]) return new Date(meta["dc:date"][0]);
      if (meta?.date) return new Date(meta.date[0]);
      return void 0;
    };
    const getISBN = () => {
      const identifiers = meta?.["dc:identifier"] || meta?.identifier || [];
      for (const id of identifiers) {
        const value = id._ || id;
        if (typeof value === "string" && (value.includes("isbn:") || value.includes("ISBN"))) {
          return value.replace(/isbn:/i, "");
        }
      }
      return void 0;
    };
    const getLanguage = () => {
      if (meta?.["dc:language"]) return meta["dc:language"][0];
      if (meta?.language) return meta.language[0];
      return void 0;
    };
    const getDescription = () => {
      if (meta?.["dc:description"]) return meta["dc:description"][0];
      if (meta?.description) {
        const desc = meta.description[0];
        return typeof desc === "string" ? desc : desc._;
      }
      return void 0;
    };
    return {
      title: getTitle(),
      author: getCreator(),
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
    const coverMeta = meta.find((m) => m.$.name === "cover");
    if (!coverMeta) {
      return void 0;
    }
    const coverId = coverMeta.$.content;
    const coverItem = manifest?.item?.find((i) => i.$.id === coverId);
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
      const zip = await JSZip.loadAsync(filePath);
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
      const zip = await JSZip.loadAsync(filePath);
      const hasContainer = zip.file("META-INF/container.xml") !== null;
      if (!hasContainer) {
        return false;
      }
      const containerXml = await zip.file("META-INF/container.xml")?.async("string");
      if (!containerXml) {
        return false;
      }
      const container = await xml2js.parseStringPromise(containerXml);
      const rootfilePath = container.rootfiles?.rootfile?.[0]?.$?.["full-path"];
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
      const exists = await FileHandlers.exists(filePath);
      if (!exists) {
        throw new Error("File not found");
      }
      const isValid = await EpubParser.validate(filePath);
      if (!isValid) {
        throw new Error("Invalid EPUB file");
      }
      const db = DatabaseService.getInstance().getDatabase();
      const existing = db.prepare("SELECT id FROM books WHERE file_path = ?").get(filePath);
      if (existing) {
        throw new Error("Book already imported");
      }
      const epubData = await EpubParser.parse(filePath);
      const fileInfo = await FileHandlers.getInfo(filePath);
      if (!fileInfo) {
        throw new Error("Failed to get file info");
      }
      const bookId = uuid.v4();
      const userDataPath = FileHandlers.getUserDataPath();
      const booksDir = path.join(userDataPath, "books");
      await FileHandlers.mkdir(booksDir, true);
      const bookFileName = `${bookId}.epub`;
      const destPath = path.join(booksDir, bookFileName);
      await FileHandlers.copy(filePath, destPath);
      let coverUrl;
      const coverData = await EpubParser.extractCoverData(filePath);
      if (coverData) {
        const coverDir = path.join(userDataPath, "covers");
        await FileHandlers.mkdir(coverDir, true);
        const coverFileName = `${bookId}.jpg`;
        const coverPath = path.join(coverDir, coverFileName);
        await FileHandlers.write(coverPath, coverData);
        coverUrl = coverPath;
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
      stmt.run(
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
      );
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
      const data = JSON.stringify(annotations, null, 2);
      logger.info(`Exported ${annotations.length} annotations for book ${options.bookId}`, "AnnotationHandlers");
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
  static async create(_data) {
    throw new Error("Not implemented");
  }
  /**
   * 获取所有标签
   */
  static async getAll() {
    return [];
  }
  /**
   * 添加标签到书籍
   */
  static async addToBook(_data) {
  }
  /**
   * 从书籍移除标签
   */
  static async removeFromBook(_data) {
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
    if (typeof key === "object") {
      Object.entries(key).forEach(([k, v]) => {
        s.set(k, v);
      });
    } else {
      s.set(key, value);
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
    this.registerSettingsHandlers();
    this.registerDatabaseHandlers();
    this.registerSystemHandlers();
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
    electron.ipcMain.handle(IPCChannels.TAG_ADD_TO_BOOK, (_event, data) => {
      return TagHandlers.addToBook(data);
    });
    electron.ipcMain.handle(IPCChannels.TAG_REMOVE_FROM_BOOK, (_event, data) => {
      return TagHandlers.removeFromBook(data);
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
    mainWindow.webContents.openDevTools();
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
