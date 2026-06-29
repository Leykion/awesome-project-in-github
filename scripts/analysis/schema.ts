// scripts/analysis/schema.ts
// Zod 输出验证 schema，用于验证 LLM 返回的 JSON 结构
// 导入共享包中已定义的 LLMOutputSchema 并重新导出

import { LLMOutputSchema } from "@gitpulse/shared";
import type { z } from "zod";

/** LLM 原始输出验证 schema（从共享包导入） */
export { LLMOutputSchema };

/** LLM 输出类型 */
export type LLMOutput = z.infer<typeof LLMOutputSchema>;

/**
 * 解析并验证 LLM 返回的 JSON 字符串
 * 尝试从原始文本中提取 JSON，处理可能的 markdown 代码块包裹
 */
export function parseLLMOutput(raw: string): LLMOutput {
  // 移除可能的 markdown 代码块包裹
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  // 解析 JSON
  const parsed: unknown = JSON.parse(jsonStr);

  // 使用 Zod schema 验证结构
  return LLMOutputSchema.parse(parsed);
}
