/**
 * AI Provider 工厂模块
 * 统一管理和创建不同的 AI Provider 实例
 *
 * 支持的提供商：
 * - OpenAI: GPT 系列模型
 * - Claude: Anthropic 系列
 * - 智谱AI: 国产 GLM 系列
 * - 通义千问: 阿里云 Qwen 系列
 * - 自定义: 所有 OpenAI 兼容接口
 */

import type { AIProvider, AIConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { ZhipuProvider } from './zhipu';
import { QianwenProvider } from './qianwen';
import { CustomProvider } from './custom';

// 导出所有 Provider 类型和实现
export * from './base';
export { OpenAIProvider } from './openai';
export { AnthropicProvider } from './anthropic';
export { ZhipuProvider } from './zhipu';
export { QianwenProvider } from './qianwen';
export { CustomProvider } from './custom';

/**
 * 根据配置创建对应的 AI Provider 实例
 *
 * @param config AI 配置对象，包含 provider、apiKey、model 等信息
 * @returns AI Provider 实例
 * @throws {Error} 当 AI 功能未启用时抛出异常
 * @throws {Error} 当未配置 API Key 时抛出异常
 * @throws {Error} 当提供商不支持时抛出异常
 *
 * @example
 * ```typescript
 * const config: AIConfig = {
 *   provider: 'custom',
 *   apiKey: 'sk-xxx',
 *   baseURL: 'https://api.example.com/v1',
 *   model: 'gpt-3.5-turbo',
 *   enabled: true,
 * };
 * const provider = createProvider(config);
 * ```
 */
export function createProvider(config: AIConfig): AIProvider {
  console.log('[createProvider] 创建 AI Provider，配置信息:', {
    provider: config.provider,
    model: config.model,
    baseURL: config.baseURL,
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey?.length,
    enabled: config.enabled,
  });

  // 验证 AI 功能是否已启用
  if (!config.enabled) {
    throw new Error('AI 功能未启用');
  }

  // 验证是否已配置 API Key
  if (!config.apiKey) {
    throw new Error('请配置 API Key');
  }

  let provider: AIProvider;

  // 根据提供商类型创建对应的 Provider 实例
  switch (config.provider) {
    case 'openai':
      console.log('[createProvider] 创建 OpenAI Provider');
      provider = new OpenAIProvider(config);
      break;

    case 'claude':
      console.log('[createProvider] 创建 Anthropic (Claude) Provider');
      provider = new AnthropicProvider(config);
      break;

    case 'zhipu':
      console.log('[createProvider] 创建智谱 AI Provider');
      provider = new ZhipuProvider(config);
      break;

    case 'qianwen':
      console.log('[createProvider] 创建通义千问 Provider');
      provider = new QianwenProvider(config);
      break;

    case 'custom':
      console.log('[createProvider] 创建自定义模型 Provider');
      provider = new CustomProvider(config);
      break;

    default:
      console.error('[createProvider] 未知的提供商类型:', config.provider);
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
  }

  console.log('[createProvider] Provider 创建成功:', provider.provider);
  return provider;
}

/**
 * 获取指定提供商的默认配置
 *
 * @param provider 提供商类型
 * @returns 该提供商的默认配置（部分配置）
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfig('custom');
 * // returns: { model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 2000 }
 * ```
 */
export function getDefaultConfig(provider: AIConfig['provider']): Partial<AIConfig> {
  // 各提供商的默认配置
  const defaults: Record<AIConfig['provider'], Partial<AIConfig>> = {
    /** OpenAI 默认配置 */
    openai: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    },

    /** Claude (Anthropic) 默认配置 */
    claude: {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 2000,
    },

    /** 智谱 AI 默认配置 */
    zhipu: {
      model: 'glm-4-flash',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
      temperature: 0.7,
      maxTokens: 2000,
    },

    /** 通义千问默认配置 */
    qianwen: {
      model: 'qwen-plus',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      temperature: 0.7,
      maxTokens: 2000,
    },

    /** 自定义模型默认配置 */
    custom: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
    },
  };

  return defaults[provider] || {};
}
