/**
 * 系统IPC处理器
 */
import { shell, app } from 'electron';
import type { VersionInfo } from '@shared/types';

export class SystemHandlers {
  /**
   * 打开外部链接
   */
  static async openExternal(url: string): Promise<void> {
    await shell.openExternal(url);
  }

  /**
   * 在文件夹中显示文件
   */
  static showItemInFolder(path: string): void {
    shell.showItemInFolder(path);
  }

  /**
   * 获取应用路径
   */
  static getAppPath(name: string): string {
    return app.getPath(name as any);
  }

  /**
   * 获取版本信息
   */
  static getVersion(): VersionInfo {
    return {
      app: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    };
  }
}
