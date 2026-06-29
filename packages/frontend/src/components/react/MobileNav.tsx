// packages/frontend/src/components/react/MobileNav.tsx
// 移动端底部标签栏导航（< 640px 显示）

import { useEffect, useState } from "react";

/** 标签定义 */
interface Tab {
  id: string;
  label: string;
  href: string;
  /** SVG 图标路径（24x24 viewBox） */
  icon: string;
}

const TABS: Tab[] = [
  {
    id: "home",
    label: "首页",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    id: "trending",
    label: "趋势",
    href: "/trending/daily",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  {
    id: "categories",
    label: "分类",
    href: "/category/llm-frameworks",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    id: "search",
    label: "搜索",
    href: "/search",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
];

/** 根据当前路径判断激活的标签 */
function getActiveTab(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/trending")) return "trending";
  if (pathname.startsWith("/category")) return "categories";
  if (pathname.startsWith("/search")) return "search";
  return "home";
}

export function MobileNav() {
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    // 客户端水合后读取当前路径
    setActiveTab(getActiveTab(window.location.pathname));
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="移动端导航"
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              }`}
              style={{
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-expo)",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={tab.icon} />
              </svg>
              <span className="text-[10px] leading-none font-medium">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
