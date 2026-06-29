// packages/shared/src/types/repo.ts
// 数据管道中间类型：ScrapedRepo -> EnrichedRepo -> AnalyzedRepo -> RepositoryData

/** 从 GitHub Trending 页面或 Search API 抓取的原始仓库数据 */
export interface ScrapedRepo {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  starsGained: number | null; // 本周期星标增长（仅 Trending 页面可获取）
  forksGained: number | null; // 本周期 fork 增长
  url: string;
  trendingSince: string | null; // 开始上榜时间
  trendingLanguage: string | null; // 在哪个语言的趋势页上出现
}

/** 经 GitHub REST/GraphQL API 补全元数据后的仓库数据 */
export interface EnrichedRepo extends ScrapedRepo {
  id: number; // GitHub 仓库 ID
  homepageUrl: string | null;
  topics: string[];
  licenseSpdx: string | null;
  licenseName: string | null;
  isFork: boolean;
  isArchived: boolean;
  defaultBranch: string;
  openIssues: number;
  watchers: number;
  createdAt: string | null;
  pushedAt: string | null;
  githubUpdatedAt: string | null;
  contributorCount: number | null;
  readmeSizeBytes: number | null;
  releasesLast6m: number;
  avgIssueCloseDays: number | null;
  healthPercentage: number | null;
  badges: {
    hasExamples: boolean;
    hasCi: boolean;
    hasReleases: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasPypi: boolean;
    hasNpm: boolean;
    hasMcp: boolean;
  };
}

/** 经评分引擎和 AI 分析后的完整仓库数据 */
export type AnalyzedRepo = EnrichedRepo & {
  scores: {
    growth: number;
    maturity: number;
    community: number;
    relevance: number;
    quality: number;
    composite: number;
  };
  tier: "star" | "notable" | "tracked";
  categorySlug: string | null;
};
