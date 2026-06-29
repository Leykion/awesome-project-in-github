// scripts/seed-categories.ts
// 种子数据脚本：使用 CATEGORY_SEEDS 初始化 categories.json

import { CATEGORY_SEEDS } from "@gitpulse/shared";
import type { CategoryData } from "@gitpulse/shared";
import { writeCategories } from "./lib/data-io";

// 将种子数据转换为完整的 CategoryData（补充 repoCount 和 topRepos 字段）
const categories: CategoryData[] = CATEGORY_SEEDS.map((seed) => ({
  ...seed,
  repoCount: 0,
  topRepos: [],
}));

writeCategories(categories);

console.log(`categories.json 已初始化，共 ${categories.length} 个分类`);
