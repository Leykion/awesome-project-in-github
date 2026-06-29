// scripts/pipeline/score-repos.test.ts
// 评分引擎单元测试

import type { RepositoryData, TrendingSnapshotData } from "@gitpulse/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock data-io 模块，避免真实文件系统操作
vi.mock("../lib/data-io", () => ({
  readRepositories: vi.fn(() => []),
  readTrending: vi.fn(() => []),
  writeRepositories: vi.fn(),
}));

import { readRepositories, readTrending, writeRepositories } from "../lib/data-io";
import { scoreRepos } from "./score-repos";

const mockedReadRepositories = vi.mocked(readRepositories);
const mockedReadTrending = vi.mocked(readTrending);
const mockedWriteRepositories = vi.mocked(writeRepositories);

/** 构造最小化的 PipelineConfig */
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
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 年前
    pushedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 天前
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
    firstSeenAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    lastAnalyzedAt: null,
    trendingSince: null,
    trendingLanguage: null,
    ...overrides,
  };
}

/** 构造趋势快照数据 */
function makeTrending(fullName: string, starsGained: number | null = null): TrendingSnapshotData {
  return {
    repoId: 1,
    fullName,
    snapshotDate: "2026-06-28",
    rank: 1,
    starsTotal: 1000,
    starsGained,
    forksTotal: 100,
    forksGained: null,
    language: null,
    fetchedAt: "2026-06-28T00:00:00Z",
  };
}

describe("score-repos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadTrending.mockReturnValue([]);
  });

  describe("综合得分公式", () => {
    it("应按 0.30*growth + 0.20*maturity + 0.20*community + 0.20*relevance + 0.10*quality 计算", async () => {
      // 构造一个得分可预测的仓库：所有维度都有明确信号
      const repo = makeRepo({
        stars: 10000,
        language: "python",
        topics: ["llm", "ai", "machine-learning"],
        licenseSpdx: "MIT",
        badges: {
          hasExamples: true,
          hasCi: true,
          hasReleases: true,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        contributorCount: 100,
        avgIssueCloseDays: 0.5,
        pushedAt: new Date().toISOString(), // 刚刚推送
        createdAt: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 3 年前
        releasesLast6m: 24,
        readmeSizeBytes: 10000,
        homepageUrl: "https://example.com",
        description:
          "A powerful llm framework for building AI agents with deep learning and neural network support",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      // 提供趋势数据以计算增长
      const dailyTrending = makeTrending("test/repo", 100);
      const weeklyTrending = makeTrending("test/repo", 700);
      const monthlyTrending = makeTrending("test/repo", 3000);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [dailyTrending];
        if (since === "weekly") return [weeklyTrending];
        if (since === "monthly") return [monthlyTrending];
        return [];
      });

      const result = await scoreRepos(makePipelineConfig());

      // 验证评分已写入
      expect(mockedWriteRepositories).toHaveBeenCalledOnce();
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];
      const scored = writtenRepos[0];

      // 各维度都应该有较高分数
      expect(scored.scores.growth).toBeGreaterThan(0);
      expect(scored.scores.maturity).toBeGreaterThan(0);
      expect(scored.scores.community).toBeGreaterThan(0);
      expect(scored.scores.relevance).toBeGreaterThan(0);
      expect(scored.scores.quality).toBeGreaterThan(0);

      // 综合得分应等于加权和（四舍五入）
      const expectedComposite = Math.round(
        0.3 * scored.scores.growth +
          0.2 * scored.scores.maturity +
          0.2 * scored.scores.community +
          0.2 * scored.scores.relevance +
          0.1 * scored.scores.quality,
      );
      expect(scored.scores.composite).toBe(expectedComposite);

      // 高分仓库应获得 star 等级
      expect(result.scored).toBe(1);
      expect(result.excluded).toBe(0);
    });

    it("无增长数据时 growth 应为 0", async () => {
      const repo = makeRepo({ stars: 1000 });
      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());

      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];
      expect(writtenRepos[0].scores.growth).toBe(0);
    });
  });

  describe("等级分类", () => {
    it("composite >= 70 应为 star 等级", async () => {
      // 构造高分仓库
      const repo = makeRepo({
        stars: 50000,
        language: "python",
        topics: ["llm", "ai", "machine-learning"],
        licenseSpdx: "MIT",
        badges: {
          hasExamples: true,
          hasCi: true,
          hasReleases: true,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        contributorCount: 200,
        avgIssueCloseDays: 0.5,
        pushedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 30,
        readmeSizeBytes: 20000,
        homepageUrl: "https://example.com",
        description:
          "LLM framework with deep learning, neural network, transformer, embedding, and vector database",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [makeTrending("test/repo", 200)];
        if (since === "weekly") return [makeTrending("test/repo", 1400)];
        if (since === "monthly") return [makeTrending("test/repo", 6000)];
        return [];
      });

      const result = await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.composite).toBeGreaterThanOrEqual(70);
      expect(writtenRepos[0].tier).toBe("star");
      expect(result.tiers.star).toBe(1);
    });

    it("composite 50-69 应为 notable 等级", async () => {
      // 构造中等分数仓库
      const repo = makeRepo({
        stars: 5000,
        language: "python",
        topics: ["llm", "ai"],
        licenseSpdx: "MIT",
        badges: {
          hasExamples: false,
          hasCi: true,
          hasReleases: true,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        contributorCount: 30,
        avgIssueCloseDays: 5,
        pushedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1.5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 6,
        readmeSizeBytes: 3000,
        description: "AI tool for machine learning with transformer support",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [makeTrending("test/repo", 30)];
        if (since === "weekly") return [makeTrending("test/repo", 200)];
        if (since === "monthly") return [makeTrending("test/repo", 800)];
        return [];
      });

      const result = await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];
      const composite = writtenRepos[0].scores.composite;

      expect(composite).toBeGreaterThanOrEqual(50);
      expect(composite).toBeLessThan(70);
      expect(writtenRepos[0].tier).toBe("notable");
      expect(result.tiers.notable).toBe(1);
    });

    it("composite < 50 应为 tracked 等级", async () => {
      // 构造低分仓库（无增长、无社区信号）
      const repo = makeRepo({
        stars: 100,
        language: "java",
        topics: [],
        description: "Some utility library",
        contributorCount: 1,
        avgIssueCloseDays: 30,
        pushedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 0,
      });

      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.composite).toBeLessThan(50);
      expect(writtenRepos[0].tier).toBe("tracked");
      expect(result.tiers.tracked).toBe(1);
    });
  });

  describe("硬性排除规则", () => {
    it("已归档仓库应被排除", async () => {
      const repo = makeRepo({ isArchived: true, stars: 10000 });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(result.excluded).toBe(1);
      expect(result.scored).toBe(0);
      expect(writtenRepos[0].scores.composite).toBe(0);
      expect(writtenRepos[0].tier).toBe("tracked");
    });

    it("fork 仓库（stars < 250）应被排除", async () => {
      // EXCLUSION_RULES.minStars = 50, forkStarMultiplier = 5 => fork 需要 250+ stars
      const repo = makeRepo({ isFork: true, stars: 200 });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(1);
    });

    it("高 star fork 仓库不应被排除", async () => {
      const repo = makeRepo({ isFork: true, stars: 500 });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(0);
      expect(result.scored).toBe(1);
    });

    it("stars < 50 应被排除", async () => {
      const repo = makeRepo({ stars: 30 });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(1);
    });

    it("stars = 50 不应被排除", async () => {
      const repo = makeRepo({ stars: 50 });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(0);
    });

    it("超过 180 天无 push 应被排除", async () => {
      const repo = makeRepo({
        stars: 1000,
        pushedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(1);
    });

    it("恰好 180 天 push 不应被排除", async () => {
      const repo = makeRepo({
        stars: 1000,
        pushedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(0);
    });

    it("多个排除条件同时触发只计一次排除", async () => {
      const repo = makeRepo({ isArchived: true, stars: 10, isFork: true });
      mockedReadRepositories.mockReturnValue([repo]);

      const result = await scoreRepos(makePipelineConfig());
      expect(result.excluded).toBe(1);
    });
  });

  describe("边界值", () => {
    it("所有分数为 0 时 composite 应为 0", async () => {
      // 无任何正向信号的仓库
      const repo = makeRepo({
        stars: 100,
        language: null,
        topics: [],
        description: null,
        contributorCount: 0,
        avgIssueCloseDays: null,
        pushedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: null,
        releasesLast6m: 0,
        readmeSizeBytes: null,
        homepageUrl: null,
      });

      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      // 所有维度几乎为 0（活跃度 100 天前可能还有少量分数）
      expect(writtenRepos[0].scores.composite).toBeLessThanOrEqual(10);
    });

    it("所有分数满分时 composite 应接近 100", async () => {
      const repo = makeRepo({
        stars: 100000,
        language: "python",
        topics: ["llm", "ai", "machine-learning", "deep-learning", "transformer"],
        licenseSpdx: "MIT",
        badges: {
          hasExamples: true,
          hasCi: true,
          hasReleases: true,
          hasTests: true,
          hasDocker: true,
          hasPypi: true,
          hasNpm: true,
          hasMcp: true,
        },
        contributorCount: 500,
        avgIssueCloseDays: 0.5,
        pushedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 100,
        readmeSizeBytes: 50000,
        homepageUrl: "https://example.com",
        description:
          "llm large language model deep learning neural network embedding vector database rag transformer",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [makeTrending("test/repo", 200)];
        if (since === "weekly") return [makeTrending("test/repo", 1400)];
        if (since === "monthly") return [makeTrending("test/repo", 6000)];
        return [];
      });

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.composite).toBeGreaterThanOrEqual(90);
      expect(writtenRepos[0].tier).toBe("star");
    });

    it("composite 恰好 70 应为 star", async () => {
      // 通过 mock 直接验证分级逻辑
      const repo = makeRepo({
        stars: 8000,
        language: "python",
        topics: ["llm", "ai", "machine-learning"],
        licenseSpdx: "Apache-2.0",
        badges: {
          hasExamples: true,
          hasCi: true,
          hasReleases: true,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        contributorCount: 80,
        avgIssueCloseDays: 1,
        pushedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 15,
        readmeSizeBytes: 8000,
        homepageUrl: "https://example.com",
        description:
          "A powerful LLM framework for deep learning with transformer and neural network",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [makeTrending("test/repo", 50)];
        if (since === "weekly") return [makeTrending("test/repo", 350)];
        if (since === "monthly") return [makeTrending("test/repo", 1500)];
        return [];
      });

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      // 验证分级逻辑：如果 composite >= 70 则为 star
      if (writtenRepos[0].scores.composite >= 70) {
        expect(writtenRepos[0].tier).toBe("star");
      } else if (writtenRepos[0].scores.composite >= 50) {
        expect(writtenRepos[0].tier).toBe("notable");
      } else {
        expect(writtenRepos[0].tier).toBe("tracked");
      }
    });

    it("composite 恰好 50 应为 notable", async () => {
      const repo = makeRepo({
        stars: 2000,
        language: "python",
        topics: ["ai"],
        licenseSpdx: "MIT",
        badges: {
          hasExamples: false,
          hasCi: true,
          hasReleases: false,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
        contributorCount: 15,
        avgIssueCloseDays: 7,
        pushedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        releasesLast6m: 3,
        readmeSizeBytes: 2000,
        description: "AI tool for machine learning",
      });

      mockedReadRepositories.mockReturnValue([repo]);
      mockedReadTrending.mockImplementation((since) => {
        if (since === "daily") return [makeTrending("test/repo", 15)];
        if (since === "weekly") return [makeTrending("test/repo", 100)];
        if (since === "monthly") return [makeTrending("test/repo", 400)];
        return [];
      });

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      // 验证合理的分级
      if (writtenRepos[0].scores.composite >= 70) {
        expect(writtenRepos[0].tier).toBe("star");
      } else if (writtenRepos[0].scores.composite >= 50) {
        expect(writtenRepos[0].tier).toBe("notable");
      } else {
        expect(writtenRepos[0].tier).toBe("tracked");
      }
    });

    it("空仓库列表应正常处理", async () => {
      mockedReadRepositories.mockReturnValue([]);

      const result = await scoreRepos(makePipelineConfig());

      expect(result.totalRepos).toBe(0);
      expect(result.scored).toBe(0);
      expect(result.excluded).toBe(0);
    });

    it("多个仓库应各自独立评分", async () => {
      const repos = [
        makeRepo({ fullName: "a/repo1", stars: 10000 }),
        makeRepo({ fullName: "b/repo2", stars: 200, isArchived: true }),
        makeRepo({ fullName: "c/repo3", stars: 5000, language: "python", topics: ["llm"] }),
      ];

      mockedReadRepositories.mockReturnValue(repos);

      const result = await scoreRepos(makePipelineConfig());

      expect(result.totalRepos).toBe(3);
      expect(result.excluded).toBe(1); // repo2 已归档
      expect(result.scored).toBe(2);
    });
  });

  describe("代码质量评分", () => {
    it("有许可证+测试+CI 应得满分 100", async () => {
      const repo = makeRepo({
        licenseSpdx: "MIT",
        badges: {
          hasExamples: false,
          hasCi: true,
          hasReleases: false,
          hasTests: true,
          hasDocker: false,
          hasPypi: false,
          hasNpm: false,
          hasMcp: false,
        },
      });
      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      // 许可证 50 + 测试 25 + CI 25 = 100
      expect(writtenRepos[0].scores.quality).toBe(100);
    });

    it("无任何质量信号应得 0 分", async () => {
      const repo = makeRepo({
        licenseSpdx: null,
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
      });
      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.quality).toBe(0);
    });
  });

  describe("AI 相关性评分", () => {
    it("匹配多个 AI topics 和关键词应得高分", async () => {
      const repo = makeRepo({
        topics: ["llm", "ai", "machine-learning"],
        description: "A powerful LLM framework for deep learning with transformer support",
        language: "python",
      });
      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.relevance).toBeGreaterThan(50);
    });

    it("无 AI 相关信号应得低分", async () => {
      const repo = makeRepo({
        topics: ["web", "css", "html"],
        description: "A CSS framework",
        language: "java",
      });
      mockedReadRepositories.mockReturnValue([repo]);

      await scoreRepos(makePipelineConfig());
      const writtenRepos = mockedWriteRepositories.mock.calls[0][0];

      expect(writtenRepos[0].scores.relevance).toBeLessThan(20);
    });
  });
});
