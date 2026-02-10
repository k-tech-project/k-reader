/**
 * 章节总结 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UseChapterSummaryOptions {
  enabled?: boolean;
  forceRefresh?: boolean;
}

/**
 * 获取章节总结
 */
export function useChapterSummary(
  bookId: string,
  chapterIndex: number,
  options: UseChapterSummaryOptions = {}
) {
  return useQuery({
    queryKey: ['chapterSummary', bookId, chapterIndex],
    queryFn: async () => {
      console.log('[useChapterSummary] Fetching summary for:', { bookId, chapterIndex });
      try {
        // 先尝试从数据库获取已有总结
        const existing = await window.electronAPI.ai.getSummary(bookId, chapterIndex);
        console.log('[useChapterSummary] Got summary from API:', existing);
        if (existing && !options.forceRefresh) {
          return existing;
        }
        return null;
      } catch (error) {
        // AI未配置时不是错误，静默返回null
        console.warn('[useChapterSummary] Failed to get summary:', error);
        return null;
      }
    },
    enabled: options.enabled !== false,
    staleTime: Infinity, // 总结内容不会变化
    retry: false, // 不重试，避免多次错误
  });
}

/**
 * 生成章节总结
 */
export function useGenerateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      chapterIndex,
      forceRefresh = false,
    }: {
      bookId: string;
      chapterIndex: number;
      forceRefresh?: boolean;
    }) => {
      return await window.electronAPI.ai.summarizeChapter(bookId, chapterIndex, {
        forceRefresh,
      });
    },
    onSuccess: (data) => {
      // 更新缓存
      queryClient.setQueryData(
        ['chapterSummary', data.bookId, data.chapterIndex],
        data
      );
      // 使所有总结列表失效
      queryClient.invalidateQueries({ queryKey: ['chapterSummaries', data.bookId] });
    },
  });
}

/**
 * 批量生成章节总结
 */
export function useGenerateSummaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      chapterIndices,
      forceRefresh = false,
    }: {
      bookId: string;
      chapterIndices: number[];
      forceRefresh?: boolean;
    }) => {
      return await window.electronAPI.ai.summarizeChapters(bookId, chapterIndices, {
        forceRefresh,
      });
    },
    onSuccess: (data, variables) => {
      // 更新每个章节的缓存
      data.forEach((summary) => {
        queryClient.setQueryData(
          ['chapterSummary', summary.bookId, summary.chapterIndex],
          summary
        );
      });
      // 使所有总结列表失效
      queryClient.invalidateQueries({ queryKey: ['chapterSummaries', variables.bookId] });
    },
  });
}

/**
 * 获取书籍的所有总结
 */
export function useAllSummaries(bookId: string, enabled = true) {
  return useQuery({
    queryKey: ['chapterSummaries', bookId],
    queryFn: async () => {
      try {
        return await window.electronAPI.ai.getAllSummaries(bookId);
      } catch (error) {
        // AI未配置时不是错误，静默返回空数组
        console.warn('[useAllSummaries] Failed to get summaries:', error);
        return [];
      }
    },
    enabled,
    staleTime: 60000, // 1分钟
    retry: false, // 不重试，避免多次错误
  });
}

/**
 * 删除章节总结
 */
export function useDeleteSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      chapterIndex,
    }: {
      bookId: string;
      chapterIndex: number;
    }) => {
      await window.electronAPI.ai.deleteSummary(bookId, chapterIndex);
    },
    onSuccess: (_, variables) => {
      // 从缓存中删除
      queryClient.removeQueries({
        queryKey: ['chapterSummary', variables.bookId, variables.chapterIndex],
      });
      // 使总结列表失效
      queryClient.invalidateQueries({ queryKey: ['chapterSummaries', variables.bookId] });
    },
  });
}

/**
 * 检查 AI 配置
 */
export function useAIConfig() {
  return useQuery({
    queryKey: ['aiConfig'],
    queryFn: async () => {
      console.log('[useAIConfig] Checking AI config...');
      try {
        const config = await window.electronAPI.ai.checkConfig();
        console.log('[useAIConfig] AI config result:', config);
        return config;
      } catch (error) {
        // 出错时返回无效配置，而不是抛出错误
        console.warn('[useAIConfig] Failed to check AI config:', error);
        return { valid: false, error: getErrorMessage(error) };
      }
    },
    staleTime: 5000, // 5秒
    retry: false, // 不重试，避免多次错误
  });
}

/**
 * 从错误对象中提取友好的错误消息
 */
function getErrorMessage(error: unknown): string {
  if (!error) {
    return '未知错误';
  }

  // 如果是 Error 对象
  if (error instanceof Error) {
    return error.message || '发生了一个错误';
  }

  // 如果是字符串
  if (typeof error === 'string') {
    return error;
  }

  // 如果是对象，尝试提取消息
  if (typeof error === 'object') {
    const err = error as any;
    if (err.message) {
      return err.message;
    }
    if (err.error) {
      return getErrorMessage(err.error);
    }
    if (err.msg) {
      return err.msg;
    }
  }

  // 其他情况，转换为字符串
  return String(error);
}
