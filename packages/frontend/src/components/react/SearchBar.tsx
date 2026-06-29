// packages/frontend/src/components/react/SearchBar.tsx
import Fuse from "fuse.js";
import { useMemo, useState } from "react";

interface SearchEntry {
  id: number;
  fullName: string;
  description: string;
  topics: string;
  language: string;
  categorySlug: string;
  stars: number;
  licenseSpdx: string;
  oneLiner: string;
}

interface Props {
  searchIndex: SearchEntry[];
}

export function SearchBar({ searchIndex }: Props) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: [
          { name: "fullName", weight: 0.3 },
          { name: "description", weight: 0.25 },
          { name: "topics", weight: 0.2 },
          { name: "oneLiner", weight: 0.15 },
          { name: "language", weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [searchIndex],
  );

  const results = query.length >= 2 ? fuse.search(query, { limit: 20 }) : [];

  return (
    <div className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索 AI 项目..."
        // biome-ignore lint/a11y/noAutofocus: spec 要求搜索页自动聚焦
        autoFocus
        className="w-full h-[52px] px-4 bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-base font-[var(--font-body)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        style={{
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-expo)",
        }}
      />
      {/* 搜索结果下拉列表 */}
      {results.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 mt-1 max-h-[400px] overflow-y-auto bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-50"
          style={{
            transitionProperty: "max-height, opacity",
            transitionDuration: "200ms",
            transitionTimingFunction: "var(--ease-out-expo)",
          }}
        >
          {results.map(({ item }) => (
            <li key={item.id}>
              <a
                href={`/repo/${item.fullName}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
                style={{ transitionDuration: "var(--duration-fast)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)] truncate">
                      {item.fullName}
                    </span>
                    {item.language && (
                      <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] shrink-0">
                        {item.language}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] truncate mt-0.5">
                    {item.oneLiner || item.description}
                  </p>
                </div>
                <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] font-[var(--font-data)] shrink-0">
                  {item.stars >= 1000 ? `${(item.stars / 1000).toFixed(1)}k` : item.stars}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {/* 无结果状态 */}
      {query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 px-4 py-6 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-50 text-center text-[var(--color-text-secondary)]">
          未找到匹配 "{query}" 的项目
        </div>
      )}
    </div>
  );
}
