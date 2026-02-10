/**
 * 章节总结服务
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';
import type { ChapterSummary, AISettings, TOCItem } from '../../../shared/types';
import { createProvider } from '../providers';
import { splitText, cleanHtml } from '../utils/textSplitter';
import { CacheManager, generateCacheKey } from '../utils/cache';
import { summarizeChunks, summarizeShort } from '../chains/summarize';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { logger } from '@shared/utils/Logger';

export interface SummarizeOptions {
  forceRefresh?: boolean; // 强制重新生成，忽略缓存
  chunkSize?: number;
  chunkOverlap?: number;
}

export class SummaryService {
  private cacheManager: CacheManager;

  constructor(
    private db: Database,
    private aiConfig: AISettings
  ) {
    this.cacheManager = new CacheManager(db);
  }

  /**
   * 总结章节内容
   */
  async summarizeChapter(
    bookId: string,
    chapterIndex: number,
    options: SummarizeOptions = {}
  ): Promise<ChapterSummary> {
    logger.info(`开始总结章节: bookId=${bookId}, chapterIndex=${chapterIndex}`, 'SummaryService');

    // 1. 检查是否已有总结（数据库缓存）
    if (!options.forceRefresh) {
      const existing = this.getSummaryFromDB(bookId, chapterIndex);
      if (existing) {
        logger.info('从数据库返回已有总结', 'SummaryService');
        return existing;
      }
    }

    // 2. 获取章节内容
    const { content, title } = await this.getChapterContent(bookId, chapterIndex);
    
    if (!content || content.trim().length === 0) {
      throw new Error('章节内容为空');
    }

    logger.info(`章节内容长度: ${content.length} 字符`, 'SummaryService');

    // 3. 检查 AI 缓存（基于内容哈希）
    const cacheKey = generateCacheKey(content, this.aiConfig.model, 'summary');
    if (!options.forceRefresh) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        logger.info('从 AI 缓存返回总结', 'SummaryService');
        // 保存到数据库
        const summary = this.saveSummaryToDB(bookId, chapterIndex, title, cached.response, cached.model);
        return summary;
      }
    }

    // 4. 调用 AI 生成总结
    const provider = createProvider(this.aiConfig);
    let summaryText: string;

    // 判断是否需要分块
    const shouldSplit = content.length > (options.chunkSize || 3000);

    if (shouldSplit) {
      logger.info('章节较长，使用 Map-Reduce 模式总结', 'SummaryService');
      const chunks = await splitText(content, {
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
      });
      logger.info(`分成 ${chunks.length} 个文本块`, 'SummaryService');
      
      summaryText = await summarizeChunks(provider.model, chunks);
    } else {
      logger.info('章节较短，直接总结', 'SummaryService');
      summaryText = await summarizeShort(provider.model, content);
    }

    // 5. 保存到缓存
    this.cacheManager.set(cacheKey, summaryText, this.aiConfig.model);

    // 6. 保存到数据库
    const summary = this.saveSummaryToDB(bookId, chapterIndex, title, summaryText, this.aiConfig.model);

    logger.info('章节总结完成', 'SummaryService');
    return summary;
  }

  /**
   * 批量总结多个章节
   */
  async summarizeChapters(
    bookId: string,
    chapterIndices: number[],
    options: SummarizeOptions = {}
  ): Promise<ChapterSummary[]> {
    const results: ChapterSummary[] = [];
    
    for (const index of chapterIndices) {
      try {
        const summary = await this.summarizeChapter(bookId, index, options);
        results.push(summary);
      } catch (error) {
        logger.error(`总结章节 ${index} 失败: ${error}`, 'SummaryService');
        // 继续处理其他章节
      }
    }

    return results;
  }

  /**
   * 获取已有的总结
   */
  getSummary(bookId: string, chapterIndex: number): ChapterSummary | null {
    return this.getSummaryFromDB(bookId, chapterIndex);
  }

  /**
   * 获取书籍的所有总结
   */
  getAllSummaries(bookId: string): ChapterSummary[] {
    const stmt = this.db.prepare(`
      SELECT id, book_id, chapter_index, chapter_title, summary, model, created_at
      FROM chapter_summaries
      WHERE book_id = ?
      ORDER BY chapter_index
    `);

    const rows = stmt.all(bookId) as any[];
    return rows.map(row => ({
      id: row.id,
      bookId: row.book_id,
      chapterIndex: row.chapter_index,
      chapterTitle: row.chapter_title,
      summary: row.summary,
      model: row.model,
      createdAt: new Date(row.created_at * 1000),
    }));
  }

  /**
   * 删除总结
   */
  deleteSummary(bookId: string, chapterIndex: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM chapter_summaries
      WHERE book_id = ? AND chapter_index = ?
    `);
    stmt.run(bookId, chapterIndex);
  }

  /**
   * 从数据库获取总结
   */
  private getSummaryFromDB(bookId: string, chapterIndex: number): ChapterSummary | null {
    const stmt = this.db.prepare(`
      SELECT id, book_id, chapter_index, chapter_title, summary, model, created_at
      FROM chapter_summaries
      WHERE book_id = ? AND chapter_index = ?
    `);

    const row = stmt.get(bookId, chapterIndex) as any;
    if (!row) return null;

    return {
      id: row.id,
      bookId: row.book_id,
      chapterIndex: row.chapter_index,
      chapterTitle: row.chapter_title,
      summary: row.summary,
      model: row.model,
      createdAt: new Date(row.created_at * 1000),
    };
  }

  /**
   * 保存总结到数据库
   */
  private saveSummaryToDB(
    bookId: string,
    chapterIndex: number,
    chapterTitle: string | undefined,
    summary: string,
    model: string
  ): ChapterSummary {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapter_summaries 
        (id, book_id, chapter_index, chapter_title, summary, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, bookId, chapterIndex, chapterTitle, summary, model);

    return {
      id,
      bookId,
      chapterIndex,
      chapterTitle,
      summary,
      model,
      createdAt: new Date(),
    };
  }

  /**
   * 获取章节内容（从 EPUB 文件）
   */
  private async getChapterContent(
    bookId: string,
    chapterIndex: number
  ): Promise<{ content: string; title?: string }> {
    // 1. 获取书籍信息
    const bookStmt = this.db.prepare(`
      SELECT file_path, metadata FROM books WHERE id = ?
    `);
    const book = bookStmt.get(bookId) as any;
    
    if (!book) {
      throw new Error(`书籍不存在: ${bookId}`);
    }

    // 2. 解析 metadata 获取 spine 和 toc
    const metadata = JSON.parse(book.metadata || '{}');
    const spine = metadata.spine as any[] | undefined;
    const toc = metadata.toc as TOCItem[] | undefined;

    if (!spine || !spine[chapterIndex]) {
      throw new Error(`章节索引越界: ${chapterIndex}`);
    }

    // 3. 从 EPUB 读取章节 HTML
    const chapterItem = spine[chapterIndex];
    const buffer = await readFile(book.file_path);
    const zip = await JSZip.loadAsync(buffer);

    // 查找 OPF 文件以获取基础路径
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) {
      throw new Error('Invalid EPUB: container.xml not found');
    }

    // 简化处理：假设内容在 OEBPS 或根目录
    let chapterFile = zip.file(`OEBPS/${chapterItem.href}`) || zip.file(chapterItem.href);
    
    // 如果找不到，尝试搜索
    if (!chapterFile) {
      const files = Object.keys(zip.files);
      const found = files.find(f => f.endsWith(chapterItem.href));
      if (found) {
        chapterFile = zip.file(found);
      }
    }

    if (!chapterFile) {
      throw new Error(`章节文件未找到: ${chapterItem.href}`);
    }

    const html = await chapterFile.async('string');
    const content = cleanHtml(html);

    // 4. 获取章节标题
    let title: string | undefined;
    if (toc && toc.length > 0) {
      // 从 TOC 中查找对应章节
      const findInToc = (items: TOCItem[]): string | undefined => {
        for (const item of items) {
          if (item.href === chapterItem.href || item.href.includes(chapterItem.id)) {
            return item.label;
          }
          if (item.children) {
            const found = findInToc(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      title = findInToc(toc);
    }

    return { content, title };
  }
}
