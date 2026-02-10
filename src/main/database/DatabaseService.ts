/**
 * 数据库服务
 */
import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { DB_NAME } from '@shared/constants';
import { logger } from '@shared/utils/Logger';
import { DatabaseError } from '@shared/utils/ErrorHandler';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database.Database | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Database already initialized', 'DatabaseService');
      return;
    }

    try {
      const userDataPath = app.getPath('userData');
      const dbPath = join(userDataPath, DB_NAME);

      logger.info(`Initializing database at ${dbPath}`, 'DatabaseService');

      this.db = new Database(dbPath);
      
      // 优化性能设置
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging
      this.db.pragma('synchronous = NORMAL'); // 平衡性能和安全性
      this.db.pragma('cache_size = -64000'); // 64MB cache
      this.db.pragma('temp_store = MEMORY'); // 临时表存储在内存
      this.db.pragma('mmap_size = 30000000000'); // 启用内存映射
      this.db.pragma('foreign_keys = ON'); // 启用外键约束

      // 创建表
      this.createTables();
      
      this.isInitialized = true;
      logger.info('Database initialized successfully', 'DatabaseService');
    } catch (error) {
      logger.error('Failed to initialize database', 'DatabaseService', error as Error);
      throw new DatabaseError('Failed to initialize database', 'DatabaseService', error as Error);
    }
  }

  /**
   * 创建数据库表
   */
  private createTables(): void {
    if (!this.db) return;

    // TODO: 创建所有必要的表
    // 书籍表
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

    // 批注表
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

    // 阅读进度表
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

    // 标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `);

    // 书籍标签关联表
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

    // 书架表
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

    // 书架书籍关联表
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

    // 生词本表
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

    // 翻译历史表
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
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): Database.Database {
    if (!this.db || !this.isInitialized) {
      throw new DatabaseError('Database not initialized', 'DatabaseService');
    }
    return this.db;
  }

  /**
   * 执行查询(SELECT)
   */
  query<T = any>(sql: string, params: any[] = []): T[] {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const results = stmt.all(...params) as T[];
      logger.debug(`Query executed: ${sql}`, 'DatabaseService', { rows: results.length });
      return results;
    } catch (error) {
      logger.error(`Query failed: ${sql}`, 'DatabaseService', error as Error, { params });
      throw new DatabaseError(`Query failed: ${sql}`, 'DatabaseService', error as Error);
    }
  }

  /**
   * 获取单行数据
   */
  queryOne<T = any>(sql: string, params: any[] = []): T | null {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const result = stmt.get(...params) as T | undefined;
      logger.debug(`QueryOne executed: ${sql}`, 'DatabaseService', { found: !!result });
      return result || null;
    } catch (error) {
      logger.error(`QueryOne failed: ${sql}`, 'DatabaseService', error as Error, { params });
      throw new DatabaseError(`QueryOne failed: ${sql}`, 'DatabaseService', error as Error);
    }
  }

  /**
   * 执行写操作(INSERT/UPDATE/DELETE)
   */
  execute(sql: string, params: any[] = []): Database.RunResult {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      logger.debug(`Execute: ${sql}`, 'DatabaseService', { changes: result.changes });
      return result;
    } catch (error) {
      logger.error(`Execute failed: ${sql}`, 'DatabaseService', error as Error, { params });
      throw new DatabaseError(`Execute failed: ${sql}`, 'DatabaseService', error as Error);
    }
  }

  /**
   * 执行事务
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    try {
      const db = this.getDatabase();
      const transaction = db.transaction(fn);
      const result = transaction(db);
      logger.debug('Transaction completed successfully', 'DatabaseService');
      return result;
    } catch (error) {
      logger.error('Transaction failed', 'DatabaseService', error as Error);
      throw new DatabaseError('Transaction failed', 'DatabaseService', error as Error);
    }
  }

  /**
   * 批量插入(使用事务优化性能)
   */
  bulkInsert(sql: string, dataList: any[][]): void {
    this.transaction((db) => {
      const stmt = db.prepare(sql);
      for (const data of dataList) {
        stmt.run(...data);
      }
    });
    logger.info(`Bulk inserted ${dataList.length} rows`, 'DatabaseService');
  }

  /**
   * 检查表是否存在
   */
  tableExists(tableName: string): boolean {
    try {
      const result = this.queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result ? result.count > 0 : false;
    } catch (error) {
      logger.error(`Failed to check table existence: ${tableName}`, 'DatabaseService', error as Error);
      return false;
    }
  }

  /**
   * 备份数据库
   */
  async backup(targetPath: string): Promise<void> {
    try {
      const db = this.getDatabase();
      await db.backup(targetPath);
      logger.info(`Database backed up to ${targetPath}`, 'DatabaseService');
    } catch (error) {
      logger.error('Database backup failed', 'DatabaseService', error as Error);
      throw new DatabaseError('Database backup failed', 'DatabaseService', error as Error);
    }
  }

  /**
   * 优化数据库(VACUUM)
   */
  optimize(): void {
    try {
      const db = this.getDatabase();
      db.exec('VACUUM');
      logger.info('Database optimized', 'DatabaseService');
    } catch (error) {
      logger.error('Database optimization failed', 'DatabaseService', error as Error);
      throw new DatabaseError('Database optimization failed', 'DatabaseService', error as Error);
    }
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): {
    isInitialized: boolean;
    tables: number;
    size?: number;
  } {
    try {
      if (!this.isInitialized || !this.db) {
        return { isInitialized: false, tables: 0 };
      }

      const tables = this.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );

      return {
        isInitialized: true,
        tables: tables.length,
      };
    } catch (error) {
      logger.error('Failed to get database stats', 'DatabaseService', error as Error);
      return { isInitialized: this.isInitialized, tables: 0 };
    }
  }

  /**
   * 关闭数据库
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        logger.info('Closing database', 'DatabaseService');
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        logger.info('Database closed successfully', 'DatabaseService');
      } catch (error) {
        logger.error('Failed to close database', 'DatabaseService', error as Error);
        throw new DatabaseError('Failed to close database', 'DatabaseService', error as Error);
      }
    }
  }
}
