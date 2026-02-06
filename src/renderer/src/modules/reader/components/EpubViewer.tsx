/**
 * EPUB 阅读器组件
 * 用于渲染 EPUB 内容并提供阅读控制
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { createEpubReader, type ReaderLocation } from '../services/EpubReader';
import type { Book } from '@shared/types';
import type { ReaderSettings, TOCItem, ReaderTheme, PageAnimationType } from '../types/reader.types';

export interface EpubViewerRef {
  prev: () => void;
  next: () => void;
  goto: (cfi: string) => void;
  gotoChapter: (href: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: ReaderTheme) => void;
  getProgress: () => number;
  getCurrentLocation: () => ReaderLocation | null;
  gotoProgress: (progress: number) => void;
  search: (query: string) => Promise<Array<{ cfi: string; excerpt: string; chapter: string }>>;
  highlightSearch: (query: string) => void;
  clearHighlight: () => void;
  setPageAnimation: (animation: PageAnimationType) => void;
  getSelectionCFI: () => string | null;
  addHighlight: (cfiRange: string, color?: string) => void;
  removeHighlight: (cfiRange: string) => void;
  getHighlights: () => string[];
}

interface EpubViewerProps {
  book: Book;
  initialCfi?: string;
  settings?: Partial<ReaderSettings>;
  onLocationChange?: (location: ReaderLocation) => void;
  onChapterChange?: (chapter: { href: string; title: string }) => void;
  onProgressChange?: (progress: number) => void;
  onTOCLoaded?: (toc: TOCItem[]) => void;
  initialHighlights?: Array<{ cfi: string; color: string }>;
  className?: string;
}

export const EpubViewer = forwardRef<EpubViewerRef, EpubViewerProps>(function EpubViewer({
  book,
  initialCfi,
  settings,
  onLocationChange,
  onChapterChange,
  onProgressChange,
  onTOCLoaded,
  initialHighlights = [],
  className = '',
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReturnType<typeof getEpubReader> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<ReaderLocation | null>(null);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  // 动画相关状态
  const [pageAnimation, setPageAnimation] = useState<PageAnimationType>('fade');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);

  // 暴露方法给父组件
  // 注意：不设置依赖项，这样每次调用都会访问最新的 readerRef.current
  // 带动画的翻页方法
  const animatePageTurn = useCallback(async (direction: 'next' | 'prev', action: () => void | Promise<void>) => {
    if (isAnimating || pageAnimation === 'none') {
      await action();
      return;
    }

    setIsAnimating(true);
    setAnimationDirection(direction);

    // 等待动画开始
    await new Promise(resolve => setTimeout(resolve, 50));

    // 执行翻页动作
    await action();

    // 等待动画完成
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 300);
  }, [isAnimating, pageAnimation]);

  // 暴露方法给父组件
  // 注意：不设置依赖项，这样每次调用都会访问最新的 readerRef.current
  useImperativeHandle(ref, () => ({
    prev: () => {
      console.log('[EpubViewer] prev called, readerRef.current:', !!readerRef.current, 'isReady:', isReady);
      const reader = readerRef.current;
      if (!reader) {
        console.error('[EpubViewer] readerRef.current is null!');
        return;
      }
      console.log('[EpubViewer] Calling prev on instance:', (reader as any).__instanceId);
      animatePageTurn('prev', () => reader.prev());
    },
    next: () => {
      console.log('[EpubViewer] next called, readerRef.current:', !!readerRef.current, 'isReady:', isReady);
      const reader = readerRef.current;
      if (!reader) {
        console.error('[EpubViewer] readerRef.current is null!');
        return;
      }
      console.log('[EpubViewer] Calling next on instance:', (reader as any).__instanceId);
      animatePageTurn('next', () => reader.next());
    },
    goto: (cfi: string) => {
      console.log('[EpubViewer] goto called:', cfi);
      const reader = readerRef.current;
      if (!reader) return;
      reader.goto(cfi);
    },
    gotoChapter: (href: string) => {
      console.log('[EpubViewer] gotoChapter called:', href);
      const reader = readerRef.current;
      if (!reader) return;
      reader.gotoChapter(href);
    },
    setFontSize: (size: number) => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.setFontSize(size);
    },
    setTheme: (theme: ReaderTheme) => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.setTheme(theme);
    },
    getProgress: () => {
      const reader = readerRef.current;
      if (!reader) return 0;
      return reader.getProgress();
    },
    getCurrentLocation: () => {
      return currentLocation;
    },
    gotoProgress: (progress: number) => {
      const reader = readerRef.current;
      if (!reader) return;
      // 简化的实现：使用当前目录信息来定位
      // 计算目标章节
      if (toc.length > 0) {
        const flatToc = flattenToc(toc);
        const targetIndex = Math.floor((progress / 100) * (flatToc.length - 1));
        const targetChapter = flatToc[targetIndex];
        if (targetChapter) {
          reader.gotoChapter(targetChapter.href);
        }
      }
    },
    search: async (query: string) => {
      const reader = readerRef.current;
      if (!reader) return [];
      return await reader.search(query);
    },
    highlightSearch: (query: string) => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.highlightSearch(query);
    },
    clearHighlight: () => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.clearHighlight();
    },
    setPageAnimation: (animation: PageAnimationType) => {
      setPageAnimation(animation);
    },
    getSelectionCFI: () => {
      const reader = readerRef.current;
      if (!reader) return null;
      return reader.getSelectionCFI();
    },
    addHighlight: (cfiRange: string, color?: string) => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.addHighlight(cfiRange, color);
    },
    removeHighlight: (cfiRange: string) => {
      const reader = readerRef.current;
      if (!reader) return;
      reader.removeHighlight(cfiRange);
    },
    getHighlights: () => {
      const reader = readerRef.current;
      if (!reader) return [];
      return reader.getHighlights();
    },
  }));

  // 初始化阅读器
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initReader = async () => {
      try {
        // 清空容器，确保没有旧的内容
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          console.log('[EpubViewer] Container cleared');
        }

        // 每次都创建新实例，避免单例问题
        const reader = createEpubReader();

        // 监听事件
        reader.on('ready', (data: { location?: ReaderLocation }) => {
          if (!mounted) return;
          console.log('[EpubViewer] ready event received, location:', data.location);
          setIsReady(true);
          if (data.location) {
            setCurrentLocation(data.location);
            setCanGoPrev(!data.location.atStart);
            setCanGoNext(!data.location.atEnd);
          }
        });

        reader.on('locationChanged', (location: ReaderLocation) => {
          if (!mounted) return;
          setCurrentLocation(location);
          setCanGoPrev(!location.atStart);
          setCanGoNext(!location.atEnd);

          // 通知父组件
          onLocationChange?.(location);
          onProgressChange?.(location.start.percentage);
        });

        reader.on('chapterChanged', (data: { href: string }) => {
          if (!mounted) return;
          // 查找章节标题
          const flatToc = flattenToc(toc);
          const chapter = flatToc.find(item => item.href === data.href);
          if (chapter) {
            onChapterChange?.({ href: data.href, title: chapter.label });
          }
        });

        // 初始化阅读器
        await reader.init({
          book,
          element: containerRef.current as HTMLElement,
          initialCfi,
          settings,
        });

        // 尽早暴露实例，避免目录加载阻塞翻页
        readerRef.current = reader;
        console.info('[EpubViewer] readerRef.current set, instance:', !!readerRef.current);

        // 获取目录
        try {
          const tableOfContents = await reader.getTOC();
          setToc(tableOfContents);
          console.info('[EpubViewer] TOC loaded, items:', tableOfContents.length);
          // 通知父组件目录已加载
          onTOCLoaded?.(tableOfContents);
        } catch (error) {
          console.warn('Failed to load TOC:', error);
        }
      } catch (error) {
        console.error('Failed to initialize EpubReader:', error);
      }
    };

    initReader();

    return () => {
      mounted = false;
      // 清理当前实例
      if (readerRef.current) {
        console.log('[EpubViewer] Cleanup: destroying reader instance');
        readerRef.current.destroy();
        readerRef.current = null;
      }
    };
    // 只在初始化时运行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  // 应用已保存的高亮
  useEffect(() => {
    if (!isReady || !readerRef.current || initialHighlights.length === 0) return;

    const reader = readerRef.current;
    console.log('[EpubViewer] Applying saved highlights:', initialHighlights.length);

    // 等待一小段时间确保渲染完成
    setTimeout(() => {
      for (const highlight of initialHighlights) {
        try {
          reader.addHighlight(highlight.cfi, highlight.color);
        } catch (error) {
          console.warn('[EpubViewer] Failed to apply highlight:', error);
        }
      }
      console.log('[EpubViewer] Highlights applied');
    }, 500);
  }, [isReady, initialHighlights]);

  const progress = currentLocation?.start.percentage ?? 0;
  const currentCfi = currentLocation?.start.cfi ?? '';

  const showDebug =
    process.env.NODE_ENV === 'development' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('reader:debug') === '1';

  // 计算动画样式
  const getAnimationStyles = () => {
    if (pageAnimation === 'none' || !isAnimating) {
      return {};
    }

    const baseTransition = 'transition-all duration-300 ease-in-out';

    switch (pageAnimation) {
      case 'fade':
        return {
          className: `${baseTransition} ${isAnimating ? 'opacity-0' : 'opacity-100'}`,
        };
      case 'slide':
        return {
          className: `${baseTransition} ${
            isAnimating
              ? animationDirection === 'next'
                ? '-translate-x-full'
                : 'translate-x-full'
              : 'translate-x-0'
          }`,
        };
      case 'scale':
        return {
          className: `${baseTransition} ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`,
        };
      default:
        return {};
    }
  };

  const animationStyles = getAnimationStyles();

  return (
    <div className={`relative epub-viewer ${className}`}>
      {/* EPUB 渲染容器 */}
      <div
        ref={containerRef}
        className={`epub-viewer-container ${animationStyles.className || ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />

      {/* 加载状态 */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">正在加载...</p>
          </div>
        </div>
      )}

      {/* 调试信息（开发模式） */}
      {showDebug && isReady && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg bg-background/80 p-2 text-xs backdrop-blur">
          <div>CFI: {currentCfi.substring(0, 50)}...</div>
          <div>进度: {progress.toFixed(2)}%</div>
          <div>
            导航: {canGoPrev ? '◀' : '⊘'} {canGoNext ? '▶' : '⊘'}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 扁平化目录
 */
function flattenToc(toc: TOCItem[]): TOCItem[] {
  const result: TOCItem[] = [];

  function traverse(items: TOCItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(toc);
  return result;
}

export default EpubViewer;
