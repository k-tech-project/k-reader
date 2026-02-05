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
      // 应用设置
      if (options.settings) {
        this.settings = { ...this.settings, ...options.settings };
      }

      // 打开书籍
      this.book = ePub(options.book.filePath);
      await this.book.ready;

      // 创建渲染器
      const renditionOptions: EpubRenditionOptions = {
        width: '100%',
        height: '100%',
        spread: 'auto',
        flow: this.settings.readingMode === 'paginated' ? 'paginated' : 'scrolled',
        ...this.getThemeStyles(),
      };

      this.rendition = this.book.renderTo(
        options.element,
        renditionOptions
      );

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

      // 保存初始位置
      this.currentLocation = this.rendition.location as ReaderLocation;

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
    if (!this.rendition) return;

    try {
      await this.rendition.next();
      this.updateLocation();
    } catch (error) {
      console.error('Failed to go to next page:', error);
      throw error;
    }
  }

  /**
   * 翻到上一页
   */
  async prev(): Promise<void> {
    if (!this.rendition) return;

    try {
      await this.rendition.prev();
      this.updateLocation();
    } catch (error) {
      console.error('Failed to go to previous page:', error);
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
  async search(_query: string): Promise<any[]> {
    if (!this.book) return [];

    try {
      // epub.js 的搜索功能需要额外的插件
      // 这里返回空数组，后续可以集成搜索插件
      console.warn('Search functionality not implemented yet');
      return [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
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
      this.currentLocation = location;
      this.emit('locationChanged', location);
    });

    // 渲染完成事件
    this.rendition.on('rendered', (section: any) => {
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

// 导出单例
let epubReaderInstance: EpubReader | null = null;

export function getEpubReader(): EpubReader {
  if (!epubReaderInstance) {
    epubReaderInstance = new EpubReader();
  }
  return epubReaderInstance;
}

export function destroyEpubReader(): void {
  if (epubReaderInstance) {
    epubReaderInstance.destroy();
    epubReaderInstance = null;
  }
}
