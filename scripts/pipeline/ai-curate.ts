// scripts/pipeline/ai-curate.ts
// Stage 4: LLM 智能策展
// 筛选 composite >= 50 且 pushedAt > lastAnalyzedAt 的仓库
// 获取 README，调用配置的 LLM API，更新 curation 字段
// 支持批量处理，可配置批次大小

import type { CurationData, RepositoryData } from "@gitpulse/shared";
import type { EnrichedRepo } from "@gitpulse/shared";
import { generateFallbackCuration } from "../analysis/fallback";
import { createLLMClient } from "../analysis/llm-client";
import { PROMPT_VERSION, SYSTEM_PROMPT, buildUserPrompt } from "../analysis/prompt";
import { parseLLMOutput } from "../analysis/schema";
import { GitHubApiClient } from "../github/api-client";
import { RateLimiter } from "../github/rate-limiter";
import type { PipelineConfig } from "../lib/config";
import { readRepositories, writeRepositories } from "../lib/data-io";

/** 阶段结果 */
export interface AiCurateResult {
  /** 候选仓库数（满足筛选条件） */
  candidates: number;
  /** LLM 分析成功数 */
  llmSuccess: number;
  /** LLM 分析失败，使用后备策略 */
  fallbackUsed: number;
  /** 跳过的仓库数 */
  skipped: number;
}

/**
 * 执行 Stage 4: LLM 智能策展
 * 筛选条件：composite >= 50 AND pushedAt > lastAnalyzedAt
 */
export async function aiCurate(config: PipelineConfig): Promise<AiCurateResult> {
  const repos = readRepositories();
  const llmClient = createLLMClient(config.llm);
  const rateLimiter = new RateLimiter();
  const apiClient = new GitHubApiClient(config.githubToken, rateLimiter);

  // 筛选候选仓库
  const candidates = repos.filter((repo) => {
    // composite >= 50
    if (repo.scores.composite < 50) return false;
    // pushedAt > lastAnalyzedAt（首次分析或有新更新）
    if (!repo.pushedAt) return false;
    if (!repo.lastAnalyzedAt) return true;
    return new Date(repo.pushedAt) > new Date(repo.lastAnalyzedAt);
  });

  console.log(`[AiCurate] 筛选出 ${candidates.length} 个候选仓库（composite >= 50 且有更新）`);

  let llmSuccess = 0;
  let fallbackUsed = 0;
  const skipped = 0;
  const now = new Date().toISOString();
  const batchSize = config.llmEvalBatchSize;

  // 批量处理
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    console.log(
      `[AiCurate] 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(candidates.length / batchSize)} (${batch.length} 个仓库)`,
    );

    for (let j = 0; j < batch.length; j++) {
      const repo = batch[j];

      // 请求间隔 1.5 秒，避免触发 DeepSeek 隐性频率限制
      if (j > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      try {
        // 获取 README 内容
        const readme = await apiClient.fetchReadme(
          repo.owner,
          repo.name,
          config.readmeTruncateChars,
        );

        if (!readme) {
          console.warn(`[AiCurate] 无法获取 README: ${repo.fullName}，使用后备策略`);
          repo.curation = generateFallbackCurationFromRepo(repo);
          repo.categorySlug = repo.curation.categorySlug;
          repo.lastAnalyzedAt = now;
          fallbackUsed++;
          continue;
        }

        // 构建 EnrichedRepo 用于 prompt 构建
        const enriched = repoDataToEnriched(repo);

        // 构建 prompt
        const userPrompt = buildUserPrompt(enriched, readme, config.readmeTruncateChars);

        // 调用 LLM
        const rawResponse = await llmClient.analyze(SYSTEM_PROMPT, userPrompt);

        // 解析并验证 LLM 输出
        const llmOutput = parseLLMOutput(rawResponse);

        // 计算综合评分
        const llmScore = Math.round(
          ((llmOutput.noveltyScore +
            llmOutput.clarityScore +
            llmOutput.productionScore +
            llmOutput.categoryFitScore) /
            4) *
            10,
        );

        // 构建 CurationData
        const curation: CurationData = {
          ...llmOutput,
          ruleScore: repo.scores.composite,
          llmScore,
          compositeScore: Math.round((repo.scores.composite + llmScore) / 2),
          modelUsed: config.llm.model,
          promptVersion: PROMPT_VERSION,
          isFallback: false,
          tokensInput: null,
          tokensOutput: null,
          evaluatedAt: now,
        };

        repo.curation = curation;
        repo.categorySlug = curation.categorySlug;
        repo.lastAnalyzedAt = now;
        llmSuccess++;

        console.log(
          `[AiCurate] LLM 分析成功: ${repo.fullName} (category=${curation.categorySlug})`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errName = err instanceof Error ? err.constructor.name : typeof err;
        const status =
          err instanceof Error && "status" in err
            ? (err as unknown as { status: number }).status
            : "N/A";
        console.error(
          `[AiCurate] LLM 分析失败: ${repo.fullName} [error=${errName}, status=${status}] - ${message}`,
        );

        // 使用后备策略
        repo.curation = generateFallbackCurationFromRepo(repo);
        repo.categorySlug = repo.curation.categorySlug;
        repo.lastAnalyzedAt = now;
        fallbackUsed++;
      }
    }

    // 批次间保存进度
    writeRepositories(repos);
    console.log("[AiCurate] 批次完成，已保存进度");
  }

  // 最终写入
  writeRepositories(repos);

  const result: AiCurateResult = {
    candidates: candidates.length,
    llmSuccess,
    fallbackUsed,
    skipped,
  };

  console.log(
    `[AiCurate] 完成: 候选 ${result.candidates}, LLM 成功 ${result.llmSuccess}, 后备 ${result.fallbackUsed}, 跳过 ${result.skipped}`,
  );

  return result;
}

/**
 * 从 RepositoryData 生成后备 CurationData
 * 通过构建临时 EnrichedRepo 调用 fallback 模块
 */
function generateFallbackCurationFromRepo(repo: RepositoryData): CurationData {
  const enriched = repoDataToEnriched(repo);
  return generateFallbackCuration(enriched);
}

/** 将 RepositoryData 转换为 EnrichedRepo（用于分析模块调用） */
function repoDataToEnriched(repo: RepositoryData): EnrichedRepo {
  return {
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    language: repo.language,
    languageColor: repo.languageColor,
    stars: repo.stars,
    forks: repo.forks,
    starsGained: null,
    forksGained: null,
    url: repo.url,
    trendingSince: repo.trendingSince,
    trendingLanguage: repo.trendingLanguage,
    homepageUrl: repo.homepageUrl,
    topics: repo.topics,
    licenseSpdx: repo.licenseSpdx,
    licenseName: repo.licenseName,
    isFork: repo.isFork,
    isArchived: repo.isArchived,
    defaultBranch: repo.defaultBranch,
    openIssues: repo.openIssues,
    watchers: repo.watchers,
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
    githubUpdatedAt: repo.githubUpdatedAt,
    contributorCount: repo.contributorCount,
    readmeSizeBytes: repo.readmeSizeBytes,
    releasesLast6m: repo.releasesLast6m,
    avgIssueCloseDays: repo.avgIssueCloseDays,
    healthPercentage: repo.healthPercentage,
    badges: { ...repo.badges },
  };
}