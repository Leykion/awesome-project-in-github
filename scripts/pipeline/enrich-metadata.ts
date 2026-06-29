// scripts/pipeline/enrich-metadata.ts
// Stage 2: 使用 GitHub REST/GraphQL API 补全仓库元数据
// 使用 GraphQL 批量查询（100 repos/query）提高效率
// 更新 stars、forks、issues、topics、贡献者数等字段

import type { EnrichedRepo } from "@gitpulse/shared";
import { GitHubApiClient } from "../github/api-client";
import { RateLimiter } from "../github/rate-limiter";
import type { PipelineConfig } from "../lib/config";
import { readRepositories, writeRepositories } from "../lib/data-io";

/** 阶段结果 */
export interface EnrichMetadataResult {
  /** 处理的仓库总数 */
  totalProcessed: number;
  /** GraphQL 批量更新成功数 */
  graphqlUpdated: number;
  /** REST API 补全成功数 */
  restEnriched: number;
  /** 失败数 */
  failed: number;
  /** 剩余 REST API 配额 */
  rateLimitRemaining: number | null;
}

/**
 * 执行 Stage 2: 补全仓库元数据
 * 1. 使用 GraphQL 批量查询全量刷新基础字段
 * 2. 对新发现的仓库使用 REST API 补全详细元数据（badges 等）
 */
export async function enrichMetadata(config: PipelineConfig): Promise<EnrichMetadataResult> {
  const rateLimiter = new RateLimiter();
  const apiClient = new GitHubApiClient(config.githubToken, rateLimiter);
  const repos = readRepositories();
  const now = new Date().toISOString();

  let graphqlUpdated = 0;
  let restEnriched = 0;
  let failed = 0;

  if (repos.length === 0) {
    console.log("[EnrichMetadata] 无仓库需要处理");
    return {
      totalProcessed: 0,
      graphqlUpdated: 0,
      restEnriched: 0,
      failed: 0,
      rateLimitRemaining: null,
    };
  }

  // 1. GraphQL 批量查询：全量刷新基础字段（stars、forks、issues、topics 等）
  console.log(`[EnrichMetadata] GraphQL 批量查询 ${repos.length} 个仓库...`);
  const fullNames = repos.map((r) => r.fullName);

  try {
    const enrichedFromGraphQL = await apiClient.batchQueryGraphQL(fullNames);
    const enrichedMap = new Map(enrichedFromGraphQL.map((r) => [r.fullName, r]));

    for (const repo of repos) {
      const enriched = enrichedMap.get(repo.fullName);
      if (enriched) {
        // 更新 GraphQL 可获取的字段
        repo.id = enriched.id || repo.id;
        repo.stars = enriched.stars;
        repo.forks = enriched.forks;
        repo.openIssues = enriched.openIssues;
        repo.watchers = enriched.watchers;
        repo.topics = enriched.topics;
        repo.licenseSpdx = enriched.licenseSpdx;
        repo.licenseName = enriched.licenseName;
        repo.isFork = enriched.isFork;
        repo.isArchived = enriched.isArchived;
        repo.defaultBranch = enriched.defaultBranch;
        repo.createdAt = enriched.createdAt;
        repo.pushedAt = enriched.pushedAt;
        repo.githubUpdatedAt = enriched.githubUpdatedAt;
        repo.homepageUrl = enriched.homepageUrl;
        repo.language = enriched.language ?? repo.language;
        repo.languageColor = enriched.languageColor ?? repo.languageColor;
        repo.description = enriched.description ?? repo.description;
        repo.lastSyncedAt = now;
        graphqlUpdated++;
      }
    }

    console.log(`[EnrichMetadata] GraphQL 更新 ${graphqlUpdated} 个仓库`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[EnrichMetadata] GraphQL 批量查询失败: ${message}`);
  }

  // 2. REST API 补全：对需要详细元数据的仓库逐个补全
  // 筛选条件：新发现（id 为 0）或缺少 badges 信息的仓库
  const needsEnrichment = repos.filter(
    (r) => r.id === 0 || r.contributorCount === null || r.releasesLast6m === 0,
  );

  console.log(`[EnrichMetadata] REST API 补全 ${needsEnrichment.length} 个仓库的详细元数据...`);

  for (const repo of needsEnrichment) {
    try {
      // 构建一个临时 EnrichedRepo 用于 enrichRepoMetadata 调用
      const tempEnriched: EnrichedRepo = {
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

      const enriched = await apiClient.enrichRepoMetadata(tempEnriched, config.readmeTruncateChars);

      // 回写补全的字段
      repo.contributorCount = enriched.contributorCount;
      repo.releasesLast6m = enriched.releasesLast6m;
      repo.avgIssueCloseDays = enriched.avgIssueCloseDays;
      repo.readmeSizeBytes = enriched.readmeSizeBytes;
      repo.badges = enriched.badges;
      repo.lastSyncedAt = now;
      restEnriched++;

      // 每 10 个仓库输出一次进度
      if (restEnriched % 10 === 0) {
        console.log(`[EnrichMetadata] REST 进度: ${restEnriched}/${needsEnrichment.length}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[EnrichMetadata] REST 补全失败: ${repo.fullName} - ${message}`);
      failed++;
    }
  }

  writeRepositories(repos);

  const remaining = rateLimiter.getRemaining("rest");

  const result: EnrichMetadataResult = {
    totalProcessed: repos.length,
    graphqlUpdated,
    restEnriched,
    failed,
    rateLimitRemaining: remaining,
  };

  console.log(
    `[EnrichMetadata] 完成: 总计 ${result.totalProcessed}, GraphQL ${result.graphqlUpdated}, REST ${result.restEnriched}, 失败 ${result.failed}`,
  );

  return result;
}
