// scripts/pipeline.ts
// 数据管道编排器
// 按序执行 7 个阶段：fetch -> enrich -> score -> curate -> collections -> cleanup -> search-index
// 记录每个阶段的耗时和结果，写入 sync-log.json 和 stats.json

import type { SyncLogData, SyncLogEntry } from "@gitpulse/shared";
import { loadConfig } from "./lib/config";
import {
  readCategories,
  readRepositories,
  readStats,
  readSyncLog,
  readTrending,
  writeCategories,
  writeStats,
  writeSyncLog,
} from "./lib/data-io";
import { aiCurate } from "./pipeline/ai-curate";
import { buildSearchIndex } from "./pipeline/build-search-index";
import { cleanupStale } from "./pipeline/cleanup-stale";
import { enrichMetadata } from "./pipeline/enrich-metadata";
import { fetchTrending } from "./pipeline/fetch-trending";
import { generateCollections } from "./pipeline/generate-collections";
import { scoreRepos } from "./pipeline/score-repos";

/** 管道阶段定义 */
interface PipelineStage {
  name: string;
  jobType: SyncLogEntry["jobType"];
  execute: () => Promise<{ processed: number; failed: number }>;
}

/**
 * 执行完整数据管道
 */
async function runPipeline(): Promise<void> {
  const startTime = Date.now();
  const config = loadConfig();
  const logEntries: SyncLogEntry[] = [];

  console.log("========================================");
  console.log("[Pipeline] 开始执行数据管道");
  console.log(`[Pipeline] 时间: ${new Date().toISOString()}`);
  console.log(`[Pipeline] 环境: ${config.environment}`);
  console.log("========================================\n");

  // 定义 7 个管道阶段
  const stages: PipelineStage[] = [
    {
      name: "Stage 1: 发现新仓库 (fetch-trending)",
      jobType: "discover",
      execute: async () => {
        const result = await fetchTrending(config);
        return { processed: result.uniqueRepos, failed: result.failedFetches };
      },
    },
    {
      name: "Stage 2: 补全元数据 (enrich-metadata)",
      jobType: "enrich",
      execute: async () => {
        const result = await enrichMetadata(config);
        return { processed: result.totalProcessed, failed: result.failed };
      },
    },
    {
      name: "Stage 3: 规则评分 (score-repos)",
      jobType: "score",
      execute: async () => {
        const result = await scoreRepos(config);
        return { processed: result.scored, failed: result.excluded };
      },
    },
    {
      name: "Stage 4: LLM 智能策展 (ai-curate)",
      jobType: "analyze",
      execute: async () => {
        const result = await aiCurate(config);
        return { processed: result.llmSuccess + result.fallbackUsed, failed: result.skipped };
      },
    },
    {
      name: "Stage 5: 生成精选合集 (generate-collections)",
      jobType: "collection",
      execute: async () => {
        const result = await generateCollections(config);
        return { processed: result.generated, failed: 0 };
      },
    },
    {
      name: "Stage 6: 清理过期数据 (cleanup-stale)",
      jobType: "cleanup",
      execute: async () => {
        const result = await cleanupStale(config);
        return { processed: result.removedRepos, failed: 0 };
      },
    },
    {
      name: "Stage 7: 构建搜索索引 (build-search-index)",
      jobType: "discover", // 复用 discover 类型，因为 SyncLogEntry 无 search-index 类型
      execute: async () => {
        buildSearchIndex();
        const repos = readRepositories();
        return { processed: repos.length, failed: 0 };
      },
    },
  ];

  // 按序执行各阶段
  for (const stage of stages) {
    console.log(`\n--- ${stage.name} ---`);
    const stageStart = Date.now();

    try {
      const result = await stage.execute();
      const durationMs = Date.now() - stageStart;

      const entry: SyncLogEntry = {
        jobType: stage.jobType,
        status: result.failed > 0 ? "partial" : "completed",
        reposProcessed: result.processed,
        reposFailed: result.failed,
        rateLimitRemaining: null,
        errorMessage: null,
        durationMs,
        startedAt: new Date(stageStart).toISOString(),
        completedAt: new Date().toISOString(),
      };
      logEntries.push(entry);

      console.log(
        `[Pipeline] ${stage.name} 完成 (${durationMs}ms, 处理 ${result.processed}, 失败 ${result.failed})`,
      );
    } catch (err) {
      const durationMs = Date.now() - stageStart;
      const errorMessage = err instanceof Error ? err.message : String(err);

      console.error(`[Pipeline] ${stage.name} 失败: ${errorMessage}`);

      const entry: SyncLogEntry = {
        jobType: stage.jobType,
        status: "failed",
        reposProcessed: 0,
        reposFailed: 0,
        rateLimitRemaining: null,
        errorMessage,
        durationMs,
        startedAt: new Date(stageStart).toISOString(),
        completedAt: new Date().toISOString(),
      };
      logEntries.push(entry);

      // 某些关键阶段失败可能需要终止管道
      if (stage.jobType === "discover") {
        console.error("[Pipeline] 发现阶段失败，终止管道");
        break;
      }
      // 其他阶段失败继续执行
    }
  }

  // 写入同步日志
  const now = new Date().toISOString();
  const syncLog: SyncLogData = {
    lastRun: now,
    entries: logEntries,
  };
  writeSyncLog(syncLog);

  // 更新全站统计
  updateStats(now);

  const totalDuration = Date.now() - startTime;
  console.log("\n========================================");
  console.log("[Pipeline] 管道执行完成");
  console.log(`[Pipeline] 总耗时: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
  console.log(`[Pipeline] 阶段数: ${logEntries.length}`);
  console.log(
    `[Pipeline] 成功/部分/失败: ${logEntries.filter((e) => e.status === "completed").length}/${logEntries.filter((e) => e.status === "partial").length}/${logEntries.filter((e) => e.status === "failed").length}`,
  );
  console.log("========================================");
}

/**
 * 更新全站统计数据
 */
function updateStats(lastSyncAt: string): void {
  const repos = readRepositories();
  const stats = readStats();

  // 统计各分类仓库数
  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};

  for (const repo of repos) {
    if (repo.categorySlug) {
      categoryCounts[repo.categorySlug] = (categoryCounts[repo.categorySlug] ?? 0) + 1;
    }
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
    }
  }

  // 回写分类统计：repoCount 与 topRepos（按 stars 取前 3，starsGained 取自日趋势快照）
  const dailyGained = new Map(readTrending("daily").map((s) => [s.fullName, s.starsGained ?? 0]));
  const categories = readCategories().map((cat) => {
    const catRepos = repos.filter((r) => r.categorySlug === cat.slug);
    return {
      ...cat,
      repoCount: catRepos.length,
      topRepos: [...catRepos]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3)
        .map((r) => ({
          fullName: r.fullName,
          stars: r.stars,
          starsGained: dailyGained.get(r.fullName) ?? 0,
        })),
    };
  });
  writeCategories(categories);

  // 统计已策展数
  const totalCurations = repos.filter((r) => r.curation !== null).length;

  // 判断同步健康状态
  const syncLog = readSyncLog();
  const failedCount = syncLog.entries.filter((e) => e.status === "failed").length;
  let syncHealth: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (failedCount > 0 && failedCount < syncLog.entries.length) {
    syncHealth = "degraded";
  } else if (failedCount === syncLog.entries.length && syncLog.entries.length > 0) {
    syncHealth = "unhealthy";
  }

  writeStats({
    totalReposTracked: repos.length,
    totalCurations,
    categoryCounts,
    languageCounts,
    lastSyncAt,
    lastCurationAt: totalCurations > 0 ? lastSyncAt : stats.lastCurationAt,
    syncHealth,
  });
}

// 主入口
runPipeline().catch((err) => {
  console.error("[Pipeline] 致命错误:", err);
  process.exit(1);
});
