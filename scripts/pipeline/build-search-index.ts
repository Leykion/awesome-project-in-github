// scripts/pipeline/build-search-index.ts
// 构建 Fuse.js 搜索索引，输出到 data/search-index.json

import { readRepositories, writeDataFile } from "../lib/data-io";

export function buildSearchIndex(): void {
  const repos = readRepositories();

  // 构建精简的搜索索引（仅保留搜索所需字段，减小客户端加载体积）
  const searchEntries = repos.map((repo) => ({
    id: repo.id,
    fullName: repo.fullName,
    description: repo.description || "",
    topics: repo.topics.join(" "),
    language: repo.language || "",
    categorySlug: repo.categorySlug || "",
    stars: repo.stars,
    licenseSpdx: repo.licenseSpdx || "",
    oneLiner: repo.curation?.oneLiner || "",
  }));

  writeDataFile("search-index.json", searchEntries);
}
