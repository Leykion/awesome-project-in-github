// scripts/test-scraper.ts
// 手动测试抓取器：抓取 GitHub Trending 页面并输出结果

import { scrapeTrending } from "./github/scraper";

async function main() {
  console.log("[TestScraper] 开始测试 GitHub Trending 抓取器...\n");

  const since = "daily" as const;
  const language = null;

  console.log(`[TestScraper] 抓取参数: language=${language ?? "all"}, since=${since}`);

  const repos = await scrapeTrending(language, since);

  if (!repos) {
    console.error("[TestScraper] 抓取失败，返回 null");
    process.exit(1);
  }

  console.log(`[TestScraper] 成功解析 ${repos.length} 个仓库\n`);

  for (const repo of repos.slice(0, 5)) {
    console.log(`  ${repo.fullName}`);
    console.log(`    Stars: ${repo.stars} | Gained: ${repo.starsGained ?? "N/A"}`);
    console.log(`    Language: ${repo.language ?? "N/A"}`);
    console.log(`    Description: ${repo.description?.slice(0, 80) ?? "N/A"}`);
    console.log();
  }

  if (repos.length > 5) {
    console.log(`  ... 还有 ${repos.length - 5} 个仓库`);
  }

  console.log("[TestScraper] 测试完成");
}

main().catch((err) => {
  console.error("[TestScraper] 执行失败:", err);
  process.exit(1);
});
