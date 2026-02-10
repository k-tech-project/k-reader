/**
 * Token 计数工具
 */

import { encoding_for_model, TiktokenModel } from 'tiktoken';

/**
 * 计算文本的 token 数量
 */
export function countTokens(text: string, model: string = 'gpt-4'): number {
  try {
    const encoder = encoding_for_model(model as TiktokenModel);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  } catch {
    // 如果模型不支持，使用简单估算
    return estimateTokens(text);
  }
}

/**
 * 简单估算 token 数量（当精确计数不可用时）
 */
export function estimateTokens(text: string): number {
  // 中文字符约 1.5 token/字
  // 英文单词约 1.3 token/词
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const otherChars = text.length - chineseChars - englishWords;
  
  return Math.ceil(
    chineseChars * 1.5 +
    englishWords * 1.3 +
    otherChars * 0.3
  );
}

/**
 * 估算成本（基于 token 数量）
 * @param tokens Token 数量
 * @param model 模型名称
 * @param type 'input' 或 'output'
 * @returns 成本（美元）
 */
export function estimateCost(tokens: number, model: string, type: 'input' | 'output' = 'input'): number {
  // 价格表（每百万 token 的美元）
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'glm-4': { input: 0.1, output: 0.1 },
    'glm-4-flash': { input: 0.001, output: 0.001 },
    'qwen-plus': { input: 0.4, output: 0.4 },
    'qwen-max': { input: 4, output: 4 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  const pricePerMillion = modelPricing[type];
  
  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * 格式化 token 数量显示
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  } else if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  } else {
    return `${(tokens / 1_000_000).toFixed(2)}M tokens`;
  }
}
