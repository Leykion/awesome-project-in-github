// packages/shared/src/utils/number.test.ts
// 数字格式化工具函数单元测试

import { describe, expect, it } from "vitest";
import { formatGrowth, formatNumber, formatPercentage, formatRating, formatScore } from "./number";

describe("formatNumber", () => {
  it("小于 1000 应原样返回", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  it("1000-9999 应格式化为 x.xk", () => {
    expect(formatNumber(1000)).toBe("1.0k");
    expect(formatNumber(1200)).toBe("1.2k");
    expect(formatNumber(9999)).toBe("10.0k");
  });

  it("10000-999999 应格式化为 xx.xk", () => {
    expect(formatNumber(10000)).toBe("10.0k");
    expect(formatNumber(45300)).toBe("45.3k");
    expect(formatNumber(999999)).toBe("1000.0k");
  });

  it("1000000+ 应格式化为 x.xM", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(1200000)).toBe("1.2M");
    expect(formatNumber(10000000)).toBe("10.0M");
    expect(formatNumber(99000000)).toBe("99.0M");
  });

  it("负数应添加负号前缀", () => {
    expect(formatNumber(-500)).toBe("-500");
    expect(formatNumber(-1200)).toBe("-1.2k");
    expect(formatNumber(-45300)).toBe("-45.3k");
    expect(formatNumber(-1200000)).toBe("-1.2M");
  });

  it("边界值 0 应正确处理", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatGrowth", () => {
  it("正数应添加 + 前缀", () => {
    expect(formatGrowth(100)).toBe("+100");
    expect(formatGrowth(1200)).toBe("+1.2k");
    expect(formatGrowth(1)).toBe("+1");
  });

  it("负数应显示 - 前缀", () => {
    expect(formatGrowth(-100)).toBe("-100");
    expect(formatGrowth(-1200)).toBe("-1.2k");
  });

  it("零不应添加前缀", () => {
    expect(formatGrowth(0)).toBe("0");
  });

  it("null 应返回 -", () => {
    expect(formatGrowth(null)).toBe("-");
  });
});

describe("formatPercentage", () => {
  it("默认保留一位小数", () => {
    expect(formatPercentage(92.5)).toBe("92.5%");
    expect(formatPercentage(100)).toBe("100.0%");
    expect(formatPercentage(0)).toBe("0.0%");
  });

  it("应支持自定义小数位数", () => {
    expect(formatPercentage(92.567, 2)).toBe("92.57%");
    expect(formatPercentage(92.567, 0)).toBe("93%");
  });
});

describe("formatScore", () => {
  it("应四舍五入并返回字符串", () => {
    expect(formatScore(85)).toBe("85");
    expect(formatScore(85.4)).toBe("85");
    expect(formatScore(85.5)).toBe("86");
    expect(formatScore(0)).toBe("0");
    expect(formatScore(100)).toBe("100");
  });
});

describe("formatRating", () => {
  it("应保留一位小数", () => {
    expect(formatRating(8)).toBe("8.0");
    expect(formatRating(8.5)).toBe("8.5");
    expect(formatRating(9.99)).toBe("10.0");
    expect(formatRating(0)).toBe("0.0");
  });

  it("null 应返回 -", () => {
    expect(formatRating(null)).toBe("-");
  });
});
