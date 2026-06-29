// packages/shared/src/types/api.ts
// 通用数据信封类型（JSON 文件结构）

/** 通用数据信封 — 包装 JSON 数据文件的顶层结构 */
export interface DataEnvelope<T> {
  data: T;
  meta: {
    generatedAt: string; // ISO 8601
    version: string; // 数据版本
    count: number; // 数据条目数
  };
}

/** 分页数据信封 */
export interface PaginatedEnvelope<T> {
  data: T[];
  meta: {
    generatedAt: string;
    version: string;
    total: number;
    page: number;
    pageSize: number;
  };
}
