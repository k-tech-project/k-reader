/**
 * 文本分割工具
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

/**
 * 创建文本分割器
 * 优先按段落、句子分割，保持上下文连贯性
 */
export function createTextSplitter(options: TextSplitterOptions = {}): RecursiveCharacterTextSplitter {
  const {
    chunkSize = 2000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '。', '！', '？', '；', '，', ',', ' ', ''],
  } = options;

  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators,
    lengthFunction: (text: string) => text.length,
  });
}

/**
 * 将文本分割成块
 */
export async function splitText(text: string, options?: TextSplitterOptions): Promise<string[]> {
  const splitter = createTextSplitter(options);
  return await splitter.splitText(text);
}

/**
 * 估算分块后的数量
 */
export function estimateChunkCount(text: string, chunkSize: number = 2000): number {
  return Math.ceil(text.length / chunkSize);
}

/**
 * 清理 HTML 标签，提取纯文本
 */
export function cleanHtml(html: string): string {
  return html
    // 移除 script 和 style 标签及其内容
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // 将 br 和 p 标签转换为换行
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    // 移除所有 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 解码 HTML 实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    // 清理多余空白
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}
