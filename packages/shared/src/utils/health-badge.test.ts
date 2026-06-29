// packages/shared/src/utils/health-badge.test.ts
// 健康徽章计算逻辑单元测试

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeHealthBadge } from "./health-badge";

/** 构造测试用仓库健康数据 */
function makeHealthInput(
  overrides: Partial<{
    pushedAt: string | null;
    openIssues: number;
    hasCi: boolean;
    hasReleases: boolean;
    isArchived: boolean;
  }> = {},
) {
  return {
    pushedAt: new Date().toISOString(),
    openIssues: 10,
    hasCi: true,
    hasReleases: true,
    isArchived: false,
    ...overrides,
  };
}

describe("computeHealthBadge", () => {
  beforeEach(() => {
    // 固定时间基点以确保测试稳定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("red 状态", () => {
    it("已归档仓库应返回 red", () => {
      const result = computeHealthBadge(makeHealthInput({ isArchived: true }));
      expect(result).toBe("red");
    });

    it("已归档仓库无论其他条件多好都应返回 red", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          isArchived: true,
          pushedAt: new Date("2026-06-29T00:00:00Z").toISOString(), // 刚推送
          openIssues: 0,
          hasCi: true,
          hasReleases: true,
        }),
      );
      expect(result).toBe("red");
    });

    it("超过 90 天未 push 应返回 red", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-03-01T00:00:00Z").toISOString(), // ~120 天前
        }),
      );
      expect(result).toBe("red");
    });

    it("恰好 90 天未 push 应返回 red", () => {
      const ninetyDaysAgo = new Date("2026-06-29T12:00:00Z");
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: ninetyDaysAgo.toISOString(),
        }),
      );
      expect(result).toBe("red");
    });

    it("pushedAt 为 null 应返回 red（daysSincePush 极大）", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: null,
        }),
      );
      expect(result).toBe("red");
    });

    it("openIssues >= 1000 且不满足 green 条件应返回 red", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-10T00:00:00Z").toISOString(), // ~19 天前，不满足 green 的 <14 天
          openIssues: 1000,
          hasCi: true,
          hasReleases: true,
        }),
      );
      expect(result).toBe("red");
    });
  });

  describe("green 状态", () => {
    it("近期推送 + 少量 issues + 有 CI 应返回 green", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-28T00:00:00Z").toISOString(), // 1 天前
          openIssues: 100,
          hasCi: true,
          hasReleases: false,
        }),
      );
      expect(result).toBe("green");
    });

    it("近期推送 + 少量 issues + 有 releases 应返回 green", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-28T00:00:00Z").toISOString(),
          openIssues: 100,
          hasCi: false,
          hasReleases: true,
        }),
      );
      expect(result).toBe("green");
    });

    it("恰好 13 天前推送应仍为 green（< 14）", () => {
      const thirteenDaysAgo = new Date("2026-06-29T12:00:00Z");
      thirteenDaysAgo.setDate(thirteenDaysAgo.getDate() - 13);
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: thirteenDaysAgo.toISOString(),
          openIssues: 0,
          hasCi: true,
        }),
      );
      expect(result).toBe("green");
    });

    it("openIssues 恰好 499 且其他条件满足应返回 green", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-29T00:00:00Z").toISOString(),
          openIssues: 499,
          hasCi: true,
        }),
      );
      expect(result).toBe("green");
    });
  });

  describe("yellow 状态", () => {
    it("14 天前推送应返回 yellow（不满足 green 的 < 14 天）", () => {
      const fourteenDaysAgo = new Date("2026-06-29T12:00:00Z");
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: fourteenDaysAgo.toISOString(),
          openIssues: 100,
          hasCi: true,
        }),
      );
      expect(result).toBe("yellow");
    });

    it("30 天前推送 + 合理 issues 应返回 yellow", () => {
      const thirtyDaysAgo = new Date("2026-06-29T12:00:00Z");
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: thirtyDaysAgo.toISOString(),
          openIssues: 200,
        }),
      );
      expect(result).toBe("yellow");
    });

    it("89 天前推送 + 少量 issues 应返回 yellow", () => {
      const eightyNineDaysAgo = new Date("2026-06-29T12:00:00Z");
      eightyNineDaysAgo.setDate(eightyNineDaysAgo.getDate() - 89);
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: eightyNineDaysAgo.toISOString(),
          openIssues: 100,
        }),
      );
      expect(result).toBe("yellow");
    });

    it("近期推送但 openIssues >= 500 且无 CI 和 releases 应返回 yellow", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-29T00:00:00Z").toISOString(),
          openIssues: 500,
          hasCi: false,
          hasReleases: false,
        }),
      );
      // 不满足 green: openIssues >= 500
      // 不满足第一个 red 条件: daysSincePush < 90
      // 满足 yellow: daysSincePush < 90 && openIssues < 1000
      expect(result).toBe("yellow");
    });

    it("openIssues 恰好 999 且近期推送应返回 yellow", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-15T00:00:00Z").toISOString(), // ~14 天前
          openIssues: 999,
          hasCi: true,
        }),
      );
      expect(result).toBe("yellow");
    });
  });

  describe("边界组合", () => {
    it("刚好推送 + 0 issues + 有 CI 应返回 green", () => {
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-29T12:00:00Z").toISOString(), // 刚刚
          openIssues: 0,
          hasCi: true,
          hasReleases: false,
        }),
      );
      expect(result).toBe("green");
    });

    it("近期推送但无 CI 且无 releases 且 issues < 500 应返回 yellow", () => {
      // daysSincePush < 14, openIssues < 500, 但 hasCi=false 且 hasReleases=false
      // 不满足 green 条件中的 (repo.hasCi || repo.hasReleases)
      const result = computeHealthBadge(
        makeHealthInput({
          pushedAt: new Date("2026-06-28T00:00:00Z").toISOString(),
          openIssues: 100,
          hasCi: false,
          hasReleases: false,
        }),
      );
      expect(result).toBe("yellow");
    });
  });
});
