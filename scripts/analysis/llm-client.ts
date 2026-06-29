// scripts/analysis/llm-client.ts
// 通用 LLM 客户端（OpenAI 兼容协议，重试逻辑）

import OpenAI from "openai";
import type { LLMConfig } from "../lib/config";

export function createLLMClient(config: LLMConfig) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 60_000,
    maxRetries: 0,
  });

  return {
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            temperature: 0.2,
            max_tokens: 1024,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });
          return response.choices[0]?.message?.content ?? "";
        } catch (err: unknown) {
          if (attempt === maxRetries) throw err;
          const status =
            err instanceof Error && "status" in err
              ? (err as unknown as { status: number }).status
              : 0;
          const isRateLimit = status === 429;
          const isServer = status >= 500;
          const isNetwork =
            err instanceof TypeError ||
            (err instanceof Error &&
              /premature close|ECONNRESET|ETIMEDOUT|fetch failed/i.test(err.message));
          if (!isRateLimit && !isServer && !isNetwork) throw err;
          const delay = 2 ** attempt * 3000;
          console.warn(`LLM API attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      throw new Error("LLM API: max retries exceeded");
    },
  };
}
