/**
 * EPUB 阅读器服务
 * 封装 epub.js，提供统一的阅读器 API
 */

import ePub, { Book as EpubBook, Rendition as EpubRendition } from 'epubjs';
import type {
  EpubRenditionOptions,
  ReaderSettings,
  ReaderTheme,
  ReaderEventType,
  EpubReaderInitOptions,
} from '../types/reader.types';

// 导出 ReaderLocation 供其他模块使用
export interface ReaderLocation {
  start: {
    cfi: string;
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
  end: {
    cfi: string;
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
  atStart: boolean;
  atEnd: boolean;
}
import { PRESET_THEMES } from '../types/reader.types';

export class EpubReader {
  private book: EpubBook | null = null;
  private rendition: EpubRendition | null = null;
  private currentLocation: ReaderLocation | null = null;
  private settings: ReaderSettings;
  private eventListeners: Map<ReaderEventType, Set<Function>> = new Map();
  private isDestroyed = false;

  constructor() {
    this.settings = {
      fontSize: 16,
      fontFamily: 'serif',
      lineHeight: 1.6,
      marginWidth: 60,
      readingMode: 'paginated',
      theme: PRESET_THEMES.light,
    };
  }

  /**
   * 初始化阅读器
   */
  async init(options: EpubReaderInitOptions): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('EpubReader has been destroyed');
    }

    try {
      console.info('[EpubReader] init start', {
        filePath: options.book.filePath,
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI?.file?.read,
      });

      // 应用设置
      if (options.settings) {
        this.settings = { ...this.settings, ...options.settings };
      }

      // 打开书籍（优先从主进程读取二进制，避免 file:// 被拦截）
      let bookInput: string | ArrayBuffer = options.book.filePath;
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.file?.read) {
          const data = await window.electronAPI.file.read(options.book.filePath);
          if (data && typeof data !== 'string') {
            // 处理 IPC 传递的 Buffer 格式 {type: 'Buffer', data: number[]}
            let uint8Array: Uint8Array;
            if (data instanceof Uint8Array) {
              uint8Array = data;
            } else if (data && typeof data === 'object' && (data as any).type === 'Buffer' && Array.isArray((data as any).data)) {
              // IPC 序列化的 Buffer
              uint8Array = new Uint8Array((data as any).data);
            } else if (data instanceof ArrayBuffer) {
              uint8Array = new Uint8Array(data);
            } else {
              uint8Array = new Uint8Array(data as ArrayBuffer);
            }
            bookInput = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
            console.info('[EpubReader] loaded book bytes', { byteLength: uint8Array.byteLength });
          } else {
            console.warn('[EpubReader] file.read returned string, fallback to filePath');
          }
        }
      } catch (error) {
        console.warn('[EpubReader] file.read failed, fallback to filePath', error);
      }

      this.book = ePub(bookInput);
      this.book.on('openFailed', (err: Error) => {
        console.error('[EpubReader] openFailed', err);
      });

      await this.book.ready;
      console.info('[EpubReader] book ready');

      // 创建渲染器
      const renditionOptions: EpubRenditionOptions = {
        width: '100%',
        height: '100%',
        spread: 'auto',
        flow: this.settings.readingMode === 'paginated' ? 'paginated' : 'scrolled',
        allowScriptedContent: true, // 允许 iframe 中执行脚本
        allowPopups: false, // 不允许弹窗
        ...this.getThemeStyles(),
      };

      this.rendition = this.book.renderTo(
        options.element,
        renditionOptions
      );
      console.info('[EpubReader] rendition created, instance:', !!this.rendition);
      console.info('[EpubReader] rendition methods - next:', typeof this.rendition.next, 'prev:', typeof this.rendition.prev);

      // 设置主题
      this.applyTheme(this.settings.theme);

      // 绑定事件
      this.bindEvents();

      // 显示内容
      if (options.initialCfi) {
        await this.rendition.display(options.initialCfi);
      } else {
        await this.rendition.display();
      }
      console.info('[EpubReader] display complete');

      // 保存初始位置
      this.currentLocation = this.rendition.location as ReaderLocation;
      console.info('[EpubReader] emitting ready event, location:', this.currentLocation);

      this.emit('ready', { location: this.currentLocation });
    } catch (error) {
      console.error('Failed to initialize EpubReader:', error);
      throw error;
    }
  }

  /**
   * 翻到下一页
   */
  async next(): Promise<void> {
    console.log('[EpubReader #' + (this as any).__instanceId + '] next called, rendition:', !!this.rendition, 'isDestroyed:', this.isDestroyed);
    if (!this.rendition) {
      console.error('[EpubReader] next: rendition is null!');
      return;
    }
    
    if (this.isDestroyed) {
      console.error('[EpubReader] next: instance is destroyed!');
      return;
    }

    try {
      console.log('[EpubReader] calling rendition.next(), location before:', this.currentLocation?.start?.cfi?.substring(0, 80));
      const result = await this.rendition.next();
      console.log('[EpubReader] rendition.next() completed, result:', result);
      
      // 手动更新位置
      setTimeout(() => {
        const newLocation = this.rendition?.location as ReaderLocation;
        console.log('[EpubReader] location after next (setTimeout):', newLocation?.start?.cfi?.substring(0, 80));
        if (newLocation && newLocation.start.cfi !== this.currentLocation?.start.cfi) {
          console.log('[EpubReader] Location changed detected!');
        } else {
          console.warn('[EpubReader] Location did NOT change after next()!');
        }
      }, 100);
    } catch (error) {
      console.error('[EpubReader] Failed to go to next page:', error);
      throw error;
    }
  }

  /**
   * 翻到上一页
   */
  async prev(): Promise<void> {
    console.log('[EpubReader #' + (this as any).__instanceId + '] prev called, rendition:', !!this.rendition, 'isDestroyed:', this.isDestroyed);
    if (!this.rendition) {
      console.error('[EpubReader] prev: rendition is null!');
      return;
    }
    
    if (this.isDestroyed) {
      console.error('[EpubReader] prev: instance is destroyed!');
      return;
    }

    try {
      console.log('[EpubReader] calling rendition.prev(), location before:', this.currentLocation?.start?.cfi?.substring(0, 80));
      const result = await this.rendition.prev();
      console.log('[EpubReader] rendition.prev() completed, result:', result);
      
      // 手动更新位置
      setTimeout(() => {
        const newLocation = this.rendition?.location as ReaderLocation;
        console.log('[EpubReader] location after prev (setTimeout):', newLocation?.start?.cfi?.substring(0, 80));
        if (newLocation && newLocation.start.cfi !== this.currentLocation?.start.cfi) {
          console.log('[EpubReader] Location changed detected!');
        } else {
          console.warn('[EpubReader] Location did NOT change after prev()!');
        }
      }, 100);
    } catch (error) {
      console.error('[EpubReader] Failed to go to previous page:', error);
      throw error;
    }
  }

  /**
   * 跳转到指定位置
   */
  async goto(cfi: string): Promise<void> {
    if (!this.rendition) return;

    try {
      await this.rendition.display(cfi);
      this.updateLocation();
    } catch (error) {
      console.error('Failed to goto location:', error);
      throw error;
    }
  }

  /**
   * 跳转到指定章节
   */
  async gotoChapter(href: string): Promise<void> {
    if (!this.rendition) return;

    try {
      await this.rendition.display(href);
      this.updateLocation();
      this.emit('chapterChanged', { href });
    } catch (error) {
      console.error('Failed to goto chapter:', error);
      throw error;
    }
  }

  /**
   * 获取当前 CFI 位置
   */
  getCurrentCFI(): string {
    if (!this.currentLocation?.start?.cfi) {
      return '';
    }
    return this.currentLocation.start.cfi;
  }

  /**
   * 获取当前位置
   */
  getLocation(): ReaderLocation | null {
    return this.currentLocation;
  }

  /**
   * 获取当前进度百分比
   */
  getProgress(): number {
    if (!this.currentLocation?.start?.percentage) {
      return 0;
    }
    return this.currentLocation.start.percentage;
  }

  /**
   * 获取目录
   */
  async getTOC(): Promise<any[]> {
    if (!this.book) {
      return [];
    }

    try {
      const navigation = await this.book.loaded.navigation;
      const convertTOC = (items: any[], parent = ''): any[] => {
        return items.map((item, index) => ({
          id: `${parent}${index}`,
          label: item.label,
          href: item.href,
          parent: parent || undefined,
          children: item.subitems
            ? convertTOC(item.subitems, `${parent}${index}-`)
            : undefined,
        }));
      };

      return convertTOC(navigation.toc);
    } catch (error) {
      console.error('Failed to get TOC:', error);
      return [];
    }
  }

  /**
   * 设置字体大小
   */
  setFontSize(size: number): void {
    this.settings.fontSize = size;
    this.applyTheme(this.settings.theme);
  }

  /**
   * 设置字体
   */
  setFontFamily(fontFamily: string): void {
    this.settings.fontFamily = fontFamily;
    this.applyTheme(this.settings.theme);
  }

  /**
   * 设置行高
   */
  setLineHeight(lineHeight: number): void {
    this.settings.lineHeight = lineHeight;
    this.applyTheme(this.settings.theme);
  }

  /**
   * 设置边距
   */
  setMarginWidth(marginWidth: number): void {
    this.settings.marginWidth = marginWidth;
    this.applyTheme(this.settings.theme);
  }

  /**
   * 设置阅读模式
   */
  setReadingMode(mode: 'paginated' | 'scrolled'): void {
    this.settings.readingMode = mode;
    if (this.rendition) {
      this.rendition.flow(mode === 'paginated' ? 'paginated' : 'scrolled');
    }
  }

  /**
   * 设置主题
   */
  setTheme(theme: ReaderTheme): void {
    this.settings.theme = theme;
    this.applyTheme(theme);
  }

  /**
   * 获取设置
   */
  getSettings(): ReaderSettings {
    return { ...this.settings };
  }

  /**
   * 搜索文本
   */
  async search(query: string): Promise<Array<{ cfi: string; excerpt: string; chapter: string }>> {
    if (!this.book || !this.rendition) return [];
    if (!query.trim()) return [];

    try {
      const results: Array<{ cfi: string; excerpt: string; chapter: string }> = [];

      // 获取目录信息
      const navigation = await this.book.loaded.navigation;
      const tocItems = navigation.toc;

      // 简单的搜索实现：在每个章节中搜索
      for (const item of tocItems) {
        try {
          // 获取章节内容
          const section = this.book.section(item.href);
          if (!section) continue;

          const contents = await section.document();
          if (!contents) continue;

          // 搜索文本
          const textContent = contents.textContent || '';
          const lowerQuery = query.toLowerCase();
          const lowerText = textContent.toLowerCase();

          // 查找所有匹配位置
          let index = lowerText.indexOf(lowerQuery);
          while (index !== -1) {
            // 获取上下文
            const start = Math.max(0, index - 50);
            const end = Math.min(textContent.length, index + query.length + 50);
            const excerpt = '...' + textContent.substring(start, end) + '...';

            results.push({
              cfi: `${item.href}[${index}]`, // 简化的 CFI 表示
              excerpt: excerpt.replace(new RegExp(query, 'gi'), `**${query}**`),
              chapter: item.label,
            });

            // 查找下一个匹配
            index = lowerText.indexOf(lowerQuery, index + 1);
          }
        } catch (err) {
          console.warn(`Failed to search in section ${item.href}:`, err);
        }
      }

      console.info(`[EpubReader] Search completed, found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * 高亮搜索结果
   */
  highlightSearch(query: string): void {
    if (!this.rendition) return;

    // 移除之前的高亮
    this.clearHighlight();

    // 添加新的高亮
    const highlight = (contents: any) => {
      const body = contents.contentDocument.body;
      const textNodes: Node[] = [];

      // 收集所有文本节点
      const walker = document.createTreeWalker(
        body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      // 高亮匹配的文本
      const regex = new RegExp(`(${query})`, 'gi');
      textNodes.forEach((textNode) => {
        const parent = textNode.parentElement;
        if (!parent) return;

        const text = textNode.textContent || '';
        if (!regex.test(text)) return;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        text.replace(regex, (match, p1, idx) => {
          // 添加匹配前的文本
          frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));

          // 添加高亮的匹配文本
          const mark = document.createElement('mark');
          mark.className = 'epub-search-highlight';
          mark.style.backgroundColor = 'yellow';
          mark.style.color = 'black';
          mark.textContent = p1;
          frag.appendChild(mark);

          lastIdx = idx + match.length;
          return match;
        });

        // 添加剩余的文本
        if (lastIdx < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }

        parent.replaceChild(frag, textNode);
      });
    };

    this.rendition.on('rendered', highlight);
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    if (!this.rendition) return;

    const contents = this.rendition.getContents();
    contents.forEach((content: any) => {
      const doc = content.contentDocument;
      const highlights = doc.querySelectorAll('.epub-search-highlight');
      highlights.forEach((mark: Element) => {
        const parent = mark.parentElement;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
          parent.normalize(); // 合并相邻的文本节点
        }
      });
    });
  }

  /**
   * 获取选中文本
   */
  getSelection(): string | null {
    const selection = window.getSelection();
    return selection ? selection.toString() : null;
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  /**
   * 获取选中的 CFI 范围
   */
  getSelectionCFI(): string | null {
    if (!this.rendition) return null;

    const contents = this.rendition.getContents();
    if (!contents || contents.length === 0) return null;

    const selection = contents[0].window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return this.rendition.range(range).cfi;
  }

  /**
   * 添加高亮批注
   */
  addHighlight(cfiRange: string, color: string = 'yellow'): void {
    if (!this.rendition) return;

    // 使用 epub.js 的 annotations 功能
    this.rendition.annotations.add(
      cfiRange,
      (contents: any) => {
        const mark = contents.document.createElement('mark');
        mark.className = 'epub-highlight';
        mark.style.backgroundColor = color;
        mark.style.color = 'inherit';
        return mark;
      },
      {},
      (className: string, cfiRange: string) => {
        // 高亮点击回调
        this.emit('highlightClicked', { cfiRange, className });
      }
    );
  }

  /**
   * 移除高亮批注
   */
  removeHighlight(cfiRange: string): void {
    if (!this.rendition) return;
    this.rendition.annotations.remove(cfiRange, 'epub-highlight');
  }

  /**
   * 获取所有高亮
   */
  getHighlights(): string[] {
    if (!this.rendition) return [];
    return this.rendition.annotations.keys();
  }

  /**
   * 添加事件监听器
   */
  on(event: ReaderEventType, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  /**
   * 移除事件监听器
   */
  off(event: ReaderEventType, handler: Function): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 销毁阅读器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // 清除事件监听器
    this.eventListeners.clear();

    // 销毁渲染器
    if (this.rendition) {
      this.rendition.destroy();
      this.rendition = null;
    }

    // 销毁书籍
    if (this.book) {
      this.book.destroy();
      this.book = null;
    }

    this.currentLocation = null;
  }

  /**
   * 绑定渲染器事件
   */
  private bindEvents(): void {
    if (!this.rendition) return;

    // 位置改变事件
    this.rendition.on('relocated', (location: ReaderLocation) => {
      console.log('[EpubReader #' + (this as any).__instanceId + '] relocated event, CFI:', location.start.cfi.substring(0, 80));
      console.log('[EpubReader] relocated - atStart:', location.atStart, 'atEnd:', location.atEnd);
      this.currentLocation = location;
      this.emit('locationChanged', location);
    });

    // 渲染完成事件
    this.rendition.on('rendered', (section: any) => {
      console.log('[EpubReader #' + (this as any).__instanceId + '] rendered event, href:', section.href);
      this.emit('rendered', section);
    });

    // 选中文本事件
    this.rendition.on('selected', (cfiRange: string, contents: any) => {
      this.emit('selected', { cfiRange, contents });
    });

    // 书籍加载完成
    this.book?.ready.then(() => {
      this.emit('loaded', { book: this.book });
    });
  }

  /**
   * 更新当前位置
   */
  private updateLocation(): void {
    if (this.rendition) {
      this.currentLocation = this.rendition.location as ReaderLocation;
    }
  }

  /**
   * 应用主题
   */
  private applyTheme(theme: ReaderTheme): void {
    if (!this.rendition) return;

    // 注入样式
    const styles = `
      body {
        background: ${theme.background} !important;
        color: ${theme.color} !important;
        font-family: ${this.settings.fontFamily} !important;
        font-size: ${this.settings.fontSize}px !important;
        line-height: ${this.settings.lineHeight} !important;
        margin: 0 ${this.settings.marginWidth}px !important;
      }
      a {
        color: ${theme.linkColor || theme.color} !important;
      }
      p {
        margin: 1em 0 !important;
      }
    `;

    this.rendition.themes.register('custom', { body: { styles } });
    this.rendition.themes.select('custom');
  }

  /**
   * 获取主题样式
   */
  private getThemeStyles(): Partial<EpubRenditionOptions> {
    return {
      stylesheet: `
        * {
          box-sizing: border-box;
        }
      `,
    };
  }

  /**
   * 触发事件
   */
  private emit(type: ReaderEventType, data: any): void {
    const handlers = this.eventListeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${type} event handler:`, error);
        }
      });
    }
  }

  /**
   * 检查是否在开始位置
   */
  atStart(): boolean {
    return this.currentLocation?.atStart ?? false;
  }

  /**
   * 检查是否在结束位置
   */
  atEnd(): boolean {
    return this.currentLocation?.atEnd ?? false;
  }
}

// 实例计数器（用于调试）
let instanceId = 0;

/**
 * 创建新的 EpubReader 实例
 * 注意：每次调用都会创建新实例，不使用单例模式
 */
export function createEpubReader(): EpubReader {
  instanceId++;
  console.log('[createEpubReader] Creating new instance, id:', instanceId);
  const instance = new EpubReader();
  (instance as any).__instanceId = instanceId;
  return instance;
}
