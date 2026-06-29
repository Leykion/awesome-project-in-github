// packages/shared/src/utils/number.ts
// 数字格式化（1.2k, 45.3k 等）

/** 格式化数字为人类可读格式（如 1.2k, 45.3k, 1.2M） */
export function formatNumber(num: number): string {
  if (num < 0) return `-${formatNumber(-num)}`;
  if (num < 1000) return String(num);
  if (num < 10_000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 10_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

/** 格式化带正负号的增长数字（如 +1.2k, -300） */
export function formatGrowth(num: number | null): string {
  if (num === null || num === undefined) return "-";
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${formatNumber(num)}`;
}

/** 格式化百分比（如 92.5%） */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** 将 0-100 的分数格式化为显示文本 */
export function formatScore(score: number): string {
  return String(Math.round(score));
}

/** 将 0-10 的评分格式化为显示文本（保留一位小数） */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return "-";
  return rating.toFixed(1);
}
