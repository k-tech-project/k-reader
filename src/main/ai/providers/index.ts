/**
 * Provider 工厂 - 统一创建不同的 AI Provider
 */

import type { AIProvider, AIConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { ZhipuProvider } from './zhipu';
import { QianwenProvider } from './qianwen';
import { CustomProvider } from './custom';

export * from './base';
export { OpenAIProvider } from './openai';
export { AnthropicProvider } from './anthropic';
export { ZhipuProvider } from './zhipu';
export { QianwenProvider } from './qianwen';
export { CustomProvider } from './custom';

/**
 * 根据配置创建对应的 AI Provider
 */
export function createProvider(config: AIConfig): AIProvider {
  console.log('[createProvider] Creating provider with config:', {
    provider: config.provider,
    model: config.model,
    baseURL: config.baseURL,
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey?.length,
    enabled: config.enabled,
  });

  if (!config.enabled) {
    throw new Error('AI 功能未启用');
  }

  if (!config.apiKey) {
    throw new Error('请配置 API Key');
  }

  let provider: AIProvider;

  switch (config.provider) {
    case 'openai':
      console.log('[createProvider] Creating OpenAIProvider');
      provider = new OpenAIProvider(config);
      break;

    case 'claude':
      console.log('[createProvider] Creating AnthropicProvider');
      provider = new AnthropicProvider(config);
      break;

    case 'zhipu':
      console.log('[createProvider] Creating ZhipuProvider');
      provider = new ZhipuProvider(config);
      break;

    case 'qianwen':
      console.log('[createProvider] Creating QianwenProvider');
      provider = new QianwenProvider(config);
      break;

    case 'custom':
      console.log('[createProvider] Creating CustomProvider');
      provider = new CustomProvider(config);
      break;

    default:
      console.error('[createProvider] Unknown provider:', config.provider);
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
  }

  console.log('[createProvider] Provider created successfully:', provider.provider);
  return provider;
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(provider: AIConfig['provider']): Partial<AIConfig> {
  const defaults: Record<AIConfig['provider'], Partial<AIConfig>> = {
    openai: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
    },
    claude: {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 2000,
    },
    zhipu: {
      model: 'glm-4-flash',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
      temperature: 0.7,
      maxTokens: 2000,
    },
    qianwen: {
      model: 'qwen-plus',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      temperature: 0.7,
      maxTokens: 2000,
    },
    custom: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
    },
  };

  return defaults[provider] || {};
}
