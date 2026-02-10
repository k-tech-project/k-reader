/**
 * 自定义模型 Provider 实现
 * 支持所有兼容 OpenAI API 格式的服务
 */

import { ChatOpenAI } from '@langchain/openai';
import type { AIProvider, AIConfig, GenerateOptions } from './base';

export class CustomProvider implements AIProvider {
  public readonly provider = 'custom';
  public readonly model: ChatOpenAI;
  private modelName: string;

  constructor(config: AIConfig) {
    if (!config.baseURL) {
      throw new Error('自定义模型需要配置 Base URL');
    }

    this.modelName = config.model || 'gpt-3.5-turbo';

    console.log('[CustomProvider] Initializing with:', {
      model: this.modelName,
      baseURL: config.baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKeyLength: config.apiKey?.length,
    });

    // 使用 OpenAI 兼容接口
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.baseURL,
      },
    });

    console.log('[CustomProvider] Initialized successfully');
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
    // 使用通用估算方式
    // 中文约 1.3 token/字符，英文约 0.3 token/字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.3 + otherChars * 0.3);
  }
}
