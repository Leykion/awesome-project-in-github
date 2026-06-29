// packages/shared/src/utils/health-badge.ts

export type HealthBadge = "green" | "yellow" | "red";

export function computeHealthBadge(repo: {
  pushedAt: string | null;
  openIssues: number;
  hasCi: boolean;
  hasReleases: boolean;
  isArchived: boolean;
}): HealthBadge {
  if (repo.isArchived) return "red";

  const now = Date.now();
  const pushedAtMs = repo.pushedAt ? new Date(repo.pushedAt).getTime() : 0;
  const daysSincePush = (now - pushedAtMs) / (1000 * 60 * 60 * 24);

  if (daysSincePush >= 90) return "red";
  if (daysSincePush < 14 && repo.openIssues < 500 && (repo.hasCi || repo.hasReleases)) {
    return "green";
  }
  if (daysSincePush < 90 && repo.openIssues < 1000) {
    return "yellow";
  }
  return "red";
}
