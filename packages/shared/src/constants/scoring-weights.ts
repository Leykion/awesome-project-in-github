// packages/shared/src/constants/scoring-weights.ts
// 评分信号权重常量

import type { ScoringWeights, TierThresholds } from "../types/scoring";

/**
 * 综合得分 = 0.30 * 增长速度 + 0.20 * 项目成熟度 + 0.20 * 社区健康 + 0.20 * AI 相关性 + 0.10 * 代码质量
 */
export const SCORING_WEIGHTS: ScoringWeights = {
  growth: 0.3, // 增长速度权重
  maturity: 0.2, // 项目成熟度权重
  community: 0.2, // 社区健康度权重
  relevance: 0.2, // AI 相关性权重
  quality: 0.1, // 代码质量权重
};

/** 等级分界阈值 */
export const TIER_THRESHOLDS: TierThresholds = {
  star: 70, // >= 70 为 star 等级
  notable: 50, // >= 50 为 notable 等级
  tracked: 30, // >= 30 为 tracked 等级
};

/** 硬性排除规则阈值 */
export const EXCLUSION_RULES = {
  /** 最低星标数 */
  minStars: 50,
  /** 最大未活跃天数 */
  maxInactiveDays: 180,
  /** fork 仓库需达到原仓库星标的倍数才保留 */
  forkStarMultiplier: 5,
} as const;

/** 增长速度子维度权重 */
export const GROWTH_WEIGHTS = {
  daily: 0.5, // 日增长 50%
  weekly: 0.3, // 周增长 30%
  monthly: 0.2, // 月增长 20%
  absolute: 0.6, // 绝对增长 60%
  relative: 0.4, // 相对增长 40%
} as const;

/** 项目成熟度子维度权重 */
export const MATURITY_WEIGHTS = {
  age: 0.3, // 年龄得分 30%
  releaseFrequency: 0.35, // 发布频率 35%
  documentation: 0.35, // 文档质量 35%
} as const;

/** 社区健康子维度权重 */
export const COMMUNITY_WEIGHTS = {
  contributorDiversity: 0.35, // 贡献者多样性 35%
  issueResponseSpeed: 0.35, // Issue 响应速度 35%
  activity: 0.3, // 活跃度 30%
} as const;

/** AI 相关性子维度权重 */
export const RELEVANCE_WEIGHTS = {
  topicMatch: 0.4, // Topic 匹配 40%
  readmeKeywords: 0.4, // README 关键词密度 40%
  languageSignal: 0.2, // 语言信号 20%
} as const;

/** 代码质量子维度分值 */
export const QUALITY_SCORES = {
  license: 50, // 许可证 50 分
  tests: 25, // 测试 25 分
  ci: 25, // CI 25 分
} as const;
