/**
 * 阅读进度IPC处理器
 */
import type { ReadingProgress } from '@shared/types';
import { DatabaseService } from '../../database/DatabaseService';

export class ProgressHandlers {
  /**
   * 保存进度
   */
  static async save(data: {
    bookId: string;
    currentCFI: string;
    progressPercentage: number;
    currentPage?: number;
    totalPages?: number;
  }): Promise<void> {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const now = Math.floor(Date.now() / 1000);

      // 检查是否已有进度记录
      const existing = db
        .prepare('SELECT reading_time FROM reading_progress WHERE book_id = ?')
        .get(data.bookId);

      if (existing) {
        // 更新现有记录
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
          0, // current_chapter - 需要从 CFI 计算
          data.progressPercentage,
          data.currentPage || 0,
          data.totalPages || 0,
          now,
          data.bookId
        );
      } else {
        // 插入新记录
        db.prepare(`
          INSERT INTO reading_progress (
            book_id, current_cfi, current_chapter, progress_percentage,
            current_page, total_pages, reading_time, last_read_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).run(
          data.bookId,
          data.currentCFI,
          0, // current_chapter
          data.progressPercentage,
          data.currentPage || 0,
          data.totalPages || 0,
          now
        );
      }

      // 同时更新书籍表中的进度和最后阅读时间
      db.prepare(`
        UPDATE books
        SET progress = ?,
            last_read_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(data.progressPercentage, now, now, data.bookId);

    } catch (error) {
      console.error('Failed to save progress:', error);
      throw error;
    }
  }

  /**
   * 获取进度
   */
  static async get(bookId: string): Promise<ReadingProgress | null> {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const row = db
        .prepare(`
          SELECT *
          FROM reading_progress
          WHERE book_id = ?
        `)
        .get(bookId) as any | undefined;

      if (!row) {
        return null;
      }

      return {
        bookId: row.book_id,
        currentCFI: row.current_cfi,
        currentChapter: row.current_chapter,
        progressPercentage: row.progress_percentage,
        totalPages: row.total_pages || undefined,
        currentPage: row.current_page || undefined,
        readingTime: row.reading_time || 0,
        lastReadAt: new Date(row.last_read_at * 1000),
        locations: row.locations ? JSON.parse(row.locations) : undefined,
        synced: !!row.synced,
      };
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  /**
   * 添加阅读时间
   */
  static async addTime(data: {
    bookId: string;
    seconds: number;
  }): Promise<void> {
    try {
      const db = DatabaseService.getInstance().getDatabase();

      // 更新阅读进度表中的时间
      db.prepare(`
        UPDATE reading_progress
        SET reading_time = reading_time + ?,
            last_read_at = ?
        WHERE book_id = ?
      `).run(data.seconds, Math.floor(Date.now() / 1000), data.bookId);

      // 同时更新书籍表中的累计阅读时间
      db.prepare(`
        UPDATE books
        SET reading_time = reading_time + ?,
            updated_at = ?
        WHERE id = ?
      `).run(data.seconds, Math.floor(Date.now() / 1000), data.bookId);

    } catch (error) {
      console.error('Failed to add reading time:', error);
      throw error;
    }
  }

  /**
   * 批量获取进度
   */
  static async getAll(bookIds: string[]): Promise<Map<string, ReadingProgress>> {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const progressMap = new Map<string, ReadingProgress>();

      if (bookIds.length === 0) {
        return progressMap;
      }

      const placeholders = bookIds.map(() => '?').join(',');
      const rows = db
        .prepare(`
          SELECT *
          FROM reading_progress
          WHERE book_id IN (${placeholders})
        `)
        .all(...bookIds) as any[];

      for (const row of rows) {
        progressMap.set(row.book_id, {
          bookId: row.book_id,
          currentCFI: row.current_cfi,
          currentChapter: row.current_chapter,
          progressPercentage: row.progress_percentage,
          totalPages: row.total_pages || undefined,
          currentPage: row.current_page || undefined,
          readingTime: row.reading_time || 0,
          lastReadAt: new Date(row.last_read_at * 1000),
          locations: row.locations ? JSON.parse(row.locations) : undefined,
          synced: !!row.synced,
        });
      }

      return progressMap;
    } catch (error) {
      console.error('Failed to get all progress:', error);
      return new Map();
    }
  }

  /**
   * 删除进度
   */
  static async delete(bookId: string): Promise<void> {
    try {
      const db = DatabaseService.getInstance().getDatabase();
      db.prepare('DELETE FROM reading_progress WHERE book_id = ?').run(bookId);
    } catch (error) {
      console.error('Failed to delete progress:', error);
      throw error;
    }
  }
}
