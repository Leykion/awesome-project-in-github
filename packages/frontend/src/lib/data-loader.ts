// packages/frontend/src/lib/data-loader.ts
// 构建时从 data/ 目录加载 JSON 数据的辅助函数
// 注意：Vite 要求动态 import 的路径以 ./ 或 ../ 字面量开头，不能以变量开头，
// 因此这里必须使用完整的字面量路径，不能抽取公共前缀常量

import type {
  CategoryData,
  FeaturedCollectionData,
  RepositoryData,
  SiteStatsData,
  StarHistoryEntry,
  TrendingSnapshotData,
} from "@gitpulse/shared";

export async function loadRepositories(): Promise<RepositoryData[]> {
  try {
    return (await import("../../../../data/repositories.json")).default as RepositoryData[];
  } catch {
    console.warn("repositories.json not found, using empty array");
    return [];
  }
}

/** trending 数据按周期的加载器映射（保证 Vite 可静态分析） */
const trendingLoaders = {
  daily: () => import("../../../../data/trending-daily.json"),
  weekly: () => import("../../../../data/trending-weekly.json"),
  monthly: () => import("../../../../data/trending-monthly.json"),
} as const;

export async function loadTrending(
  since: "daily" | "weekly" | "monthly",
): Promise<TrendingSnapshotData[]> {
  try {
    return (await trendingLoaders[since]()).default as unknown as TrendingSnapshotData[];
  } catch {
    console.warn(`trending-${since}.json not found, using empty array`);
    return [];
  }
}

export async function loadCategories(): Promise<CategoryData[]> {
  try {
    return (await import("../../../../data/categories.json")).default as CategoryData[];
  } catch {
    console.warn("categories.json not found, using empty array");
    return [];
  }
}

export async function loadFeaturedCollections(): Promise<FeaturedCollectionData[]> {
  try {
    return (await import("../../../../data/featured-collections.json"))
      .default as unknown as FeaturedCollectionData[];
  } catch {
    console.warn("featured-collections.json not found, using empty array");
    return [];
  }
}

export async function loadStarHistory(): Promise<Record<string, StarHistoryEntry[]>> {
  try {
    return (await import("../../../../data/star-history.json")).default as Record<
      string,
      StarHistoryEntry[]
    >;
  } catch {
    console.warn("star-history.json not found, using empty object");
    return {};
  }
}

export async function loadStats(): Promise<SiteStatsData> {
  try {
    return (await import("../../../../data/stats.json")).default as SiteStatsData;
  } catch {
    console.warn("stats.json not found, using defaults");
    return {
      totalReposTracked: 0,
      totalCurations: 0,
      categoryCounts: {},
      languageCounts: {},
      lastSyncAt: null,
      lastCurationAt: null,
      syncHealth: "unhealthy",
    };
  }
}

/** 搜索索引条目 */
export interface SearchIndexEntry {
  id: number;
  fullName: string;
  description: string;
  topics: string;
  language: string;
  categorySlug: string;
  stars: number;
  licenseSpdx: string;
  oneLiner: string;
}

export async function loadSearchIndex(): Promise<SearchIndexEntry[]> {
  try {
    return (await import("../../../../data/search-index.json")).default as SearchIndexEntry[];
  } catch {
    console.warn("search-index.json not found, using empty array");
    return [];
  }
}
