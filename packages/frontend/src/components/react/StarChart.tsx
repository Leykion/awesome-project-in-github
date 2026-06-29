// packages/frontend/src/components/react/StarChart.tsx
// SVG 迷你折线图：展示仓库星标历史趋势
// 纯 SVG polyline + polygon，零外部依赖，bundle < 3KB gzipped

import type { StarHistoryEntry } from "@gitpulse/shared";
import { useMemo } from "react";

interface Props {
  /** 星标历史数据（按日期升序） */
  data: StarHistoryEntry[];
  /** 图表宽度，默认为容器宽度 */
  width?: number;
  /** 图表高度，默认 80px */
  height?: number;
}

/** 渐变填充 ID 前缀 */
const GRADIENT_ID = "star-chart-gradient";

export function StarChart({ data, width, height = 80 }: Props) {
  const chartData = useMemo(() => {
    if (data.length < 2) return null;

    const svgWidth = width ?? 300;
    const svgHeight = height;
    const padding = { top: 4, right: 4, bottom: 4, left: 4 };

    const innerWidth = svgWidth - padding.left - padding.right;
    const innerHeight = svgHeight - padding.top - padding.bottom;

    const starCounts = data.map((d) => d.starCount);
    const minStars = Math.min(...starCounts);
    const maxStars = Math.max(...starCounts);
    const range = maxStars - minStars || 1; // 防止除零

    // 计算每个点的坐标
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.starCount - minStars) / range) * innerHeight;
      return { x, y };
    });

    // 折线路径
    const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    // 填充多边形路径（折线 + 底部闭合）
    const fillPoints = [
      ...points.map((p) => `${p.x},${p.y}`),
      `${points[points.length - 1].x},${svgHeight - padding.bottom}`,
      `${points[0].x},${svgHeight - padding.bottom}`,
    ].join(" ");

    return { svgWidth, svgHeight, linePoints, fillPoints };
  }, [data, width, height]);

  // 数据不足时显示占位
  if (!chartData) {
    return (
      <div
        className="flex items-center justify-center text-[var(--text-xs)] text-[var(--color-text-tertiary)]"
        style={{ width: width ?? "100%", height }}
      >
        暂无趋势数据
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
      width={width ?? "100%"}
      height={height}
      className="block"
      preserveAspectRatio="none"
      aria-label="星标历史趋势图"
      role="img"
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* 渐变填充区域 */}
      <polygon points={chartData.fillPoints} fill={`url(#${GRADIENT_ID})`} />
      {/* 趋势线 */}
      <polyline
        points={chartData.linePoints}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
