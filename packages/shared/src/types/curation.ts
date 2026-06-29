// packages/shared/src/types/curation.ts

/** AI 策展分析结果 */
export interface CurationData {
  summary: string; // 项目摘要
  whyNotable: string; // 为什么值得关注
  categorySlug: string | null; // AI 分类 slug
  subcategory: string | null; // 子分类
  strengths: string[]; // 优势
  limitations: string[]; // 局限
  useCases: string[]; // 使用场景
  targetAudience: string | null; // 目标用户
  comparableProjects: string[]; // 可比较项目
  noveltyScore: number; // 新颖度 (0-10)
  clarityScore: number; // 清晰度 (0-10)
  productionScore: number; // 生产就绪度 (0-10)
  categoryFitScore: number; // 分类匹配度 (0-10)
  innovationRating: number | null; // 创新评级 (1-5)
  productionReadiness: number | null; // 生产就绪度 (1-5)
  learningCurve: "low" | "medium" | "high" | null;
  oneLiner: string | null; // 一句话描述
  ruleScore: number; // 规则评分
  llmScore: number | null; // LLM 评分
  compositeScore: number; // 综合得分
  modelUsed: string; // 使用的模型
  promptVersion: string; // Prompt 版本
  isFallback: boolean; // 是否为后备结果
  tokensInput: number | null;
  tokensOutput: number | null;
  evaluatedAt: string; // 评估时间 (ISO 8601)
}
