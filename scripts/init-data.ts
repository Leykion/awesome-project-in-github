// scripts/init-data.ts
// 初始化 data/ 目录及所有空 JSON 数据文件，每个文件包含符合 schema 的初始结构

import { CATEGORY_SEEDS } from "@gitpulse/shared";
import type { CategoryData, SiteStatsData, SyncLogData } from "@gitpulse/shared";
import { ensureDataDir, writeDataFile } from "./lib/data-io";

// 确保 data/ 目录存在
ensureDataDir();

// repositories.json — 空仓库列表
writeDataFile("repositories.json", []);

// trending-daily.json — 空每日趋势快照
writeDataFile("trending-daily.json", []);

// trending-weekly.json — 空每周趋势快照
writeDataFile("trending-weekly.json", []);

// trending-monthly.json — 空每月趋势快照
writeDataFile("trending-monthly.json", []);

// categories.json — 使用 CATEGORY_SEEDS 种子数据初始化
const categories: CategoryData[] = CATEGORY_SEEDS.map((seed) => ({
  ...seed,
  repoCount: 0,
  topRepos: [],
}));
writeDataFile("categories.json", categories);

// featured-collections.json — 空精选合集列表
writeDataFile("featured-collections.json", []);

// star-history.json — 空星标历史（对象结构）
writeDataFile("star-history.json", {});

// stats.json — 初始统计数据
const stats: SiteStatsData = {
  totalReposTracked: 0,
  totalCurations: 0,
  categoryCounts: {},
  languageCounts: {},
  lastSyncAt: null,
  lastCurationAt: null,
  syncHealth: "unhealthy",
};
writeDataFile("stats.json", stats);

// search-index.json — 空搜索索引
writeDataFile("search-index.json", []);

// sync-log.json — 初始同步日志
const syncLog: SyncLogData = {
  lastRun: "",
  entries: [],
};
writeDataFile("sync-log.json", syncLog);

console.log("data/ 目录初始化完成，已创建所有 JSON 数据文件");
