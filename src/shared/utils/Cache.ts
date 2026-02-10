/**
 * 简单的 LRU 缓存实现
 */

import { logger } from './Logger';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheItem<V>>;
  private maxSize: number;
  private ttl: number; // 过期时间(毫秒)

  constructor(maxSize: number = 100, ttl: number = 3600000) { // 默认1小时
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * 获取缓存项
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${String(key)}`, 'LRUCache');
      return undefined;
    }

    // 更新访问计数和时间戳
    item.accessCount++;
    item.timestamp = Date.now();
    
    // 移动到最前面(LRU策略)
    this.cache.delete(key);
    this.cache.set(key, item);

    logger.debug(`Cache hit: ${String(key)}`, 'LRUCache');
    return item.value;
  }

  /**
   * 设置缓存项
   */
  set(key: K, value: V): void {
    // 如果已存在,先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过最大容量,删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        logger.debug(`Cache evicted: ${String(firstKey)}`, 'LRUCache');
      }
    }

    // 添加新项
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });

    logger.debug(`Cache set: ${String(key)}`, 'LRUCache');
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    logger.debug(`Cache delete: ${String(key)}`, 'LRUCache');
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    logger.info(`Cache cleared, size: ${this.cache.size}`, 'LRUCache');
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    const stats = {
      size: this.cache.size,
      maxSize: this.maxSize,
    };

    return stats;
  }

  /**
   * 清理过期项
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired cache items`, 'LRUCache');
    }
  }
}

/**
 * 简单的内存缓存管理器
 */
export class CacheManager {
  private caches: Map<string, LRUCache<any, any>> = new Map();

  /**
   * 获取或创建缓存
   */
  getCache<K, V>(name: string, maxSize?: number, ttl?: number): LRUCache<K, V> {
    if (!this.caches.has(name)) {
      const cache = new LRUCache<K, V>(maxSize, ttl);
      this.caches.set(name, cache);
      logger.info(`Created cache: ${name}`, 'CacheManager');
    }
    return this.caches.get(name)!;
  }

  /**
   * 删除缓存
   */
  deleteCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      this.caches.delete(name);
      logger.info(`Deleted cache: ${name}`, 'CacheManager');
      return true;
    }
    return false;
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    logger.info('Cleared all caches', 'CacheManager');
  }

  /**
   * 清理所有过期项
   */
  cleanupAll(): void {
    for (const cache of this.caches.values()) {
      cache.cleanup();
    }
  }

  /**
   * 获取所有缓存统计
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }
}

// 导出单例
export const cacheManager = new CacheManager();

// 定时清理过期缓存(每30分钟)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanupAll();
  }, 30 * 60 * 1000);
}
