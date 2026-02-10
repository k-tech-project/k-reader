/**
 * AI IPC 处理器
 */

import type { ChapterSummary } from '@shared/types';
import { SummaryService } from '../../ai/services/SummaryService';
import { DatabaseService } from '../../database/DatabaseService';
import { SettingsHandlers } from './settings';
import { logger } from '@shared/utils/Logger';

// 延迟初始化 SummaryService
let summaryService: SummaryService | null = null;
let lastConfigHash: string = ''; // 用于检测配置变化

function getSummaryService(): SummaryService {
  const db = DatabaseService.getInstance().getDatabase();
  const aiConfig = SettingsHandlers.get('ai');

  if (!aiConfig || !aiConfig.enabled) {
    throw new Error('AI 功能未启用，请在设置中配置');
  }

  if (!aiConfig.apiKey) {
    throw new Error('请配置 AI API Key');
  }

  // 计算配置哈希来检测变化
  const currentConfigHash = JSON.stringify({
    provider: aiConfig.provider,
    apiKey: aiConfig.apiKey.substring(0, 10), // 只比较前10个字符
    model: aiConfig.model,
    baseURL: aiConfig.baseURL,
  });

  // 如果配置变化了，清除缓存
  if (summaryService && currentConfigHash !== lastConfigHash) {
    console.log('[AIHandlers] AI config changed, recreating SummaryService');
    console.log('[AIHandlers] Old hash:', lastConfigHash, 'New hash:', currentConfigHash);
    console.log('[AIHandlers] New config provider:', aiConfig.provider, 'model:', aiConfig.model);
    summaryService = null;
  }

  if (!summaryService) {
    console.log('[AIHandlers] Creating new SummaryService with config:', {
      provider: aiConfig.provider,
      model: aiConfig.model,
      baseURL: aiConfig.baseURL,
    });
    summaryService = new SummaryService(db, aiConfig);
    lastConfigHash = currentConfigHash;
  }

  return summaryService;
}

// 当设置变更时重置服务实例
export function resetSummaryService(): void {
  console.log('[AIHandlers] Resetting SummaryService cache');
  summaryService = null;
  lastConfigHash = '';
}

export class AIHandlers {
  /**
   * 总结章节
   */
  static async summarizeChapter(
    bookId: string,
    chapterIndex: number,
    options?: { forceRefresh?: boolean }
  ): Promise<ChapterSummary> {
    logger.info(`IPC: 总结章节 - bookId=${bookId}, chapterIndex=${chapterIndex}`, 'AIHandlers');

    try {
      console.log('[AIHandlers] Getting SummaryService instance...');
      const service = getSummaryService();
      console.log('[AIHandlers] Service obtained, calling summarizeChapter...');
      const result = await service.summarizeChapter(bookId, chapterIndex, options);
      console.log('[AIHandlers] Summarize completed:', result);
      return result;
    } catch (error) {
      logger.error(`总结章节失败: ${error}`, 'AIHandlers');
      console.error('[AIHandlers] Summarize error:', error);
      throw error;
    }
  }

  /**
   * 批量总结章节
   */
  static async summarizeChapters(
    bookId: string,
    chapterIndices: number[],
    options?: { forceRefresh?: boolean }
  ): Promise<ChapterSummary[]> {
    logger.info(`IPC: 批量总结章节 - bookId=${bookId}, count=${chapterIndices.length}`, 'AIHandlers');
    
    try {
      const service = getSummaryService();
      return await service.summarizeChapters(bookId, chapterIndices, options);
    } catch (error) {
      logger.error(`批量总结章节失败: ${error}`, 'AIHandlers');
      throw error;
    }
  }

  /**
   * 获取章节总结
   */
  static getSummary(bookId: string, chapterIndex: number): ChapterSummary | null {
    logger.info(`IPC: 获取章节总结 - bookId=${bookId}, chapterIndex=${chapterIndex}`, 'AIHandlers');
    console.log('[AIHandlers] getSummary called with:', { bookId, chapterIndex });

    try {
      const service = getSummaryService();
      const result = service.getSummary(bookId, chapterIndex);
      console.log('[AIHandlers] getSummary result:', result);
      return result;
    } catch (error) {
      // AI未配置时不是错误，只是没有总结
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('未启用') || errorMessage.includes('未配置') || errorMessage.includes('API Key')) {
        logger.info(`AI功能未配置，跳过获取总结`, 'AIHandlers');
        console.log('[AIHandlers] AI not configured, returning null');
        return null;
      }
      logger.error(`获取章节总结失败: ${error}`, 'AIHandlers');
      console.error('[AIHandlers] getSummary error:', error);
      return null;
    }
  }

  /**
   * 获取书籍的所有总结
   */
  static getAllSummaries(bookId: string): ChapterSummary[] {
    logger.info(`IPC: 获取所有章节总结 - bookId=${bookId}`, 'AIHandlers');

    try {
      const service = getSummaryService();
      return service.getAllSummaries(bookId);
    } catch (error) {
      // AI未配置时不是错误，只是没有总结
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('未启用') || errorMessage.includes('未配置') || errorMessage.includes('API Key')) {
        logger.info(`AI功能未配置，返回空总结列表`, 'AIHandlers');
        return [];
      }
      logger.error(`获取所有章节总结失败: ${error}`, 'AIHandlers');
      return [];
    }
  }

  /**
   * 删除章节总结
   */
  static deleteSummary(bookId: string, chapterIndex: number): void {
    logger.info(`IPC: 删除章节总结 - bookId=${bookId}, chapterIndex=${chapterIndex}`, 'AIHandlers');
    
    try {
      const service = getSummaryService();
      service.deleteSummary(bookId, chapterIndex);
    } catch (error) {
      logger.error(`删除章节总结失败: ${error}`, 'AIHandlers');
      throw error;
    }
  }

  /**
   * 检查 AI 配置是否有效
   */
  static checkConfig(): { valid: boolean; error?: string } {
    console.log('[AIHandlers] checkConfig called');
    try {
      const aiConfig = SettingsHandlers.get('ai');
      console.log('[AIHandlers] Retrieved aiConfig:', aiConfig);

      if (!aiConfig || !aiConfig.enabled) {
        console.log('[AIHandlers] AI not enabled');
        return { valid: false, error: 'AI 功能未启用' };
      }

      if (!aiConfig.apiKey) {
        console.log('[AIHandlers] No API key configured');
        return { valid: false, error: '未配置 API Key' };
      }

      if (!aiConfig.provider) {
        console.log('[AIHandlers] No provider selected');
        return { valid: false, error: '未选择 AI 提供商' };
      }

      console.log('[AIHandlers] AI config is valid');
      return { valid: true };
    } catch (error) {
      console.error('[AIHandlers] checkConfig error:', error);
      return { valid: false, error: String(error) };
    }
  }
}
