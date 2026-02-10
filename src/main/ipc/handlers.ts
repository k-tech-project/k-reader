/**
 * IPC处理器注册
 */
import { ipcMain, BrowserWindow } from 'electron';
import { IPCChannels } from '@shared/constants';
import { WindowHandlers } from './handlers/window';
import { FileHandlers } from './handlers/file';
import { BookHandlers } from './handlers/book';
import { AnnotationHandlers } from './handlers/annotation';
import { ProgressHandlers } from './handlers/progress';
import { TagHandlers } from './handlers/tag';
import { CollectionHandlers } from './handlers/collection';
import { SettingsHandlers } from './handlers/settings';
import { DatabaseHandlers } from './handlers/database';
import { SystemHandlers } from './handlers/system';
import { WordBookHandlers } from './handlers/wordbook';

export class IPCHandlers {
  /**
   * 注册所有IPC处理器
   */
  static register(): void {
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
  }

  /**
   * 注册窗口相关处理器
   */
  private static registerWindowHandlers(): void {
    ipcMain.handle(IPCChannels.WINDOW_MINIMIZE, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.minimize(window);
    });

    ipcMain.handle(IPCChannels.WINDOW_MAXIMIZE, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.toggleMaximize(window);
    });

    ipcMain.handle(IPCChannels.WINDOW_CLOSE, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.close(window);
    });

    ipcMain.handle(IPCChannels.WINDOW_GET_BOUNDS, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      return window ? WindowHandlers.getBounds(window) : null;
    });

    ipcMain.handle(IPCChannels.WINDOW_SET_BOUNDS, (event, bounds) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) WindowHandlers.setBounds(window, bounds);
    });
  }

  /**
   * 注册文件相关处理器
   */
  private static registerFileHandlers(): void {
    ipcMain.handle(IPCChannels.FILE_SELECT, (_event, options) => {
      return FileHandlers.select(options);
    });

    ipcMain.handle(IPCChannels.FILE_SELECT_DIRECTORY, (_event, options) => {
      return FileHandlers.selectDirectory(options);
    });

    ipcMain.handle(IPCChannels.FILE_READ, (_event, filePath) => {
      return FileHandlers.read(filePath);
    });

    ipcMain.handle(IPCChannels.FILE_WRITE, (_event, filePath, data) => {
      return FileHandlers.write(filePath, data);
    });

    ipcMain.handle(IPCChannels.FILE_DELETE, (_event, filePath) => {
      return FileHandlers.delete(filePath);
    });

    ipcMain.handle(IPCChannels.FILE_EXISTS, (_event, filePath) => {
      return FileHandlers.exists(filePath);
    });

    ipcMain.handle(IPCChannels.FILE_GET_INFO, (_event, filePath) => {
      return FileHandlers.getInfo(filePath);
    });
  }

  /**
   * 注册书籍相关处理器
   */
  private static registerBookHandlers(): void {
    ipcMain.handle(IPCChannels.BOOK_IMPORT, (_event, filePath) => {
      return BookHandlers.import(filePath);
    });

    ipcMain.handle(IPCChannels.BOOK_GET_ALL, (_event, options) => {
      return BookHandlers.getAll(options);
    });

    ipcMain.handle(IPCChannels.BOOK_GET, (_event, id) => {
      return BookHandlers.get(id);
    });

    ipcMain.handle(IPCChannels.BOOK_UPDATE, (_event, id, updates) => {
      return BookHandlers.update(id, updates);
    });

    ipcMain.handle(IPCChannels.BOOK_DELETE, (_event, id, options) => {
      return BookHandlers.delete(id, options);
    });

    ipcMain.handle(IPCChannels.BOOK_SEARCH, (_event, options) => {
      return BookHandlers.search(options);
    });

    ipcMain.handle(IPCChannels.BOOK_EXTRACT_METADATA, (_event, filePath) => {
      return BookHandlers.extractMetadata(filePath);
    });

    ipcMain.handle(IPCChannels.BOOK_EXTRACT_COVER, (_event, filePath) => {
      return BookHandlers.extractCover(filePath);
    });
  }

  /**
   * 注册批注相关处理器
   */
  private static registerAnnotationHandlers(): void {
    ipcMain.handle(IPCChannels.ANNOTATION_CREATE, (_event, data) => {
      return AnnotationHandlers.create(data);
    });

    ipcMain.handle(IPCChannels.ANNOTATION_GET_ALL, (_event, options) => {
      return AnnotationHandlers.getAll(options);
    });

    ipcMain.handle(IPCChannels.ANNOTATION_UPDATE, (_event, id, updates) => {
      return AnnotationHandlers.update(id, updates);
    });

    ipcMain.handle(IPCChannels.ANNOTATION_DELETE, (_event, id) => {
      return AnnotationHandlers.delete(id);
    });

    ipcMain.handle(IPCChannels.ANNOTATION_EXPORT, (_event, options) => {
      return AnnotationHandlers.export(options);
    });
  }

  /**
   * 注册进度相关处理器
   */
  private static registerProgressHandlers(): void {
    ipcMain.handle(IPCChannels.PROGRESS_SAVE, (_event, data) => {
      return ProgressHandlers.save(data);
    });

    ipcMain.handle(IPCChannels.PROGRESS_GET, (_event, bookId) => {
      return ProgressHandlers.get(bookId);
    });

    ipcMain.handle(IPCChannels.PROGRESS_ADD_TIME, (_event, data) => {
      return ProgressHandlers.addTime(data);
    });
  }

  /**
   * 注册标签相关处理器
   */
  private static registerTagHandlers(): void {
    ipcMain.handle(IPCChannels.TAG_CREATE, (_event, data) => {
      return TagHandlers.create(data);
    });

    ipcMain.handle(IPCChannels.TAG_GET_ALL, () => {
      return TagHandlers.getAll();
    });

    ipcMain.handle(IPCChannels.TAG_GET_BY_BOOK, (_event, bookId) => {
      return TagHandlers.getByBook(bookId);
    });

    ipcMain.handle(IPCChannels.TAG_UPDATE, (_event, id, updates) => {
      return TagHandlers.update(id, updates);
    });

    ipcMain.handle(IPCChannels.TAG_DELETE, (_event, id) => {
      return TagHandlers.delete(id);
    });

    ipcMain.handle(IPCChannels.TAG_ADD_TO_BOOK, (_event, data) => {
      return TagHandlers.addToBook(data);
    });

    ipcMain.handle(IPCChannels.TAG_REMOVE_FROM_BOOK, (_event, data) => {
      return TagHandlers.removeFromBook(data);
    });
  }

  /**
   * 注册书架相关处理器
   */
  private static registerCollectionHandlers(): void {
    ipcMain.handle(IPCChannels.COLLECTION_CREATE, (_event, data) => {
      return CollectionHandlers.create(data);
    });

    ipcMain.handle(IPCChannels.COLLECTION_GET_ALL, () => {
      return CollectionHandlers.getAll();
    });

    ipcMain.handle(IPCChannels.COLLECTION_GET, (_event, id) => {
      return CollectionHandlers.get(id);
    });

    ipcMain.handle(IPCChannels.COLLECTION_UPDATE, (_event, id, updates) => {
      return CollectionHandlers.update(id, updates);
    });

    ipcMain.handle(IPCChannels.COLLECTION_DELETE, (_event, id) => {
      return CollectionHandlers.delete(id);
    });

    ipcMain.handle(IPCChannels.COLLECTION_ADD_BOOK, (_event, data) => {
      return CollectionHandlers.addBook(data);
    });

    ipcMain.handle(IPCChannels.COLLECTION_REMOVE_BOOK, (_event, data) => {
      return CollectionHandlers.removeBook(data);
    });

    ipcMain.handle(IPCChannels.COLLECTION_GET_BOOKS, (_event, collectionId) => {
      return CollectionHandlers.getBooks(collectionId);
    });

    ipcMain.handle(IPCChannels.COLLECTION_GET_BY_BOOK, (_event, bookId) => {
      return CollectionHandlers.getByBook(bookId);
    });
  }

  /**
   * 注册生词本相关处理器
   */
  private static registerWordBookHandlers(): void {
    ipcMain.handle(IPCChannels.WORDBOOK_ADD, (_event, data) => {
      return WordBookHandlers.add(data);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_GET_ALL, (_event, options) => {
      return WordBookHandlers.getAll(options);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_GET, (_event, id) => {
      return WordBookHandlers.get(id);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_UPDATE, (_event, id, updates) => {
      return WordBookHandlers.update(id, updates);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_DELETE, (_event, id) => {
      return WordBookHandlers.delete(id);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_SEARCH, (_event, query, options) => {
      return WordBookHandlers.search(query, options);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_GET_BY_BOOK, (_event, bookId) => {
      return WordBookHandlers.getByBook(bookId);
    });

    ipcMain.handle(IPCChannels.WORDBOOK_GET_STATS, () => {
      return WordBookHandlers.getStats();
    });
  }

  /**
   * 注册设置相关处理器
   */
  private static registerSettingsHandlers(): void {
    ipcMain.handle(IPCChannels.SETTINGS_GET, (_event, key) => {
      return SettingsHandlers.get(key);
    });

    ipcMain.handle(IPCChannels.SETTINGS_SET, (_event, key, value) => {
      return SettingsHandlers.set(key, value);
    });

    ipcMain.handle(IPCChannels.SETTINGS_DELETE, (_event, key) => {
      return SettingsHandlers.delete(key);
    });

    ipcMain.handle(IPCChannels.SETTINGS_CLEAR, () => {
      return SettingsHandlers.clear();
    });
  }

  /**
   * 注册数据库相关处理器
   */
  private static registerDatabaseHandlers(): void {
    ipcMain.handle(IPCChannels.DB_QUERY, (_event, sql, params) => {
      return DatabaseHandlers.query(sql, params);
    });

    ipcMain.handle(IPCChannels.DB_EXECUTE, (_event, sql, params) => {
      return DatabaseHandlers.execute(sql, params);
    });

    ipcMain.handle(IPCChannels.DB_TRANSACTION, (_event, callback) => {
      return DatabaseHandlers.transaction(callback);
    });
  }

  /**
   * 注册系统相关处理器
   */
  private static registerSystemHandlers(): void {
    ipcMain.handle(IPCChannels.SYSTEM_OPEN_EXTERNAL, (_event, url) => {
      return SystemHandlers.openExternal(url);
    });

    ipcMain.handle(IPCChannels.SYSTEM_SHOW_ITEM_IN_FOLDER, (_event, path) => {
      return SystemHandlers.showItemInFolder(path);
    });

    ipcMain.handle(IPCChannels.SYSTEM_GET_APP_PATH, (_event, name) => {
      return SystemHandlers.getAppPath(name);
    });

    ipcMain.handle(IPCChannels.SYSTEM_GET_VERSION, () => {
      return SystemHandlers.getVersion();
    });
  }
}
