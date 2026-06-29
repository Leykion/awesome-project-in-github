// scripts/lib/config.ts
// 数据管道运行时配置，从环境变量读取

/** LLM 服务配置（支持任意 OpenAI 兼容 API） */
export interface LLMConfig {
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL（OpenAI 兼容端点） */
  baseURL: string;
  /** 模型 ID */
  model: string;
}

export interface PipelineConfig {
  /** GitHub Personal Access Token */
  githubToken: string;
  /** LLM 服务配置 */
  llm: LLMConfig;
  /** 运行环境 */
  environment: "production" | "development";
  /** 抓取的编程语言列表 */
  scrapeLanguages: string[];
  /** LLM 评估最低分数阈值 */
  llmEvalThreshold: number;
  /** LLM 每批评估仓库数 */
  llmEvalBatchSize: number;
  /** README 截断字符数 */
  readmeTruncateChars: number;
}

export function loadConfig(): PipelineConfig {
  const githubToken = process.env.GITHUB_TOKEN;
  const llmApiKey = process.env.LLM_API_KEY;
  const llmBaseURL = process.env.LLM_BASE_URL;
  const llmModel = process.env.LLM_MODEL;

  if (!githubToken) throw new Error("GITHUB_TOKEN environment variable is required");
  if (!llmApiKey) throw new Error("LLM_API_KEY environment variable is required");
  if (!llmBaseURL) throw new Error("LLM_BASE_URL environment variable is required");
  if (!llmModel) throw new Error("LLM_MODEL environment variable is required");

  return {
    githubToken,
    llm: {
      apiKey: llmApiKey,
      baseURL: llmBaseURL,
      model: llmModel,
    },
    environment: (process.env.ENVIRONMENT as "production" | "development") || "production",
    scrapeLanguages: [
      "python",
      "typescript",
      "javascript",
      "rust",
      "go",
      "c++",
      "java",
      "kotlin",
      "swift",
    ],
    llmEvalThreshold: 40,
    llmEvalBatchSize: 20,
    readmeTruncateChars: 3000,
  };
}

// 使用示例：
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.anthropic.com/v1 LLM_MODEL=claude-haiku-4-20250414
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4o-mini
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.deepseek.com/v1 LLM_MODEL=deepseek-chat
// LLM_API_KEY=sk-xxx LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3.2
