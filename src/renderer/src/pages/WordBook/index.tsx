/**
 * 生词本页面
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { Plus, Search, X, Trash2, Edit, BookOpen, Volume2, ArrowLeft } from '../../utils/icons';
import { toast } from '../../components/Toast';
import { modal } from '../../components/Modal';
import type { WordBookEntry } from '@shared/types';

export function WordBook() {
  const navigate = useNavigate();
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<WordBookEntry | null>(null);

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['wordbook', 'stats'],
    queryFn: () => api.wordbook.getStats(),
  });

  // 获取生词列表
  const { data: words = [], isLoading } = useQuery({
    queryKey: ['wordbook', 'all', selectedLanguage],
    queryFn: async () => {
      if (searchQuery.trim()) {
        return await api.wordbook.search(searchQuery, {
          language: selectedLanguage === 'all' ? undefined : selectedLanguage,
        });
      }
      return await api.wordbook.getAll({
        language: selectedLanguage === 'all' ? undefined : selectedLanguage,
      });
    },
  });

  // 删除生词
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.wordbook.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordbook'] });
      toast.success('已删除');
    },
    onError: () => {
      toast.error('删除失败');
    },
  });

  // 更新生词
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { translation?: string; definition?: string; context?: string } }) => {
      return await api.wordbook.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordbook'] });
      toast.success('已更新');
      setEditingEntry(null);
    },
    onError: () => {
      toast.error('更新失败');
    },
  });

  // 删除确认
  const handleDelete = async (entry: WordBookEntry) => {
    const confirmed = await modal.confirm({
      title: '删除生词',
      content: (
        <div>
          <p className="mb-2">确定要删除生词 "{entry.word}" 吗？</p>
        </div>
      ),
    });

    if (confirmed) {
      deleteMutation.mutate(entry.id);
    }
  };

  // 朗读
  const handleSpeak = (word: string, language: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
      speechSynthesis.speak(utterance);
    } else {
      toast.error('您的浏览器不支持语音朗读');
    }
  };

  // 获取语言标签
  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      en: '英语',
      zh: '中文',
      ja: '日语',
      ko: '韩语',
      fr: '法语',
      de: '德语',
      es: '西班牙语',
    };
    return labels[lang] || lang;
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部栏 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">生词本</h1>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400">总词汇量：</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats?.totalCount || 0}
            </span>
          </div>
          {stats?.byLanguage && Object.keys(stats.byLanguage).length > 0 && (
            <div className="flex items-center space-x-3">
              {Object.entries(stats.byLanguage).map(([lang, count]) => (
                <span
                  key={lang}
                  className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium dark:bg-blue-900/20 dark:text-blue-400"
                >
                  {getLanguageLabel(lang)}: {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 工具栏 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索生词..."
              className="w-full pl-10 pr-8 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 语言筛选 */}
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">语言：</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">全部</option>
              <option value="en">英语</option>
              <option value="zh">中文</option>
              <option value="ja">日语</option>
            </select>
          </div>
        </div>
      </div>

      {/* 生词列表 */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : words.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 dark:text-gray-500">
                {searchQuery ? '没有找到匹配的生词' : '生词本是空的，在阅读时选择文本即可添加'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((entry: WordBookEntry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                {/* 单词和操作 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {entry.word}
                    </h3>
                    {entry.language && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {getLanguageLabel(entry.language)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleSpeak(entry.word, entry.language)}
                      className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="朗读"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-blue-400 transition-colors"
                      title="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 翻译 */}
                {entry.translation && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">翻译</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {entry.translation}
                    </p>
                  </div>
                )}

                {/* 释义 */}
                {entry.definition && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">释义</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {entry.definition}
                    </p>
                  </div>
                )}

                {/* 上下文 */}
                {entry.context && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">上下文</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {entry.context}
                    </p>
                  </div>
                )}

                {/* 书籍来源 */}
                {entry.bookId && (
                  <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                    <BookOpen className="h-3 w-3 mr-1" />
                    来自书籍
                  </div>
                )}

                {/* 添加时间 */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {entry.createdAt && new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                编辑生词
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  单词
                </label>
                <input
                  type="text"
                  value={editingEntry.word}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  翻译
                </label>
                <textarea
                  value={editingEntry.translation}
                  onChange={(e) => setEditingEntry({ ...editingEntry, translation: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  释义
                </label>
                <textarea
                  value={editingEntry.definition}
                  onChange={(e) => setEditingEntry({ ...editingEntry, definition: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => updateMutation.mutate({
                    id: editingEntry.id,
                    updates: {
                      translation: editingEntry.translation,
                      definition: editingEntry.definition,
                    },
                  })}
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WordBook;
