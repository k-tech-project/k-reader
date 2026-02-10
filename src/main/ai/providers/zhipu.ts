/**
 * 智谱 AI (GLM-4) Provider 实现
 * 使用 OpenAI 兼容接口
 */

import { ChatOpenAI } from '@langchain/openai';
import type { AIProvider, AIConfig, GenerateOptions } from './base';

export class ZhipuProvider implements AIProvider {
  public readonly provider = 'zhipu';
  public readonly model: ChatOpenAI;
  private modelName: string;

  constructor(config: AIConfig) {
    this.modelName = config.model || 'glm-4-flash';
    const baseURL = config.baseURL || 'https://open.bigmodel.cn/api/paas/v4/';

    console.log('[ZhipuProvider] Initializing with:', {
      model: this.modelName,
      baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKeyLength: config.apiKey?.length,
    });

    // 智谱 AI 提供 OpenAI 兼容接口
    // 注意：LangChain 的 ChatOpenAI 使用 apiKey 而不是 openAIApiKey
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      apiKey: config.apiKey,  // 使用 apiKey 而不是 openAIApiKey
      configuration: {
        baseURL,
      },
    });

    console.log('[ZhipuProvider] Initialized successfully');
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
    // GLM 模型对中文的 token 计数大约是每个字符 1.5 个 token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.3);
  }
}
