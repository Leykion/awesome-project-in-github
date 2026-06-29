// scripts/pipeline/generate-collections.ts
// Stage 5: 精选合集自动生成
// 每周：生成 "本周上升最快 Top 10"（按周星标增长排序）
// 每月第一个周日：生成各分类 Top 10 合集
// 保留策略：最新合集 + 最近 4 个 weekly_digest

import type { FeaturedCollectionData, RepositoryData } from "@gitpulse/shared";
import { CATEGORY_SEEDS } from "@gitpulse/shared";
import type { PipelineConfig } from "../lib/config";
import {
  readFeaturedCollections,
  readRepositories,
  readTrending,
  writeFeaturedCollections,
} from "../lib/data-io";

/** 阶段结果 */
export interface GenerateCollectionsResult {
  /** 新生成的合集数 */
  generated: number;
  /** 清理的过期合集数 */
  cleaned: number;
  /** 当前合集总数 */
  total: number;
}

/**
 * 执行 Stage 5: 自动生成精选合集
 */
export async function generateCollections(
  _config: PipelineConfig,
): Promise<GenerateCollectionsResult> {
  const repos = readRepositories();
  const existing = readFeaturedCollections();
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  let generated = 0;

  // 获取下一个合集 ID
  let nextId = existing.length > 0 ? Math.max(...existing.map((c) => c.id)) + 1 : 1;

  // 读取周趋势数据用于排序
  const weeklyTrending = readTrending("weekly");
  const weeklyGainMap = new Map(weeklyTrending.map((t) => [t.fullName, t.starsGained ?? 0]));

  // 每周生成 "本周上升最快 Top 10"
  const weeklySlug = `weekly-rising-${dateStr}`;
  const hasThisWeekDigest = existing.some(
    (c) => c.collectionType === "weekly_digest" && c.slug === weeklySlug,
  );

  if (!hasThisWeekDigest) {
    const risingRepos = getTopRisingRepos(repos, weeklyGainMap, 10);
    if (risingRepos.length > 0) {
      const collection: FeaturedCollectionData = {
        id: nextId++,
        title: `${dateStr} 本周上升最快 Top 10`,
        slug: weeklySlug,
        description: `${dateStr} 周度最具增长势头的 AI 开源项目精选`,
        coverEmoji: "🚀",
        collectionType: "weekly_digest",
        isPublished: true,
        isPinned: false,
        sortOrder: 0,
        repos: risingRepos.map((repo, idx) => ({
          repoId: repo.id,
          fullName: repo.fullName,
          editorialNote: `周星标增长 +${weeklyGainMap.get(repo.fullName) ?? 0}`,
          sortOrder: idx + 1,
        })),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        publishedAt: now.toISOString(),
      };

      existing.push(collection);
      generated++;
      console.log(`[Collections] 生成周度合集: ${collection.title}`);
    }
  }

  // 每月第一个周日生成各分类 Top 10
  const dayOfWeek = now.getUTCDay(); // 0=周日
  const dayOfMonth = now.getUTCDate();
  const isFirstSunday = dayOfWeek === 0 && dayOfMonth <= 7;

  if (isFirstSunday) {
    const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    for (const category of CATEGORY_SEEDS) {
      const categorySlug = `category-top-${category.slug}-${monthStr}`;
      const hasThisCategory = existing.some((c) => c.slug === categorySlug);

      if (!hasThisCategory) {
        // 筛选该分类下的仓库，按 composite 评分排序取 Top 10
        const categoryRepos = repos
          .filter((r) => r.categorySlug === category.slug)
          .sort((a, b) => b.scores.composite - a.scores.composite)
          .slice(0, 10);

        if (categoryRepos.length > 0) {
          const collection: FeaturedCollectionData = {
            id: nextId++,
            title: `${monthStr} ${category.name} Top 10`,
            slug: categorySlug,
            description: `${monthStr} ${category.name} 分类最佳 AI 开源项目`,
            coverEmoji: category.icon,
            collectionType: "category_top",
            isPublished: true,
            isPinned: false,
            sortOrder: category.sortOrder,
            repos: categoryRepos.map((repo, idx) => ({
              repoId: repo.id,
              fullName: repo.fullName,
              editorialNote: null,
              sortOrder: idx + 1,
            })),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            publishedAt: now.toISOString(),
          };

          existing.push(collection);
          generated++;
          console.log(`[Collections] 生成月度分类合集: ${collection.title}`);
        }
      }
    }
  }

  // 保留策略：最新合集 + 最近 4 个 weekly_digest
  const cleaned = applyRetentionPolicy(existing);

  writeFeaturedCollections(existing);

  const result: GenerateCollectionsResult = {
    generated,
    cleaned,
    total: existing.length,
  };

  console.log(
    `[Collections] 完成: 新生成 ${result.generated}, 清理 ${result.cleaned}, 总计 ${result.total}`,
  );

  return result;
}

/**
 * 获取周星标增长最快的 Top N 仓库
 */
function getTopRisingRepos(
  repos: RepositoryData[],
  weeklyGainMap: Map<string, number>,
  limit: number,
): RepositoryData[] {
  return repos
    .filter((r) => r.scores.composite >= 30) // 至少是 tracked 级别
    .map((r) => ({
      repo: r,
      gain: weeklyGainMap.get(r.fullName) ?? 0,
    }))
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit)
    .filter((item) => item.gain > 0)
    .map((item) => item.repo);
}

/**
 * 保留策略：
 * - 所有 curated 和 category_top 合集保留
 * - weekly_digest 仅保留最近 4 个
 * - rising 仅保留最近 4 个
 * 返回清理的合集数
 */
function applyRetentionPolicy(collections: FeaturedCollectionData[]): number {
  const maxWeeklyDigests = 4;

  // 按类型分组
  const weeklyDigests = collections
    .filter((c) => c.collectionType === "weekly_digest")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 找出需要清理的 weekly_digest ID
  const expiredIds = new Set<number>();
  if (weeklyDigests.length > maxWeeklyDigests) {
    const toRemove = weeklyDigests.slice(maxWeeklyDigests);
    for (const c of toRemove) {
      expiredIds.add(c.id);
    }
  }

  if (expiredIds.size === 0) return 0;

  // 从数组中移除过期合集
  let i = collections.length;
  while (i--) {
    if (expiredIds.has(collections[i].id)) {
      collections.splice(i, 1);
    }
  }

  return expiredIds.size;
}
