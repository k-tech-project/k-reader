/**
 * EPUB 阅读器组件
 * 用于渲染 EPUB 内容并提供阅读控制
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { getEpubReader, type ReaderLocation } from '../services/EpubReader';
import type { Book } from '@shared/types';
import type { ReaderSettings, TOCItem, ReaderTheme } from '../types/reader.types';

export interface EpubViewerRef {
  prev: () => void;
  next: () => void;
  goto: (cfi: string) => void;
  gotoChapter: (href: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: ReaderTheme) => void;
  getProgress: () => number;
}

interface EpubViewerProps {
  book: Book;
  initialCfi?: string;
  settings?: Partial<ReaderSettings>;
  onLocationChange?: (location: ReaderLocation) => void;
  onChapterChange?: (chapter: { href: string; title: string }) => void;
  onProgressChange?: (progress: number) => void;
  onTOCLoaded?: (toc: TOCItem[]) => void;
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
  className = '',
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<ReturnType<typeof getEpubReader> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<ReaderLocation | null>(null);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    prev: () => {
      if (!readerRef.current) return;
      readerRef.current.prev();
    },
    next: () => {
      if (!readerRef.current) return;
      readerRef.current.next();
    },
    goto: (cfi: string) => {
      if (!readerRef.current) return;
      readerRef.current.goto(cfi);
    },
    gotoChapter: (href: string) => {
      if (!readerRef.current) return;
      readerRef.current.gotoChapter(href);
    },
    setFontSize: (size: number) => {
      if (!readerRef.current) return;
      readerRef.current.setFontSize(size);
    },
    setTheme: (theme: ReaderTheme) => {
      if (!readerRef.current) return;
      readerRef.current.setTheme(theme);
    },
    getProgress: () => {
      if (!readerRef.current) return 0;
      return readerRef.current.getProgress();
    },
  }), []);

  // 初始化阅读器
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initReader = async () => {
      try {
        const reader = getEpubReader();

        // 监听事件
        reader.on('ready', (data: { location: ReaderLocation }) => {
          if (!mounted) return;
          setIsReady(true);
          setCurrentLocation(data.location);
          setCanGoPrev(!data.location.atStart);
          setCanGoNext(!data.location.atEnd);
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

        // 获取目录
        const tableOfContents = await reader.getTOC();
        setToc(tableOfContents);
        // 通知父组件目录已加载
        onTOCLoaded?.(tableOfContents);

        readerRef.current = reader;
      } catch (error) {
        console.error('Failed to initialize EpubReader:', error);
      }
    };

    initReader();

    return () => {
      mounted = false;
      // 清理
      if (readerRef.current) {
        readerRef.current.destroy();
        readerRef.current = null;
      }
    };
    // 只在初始化时运行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const progress = currentLocation?.start.percentage ?? 0;
  const currentCfi = currentLocation?.start.cfi ?? '';

  return (
    <div className={`epub-viewer ${className}`}>
      {/* EPUB 渲染容器 */}
      <div
        ref={containerRef}
        className="epub-viewer-container"
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
      {process.env.NODE_ENV === 'development' && isReady && (
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-background/80 p-2 text-xs backdrop-blur">
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
