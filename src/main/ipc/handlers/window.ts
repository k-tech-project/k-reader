/**
 * 窗口IPC处理器
 */
import { BrowserWindow } from 'electron';
import { WindowManager } from '../../window/WindowManager';
import type { WindowBounds } from '@shared/types';

export class WindowHandlers {
  /**
   * 最小化窗口
   */
  static minimize(window: BrowserWindow): void {
    WindowManager.minimize(window);
  }

  /**
   * 最大化/还原窗口
   */
  static toggleMaximize(window: BrowserWindow): void {
    WindowManager.toggleMaximize(window);
  }

  /**
   * 关闭窗口
   */
  static close(window: BrowserWindow): void {
    WindowManager.close(window);
  }

  /**
   * 获取窗口边界
   */
  static getBounds(window: BrowserWindow): WindowBounds {
    return WindowManager.getBounds(window);
  }

  /**
   * 设置窗口边界
   */
  static setBounds(window: BrowserWindow, bounds: Partial<WindowBounds>): void {
    WindowManager.setBounds(window, bounds);
  }
}
