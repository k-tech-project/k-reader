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
import { PRESET_THEMES, PAGE_ANIMATIONS, type PageAnimationType } from '../../modules/reader/types/reader.types';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Settings, Type, Palette, Bookmark, MapPin, Search, X, Maximize } from '../../utils/icons';
import { toast } from '../../components/Toast';
import { modal } from '../../components/Modal';

export function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const api = useElectronAPI();
  const viewerRef = useRef<EpubViewerRef>(null);

  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'bookmarks' | 'highlights'>('toc'); // 侧边栏标签页
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<{ href: string; title: string } | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [currentCfi, setCurrentCfi] = useState<string>('');

  // 搜索相关状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ cfi: string; excerpt: string; chapter: string }>>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // 批注相关状态
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const [selectionRange, setSelectionRange] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [highlightColor, setHighlightColor] = useState<string>('yellow');
  const [editingHighlight, setEditingHighlight] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // 阅读器设置
  const [fontSize, setFontSize] = useState(16);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>(PRESET_THEMES.light);
  const [pageAnimation, setPageAnimation] = useState<PageAnimationType>('fade');

  // 获取书签列表
  const { data: bookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ['bookmarks', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: 'bookmark' });
    },
    enabled: !!bookId,
  });

  // 获取高亮批注列表
  const { data: highlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ['highlights', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      return await api.annotation.getAll({ bookId, type: 'highlight' });
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
    console.log('[Reader] handlePrev called, viewerRef.current:', !!viewerRef.current);
    if (!viewerRef.current) {
      console.error('[Reader] viewerRef.current is null!');
      return;
    }
    viewerRef.current?.prev();
  };

  const handleNext = () => {
    console.log('[Reader] handleNext called, viewerRef.current:', !!viewerRef.current);
    if (!viewerRef.current) {
      console.error('[Reader] viewerRef.current is null!');
      return;
    }
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

  // 删除高亮批注
  const handleDeleteHighlight = async (highlightId: string, cfi: string) => {
    try {
      // 从阅读器中移除高亮显示
      viewerRef.current?.removeHighlight(cfi);
      // 从数据库中删除
      await api.annotation.delete(highlightId);
      toast.success('高亮已删除');
      refetchHighlights();
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      toast.error('删除高亮失败');
    }
  };

  // 打开编辑批注对话框
  const handleEditHighlight = (highlight: any) => {
    setEditingHighlight(highlight);
    setShowEditDialog(true);
  };

  // 保存批注编辑
  const handleSaveEdit = async () => {
    if (!editingHighlight) return;

    try {
      await api.annotation.update(editingHighlight.id, {
        color: editingHighlight.color,
        note: editingHighlight.note,
      });

      // 如果颜色改变了，需要更新阅读器中的高亮
      const oldHighlight = highlights.find(h => h.id === editingHighlight.id);
      if (oldHighlight && oldHighlight.color !== editingHighlight.color) {
        // 移除旧高亮
        viewerRef.current?.removeHighlight(editingHighlight.cfi);
        // 添加新高亮
        viewerRef.current?.addHighlight(editingHighlight.cfi, editingHighlight.color);
      }

      toast.success('批注已更新');
      setShowEditDialog(false);
      setEditingHighlight(null);
      refetchHighlights();
    } catch (error) {
      console.error('Failed to update highlight:', error);
      toast.error('更新批注失败');
    }
  };

  // 快速跳转
  const handleQuickJump = () => {
    modal.custom({
      title: '快速跳转',
      size: 'sm',
      content: (
        <div className="space-y-4">
          {/* 跳转方式选择 */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleJumpByProgress()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              按进度跳转
            </button>
            <button
              onClick={() => handleJumpByChapter()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              按章节跳转
            </button>
          </div>
        </div>
      ),
      showFooter: false,
    });
  };

  // 按进度跳转
  const handleJumpByProgress = () => {
    modal.custom({
      title: '按进度跳转',
      size: 'sm',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            输入 0-100 之间的百分比
          </p>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={currentProgress.toFixed(1)}
            id="jump-progress-input"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="例如: 50.5"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                const value = parseFloat(input.value);
                if (isNaN(value) || value < 0 || value > 100) {
                  toast.error('请输入 0-100 之间的有效数字');
                  return;
                }
                handleJumpToProgress(value);
                modal.close();
              }
            }}
          />
          <div className="flex space-x-2">
            <button
              onClick={() => modal.close()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                const input = document.getElementById('jump-progress-input') as HTMLInputElement;
                if (!input) return;
                const value = parseFloat(input.value);
                if (isNaN(value) || value < 0 || value > 100) {
                  toast.error('请输入 0-100 之间的有效数字');
                  return;
                }
                handleJumpToProgress(value);
                modal.close();
              }}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              跳转
            </button>
          </div>
        </div>
      ),
      showFooter: false,
    });
  };

  // 按章节跳转
  const handleJumpByChapter = () => {
    const flatToc = flattenTocItems(toc);

    modal.custom({
      title: '按章节跳转',
      size: 'lg',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            选择要跳转的章节
          </p>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {flatToc.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => {
                  handleChapterClick(item.href);
                  modal.close();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => modal.close()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      ),
      showFooter: false,
    });
  };

  // 跳转到指定进度
  const handleJumpToProgress = (progress: number) => {
    if (!viewerRef.current) return;
    try {
      viewerRef.current.gotoProgress(progress);
      toast.success(`已跳转到 ${progress.toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to jump to progress:', error);
      toast.error('跳转失败');
    }
  };

  // 扁平化目录项
  const flattenTocItems = (items: any[]): any[] => {
    const result: any[] = [];
    function traverse(items: any[]) {
      for (const item of items) {
        result.push(item);
        if (item.children) {
          traverse(item.children);
        }
      }
    }
    traverse(items);
    return result;
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

  // 打开搜索面板
  const handleOpenSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    try {
      const results = await viewerRef.current?.search(searchQuery) || [];
      setSearchResults(results);
      setCurrentResultIndex(0);

      if (results.length === 0) {
        toast.info('未找到匹配结果');
      } else {
        toast.success(`找到 ${results.length} 个结果`);
        // 高亮第一个结果
        if (results.length > 0) {
          viewerRef.current?.highlightSearch(searchQuery);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  // 跳转到搜索结果
  const handleGotoResult = (index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    setCurrentResultIndex(index);

    const result = searchResults[index];
    // 从 CFI 中提取章节 href
    const chapterHref = result.cfi.split('[')[0];
    viewerRef.current?.gotoChapter(chapterHref);
    setShowSearch(false);
  };

  // 上一个结果
  const handlePrevResult = () => {
    if (searchResults.length === 0) return;
    const newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
    handleGotoResult(newIndex);
  };

  // 下一个结果
  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    const newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
    handleGotoResult(newIndex);
  };

  // 关闭搜索
  const handleCloseSearch = () => {
    setShowSearch(false);
    viewerRef.current?.clearHighlight();
    setSearchQuery('');
    setSearchResults([]);
  };

  // 进入/退出全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success('已进入全屏模式，按 F11 或 ESC 退出');
      }).catch((err) => {
        console.error('Failed to enter fullscreen:', err);
        toast.error('无法进入全屏模式');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 全屏模式下鼠标悬停显示控制栏
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      // 检查鼠标是否在顶部或底部区域
      const isInTopArea = e.clientY < 100;
      const isInBottomArea = e.clientY > window.innerHeight - 100;

      if (isInTopArea || isInBottomArea) {
        setShowControls(true);
        // 清除之前的定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        // 3秒后隐藏控制栏
        timeoutId = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const handleMouseLeave = () => {
      setShowControls(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFullscreen]);

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString();
      setSelectedText(text);
      const cfi = viewerRef.current?.getSelectionCFI();
      if (cfi) {
        setSelectionRange(cfi);
        setShowAnnotationMenu(true);
      }
    }
  };

  // 添加高亮批注
  const handleAddHighlight = async (color: string) => {
    if (!selectionRange || !bookId) return;

    try {
      // 添加高亮显示
      viewerRef.current?.addHighlight(selectionRange, color);

      // 保存到数据库
      await api.annotation.create({
        bookId,
        type: 'highlight',
        cfi: selectionRange,
        text: selectedText,
        color,
        chapterTitle: currentChapter?.title || '未知章节',
        chapterIndex: 0,
      });

      toast.success('高亮已添加');
      clearAnnotation();
    } catch (error) {
      console.error('Failed to add highlight:', error);
      toast.error('添加高亮失败');
    }
  };

  // 清除选择状态
  const clearAnnotation = () => {
    setShowAnnotationMenu(false);
    setSelectionRange(null);
    setSelectedText('');
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  // 监听文本选择
  useEffect(() => {
    const handleSelection = () => {
      // 延迟处理，确保选择完成
      setTimeout(handleTextSelection, 100);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [currentChapter]);

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

  // 切换翻页动画
  const handlePageAnimationChange = (animation: PageAnimationType) => {
    setPageAnimation(animation);
    viewerRef.current?.setPageAnimation(animation);
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在设置面板中打开，不处理快捷键
      if (showSettings) return;

      // Ctrl+F 或 Cmd+F 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleOpenSearch();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (showSearch) {
          handleCloseSearch();
        } else if (showToc) {
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
  }, [showToc, showSettings, showSearch]);

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
      <div className={`flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 transition-transform duration-300 ${
        isFullscreen && !showControls ? '-translate-y-full' : ''
      }`}>
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

          {/* 搜索按钮 */}
          <button
            onClick={handleOpenSearch}
            className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="搜索 (Ctrl+F)"
          >
            <Search className="h-5 w-5" />
          </button>

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

          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className={`rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isFullscreen ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            title="全屏 (F11)"
          >
            <Maximize className="h-5 w-5" />
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
                <button
                  onClick={() => setSidebarTab('highlights')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    sidebarTab === 'highlights'
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  高亮 ({highlights.length})
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

              {/* 高亮批注视图 */}
              {sidebarTab === 'highlights' && (
                <>
                  {highlights.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">还没有高亮批注</p>
                  ) : (
                    <div className="space-y-2">
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          className="flex items-start rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <button
                            onClick={() => viewerRef.current?.goto(highlight.cfi)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {/* 颜色指示器 */}
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: highlight.color || 'yellow' }}
                                title={highlight.color || 'yellow'}
                              />
                              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                                {highlight.text?.substring(0, 50)}{highlight.text && highlight.text.length > 50 ? '...' : ''}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {highlight.chapterTitle || '未知位置'}
                            </p>
                          </button>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditHighlight(highlight)}
                              className="rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="编辑批注"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteHighlight(highlight.id, highlight.cfi)}
                              className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="删除高亮"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
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
              initialHighlights={highlights.map(h => ({ cfi: h.cfi, color: h.color || 'yellow' }))}
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

              {/* 翻页动画设置 */}
              <div>
                <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  翻页动画
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PAGE_ANIMATIONS).map(([key, { name, description }]) => (
                    <button
                      key={key}
                      onClick={() => handlePageAnimationChange(key as PageAnimationType)}
                      className={`rounded-lg border p-2 text-xs transition-all ${
                        pageAnimation === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      title={description}
                    >
                      {name}
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

        {/* 搜索面板 */}
        {showSearch && (
          <div className="absolute top-0 right-0 w-96 h-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 z-20 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">搜索</h3>
              <button
                onClick={handleCloseSearch}
                className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 搜索输入框 */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="输入搜索关键词..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </button>
              </div>

              {/* 搜索结果统计 */}
              {searchResults.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    找到 {searchResults.length} 个结果
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevResult}
                      className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                      disabled={searchResults.length === 0}
                      title="上一个结果"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-gray-900 dark:text-white min-w-[3rem] text-center">
                      {currentResultIndex + 1} / {searchResults.length}
                    </span>
                    <button
                      onClick={handleNextResult}
                      className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
                      disabled={searchResults.length === 0}
                      title="下一个结果"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 搜索结果列表 */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p className="text-sm text-gray-500 text-center py-8">未找到匹配结果</p>
                )}
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleGotoResult(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      index === currentResultIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {result.chapter}
                      </p>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    <p
                      className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 批注菜单 */}
        {showAnnotationMenu && (
          <div
            className="absolute z-30 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2"
            style={{
              // 定位到选中文本附近
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                添加高亮批注
              </p>
              {/* 颜色选择 */}
              <div className="flex space-x-1 px-2">
                {[
                  { color: 'yellow', name: '黄色', bg: 'bg-yellow-300' },
                  { color: 'green', name: '绿色', bg: 'bg-green-300' },
                  { color: 'blue', name: '蓝色', bg: 'bg-blue-300' },
                  { color: 'pink', name: '粉色', bg: 'bg-pink-300' },
                  { color: 'purple', name: '紫色', bg: 'bg-purple-300' },
                ].map(({ color, name, bg }) => (
                  <button
                    key={color}
                    onClick={() => handleAddHighlight(color)}
                    className={`w-8 h-8 rounded ${bg} hover:opacity-80 transition-opacity`}
                    title={name}
                  />
                ))}
              </div>
              {/* 选中的文本预览 */}
              <div className="max-w-xs px-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  "{selectedText}"
                </p>
              </div>
              {/* 取消按钮 */}
              <button
                onClick={clearAnnotation}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className={`flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 transition-transform duration-300 ${
        isFullscreen && !showControls ? 'translate-y-full' : ''
      }`}>
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
          <div className="flex-1 max-w-md mx-4 flex items-center space-x-2">
            <button
              onClick={handleQuickJump}
              className="rounded p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="快速跳转"
            >
              <MapPin className="h-4 w-4" />
            </button>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex-1">
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

      {/* 批注编辑对话框 */}
      {showEditDialog && editingHighlight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">编辑批注</h3>
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingHighlight(null);
                }}
                className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* 引用文本 */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  "{editingHighlight.text}"
                </p>
              </div>

              {/* 颜色选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  高亮颜色
                </label>
                <div className="flex space-x-3">
                  {['yellow', 'green', 'blue', 'pink', 'purple'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingHighlight({ ...editingHighlight, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        editingHighlight.color === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* 笔记 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  笔记（可选）
                </label>
                <textarea
                  value={editingHighlight.note || ''}
                  onChange={(e) => setEditingHighlight({ ...editingHighlight, note: e.target.value })}
                  placeholder="添加笔记..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* 位置信息 */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {editingHighlight.chapterTitle || '未知位置'}
              </div>
            </div>
            <div className="flex space-x-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingHighlight(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
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
