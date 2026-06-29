// packages/shared/src/types/data-files.ts

import type { CurationData } from "./curation";

/** 分类定义 */
export interface CategoryData {
  slug: string; // URL 友好标识符，如 "llm-frameworks"
  name: string; // 显示名称，如 "LLM Frameworks"
  description: string; // 分类说明文字
  icon: string; // emoji 图标标识
  sortOrder: number; // 前端排序权重（升序）
  repoCount: number; // 该分类下仓库数量
  topRepos: {
    // Top 3 仓库摘要
    fullName: string;
    stars: number;
    starsGained: number;
  }[];
}

/** 仓库完整数据 */
export interface RepositoryData {
  id: number; // GitHub 仓库 ID（全局唯一）
  owner: string; // 仓库所有者
  name: string; // 仓库名称
  fullName: string; // owner/name 格式
  description: string | null; // 仓库描述
  url: string; // html_url
  homepageUrl: string | null; // 项目主页/文档站
  language: string | null; // 主要编程语言
  languageColor: string | null; // 语言颜色值，如 "#3572A5"
  stars: number; // 总 star 数
  forks: number; // 总 fork 数
  openIssues: number; // 开放 issue 数
  watchers: number; // watcher 数
  topics: string[]; // 话题标签列表
  licenseSpdx: string | null; // SPDX 许可证标识符
  licenseName: string | null; // 许可证全名
  isFork: boolean; // 是否为 fork
  isArchived: boolean; // 是否已归档
  defaultBranch: string; // 默认分支名
  createdAt: string | null; // GitHub 仓库创建时间 (ISO 8601)
  pushedAt: string | null; // 最近一次 push 时间 (ISO 8601)
  githubUpdatedAt: string | null; // GitHub 侧最后更新时间

  // 社区指标
  contributorCount: number | null;
  readmeSizeBytes: number | null;
  releasesLast6m: number;
  avgIssueCloseDays: number | null;
  healthPercentage: number | null;

  // 集成能力标记
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

  // 评分
  scores: {
    growth: number; // 增长速度评分 (0-100)
    maturity: number; // 项目成熟度评分 (0-100)
    community: number; // 社区健康度评分 (0-100)
    relevance: number; // AI 相关性评分 (0-100)
    quality: number; // 代码质量评分 (0-100)
    composite: number; // 综合得分 (0-100)
  };
  tier: "star" | "notable" | "tracked"; // 等级：star(>=70) / notable(50-69) / tracked(30-49)

  // 分类
  categorySlug: string | null; // 关联分类 slug

  // AI 策展结果（可选，仅在已分析后存在）
  curation: CurationData | null;

  // 时间戳
  firstSeenAt: string; // 首次收录时间 (ISO 8601)
  lastSyncedAt: string; // 最后同步时间 (ISO 8601)
  lastAnalyzedAt: string | null; // 最后 LLM 分析时间 (ISO 8601)
  trendingSince: string | null; // 开始上榜的时间
  trendingLanguage: string | null; // 在哪个语言的趋势页上出现
}

/** 趋势快照条目 */
export interface TrendingSnapshotData {
  repoId: number; // 关联仓库 ID
  fullName: string; // owner/name（冗余字段，方便前端直接使用）
  snapshotDate: string; // 快照日期 YYYY-MM-DD
  rank: number | null; // 当期排名（1-25，可空）
  starsTotal: number; // 快照时的总 star 数
  starsGained: number | null; // 本周期增长数（可空）
  forksTotal: number; // 快照时的总 fork 数
  forksGained: number | null; // 本周期 fork 增长数（可空）
  language: string | null; // 语言筛选条件（null 表示 all）
  fetchedAt: string; // 抓取时间 (ISO 8601)
}

/** 星标历史条目 */
export interface StarHistoryEntry {
  repoId: number;
  date: string; // YYYY-MM-DD
  starCount: number;
  dailyDelta: number;
}

/** star-history.json 的顶层结构，按仓库 fullName 索引 */
export type StarHistoryData = Record<string, StarHistoryEntry[]>;

/** 精选合集 */
export interface FeaturedCollectionData {
  id: number; // 自增 ID
  title: string; // 合集标题
  slug: string; // URL 友好标识符
  description: string; // 合集说明
  coverEmoji: string; // 封面 emoji
  collectionType: "curated" | "weekly_digest" | "category_top" | "rising";
  isPublished: boolean;
  isPinned: boolean;
  sortOrder: number;
  repos: {
    // 合集包含的仓库列表
    repoId: number;
    fullName: string;
    editorialNote: string | null;
    sortOrder: number;
  }[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  publishedAt: string | null; // ISO 8601
}

/** 全站统计 */
export interface SiteStatsData {
  totalReposTracked: number;
  totalCurations: number;
  categoryCounts: Record<string, number>; // slug -> count
  languageCounts: Record<string, number>; // language -> count
  lastSyncAt: string | null; // ISO 8601
  lastCurationAt: string | null; // ISO 8601
  syncHealth: "healthy" | "degraded" | "unhealthy";
}

/** 同步日志条目 */
export interface SyncLogEntry {
  jobType: "discover" | "snapshot" | "enrich" | "score" | "analyze" | "cleanup" | "collection";
  status: "completed" | "failed" | "partial";
  reposProcessed: number;
  reposFailed: number;
  rateLimitRemaining: number | null;
  errorMessage: string | null;
  durationMs: number;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
}

/** sync-log.json 的顶层结构 */
export interface SyncLogData {
  lastRun: string; // 最近一次完整管道运行时间 (ISO 8601)
  entries: SyncLogEntry[]; // 最近一次运行的各阶段日志
}
