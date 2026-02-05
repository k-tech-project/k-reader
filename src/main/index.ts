/**
 * Electron主进程入口
 */
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { WindowManager } from './window/WindowManager';
import { IPCHandlers } from './ipc/handlers';
import { DatabaseService } from './database/DatabaseService';

// 主窗口实例
let mainWindow: BrowserWindow | null = null;

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * 创建主窗口
 */
function createWindow(): void {
  mainWindow = WindowManager.createMainWindow();

  // 加载页面
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 打开开发者工具 (开发环境)
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用初始化
 */
async function initialize(): Promise<void> {
  try {
    // 初始化数据库
    await DatabaseService.getInstance().initialize();
    console.log('Database initialized');

    // 注册IPC处理器
    IPCHandlers.register();
    console.log('IPC handlers registered');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 设置应用用户模型ID (Windows)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.kreader.app');
  }

  // 初始化应用
  await initialize();

  // 创建窗口
  createWindow();

  // macOS上，点击Dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用 (macOS除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用即将退出
app.on('will-quit', async () => {
  // 清理资源
  await DatabaseService.getInstance().close();
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
