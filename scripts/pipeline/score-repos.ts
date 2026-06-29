// scripts/pipeline/score-repos.ts
// Stage 3: 规则评分引擎 (0-100)
// 综合得分 = 0.30*growth + 0.20*maturity + 0.20*community + 0.20*relevance + 0.10*quality
// 分级：star(>=70), notable(50-69), tracked(30-49)
// 硬性排除：archived, fork, stars<50, 180 天无 push

import type { RepoTier, RepositoryData } from "@gitpulse/shared";
import {
  AI_README_KEYWORDS,
  AI_TOPICS,
  COMMUNITY_WEIGHTS,
  EXCLUSION_RULES,
  GROWTH_WEIGHTS,
  MATURITY_WEIGHTS,
  QUALITY_SCORES,
  RELEVANCE_WEIGHTS,
  SCORING_WEIGHTS,
  TIER_THRESHOLDS,
} from "@gitpulse/shared";
import type { PipelineConfig } from "../lib/config";
import { readRepositories, readTrending, writeRepositories } from "../lib/data-io";

/** 阶段结果 */
export interface ScoreReposResult {
  /** 总仓库数 */
  totalRepos: number;
  /** 评分后的仓库数 */
  scored: number;
  /** 硬性排除的仓库数 */
  excluded: number;
  /** 各等级数量 */
  tiers: { star: number; notable: number; tracked: number };
}

/**
 * 执行 Stage 3: 规则评分
 * 对所有仓库计算综合得分并分级
 */
export async function scoreRepos(_config: PipelineConfig): Promise<ScoreReposResult> {
  const repos = readRepositories();
  let excluded = 0;
  const tiers = { star: 0, notable: 0, tracked: 0 };

  // 读取趋势数据用于增长速度计算
  const trendingDaily = readTrending("daily");
  const trendingWeekly = readTrending("weekly");
  const trendingMonthly = readTrending("monthly");

  // 构建趋势查找表
  const dailyGainMap = new Map(trendingDaily.map((t) => [t.fullName, t.starsGained ?? 0]));
  const weeklyGainMap = new Map(trendingWeekly.map((t) => [t.fullName, t.starsGained ?? 0]));
  const monthlyGainMap = new Map(trendingMonthly.map((t) => [t.fullName, t.starsGained ?? 0]));

  for (const repo of repos) {
    // 硬性排除规则检查
    if (shouldExclude(repo)) {
      repo.scores = {
        growth: 0,
        maturity: 0,
        community: 0,
        relevance: 0,
        quality: 0,
        composite: 0,
      };
      repo.tier = "tracked";
      excluded++;
      continue;
    }

    // 计算各维度评分
    const dailyGain = dailyGainMap.get(repo.fullName) ?? 0;
    const weeklyGain = weeklyGainMap.get(repo.fullName) ?? 0;
    const monthlyGain = monthlyGainMap.get(repo.fullName) ?? 0;

    const growth = calcGrowthScore(repo, dailyGain, weeklyGain, monthlyGain);
    const maturity = calcMaturityScore(repo);
    const community = calcCommunityScore(repo);
    const relevance = calcRelevanceScore(repo);
    const quality = calcQualityScore(repo);

    // 综合得分
    const composite = Math.round(
      SCORING_WEIGHTS.growth * growth +
        SCORING_WEIGHTS.maturity * maturity +
        SCORING_WEIGHTS.community * community +
        SCORING_WEIGHTS.relevance * relevance +
        SCORING_WEIGHTS.quality * quality,
    );

    repo.scores = { growth, maturity, community, relevance, quality, composite };

    // 分级
    repo.tier = classifyTier(composite);
    tiers[repo.tier]++;
  }

  writeRepositories(repos);

  const result: ScoreReposResult = {
    totalRepos: repos.length,
    scored: repos.length - excluded,
    excluded,
    tiers,
  };

  console.log(
    `[ScoreRepos] 完成: 总计 ${result.totalRepos}, 评分 ${result.scored}, 排除 ${result.excluded}, star=${tiers.star} notable=${tiers.notable} tracked=${tiers.tracked}`,
  );

  return result;
}

/**
 * 硬性排除规则
 * - 已归档
 * - fork（除非 star >= 原仓库 5 倍，但无法获取原仓库 star，简化为 star >= 5000）
 * - star < 50
 * - 超过 180 天未 push
 */
function shouldExclude(repo: RepositoryData): boolean {
  // 已归档
  if (repo.isArchived) return true;

  // fork 仓库（简化处理：无法获取原仓库 star 数，排除所有低 star fork）
  if (repo.isFork && repo.stars < EXCLUSION_RULES.minStars * EXCLUSION_RULES.forkStarMultiplier) {
    return true;
  }

  // star 太少
  if (repo.stars < EXCLUSION_RULES.minStars) return true;

  // 超过 180 天未 push
  if (repo.pushedAt) {
    const daysSincePush = (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePush > EXCLUSION_RULES.maxInactiveDays) return true;
  }

  return false;
}

/** 分级：star(>=70), notable(50-69), tracked(30-49), 低于 30 仍为 tracked */
function classifyTier(composite: number): RepoTier {
  if (composite >= TIER_THRESHOLDS.star) return "star";
  if (composite >= TIER_THRESHOLDS.notable) return "notable";
  return "tracked";
}

/**
 * A. 增长速度评分 (权重: 0.30)
 * 混合绝对和相对增长（60/40），日增 100 stars 得满分
 * 综合：日 50% + 周 30% + 月 20%
 */
function calcGrowthScore(
  repo: RepositoryData,
  dailyGain: number,
  weeklyGain: number,
  monthlyGain: number,
): number {
  // 各时间维度的绝对增长评分（日增 100 得满分）
  const dailyAbsolute = clampScore((dailyGain / 100) * 100);
  const weeklyAbsolute = clampScore((weeklyGain / 700) * 100);
  const monthlyAbsolute = clampScore((monthlyGain / 3000) * 100);

  // 各时间维度的相对增长评分（日增 1% 得满分）
  const dailyRelative = repo.stars > 0 ? clampScore((dailyGain / repo.stars) * 100 * 100) : 0;
  const weeklyRelative =
    repo.stars > 0 ? clampScore((weeklyGain / repo.stars) * 100 * (100 / 7)) : 0;
  const monthlyRelative =
    repo.stars > 0 ? clampScore((monthlyGain / repo.stars) * 100 * (100 / 30)) : 0;

  // 混合绝对和相对（60/40）
  const dailyMixed =
    GROWTH_WEIGHTS.absolute * dailyAbsolute + GROWTH_WEIGHTS.relative * dailyRelative;
  const weeklyMixed =
    GROWTH_WEIGHTS.absolute * weeklyAbsolute + GROWTH_WEIGHTS.relative * weeklyRelative;
  const monthlyMixed =
    GROWTH_WEIGHTS.absolute * monthlyAbsolute + GROWTH_WEIGHTS.relative * monthlyRelative;

  // 综合：日 50% + 周 30% + 月 20%
  const score =
    GROWTH_WEIGHTS.daily * dailyMixed +
    GROWTH_WEIGHTS.weekly * weeklyMixed +
    GROWTH_WEIGHTS.monthly * monthlyMixed;

  return Math.round(clampScore(score));
}

/**
 * B. 项目成熟度评分 (权重: 0.20)
 * 年龄得分（30%）+ 发布频率（35%）+ 文档质量（35%）
 */
function calcMaturityScore(repo: RepositoryData): number {
  // 年龄得分：创建超过 2 年得满分
  let ageScore = 0;
  if (repo.createdAt) {
    const ageYears =
      (Date.now() - new Date(repo.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
    ageScore = clampScore((ageYears / 2) * 100);
  }

  // 发布频率：近 6 个月每月 2 次以上 release 得满分（即 12 次/6 个月）
  const releaseScore = clampScore((repo.releasesLast6m / 12) * 100);

  // 文档质量：README 大小 + 示例 + 主页
  let docScore = 0;
  if (repo.readmeSizeBytes) {
    // README > 5000 字节得 40 分
    docScore += clampScore((repo.readmeSizeBytes / 5000) * 40);
  }
  if (repo.badges.hasExamples) docScore += 30;
  if (repo.homepageUrl) docScore += 30;
  docScore = clampScore(docScore);

  const score =
    MATURITY_WEIGHTS.age * ageScore +
    MATURITY_WEIGHTS.releaseFrequency * releaseScore +
    MATURITY_WEIGHTS.documentation * docScore;

  return Math.round(clampScore(score));
}

/**
 * C. 社区健康评分 (权重: 0.20)
 * 贡献者多样性（35%）+ Issue 响应速度（35%）+ 活跃度（30%）
 */
function calcCommunityScore(repo: RepositoryData): number {
  // 贡献者多样性：50+ 贡献者得满分
  const contributorScore = repo.contributorCount
    ? clampScore((repo.contributorCount / 50) * 100)
    : 0;

  // Issue 响应速度：1 天内关闭得满分
  let issueScore = 0;
  if (repo.avgIssueCloseDays !== null) {
    if (repo.avgIssueCloseDays <= 1) {
      issueScore = 100;
    } else if (repo.avgIssueCloseDays <= 7) {
      issueScore = 100 - ((repo.avgIssueCloseDays - 1) / 6) * 50;
    } else if (repo.avgIssueCloseDays <= 30) {
      issueScore = 50 - ((repo.avgIssueCloseDays - 7) / 23) * 50;
    }
  }
  issueScore = clampScore(issueScore);

  // 活跃度：1 天内有 push 得满分
  let activityScore = 0;
  if (repo.pushedAt) {
    const daysSincePush = (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePush <= 1) {
      activityScore = 100;
    } else if (daysSincePush <= 7) {
      activityScore = 100 - ((daysSincePush - 1) / 6) * 30;
    } else if (daysSincePush <= 30) {
      activityScore = 70 - ((daysSincePush - 7) / 23) * 40;
    } else if (daysSincePush <= 90) {
      activityScore = 30 - ((daysSincePush - 30) / 60) * 30;
    }
  }
  activityScore = clampScore(activityScore);

  const score =
    COMMUNITY_WEIGHTS.contributorDiversity * contributorScore +
    COMMUNITY_WEIGHTS.issueResponseSpeed * issueScore +
    COMMUNITY_WEIGHTS.activity * activityScore;

  return Math.round(clampScore(score));
}

/**
 * D. AI 相关性评分 (权重: 0.20)
 * Topic 匹配（40%）+ README 关键词密度（40%）+ 语言信号（20%）
 */
function calcRelevanceScore(repo: RepositoryData): number {
  // Topic 匹配：匹配 3 个 AI_TOPICS 得满分
  const topicsLower = repo.topics.map((t) => t.toLowerCase());
  const aiTopicsLower = AI_TOPICS.map((t) => t.toLowerCase());
  let topicMatches = 0;
  for (const topic of topicsLower) {
    if (aiTopicsLower.includes(topic)) topicMatches++;
  }
  const topicScore = clampScore((topicMatches / 3) * 100);

  // README 关键词密度：匹配 5 个 AI_README_KEYWORDS 得满分
  // 使用 description 作为代替（README 内容在此阶段不可用）
  const descLower = (repo.description ?? "").toLowerCase();
  let keywordMatches = 0;
  for (const keyword of AI_README_KEYWORDS) {
    if (descLower.includes(keyword.toLowerCase())) keywordMatches++;
  }
  const keywordScore = clampScore((keywordMatches / 5) * 100);

  // 语言信号：Python、TypeScript 等 AI 常用语言加分
  const aiLanguages = ["python", "typescript", "javascript", "rust", "c++", "julia"];
  const langLower = (repo.language ?? "").toLowerCase();
  const languageScore = aiLanguages.includes(langLower) ? 100 : 0;

  const score =
    RELEVANCE_WEIGHTS.topicMatch * topicScore +
    RELEVANCE_WEIGHTS.readmeKeywords * keywordScore +
    RELEVANCE_WEIGHTS.languageSignal * languageScore;

  return Math.round(clampScore(score));
}

/**
 * E. 代码质量评分 (权重: 0.10)
 * 许可证（50 分）+ 测试（25 分）+ CI（25 分）
 */
function calcQualityScore(repo: RepositoryData): number {
  let score = 0;

  // 许可证
  if (repo.licenseSpdx) score += QUALITY_SCORES.license;

  // 测试
  if (repo.badges.hasTests) score += QUALITY_SCORES.tests;

  // CI
  if (repo.badges.hasCi) score += QUALITY_SCORES.ci;

  return Math.round(clampScore(score));
}

/** 将分数钳制到 0-100 范围 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
