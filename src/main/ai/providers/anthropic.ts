/**
 * Anthropic Claude Provider 实现
 */

import { ChatAnthropic } from '@langchain/anthropic';
import type { AIProvider, AIConfig, GenerateOptions } from './base';

export class AnthropicProvider implements AIProvider {
  public readonly provider = 'anthropic';
  public readonly model: ChatAnthropic;
  private modelName: string;

  constructor(config: AIConfig) {
    this.modelName = config.model || 'claude-3-5-sonnet-20241022';
    
    this.model = new ChatAnthropic({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      anthropicApiKey: config.apiKey,
      clientOptions: config.baseURL ? {
        baseURL: config.baseURL,
      } : undefined,
    });
  }

  async generateText(prompt: string, _options?: GenerateOptions): Promise<string> {
    const response = await this.model.invoke(prompt);
    return response.content as string;
  }

  async *generateStream(prompt: string, _options?: GenerateOptions): AsyncIterable<string> {
    const stream = await this.model.stream(prompt);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  countTokens(text: string): number {
    // Claude 的 token 计数大约是每个字符 0.25 个 token（英文）
    // 对于中文，大约是每个字符 1-1.5 个 token
    // 这是一个粗略估计
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.3 + otherChars * 0.25);
  }
}
