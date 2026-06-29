// scripts/github/api-client.ts
// GitHub REST v3 和 GraphQL v4 客户端
// REST 用于单个仓库补全，GraphQL 用于批量查询（100 repos/query）

import type { EnrichedRepo } from "@gitpulse/shared";
import { RateLimiter } from "./rate-limiter";
import { mapGitHubRepoToEnriched, mapGraphQLNodeToEnriched } from "./repo-mapper";

/** GraphQL 批量查询的仓库片段 */
const REPO_FRAGMENT = `
  fragment RepoFields on Repository {
    databaseId
    nameWithOwner
    owner { login }
    name
    description
    url
    homepageUrl
    primaryLanguage { name color }
    stargazerCount
    forkCount
    issues(states: OPEN) { totalCount }
    watchers { totalCount }
    repositoryTopics(first: 20) {
      nodes { topic { name } }
    }
    licenseInfo { spdxId name }
    isFork
    isArchived
    defaultBranchRef { name }
    createdAt
    pushedAt
    updatedAt
  }
`;

/** GitHub API 客户端 */
export class GitHubApiClient {
  private readonly token: string;
  private readonly rateLimiter: RateLimiter;

  constructor(token: string, rateLimiter?: RateLimiter) {
    this.token = token;
    this.rateLimiter = rateLimiter ?? new RateLimiter();
  }

  /** 获取速率限制管理器实例 */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * REST API: 获取单个仓库详情
   * @param owner - 仓库所有者
   * @param name - 仓库名称
   */
  async fetchRepo(owner: string, name: string): Promise<EnrichedRepo | null> {
    await this.rateLimiter.waitIfNeeded("rest");

    const url = `https://api.github.com/repos/${owner}/${name}`;
    const response = await fetch(url, {
      headers: this.restHeaders(),
    });

    this.rateLimiter.updateFromHeaders("rest", response.headers);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[REST] 仓库不存在: ${owner}/${name}`);
        return null;
      }
      console.error(`[REST] 获取仓库失败: ${owner}/${name} - ${response.status}`);
      return null;
    }

    // biome-ignore lint/suspicious/noExplicitAny: GitHub REST API 动态响应
    const data = (await response.json()) as any;
    return mapGitHubRepoToEnriched(data);
  }

  /**
   * REST API: 获取仓库 README 内容
   * @param owner - 仓库所有者
   * @param name - 仓库名称
   * @param truncateChars - 截断字符数
   */
  async fetchReadme(owner: string, name: string, truncateChars: number): Promise<string | null> {
    await this.rateLimiter.waitIfNeeded("rest");

    const url = `https://api.github.com/repos/${owner}/${name}/readme`;
    const response = await fetch(url, {
      headers: {
        ...this.restHeaders(),
        Accept: "application/vnd.github.raw+json",
      },
    });

    this.rateLimiter.updateFromHeaders("rest", response.headers);

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`[REST] 获取 README 失败: ${owner}/${name} - ${response.status}`);
      return null;
    }

    const text = await response.text();
    return text.slice(0, truncateChars);
  }

  /**
   * REST API: 获取仓库近 6 个月的 release 数量
   * @param owner - 仓库所有者
   * @param name - 仓库名称
   */
  async fetchRecentReleaseCount(owner: string, name: string): Promise<number> {
    await this.rateLimiter.waitIfNeeded("rest");

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const url = `https://api.github.com/repos/${owner}/${name}/releases?per_page=100`;
    const response = await fetch(url, {
      headers: this.restHeaders(),
    });

    this.rateLimiter.updateFromHeaders("rest", response.headers);

    if (!response.ok) return 0;

    const releases = (await response.json()) as { published_at: string | null }[];
    return releases.filter((r) => {
      if (!r.published_at) return false;
      return new Date(r.published_at) >= sixMonthsAgo;
    }).length;
  }

  /**
   * REST API: 获取贡献者数量
   * @param owner - 仓库所有者
   * @param name - 仓库名称
   */
  async fetchContributorCount(owner: string, name: string): Promise<number | null> {
    await this.rateLimiter.waitIfNeeded("rest");

    // 使用 per_page=1 + Link header 快速获取贡献者总数
    const url = `https://api.github.com/repos/${owner}/${name}/contributors?per_page=1&anon=true`;
    const response = await fetch(url, {
      headers: this.restHeaders(),
    });

    this.rateLimiter.updateFromHeaders("rest", response.headers);

    if (!response.ok) return null;

    // 从 Link header 提取最后一页的页码
    const linkHeader = response.headers.get("link");
    if (!linkHeader) {
      // 没有 Link header 说明只有 1 页，直接返回条目数
      const data = (await response.json()) as unknown[];
      return data.length;
    }

    const lastMatch = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
    if (lastMatch) {
      return Number.parseInt(lastMatch[1], 10);
    }

    return null;
  }

  /**
   * REST API: 检查仓库根目录中是否存在特定文件/目录
   * 用 1-2 次 API 调用替代逐个 HEAD 请求
   */
  async checkPaths(owner: string, name: string, paths: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const p of paths) {
      results[p] = false;
    }

    // 获取根目录内容（1 次 API 调用）
    await this.rateLimiter.waitIfNeeded("rest");
    const rootUrl = `https://api.github.com/repos/${owner}/${name}/contents/`;
    const rootResp = await fetch(rootUrl, { headers: this.restHeaders() });
    this.rateLimiter.updateFromHeaders("rest", rootResp.headers);

    if (!rootResp.ok) return results;

    const rootItems = (await rootResp.json()) as { name: string; type: string }[];
    const rootNames = new Set(rootItems.map((item) => item.name));

    // 匹配根目录下的路径
    for (const p of paths) {
      if (!p.includes("/")) {
        results[p] = rootNames.has(p);
      }
    }

    // .github/workflows 需要额外检查 .github 目录（仅在 .github 存在时，1 次 API 调用）
    if (paths.includes(".github/workflows") && rootNames.has(".github")) {
      await this.rateLimiter.waitIfNeeded("rest");
      const ghUrl = `https://api.github.com/repos/${owner}/${name}/contents/.github`;
      const ghResp = await fetch(ghUrl, { headers: this.restHeaders() });
      this.rateLimiter.updateFromHeaders("rest", ghResp.headers);

      if (ghResp.ok) {
        const ghItems = (await ghResp.json()) as { name: string }[];
        results[".github/workflows"] = ghItems.some((item) => item.name === "workflows");
      }
    }

    return results;
  }

  /**
   * REST API: 获取已关闭 issue 的平均关闭天数
   * @param owner - 仓库所有者
   * @param name - 仓库名称
   * @param sampleSize - 采样数量
   */
  async fetchAvgIssueCloseDays(
    owner: string,
    name: string,
    sampleSize = 30,
  ): Promise<number | null> {
    await this.rateLimiter.waitIfNeeded("rest");

    const url = `https://api.github.com/repos/${owner}/${name}/issues?state=closed&per_page=${sampleSize}&sort=updated&direction=desc`;
    const response = await fetch(url, {
      headers: this.restHeaders(),
    });

    this.rateLimiter.updateFromHeaders("rest", response.headers);

    if (!response.ok) return null;

    const issues = (await response.json()) as {
      created_at: string;
      closed_at: string | null;
      pull_request?: unknown;
    }[];

    // 过滤掉 PR（issue endpoint 也会返回 PR）
    const pureIssues = issues.filter((i) => !i.pull_request && i.closed_at);

    if (pureIssues.length === 0) return null;

    const totalDays = pureIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at).getTime();
      // closed_at 已在 filter 中确认非 null
      const closed = new Date(issue.closed_at as string).getTime();
      return sum + (closed - created) / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round((totalDays / pureIssues.length) * 10) / 10;
  }

  /**
   * GraphQL API: 批量查询仓库（100 repos/query）
   * @param fullNames - 仓库全名列表 (owner/name)
   */
  async batchQueryGraphQL(fullNames: string[]): Promise<EnrichedRepo[]> {
    const results: EnrichedRepo[] = [];
    // 每批 30 个仓库，避免 GitHub GraphQL 资源节点限制（100 个仓库容易触发 "Resource limits exceeded"）
    const batchSize = 30;

    for (let i = 0; i < fullNames.length; i += batchSize) {
      const batch = fullNames.slice(i, i + batchSize);
      await this.rateLimiter.waitIfNeeded("graphql");

      const aliases = batch.map((fn, idx) => {
        const [owner, name] = fn.split("/");
        return `repo${idx}: repository(owner: "${owner}", name: "${name}") { ...RepoFields }`;
      });

      const query = `
        ${REPO_FRAGMENT}
        query {
          ${aliases.join("\n")}
        }
      `;

      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ query }),
      });

      this.rateLimiter.updateFromHeaders("graphql", response.headers);

      if (!response.ok) {
        console.error(
          `[GraphQL] 批量查询失败: batch ${Math.floor(i / batchSize) + 1} - ${response.status}`,
        );
        continue;
      }

      const json = (await response.json()) as {
        data?: Record<string, unknown>;
        errors?: { message: string }[];
      };

      if (json.errors) {
        console.warn("[GraphQL] 查询包含错误:", json.errors.map((e) => e.message).join("; "));
      }

      if (json.data) {
        for (const key of Object.keys(json.data)) {
          const node = json.data[key];
          if (node) {
            try {
              // biome-ignore lint/suspicious/noExplicitAny: GraphQL 动态响应
              results.push(mapGraphQLNodeToEnriched(node as any));
            } catch (err) {
              console.warn(`[GraphQL] 映射失败: ${key}`, err);
            }
          }
        }
      }

      console.log(
        `[GraphQL] 批量查询 batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(fullNames.length / batchSize)} 完成`,
      );

      // 批次间延迟 1 秒
      if (i + batchSize < fullNames.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * REST API: 补全单个仓库的完整元数据（badges、贡献者、release 等）
   * @param repo - 已有的基础仓库数据
   */
  async enrichRepoMetadata(repo: EnrichedRepo): Promise<EnrichedRepo> {
    const { owner, name } = repo;

    // 并行获取元数据（checkPaths 内部只需 1-2 次调用）
    const [contributorCount, releasesLast6m, pathChecks] = await Promise.all([
      this.fetchContributorCount(owner, name),
      this.fetchRecentReleaseCount(owner, name),
      this.checkPaths(owner, name, [
        "examples",
        ".github/workflows",
        "tests",
        "test",
        "Dockerfile",
        "setup.py",
        "pyproject.toml",
        "package.json",
        "mcp.json",
      ]),
    ]);

    return {
      ...repo,
      contributorCount,
      releasesLast6m,
      badges: {
        hasExamples: pathChecks.examples ?? false,
        hasCi: pathChecks[".github/workflows"] ?? false,
        hasReleases: releasesLast6m > 0,
        hasTests: (pathChecks.tests ?? false) || (pathChecks.test ?? false),
        hasDocker: pathChecks.Dockerfile ?? false,
        hasPypi: (pathChecks["setup.py"] ?? false) || (pathChecks["pyproject.toml"] ?? false),
        hasNpm: pathChecks["package.json"] ?? false,
        hasMcp: pathChecks["mcp.json"] ?? false,
      },
    };
  }

  /** 构建 REST API 请求头 */
  private restHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
}
