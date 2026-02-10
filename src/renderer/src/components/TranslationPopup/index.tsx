/**
 * 翻译弹窗组件
 * 用于显示选中文本的翻译结果
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import { toast } from '../Toast';
import { X, Plus, BookOpen, Volume2 } from '../../utils/icons';
import type { WordBookEntry } from '@shared/types';

interface TranslationPopupProps {
  selectedText: string;
  position: { x: number; y: number };
  bookId?: string;
  onClose: () => void;
}

export function TranslationPopup({ selectedText, position, bookId, onClose }: TranslationPopupProps) {
  const api = useElectronAPI();
  const queryClient = useQueryClient();
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);

  // 简单的翻译实现（使用免费API或本地词典）
  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      // 这里使用简单的翻译逻辑
      // 实际项目中可以集成有道、百度等翻译API
      const translated = await translateText(selectedText);
      setTranslation(translated);
    } catch (error) {
      console.error('Translation failed:', error);
      toast.error('翻译失败，请重试');
    } finally {
      setIsTranslating(false);
    }
  };

  // 添加到生词本
  const addMutation = useMutation({
    mutationFn: async () => {
      return await api.wordbook.add({
        word: selectedText,
        translation: translation,
        language: detectLanguage(selectedText),
        bookId,
        context: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordbook'] });
      toast.success('已添加到生词本');
    },
    onError: (error) => {
      console.error('Failed to add to wordbook:', error);
      toast.error('添加到生词本失败');
    },
  });

  // 简单的语言检测
  const detectLanguage = (text: string): string => {
    // 简单的检测逻辑
    const chineseRegex = /[\u4e00-\u9fa5]/;
    return chineseRegex.test(text) ? 'zh' : 'en';
  };

  // 简单的翻译函数
  const translateText = async (text: string): Promise<string> => {
    // 这里是一个占位实现
    // 实际项目中需要调用真实的翻译API
    const lang = detectLanguage(text);

    if (lang === 'en') {
      // 英文转中文（简单示例）
      return `[翻译] ${text}`;
    } else {
      // 中文转英文（简单示例）
      return `[Translation] ${text}`;
    }
  };

  // 检查是否已添加到生词本
  const { data: existingEntry } = useQuery({
    queryKey: ['wordbook', 'check', selectedText],
    queryFn: async () => {
      const all = await api.wordbook.getAll();
      return all.find((e) => e.word.toLowerCase() === selectedText.toLowerCase());
    },
    enabled: !!selectedText,
  });

  // 自动翻译
  useState(() => {
    if (selectedText && !translation) {
      handleTranslate();
    }
  });

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: '320px',
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">翻译</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 原文 */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
          {selectedText}
        </p>
      </div>

      {/* 译文 */}
      <div className="px-4 py-3">
        {isTranslating ? (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : translation ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {translation}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">点击翻译按钮获取译文</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDefinition(!showDefinition)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {showDefinition ? '隐藏词典' : '查看词典'}
          </button>

          {!existingEntry ? (
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !translation}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>生词本</span>
            </button>
          ) : (
            <span className="text-xs text-green-600 dark:text-green-400">已在生词本</span>
          )}
        </div>

        {/* 朗读按钮 */}
        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(selectedText);
              utterance.lang = detectLanguage(selectedText) === 'zh' ? 'zh-CN' : 'en-US';
              speechSynthesis.speak(utterance);
            }
          }}
          className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          title="朗读"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      {/* 词典视图 */}
      {showDefinition && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            词典释义
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                词性：
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                {detectLanguage(selectedText) === 'zh' ? '名词' : 'Noun'}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                释义：
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {translation || '暂无释义'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 书籍来源 */}
      {bookId && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            来自当前书籍
          </p>
        </div>
      )}
    </div>
  );
}

export default TranslationPopup;
