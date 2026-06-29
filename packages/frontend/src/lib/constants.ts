// packages/frontend/src/lib/constants.ts
// 前端常量：分类 slug 到颜色、图标的映射

import { CATEGORY_SEEDS } from "@gitpulse/shared";

/** 分类 slug 到 CSS 颜色变量名的映射 */
export const CATEGORY_COLORS: Record<string, string> = {
  "llm-frameworks": "var(--color-cat-llm)",
  "vector-databases": "var(--color-cat-vector)",
  "ai-agents": "var(--color-cat-agents)",
  "mlops-evaluation": "var(--color-cat-mlops)",
  "model-serving": "var(--color-cat-serving)",
  "ai-dev-tools": "var(--color-cat-devtools)",
  multimodal: "var(--color-cat-multimodal)",
  "datasets-benchmarks": "var(--color-cat-datasets)",
  "ai-applications": "var(--color-cat-apps)",
};

/** 分类 slug 到图标的映射（从 CATEGORY_SEEDS 生成） */
export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORY_SEEDS.map((cat) => [cat.slug, cat.icon]),
);

/** 分类 slug 到显示名称的映射（从 CATEGORY_SEEDS 生成） */
export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORY_SEEDS.map((cat) => [cat.slug, cat.name]),
);

/** 分类 slug 到描述的映射（从 CATEGORY_SEEDS 生成） */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  CATEGORY_SEEDS.map((cat) => [cat.slug, cat.description]),
);

/** 所有分类 slug 列表（按 sortOrder 排序） */
export const CATEGORY_SLUGS: string[] = CATEGORY_SEEDS.sort(
  (a, b) => a.sortOrder - b.sortOrder,
).map((cat) => cat.slug);
