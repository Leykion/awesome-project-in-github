// scripts/test-scorer.ts
// 手动测试评分引擎：对示例仓库执行评分并输出详细分解

import type { RepositoryData } from "@gitpulse/shared";
import { loadConfig } from "./lib/config";
import { readRepositories, writeRepositories, writeTrending } from "./lib/data-io";
import { scoreRepos } from "./pipeline/score-repos";

function createSampleRepo(overrides: Partial<RepositoryData> = {}): RepositoryData {
  return {
    id: 1,
    owner: "test-org",
    name: "test-repo",
    fullName: "test-org/test-repo",
    description: "A test AI framework for LLM applications",
    url: "https://github.com/test-org/test-repo",
    homepageUrl: null,
    language: "Python",
    languageColor: "#3572A5",
    stars: 5000,
    forks: 500,
    openIssues: 50,
    watchers: 200,
    topics: ["llm", "ai", "machine-learning"],
    licenseSpdx: "MIT",
    licenseName: "MIT License",
    isFork: false,
    isArchived: false,
    defaultBranch: "main",
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    pushedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    githubUpdatedAt: new Date().toISOString(),
    contributorCount: 30,
    readmeSizeBytes: 5000,
    releasesLast6m: 6,
    avgIssueCloseDays: 3,
    healthPercentage: 80,
    badges: {
      hasExamples: true,
      hasCi: true,
      hasReleases: true,
      hasTests: true,
      hasDocker: true,
      hasPypi: true,
      hasNpm: false,
      hasMcp: false,
    },
    scores: {
      growth: 0,
      maturity: 0,
      community: 0,
      relevance: 0,
      quality: 0,
      composite: 0,
    },
    tier: "tracked",
    categorySlug: null,
    curation: null,
    firstSeenAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    lastAnalyzedAt: null,
    trendingSince: new Date().toISOString(),
    trendingLanguage: "Python",
    ...overrides,
  };
}

async function main() {
  console.log("[TestScorer] 开始测试评分引擎...\n");

  const config = loadConfig();
  const sampleRepo = createSampleRepo();

  console.log(`[TestScorer] 测试仓库: ${sampleRepo.fullName}`);
  console.log(`  Stars: ${sampleRepo.stars}`);
  console.log(`  Language: ${sampleRepo.language}`);
  console.log(`  Topics: ${sampleRepo.topics.join(", ")}`);
  console.log(`  License: ${sampleRepo.licenseSpdx}\n`);

  // 写入测试数据到 data/ 目录
  writeRepositories([sampleRepo]);
  writeTrending("daily", [
    {
      repoId: sampleRepo.id,
      fullName: sampleRepo.fullName,
      snapshotDate: new Date().toISOString().slice(0, 10),
      rank: 1,
      starsTotal: sampleRepo.stars,
      starsGained: 50,
      forksTotal: sampleRepo.forks,
      forksGained: 5,
      language: null,
      fetchedAt: new Date().toISOString(),
    },
  ]);
  writeTrending("weekly", []);
  writeTrending("monthly", []);

  // 执行评分
  const result = await scoreRepos(config);

  console.log("[TestScorer] 评分结果:");
  console.log(`  总仓库: ${result.totalRepos}`);
  console.log(`  已评分: ${result.scored}`);
  console.log(`  已排除: ${result.excluded}`);

  // 读取评分后的仓库
  const scoredRepos = readRepositories();
  if (scoredRepos.length > 0) {
    const scored = scoredRepos[0];
    console.log("\n[TestScorer] 评分分解:");
    console.log(`  Growth:    ${scored.scores.growth}`);
    console.log(`  Maturity:  ${scored.scores.maturity}`);
    console.log(`  Community: ${scored.scores.community}`);
    console.log(`  Relevance: ${scored.scores.relevance}`);
    console.log(`  Quality:   ${scored.scores.quality}`);
    console.log(`  Composite: ${scored.scores.composite}`);
    console.log(`  Tier:      ${scored.tier}`);
  }

  console.log("\n[TestScorer] 测试完成");
}

main().catch((err) => {
  console.error("[TestScorer] 执行失败:", err);
  process.exit(1);
});
