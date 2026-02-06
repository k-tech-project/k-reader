/**
 * 书籍IPC处理器
 */
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { Book, BookMetadata } from '@shared/types';
import { DatabaseService } from '../../database/DatabaseService';
import { FileHandlers } from './file';
import { EpubParser } from '../../services/EpubParser';
import { logger } from '@shared/utils/Logger';

export class BookHandlers {
  /**
   * 导入书籍
   */
  static async import(filePath: string): Promise<Book> {
    try {
      const startedAt = Date.now();
      logger.info(`Import started: ${filePath}`, 'BookHandlers');

      // 验证文件存在
      const exists = await FileHandlers.exists(filePath);
      if (!exists) {
        throw new Error('File not found');
      }
      logger.debug('File exists', 'BookHandlers');

      // 检查是否已导入
      const db = DatabaseService.getInstance().getDatabase();
      const existing = db
        .prepare('SELECT id FROM books WHERE file_path = ?')
        .get(filePath);
      if (existing) {
        throw new Error('Book already imported');
      }
      logger.debug('Not imported yet', 'BookHandlers');

      // 解析 EPUB
      const epubData = await EpubParser.parse(filePath);
      logger.debug('EPUB parsed', 'BookHandlers');

      // 获取文件信息
      const fileInfo = await FileHandlers.getInfo(filePath);
      if (!fileInfo) {
        throw new Error('Failed to get file info');
      }
      logger.debug(`File info size=${fileInfo.size}`, 'BookHandlers');

      // 生成书籍 ID
      const bookId = uuidv4();

      // 创建书籍目录
      const userDataPath = FileHandlers.getUserDataPath();
      const booksDir = path.join(userDataPath, 'books');
      await FileHandlers.mkdir(booksDir, true);
      logger.debug(`Books dir ready: ${booksDir}`, 'BookHandlers');

      // 复制书籍文件
      const bookFileName = `${bookId}.epub`;
      const destPath = path.join(booksDir, bookFileName);
      await FileHandlers.copy(filePath, destPath);
      logger.debug(`Book copied to ${destPath}`, 'BookHandlers');

      // 提取封面
      let coverUrl: string | undefined;
      const coverData = await EpubParser.extractCoverData(filePath);
      if (coverData) {
        const coverDir = path.join(userDataPath, 'covers');
        await FileHandlers.mkdir(coverDir, true);
        const coverFileName = `${bookId}.jpg`;
        const coverPath = path.join(coverDir, coverFileName);
        await FileHandlers.write(coverPath, coverData);
        coverUrl = coverPath;
        logger.debug(`Cover written: ${coverPath} (${coverData.length} bytes)`, 'BookHandlers');
      } else {
        logger.debug('No cover data found', 'BookHandlers');
      }

      // 准备书籍数据
      const now = Math.floor(Date.now() / 1000);
      const book: Book = {
        id: bookId,
        title: epubData.metadata.title,
        author: epubData.metadata.author,
        publisher: epubData.metadata.publisher || '',
        publishDate: epubData.metadata.publishDate,
        isbn: epubData.metadata.isbn,
        language: epubData.metadata.language || 'zh-CN',
        description: epubData.metadata.description,
        coverUrl,
        filePath: destPath,
        fileSize: fileInfo.size,
        format: 'epub',
        addedAt: new Date(now * 1000),
        readingTime: 0,
        progress: 0,
        tags: [],
        collections: [],
        metadata: {
          identifier: epubData.metadata.isbn,
          creator: epubData.metadata.author,
          spine: epubData.spine,
          toc: epubData.toc,
        },
      };

      // 保存到数据库
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
        book.publishDate ? Math.floor(book.publishDate.getTime() / 1000) : null,
        book.isbn || null,
        book.language,
        book.description || null,
        book.coverUrl || null,
        book.filePath,
        book.fileSize,
        book.format,
        Math.floor(book.addedAt.getTime() / 1000),
        JSON.stringify(book.metadata),
      ];

      logger.debug('Inserting book into DB', 'BookHandlers');
      stmt.run(params);
      logger.info(`Import completed in ${Date.now() - startedAt}ms`, 'BookHandlers');

      return book;
    } catch (error) {
      console.error('Failed to import book:', error);
      throw error;
    }
  }

  /**
   * 获取所有书籍
   */
  static async getAll(options?: { sortBy?: 'addedAt' | 'lastReadAt' | 'title'; order?: 'asc' | 'desc' }): Promise<Book[]> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      const sortBy = options?.sortBy || 'addedAt';
      const order = options?.order || 'desc';
      const orderClause = order === 'asc' ? 'ASC' : 'DESC';

      let orderBy = 'added_at';
      if (sortBy === 'lastReadAt') orderBy = 'last_read_at';
      if (sortBy === 'title') orderBy = 'title';

      const rows = db
        .prepare(`
          SELECT * FROM books
          ORDER BY ${orderBy} ${orderClause}
        `)
        .all() as any[];

      return rows.map(this.mapRowToBook);
    } catch (error) {
      console.error('Failed to get all books:', error);
      return [];
    }
  }

  /**
   * 获取单本书籍
   */
  static async get(id: string): Promise<Book | null> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      const row = db
        .prepare('SELECT * FROM books WHERE id = ?')
        .get(id) as any | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToBook(row);
    } catch (error) {
      console.error('Failed to get book:', error);
      return null;
    }
  }

  /**
   * 更新书籍
   */
  static async update(id: string, updates: Partial<Book>): Promise<void> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      const fields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.author !== undefined) {
        fields.push('author = ?');
        values.push(updates.author);
      }
      if (updates.publisher !== undefined) {
        fields.push('publisher = ?');
        values.push(updates.publisher);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }

      if (fields.length === 0) {
        return;
      }

      fields.push('updated_at = ?');
      values.push(Math.floor(Date.now() / 1000));
      values.push(id);

      const stmt = db.prepare(`
        UPDATE books
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
    } catch (error) {
      console.error('Failed to update book:', error);
      throw error;
    }
  }

  /**
   * 删除书籍
   */
  static async delete(id: string, options?: { deleteFile?: boolean }): Promise<void> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      // 获取书籍信息
      const book = await this.get(id);
      if (!book) {
        throw new Error('Book not found');
      }

      // 删除数据库记录
      db.prepare('DELETE FROM books WHERE id = ?').run(id);

      // 删除关联数据（由外键自动处理）
      // 删除封面文件
      if (book.coverUrl) {
        try {
          await FileHandlers.delete(book.coverUrl);
        } catch {
          // 忽略删除封面的错误
        }
      }

      // 删除书籍文件
      if (options?.deleteFile) {
        try {
          await FileHandlers.delete(book.filePath);
        } catch {
          // 忽略删除文件失败
        }
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
      throw error;
    }
  }

  /**
   * 搜索书籍
   */
  static async search(options: { query: string; field?: 'title' | 'author' | 'all' }): Promise<Book[]> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      let sql = '';
      let params: string[] = [];

      if (options.field === 'title') {
        sql = 'SELECT * FROM books WHERE title LIKE ?';
        params.push(`%${options.query}%`);
      } else if (options.field === 'author') {
        sql = 'SELECT * FROM books WHERE author LIKE ?';
        params.push(`%${options.query}%`);
      } else {
        sql = 'SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR description LIKE ?';
        params.push(`%${options.query}%`, `%${options.query}%`, `%${options.query}%`);
      }

      const rows = db.prepare(sql).all(...params) as any[];

      return rows.map(this.mapRowToBook);
    } catch (error) {
      console.error('Failed to search books:', error);
      return [];
    }
  }

  /**
   * 提取元数据
   */
  static async extractMetadata(filePath: string): Promise<BookMetadata> {
    try {
      const epubData = await EpubParser.parse(filePath);

      return {
        identifier: epubData.metadata.isbn,
        creator: epubData.metadata.author,
        contributor: epubData.metadata.publisher,
        rights: undefined,
        modifiedDate: epubData.metadata.publishDate,
        spine: epubData.spine,
        toc: epubData.toc,
      };
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      throw new Error('Failed to extract metadata');
    }
  }

  /**
   * 提取封面
   */
  static async extractCover(filePath: string): Promise<string> {
    try {
      const coverData = await EpubParser.extractCoverData(filePath);
      if (!coverData) {
        throw new Error('No cover found');
      }

      // 保存封面到临时目录
      const tempPath = path.join(FileHandlers.getTempPath(), `cover_${Date.now()}.jpg`);
      await FileHandlers.write(tempPath, coverData);

      return tempPath;
    } catch (error) {
      console.error('Failed to extract cover:', error);
      throw new Error('Failed to extract cover');
    }
  }

  /**
   * 将数据库行映射为 Book 对象
   */
  private static mapRowToBook(row: any): Book {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      publisher: row.publisher || '',
      publishDate: row.publish_date ? new Date(row.publish_date * 1000) : undefined,
      isbn: row.isbn || undefined,
      language: row.language || 'zh-CN',
      description: row.description || undefined,
      coverUrl: row.cover_path || undefined,
      filePath: row.file_path,
      fileSize: row.file_size,
      format: row.format,
      addedAt: new Date(row.added_at * 1000),
      lastReadAt: row.last_read_at ? new Date(row.last_read_at * 1000) : undefined,
      readingTime: row.reading_time || 0,
      progress: row.progress || 0,
      tags: [], // TODO: 从数据库加载标签
      collections: [], // TODO: 从数据库加载书架
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
