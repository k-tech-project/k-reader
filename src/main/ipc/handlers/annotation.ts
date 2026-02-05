/**
 * 批注IPC处理器
 */
import { v4 as uuidv4 } from 'uuid';
import type { Annotation, ExportResult } from '@shared/types';
import { DatabaseService } from '../../database/DatabaseService';
import { logger } from '@shared/utils/Logger';
import { DatabaseError, ValidationError, NotFoundError } from '@shared/utils/ErrorHandler';

export class AnnotationHandlers {
  /**
   * 创建批注
   */
  static async create(data: {
    bookId: string;
    type: 'highlight' | 'underline' | 'note' | 'bookmark';
    cfi: string;
    cfiRange?: string;
    selectedText?: string;
    note?: string;
    color?: string;
    chapterIndex?: number;
    chapterTitle?: string;
  }): Promise<Annotation> {
    try {
      // 验证必需字段
      if (!data.bookId || !data.type || !data.cfi) {
        throw new ValidationError('Missing required fields: bookId, type, cfi', 'AnnotationHandlers');
      }

      const db = DatabaseService.getInstance();
      const now = Math.floor(Date.now() / 1000);
      
      const annotation: Annotation = {
        id: uuidv4(),
        bookId: data.bookId,
        type: data.type,
        cfi: data.cfi,
        cfiRange: data.cfiRange || '',
        selectedText: data.selectedText || '',
        note: data.note || '',
        color: data.color || '#ffeb3b',
        chapterIndex: data.chapterIndex || 0,
        chapterTitle: data.chapterTitle || '',
        createdAt: new Date(now * 1000),
        updatedAt: new Date(now * 1000),
        synced: false,
      };

      // 插入数据库
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
          0,
        ]
      );

      logger.info(`Annotation created: ${annotation.id} (${annotation.type})`, 'AnnotationHandlers');
      return annotation;
    } catch (error) {
      logger.error('Failed to create annotation', 'AnnotationHandlers', error as Error);
      throw error;
    }
  }

  /**
   * 获取所有批注
   */
  static async getAll(options: {
    bookId: string;
    type?: 'highlight' | 'underline' | 'note' | 'bookmark';
  }): Promise<Annotation[]> {
    try {
      const db = DatabaseService.getInstance();
      
      let sql = 'SELECT * FROM annotations WHERE book_id = ?';
      const params: any[] = [options.bookId];

      if (options.type) {
        sql += ' AND type = ?';
        params.push(options.type);
      }

      sql += ' ORDER BY created_at DESC';

      const results = db.query<any>(sql, params);

      const annotations: Annotation[] = results.map((row) => ({
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
        createdAt: new Date(row.created_at * 1000),
        updatedAt: new Date(row.updated_at * 1000),
        synced: row.synced === 1,
      }));

      logger.debug(`Retrieved ${annotations.length} annotations for book ${options.bookId}`, 'AnnotationHandlers');
      return annotations;
    } catch (error) {
      logger.error('Failed to get annotations', 'AnnotationHandlers', error as Error);
      throw new DatabaseError('Failed to get annotations', 'AnnotationHandlers', error as Error);
    }
  }

  /**
   * 更新批注
   */
  static async update(id: string, updates: Partial<Annotation>): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      const now = Math.floor(Date.now() / 1000);

      // 构建更新字段
      const fields: string[] = [];
      const params: any[] = [];

      if (updates.note !== undefined) {
        fields.push('note = ?');
        params.push(updates.note);
      }

      if (updates.color !== undefined) {
        fields.push('color = ?');
        params.push(updates.color);
      }

      if (updates.selectedText !== undefined) {
        fields.push('selected_text = ?');
        params.push(updates.selectedText);
      }

      if (fields.length === 0) {
        logger.warn('No fields to update', 'AnnotationHandlers');
        return;
      }

      fields.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const sql = `UPDATE annotations SET ${fields.join(', ')} WHERE id = ?`;
      const result = db.execute(sql, params);

      if (result.changes === 0) {
        throw new NotFoundError(`Annotation not found: ${id}`, 'AnnotationHandlers');
      }

      logger.info(`Annotation updated: ${id}`, 'AnnotationHandlers');
    } catch (error) {
      logger.error(`Failed to update annotation: ${id}`, 'AnnotationHandlers', error as Error);
      throw error;
    }
  }

  /**
   * 删除批注
   */
  static async delete(id: string): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      
      const result = db.execute('DELETE FROM annotations WHERE id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError(`Annotation not found: ${id}`, 'AnnotationHandlers');
      }

      logger.info(`Annotation deleted: ${id}`, 'AnnotationHandlers');
    } catch (error) {
      logger.error(`Failed to delete annotation: ${id}`, 'AnnotationHandlers', error as Error);
      throw error;
    }
  }

  /**
   * 导出批注
   */
  static async export(options: {
    bookId: string;
    format: 'markdown' | 'json' | 'pdf';
  }): Promise<ExportResult> {
    try {
      const annotations = await this.getAll({ bookId: options.bookId });

      if (annotations.length === 0) {
        return {
          success: false,
          error: 'No annotations to export',
        };
      }

      // TODO: 实现不同格式的导出
      // 这里先返回 JSON 格式
      const data = JSON.stringify(annotations, null, 2);

      logger.info(`Exported ${annotations.length} annotations for book ${options.bookId}`, 'AnnotationHandlers');

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Failed to export annotations', 'AnnotationHandlers', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
