// scripts/github/scraper.ts
// cheerio HTML 解析器：GitHub Trending 页面辅助数据源
// 健壮性措施：最少元素断言（>= 10）、连续失败告警（3 次）、HTML 快照保存

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ScrapedRepo } from "@gitpulse/shared";
import * as cheerio from "cheerio";

/** HTML 快照保存目录 */
const SNAPSHOT_DIR = join(import.meta.dirname, "../../data/snapshots");

/** 连续失败计数器（模块级状态） */
let consecutiveFailures = 0;

/** 最大连续失败次数，超过后发出告警 */
const MAX_CONSECUTIVE_FAILURES = 3;

/** 最少期望元素数，低于此数视为抓取异常 */
const MIN_EXPECTED_REPOS = 10;

/**
 * 保存 HTML 快照用于调试
 * @param html - 原始 HTML 内容
 * @param language - 语言标识
 * @param since - 时间维度
 */
function saveSnapshot(html: string, language: string, since: string): void {
  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `trending-${language}-${since}-${timestamp}.html`;
  writeFileSync(join(SNAPSHOT_DIR, filename), html, "utf-8");
}

/**
 * 从 GitHub Trending 页面 HTML 解析仓库列表
 * @param html - 页面 HTML 内容
 * @param language - 语言筛选条件（null 表示 all）
 * @returns 解析出的仓库列表
 */
export function parseTrendingHTML(html: string, language: string | null): ScrapedRepo[] {
  const $ = cheerio.load(html);
  const repos: ScrapedRepo[] = [];

  // GitHub Trending 页面使用 article.Box-row 作为每个仓库的容器
  const rows = $("article.Box-row");

  for (let i = 0; i < rows.length; i++) {
    const row = rows.eq(i);

    // 仓库全名：从 h2 > a 链接提取
    const repoLink = row.find("h2 a");
    const href = repoLink.attr("href")?.trim();
    if (!href) continue;

    // href 格式: /owner/name
    const parts = href.replace(/^\//, "").split("/");
    if (parts.length < 2) continue;
    const owner = parts[0];
    const name = parts[1];
    const fullName = `${owner}/${name}`;

    // 描述
    const description = row.find("p.col-9").text().trim() || null;

    // 编程语言
    const langSpan = row.find('[itemprop="programmingLanguage"]');
    const repoLanguage = langSpan.text().trim() || null;

    // 语言颜色
    const langColor = row.find(".repo-language-color").css("background-color") || null;

    // 总星标数
    const starsText = row.find('a[href$="/stargazers"]').text().trim().replace(/,/g, "");
    const stars = Number.parseInt(starsText, 10) || 0;

    // 总 fork 数
    const forksText = row.find('a[href$="/forks"]').text().trim().replace(/,/g, "");
    const forks = Number.parseInt(forksText, 10) || 0;

    // 周期内星标增长（"123 stars today/this week/this month"）
    const gainedText = row
      .find(".float-sm-right, .d-inline-block.float-sm-right")
      .text()
      .trim()
      .replace(/,/g, "");
    const gainedMatch = gainedText.match(/(\d+)/);
    const starsGained = gainedMatch ? Number.parseInt(gainedMatch[1], 10) : null;

    repos.push({
      owner,
      name,
      fullName,
      description,
      language: repoLanguage,
      languageColor: langColor,
      stars,
      forks,
      starsGained,
      forksGained: null, // Trending 页面不显示 fork 增长
      url: `https://github.com/${fullName}`,
      trendingSince: new Date().toISOString(),
      trendingLanguage: language,
    });
  }

  return repos;
}

/**
 * 抓取 GitHub Trending 页面
 * @param language - 编程语言（null 表示 all）
 * @param since - 时间维度
 * @returns 解析结果，失败返回 null
 */
export async function scrapeTrending(
  language: string | null,
  since: "daily" | "weekly" | "monthly",
): Promise<ScrapedRepo[] | null> {
  const langPath = language ?? "";
  const url = `https://github.com/trending/${langPath}?since=${since}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GitPulse-AI/1.0 (github-trending-scraper)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // 保存快照用于调试
    saveSnapshot(html, language ?? "all", since);

    const repos = parseTrendingHTML(html, language);

    // 最少元素断言：低于阈值视为异常
    if (repos.length < MIN_EXPECTED_REPOS) {
      console.warn(
        `[Scraper] 警告: ${url} 仅解析到 ${repos.length} 个仓库（期望 >= ${MIN_EXPECTED_REPOS}），HTML 结构可能已变更`,
      );
      consecutiveFailures++;
    } else {
      // 成功，重置失败计数
      consecutiveFailures = 0;
    }

    // 连续失败告警
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `[Scraper] 告警: 连续 ${consecutiveFailures} 次抓取结果不足，GitHub Trending HTML 结构可能已变更，建议检查解析逻辑`,
      );
    }

    console.log(
      `[Scraper] language=${language ?? "all"} since=${since} 解析 ${repos.length} 个仓库`,
    );
    return repos;
  } catch (error) {
    consecutiveFailures++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] 抓取失败: ${url} - ${message}`);

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `[Scraper] 告警: 连续 ${consecutiveFailures} 次抓取失败，建议检查网络连接或 GitHub 可访问性`,
      );
    }

    return null;
  }
}

/**
 * 重置连续失败计数器（用于测试）
 */
export function resetFailureCount(): void {
  consecutiveFailures = 0;
}

/**
 * 获取当前连续失败次数（用于监控）
 */
export function getFailureCount(): number {
  return consecutiveFailures;
}
