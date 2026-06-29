// scripts/github/repo-mapper.ts
// GitHub API 响应映射：snake_case -> camelCase

import type { EnrichedRepo } from "@gitpulse/shared";

/** GitHub REST API 返回的仓库原始数据（snake_case 字段） */
interface GitHubApiRepo {
  id: number;
  full_name: string;
  owner: { login: string };
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  created_at: string | null;
  pushed_at: string | null;
  updated_at: string | null;
}

/**
 * 将 GitHub REST API 响应映射为 EnrichedRepo 类型
 * @param raw - GitHub API 原始响应
 * @param overrides - 可选的覆盖字段（如来自 Trending 页面的 starsGained）
 */
export function mapGitHubRepoToEnriched(
  raw: GitHubApiRepo,
  overrides?: Partial<EnrichedRepo>,
): EnrichedRepo {
  return {
    id: raw.id,
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    language: raw.language,
    languageColor: null, // 由调用方补充或使用 getLanguageColor
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    starsGained: null,
    forksGained: null,
    url: raw.html_url,
    trendingSince: null,
    trendingLanguage: null,
    homepageUrl: raw.homepage || null,
    topics: raw.topics ?? [],
    licenseSpdx: raw.license?.spdx_id ?? null,
    licenseName: raw.license?.name ?? null,
    isFork: raw.fork,
    isArchived: raw.archived,
    defaultBranch: raw.default_branch,
    openIssues: raw.open_issues_count,
    watchers: raw.subscribers_count,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at,
    githubUpdatedAt: raw.updated_at,
    contributorCount: null,
    readmeSizeBytes: null,
    releasesLast6m: 0,
    avgIssueCloseDays: null,
    healthPercentage: null,
    badges: {
      hasExamples: false,
      hasCi: false,
      hasReleases: false,
      hasTests: false,
      hasDocker: false,
      hasPypi: false,
      hasNpm: false,
      hasMcp: false,
    },
    ...overrides,
  };
}

/** GraphQL 查询返回的仓库节点 */
interface GraphQLRepoNode {
  databaseId: number;
  nameWithOwner: string;
  owner: { login: string };
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  primaryLanguage: { name: string; color: string } | null;
  stargazerCount: number;
  forkCount: number;
  issues: { totalCount: number };
  watchers: { totalCount: number };
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  licenseInfo: { spdxId: string; name: string } | null;
  isFork: boolean;
  isArchived: boolean;
  defaultBranchRef: { name: string } | null;
  createdAt: string | null;
  pushedAt: string | null;
  updatedAt: string | null;
}

/**
 * 将 GraphQL 查询结果映射为 EnrichedRepo 类型
 * @param node - GraphQL 仓库节点
 * @param overrides - 可选的覆盖字段
 */
export function mapGraphQLNodeToEnriched(
  node: GraphQLRepoNode,
  overrides?: Partial<EnrichedRepo>,
): EnrichedRepo {
  return {
    id: node.databaseId,
    owner: node.owner.login,
    name: node.name,
    fullName: node.nameWithOwner,
    description: node.description,
    language: node.primaryLanguage?.name ?? null,
    languageColor: node.primaryLanguage?.color ?? null,
    stars: node.stargazerCount,
    forks: node.forkCount,
    starsGained: null,
    forksGained: null,
    url: node.url,
    trendingSince: null,
    trendingLanguage: null,
    homepageUrl: node.homepageUrl || null,
    topics:
      node.repositoryTopics?.nodes?.map((t: { topic: { name: string } }) => t.topic.name) ?? [],
    licenseSpdx: node.licenseInfo?.spdxId ?? null,
    licenseName: node.licenseInfo?.name ?? null,
    isFork: node.isFork,
    isArchived: node.isArchived,
    defaultBranch: node.defaultBranchRef?.name ?? "main",
    openIssues: node.issues.totalCount,
    watchers: node.watchers.totalCount,
    createdAt: node.createdAt,
    pushedAt: node.pushedAt,
    githubUpdatedAt: node.updatedAt,
    contributorCount: null,
    readmeSizeBytes: null,
    releasesLast6m: 0,
    avgIssueCloseDays: null,
    healthPercentage: null,
    badges: {
      hasExamples: false,
      hasCi: false,
      hasReleases: false,
      hasTests: false,
      hasDocker: false,
      hasPypi: false,
      hasNpm: false,
      hasMcp: false,
    },
    ...overrides,
  };
}
