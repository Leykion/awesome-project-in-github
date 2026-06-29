// scripts/analysis/fallback.ts
// LLM 失败时的后备分析生成
// 当 LLM 调用失败时，生成合理的 CurationData 默认值

import type { CurationData, EnrichedRepo } from "@gitpulse/shared";
import { classifyRepo } from "./classifier";
import { PROMPT_VERSION } from "./prompt";

/**
 * 生成后备 CurationData
 * 当 LLM 调用失败时使用规则分类器和启发式方法生成合理默认值
 * isFallback 标记为 true，便于后续重新分析
 */
export function generateFallbackCuration(repo: EnrichedRepo): CurationData {
  // 使用规则分类器确定分类
  const categorySlug = classifyRepo(repo);

  // 基于仓库元数据生成摘要
  const summary = repo.description
    ? `${repo.fullName}: ${repo.description}`
    : `${repo.fullName} is a ${repo.language ?? "software"} project with ${repo.stars.toLocaleString()} stars.`;

  // 基于星标数和活跃度生成 whyNotable
  const whyNotable = generateWhyNotable(repo);

  // 基于元数据估算评分（保守评分）
  const noveltyScore = estimateNoveltyScore(repo);
  const clarityScore = estimateClarityScore(repo);
  const productionScore = estimateProductionScore(repo);
  const categoryFitScore = categorySlug ? 5 : 2;

  // 规则评分：4 维平均
  const ruleScore = Math.round(
    ((noveltyScore + clarityScore + productionScore + categoryFitScore) / 4) * 10,
  );

  return {
    summary,
    whyNotable,
    categorySlug,
    subcategory: null,
    strengths: generateStrengths(repo),
    limitations: generateLimitations(repo),
    useCases: [],
    targetAudience: null,
    comparableProjects: [],
    noveltyScore,
    clarityScore,
    productionScore,
    categoryFitScore,
    innovationRating: null,
    productionReadiness: null,
    learningCurve: null,
    oneLiner: repo.description,
    ruleScore,
    llmScore: null,
    compositeScore: ruleScore,
    modelUsed: "fallback",
    promptVersion: PROMPT_VERSION,
    isFallback: true,
    tokensInput: null,
    tokensOutput: null,
    evaluatedAt: new Date().toISOString(),
  };
}

/** 基于仓库元数据生成 whyNotable */
function generateWhyNotable(repo: EnrichedRepo): string {
  const parts: string[] = [];

  if (repo.stars >= 10000) {
    parts.push(`High popularity with ${repo.stars.toLocaleString()} stars`);
  } else if (repo.stars >= 1000) {
    parts.push(`Growing community with ${repo.stars.toLocaleString()} stars`);
  }

  if (repo.contributorCount && repo.contributorCount >= 50) {
    parts.push(`active contributor community (${repo.contributorCount} contributors)`);
  }

  if (repo.releasesLast6m >= 6) {
    parts.push("frequent releases");
  }

  if (parts.length === 0) {
    return `${repo.fullName} is an emerging project in the ${repo.language ?? "software"} ecosystem.`;
  }

  return `${parts.join(", ")}.`;
}

/** 基于项目特征估算新颖度评分 */
function estimateNoveltyScore(repo: EnrichedRepo): number {
  let score = 4; // 基础分

  // 高星标项目通常有一定新颖度
  if (repo.stars >= 10000) score += 2;
  else if (repo.stars >= 1000) score += 1;

  // 有较多 topic 标签说明定位清晰
  if (repo.topics.length >= 5) score += 1;

  return Math.min(score, 10);
}

/** 基于文档和示例估算清晰度评分 */
function estimateClarityScore(repo: EnrichedRepo): number {
  let score = 3; // 基础分

  // README 大小反映文档质量
  if (repo.readmeSizeBytes && repo.readmeSizeBytes > 5000) score += 2;
  else if (repo.readmeSizeBytes && repo.readmeSizeBytes > 1000) score += 1;

  // 有示例目录
  if (repo.badges.hasExamples) score += 1;

  // 有项目主页
  if (repo.homepageUrl) score += 1;

  return Math.min(score, 10);
}

/** 基于 CI、测试、发布情况估算生产就绪度 */
function estimateProductionScore(repo: EnrichedRepo): number {
  let score = 2; // 基础分

  if (repo.badges.hasCi) score += 2;
  if (repo.badges.hasTests) score += 2;
  if (repo.badges.hasReleases) score += 1;
  if (repo.badges.hasDocker) score += 1;
  if (repo.licenseSpdx) score += 1;

  return Math.min(score, 10);
}

/** 基于仓库特征生成优势列表 */
function generateStrengths(repo: EnrichedRepo): string[] {
  const strengths: string[] = [];

  if (repo.stars >= 5000) strengths.push("Large and active community");
  if (repo.badges.hasCi) strengths.push("Continuous integration configured");
  if (repo.badges.hasTests) strengths.push("Test suite present");
  if (repo.licenseSpdx) strengths.push(`Open source (${repo.licenseSpdx})`);
  if (repo.badges.hasDocker) strengths.push("Docker support");
  if (repo.releasesLast6m >= 3) strengths.push("Regular release cadence");

  // 至少返回一项
  if (strengths.length === 0) {
    strengths.push("Active development");
  }

  return strengths.slice(0, 3);
}

/** 基于仓库特征生成局限列表 */
function generateLimitations(repo: EnrichedRepo): string[] {
  const limitations: string[] = [];

  if (!repo.badges.hasTests) limitations.push("No visible test suite");
  if (!repo.badges.hasCi) limitations.push("No CI/CD configuration detected");
  if (!repo.licenseSpdx) limitations.push("No license specified");
  if (!repo.readmeSizeBytes || repo.readmeSizeBytes < 500)
    limitations.push("Limited documentation");

  return limitations.slice(0, 2);
}
