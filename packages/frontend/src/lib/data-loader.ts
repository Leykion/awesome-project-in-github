// packages/frontend/src/lib/data-loader.ts
// 构建时从 data/ 目录加载 JSON 数据的辅助函数

import type {
  CategoryData,
  FeaturedCollectionData,
  RepositoryData,
  SiteStatsData,
  StarHistoryEntry,
  TrendingSnapshotData,
} from "@gitpulse/shared";

const DATA_DIR = "../../../data";

export async function loadRepositories(): Promise<RepositoryData[]> {
  try {
    return (await import(`${DATA_DIR}/repositories.json`)).default;
  } catch {
    console.warn("repositories.json not found, using empty array");
    return [];
  }
}

export async function loadTrending(
  since: "daily" | "weekly" | "monthly",
): Promise<TrendingSnapshotData[]> {
  try {
    return (await import(`${DATA_DIR}/trending-${since}.json`)).default;
  } catch {
    console.warn(`trending-${since}.json not found, using empty array`);
    return [];
  }
}

export async function loadCategories(): Promise<CategoryData[]> {
  try {
    return (await import(`${DATA_DIR}/categories.json`)).default;
  } catch {
    console.warn("categories.json not found, using empty array");
    return [];
  }
}

export async function loadFeaturedCollections(): Promise<FeaturedCollectionData[]> {
  try {
    return (await import(`${DATA_DIR}/featured-collections.json`)).default;
  } catch {
    console.warn("featured-collections.json not found, using empty array");
    return [];
  }
}

export async function loadStarHistory(): Promise<Record<string, StarHistoryEntry[]>> {
  try {
    return (await import(`${DATA_DIR}/star-history.json`)).default;
  } catch {
    console.warn("star-history.json not found, using empty object");
    return {};
  }
}

export async function loadStats(): Promise<SiteStatsData> {
  try {
    return (await import(`${DATA_DIR}/stats.json`)).default;
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
    return (await import(`${DATA_DIR}/search-index.json`)).default;
  } catch {
    console.warn("search-index.json not found, using empty array");
    return [];
  }
}
