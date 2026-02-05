/**
 * 文件IPC处理器
 */
import { dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import type { SelectFileOptions, FileInfo } from '@shared/types';

export class FileHandlers {
  /**
   * 选择文件
   */
  static async select(options: SelectFileOptions): Promise<string[]> {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (!win) {
      return [];
    }

    const result = await dialog.showOpenDialog(win, {
      title: options.title || '选择文件',
      filters: options.filters?.map(f => ({
        name: f.name,
        extensions: f.extensions,
      })),
      properties: (options.properties as any) || ['openFile'],
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths;
  }

  /**
   * 选择目录
   */
  static async selectDirectory(options: { title?: string }): Promise<string | null> {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    if (!win) {
      return null;
    }

    const result = await dialog.showOpenDialog(win, {
      title: options.title || '选择目录',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }

  /**
   * 读取文件
   */
  static async read(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to read file:', error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  /**
   * 读取文本文件
   */
  static async readText(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      console.error('Failed to read text file:', error);
      throw new Error(`Failed to read text file: ${filePath}`);
    }
  }

  /**
   * 写入文件
   */
  static async write(filePath: string, data: string | Buffer): Promise<void> {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, data);
    } catch (error) {
      console.error('Failed to write file:', error);
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }

  /**
   * 删除文件
   */
  static async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${filePath}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  static async getInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }

  /**
   * 复制文件
   */
  static async copy(sourcePath: string, targetPath: string): Promise<void> {
    try {
      // 确保目标目录存在
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.copyFile(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to copy file:', error);
      throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}`);
    }
  }

  /**
   * 移动文件
   */
  static async move(sourcePath: string, targetPath: string): Promise<void> {
    try {
      // 确保目标目录存在
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.rename(sourcePath, targetPath);
    } catch (error) {
      console.error('Failed to move file:', error);
      throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}`);
    }
  }

  /**
   * 创建目录
   */
  static async mkdir(dirPath: string, recursive: boolean = true): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive });
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }

  /**
   * 读取目录内容
   */
  static async readdir(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      console.error('Failed to read directory:', error);
      throw new Error(`Failed to read directory: ${dirPath}`);
    }
  }

  /**
   * 获取文件扩展名
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * 获取文件名（不含扩展名）
   */
  static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 获取目录名
   */
  static getDirName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 拼接路径
   */
  static join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * 规范化路径
   */
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * 获取用户数据目录
   */
  static getUserDataPath(): string {
    const { app } = require('electron');
    return app.getPath('userData');
  }

  /**
   * 获取临时目录
   */
  static getTempPath(): string {
    const { app } = require('electron');
    return app.getPath('temp');
  }

  /**
   * 获取应用资源路径
   */
  static getResourcePath(): string {
    const { app } = require('electron');
    return app.getPath('userData');
  }
}
