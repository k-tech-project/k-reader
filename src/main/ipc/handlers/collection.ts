/**
 * 书架IPC处理器
 */
import type { Collection } from '@shared/types';
import { DatabaseService } from '../database/DatabaseService';
import { randomUUID } from 'crypto';

export class CollectionHandlers {
  /**
   * 创建书架
   */
  static async create(data: { name: string; description?: string }): Promise<Collection> {
    const db = DatabaseService.getInstance();
    const now = Math.floor(Date.now() / 1000);

    const collection: Collection = {
      id: randomUUID(),
      name: data.name,
      description: data.description || '',
      createdAt: now * 1000,
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
  static async getAll(): Promise<Collection[]> {
    const db = DatabaseService.getInstance();

    const rows = db.execute(`
      SELECT c.*,
        COUNT(cb.book_id) as book_count
      FROM collections c
      LEFT JOIN collection_books cb ON c.id = cb.collection_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      createdAt: new Date(row.created_at * 1000),
      bookCount: row.book_count || 0,
    }));
  }

  /**
   * 获取单个书架
   */
  static async get(id: string): Promise<Collection | null> {
    const db = DatabaseService.getInstance();

    const row = db.execute(`
      SELECT c.*,
        COUNT(cb.book_id) as book_count
      FROM collections c
      LEFT JOIN collection_books cb ON c.id = cb.collection_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]).get() as any | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      createdAt: new Date(row.created_at * 1000),
      bookCount: row.book_count || 0,
    };
  }

  /**
   * 更新书架
   */
  static async update(id: string, updates: { name?: string; description?: string }): Promise<void> {
    const db = DatabaseService.getInstance();
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }

    if (fields.length === 0) return;

    params.push(id);
    db.execute(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  /**
   * 删除书架
   */
  static async delete(id: string): Promise<void> {
    const db = DatabaseService.getInstance();

    // 先删除书籍书架关联
    db.execute(`DELETE FROM collection_books WHERE collection_id = ?`, [id]);

    // 再删除书架
    db.execute(`DELETE FROM collections WHERE id = ?`, [id]);
  }

  /**
   * 添加书籍到书架
   */
  static async addBook(data: { collectionId: string; bookId: string }): Promise<void> {
    const db = DatabaseService.getInstance();

    // 检查是否已存在
    const existing = db.execute(
      `SELECT 1 FROM collection_books WHERE collection_id = ? AND book_id = ?`,
      [data.collectionId, data.bookId]
    );

    if (existing) return; // 已存在，无需重复添加

    db.execute(
      `INSERT INTO collection_books (collection_id, book_id) VALUES (?, ?)`,
      [data.collectionId, data.bookId]
    );
  }

  /**
   * 从书架移除书籍
   */
  static async removeBook(data: { collectionId: string; bookId: string }): Promise<void> {
    const db = DatabaseService.getInstance();

    db.execute(
      `DELETE FROM collection_books WHERE collection_id = ? AND book_id = ?`,
      [data.collectionId, data.bookId]
    );
  }

  /**
   * 获取书架的书籍
   */
  static async getBooks(collectionId: string): Promise<string[]> {
    const db = DatabaseService.getInstance();

    const rows = db.execute(`
      SELECT book_id
      FROM collection_books
      WHERE collection_id = ?
      ORDER BY added_at DESC
    `, [collectionId]).all() as any[];

    return rows.map((row) => row.book_id);
  }

  /**
   * 获取书籍所属的书架
   */
  static async getByBook(bookId: string): Promise<Collection[]> {
    const db = DatabaseService.getInstance();

    const rows = db.execute(`
      SELECT c.*
      FROM collections c
      INNER JOIN collection_books cb ON c.id = cb.collection_id
      WHERE cb.book_id = ?
      ORDER BY c.name ASC
    `, [bookId]).all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      createdAt: new Date(row.created_at * 1000),
      bookCount: 0, // 不需要在这个查询中计算
    }));
  }
}
