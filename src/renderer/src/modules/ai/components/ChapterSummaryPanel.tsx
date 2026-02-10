/**
 * 章节总结面板组件
 */

import { useState } from 'react';
import {
  useChapterSummary,
  useGenerateSummary,
  useDeleteSummary,
  useAIConfig,
} from '../hooks/useChapterSummary';

interface ChapterSummaryPanelProps {
  bookId: string;
  chapterIndex: number;
  chapterTitle?: string;
  onClose?: () => void;
}

export function ChapterSummaryPanel({
  bookId,
  chapterIndex,
  chapterTitle,
  onClose,
}: ChapterSummaryPanelProps) {
  console.log('[ChapterSummaryPanel] Component mounted with props:', {
    bookId,
    chapterIndex,
    chapterTitle,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // 获取已有总结
  const { data: summary, isLoading } = useChapterSummary(bookId, chapterIndex);
  console.log('[ChapterSummaryPanel] Query state:', { summary, isLoading });

  // AI 配置检查
  const { data: aiConfig } = useAIConfig();
  console.log('[ChapterSummaryPanel] AI Config:', aiConfig);

  // 生成总结
  const generateMutation = useGenerateSummary();

  // 删除总结
  const deleteMutation = useDeleteSummary();

  const handleGenerate = async (forceRefresh = false) => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        bookId,
        chapterIndex,
        forceRefresh,
      });
    } catch (error) {
      console.error('生成总结失败:', error);
      alert(`生成总结失败: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个总结吗？')) return;

    try {
      await deleteMutation.mutateAsync({ bookId, chapterIndex });
    } catch (error) {
      console.error('删除总结失败:', error);
      alert(`删除总结失败: ${error}`);
    }
  };

  // 渲染调试日志
  console.log('[ChapterSummaryPanel] Render state:', {
    aiConfig,
    aiConfigValid: aiConfig?.valid,
    summary,
    isLoading,
    isGenerating,
  });

  // 渲染配置错误
  if (aiConfig && !aiConfig.valid) {
    console.log('[ChapterSummaryPanel] Rendering config error view');
    return (
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-lg p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            章节总结
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ AI 功能未配置
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-2">
            {aiConfig.error}
          </p>
          <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-2">
            请在设置中配置 AI 提供商和 API Key
          </p>
        </div>
      </div>
    );
  }

  console.log('[ChapterSummaryPanel] Rendering main panel');
  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-lg p-6 overflow-y-auto z-50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          章节总结
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* 章节信息 */}
      {chapterTitle && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">第 {chapterIndex + 1} 章</p>
          <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
            {chapterTitle}
          </p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* 生成中状态 */}
      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                正在生成总结...
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                这可能需要几十秒，请耐心等待
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 总结内容 */}
      {summary && !isGenerating && (
        <div className="mb-4">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {summary.summary}
            </p>
          </div>

          {/* 元信息 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              生成模型: {summary.model}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              生成时间: {new Date(summary.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              重新生成
            </button>
            <button
              onClick={handleDelete}
              disabled={isGenerating}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      )}

      {/* 未生成状态 */}
      {!summary && !isLoading && !isGenerating && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            还没有生成章节总结
          </p>
          <button
            onClick={() => handleGenerate()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            生成总结
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {(generateMutation.isError || deleteMutation.isError) && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">
            {generateMutation.error?.toString() || deleteMutation.error?.toString()}
          </p>
        </div>
      )}
    </div>
  );
}
