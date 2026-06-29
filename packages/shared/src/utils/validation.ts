// packages/shared/src/utils/validation.ts
// Zod schema：数据验证

import { z } from "zod";

/** AI 策展结果验证 schema */
export const CurationDataSchema = z.object({
  summary: z.string(),
  whyNotable: z.string(),
  categorySlug: z.string().nullable(),
  subcategory: z.string().nullable(),
  strengths: z.array(z.string()),
  limitations: z.array(z.string()),
  useCases: z.array(z.string()),
  targetAudience: z.string().nullable(),
  comparableProjects: z.array(z.string()),
  noveltyScore: z.number().min(0).max(10),
  clarityScore: z.number().min(0).max(10),
  productionScore: z.number().min(0).max(10),
  categoryFitScore: z.number().min(0).max(10),
  innovationRating: z.number().min(1).max(5).nullable(),
  productionReadiness: z.number().min(1).max(5).nullable(),
  learningCurve: z.enum(["low", "medium", "high"]).nullable(),
  oneLiner: z.string().nullable(),
  ruleScore: z.number(),
  llmScore: z.number().nullable(),
  compositeScore: z.number(),
  modelUsed: z.string(),
  promptVersion: z.string(),
  isFallback: z.boolean(),
  tokensInput: z.number().nullable(),
  tokensOutput: z.number().nullable(),
  evaluatedAt: z.string(),
});

/** LLM 输出验证 schema（LLM 返回的 JSON 部分，不含管道附加字段） */
export const LLMOutputSchema = z.object({
  summary: z.string(),
  whyNotable: z.string(),
  categorySlug: z.string().nullable(),
  subcategory: z.string().nullable(),
  strengths: z.array(z.string()),
  limitations: z.array(z.string()),
  useCases: z.array(z.string()),
  targetAudience: z.string().nullable(),
  comparableProjects: z.array(z.string()),
  noveltyScore: z.number().min(0).max(10),
  clarityScore: z.number().min(0).max(10),
  productionScore: z.number().min(0).max(10),
  categoryFitScore: z.number().min(0).max(10),
  innovationRating: z.number().min(1).max(5).nullable(),
  productionReadiness: z.number().min(1).max(5).nullable(),
  learningCurve: z.enum(["low", "medium", "high"]).nullable(),
  oneLiner: z.string().nullable(),
});

/** 仓库评分验证 schema */
export const ScoresSchema = z.object({
  growth: z.number().min(0).max(100),
  maturity: z.number().min(0).max(100),
  community: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  quality: z.number().min(0).max(100),
  composite: z.number().min(0).max(100),
});

/** 仓库徽章验证 schema */
export const BadgesSchema = z.object({
  hasExamples: z.boolean(),
  hasCi: z.boolean(),
  hasReleases: z.boolean(),
  hasTests: z.boolean(),
  hasDocker: z.boolean(),
  hasPypi: z.boolean(),
  hasNpm: z.boolean(),
  hasMcp: z.boolean(),
});

/** 仓库完整数据验证 schema */
export const RepositoryDataSchema = z.object({
  id: z.number(),
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  homepageUrl: z.string().nullable(),
  language: z.string().nullable(),
  languageColor: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  watchers: z.number(),
  topics: z.array(z.string()),
  licenseSpdx: z.string().nullable(),
  licenseName: z.string().nullable(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  defaultBranch: z.string(),
  createdAt: z.string().nullable(),
  pushedAt: z.string().nullable(),
  githubUpdatedAt: z.string().nullable(),
  contributorCount: z.number().nullable(),
  readmeSizeBytes: z.number().nullable(),
  releasesLast6m: z.number(),
  avgIssueCloseDays: z.number().nullable(),
  healthPercentage: z.number().nullable(),
  badges: BadgesSchema,
  scores: ScoresSchema,
  tier: z.enum(["star", "notable", "tracked"]),
  categorySlug: z.string().nullable(),
  curation: CurationDataSchema.nullable(),
  firstSeenAt: z.string(),
  lastSyncedAt: z.string(),
  lastAnalyzedAt: z.string().nullable(),
  trendingSince: z.string().nullable(),
  trendingLanguage: z.string().nullable(),
});

/** 分类数据验证 schema */
export const CategoryDataSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  sortOrder: z.number(),
  repoCount: z.number(),
  topRepos: z.array(
    z.object({
      fullName: z.string(),
      stars: z.number(),
      starsGained: z.number(),
    }),
  ),
});

/** 趋势快照验证 schema */
export const TrendingSnapshotDataSchema = z.object({
  repoId: z.number(),
  fullName: z.string(),
  snapshotDate: z.string(),
  rank: z.number().nullable(),
  starsTotal: z.number(),
  starsGained: z.number().nullable(),
  forksTotal: z.number(),
  forksGained: z.number().nullable(),
  language: z.string().nullable(),
  fetchedAt: z.string(),
});

/** 星标历史条目验证 schema */
export const StarHistoryEntrySchema = z.object({
  repoId: z.number(),
  date: z.string(),
  starCount: z.number(),
  dailyDelta: z.number(),
});

/** 精选合集验证 schema */
export const FeaturedCollectionDataSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  coverEmoji: z.string(),
  collectionType: z.enum(["curated", "weekly_digest", "category_top", "rising"]),
  isPublished: z.boolean(),
  isPinned: z.boolean(),
  sortOrder: z.number(),
  repos: z.array(
    z.object({
      repoId: z.number(),
      fullName: z.string(),
      editorialNote: z.string().nullable(),
      sortOrder: z.number(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});

/** 全站统计验证 schema */
export const SiteStatsDataSchema = z.object({
  totalReposTracked: z.number(),
  totalCurations: z.number(),
  categoryCounts: z.record(z.number()),
  languageCounts: z.record(z.number()),
  lastSyncAt: z.string().nullable(),
  lastCurationAt: z.string().nullable(),
  syncHealth: z.enum(["healthy", "degraded", "unhealthy"]),
});

/** 同步日志条目验证 schema */
export const SyncLogEntrySchema = z.object({
  jobType: z.enum(["discover", "snapshot", "enrich", "score", "analyze", "cleanup", "collection"]),
  status: z.enum(["completed", "failed", "partial"]),
  reposProcessed: z.number(),
  reposFailed: z.number(),
  rateLimitRemaining: z.number().nullable(),
  errorMessage: z.string().nullable(),
  durationMs: z.number(),
  startedAt: z.string(),
  completedAt: z.string(),
});

/** 同步日志验证 schema */
export const SyncLogDataSchema = z.object({
  lastRun: z.string(),
  entries: z.array(SyncLogEntrySchema),
});
