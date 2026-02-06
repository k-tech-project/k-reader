/**
 * 窗口管理器
 */
import { BrowserWindow, screen, nativeImage } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import Store from 'electron-store';
import type { WindowBounds } from '@shared/types';

// 延迟初始化 Store
let store: Store<{ windowBounds: WindowBounds }> | null = null;

function getStore(): Store<{ windowBounds: WindowBounds }> {
  if (!store) {
    store = new Store<{ windowBounds: WindowBounds }>();
  }
  return store;
}

export class WindowManager {
  /**
   * 创建主窗口
   */
  static createMainWindow(): BrowserWindow {
    // 获取主屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 从存储中恢复窗口位置和大小
    const savedBounds = getStore().get('windowBounds') as WindowBounds | undefined;

    const defaultBounds = {
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      x: undefined,
      y: undefined,
    };

    const bounds = savedBounds || defaultBounds;

    // macOS 不需要设置 icon，会使用 app bundle 的图标
    // Windows/Linux 需要设置 icon
    let icon = undefined;
    if (process.platform !== 'darwin') {
      const iconPath = join(process.resourcesPath || join(__dirname, '../../..'), 'resources', 'icon.png');

      // 开发环境下，尝试从项目根目录加载图标
      if (process.env.NODE_ENV === 'development') {
        const devIconPath = join(process.cwd(), 'resources', 'icon.png');
        if (existsSync(devIconPath)) {
          icon = nativeImage.createFromPath(devIconPath);
        }
      } else if (existsSync(iconPath)) {
        // 生产环境下从 resources 目录加载
        icon = nativeImage.createFromPath(iconPath);
      }
    }

    // 创建窗口
    const window = new BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      frame: process.platform === 'darwin',
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon, // 设置应用图标
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: true,
      },
    });

    // 窗口准备好后显示
    window.once('ready-to-show', () => {
      window.show();
    });

    // 保存窗口状态
    const saveBounds = () => {
      if (!window.isMaximized() && !window.isMinimized()) {
        const bounds = window.getBounds();
        getStore().set('windowBounds', bounds);
      }
    };

    window.on('resize', saveBounds);
    window.on('move', saveBounds);

    return window;
  }

  /**
   * 最小化窗口
   */
  static minimize(window: BrowserWindow): void {
    window.minimize();
  }

  /**
   * 最大化/还原窗口
   */
  static toggleMaximize(window: BrowserWindow): void {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }

  /**
   * 关闭窗口
   */
  static close(window: BrowserWindow): void {
    window.close();
  }

  /**
   * 获取窗口边界
   */
  static getBounds(window: BrowserWindow): WindowBounds {
    return window.getBounds();
  }

  /**
   * 设置窗口边界
   */
  static setBounds(window: BrowserWindow, bounds: Partial<WindowBounds>): void {
    window.setBounds(bounds);
  }
}
