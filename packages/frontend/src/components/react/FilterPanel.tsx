// packages/frontend/src/components/react/FilterPanel.tsx
// 过滤面板：语言、分类、许可证过滤 + 排序选项

import { useCallback, useState } from "react";

/** 排序方式 */
export type SortOption = "speed" | "stars" | "composite" | "updated";

/** 过滤状态 */
export interface FilterState {
  languages: string[];
  categories: string[];
  licenses: string[];
  sort: SortOption;
}

interface Props {
  /** 可选语言列表 */
  availableLanguages: string[];
  /** 可选分类列表（slug -> 显示名） */
  availableCategories: { slug: string; name: string }[];
  /** 可选许可证列表 */
  availableLicenses: string[];
  /** 当前过滤状态 */
  initialFilter?: Partial<FilterState>;
  /** 过滤状态变化回调 */
  onFilterChange: (filter: FilterState) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "speed", label: "增长速度" },
  { value: "stars", label: "总星标" },
  { value: "composite", label: "综合评分" },
  { value: "updated", label: "最近更新" },
];

export function FilterPanel({
  availableLanguages,
  availableCategories,
  availableLicenses,
  initialFilter,
  onFilterChange,
}: Props) {
  const [filter, setFilter] = useState<FilterState>({
    languages: initialFilter?.languages ?? [],
    categories: initialFilter?.categories ?? [],
    licenses: initialFilter?.licenses ?? [],
    sort: initialFilter?.sort ?? "speed",
  });

  const updateFilter = useCallback(
    (patch: Partial<FilterState>) => {
      setFilter((prev) => {
        const next = { ...prev, ...patch };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange],
  );

  /** 切换复选框选中状态 */
  const toggleItem = useCallback(
    (field: "languages" | "categories" | "licenses", value: string) => {
      setFilter((prev) => {
        const list = prev[field];
        const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
        const updated = { ...prev, [field]: next };
        onFilterChange(updated);
        return updated;
      });
    },
    [onFilterChange],
  );

  return (
    <aside className="w-[var(--sidebar-width)] shrink-0 space-y-6">
      {/* 语言过滤 */}
      <section>
        <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          编程语言
        </h3>
        <div className="space-y-1.5">
          {availableLanguages.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2 cursor-pointer text-[var(--text-sm)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              <input
                type="checkbox"
                checked={filter.languages.includes(lang)}
                onChange={() => toggleItem("languages", lang)}
                className="rounded accent-[var(--color-accent)]"
              />
              {lang}
            </label>
          ))}
        </div>
      </section>

      {/* 分类过滤 */}
      <section>
        <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          AI 分类
        </h3>
        <div className="space-y-1.5">
          {availableCategories.map((cat) => (
            <label
              key={cat.slug}
              className="flex items-center gap-2 cursor-pointer text-[var(--text-sm)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              <input
                type="checkbox"
                checked={filter.categories.includes(cat.slug)}
                onChange={() => toggleItem("categories", cat.slug)}
                className="rounded accent-[var(--color-accent)]"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </section>

      {/* 许可证过滤 */}
      <section>
        <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          许可证
        </h3>
        <div className="space-y-1.5">
          {availableLicenses.map((license) => (
            <label
              key={license}
              className="flex items-center gap-2 cursor-pointer text-[var(--text-sm)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              <input
                type="checkbox"
                checked={filter.licenses.includes(license)}
                onChange={() => toggleItem("licenses", license)}
                className="rounded accent-[var(--color-accent)]"
              />
              {license}
            </label>
          ))}
        </div>
      </section>

      {/* 排序选项 */}
      <section>
        <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          排序方式
        </h3>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-[var(--text-sm)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={filter.sort === opt.value}
                onChange={() => updateFilter({ sort: opt.value })}
                className="accent-[var(--color-accent)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* 重置过滤器 */}
      {(filter.languages.length > 0 ||
        filter.categories.length > 0 ||
        filter.licenses.length > 0) && (
        <button
          type="button"
          onClick={() => updateFilter({ languages: [], categories: [], licenses: [] })}
          className="w-full text-[var(--text-sm)] text-[var(--color-accent)] hover:underline"
        >
          清除所有过滤
        </button>
      )}
    </aside>
  );
}
