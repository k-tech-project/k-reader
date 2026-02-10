/**
 * AI Provider 基础接口
 */

import type { AISettings } from '../../../shared/types';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface AIProvider {
  readonly provider: string;
  readonly model: any; // LangChain model instance
  
  /**
   * 生成文本（非流式）
   */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  
  /**
   * 生成文本（流式）
   */
  generateStream(prompt: string, options?: GenerateOptions): AsyncIterable<string>;
  
  /**
   * 统计 token 数量
   */
  countTokens(text: string): number;
}

export interface AIConfig extends AISettings {
  // 可以添加更多配置选项
}
