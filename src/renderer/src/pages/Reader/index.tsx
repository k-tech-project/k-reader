/**
 * 阅读器页面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import EpubViewer, { type EpubViewerRef } from '../../modules/reader/components/EpubViewer';
import { useElectronAPI } from '../../hooks/useElectronAPI';
import type { ReaderLocation } from '../../modules/reader/services/EpubReader';
import type { ReaderTheme } from '../../modules/reader/types/reader.types';
import { PRESET_THEMES } from '../../modules/reader/types/reader.types';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Settings, Type, Palette, Bookmark } from '../../utils/icons';
import { toast } from '../../components/Toast';

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const api = useElectronAPI();
  const viewerRef = useRef<EpubViewerRef>(null);

  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'bookmarks'>('toc'); // 侧边栏标签页
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<{ href: string; title: string } | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [currentCfi, setCurrentCfi] = useState<string>('');

  // 阅读器设置
  const [fontSize, setFontSize] = useState(16);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>(PRESET_THEMES.light);

  // 获取书签列表
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ['bookmarks', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: 'bookmark' });
    },
    enabled: !!bookId,
  });

  // 获取书籍信息
  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      return await api.book.get(bookId);
    },
    enabled: !!bookId,
  });

  // 获取阅读进度
  const { data: progress } = useQuery({
    queryKey: ['progress', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      return await api.progress.get(bookId);
    },
    enabled: !!bookId,
  });

  // 返回书库
  const handleBack = () => {
    navigate('/library');
  };

  // 翻页控制
  const handlePrev = () => {
    viewerRef.current?.prev();
  };

  const handleNext = () => {
    viewerRef.current?.next();
  };

  // 位置变化 - 自动保存进度
  const handleLocationChange = async (location: ReaderLocation) => {
    const progress = location.start.percentage;
    setCurrentProgress(progress);
    setCurrentCfi(location.start.cfi);

    // 自动保存进度（防抖，避免频繁写入）
    if (bookId) {
      await api.progress.save({
        bookId,
        currentCFI: location.start.cfi,
        progressPercentage: progress,
      });
    }
  };

  // 添加书签
  const handleAddBookmark = async () => {
    if (!bookId || !currentCfi) {
      toast.warning('无法添加书签');
      return;
    }

    try {
      await api.annotation.create({
        bookId,
        type: 'bookmark',
        cfi: currentCfi,
        chapterTitle: currentChapter?.title || '未知章节',
        chapterIndex: 0,
      });

      toast.success('书签已添加');
      refetchBookmarks();
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      toast.error('添加书签失败');
    }
  };

  // 删除书签
  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await api.annotation.delete(bookmarkId);
      toast.success('书签已删除');
      refetchBookmarks();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      toast.error('删除书签失败');
    }
  };

  // 跳转到书签
  const handleGotoBookmark = (cfi: string) => {
    viewerRef.current?.goto(cfi);
    setShowToc(false);
  };

  // 章节变化
  const handleChapterChange = (chapter: { href: string; title: string }) => {
    setCurrentChapter(chapter);
  };

  // 进度变化
  const handleProgressChange = async (_progress: number) => {
    // 进度变化已在 handleLocationChange 中处理
  };

  // 跳转到章节
  const handleChapterClick = (href: string) => {
    viewerRef.current?.gotoChapter(href);
    setShowToc(false);
  };

  // 目录加载完成
  const handleTOCLoaded = (toc: any[]) => {
    setToc(toc);
  };

  // 字体增大
  const handleIncreaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 32);
    setFontSize(newSize);
    viewerRef.current?.setFontSize(newSize);
  };

  // 字体减小
  const handleDecreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    viewerRef.current?.setFontSize(newSize);
  };

  // 切换主题
  const handleThemeChange = (theme: ReaderTheme) => {
    setCurrentTheme(theme);
    viewerRef.current?.setTheme(theme);
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在设置面板中打开，不处理快捷键
      if (showSettings) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'Escape') {
        if (showToc) {
          setShowToc(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else {
          handleBack();
        }
      } else if (e.key === 't' || e.key === 'T') {
        setShowToc(!showToc);
        setSidebarTab('toc');
      } else if (e.key === 'b' || e.key === 'B') {
        handleAddBookmark();
      } else if (e.key === 's' || e.key === 'S') {
        setShowSettings(!showSettings);
      } else if (e.key === '=' || e.key === '+') {
        handleIncreaseFontSize();
      } else if (e.key === '-' || e.key === '_') {
        handleDecreaseFontSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToc, showSettings]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700">书籍不存在</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            返回书库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
              {book.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 进度显示 */}
          <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
            {currentProgress.toFixed(1)}%
          </div>

          {/* 添加书签按钮 */}
          <button
            onClick={handleAddBookmark}
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="添加书签 (B)"
          >
            <Bookmark className="h-5 w-5" />
          </button>

          {/* 目录按钮 */}
          <button
            onClick={() => setShowToc(!showToc)}
            className={`rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              showToc ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            title="目录 (T)"
          >
            <List className="h-5 w-5" />
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              showSettings ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            title="设置 (S)"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 目录/书签 */}
        {showToc && (
          <div className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-y-auto flex flex-col">
            <div className="sticky top-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="flex">
                <button
                  onClick={() => setSidebarTab('toc')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    sidebarTab === 'toc'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  目录
                </button>
                <button
                  onClick={() => setSidebarTab('bookmarks')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    sidebarTab === 'bookmarks'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  书签 ({bookmarks.length})
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {/* 目录视图 */}
              {sidebarTab === 'toc' && (
                <>
                  {toc.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">目录加载中...</p>
                  ) : (
                    <TOCTree items={toc} onChapterClick={handleChapterClick} />
                  )}
                </>
              )}
              
              {/* 书签视图 */}
              {sidebarTab === 'bookmarks' && (
                <>
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">还没有书签</p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="flex items-start rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <button
                            onClick={() => handleGotoBookmark(bookmark.cfi)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <Bookmark className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                {bookmark.chapterTitle}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(bookmark.createdAt).toLocaleString('zh-CN')}
                            </p>
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="ml-2 rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="删除书签"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 阅读器区域 */}
        <div className="flex-1 overflow-hidden">
          {book && (
            <EpubViewer
              ref={viewerRef}
              book={book}
              initialCfi={progress?.currentCFI}
              onLocationChange={handleLocationChange}
              onChapterChange={handleChapterChange}
              onProgressChange={handleProgressChange}
              onTOCLoaded={handleTOCLoaded}
              className="h-full w-full"
            />
          )}
        </div>

        {/* 设置侧边栏 */}
        {showSettings && (
          <div className="w-80 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">阅读设置</h3>
            </div>
            <div className="p-4 space-y-6">
              {/* 字体设置 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Type className="mr-2 h-4 w-4" />
                  字体大小
                </h4>
                <div className="flex items-center justify-between space-x-2">
                  <button
                    onClick={handleDecreaseFontSize}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="减小字体 (-)"
                  >
                    -
                  </button>
                  <span className="text-sm text-gray-900 dark:text-white min-w-[3rem] text-center">
                    {fontSize}
                  </span>
                  <button
                    onClick={handleIncreaseFontSize}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="增大字体 (+)"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 主题设置 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Palette className="mr-2 h-4 w-4" />
                  阅读主题
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(PRESET_THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme)}
                      className={`rounded-lg border p-2 text-xs font-medium transition-all ${
                        currentTheme.id === theme.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: theme.id === 'light' ? undefined : theme.background,
                        color: theme.id === 'light' ? undefined : theme.color,
                      }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 快捷键说明 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  快捷键
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>翻页</span>
                    <span className="font-mono">←/→</span>
                  </div>
                  <div className="flex justify-between">
                    <span>目录</span>
                    <span className="font-mono">T</span>
                  </div>
                  <div className="flex justify-between">
                    <span>设置</span>
                    <span className="font-mono">S</span>
                  </div>
                  <div className="flex justify-between">
                    <span>字号</span>
                    <span className="font-mono">+/-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>返回</span>
                    <span className="font-mono">Esc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrev}
            className="flex items-center space-x-2 rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="上一页 (←)"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>上一页</span>
          </button>

          {/* 进度条 */}
          <div className="flex-1 max-w-md mx-4">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="下一页 (→)"
          >
            <span>下一页</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 当前章节 */}
        {currentChapter && (
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-xs">
            {currentChapter.title}
          </div>
        )}
      </div>
    </div>
  );
}

// 目录树组件
function TOCTree({
  items,
  onChapterClick,
  level = 0
}: {
  items: any[];
  onChapterClick: (href: string) => void;
  level?: number;
}) {
  return (
    <ul className={level > 0 ? 'ml-4' : ''}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            onClick={() => onChapterClick(item.href)}
            className="w-full text-left text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 block transition-colors"
          >
            {item.label}
          </button>
          {item.children && item.children.length > 0 && (
            <TOCTree items={item.children} onChapterClick={onChapterClick} level={level + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export default Reader;
