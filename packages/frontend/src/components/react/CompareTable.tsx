// packages/frontend/src/components/react/CompareTable.tsx
// 仓库对比表格：最多 3 个仓库并排对比

import type { RepositoryData } from "@gitpulse/shared";
import { useMemo } from "react";

interface Props {
  /** 待对比仓库列表（最多 3 个） */
  repos: RepositoryData[];
}

/** 对比指标行定义 */
interface MetricRow {
  label: string;
  getValue: (repo: RepositoryData) => string | number;
  /** 高亮最佳值的比较方向：higher = 越大越好，lower = 越小越好 */
  compareDirection?: "higher" | "lower";
}

/** 格式化数字为人类可读格式 */
function fmtNum(num: number): string {
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

/** 健康等级文本映射 */
function getHealthLabel(repo: RepositoryData): string {
  if (repo.isArchived) return "已归档";
  const pushedAt = repo.pushedAt ? new Date(repo.pushedAt).getTime() : 0;
  const daysSincePush = (Date.now() - pushedAt) / (1000 * 60 * 60 * 24);
  if (daysSincePush >= 90) return "不活跃";
  if (
    daysSincePush < 14 &&
    repo.openIssues < 500 &&
    (repo.badges.hasCi || repo.badges.hasReleases)
  ) {
    return "健康";
  }
  if (daysSincePush < 90 && repo.openIssues < 1000) return "一般";
  return "不活跃";
}

/** 对比指标列表 */
const METRICS: MetricRow[] = [
  { label: "总星标", getValue: (r) => fmtNum(r.stars), compareDirection: "higher" },
  { label: "Forks", getValue: (r) => fmtNum(r.forks), compareDirection: "higher" },
  {
    label: "综合评分",
    getValue: (r) => Math.round(r.scores.composite),
    compareDirection: "higher",
  },
  { label: "增长速度", getValue: (r) => Math.round(r.scores.growth), compareDirection: "higher" },
  {
    label: "社区健康",
    getValue: (r) => Math.round(r.scores.community),
    compareDirection: "higher",
  },
  {
    label: "项目成熟度",
    getValue: (r) => Math.round(r.scores.maturity),
    compareDirection: "higher",
  },
  {
    label: "AI 相关性",
    getValue: (r) => Math.round(r.scores.relevance),
    compareDirection: "higher",
  },
  { label: "代码质量", getValue: (r) => Math.round(r.scores.quality), compareDirection: "higher" },
  { label: "等级", getValue: (r) => r.tier },
  { label: "健康状态", getValue: (r) => getHealthLabel(r) },
  { label: "许可证", getValue: (r) => r.licenseSpdx || "未知" },
  { label: "编程语言", getValue: (r) => r.language || "未知" },
  { label: "开放 Issues", getValue: (r) => fmtNum(r.openIssues), compareDirection: "lower" },
  {
    label: "贡献者",
    getValue: (r) => (r.contributorCount ? fmtNum(r.contributorCount) : "-"),
    compareDirection: "higher",
  },
  { label: "CI", getValue: (r) => (r.badges.hasCi ? "有" : "无") },
  { label: "Docker", getValue: (r) => (r.badges.hasDocker ? "有" : "无") },
  { label: "PyPI", getValue: (r) => (r.badges.hasPypi ? "有" : "无") },
  { label: "npm", getValue: (r) => (r.badges.hasNpm ? "有" : "无") },
];

export function CompareTable({ repos }: Props) {
  // 限制最多 3 个仓库
  const displayRepos = repos.slice(0, 3);

  /** 计算每行的最佳值索引 */
  const bestIndices = useMemo(() => {
    return METRICS.map((metric) => {
      if (!metric.compareDirection || displayRepos.length < 2) return -1;

      const values = displayRepos.map((r) => {
        const val = metric.getValue(r);
        return typeof val === "number" ? val : Number.NaN;
      });

      // 跳过非数值指标
      if (values.every((v) => Number.isNaN(v))) return -1;

      const validValues = values.filter((v) => !Number.isNaN(v));
      if (validValues.length === 0) return -1;

      const best =
        metric.compareDirection === "higher" ? Math.max(...validValues) : Math.min(...validValues);

      return values.indexOf(best);
    });
  }, [displayRepos]);

  if (displayRepos.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        请选择仓库进行对比（最多 3 个）
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[var(--text-sm)]">
        {/* 表头：仓库名称 */}
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left py-3 px-4 text-[var(--color-text-secondary)] font-semibold w-[160px]">
              指标
            </th>
            {displayRepos.map((repo) => (
              <th key={repo.id} className="text-left py-3 px-4 font-semibold">
                <a
                  href={`/repo/${repo.fullName}`}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {repo.fullName}
                </a>
              </th>
            ))}
          </tr>
        </thead>
        {/* 指标行 */}
        <tbody>
          {METRICS.map((metric, rowIdx) => (
            <tr
              key={metric.label}
              className="border-b border-[var(--color-border)] hover:bg-[var(--color-elevated)] transition-colors"
              style={{
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-expo)",
              }}
            >
              <td className="py-2.5 px-4 text-[var(--color-text-secondary)] font-medium">
                {metric.label}
              </td>
              {displayRepos.map((repo, colIdx) => {
                const value = metric.getValue(repo);
                const isBest = bestIndices[rowIdx] === colIdx;
                return (
                  <td
                    key={repo.id}
                    className={`py-2.5 px-4 font-[var(--font-data)] ${isBest ? "text-[var(--color-accent)] font-semibold" : "text-[var(--color-text-primary)]"}`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
