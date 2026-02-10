/**
 * 章节总结链（Map-Reduce 模式）
 */

import type { BaseLanguageModel } from '@langchain/core/language_models/base';

/**
 * 总结文本块（Map-Reduce 模式）
 * @param llm 语言模型
 * @param chunks 文本块数组
 * @returns 总结结果
 */
export async function summarizeChunks(
  llm: BaseLanguageModel,
  chunks: string[]
): Promise<string> {
  // Map 阶段：总结每个块
  const mapPromises = chunks.map(async (chunk) => {
    const prompt = `请总结以下章节片段的核心要点：

${chunk}

要求：
- 简洁扼要，100-150字
- 提取主要内容和关键信息
- 保持客观准确

总结：`;
    const response = await llm.invoke(prompt);
    return response.content as string;
  });

  const summaries = await Promise.all(mapPromises);

  // Reduce 阶段：合并所有总结
  const reducePrompt = `以下是同一章节不同部分的总结：

${summaries.join('\n\n---\n\n')}

请将这些总结合并成一个连贯完整的章节摘要，要求：
1. 字数控制在 200-500 字
2. 包含章节的主要内容和核心观点
3. 突出重要人物、事件或概念
4. 保持逻辑连贯，语言流畅
5. 客观准确，不添加原文没有的内容

章节摘要：`;

  const finalResponse = await llm.invoke(reducePrompt);
  return finalResponse.content as string;
}

/**
 * 简单总结（适用于较短文本，直接使用 LLM）
 */
export async function summarizeShort(
  llm: BaseLanguageModel,
  text: string
): Promise<string> {
  const prompt = `
请总结以下章节内容，要求：
1. 字数控制在 200-500 字
2. 包含主要内容和核心观点
3. 突出重要人物、事件或概念
4. 保持逻辑连贯，语言流畅

章节内容：
${text}

章节摘要：
`;

  const response = await llm.invoke(prompt);
  return response.content as string;
}
