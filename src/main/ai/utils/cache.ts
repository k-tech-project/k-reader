/**
 * AI 缓存工具
 */

import CryptoJS from 'crypto-js';
import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface CacheEntry {
  id: string;
  cacheKey: string;
  response: string;
  model: string;
  createdAt: Date;
}

/**
 * 生成缓存键（基于内容哈希）
 */
export function generateCacheKey(content: string, model: string, prefix: string = 'ai'): string {
  const hash = CryptoJS.SHA256(content + model).toString();
  return `${prefix}:${model}:${hash.substring(0, 16)}`;
}

/**
 * AI 缓存管理器
 */
export class CacheManager {
  constructor(private db: Database) {}

  /**
   * 获取缓存
   */
  get(cacheKey: string): CacheEntry | null {
    const stmt = this.db.prepare(`
      SELECT id, cache_key, response, model, created_at
      FROM ai_cache
      WHERE cache_key = ?
    `);
    
    const row = stmt.get(cacheKey) as any;
    if (!row) return null;

    return {
      id: row.id,
      cacheKey: row.cache_key,
      response: row.response,
      model: row.model,
      createdAt: new Date(row.created_at * 1000),
    };
  }

  /**
   * 设置缓存
   */
  set(cacheKey: string, response: string, model: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_cache (id, cache_key, response, model)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(uuidv4(), cacheKey, response, model);
  }

  /**
   * 删除缓存
   */
  delete(cacheKey: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM ai_cache WHERE cache_key = ?
    `);
    
    stmt.run(cacheKey);
  }

  /**
   * 清理过期缓存
   * @param days 保留最近多少天的缓存
   */
  cleanup(days: number = 30): number {
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
  getStats(): { total: number; size: number } {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(LENGTH(response)) as size
      FROM ai_cache
    `);
    
    const row = stmt.get() as any;
    return {
      total: row.total || 0,
      size: row.size || 0,
    };
  }
}
