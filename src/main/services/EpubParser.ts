/**
 * EPUB 解析服务
 * 用于在主进程中解析 EPUB 文件并提取元数据和封面
 */

import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import path from 'path';
import { readFile } from 'fs/promises';
import type { TOCItem, SpineItem } from '@shared/types';
import { logger } from '@shared/utils/Logger';
import { EpubParseError, ErrorHandler } from '@shared/utils/ErrorHandler';

export interface EpubMetadata {
  title: string;
  author: string;
  publisher?: string;
  publishDate?: Date;
  isbn?: string;
  language?: string;
  description?: string;
}

export interface EpubParseResult {
  metadata: EpubMetadata;
  toc: TOCItem[];
  spine: SpineItem[];
  coverPath?: string;
}

export class EpubParser {
  /**
   * 解析 EPUB 文件
   */
  static async parse(filePath: string): Promise<EpubParseResult> {
    logger.info(`Starting to parse EPUB file: ${filePath}`, 'EpubParser');

    try {
      // 读取 EPUB 文件
      const buffer = await readFile(filePath);
      const zip = await JSZip.loadAsync(buffer);

      // 查找并解析容器文件
      const containerFile = zip.file('META-INF/container.xml');
      if (!containerFile) {
        throw new EpubParseError('Invalid EPUB file: container.xml not found', 'EpubParser');
      }

      const containerXml = await containerFile.async('string');
      const container = await parseStringPromise(containerXml);
      const rootfilePath = container?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.['full-path'];
      
      if (!rootfilePath) {
        throw new EpubParseError('Invalid EPUB file: rootfile path not found', 'EpubParser');
      }

      logger.debug(`Found rootfile: ${rootfilePath}`, 'EpubParser');

      // 解析 OPF 文件
      const rootfileDir = path.dirname(rootfilePath);
      const opfFile = zip.file(rootfilePath);
      
      if (!opfFile) {
        throw new EpubParseError('Invalid EPUB file: OPF file not found', 'EpubParser');
      }

      const opfContent = await opfFile.async('string');
      const opf = await parseStringPromise(opfContent);
      const packageNode = opf.package;

      if (!packageNode) {
        throw new EpubParseError('Invalid EPUB file: package node not found', 'EpubParser');
      }

      // 提取元数据
      logger.debug('Extracting metadata...', 'EpubParser');
      const metadata = this.extractMetadata(packageNode.metadata);

      // 提取目录（TOC）
      logger.debug('Extracting TOC...', 'EpubParser');
      const toc = await this.extractTOC(zip, packageNode, rootfileDir);

      // 提取 spine（阅读顺序）
      logger.debug('Extracting spine...', 'EpubParser');
      const spine = this.extractSpine(packageNode.spine, packageNode.manifest);

      // 提取封面
      logger.debug('Extracting cover...', 'EpubParser');
      const coverPath = await this.extractCover(zip, packageNode.manifest, rootfileDir);

      logger.info(`Successfully parsed EPUB file: ${metadata.title}`, 'EpubParser');

      return {
        metadata,
        toc,
        spine,
        coverPath,
      };
    } catch (error) {
      if (error instanceof EpubParseError) {
        throw error;
      }
      logger.error('Failed to parse EPUB file', 'EpubParser', error as Error);
      throw new EpubParseError(
        `Failed to parse EPUB file: ${(error as Error).message}`,
        'EpubParser',
        error as Error
      );
    }
  }

  /**
   * 提取元数据
   */
  private static extractMetadata(metadataNode: any): EpubMetadata {
    const meta = metadataNode?.[0];
    const dc = meta?.['dc:metadata']?.[0] || meta;

    const getTitle = () => {
      if (meta?.['dc:title']) return meta['dc:title'][0];
      if (meta?.title) return meta.title[0]?._ || meta.title[0];
      if (dc?.['dc:title']) return dc['dc:title'][0];
      return 'Unknown';
    };

    const getCreator = () => {
      if (meta?.['dc:creator']) return meta['dc:creator'][0];
      if (meta?.creator) return meta.creator[0]?._ || meta.creator[0];
      if (dc?.['dc:creator']) return dc['dc:creator'][0];
      return 'Unknown';
    };

    const getPublisher = () => {
      if (meta?.['dc:publisher']) return meta['dc:publisher'][0];
      if (meta?.publisher) return meta.publisher[0];
      return undefined;
    };

    const getDate = () => {
      if (meta?.['dc:date']) return new Date(meta['dc:date'][0]);
      if (meta?.date) return new Date(meta.date[0]);
      return undefined;
    };

    const getISBN = () => {
      const identifiers = meta?.['dc:identifier'] || meta?.identifier || [];
      for (const id of identifiers) {
        const value = id._ || id;
        if (typeof value === 'string' && (value.includes('isbn:') || value.includes('ISBN'))) {
          return value.replace(/isbn:/i, '');
        }
      }
      return undefined;
    };

    const getLanguage = () => {
      if (meta?.['dc:language']) return meta['dc:language'][0];
      if (meta?.language) return meta.language[0];
      return undefined;
    };

    const getDescription = () => {
      if (meta?.['dc:description']) return meta['dc:description'][0];
      if (meta?.description) {
        const desc = meta.description[0];
        return typeof desc === 'string' ? desc : desc._;
      }
      return undefined;
    };

    return {
      title: getTitle(),
      author: getCreator(),
      publisher: getPublisher(),
      publishDate: getDate(),
      isbn: getISBN(),
      language: getLanguage(),
      description: getDescription(),
    };
  }

  /**
   * 提取目录
   */
  private static async extractTOC(
    zip: JSZip,
    packageNode: any,
    rootfileDir: string
  ): Promise<TOCItem[]> {
    try {
      const manifest = packageNode.manifest?.[0];
      const spine = packageNode.spine?.[0];
      const tocAttr = spine?.$ ?.toc;

      // 查找 NCX 文件
      let ncxPath: string | null = null;

      if (tocAttr) {
        const tocItem = manifest?.item?.find((item: any) => item.$.id === tocAttr);
        if (tocItem) {
          ncxPath = path.join(rootfileDir, tocItem.$.href);
        }
      }

      // 如果没有找到 NCX，尝试查找默认的 NCX
      if (!ncxPath) {
        const ncxItem = manifest?.item?.find((item: any) =>
          item.$['media-type']?.includes('ncx') ||
          item.$.href?.endsWith('.ncx')
        );
        if (ncxItem) {
          ncxPath = path.join(rootfileDir, ncxItem.$.href);
        }
      }

      if (!ncxPath) {
        logger.warn('NCX file not found, TOC will be empty', 'EpubParser');
        return [];
      }

      const ncxFile = zip.file(ncxPath);
      if (!ncxFile) {
        logger.warn(`NCX file not found in zip: ${ncxPath}`, 'EpubParser');
        return [];
      }

      const ncxContent = await ncxFile.async('string');
      const ncx = await parseStringPromise(ncxContent);
      const navMap = ncx.ncx?.navMap?.[0];

      const toc = this.parseNavMap(navMap?.navPoint || [], '');
      logger.debug(`Extracted ${toc.length} TOC items`, 'EpubParser');
      
      return toc;
    } catch (error) {
      logger.warn('Failed to parse TOC, returning empty array', 'EpubParser', error as Error);
      return [];
    }
  }

  /**
   * 解析导航点
   */
  private static parseNavMap(navPoints: any[], parent: string): TOCItem[] {
    return navPoints.map((point, index) => {
      const label = point.navLabel?.[0]?.text?.[0] || 'Section';
      const src = point.content?.[0]?.$.src || '';
      const id = `${parent}${index}`;

      const item: TOCItem = {
        id,
        label,
        href: src,
        parent: parent || undefined,
      };

      if (point.navPoint && point.navPoint.length > 0) {
        item.children = this.parseNavMap(point.navPoint, `${id}-`);
      }

      return item;
    });
  }

  /**
   * 提取 spine（阅读顺序）
   */
  private static extractSpine(spineNode: any, manifestNode: any): SpineItem[] {
    const spine = spineNode?.[0];
    const manifest = manifestNode?.[0];
    const itemrefs = spine?.itemref || [];

    return itemrefs.map((itemref: any) => {
      const idref = itemref.$.idref;
      const item = manifest?.item?.find((i: any) => i.$.id === idref);

      return {
        id: idref,
        href: item?.$.href || '',
        mediaType: item?.$['media-type'] || '',
      };
    });
  }

  /**
   * 提取封面
   */
  private static async extractCover(
    zip: JSZip,
    manifestNode: any,
    rootfileDir: string
  ): Promise<string | undefined> {
    const manifest = manifestNode?.[0];
    const meta = manifest?.meta || [];

    // 查找封面元数据
    const coverMeta = meta.find((m: any) => m.$.name === 'cover');
    if (!coverMeta) {
      return undefined;
    }

    const coverId = coverMeta.$.content;
    const coverItem = manifest?.item?.find((i: any) => i.$.id === coverId);

    if (!coverItem) {
      return undefined;
    }

    const coverPath = path.join(rootfileDir, coverItem.$.href);

    // 验证封面文件存在
    const coverFile = zip.file(coverPath);
    if (!coverFile) {
      return undefined;
    }

    return coverPath;
  }

  /**
   * 提取封面图片数据
   */
  static async extractCoverData(filePath: string): Promise<Buffer | null> {
    try {
      const zip = await JSZip.loadAsync(filePath);
      const parseResult = await this.parse(filePath);

      if (!parseResult.coverPath) {
        return null;
      }

      const coverFile = zip.file(parseResult.coverPath);
      if (!coverFile) {
        return null;
      }

      const data = await coverFile.async('nodebuffer');
      return data;
    } catch (error) {
      console.error('Failed to extract cover data:', error);
      return null;
    }
  }

  /**
   * 验证 EPUB 文件
   */
  static async validate(filePath: string): Promise<boolean> {
    try {
      const zip = await JSZip.loadAsync(filePath);

      // 检查必需的文件
      const hasContainer = zip.file('META-INF/container.xml') !== null;
      if (!hasContainer) {
        return false;
      }

      const containerXml = await zip.file('META-INF/container.xml')?.async('string');
      if (!containerXml) {
        return false;
      }

      const container = await parseStringPromise(containerXml);
      const rootfilePath = container.rootfiles?.rootfile?.[0]?.$?.['full-path'];
      if (!rootfilePath) {
        return false;
      }

      const hasOpf = zip.file(rootfilePath) !== null;
      return hasOpf;
    } catch {
      return false;
    }
  }
}
