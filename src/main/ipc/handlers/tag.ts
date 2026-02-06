/**
 * 标签IPC处理器
 */
import type { Tag } from '@shared/types';
import { DatabaseService } from '../database/DatabaseService';
import { randomUUID } from 'crypto';

export class TagHandlers {
  /**
   * 创建标签
   */
  static async create(data: { name: string; color?: string }): Promise<Tag> {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1000);

    const tag: Tag = {
      id: randomUUID(),
      name: data.name,
      color: data.color || '#3B82F6',
      createdAt: now * 1000,
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
  static async getAll(): Promise<Tag[]> {
    const db = DatabaseService.getInstance();

    const rows = db.execute(`SELECT * FROM tags ORDER BY name ASC`).all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at * 1000),
    }));
  }

  /**
   * 更新标签
   */
  static async update(id: string, updates: { name?: string; color?: string }): Promise<void> {
    const db = DatabaseService.getInstance();
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.color) {
      fields.push('color = ?');
      params.push(updates.color);
    }

    if (fields.length === 0) return;

    params.push(id);
    db.execute(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  /**
   * 删除标签
   */
  static async delete(id: string): Promise<void> {
    const db = DatabaseService.getInstance();

    // 先删除书籍标签关联
    db.execute(`DELETE FROM book_tags WHERE tag_id = ?`, [id]);

    // 再删除标签
    db.execute(`DELETE FROM tags WHERE id = ?`, [id]);
  }

  /**
   * 添加标签到书籍
   */
  static async addToBook(data: { bookId: string; tagId: string }): Promise<void> {
    const db = DatabaseService.getInstance();

    // 检查是否已存在
    const existing = db.execute(
      `SELECT 1 FROM book_tags WHERE book_id = ? AND tag_id = ?`,
      [data.bookId, data.tagId]
    );

    if (existing) return; // 已存在，无需重复添加

    db.execute(
      `INSERT INTO book_tags (book_id, tag_id) VALUES (?, ?)`,
      [data.bookId, data.tagId]
    );
  }

  /**
   * 从书籍移除标签
   */
  static async removeFromBook(data: { bookId: string; tagId: string }): Promise<void> {
    const db = DatabaseService.getInstance();

    db.execute(
      `DELETE FROM book_tags WHERE book_id = ? AND tag_id = ?`,
      [data.bookId, data.tagId]
    );
  }

  /**
   * 获取书籍的标签
   */
  static async getByBook(bookId: string): Promise<Tag[]> {
    const db = DatabaseService.getInstance();

    const rows = db.execute(`
      SELECT t.* FROM tags t
      INNER JOIN book_tags bt ON t.id = bt.tag_id
      WHERE bt.book_id = ?
      ORDER BY t.name ASC
    `, [bookId]).all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at * 1000),
    }));
  }
}
