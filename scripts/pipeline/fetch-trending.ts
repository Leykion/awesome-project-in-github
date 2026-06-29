// scripts/pipeline/fetch-trending.ts
// Stage 1: 发现新仓库 — GitHub Search API + Trending HTML 抓取
// 处理所有语言和时间维度（daily/weekly/monthly）
// 先尝试 cheerio 抓取，失败回退到 Search API
// 跨数据源去重

import type { ScrapedRepo, TrendingSnapshotData } from "@gitpulse/shared";
import { SCRAPE_LANGUAGES } from "@gitpulse/shared";
import { RateLimiter } from "../github/rate-limiter";
import { scrapeTrending } from "../github/scraper";
import { searchAIRepos } from "../github/search-api";
import type { PipelineConfig } from "../lib/config";
import { readRepositories, writeRepositories, writeTrending } from "../lib/data-io";

/** 时间维度列表 */
const TIME_DIMENSIONS = ["daily", "weekly", "monthly"] as const;

/** 阶段结果 */
export interface FetchTrendingResult {
  /** 发现的总仓库数 */
  totalDiscovered: number;
  /** 去重后的仓库数 */
  uniqueRepos: number;
  /** 新增仓库数（首次收录） */
  newRepos: number;
  /** 失败的抓取任务数 */
  failedFetches: number;
}

/**
 * 执行 Stage 1: 发现新仓库
 * 一次性处理所有语言和所有时间维度
 * 先尝试 cheerio 抓取，失败回退到 Search API
 * 去重后合并到 repositories.json
 */
export async function fetchTrending(config: PipelineConfig): Promise<FetchTrendingResult> {
  const rateLimiter = new RateLimiter();
  const allScraped: ScrapedRepo[] = [];
  let failedFetches = 0;

  // 构建语言列表：all + 配置的语言
  const languages: (string | null)[] = [null, ...SCRAPE_LANGUAGES];

  // 遍历所有语言和时间维度
  for (const lang of languages) {
    for (const since of TIME_DIMENSIONS) {
      const langLabel = lang ?? "all";
      console.log(`[FetchTrending] 处理 language=${langLabel} since=${since}`);

      // 先尝试 cheerio 抓取
      let repos = await scrapeTrending(lang, since);

      if (!repos || repos.length === 0) {
        // 回退到 Search API
        console.log(
          `[FetchTrending] cheerio 抓取失败，回退到 Search API: language=${langLabel} since=${since}`,
        );
        try {
          repos = await searchAIRepos(config.githubToken, rateLimiter, {
            language: lang,
            since,
            minStars: 50,
            perPage: 100,
            maxPages: 2,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[FetchTrending] Search API 也失败: ${message}`);
          failedFetches++;
          continue;
        }
      }

      if (repos && repos.length > 0) {
        allScraped.push(...repos);
      }
    }
  }

  console.log(`[FetchTrending] 总计抓取 ${allScraped.length} 条记录（含重复）`);

  // 跨数据源去重：以 fullName 为主键
  const deduped = deduplicateRepos(allScraped);
  console.log(`[FetchTrending] 去重后 ${deduped.length} 个唯一仓库`);

  // 写入趋势快照
  const now = new Date();
  const snapshotDate = now.toISOString().split("T")[0];

  for (const since of TIME_DIMENSIONS) {
    const snapshots: TrendingSnapshotData[] = deduped.map((repo, idx) => ({
      repoId: repo.stars, // 临时 ID，enrich 阶段会更新为真实 GitHub ID
      fullName: repo.fullName,
      snapshotDate,
      rank: idx + 1,
      starsTotal: repo.stars,
      starsGained: repo.starsGained,
      forksTotal: repo.forks,
      forksGained: repo.forksGained,
      language: repo.trendingLanguage,
      fetchedAt: now.toISOString(),
    }));
    writeTrending(since, snapshots);
  }

  // 合并到 repositories.json
  const existing = readRepositories();
  const existingMap = new Map(existing.map((r) => [r.fullName, r]));
  let newRepos = 0;

  for (const scraped of deduped) {
    if (!existingMap.has(scraped.fullName)) {
      newRepos++;
      // 新仓库：创建初始 RepositoryData（评分等在后续阶段补充）
      existing.push({
        id: 0, // 临时 ID，enrich 阶段会更新
        owner: scraped.owner,
        name: scraped.name,
        fullName: scraped.fullName,
        description: scraped.description,
        url: scraped.url,
        homepageUrl: null,
        language: scraped.language,
        languageColor: scraped.languageColor,
        stars: scraped.stars,
        forks: scraped.forks,
        openIssues: 0,
        watchers: 0,
        topics: [],
        licenseSpdx: null,
        licenseName: null,
        isFork: false,
        isArchived: false,
        defaultBranch: "main",
        createdAt: null,
        pushedAt: null,
        githubUpdatedAt: null,
        contributorCount: null,
        readmeSizeBytes: null,
        releasesLast6m: 0,
        avgIssueCloseDays: null,
        healthPercentage: null,
        badges: {
          hasExamples: false,
          hasCi: false,
          hasReleases: false,
          hasTests: false,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        scores: {
          growth: 0,
          maturity: 0,
          community: 0,
          relevance: 0,
          quality: 0,
          composite: 0,
        },
        tier: "tracked",
        categorySlug: null,
        curation: null,
        firstSeenAt: now.toISOString(),
        lastSyncedAt: now.toISOString(),
        lastAnalyzedAt: null,
        trendingSince: scraped.trendingSince,
        trendingLanguage: scraped.trendingLanguage,
      });
    } else {
      // 已存在：更新趋势信息
      const repo = existingMap.get(scraped.fullName);
      if (repo) {
        repo.stars = scraped.stars;
        repo.forks = scraped.forks;
        repo.trendingSince = scraped.trendingSince ?? repo.trendingSince;
        repo.trendingLanguage = scraped.trendingLanguage ?? repo.trendingLanguage;
        repo.lastSyncedAt = now.toISOString();
      }
    }
  }

  writeRepositories(existing);

  const result: FetchTrendingResult = {
    totalDiscovered: allScraped.length,
    uniqueRepos: deduped.length,
    newRepos,
    failedFetches,
  };

  console.log(
    `[FetchTrending] 完成: 发现 ${result.totalDiscovered} 条, 去重 ${result.uniqueRepos} 个, 新增 ${result.newRepos} 个, 失败 ${result.failedFetches} 个`,
  );

  return result;
}

/**
 * 跨数据源去重：以 fullName 为主键
 * 保留星标增长信息（优先保留 Trending 页面的 starsGained）
 */
function deduplicateRepos(repos: ScrapedRepo[]): ScrapedRepo[] {
  const map = new Map<string, ScrapedRepo>();

  for (const repo of repos) {
    const existing = map.get(repo.fullName);
    if (!existing) {
      map.set(repo.fullName, repo);
    } else {
      // 合并：优先保留有 starsGained 的记录
      if (repo.starsGained !== null && existing.starsGained === null) {
        map.set(repo.fullName, { ...existing, starsGained: repo.starsGained });
      }
      // 保留更高的星标数
      if (repo.stars > existing.stars) {
        const current = map.get(repo.fullName);
        if (current) {
          map.set(repo.fullName, { ...current, stars: repo.stars });
        }
      }
    }
  }

  return Array.from(map.values());
}
