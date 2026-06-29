// scripts/pipeline/cleanup-stale.ts
// Stage 6: 30 天滚动数据清理
// - 移除 composite < 30 且超过 30 天未在趋势页出现的仓库
// - 清理过期星标历史条目
// - 保留最近 100 条同步日志

import type { PipelineConfig } from "../lib/config";
import {
  readRepositories,
  readStarHistory,
  readSyncLog,
  readTrending,
  writeRepositories,
  writeStarHistory,
  writeSyncLog,
} from "../lib/data-io";

/** 数据保留策略常量 */
const STALE_DAYS = 30;
const STALE_SCORE_THRESHOLD = 30;
const STAR_HISTORY_RETENTION_DAYS = 90;
const MAX_SYNC_LOG_ENTRIES = 100;

/** 阶段结果 */
export interface CleanupStaleResult {
  /** 清理的仓库数 */
  removedRepos: number;
  /** 清理的星标历史条目数 */
  removedStarEntries: number;
  /** 清理的同步日志条目数 */
  removedLogEntries: number;
  /** 清理后剩余仓库数 */
  remainingRepos: number;
}

/**
 * 执行 Stage 6: 30 天滚动数据清理
 */
export async function cleanupStale(_config: PipelineConfig): Promise<CleanupStaleResult> {
  const now = Date.now();
  const staleCutoff = now - STALE_DAYS * 24 * 60 * 60 * 1000;
  const starHistoryCutoff = now - STAR_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  // 1. 清理低评分且长期不在趋势的仓库
  const repos = readRepositories();
  const initialCount = repos.length;

  // 收集当前趋势仓库名单（所有时间维度）
  const trendingNames = new Set<string>();
  for (const since of ["daily", "weekly", "monthly"] as const) {
    const trending = readTrending(since);
    for (const t of trending) {
      trendingNames.add(t.fullName);
    }
  }

  // 过滤：保留评分 >= 30 或在趋势中出现或近 30 天内首次收录的仓库
  const filteredRepos = repos.filter((repo) => {
    // 评分达标，保留
    if (repo.scores.composite >= STALE_SCORE_THRESHOLD) return true;

    // 当前在趋势中，保留
    if (trendingNames.has(repo.fullName)) return true;

    // 首次收录不满 30 天，保留（给新仓库缓冲期）
    if (repo.firstSeenAt) {
      const firstSeen = new Date(repo.firstSeenAt).getTime();
      if (firstSeen > staleCutoff) return true;
    }

    // 不满足保留条件，清理
    return false;
  });

  const removedRepos = initialCount - filteredRepos.length;
  if (removedRepos > 0) {
    writeRepositories(filteredRepos);
    console.log(`[Cleanup] 清理 ${removedRepos} 个低评分仓库`);
  }

  // 2. 清理过期星标历史条目
  const starHistory = readStarHistory();
  let removedStarEntries = 0;

  // 收集被清理的仓库名单
  const removedNames = new Set(
    repos
      .filter((r) => !filteredRepos.some((f) => f.fullName === r.fullName))
      .map((r) => r.fullName),
  );

  for (const fullName of Object.keys(starHistory)) {
    // 删除已清理仓库的历史
    if (removedNames.has(fullName)) {
      const count = starHistory[fullName].length;
      removedStarEntries += count;
      delete starHistory[fullName];
      continue;
    }

    // 清理超过保留期的条目
    const entries = starHistory[fullName];
    const filtered = entries.filter((entry) => {
      const entryDate = new Date(entry.date).getTime();
      return entryDate > starHistoryCutoff;
    });

    if (filtered.length < entries.length) {
      removedStarEntries += entries.length - filtered.length;
      starHistory[fullName] = filtered;
    }

    // 如果该仓库的历史全部清理完，删除整个键
    if (starHistory[fullName].length === 0) {
      delete starHistory[fullName];
    }
  }

  if (removedStarEntries > 0) {
    writeStarHistory(starHistory);
    console.log(`[Cleanup] 清理 ${removedStarEntries} 条星标历史`);
  }

  // 3. 保留最近 100 条同步日志
  const syncLog = readSyncLog();
  let removedLogEntries = 0;

  if (syncLog.entries.length > MAX_SYNC_LOG_ENTRIES) {
    removedLogEntries = syncLog.entries.length - MAX_SYNC_LOG_ENTRIES;
    // 按时间排序，保留最新的
    syncLog.entries.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    syncLog.entries = syncLog.entries.slice(0, MAX_SYNC_LOG_ENTRIES);
    writeSyncLog(syncLog);
    console.log(`[Cleanup] 清理 ${removedLogEntries} 条同步日志`);
  }

  const result: CleanupStaleResult = {
    removedRepos,
    removedStarEntries,
    removedLogEntries,
    remainingRepos: filteredRepos.length,
  };

  console.log(
    `[Cleanup] 完成: 清理仓库 ${result.removedRepos}, 星标历史 ${result.removedStarEntries}, 日志 ${result.removedLogEntries}, 剩余 ${result.remainingRepos}`,
  );

  return result;
}
