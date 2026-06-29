// scripts/github/search-api.ts
// GitHub Search API 客户端（主数据源）
// 搜索 AI 相关仓库，按语言和话题分类

import type { ScrapedRepo } from "@gitpulse/shared";
import { AI_TOPICS } from "@gitpulse/shared";
import type { RateLimiter } from "./rate-limiter";

/** Search API 单页响应结构 */
interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: SearchItem[];
}

/** Search API 返回的单个仓库条目 */
interface SearchItem {
  id: number;
  full_name: string;
  owner: { login: string };
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  pushed_at: string;
  updated_at: string;
}

/** 搜索选项 */
interface SearchOptions {
  /** 编程语言筛选（如 "python"），null 表示不限语言 */
  language: string | null;
  /** 时间维度，用于构建排序条件 */
  since: "daily" | "weekly" | "monthly";
  /** 最小星标数 */
  minStars?: number;
  /** 每页数量（最大 100） */
  perPage?: number;
  /** 最大获取页数 */
  maxPages?: number;
}

/**
 * 构建搜索查询字符串
 * @param language - 编程语言
 * @param since - 时间维度
 * @param minStars - 最小星标数
 */
function buildSearchQuery(
  language: string | null,
  since: "daily" | "weekly" | "monthly",
  minStars: number,
): string {
  // 计算时间范围
  const now = new Date();
  const daysMap = { daily: 1, weekly: 7, monthly: 30 } as const;
  const daysAgo = daysMap[since];
  const dateFrom = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const dateStr = dateFrom.toISOString().split("T")[0];

  // 构建 AI 话题查询（取前 5 个最通用的话题）
  const topTopics = AI_TOPICS.slice(0, 5);
  const topicQuery = topTopics.map((t) => `topic:${t}`).join(" OR ");

  const parts: string[] = [];
  parts.push(`(${topicQuery})`);
  parts.push(`stars:>=${minStars}`);
  parts.push(`pushed:>=${dateStr}`);

  if (language) {
    parts.push(`language:${language}`);
  }

  return parts.join(" ");
}

/**
 * 将 Search API 条目转换为 ScrapedRepo
 * @param item - Search API 返回条目
 * @param language - 搜索时使用的语言筛选条件
 */
function mapSearchItemToScraped(item: SearchItem, language: string | null): ScrapedRepo {
  return {
    owner: item.owner.login,
    name: item.name,
    fullName: item.full_name,
    description: item.description,
    language: item.language,
    languageColor: null, // Search API 不返回语言颜色
    stars: item.stargazers_count,
    forks: item.forks_count,
    starsGained: null, // Search API 无法获取星标增长
    forksGained: null,
    url: item.html_url,
    trendingSince: null,
    trendingLanguage: language,
  };
}

/**
 * 通过 GitHub Search API 搜索 AI 相关仓库
 * @param token - GitHub PAT
 * @param rateLimiter - 速率限制管理器
 * @param options - 搜索选项
 * @returns 搜索到的仓库列表
 */
export async function searchAIRepos(
  token: string,
  rateLimiter: RateLimiter,
  options: SearchOptions,
): Promise<ScrapedRepo[]> {
  const { language, since, minStars = 50, perPage = 100, maxPages = 3 } = options;
  const query = buildSearchQuery(language, since, minStars);
  const results: ScrapedRepo[] = [];

  for (let page = 1; page <= maxPages; page++) {
    // Search API 限制 30 req/min
    await rateLimiter.waitIfNeeded("search");

    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", query);
    url.searchParams.set("sort", "stars");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // 更新速率限制状态
    rateLimiter.updateFromHeaders("search", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[SearchAPI] 请求失败: ${response.status} ${response.statusText} - ${errorText}`,
      );
      // 422 通常表示查询太复杂，直接退出
      if (response.status === 422) break;
      // 403 速率限制，等待后重试当前页
      if (response.status === 403) {
        await rateLimiter.waitIfNeeded("search");
        page--; // 重试当前页
        continue;
      }
      break;
    }

    const data = (await response.json()) as SearchResponse;
    const items = data.items ?? [];

    for (const item of items) {
      results.push(mapSearchItemToScraped(item, language));
    }

    // 如果返回条目数少于 perPage，说明已到最后一页
    if (items.length < perPage) break;

    // Search API 分页间延迟 2 秒，避免触发二次速率限制
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(
    `[SearchAPI] language=${language ?? "all"} since=${since} 获取 ${results.length} 个仓库`,
  );
  return results;
}
