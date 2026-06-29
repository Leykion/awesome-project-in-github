// scripts/test-llm.ts
// 手动测试 LLM 评估：使用配置的 LLM API 分析示例仓库

import type { EnrichedRepo } from "@gitpulse/shared";
import { createLLMClient } from "./analysis/llm-client";
import { SYSTEM_PROMPT, buildUserPrompt } from "./analysis/prompt";
import { loadConfig } from "./lib/config";

async function main() {
  console.log("[TestLLM] 开始测试 LLM 评估...\n");

  const config = loadConfig();
  const client = createLLMClient(config.llm);

  console.log("[TestLLM] LLM 配置:");
  console.log(`  Base URL: ${config.llm.baseURL}`);
  console.log(`  Model: ${config.llm.model}\n`);

  // 示例仓库数据
  const sampleRepo: EnrichedRepo = {
    owner: "langchain-ai",
    name: "langchain",
    fullName: "langchain-ai/langchain",
    description: "Build context-aware reasoning applications",
    language: "Python",
    languageColor: "#3572A5",
    stars: 98000,
    forks: 15000,
    starsGained: 450,
    forksGained: 32,
    url: "https://github.com/langchain-ai/langchain",
    trendingSince: new Date().toISOString(),
    trendingLanguage: "Python",
    id: 123456,
    homepageUrl: "https://docs.langchain.com",
    topics: ["llm", "langchain", "ai", "machine-learning"],
    licenseSpdx: "MIT",
    licenseName: "MIT License",
    isFork: false,
    isArchived: false,
    defaultBranch: "main",
    openIssues: 200,
    watchers: 1500,
    createdAt: "2022-10-01T00:00:00Z",
    pushedAt: new Date().toISOString(),
    githubUpdatedAt: new Date().toISOString(),
    contributorCount: 500,
    readmeSizeBytes: 15000,
    releasesLast6m: 12,
    avgIssueCloseDays: 2,
    healthPercentage: 95,
    badges: {
      hasExamples: true,
      hasCi: true,
      hasReleases: true,
      hasTests: true,
      hasDocker: true,
      hasPypi: true,
      hasNpm: false,
      hasMcp: false,
    },
  };

  const sampleReadme =
    "# LangChain\n\nLangChain is a framework for developing applications powered by large language models (LLMs).";
  const userPrompt = buildUserPrompt(sampleRepo, sampleReadme, config.readmeTruncateChars);

  console.log("[TestLLM] 发送分析请求...\n");

  const result = await client.analyze(SYSTEM_PROMPT, userPrompt);

  console.log("[TestLLM] LLM 响应:");
  console.log(result);
  console.log("\n[TestLLM] 测试完成");
}

main().catch((err) => {
  console.error("[TestLLM] 执行失败:", err);
  process.exit(1);
});
