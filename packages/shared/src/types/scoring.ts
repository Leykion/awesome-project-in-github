// packages/shared/src/types/scoring.ts
// 评分权重、阈值类型

/** 评分维度权重配置 */
export interface ScoringWeights {
  growth: number; // 增长速度权重
  maturity: number; // 项目成熟度权重
  community: number; // 社区健康度权重
  relevance: number; // AI 相关性权重
  quality: number; // 代码质量权重
}

/** 评分等级阈值 */
export interface TierThresholds {
  star: number; // >= star 为 star 等级
  notable: number; // >= notable 为 notable 等级
  tracked: number; // >= tracked 为 tracked 等级
}

/** 评分维度 */
export type ScoringDimension = keyof ScoringWeights;

/** 仓库等级 */
export type RepoTier = "star" | "notable" | "tracked";
