// scripts/lib/data-io.ts
// JSON 数据文件读写封装

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  CategoryData,
  FeaturedCollectionData,
  RepositoryData,
  SiteStatsData,
  StarHistoryData,
  SyncLogData,
  TrendingSnapshotData,
} from "@gitpulse/shared";

const DATA_DIR = join(import.meta.dirname, "../../data");

/** 确保 data/ 目录存在 */
export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** 读取 JSON 数据文件，文件不存在时返回 fallback */
export function readDataFile<T>(filename: string, fallback: T): T {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) return fallback;
  try {
    const raw = readFileSync(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`Failed to parse ${filename}, using fallback`);
    return fallback;
  }
}

/** 写入 JSON 数据文件（格式化输出，便于 Git diff） */
export function writeDataFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

/** 读取仓库列表 */
export function readRepositories(): RepositoryData[] {
  return readDataFile("repositories.json", []);
}

/** 写入仓库列表 */
export function writeRepositories(repos: RepositoryData[]): void {
  writeDataFile("repositories.json", repos);
}

/** 读取趋势快照 */
export function readTrending(since: "daily" | "weekly" | "monthly"): TrendingSnapshotData[] {
  return readDataFile(`trending-${since}.json`, []);
}

/** 写入趋势快照 */
export function writeTrending(
  since: "daily" | "weekly" | "monthly",
  data: TrendingSnapshotData[],
): void {
  writeDataFile(`trending-${since}.json`, data);
}

/** 读取星标历史 */
export function readStarHistory(): StarHistoryData {
  return readDataFile("star-history.json", {});
}

/** 写入星标历史 */
export function writeStarHistory(data: StarHistoryData): void {
  writeDataFile("star-history.json", data);
}

/** 读取分类 */
export function readCategories(): CategoryData[] {
  return readDataFile("categories.json", []);
}

/** 写入分类 */
export function writeCategories(data: CategoryData[]): void {
  writeDataFile("categories.json", data);
}

/** 读取精选合集 */
export function readFeaturedCollections(): FeaturedCollectionData[] {
  return readDataFile("featured-collections.json", []);
}

/** 写入精选合集 */
export function writeFeaturedCollections(data: FeaturedCollectionData[]): void {
  writeDataFile("featured-collections.json", data);
}

/** 读取统计 */
export function readStats(): SiteStatsData {
  return readDataFile("stats.json", {
    totalReposTracked: 0,
    totalCurations: 0,
    categoryCounts: {},
    languageCounts: {},
    lastSyncAt: null,
    lastCurationAt: null,
    syncHealth: "unhealthy",
  });
}

/** 写入统计 */
export function writeStats(data: SiteStatsData): void {
  writeDataFile("stats.json", data);
}

/** 读取同步日志 */
export function readSyncLog(): SyncLogData {
  return readDataFile("sync-log.json", { lastRun: "", entries: [] });
}

/** 写入同步日志 */
export function writeSyncLog(data: SyncLogData): void {
  writeDataFile("sync-log.json", data);
}
