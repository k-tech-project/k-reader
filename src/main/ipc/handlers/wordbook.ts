/**
 * 生词本IPC处理器
 */
import type { WordBookEntry } from '@shared/types';
import { DatabaseService } from '@main/database/DatabaseService';
import { randomUUID } from 'crypto';
import { logger } from '@shared/utils/Logger';

export class WordBookHandlers {
  /**
   * 添加生词
   */
  static async add(data: {
    word: string;
    translation?: string;
    definition?: string;
    language?: string;
    bookId?: string;
    context?: string;
  }): Promise<WordBookEntry> {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1000);

    const entry: WordBookEntry = {
      id: randomUUID(),
      word: data.word,
      translation: data.translation || '',
      definition: data.definition || '',
      language: data.language || 'en',
      bookId: data.bookId,
      context: data.context || '',
      createdAt: new Date(now * 1000),
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
      logger.error('Failed to add word to wordbook', 'WordBookHandlers', error as Error);
      throw error;
    }
  }

  /**
   * 获取所有生词
   */
  static async getAll(options?: { language?: string; bookId?: string }): Promise<WordBookEntry[]> {
    const db = DatabaseService.getInstance();
    let sql = 'SELECT * FROM wordbook';
    const params: any[] = [];

    const conditions: string[] = [];
    if (options?.language) {
      conditions.push('language = ?');
      params.push(options.language);
    }
    if (options?.bookId) {
      conditions.push('book_id = ?');
      params.push(options.bookId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC';

    const rows = db.query(sql, params) as any[];
    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      translation: row.translation || '',
      definition: row.definition || '',
      language: row.language || 'en',
      bookId: row.book_id,
      context: row.context || '',
      createdAt: new Date(row.created_at * 1000),
    }));
  }

  /**
   * 获取单个生词
   */
  static async get(id: string): Promise<WordBookEntry | null> {
    const db = DatabaseService.getInstance();
    const row = db.execute('SELECT * FROM wordbook WHERE id = ?', [id]).get() as any | undefined;

    if (!row) return null;

    return {
      id: row.id,
      word: row.word,
      translation: row.translation || '',
      definition: row.definition || '',
      language: row.language || 'en',
      bookId: row.book_id,
      context: row.context || '',
      createdAt: new Date(row.created_at * 1000),
    };
  }

  /**
   * 更新生词
   */
  static async update(id: string, updates: {
    translation?: string;
    definition?: string;
    context?: string;
  }): Promise<void> {
    const db = DatabaseService.getInstance();
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.translation !== undefined) {
      fields.push('translation = ?');
      params.push(updates.translation);
    }
    if (updates.definition !== undefined) {
      fields.push('definition = ?');
      params.push(updates.definition);
    }
    if (updates.context !== undefined) {
      fields.push('context = ?');
      params.push(updates.context);
    }

    if (fields.length === 0) return;

    params.push(id);
    db.execute(`UPDATE wordbook SET ${fields.join(', ')} WHERE id = ?`, params);
    logger.info(`Updated word in wordbook: ${id}`);
  }

  /**
   * 删除生词
   */
  static async delete(id: string): Promise<void> {
    const db = DatabaseService.getInstance();
    db.execute('DELETE FROM wordbook WHERE id = ?', [id]);
    logger.info(`Deleted word from wordbook: ${id}`);
  }

  /**
   * 搜索生词
   */
  static async search(query: string, options?: { language?: string }): Promise<WordBookEntry[]> {
    const db = DatabaseService.getInstance();
    let sql = 'SELECT * FROM wordbook WHERE word LIKE ?';
    const params: any[] = [`%${query}%`];

    if (options?.language) {
      sql += ' AND language = ?';
      params.push(options.language);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = db.query(sql, params) as any[];
    return rows.map((row) => ({
      id: row.id,
      word: row.word,
      translation: row.translation || '',
      definition: row.definition || '',
      language: row.language || 'en',
      bookId: row.book_id,
      context: row.context || '',
      createdAt: new Date(row.created_at * 1000),
    }));
  }

  /**
   * 按书籍获取生词
   */
  static async getByBook(bookId: string): Promise<WordBookEntry[]> {
    return this.getAll({ bookId });
  }

  /**
   * 获取统计信息
   */
  static async getStats(): Promise<{ totalCount: number; byLanguage: Record<string, number> }> {
    const db = DatabaseService.getInstance();

    const totalRow = db.queryOne('SELECT COUNT(*) as count FROM wordbook') as any;
    const totalCount = totalRow?.count || 0;

    const langRows = db.query('SELECT language, COUNT(*) as count FROM wordbook GROUP BY language') as any[];
    const byLanguage: Record<string, number> = {};
    for (const row of langRows) {
      byLanguage[row.language] = row.count;
    }

    return { totalCount, byLanguage };
  }
}
