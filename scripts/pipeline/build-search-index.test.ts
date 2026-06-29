// scripts/pipeline/build-search-index.test.ts
// 搜索索引构建单元测试

import type { RepositoryData } from "@gitpulse/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock data-io 模块，避免真实文件系统操作
vi.mock("../lib/data-io", () => ({
  readRepositories: vi.fn(() => []),
  writeDataFile: vi.fn(),
}));

import { readRepositories, writeDataFile } from "../lib/data-io";
import { buildSearchIndex } from "./build-search-index";

const mockedReadRepositories = vi.mocked(readRepositories);
const mockedWriteDataFile = vi.mocked(writeDataFile);

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
    firstSeenAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    lastAnalyzedAt: null,
    trendingSince: null,
    trendingLanguage: null,
    ...overrides,
  };
}

describe("build-search-index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应将仓库数据转换为搜索索引并写入 search-index.json", () => {
    const repo = makeRepo({
      id: 42,
      fullName: "langchain-ai/langchain",
      description: "Build LLM applications",
      topics: ["llm", "ai", "rag"],
      language: "Python",
      categorySlug: "llm-frameworks",
      stars: 98000,
      licenseSpdx: "MIT",
      curation: {
        summary: "test",
        whyNotable: "test",
        categorySlug: "llm-frameworks",
        subcategory: null,
        strengths: [],
        limitations: [],
        useCases: [],
        targetAudience: null,
        comparableProjects: [],
        noveltyScore: 8,
        clarityScore: 9,
        productionScore: 8,
        categoryFitScore: 9,
        innovationRating: 4,
        productionReadiness: 4,
        learningCurve: "medium",
        oneLiner: "LLM application framework",
        ruleScore: 80,
        llmScore: 85,
        compositeScore: 83,
        modelUsed: "test-model",
        promptVersion: "v1",
        isFallback: false,
        tokensInput: 100,
        tokensOutput: 50,
        evaluatedAt: new Date().toISOString(),
      },
    });

    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    expect(mockedWriteDataFile).toHaveBeenCalledOnce();
    expect(mockedWriteDataFile).toHaveBeenCalledWith("search-index.json", expect.any(Array));

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries).toHaveLength(1);

    const entry = entries[0];
    expect(entry.id).toBe(42);
    expect(entry.fullName).toBe("langchain-ai/langchain");
    expect(entry.description).toBe("Build LLM applications");
    expect(entry.topics).toBe("llm ai rag");
    expect(entry.language).toBe("Python");
    expect(entry.categorySlug).toBe("llm-frameworks");
    expect(entry.stars).toBe(98000);
    expect(entry.licenseSpdx).toBe("MIT");
    expect(entry.oneLiner).toBe("LLM application framework");
  });

  it("空描述应转换为空字符串", () => {
    const repo = makeRepo({ description: null });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].description).toBe("");
  });

  it("空 topics 应转换为空字符串", () => {
    const repo = makeRepo({ topics: [] });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].topics).toBe("");
  });

  it("空语言应转换为空字符串", () => {
    const repo = makeRepo({ language: null });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].language).toBe("");
  });

  it("空分类应转换为空字符串", () => {
    const repo = makeRepo({ categorySlug: null });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].categorySlug).toBe("");
  });

  it("空许可证应转换为空字符串", () => {
    const repo = makeRepo({ licenseSpdx: null });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].licenseSpdx).toBe("");
  });

  it("无 curation 时 oneLiner 应为空字符串", () => {
    const repo = makeRepo({ curation: null });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].oneLiner).toBe("");
  });

  it("curation 存在但 oneLiner 为 null 时应为空字符串", () => {
    const repo = makeRepo({
      curation: {
        summary: "test",
        whyNotable: "test",
        categorySlug: null,
        subcategory: null,
        strengths: [],
        limitations: [],
        useCases: [],
        targetAudience: null,
        comparableProjects: [],
        noveltyScore: 0,
        clarityScore: 0,
        productionScore: 0,
        categoryFitScore: 0,
        innovationRating: null,
        productionReadiness: null,
        learningCurve: null,
        oneLiner: null,
        ruleScore: 0,
        llmScore: null,
        compositeScore: 0,
        modelUsed: "test",
        promptVersion: "v1",
        isFallback: true,
        tokensInput: null,
        tokensOutput: null,
        evaluatedAt: new Date().toISOString(),
      },
    });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].oneLiner).toBe("");
  });

  it("多个仓库应全部转换", () => {
    const repos = [
      makeRepo({ id: 1, fullName: "a/repo1" }),
      makeRepo({ id: 2, fullName: "b/repo2" }),
      makeRepo({ id: 3, fullName: "c/repo3" }),
    ];
    mockedReadRepositories.mockReturnValue(repos);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.fullName)).toEqual(["a/repo1", "b/repo2", "c/repo3"]);
  });

  it("空仓库列表应写入空数组", () => {
    mockedReadRepositories.mockReturnValue([]);
    buildSearchIndex();

    expect(mockedWriteDataFile).toHaveBeenCalledWith("search-index.json", []);
  });

  it("topics 应以空格连接", () => {
    const repo = makeRepo({ topics: ["ai", "llm", "deep-learning", "pytorch"] });
    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    expect(entries[0].topics).toBe("ai llm deep-learning pytorch");
  });

  it("搜索索引应只包含指定字段，不泄漏多余数据", () => {
    const repo = makeRepo({
      id: 10,
      fullName: "test/repo",
      description: "desc",
      topics: ["t1"],
      language: "Python",
      categorySlug: "ai-agents",
      stars: 500,
      licenseSpdx: "Apache-2.0",
      curation: null,
    });

    mockedReadRepositories.mockReturnValue([repo]);
    buildSearchIndex();

    const entries = mockedWriteDataFile.mock.calls[0][1] as Array<Record<string, unknown>>;
    const entry = entries[0];
    const keys = Object.keys(entry);

    expect(keys).toEqual(
      expect.arrayContaining([
        "id",
        "fullName",
        "description",
        "topics",
        "language",
        "categorySlug",
        "stars",
        "licenseSpdx",
        "oneLiner",
      ]),
    );
    expect(keys).toHaveLength(9);

    // 不应包含如 forks, openIssues, badges 等其他字段
    expect(entry).not.toHaveProperty("forks");
    expect(entry).not.toHaveProperty("openIssues");
    expect(entry).not.toHaveProperty("badges");
    expect(entry).not.toHaveProperty("scores");
    expect(entry).not.toHaveProperty("tier");
  });
});
