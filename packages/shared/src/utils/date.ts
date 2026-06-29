// packages/shared/src/utils/date.ts
// 日期格式化辅助函数

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 格式化为 ISO 8601 字符串 */
export function toISOString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/** 计算相对时间描述（如 "3 小时前"、"2 天前"） */
export function timeAgo(date: Date | string | null): string {
  if (!date) return "未知";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();

  if (diffMs < 0) return "刚刚";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} 年前`;
  if (months > 0) return `${months} 个月前`;
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return "刚刚";
}

/** 计算两个日期之间的天数差 */
export function daysBetween(dateA: Date | string, dateB: Date | string): number {
  const a = typeof dateA === "string" ? new Date(dateA) : dateA;
  const b = typeof dateB === "string" ? new Date(dateB) : dateB;
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** 判断日期是否在指定天数内 */
export function isWithinDays(date: Date | string | null, days: number): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

/** 获取今天的日期字符串 YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}
