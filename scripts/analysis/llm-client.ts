// scripts/analysis/llm-client.ts
// 通用 LLM 客户端（OpenAI 兼容协议，原生 fetch + 重试逻辑）
// 使用原生 fetch 替代 openai SDK，解决与 DeepSeek API 的兼容性问题

import type { LLMConfig } from "../lib/config";

/** LLM API 认证失败错误（401/403），不可重试，调用方应终止整个策展阶段 */
export class LLMAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMAuthError";
  }
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function classifyError(
  err: unknown,
  httpStatus?: number,
): {
  type: "rate_limit" | "server" | "network" | "timeout" | "auth" | "unknown";
  status: number;
  detail: string;
} {
  const status =
    httpStatus ??
    (err instanceof Error && "status" in err ? (err as unknown as { status: number }).status : 0);

  if (status === 401 || status === 403) {
    return { type: "auth", status, detail: `authentication failed (${status})` };
  }
  if (status === 429) {
    return { type: "rate_limit", status, detail: "rate limited by API" };
  }
  if (status >= 500) {
    return { type: "server", status, detail: `server error ${status}` };
  }

  const message = err instanceof Error ? err.message : String(err);

  if (/ETIMEDOUT|timeout|abort/i.test(message)) {
    return { type: "timeout", status, detail: message };
  }
  if (
    err instanceof TypeError ||
    /premature close|ECONNRESET|ECONNREFUSED|fetch failed|socket hang up|UND_ERR_SOCKET/i.test(
      message,
    )
  ) {
    return { type: "network", status, detail: message };
  }

  return { type: "unknown", status, detail: message };
}

export function createLLMClient(config: LLMConfig) {
  const endpoint = `${config.baseURL.replace(/\/+$/, "")}/chat/completions`;

  return {
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
      const maxRetries = 5;
      const inputChars = systemPrompt.length + userPrompt.length;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const startTime = Date.now();
        let httpStatus: number | undefined;
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              temperature: 0.2,
              max_tokens: 4096,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
            signal: AbortSignal.timeout(120_000),
          });

          httpStatus = res.status;

          if (!res.ok) {
            const body = await res.text().catch(() => "(unreadable)");
            throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
          }

          const json = (await res.json()) as ChatCompletionResponse;
          const content = json.choices?.[0]?.message?.content ?? "";
          const finishReason = json.choices?.[0]?.finish_reason;

          if (finishReason === "length") {
            throw new Error(
              `LLM output truncated (finish_reason=length, tokens=${json.usage?.completion_tokens ?? "?"})`,
            );
          }

          const elapsed = Date.now() - startTime;
          if (attempt > 1) {
            console.log(`  LLM API succeeded on attempt ${attempt} (${elapsed}ms)`);
          }
          return content;
        } catch (err: unknown) {
          const elapsed = Date.now() - startTime;
          const { type, status, detail } = classifyError(err, httpStatus);

          console.warn(
            `  LLM API attempt ${attempt}/${maxRetries} failed [type=${type}, status=${status}, elapsed=${elapsed}ms, inputChars=${inputChars}]: ${detail}`,
          );

          // 认证失败不可重试，抛出专用错误以便调用方终止整个阶段
          if (type === "auth") {
            throw new LLMAuthError(`LLM API 认证失败 (HTTP ${status}): ${detail}`);
          }

          if (attempt === maxRetries) throw err;

          const isRetryable = type !== "unknown";
          if (!isRetryable) throw err;

          const baseDelay = type === "rate_limit" ? 5000 : 3000;
          const delay = 2 ** attempt * baseDelay + Math.floor(Math.random() * 1000);
          console.warn(`  Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      throw new Error("LLM API: max retries exceeded");
    },
  };
}
