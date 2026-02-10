/**
 * OpenAI Provider 实现
 */

import { ChatOpenAI } from '@langchain/openai';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import type { AIProvider, AIConfig, GenerateOptions } from './base';

export class OpenAIProvider implements AIProvider {
  public readonly provider = 'openai';
  public readonly model: ChatOpenAI;
  private modelName: string;

  constructor(config: AIConfig) {
    this.modelName = config.model || 'gpt-4o-mini';

    // 构建配置对象
    const modelConfig: any = {
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
    };

    // API Key 设置 - apiKey 优先级高于 openAIApiKey
    if (config.apiKey) {
      modelConfig.apiKey = config.apiKey;
    }

    // 自定义 baseURL
    if (config.baseURL) {
      modelConfig.configuration = {
        baseURL: config.baseURL,
      };
    }

    this.model = new ChatOpenAI(modelConfig);
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
    try {
      // 尝试使用精确的模型编码器
      const encoder = encoding_for_model(this.modelName as TiktokenModel);
      const tokens = encoder.encode(text);
      encoder.free();
      return tokens.length;
    } catch {
      // 如果模型不支持，使用 gpt-4 作为备用
      const encoder = encoding_for_model('gpt-4');
      const tokens = encoder.encode(text);
      encoder.free();
      return tokens.length;
    }
  }
}
