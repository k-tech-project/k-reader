/**
 * 自定义模型 Provider 实现
 * 支持所有兼容 OpenAI API 格式的服务（如各类代理、国产模型等）
 */

import { ChatOpenAI } from '@langchain/openai';
import type { AIProvider, AIConfig, GenerateOptions } from './base';

/**
 * 自定义模型 Provider 类
 *
 * 使用 OpenAI 兼容接口实现，支持任意提供 OpenAI 格式 API 的服务
 * 适用于：各类 API 代理、国产大模型、私有化部署的模型服务等
 */
export class CustomProvider implements AIProvider {
  /** Provider 标识符 */
  public readonly provider = 'custom';

  /** LangChain ChatOpenAI 模型实例 */
  public readonly model: ChatOpenAI;

  /** 模型名称 */
  private modelName: string;

  /**
   * 构造函数
   * @param config AI 配置对象，必须包含 baseURL、apiKey 等信息
   * @throws {Error} 当未配置 baseURL 时抛出异常
   */
  constructor(config: AIConfig) {
    // 验证必需的配置项
    if (!config.baseURL) {
      throw new Error('自定义模型需要配置 Base URL');
    }

    // 设置模型名称，默认使用 gpt-3.5-turbo
    this.modelName = config.model || 'gpt-3.5-turbo';

    console.log('[CustomProvider] 初始化自定义模型提供商:', {
      model: this.modelName,
      baseURL: config.baseURL,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      apiKeyLength: config.apiKey?.length,
    });

    // 使用 OpenAI 兼容接口创建模型实例
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.baseURL, // 自定义 API 端点
      },
    });

    console.log('[CustomProvider] 自定义模型提供商初始化成功');
  }

  /**
   * 生成文本（非流式）
   * @param prompt 输入提示词
   * @param _options 生成选项（未使用，保留以兼容接口）
   * @returns 生成的文本内容
   */
  async generateText(prompt: string, _options?: GenerateOptions): Promise<string> {
    const response = await this.model.invoke(prompt);
    return response.content as string;
  }

  /**
   * 生成文本（流式）
   * @param prompt 输入提示词
   * @param _options 生成选项（未使用，保留以兼容接口）
   * @returns 异步可迭代对象，逐块返回生成的文本
   */
  async *generateStream(prompt: string, _options?: GenerateOptions): AsyncIterable<string> {
    const stream = await this.model.stream(prompt);

    // 逐块返回流式响应内容
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * 统计文本的 Token 数量（估算值）
   * 使用通用估算方式：中文约 1.3 token/字符，英文约 0.3 token/字符
   * @param text 待统计的文本
   * @returns 估算的 Token 数量
   */
  countTokens(text: string): number {
    // 匹配中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 其余字符数
    const otherChars = text.length - chineseChars;
    // 按比例计算 Token 数量
    return Math.ceil(chineseChars * 1.3 + otherChars * 0.3);
  }
}
