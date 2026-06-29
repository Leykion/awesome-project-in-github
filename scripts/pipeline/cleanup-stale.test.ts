// scripts/pipeline/cleanup-stale.test.ts
// 30 天滚动数据清理单元测试

import type { RepositoryData, StarHistoryData, SyncLogData, SyncLogEntry } from "@gitpulse/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock data-io 模块，避免真实文件系统操作
vi.mock("../lib/data-io", () => ({
  readRepositories: vi.fn(() => []),
  readTrending: vi.fn(() => []),
  readStarHistory: vi.fn(() => ({})),
  readSyncLog: vi.fn(() => ({ lastRun: "", entries: [] })),
  writeRepositories: vi.fn(),
  writeStarHistory: vi.fn(),
  writeSyncLog: vi.fn(),
}));

import {
  readRepositories,
  readStarHistory,
  readSyncLog,
  readTrending,
  writeRepositories,
  writeStarHistory,
  writeSyncLog,
} from "../lib/data-io";
import { cleanupStale } from "./cleanup-stale";

const mockedReadRepositories = vi.mocked(readRepositories);
const mockedReadTrending = vi.mocked(readTrending);
const mockedReadStarHistory = vi.mocked(readStarHistory);
const mockedReadSyncLog = vi.mocked(readSyncLog);
const mockedWriteRepositories = vi.mocked(writeRepositories);
const mockedWriteStarHistory = vi.mocked(writeStarHistory);
const mockedWriteSyncLog = vi.mocked(writeSyncLog);

function makePipelineConfig() {
  return {
    githubToken: "test-token",
    llm: { apiKey: "test", baseURL: "http://localhost", model: "test" },
    environment: "development" as const,
    scrapeLanguages: ["python"],
    llmEvalThreshold: 40,
    llmEvalBatchSize: 20,
    readmeTruncateChars: 8000,
  };
}

/** 构造完整的 RepositoryData 测试数据 */
function makeRepo(overrides: Partial<RepositoryData> = {}): RepositoryData {
  return {
    id: 1,
    owner: "test",
    name: "repo",
    fullName: "test/repo",
    description: null,
    url: "https://github.com/test/repo",
    homepageUrl: null,
    language: null,
    languageColor: null,
    stars: 1000,
    forks: 100,
    openIssues: 10,
    watchers: 50,
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
    scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 0 },
    tier: "tracked",
    categorySlug: null,
    curation: null,
    firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 天前
    lastSyncedAt: new Date().toISOString(),
    lastAnalyzedAt: null,
    trendingSince: null,
    trendingLanguage: null,
    ...overrides,
  };
}

describe("cleanup-stale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadTrending.mockReturnValue([]);
    mockedReadStarHistory.mockReturnValue({});
    mockedReadSyncLog.mockReturnValue({ lastRun: "", entries: [] });
  });

  describe("30 天仓库清理", () => {
    it("低评分且超过 30 天首次收录的仓库应被清理", async () => {
      const repo = makeRepo({
        fullName: "stale/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 20 },
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 天前
      });

      mockedReadRepositories.mockReturnValue([repo]);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(1);
      expect(result.remainingRepos).toBe(0);
      expect(mockedWriteRepositories).toHaveBeenCalledOnce();
    });

    it("高评分仓库不应被清理", async () => {
      const repo = makeRepo({
        fullName: "good/repo",
        scores: {
          growth: 80,
          maturity: 70,
          community: 60,
          relevance: 90,
          quality: 80,
          composite: 75,
        },
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockedReadRepositories.mockReturnValue([repo]);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(0);
      expect(result.remainingRepos).toBe(1);
    });

    it("composite 恰好 30 的仓库应保留", async () => {
      const repo = makeRepo({
        fullName: "border/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 30 },
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockedReadRepositories.mockReturnValue([repo]);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(0);
      expect(result.remainingRepos).toBe(1);
    });

    it("在趋势中出现的低评分仓库应保留", async () => {
      const repo = makeRepo({
        fullName: "trending/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 10 },
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") {
          return [
            {
              repoId: 1,
              fullName: "trending/repo",
              snapshotDate: "2026-06-28",
              rank: 1,
              starsTotal: 1000,
              starsGained: 100,
              forksTotal: 100,
              forksGained: null,
              language: null,
              fetchedAt: new Date().toISOString(),
            },
          ];
        }
        return [];
      });

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(0);
      expect(result.remainingRepos).toBe(1);
    });

    it("首次收录不满 30 天的低评分仓库应保留（缓冲期）", async () => {
      const repo = makeRepo({
        fullName: "new/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 10 },
        firstSeenAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 天前
      });

      mockedReadRepositories.mockReturnValue([repo]);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(0);
      expect(result.remainingRepos).toBe(1);
    });

    it("空仓库列表应正常处理", async () => {
      mockedReadRepositories.mockReturnValue([]);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(0);
      expect(result.remainingRepos).toBe(0);
    });

    it("多个仓库应分别按规则处理", async () => {
      const repos = [
        makeRepo({
          id: 1,
          fullName: "keep/high-score",
          scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 50 },
          firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        makeRepo({
          id: 2,
          fullName: "remove/low-score",
          scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 10 },
          firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        makeRepo({
          id: 3,
          fullName: "keep/new-repo",
          scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 5 },
          firstSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 天前
        }),
      ];

      mockedReadRepositories.mockReturnValue(repos);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(1);
      expect(result.remainingRepos).toBe(2);
    });
  });

  describe("星标历史过期清理", () => {
    it("超过 90 天的星标历史条目应被清理", async () => {
      const starHistory: StarHistoryData = {
        "test/repo": [
          {
            repoId: 1,
            date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            starCount: 900,
            dailyDelta: 10,
          },
          {
            repoId: 1,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            starCount: 1000,
            dailyDelta: 20,
          },
        ],
      };

      // 保留仓库使其不会被整体删除
      const repo = makeRepo({
        fullName: "test/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 50 },
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadStarHistory.mockReturnValue(starHistory);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedStarEntries).toBe(1);
      expect(mockedWriteStarHistory).toHaveBeenCalledOnce();
      const writtenHistory = mockedWriteStarHistory.mock.calls[0][0];
      expect(writtenHistory["test/repo"].length).toBe(1);
    });

    it("被清理仓库的星标历史应整体删除", async () => {
      const starHistory: StarHistoryData = {
        "removed/repo": [
          { repoId: 2, date: "2026-06-28", starCount: 100, dailyDelta: 5 },
          { repoId: 2, date: "2026-06-27", starCount: 95, dailyDelta: 3 },
        ],
      };

      const repo = makeRepo({
        id: 2,
        fullName: "removed/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 10 },
        firstSeenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadStarHistory.mockReturnValue(starHistory);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedRepos).toBe(1);
      expect(result.removedStarEntries).toBe(2);
      const writtenHistory = mockedWriteStarHistory.mock.calls[0][0];
      expect(writtenHistory["removed/repo"]).toBeUndefined();
    });

    it("所有条目都在保留期内的仓库应保持不变", async () => {
      const starHistory: StarHistoryData = {
        "test/repo": [
          {
            repoId: 1,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            starCount: 1000,
            dailyDelta: 20,
          },
          {
            repoId: 1,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            starCount: 980,
            dailyDelta: 15,
          },
        ],
      };

      const repo = makeRepo({
        fullName: "test/repo",
        scores: { growth: 0, maturity: 0, community: 0, relevance: 0, quality: 0, composite: 50 },
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadStarHistory.mockReturnValue(starHistory);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedStarEntries).toBe(0);
    });
  });

  describe("同步日志保留", () => {
    it("超过 100 条日志应截断到 100 条", async () => {
      const entries: SyncLogEntry[] = Array.from({ length: 120 }, (_, i) => ({
        jobType: "discover" as const,
        status: "completed" as const,
        reposProcessed: 10,
        reposFailed: 0,
        rateLimitRemaining: 4000,
        errorMessage: null,
        durationMs: 1000,
        startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - i * 60 * 60 * 1000 + 1000).toISOString(),
      }));

      const syncLog: SyncLogData = { lastRun: new Date().toISOString(), entries };

      mockedReadRepositories.mockReturnValue([]);
      mockedReadSyncLog.mockReturnValue(syncLog);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedLogEntries).toBe(20);
      expect(mockedWriteSyncLog).toHaveBeenCalledOnce();
      const writtenLog = mockedWriteSyncLog.mock.calls[0][0];
      expect(writtenLog.entries.length).toBe(100);
    });

    it("恰好 100 条日志应保持不变", async () => {
      const entries: SyncLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
        jobType: "discover" as const,
        status: "completed" as const,
        reposProcessed: 10,
        reposFailed: 0,
        rateLimitRemaining: 4000,
        errorMessage: null,
        durationMs: 1000,
        startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - i * 60 * 60 * 1000 + 1000).toISOString(),
      }));

      const syncLog: SyncLogData = { lastRun: new Date().toISOString(), entries };

      mockedReadRepositories.mockReturnValue([]);
      mockedReadSyncLog.mockReturnValue(syncLog);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedLogEntries).toBe(0);
      expect(mockedWriteSyncLog).not.toHaveBeenCalled();
    });

    it("少于 100 条日志应保持不变", async () => {
      const entries: SyncLogEntry[] = Array.from({ length: 50 }, (_, i) => ({
        jobType: "discover" as const,
        status: "completed" as const,
        reposProcessed: 10,
        reposFailed: 0,
        rateLimitRemaining: 4000,
        errorMessage: null,
        durationMs: 1000,
        startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - i * 60 * 60 * 1000 + 1000).toISOString(),
      }));

      const syncLog: SyncLogData = { lastRun: new Date().toISOString(), entries };

      mockedReadRepositories.mockReturnValue([]);
      mockedReadSyncLog.mockReturnValue(syncLog);

      const result = await cleanupStale(makePipelineConfig());

      expect(result.removedLogEntries).toBe(0);
      expect(mockedWriteSyncLog).not.toHaveBeenCalled();
    });

    it("截断后应保留最新的条目", async () => {
      const entries: SyncLogEntry[] = Array.from({ length: 105 }, (_, i) => ({
        jobType: "discover" as const,
        status: "completed" as const,
        reposProcessed: 10,
        reposFailed: 0,
        rateLimitRemaining: 4000,
        errorMessage: null,
        durationMs: 1000,
        // 时间递减排列，索引越小越新
        startedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - i * 60 * 60 * 1000 + 1000).toISOString(),
      }));

      const syncLog: SyncLogData = { lastRun: new Date().toISOString(), entries };

      mockedReadRepositories.mockReturnValue([]);
      mockedReadSyncLog.mockReturnValue(syncLog);

      await cleanupStale(makePipelineConfig());

      const writtenLog = mockedWriteSyncLog.mock.calls[0][0];
      // 最新的条目应在前面（按 startedAt 降序排序后截取前 100）
      const firstEntryTime = new Date(writtenLog.entries[0].startedAt).getTime();
      const lastEntryTime = new Date(writtenLog.entries[99].startedAt).getTime();
      expect(firstEntryTime).toBeGreaterThan(lastEntryTime);
    });
  });
});
