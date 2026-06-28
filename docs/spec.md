> 版本: v2.0 | 日期: 2026-06-28 | 状态: 已审查（架构修订：纯静态 SSG + GitHub Actions）

# GitPulse AI — GitHub 热门 AI 开源项目展示平台

## 技术规格文档 v2.0

---

## 1. 项目概述

### 1.1 项目名称

**GitPulse AI** — 面向 AI 开发者的 GitHub 热门开源项目发现与评估平台。

### 1.2 项目目标

构建一个部署在 Cloudflare Pages 上的**纯静态站点**，帮助 AI 开发者快速发现、评估和比较 GitHub 上最具势头的 AI 相关开源项目。区别于现有竞品（GitHub Trending、Star History、OSS Insight），本平台以 **AI 功能分类**（而非编程语言）作为主要导航维度，结合 **星标增长速度**、**维护健康度**、**许可证合规性** 和 **AI 驱动的智能策展** 四大核心信号，为 AI 开发者提供从"发现"到"集成决策"的完整信息闭环。

### 1.3 目标用户

- AI/ML 工程师：寻找新框架、库、工具来构建 LLM 应用、Agent、RAG 系统
- AI 创业团队技术负责人：评估开源依赖的成熟度、许可证兼容性和维护状态
- 独立开发者：追踪 AI 领域最新趋势，发现可集成的工具
- 开源社区贡献者：寻找值得参与贡献的高活跃度项目

### 1.4 核心价值主张

| 差异化维度 | GitPulse AI | GitHub Trending | Star History | OSS Insight |
|---|---|---|---|---|
| AI 功能分类导航 | 9 大 AI 分类 | 仅编程语言 | 无 | 无 |
| 星标增长速度排序 | 默认排序 | 有但无 API | 有但需已知仓库 | 有但界面复杂 |
| 维护健康度徽章 | 绿/黄/红三级 | 无 | 无 | 无 |
| 许可证一级过滤 | SPDX 彩色徽章 | 无 | 无 | 无 |
| AI 驱动策展摘要 | LLM 生成（可配置） | 无 | 博客（人工） | NL 查询（demo 级） |
| 集成能力检测 | CI/Docker/PyPI 等 | 无 | 无 | 无 |

### 1.5 技术栈总结

| 层 | 技术 | 版本 | 用途 |
|---|---|---|---|
| 前端框架 | Astro | 5.x | 纯 SSG（静态站点生成） |
| 交互层 | React | 19.x | Islands 架构，仅交互区域 |
| UI 组件 | shadcn/ui | latest | 源码式组件库 |
| 样式 | Tailwind CSS | v4 | 原子化 CSS（CSS-first 配置，使用 @tailwindcss/vite 插件） |
| 搜索（客户端） | Fuse.js | 7.x | 内存模糊搜索 |
| 参数校验 | Zod | 3.x | 数据管道运行时类型验证 |
| 前端托管 | Cloudflare Pages | - | 全球 CDN，纯静态 HTML/JS/CSS |
| 数据存储 | JSON 文件 (data/) | - | 仓库数据、趋势快照、AI 策展结果 |
| 数据管道运行时 | GitHub Actions | - | 定时数据抓取、AI 分析、构建部署 |
| 脚本执行 | tsx | latest | TypeScript 脚本直接运行 |
| AI 策展 | OpenAI 兼容 LLM | 用户自定义配置 | 项目分析与分类（支持任意 OpenAI 兼容 API） |
| HTML 解析 | cheerio | 1.x | GitHub 趋势页 HTML 解析（Node.js 环境） |
| 代码语言 | TypeScript | 5.7+ | 全栈类型安全 |
| 包管理 | pnpm | 9.x | Workspace monorepo |
| CI/CD | GitHub Actions | - | 数据同步 + 构建 + 部署到 Cloudflare Pages |
| 代码检查 | Biome | 1.x | Lint + Format 一体化工具 |
| 测试 | Vitest | 3.x | 单元 + 集成测试 |

**成本估算：** Cloudflare Pages = $0（免费）、GitHub Actions = $0（公开仓库免费）、LLM API 费用取决于所选模型（如 Claude Haiku ≈ $0.50/月、DeepSeek ≈ $0.10/月）。**Cloudflare 成本 $0/月，LLM 费用按需。**

---

## 2. 系统架构

### 2.1 整体架构图

```
+-----------------------------------------------------------------------------------+
|                           用户 (AI 开发者)                                          |
+-----------------------------------------------------------------------------------+
          |
          | HTTPS (gitpulse.pages.dev / 自定义域名)
          v
+-----------------------------------+
|   Cloudflare Pages CDN            |
|   纯静态 HTML / JS / CSS          |
|                                   |
|   Astro 5.x SSG 输出              |
|   + React 19 Islands             |
|   + shadcn/ui + Tailwind v4       |
|                                   |
|   静态页面:                        |
|   - 首页、趋势列表、分类页          |
|   - 项目详情、对比页               |
|                                   |
|   React Islands (交互组件):        |
|   - 搜索栏（Fuse.js 客户端搜索）   |
|   - 过滤面板、星标趋势图           |
|   - 对比表格、主题切换             |
|                                   |
|   数据来源: 构建时读取 data/*.json  |
+-----------------------------------+
          ^
          | 构建产物部署
          |
+-----------------------------------+
|   GitHub Actions                  |
|   (定时触发: UTC 00:00, 12:00)    |
|                                   |
|   sync-data.yml 工作流:            |
|                                   |
|   1. 数据管道 (scripts/):          |
|      a. GitHub Search API 发现    |
|      b. GitHub Trending 辅助抓取  |
|      c. GitHub REST/GraphQL 补全  |
|      d. 规则评分引擎 (0-100)       |
|      e. LLM 智能策展（可配置模型） |
|      f. 精选合集生成               |
|      g. 过期数据清理               |
|                                   |
|   2. 写入 JSON 文件到 data/       |
|   3. git commit + push           |
|   4. Astro SSG 构建               |
|   5. 部署到 Cloudflare Pages      |
+-----------------------------------+
          |                |
          v                v
+----------------+  +------------------+
| GitHub         |  | LLM API          |
| - Search API   |  | (OpenAI 兼容)    |
|   (主数据源)    |  | 智能策展/分类     |
| - /trending    |  +------------------+
|   (HTML 辅助)  |
| - REST v3      |
|   (/repos)     |
| - GraphQL v4   |
|   (批量查询)    |
+----------------+
```

### 2.2 Monorepo 架构

项目采用 pnpm workspace monorepo 结构，包含一个可部署前端、一个数据管道脚本目录和一个共享包：

| 包/目录 | 部署目标 | 职责 |
|---|---|---|
| `packages/frontend` | Cloudflare Pages | Astro SSG 前端，纯静态 HTML + React Islands |
| `scripts/` | GitHub Actions 运行 | 数据管道：抓取、评分、AI 策展、JSON 生成 |
| `packages/shared` | 内部依赖（不部署） | 共享类型定义、常量、工具函数 |
| `data/` | 纳入 Git 版本管理 | JSON 数据文件，构建时被 Astro 读取 |

**架构决策理由：**

1. **纯静态 SSG 消除服务器运行时依赖**，所有页面在构建时生成，用户请求仅命中 CDN，TTFB 极低
2. **GitHub Actions 承担所有数据处理**，无 Workers CPU 时间限制（30s），可在单次运行中处理所有语言和仓库
3. **JSON 文件作为数据层**，无需数据库运维，数据变更通过 Git 历史完整追溯
4. **共享包消除类型和常量的重复定义**，保持前端与脚本的类型一致性

### 2.3 数据流

```
GitHub Actions (cron: 每日 UTC 00:00, 12:00)
    |
    v
scripts/pipeline.ts (编排器)
    |
    +-- 1. fetch-trending.ts  → GitHub Search API + Trending HTML 抓取
    +-- 2. enrich-metadata.ts → GitHub REST/GraphQL API 补全元数据
    +-- 3. score-repos.ts     → 规则评分引擎 (0-100)
    +-- 4. ai-curate.ts       → LLM 智能策展分析（可配置模型）
    +-- 5. generate-collections.ts → 精选合集自动生成
    +-- 6. cleanup-stale.ts   → 30 天过期数据清理
    +-- 7. build-search-index.ts → Fuse.js 搜索索引预构建
    |
    v
写入 JSON 文件到 data/ 目录
    |
    v
git commit + push (自动提交数据变更)
    |
    v
触发 Astro SSG 构建 (读取 data/*.json)
    |
    v
部署到 Cloudflare Pages CDN (纯静态 HTML/JS/CSS)
    |
    v
用户请求 → Cloudflare Pages CDN → 静态 HTML + 内嵌 JSON 数据
                                    客户端交互: React Islands + Fuse.js 搜索
```

### 2.4 Astro 静态数据加载模式

前端使用 Astro 纯 SSG 模式，在构建时直接从 `data/` 目录读取 JSON 文件。数据文件已存在于仓库中（由 GitHub Actions 定时更新并提交），因此不存在鸡生蛋问题。

**数据加载方式：**

1. **直接 JSON 导入**：Astro 页面通过 `import` 语句在构建时读取 JSON 文件
2. **容错处理**：所有数据加载使用 try-catch，JSON 文件不存在或为空时返回默认值
3. **首次运行**：仓库克隆后，需手动运行一次 `pnpm sync-data` 以填充初始数据
4. **定时更新**：GitHub Actions 每日 UTC 00:00 和 12:00 自动执行数据同步并重新部署

```typescript
// packages/frontend/src/lib/data-loader.ts
// 构建时从 data/ 目录加载 JSON 数据的辅助函数

import type { RepositoryData, TrendingSnapshotData, CategoryData, FeaturedCollectionData, StarHistoryEntryData, SiteStatsData } from '@gitpulse/shared';

const DATA_DIR = '../../../data';

export async function loadRepositories(): Promise<RepositoryData[]> {
  try {
    return (await import(`${DATA_DIR}/repositories.json`)).default;
  } catch {
    console.warn('repositories.json not found, using empty array');
    return [];
  }
}

export async function loadTrending(since: 'daily' | 'weekly' | 'monthly'): Promise<TrendingSnapshotData[]> {
  try {
    return (await import(`${DATA_DIR}/trending-${since}.json`)).default;
  } catch {
    console.warn(`trending-${since}.json not found, using empty array`);
    return [];
  }
}

export async function loadCategories(): Promise<CategoryData[]> {
  try {
    return (await import(`${DATA_DIR}/categories.json`)).default;
  } catch {
    console.warn('categories.json not found, using empty array');
    return [];
  }
}

export async function loadFeaturedCollections(): Promise<FeaturedCollectionData[]> {
  try {
    return (await import(`${DATA_DIR}/featured-collections.json`)).default;
  } catch {
    console.warn('featured-collections.json not found, using empty array');
    return [];
  }
}

export async function loadStarHistory(): Promise<Record<string, StarHistoryEntryData[]>> {
  try {
    return (await import(`${DATA_DIR}/star-history.json`)).default;
  } catch {
    console.warn('star-history.json not found, using empty object');
    return {};
  }
}

export async function loadStats(): Promise<SiteStatsData> {
  try {
    return (await import(`${DATA_DIR}/stats.json`)).default;
  } catch {
    console.warn('stats.json not found, using defaults');
    return { totalReposTracked: 0, totalCurations: 0, categoryCounts: {}, languageCounts: {}, lastSyncAt: null, lastCurationAt: null, syncHealth: 'unhealthy' };
  }
}
```

**在 Astro 页面中使用：**

```astro
---
// packages/frontend/src/pages/trending/[since].astro
import { loadTrending, loadCategories } from '../../lib/data-loader';
import BaseLayout from '../../layouts/BaseLayout.astro';
import TrendingRow from '../../components/astro/TrendingRow.astro';

export function getStaticPaths() {
  return [
    { params: { since: 'daily' } },
    { params: { since: 'weekly' } },
    { params: { since: 'monthly' } },
  ];
}

const { since } = Astro.params;
const trending = loadTrending(since as 'daily' | 'weekly' | 'monthly');
const categories = loadCategories();
---

<BaseLayout title={`Trending ${since} - GitPulse AI`}>
  <!-- 使用 trending 和 categories 数据渲染页面 -->
</BaseLayout>
```

### 2.5 首次运行体验

系统首次部署后 `data/` 目录的 JSON 文件为空数组/对象。各页面的空状态处理：

| 页面 | 空状态展示 |
|---|---|
| 首页 | 显示 Hero 区域 + "数据同步中，请稍后访问" 提示卡片 + 分类导航网格（零计数） |
| 趋势列表 | "暂无趋势数据" 插图 + "数据将在首次 GitHub Actions 数据同步完成后显示" 说明 |
| 搜索页 | 搜索无结果时显示 "未找到匹配项目，试试其他关键词" + 热门搜索推荐 |
| 项目详情 | 无 AI 策展时显示 "AI 分析待生成" 占位卡片，其余字段正常展示 |
| 星标图表 | 少于 2 个数据点时显示 "数据积累中" 文字替代图表 |
| 分类页 | 分类无仓库时显示 "该分类暂无收录项目" |

---

## 3. 项目目录结构

```
awesome-project-in-github/
|
+-- package.json                              # Workspace 根配置
+-- pnpm-workspace.yaml                       # pnpm workspace 定义
+-- tsconfig.base.json                        # 共享 TypeScript 基础配置
+-- biome.json                                # Biome lint + format 配置
+-- .gitignore                                # Git 忽略规则
+-- .env.example                              # 环境变量模板（GITHUB_TOKEN, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL）
+-- .github/
|   +-- workflows/
|       +-- deploy.yml                        # CI/CD: push 触发，构建前端 + 部署到 Pages
|       +-- sync-data.yml                     # 定时数据同步: cron 每日 UTC 00:00, 12:00
|       +-- test.yml                          # CI: lint + 类型检查 + 测试
|
+-- data/                                     # JSON 数据文件（由 GitHub Actions 自动更新）
|   +-- repositories.json                     # 所有已收录仓库的完整数据
|   +-- trending-daily.json                   # 每日趋势快照
|   +-- trending-weekly.json                  # 每周趋势快照
|   +-- trending-monthly.json                 # 每月趋势快照
|   +-- categories.json                       # 分类定义 + 仓库关联
|   +-- featured-collections.json             # 精选合集列表
|   +-- star-history.json                     # 星标历史数据（30 天滚动）
|   +-- stats.json                            # 全站统计数据
|   +-- search-index.json                     # Fuse.js 搜索索引（构建时预生成）
|   +-- sync-log.json                         # 最近一次同步日志
|
+-- scripts/                                  # 数据管道脚本（GitHub Actions 中运行）
|   +-- pipeline.ts                           # 管道编排器：按序执行所有阶段
|   +-- pipeline/
|   |   +-- fetch-trending.ts                 # 阶段 1: GitHub Search API + HTML 辅助发现
|   |   +-- enrich-metadata.ts                # 阶段 2: GitHub REST/GraphQL API 元数据补全
|   |   +-- score-repos.ts                    # 阶段 3: 规则评分引擎 (0-100)
|   |   +-- ai-curate.ts                      # 阶段 4: LLM 智能策展（可配置模型）
|   |   +-- generate-collections.ts           # 阶段 5: 精选合集自动生成
|   |   +-- cleanup-stale.ts                  # 阶段 6: 30 天过期数据清理
|   |   +-- build-search-index.ts             # 阶段 7: Fuse.js 搜索索引预构建
|   +-- github/
|   |   +-- scraper.ts                        # cheerio HTML 解析器（辅助数据源）
|   |   +-- search-api.ts                     # GitHub Search API 客户端（主数据源）
|   |   +-- api-client.ts                     # GitHub REST/GraphQL API 客户端
|   |   +-- repo-mapper.ts                    # GitHub API 响应 → 应用类型转换
|   |   +-- rate-limiter.ts                   # API 速率限制管理
|   +-- analysis/
|   |   +-- prompt.ts                         # LLM Prompt 模板构建
|   |   +-- llm-client.ts                    # 通用 LLM 客户端（OpenAI 兼容协议，重试逻辑）
|   |   +-- classifier.ts                     # 规则分类器（LLM 后备）
|   |   +-- fallback.ts                       # LLM 失败时的后备分析生成
|   |   +-- schema.ts                         # Zod 输出验证 schema
|   +-- lib/
|   |   +-- data-io.ts                        # JSON 文件读写工具函数
|   |   +-- config.ts                         # 管道配置常量（语言列表、批量大小等）
|   +-- seed-categories.ts                    # 种子数据脚本（初始化分类）
|   +-- init-data.ts                          # 初始化空 JSON 数据文件
|   +-- test-scraper.ts                       # 手动测试抓取器
|   +-- test-llm.ts                           # 手动测试 LLM 评估
|   +-- test-scorer.ts                        # 手动测试评分引擎
|
+-- packages/
|   |
|   +-- frontend/                             # Astro 5.x 前端应用
|   |   +-- package.json                      # 前端依赖声明
|   |   +-- astro.config.ts                   # Astro 配置（纯 SSG，无适配器）
|   |   +-- tsconfig.json                     # 前端 TypeScript 配置
|   |   +-- public/
|   |   |   +-- favicon.svg                   # 站点图标
|   |   |   +-- robots.txt                    # 爬虫规则
|   |   |   +-- og-image.png                  # Open Graph 分享预览图
|   |   +-- src/
|   |       +-- layouts/
|   |       |   +-- BaseLayout.astro          # HTML 骨架：meta 标签、导航栏、页脚
|   |       |   +-- CategoryLayout.astro      # 分类页面包装器
|   |       +-- pages/
|   |       |   +-- index.astro               # 首页 (/)
|   |       |   +-- trending/
|   |       |   |   +-- [since].astro         # /trending/daily | /trending/weekly | /trending/monthly
|   |       |   +-- category/
|   |       |   |   +-- [slug].astro          # /category/{category-slug}
|   |       |   +-- repo/
|   |       |   |   +-- [owner]/
|   |       |   |       +-- [name].astro      # /repo/{owner}/{name} — 项目详情页
|   |       |   +-- search.astro              # /search — 搜索结果页
|   |       |   +-- featured.astro            # /featured — AI 精选合集列表
|   |       |   +-- featured/
|   |       |   |   +-- [slug].astro          # /featured/{slug} — 合集详情页
|   |       |   +-- compare.astro             # /compare?repos=a/b,c/d — 对比页
|   |       |   +-- about.astro               # /about — 方法论与评分透明度说明
|   |       +-- components/
|   |       |   +-- astro/                    # 静态 Astro 组件（零 JS 输出）
|   |       |   |   +-- Header.astro          # 导航栏（56px 固定，磨砂玻璃背景）
|   |       |   |   +-- Footer.astro          # 页脚（链接、版权信息）
|   |       |   |   +-- RepoCard.astro        # 仓库卡片（竖向，用于首页网格）
|   |       |   |   +-- TrendingRow.astro     # 趋势行（横向，用于列表页排名展示）
|   |       |   |   +-- CategoryCard.astro    # 分类卡片（图标 + 名称 + 数量）
|   |       |   |   +-- HealthBadge.astro     # 维护健康度徽章（绿/黄/红）
|   |       |   |   +-- LicenseBadge.astro    # 许可证彩色徽章
|   |       |   |   +-- MetricsBar.astro      # 指标栏（Stars、Forks、最近提交）
|   |       |   |   +-- IntegrationBadges.astro # 集成能力图标（CI/Docker/PyPI/NPM/MCP）
|   |       |   |   +-- StatsBar.astro        # 全站统计数据栏（计数动画）
|   |       |   |   +-- Pagination.astro      # 分页组件
|   |       |   |   +-- TimeWindowTabs.astro  # 时间窗口标签（daily/weekly/monthly）
|   |       |   |   +-- FeaturedCard.astro    # 精选合集卡片（编辑性布局）
|   |       |   |   +-- ScoreBreakdown.astro  # 评分分解展示（透明度组件）
|   |       |   |   +-- Skeleton.astro        # 加载骨架屏
|   |       |   |   +-- EmptyState.astro      # 空状态通用组件（插图 + 消息 + 操作按钮）
|   |       |   |   +-- DataFreshness.astro  # 数据新鲜度指示器（"数据更新于 XX 小时前"）
|   |       |   +-- react/                    # 交互 React Islands
|   |       |       +-- SearchBar.tsx         # 搜索栏（Fuse.js 自动补全）
|   |       |       +-- FilterPanel.tsx       # 过滤面板（语言 + 分类 + 排序）
|   |       |       +-- StarChart.tsx         # 星标趋势 SVG 迷你图
|   |       |       +-- CompareTable.tsx      # 仓库对比表格（最多 3 个）
|   |       |       +-- ThemeToggle.tsx       # 深色/浅色主题切换
|   |       |       +-- MobileNav.tsx         # 移动端底部标签栏
|   |       +-- lib/
|   |       |   +-- data-loader.ts            # data/ JSON 文件构建时加载工具
|   |       |   +-- format.ts                 # 数字格式化、相对时间
|   |       |   +-- constants.ts              # 分类 slug、颜色映射
|   |       +-- styles/
|   |       |   +-- global.css                # Tailwind v4 CSS-first 配置 + 设计令牌
|   |       +-- content/                      # （可选）Astro 内容集合，用于博客/周报
|   |
|   +-- shared/                              # 共享代码（类型、工具函数、常量）
|       +-- package.json                     # 共享包配置（含 exports 定义）
|       +-- tsconfig.json                    # TypeScript 配置
|       +-- src/
|           +-- index.ts                     # 统一导出入口
|           +-- types/
|           |   +-- repo.ts                  # ScrapedRepo, EnrichedRepo, AnalyzedRepo 类型
|           |   +-- api.ts                   # 通用数据信封类型（JSON 文件结构）
|           |   +-- scoring.ts               # 评分权重、阈值类型
|           |   +-- curation.ts              # AI 策展结果类型
|           |   +-- data-files.ts            # JSON 数据文件结构类型定义
|           +-- constants/
|           |   +-- categories.ts            # 9 大 AI 分类定义
|           |   +-- languages.ts             # 编程语言列表 + GitHub 颜色映射
|           |   +-- scoring-weights.ts       # 评分信号权重常量
|           |   +-- ai-topics.ts             # AI 相关 GitHub 话题标签列表
|           |   +-- license-colors.ts        # SPDX 许可证颜色映射
|           +-- utils/
|               +-- date.ts                 # 日期格式化辅助函数
|               +-- validation.ts           # Zod schema：数据验证
|               +-- health-badge.ts         # 健康状态计算逻辑
|               +-- number.ts              # 数字格式化（1.2k, 45.3k 等）
|
+-- docs/
    +-- spec.md                              # 本技术规格文档
```

### 3.1 基础配置文件

#### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

> **说明：** `scripts/` 不作为 workspace 包，而是通过根 `package.json` 的 scripts 字段调用，使用 `tsx` 直接运行 TypeScript。

#### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@gitpulse/shared": ["./packages/shared/src"],
      "@gitpulse/shared/*": ["./packages/shared/src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

#### 各包 tsconfig.json

**packages/shared/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*.ts"]
}
```

**packages/frontend/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["@types/react", "@types/react-dom"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.astro"],
  "references": [{ "path": "../shared" }]
}
```

**scripts/tsconfig.json:**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*.ts"],
  "references": [{ "path": "../packages/shared" }]
}
```

#### .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
.astro/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test
coverage/

# Misc
*.log
```

#### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noForEach": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "ignore": ["node_modules", "dist", ".astro", "data"]
  }
}
```

#### 管道配置类型定义

```typescript
// scripts/lib/config.ts
// 数据管道运行时配置，从环境变量读取

/** LLM 服务配置（支持任意 OpenAI 兼容 API） */
export interface LLMConfig {
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL（OpenAI 兼容端点） */
  baseURL: string;
  /** 模型 ID */
  model: string;
}

export interface PipelineConfig {
  /** GitHub Personal Access Token */
  githubToken: string;
  /** LLM 服务配置 */
  llm: LLMConfig;
  /** 运行环境 */
  environment: 'production' | 'development';
  /** 抓取的编程语言列表 */
  scrapeLanguages: string[];
  /** LLM 评估最低分数阈值 */
  llmEvalThreshold: number;
  /** LLM 每批评估仓库数 */
  llmEvalBatchSize: number;
  /** README 截断字符数 */
  readmeTruncateChars: number;
}

export function loadConfig(): PipelineConfig {
  const githubToken = process.env.GITHUB_TOKEN;
  const llmApiKey = process.env.LLM_API_KEY;
  const llmBaseURL = process.env.LLM_BASE_URL;
  const llmModel = process.env.LLM_MODEL;

  if (!githubToken) throw new Error('GITHUB_TOKEN environment variable is required');
  if (!llmApiKey) throw new Error('LLM_API_KEY environment variable is required');
  if (!llmBaseURL) throw new Error('LLM_BASE_URL environment variable is required');
  if (!llmModel) throw new Error('LLM_MODEL environment variable is required');

  return {
    githubToken,
    llm: {
      apiKey: llmApiKey,
      baseURL: llmBaseURL,
      model: llmModel,
    },
    environment: (process.env.ENVIRONMENT as 'production' | 'development') || 'production',
    scrapeLanguages: ['python', 'typescript', 'javascript', 'rust', 'go', 'c++', 'java', 'kotlin', 'swift'],
    llmEvalThreshold: 40,
    llmEvalBatchSize: 20,
    readmeTruncateChars: 8000,
  };
}

// 使用示例：
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.anthropic.com/v1 LLM_MODEL=claude-haiku-4-20250414
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4o-mini
// LLM_API_KEY=sk-xxx LLM_BASE_URL=https://api.deepseek.com/v1 LLM_MODEL=deepseek-chat
// LLM_API_KEY=sk-xxx LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=llama3.2
```

#### 共享包配置

**packages/shared/package.json（完整）：**

```json
{
  "name": "@gitpulse/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*/index.ts",
      "import": "./src/*/index.ts"
    }
  },
  "scripts": {
    "build": "tsc --build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check ./src"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**说明：** 共享包不需要编译步骤即可被其他包消费。前端包通过 TypeScript project references 和 pnpm `workspace:*` 协议直接引用源码。`exports` 字段使用 `.ts` 后缀直接指向源文件，因为 Astro 的构建工具（Vite）和 `tsx` 脚本运行器都支持直接处理 TypeScript 源码。

```typescript
// packages/shared/src/index.ts — 统一导出入口

export * from './types/repo';
export * from './types/api';
export * from './types/scoring';
export * from './types/curation';
export * from './types/data-files';

export * from './constants/categories';
export * from './constants/languages';
export * from './constants/scoring-weights';
export * from './constants/ai-topics';
export * from './constants/license-colors';

export * from './utils/date';
export * from './utils/validation';
export * from './utils/health-badge';
export * from './utils/number';
```

---

## 4. 数据模型

### 4.1 JSON 数据文件结构定义

所有数据以 JSON 文件形式存储在 `data/` 目录中，由 GitHub Actions 数据管道写入，由 Astro SSG 在构建时读取。以下为每个 JSON 文件的 TypeScript 接口定义和示例。

#### 文件 1: data/categories.json（项目分类）

```typescript
// packages/shared/src/types/data-files.ts

/** 分类定义 */
export interface CategoryData {
  slug: string;           // URL 友好标识符，如 "llm-frameworks"
  name: string;           // 显示名称，如 "LLM Frameworks"
  description: string;    // 分类说明文字
  icon: string;           // emoji 图标标识
  sortOrder: number;      // 前端排序权重（升序）
  repoCount: number;      // 该分类下仓库数量
  topRepos: {             // Top 3 仓库摘要
    fullName: string;
    stars: number;
    starsGained: number;
  }[];
}
```

**示例：**

```json
[
  {
    "slug": "llm-frameworks",
    "name": "LLM Frameworks",
    "description": "构建 LLM 驱动应用的框架和库，包括 Chain、Agent、RAG 管道",
    "icon": "🔗",
    "sortOrder": 1,
    "repoCount": 42,
    "topRepos": [
      { "fullName": "langchain-ai/langchain", "stars": 98500, "starsGained": 450 },
      { "fullName": "run-llama/llama_index", "stars": 38200, "starsGained": 180 },
      { "fullName": "stanfordnlp/dspy", "stars": 21800, "starsGained": 320 }
    ]
  }
]
```

**种子数据（9 大 AI 分类）：**

```typescript
// packages/shared/src/constants/categories.ts（种子数据定义，与 JSON 初始化脚本共用）

export const CATEGORY_SEEDS: Omit<CategoryData, 'repoCount' | 'topRepos'>[] = [
  { slug: 'llm-frameworks', name: 'LLM Frameworks', description: '构建 LLM 驱动应用的框架和库，包括 Chain、Agent、RAG 管道', icon: '🔗', sortOrder: 1 },
  { slug: 'vector-databases', name: 'Vector Databases', description: '向量搜索和嵌入存储引擎', icon: '🗄️', sortOrder: 2 },
  { slug: 'ai-agents', name: 'AI Agents', description: '自主代理框架和多代理编排系统', icon: '🤖', sortOrder: 3 },
  { slug: 'mlops-evaluation', name: 'MLOps & Evaluation', description: '模型训练、部署、评估管道', icon: '📊', sortOrder: 4 },
  { slug: 'model-serving', name: 'Model Serving', description: 'LLM 推理引擎和模型服务基础设施', icon: '⚡', sortOrder: 5 },
  { slug: 'ai-dev-tools', name: 'AI Dev Tools', description: 'AI 原生开发者生产力工具', icon: '🛠️', sortOrder: 6 },
  { slug: 'multimodal', name: 'Multimodal', description: '视觉、音频和多模态模型工具', icon: '👁️', sortOrder: 7 },
  { slug: 'datasets-benchmarks', name: 'Datasets & Benchmarks', description: '训练数据、评估基准和排行榜', icon: '📋', sortOrder: 8 },
  { slug: 'ai-applications', name: 'AI Applications', description: 'AI 驱动的终端用户应用', icon: '💡', sortOrder: 9 },
];
```

#### 文件 2: data/repositories.json（GitHub 仓库核心数据）

```typescript
/** 仓库完整数据 */
export interface RepositoryData {
  id: number;                   // GitHub 仓库 ID（全局唯一）
  owner: string;                // 仓库所有者
  name: string;                 // 仓库名称
  fullName: string;             // owner/name 格式
  description: string | null;   // 仓库描述
  url: string;                  // html_url
  homepageUrl: string | null;   // 项目主页/文档站
  language: string | null;      // 主要编程语言
  languageColor: string | null; // 语言颜色值，如 "#3572A5"
  stars: number;                // 总 star 数
  forks: number;                // 总 fork 数
  openIssues: number;           // 开放 issue 数
  watchers: number;             // watcher 数
  topics: string[];             // 话题标签列表
  licenseSpdx: string | null;   // SPDX 许可证标识符
  licenseName: string | null;   // 许可证全名
  isFork: boolean;              // 是否为 fork
  isArchived: boolean;          // 是否已归档
  defaultBranch: string;        // 默认分支名
  createdAt: string | null;     // GitHub 仓库创建时间 (ISO 8601)
  pushedAt: string | null;      // 最近一次 push 时间 (ISO 8601)
  githubUpdatedAt: string | null; // GitHub 侧最后更新时间

  // 社区指标
  contributorCount: number | null;
  readmeSizeBytes: number | null;
  releasesLast6m: number;
  avgIssueCloseDays: number | null;
  healthPercentage: number | null;

  // 集成能力标记
  badges: {
    hasExamples: boolean;
    hasCi: boolean;
    hasReleases: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasPypi: boolean;
    hasNpm: boolean;
    hasMcp: boolean;
  };

  // 评分
  scores: {
    growth: number;       // 增长速度评分 (0-100)
    maturity: number;     // 项目成熟度评分 (0-100)
    community: number;    // 社区健康度评分 (0-100)
    relevance: number;    // AI 相关性评分 (0-100)
    quality: number;      // 代码质量评分 (0-100)
    composite: number;    // 综合得分 (0-100)
  };
  tier: 'star' | 'notable' | 'tracked'; // 等级：star(>=70) / notable(50-69) / tracked(30-49)

  // 分类
  categorySlug: string | null;  // 关联分类 slug

  // AI 策展结果（可选，仅在已分析后存在）
  curation: CurationData | null;

  // 时间戳
  firstSeenAt: string;          // 首次收录时间 (ISO 8601)
  lastSyncedAt: string;         // 最后同步时间 (ISO 8601)
  lastAnalyzedAt: string | null; // 最后 LLM 分析时间 (ISO 8601)
  trendingSince: string | null; // 开始上榜的时间
  trendingLanguage: string | null; // 在哪个语言的趋势页上出现
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | GitHub 仓库 ID（全局唯一，直接使用 GitHub 的 ID） |
| owner | string | 仓库所有者（用户名或组织名） |
| name | string | 仓库名称 |
| fullName | string | owner/name 格式（唯一标识） |
| description | string \| null | 仓库描述（可为空） |
| url | string | html_url |
| homepageUrl | string \| null | 项目主页/文档站 |
| language | string \| null | 主要编程语言 |
| languageColor | string \| null | 语言颜色值，如 "#3572A5" |
| stars | number | 总 star 数 |
| forks | number | 总 fork 数 |
| openIssues | number | 开放 issue 数 |
| watchers | number | watcher 数 |
| topics | string[] | 话题标签列表 |
| licenseSpdx | string \| null | SPDX 许可证标识符 |
| licenseName | string \| null | 许可证全名 |
| isFork | boolean | 是否为 fork |
| isArchived | boolean | 是否已归档 |
| defaultBranch | string | 默认分支名 |
| createdAt | string \| null | GitHub 仓库创建时间 |
| pushedAt | string \| null | 最近一次 push 时间 |
| githubUpdatedAt | string \| null | GitHub 侧最后更新时间 |
| contributorCount | number \| null | 贡献者数量 |
| badges.hasExamples | boolean | 是否有 /examples 或 /notebooks 目录 |
| badges.hasCi | boolean | 是否有 CI 配置 |
| badges.hasReleases | boolean | 是否有正式 release |
| badges.hasTests | boolean | 是否有测试目录 |
| badges.hasDocker | boolean | 是否有 Dockerfile |
| badges.hasPypi | boolean | 是否发布到 PyPI |
| badges.hasNpm | boolean | 是否发布到 npm |
| badges.hasMcp | boolean | 是否有 MCP 适配器 |
| readmeSizeBytes | number \| null | README 文件大小 |
| releasesLast6m | number | 近 6 个月 release 数 |
| avgIssueCloseDays | number \| null | 最近 10 个 issue 的平均关闭天数 |
| healthPercentage | number \| null | GitHub 社区健康度百分比 |
| scores.growth | number | 增长速度评分 (0-100) |
| scores.maturity | number | 项目成熟度评分 (0-100) |
| scores.community | number | 社区健康度评分 (0-100) |
| scores.relevance | number | AI 相关性评分 (0-100) |
| scores.quality | number | 代码质量评分 (0-100) |
| scores.composite | number | 综合得分 (0-100) |
| tier | string | 等级：'star'(>=70) / 'notable'(50-69) / 'tracked'(30-49) |
| categorySlug | string \| null | 关联分类 slug |
| curation | CurationData \| null | AI 策展结果（内联） |
| firstSeenAt | string | 首次收录时间 |
| lastSyncedAt | string | 最后同步时间 |
| lastAnalyzedAt | string \| null | 最后 LLM 分析时间 |
| trendingSince | string \| null | 开始上榜的时间 |
| trendingLanguage | string \| null | 在哪个语言的趋势页上出现 |

#### 文件 3: data/trending-{daily|weekly|monthly}.json（趋势快照）

```typescript
/** 趋势快照条目 */
export interface TrendingSnapshotData {
  repoId: number;               // 关联仓库 ID
  fullName: string;             // owner/name（冗余字段，方便前端直接使用）
  snapshotDate: string;         // 快照日期 YYYY-MM-DD
  rank: number | null;          // 当期排名（1-25，可空）
  starsTotal: number;           // 快照时的总 star 数
  starsGained: number | null;   // 本周期增长数（可空）
  forksTotal: number;           // 快照时的总 fork 数
  forksGained: number | null;   // 本周期 fork 增长数（可空）
  language: string | null;      // 语言筛选条件（null 表示 all）
  fetchedAt: string;            // 抓取时间 (ISO 8601)
}
```

**示例 (data/trending-daily.json)：**

```json
[
  {
    "repoId": 123456,
    "fullName": "langchain-ai/langchain",
    "snapshotDate": "2026-06-28",
    "rank": 1,
    "starsTotal": 98500,
    "starsGained": 450,
    "forksTotal": 15200,
    "forksGained": 32,
    "language": null,
    "fetchedAt": "2026-06-28T00:15:00Z"
  }
]
```

> **保留策略：** 每个 trending JSON 文件仅保留最近 30 天的快照数据。超过 30 天的记录由 `cleanup-stale.ts` 脚本在每次同步时清理。

#### 文件 4: data/star-history.json（星标历史）

```typescript
/** 星标历史条目 */
export interface StarHistoryEntry {
  repoId: number;
  date: string;         // YYYY-MM-DD
  starCount: number;
  dailyDelta: number;
}

/** star-history.json 的顶层结构，按仓库 fullName 索引 */
export type StarHistoryData = Record<string, StarHistoryEntry[]>;
```

**示例：**

```json
{
  "langchain-ai/langchain": [
    { "repoId": 123456, "date": "2026-06-28", "starCount": 98500, "dailyDelta": 450 },
    { "repoId": 123456, "date": "2026-06-27", "starCount": 98050, "dailyDelta": 380 }
  ]
}
```

> **保留策略：** 仅保留每个仓库最近 30 天的星标历史数据。

#### 文件 5: data/featured-collections.json（精选合集）

```typescript
/** 精选合集 */
export interface FeaturedCollectionData {
  id: number;                   // 自增 ID
  title: string;                // 合集标题
  slug: string;                 // URL 友好标识符
  description: string;          // 合集说明
  coverEmoji: string;           // 封面 emoji
  collectionType: 'curated' | 'weekly_digest' | 'category_top' | 'rising';
  isPublished: boolean;
  isPinned: boolean;
  sortOrder: number;
  repos: {                      // 合集包含的仓库列表
    repoId: number;
    fullName: string;
    editorialNote: string | null;
    sortOrder: number;
  }[];
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  publishedAt: string | null;   // ISO 8601
}
```

> **保留策略：** 保留最新合集 + 最近 4 期 weekly_digest。更早的 weekly_digest 在每次同步时清理。

#### 文件 6: data/stats.json（全站统计）

```typescript
/** 全站统计 */
export interface SiteStatsData {
  totalReposTracked: number;
  totalCurations: number;
  categoryCounts: Record<string, number>;  // slug -> count
  languageCounts: Record<string, number>;  // language -> count
  lastSyncAt: string | null;              // ISO 8601
  lastCurationAt: string | null;          // ISO 8601
  syncHealth: 'healthy' | 'degraded' | 'unhealthy';
}
```

**示例：**

```json
{
  "totalReposTracked": 1842,
  "totalCurations": 892,
  "categoryCounts": {
    "llm-frameworks": 42,
    "vector-databases": 18,
    "ai-agents": 56,
    "mlops-evaluation": 31,
    "model-serving": 24,
    "ai-dev-tools": 38,
    "multimodal": 22,
    "datasets-benchmarks": 15,
    "ai-applications": 28
  },
  "languageCounts": {
    "Python": 892,
    "TypeScript": 324,
    "Rust": 128,
    "Go": 96,
    "C++": 84
  },
  "lastSyncAt": "2026-06-28T00:15:00Z",
  "lastCurationAt": "2026-06-28T00:20:00Z",
  "syncHealth": "healthy"
}
```

#### 文件 7: data/sync-log.json（同步日志）

```typescript
/** 同步日志条目 */
export interface SyncLogEntry {
  jobType: 'discover' | 'snapshot' | 'enrich' | 'score' | 'analyze' | 'cleanup' | 'collection';
  status: 'completed' | 'failed' | 'partial';
  reposProcessed: number;
  reposFailed: number;
  rateLimitRemaining: number | null;
  errorMessage: string | null;
  durationMs: number;
  startedAt: string;            // ISO 8601
  completedAt: string;          // ISO 8601
}

/** sync-log.json 的顶层结构 */
export interface SyncLogData {
  lastRun: string;              // 最近一次完整管道运行时间 (ISO 8601)
  entries: SyncLogEntry[];      // 最近一次运行的各阶段日志
}
```

#### AI 策展结果类型（内联在 RepositoryData 中）

```typescript
/** AI 策展分析结果 */
export interface CurationData {
  summary: string;              // 项目摘要
  whyNotable: string;           // 为什么值得关注
  categorySlug: string | null;  // AI 分类 slug
  subcategory: string | null;   // 子分类
  strengths: string[];          // 优势
  limitations: string[];        // 局限
  useCases: string[];           // 使用场景
  targetAudience: string | null; // 目标用户
  comparableProjects: string[]; // 可比较项目
  noveltyScore: number;         // 新颖度 (0-10)
  clarityScore: number;         // 清晰度 (0-10)
  productionScore: number;      // 生产就绪度 (0-10)
  categoryFitScore: number;     // 分类匹配度 (0-10)
  innovationRating: number | null; // 创新评级 (1-5)
  productionReadiness: number | null; // 生产就绪度 (1-5)
  learningCurve: 'low' | 'medium' | 'high' | null;
  oneLiner: string | null;     // 一句话描述
  ruleScore: number;            // 规则评分
  llmScore: number | null;      // LLM 评分
  compositeScore: number;       // 综合得分
  modelUsed: string;            // 使用的模型
  promptVersion: string;        // Prompt 版本
  isFallback: boolean;          // 是否为后备结果
  tokensInput: number | null;
  tokensOutput: number | null;
  evaluatedAt: string;          // 评估时间 (ISO 8601)
}
```

### 4.2 数据刷新策略

所有数据抓取和处理在 GitHub Actions 中按以下计划执行：

| 数据类型 | 数据源 | 频率 | 存储 |
|---|---|---|---|
| 趋势发现（新仓库） | GitHub Search API + cheerio 抓取（辅助） | 每日 2 次（UTC 00:00, 12:00） | data/repositories.json, data/trending-*.json |
| 星标快照 | 已有仓库数据 | 每次管道运行时 | data/star-history.json |
| 仓库元数据刷新 | GitHub REST/GraphQL API | 每次管道运行时（全量） | data/repositories.json |
| AI 策展分析 | LLM API（用户配置） | 每次管道运行时（对未分析或过期的仓库） | data/repositories.json (curation 字段) |
| 精选合集生成 | 聚合分析已有数据 | 每周日的管道运行 | data/featured-collections.json |
| 过期清理 | 数据文件清理 | 每次管道运行时 | 所有 data/*.json |
| 前端静态构建 | Astro SSG | 每次数据同步后自动触发 | Cloudflare Pages CDN |

**30 天滚动数据保留策略：**

- 超过 30 天未出现在趋势页的仓库标记为 `tracked` 但保留在 repositories.json 中
- star-history.json 中每个仓库仅保留最近 30 天数据
- trending-*.json 仅保留最近 30 天快照
- featured-collections.json 保留最新合集 + 最近 4 期 weekly_digest，更早的自动清理
- 清理逻辑在 `scripts/pipeline/cleanup-stale.ts` 中实现，每次管道运行时自动执行

### 4.3 JSON 数据文件读写工具

```typescript
// scripts/lib/data-io.ts
// JSON 数据文件读写封装

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '../../data');

/** 确保 data/ 目录存在 */
export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** 读取 JSON 数据文件，文件不存在时返回 fallback */
export function readDataFile<T>(filename: string, fallback: T): T {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) return fallback;
  try {
    const raw = readFileSync(filepath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`Failed to parse ${filename}, using fallback`);
    return fallback;
  }
}

/** 写入 JSON 数据文件（格式化输出，便于 Git diff） */
export function writeDataFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** 读取仓库列表 */
export function readRepositories(): RepositoryData[] {
  return readDataFile('repositories.json', []);
}

/** 写入仓库列表 */
export function writeRepositories(repos: RepositoryData[]): void {
  writeDataFile('repositories.json', repos);
}

/** 读取趋势快照 */
export function readTrending(since: 'daily' | 'weekly' | 'monthly'): TrendingSnapshotData[] {
  return readDataFile(`trending-${since}.json`, []);
}

/** 写入趋势快照 */
export function writeTrending(since: 'daily' | 'weekly' | 'monthly', data: TrendingSnapshotData[]): void {
  writeDataFile(`trending-${since}.json`, data);
}

/** 读取星标历史 */
export function readStarHistory(): StarHistoryData {
  return readDataFile('star-history.json', {});
}

/** 写入星标历史 */
export function writeStarHistory(data: StarHistoryData): void {
  writeDataFile('star-history.json', data);
}

/** 读取分类 */
export function readCategories(): CategoryData[] {
  return readDataFile('categories.json', []);
}

/** 写入分类 */
export function writeCategories(data: CategoryData[]): void {
  writeDataFile('categories.json', data);
}

/** 读取精选合集 */
export function readFeaturedCollections(): FeaturedCollectionData[] {
  return readDataFile('featured-collections.json', []);
}

/** 写入精选合集 */
export function writeFeaturedCollections(data: FeaturedCollectionData[]): void {
  writeDataFile('featured-collections.json', data);
}

/** 读取统计 */
export function readStats(): SiteStatsData {
  return readDataFile('stats.json', {
    totalReposTracked: 0,
    totalCurations: 0,
    categoryCounts: {},
    languageCounts: {},
    lastSyncAt: null,
    lastCurationAt: null,
    syncHealth: 'unhealthy',
  });
}

/** 写入统计 */
export function writeStats(data: SiteStatsData): void {
  writeDataFile('stats.json', data);
}

/** 读取同步日志 */
export function readSyncLog(): SyncLogData {
  return readDataFile('sync-log.json', { lastRun: '', entries: [] });
}

/** 写入同步日志 */
export function writeSyncLog(data: SyncLogData): void {
  writeDataFile('sync-log.json', data);
}
```

---

## 5. 数据加载方式

### 5.1 总体说明

GitPulse AI 没有运行时 API 层。所有数据通过以下两种方式消费：

1. **Astro SSG 构建时加载**：Astro 页面在构建时通过文件系统导入 `data/*.json`，将数据嵌入静态 HTML。所有页面（包括项目详情页）均在构建时预生成。
2. **React Islands 客户端交互**：搜索、过滤、排序等交互功能在客户端 React Islands 中实现。数据通过 Astro 的 `client:load` / `client:idle` 指令以 props 形式传递给 React 组件，或通过预构建的搜索索引在客户端加载。

### 5.2 构建时数据加载

每个 Astro 页面通过 `data-loader.ts` 工具函数在构建时读取 JSON 数据：

```astro
---
// packages/frontend/src/pages/index.astro
import { loadTrending, loadCategories, loadStats, loadFeaturedCollections } from '../lib/data-loader';

const trendingDaily = loadTrending('daily');
const categories = loadCategories();
const stats = loadStats();
const featuredCollections = loadFeaturedCollections();
---

<!-- Hero 区域 -->
{trendingDaily.length === 0 ? (
  <EmptyState message="数据同步中，请稍后访问。GitHub Actions 数据同步将在下次定时运行后填充数据。" />
) : (
  <!-- 渲染趋势列表 -->
)}
```

### 5.3 项目详情页静态生成

项目详情页使用 Astro 的 `getStaticPaths()` 在构建时为所有已收录仓库生成静态页面：

```astro
---
// packages/frontend/src/pages/repo/[owner]/[name].astro
import { loadRepositories, loadStarHistory } from '../../../lib/data-loader';
import BaseLayout from '../../../layouts/BaseLayout.astro';

export function getStaticPaths() {
  const repos = loadRepositories();
  return repos.map(repo => ({
    params: { owner: repo.owner, name: repo.name },
    props: { repo },
  }));
}

const { repo } = Astro.props;
const starHistory = loadStarHistory();
const repoHistory = starHistory[repo.fullName] || [];
---

<BaseLayout title={`${repo.fullName} - GitPulse AI`}>
  <!-- 渲染仓库详情 -->
</BaseLayout>
```

### 5.4 客户端搜索（Fuse.js）

搜索功能完全在客户端实现，使用 Fuse.js 模糊搜索引擎。搜索索引在构建时由 `build-search-index.ts` 脚本预构建，包含仓库的关键可搜索字段：

```typescript
// scripts/pipeline/build-search-index.ts
// 构建 Fuse.js 搜索索引，输出到 data/search-index.json

import { readRepositories, writeDataFile } from '../lib/data-io';

export function buildSearchIndex(): void {
  const repos = readRepositories();

  // 构建精简的搜索索引（仅保留搜索所需字段，减小客户端加载体积）
  const searchEntries = repos.map(repo => ({
    id: repo.id,
    fullName: repo.fullName,
    description: repo.description || '',
    topics: repo.topics.join(' '),
    language: repo.language || '',
    categorySlug: repo.categorySlug || '',
    stars: repo.stars,
    licenseSpdx: repo.licenseSpdx || '',
    oneLiner: repo.curation?.oneLiner || '',
  }));

  writeDataFile('search-index.json', searchEntries);
}
```

**客户端 React 搜索组件：**

```tsx
// packages/frontend/src/components/react/SearchBar.tsx
import Fuse from 'fuse.js';
import { useState, useMemo } from 'react';

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
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => new Fuse(searchIndex, {
    keys: [
      { name: 'fullName', weight: 0.3 },
      { name: 'description', weight: 0.25 },
      { name: 'topics', weight: 0.2 },
      { name: 'oneLiner', weight: 0.15 },
      { name: 'language', weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
  }), [searchIndex]);

  const results = query.length >= 2 ? fuse.search(query, { limit: 20 }) : [];

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索 AI 项目..."
      />
      {/* 渲染搜索结果 */}
    </div>
  );
}
```

### 5.5 数据结构约定

前端消费的所有 JSON 数据文件遵循以下约定：

| 数据文件 | 前端加载方式 | 消费时机 |
|---|---|---|
| repositories.json | data-loader.ts 构建时导入 | 详情页 getStaticPaths()、分类页 |
| trending-daily.json | data-loader.ts 构建时导入 | 首页、趋势页 |
| trending-weekly.json | data-loader.ts 构建时导入 | 趋势页 |
| trending-monthly.json | data-loader.ts 构建时导入 | 趋势页 |
| categories.json | data-loader.ts 构建时导入 | 首页分类导航、分类页 |
| featured-collections.json | data-loader.ts 构建时导入 | 首页精选区、精选列表页 |
| star-history.json | data-loader.ts 构建时导入 | 详情页星标图表 |
| stats.json | data-loader.ts 构建时导入 | 首页统计栏、关于页 |
| search-index.json | Astro props 传递给 React Island | 搜索页客户端交互 |

> **注意：** 所有 JSON 文件以格式化方式存储（2 空格缩进），便于 Git diff 审查数据变更。预计 repositories.json 在收录 ~2000 个仓库时约 5-8 MB，search-index.json 精简后约 500 KB-1 MB（gzip 后约 100-200 KB），在可接受范围内。

---

## 6. 页面与 UI 规格

### 6.1 设计令牌（CSS 自定义属性）

```css
/* packages/frontend/src/styles/global.css */
/* Tailwind CSS v4: 使用 CSS-first 配置，不需要 tailwind.config.ts */

@import 'tailwindcss';

/* Tailwind v4 主题扩展 */
@theme {
  --color-ink: #0B1120;
  --color-surface: #111827;
  --color-elevated: #1A2236;
  --color-border: #2A3550;
  --color-accent: #E2A93B;
  --color-accent-dim: rgba(226, 169, 59, 0.15);
  --color-positive: #4A9E8E;
  --color-decline: #C75B6A;
  --color-info: #5B8BD4;

  --font-display: 'Avenir Next', 'Century Gothic', 'Futura', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-data: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}

:root {
  /* === 颜色系统 === */
  --color-ink: #0B1120;
  --color-surface: #111827;
  --color-elevated: #1A2236;
  --color-border: #2A3550;

  --color-text-primary: #E8E4DD;
  --color-text-secondary: #9BA4B5;
  --color-text-tertiary: #5F6B80;

  --color-accent: #E2A93B;
  --color-accent-dim: rgba(226, 169, 59, 0.15);
  --color-positive: #4A9E8E;
  --color-decline: #C75B6A;
  --color-info: #5B8BD4;

  /* 分类色 */
  --color-cat-llm: #7C6FE0;
  --color-cat-agents: #D47B3E;
  --color-cat-vector: #4A9E8E;
  --color-cat-mlops: #5B8BD4;
  --color-cat-serving: #E2A93B;
  --color-cat-devtools: #9E7CB8;
  --color-cat-multimodal: #C75B6A;
  --color-cat-datasets: #6B8F71;
  --color-cat-apps: #D4A85B;

  /* 许可证颜色 */
  --color-license-mit: #22c55e;
  --color-license-apache: #3b82f6;
  --color-license-bsd: #14b8a6;
  --color-license-agpl: #f97316;
  --color-license-gpl: #f59e0b;
  --color-license-restrictive: #ef4444;
  --color-license-none: #6b7280;

  /* 健康徽章颜色 */
  --color-health-green: #22c55e;
  --color-health-yellow: #eab308;
  --color-health-red: #ef4444;

  /* === 字体系统 === */
  --font-display: 'Avenir Next', 'Century Gothic', 'Futura', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-data: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;

  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5625rem;
  --text-2xl: 1.953rem;
  --text-3xl: 2.441rem;
  --text-rank: 4rem;

  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  /* === 间距系统 (4px 基数) === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* === 圆角 === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* === 阴影 === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

  /* === 动效 === */
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* === 布局 === */
  --max-width: 1200px;
  --nav-height: 56px;
  --sidebar-width: 240px;
}

/* 暗色模式为默认，浅色模式覆盖 */
[data-theme="light"] {
  --color-ink: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-elevated: #F5F5F5;
  --color-border: #E5E7EB;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
}

/* 减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```


### 6.2 主题切换持久化

**ThemeToggle 实现要点：**
- localStorage key: `gitpulse-theme`
- 默认行为：尊重 `prefers-color-scheme`，如用户未手动设置则跟随系统
- FOUC 防闪烁：在 BaseLayout.astro 的 `<head>` 中添加内联脚本

```html
<!-- packages/frontend/src/layouts/BaseLayout.astro <head> 内 -->
<script is:inline>
  (function() {
    const saved = localStorage.getItem('gitpulse-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  })();
</script>
```

```typescript
// packages/frontend/src/components/react/ThemeToggle.tsx
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('gitpulse-theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('gitpulse-theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <button onClick={toggle} aria-label={`切换到${theme === 'dark' ? '浅色' : '深色'}模式`}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### 6.3 响应式断点

| 断点 | 宽度 | 栅格列数 | 说明 |
|---|---|---|---|
| mobile | < 640px | 4 列 | 单列卡片，底部标签栏 |
| tablet | 640px - 1023px | 8 列 | 2 列卡片，侧边栏折叠 |
| desktop | >= 1024px | 12 列 | 3 列卡片，固定侧边栏 |
| wide | >= 1280px | 12 列 | 最大内容宽度 1200px |

### 6.4 页面规格

#### 页面 1: 首页 (/)

**布局结构：**

```
+--------------------------------------------------+
| 导航栏 (56px 固定)                                 |
+--------------------------------------------------+
| Hero 区域                                          |
| - 标题: "发现 AI 开源世界的下一个趋势"                |
| - 副标题: 简短说明                                   |
| - Amber 径向渐变光晕背景                             |
| - 统计数据栏 (4 个指标, 等宽分布, 计数动画)            |
|   [追踪项目数] [今日新增 Stars] [AI 分类数] [最近更新]  |
+--------------------------------------------------+
| 分类标签区域                                        |
| - 横向滚动 FilterChips (9 个分类 + "全部")           |
| - 当前选中高亮 Amber                                |
+--------------------------------------------------+
| "今日热门" 项目卡片网格                              |
| - 3 列 (desktop), 2 列 (tablet), 1 列 (mobile)    |
| - 每个卡片: RepoCard 组件                           |
| - 显示 6-9 个项目                                   |
| - "查看更多" 链接 -> /trending/daily                  |
| - 空状态: "数据初始化中，请稍后访问" 提示卡片           |
+--------------------------------------------------+
| "AI 精选" 编辑性区域                                |
| - 2 列布局: 大特色卡片 + 侧边精选列表                 |
| - FeaturedCard 组件 (双列: 视觉面板 + 编辑内容)       |
| - 最近 3 个精选合集预览                               |
+--------------------------------------------------+
| 分类导航网格                                        |
| - CategoryCard 组件, 3x3 网格                       |
| - 每个卡片: 图标 + 名称 + 仓库计数                    |
+--------------------------------------------------+
| 页脚                                               |
| - 数据新鲜度指示: "数据更新于 XX 小时前"              |
+--------------------------------------------------+
```

#### 页面 2: 趋势列表 (/trending/[since])

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 页面标题 + 时间窗口标签 (daily | weekly | monthly)  |
+--------------------------------------------------+
| +----------+  +-------------------------------+   |
| | 过滤侧栏  |  | 排序控制栏                     |   |
| | (240px)   |  | [速度] [总星标] [综合评分] [更新] |   |
| |           |  +-------------------------------+   |
| | 语言过滤   |  | 排名 #1 — TrendingRow 组件     |   |
| | [Python]  |  | 排名 #2 — TrendingRow 组件     |   |
| | [TS]      |  | ...                           |   |
| | [Rust]    |  | 排名 #25 — TrendingRow 组件    |   |
| | [Go]      |  +-------------------------------+   |
| | [C++]     |  | 分页组件（客户端分页）            |   |
| |           |  +-------------------------------+   |
| | 分类过滤   |                                     |
| | 许可证过滤 |                                     |
| +----------+                                     |
+--------------------------------------------------+
```

**TrendingRow 组件规格：**
- 排名数字：64px，font-data，颜色 var(--color-border)，Top 3 为 var(--color-accent)
- 三列网格：[排名 80px] [信息区 1fr] [指标区 200px]
- hover 效果：translateY(-1px)，背景色变为 var(--color-elevated)

#### 页面 3: 搜索 (/search)

搜索完全基于客户端 Fuse.js 实现，无服务端搜索。搜索栏 52px 高度、全宽、自动聚焦，300ms debounce 实时补全。支持语言、分类、许可证、最低星标过滤和排序。

#### 页面 4: 项目详情 (/repo/[owner]/[name])

Astro 在构建时使用 `getStaticPaths()` 为每个仓库生成静态详情页。包含项目头部（徽章行、指标行、集成徽章行）、星标历史图表（SVG，30 天趋势线）、AI 分析区域（评分分解、摘要、优劣势）、相关项目推荐。

**StarChart React Island：** 使用 `client:visible` 指令，纯 SVG polyline + polygon，零外部依赖，bundle < 3KB gzipped。

#### 页面 5: AI 精选 (/featured)

从 `data/featured-collections.json` 读取数据。包含置顶合集、主题合集横向滚动区、历史合集分页列表。

#### 页面 6: 分类 (/category/[slug])

使用 `getStaticPaths()` 从 `data/categories.json` 生成。包含分类头部、过滤侧栏、仓库列表。空状态显示 "该分类暂无收录项目"。

#### 页面 7: 对比 (/compare)

纯客户端交互。最多 3 个仓库对比，URL 参数 `?repos=owner1/name1,owner2/name2`。展示对比表格和星标趋势对比图。

#### 页面 8: 关于 (/about)

包含评分方法论、AI 分析说明（含完整 Prompt 模板）、数据来源说明、开源与隐私声明。

### 6.5 组件清单

| 组件 | 类型 | 文件 | JS 输出 |
|---|---|---|---|
| Header | Astro | Header.astro | 0 KB |
| Footer | Astro | Footer.astro | 0 KB |
| RepoCard | Astro | RepoCard.astro | 0 KB |
| TrendingRow | Astro | TrendingRow.astro | 0 KB |
| CategoryCard | Astro | CategoryCard.astro | 0 KB |
| HealthBadge | Astro | HealthBadge.astro | 0 KB |
| LicenseBadge | Astro | LicenseBadge.astro | 0 KB |
| MetricsBar | Astro | MetricsBar.astro | 0 KB |
| IntegrationBadges | Astro | IntegrationBadges.astro | 0 KB |
| StatsBar | Astro | StatsBar.astro | 0 KB |
| Pagination | Astro | Pagination.astro | 0 KB |
| TimeWindowTabs | Astro | TimeWindowTabs.astro | 0 KB |
| FeaturedCard | Astro | FeaturedCard.astro | 0 KB |
| ScoreBreakdown | Astro | ScoreBreakdown.astro | 0 KB |
| Skeleton | Astro | Skeleton.astro | 0 KB |
| EmptyState | Astro | EmptyState.astro | 0 KB |
| DataFreshness | Astro | DataFreshness.astro | 0 KB |
| SearchBar | React Island | SearchBar.tsx | ~8 KB (含 Fuse.js) |
| FilterPanel | React Island | FilterPanel.tsx | ~3 KB |
| StarChart | React Island | StarChart.tsx | ~3 KB |
| CompareTable | React Island | CompareTable.tsx | ~4 KB |
| ThemeToggle | React Island | ThemeToggle.tsx | ~1 KB |
| MobileNav | React Island | MobileNav.tsx | ~2 KB |

### 6.6 HealthBadge 计算规则

```typescript
// packages/shared/src/utils/health-badge.ts

export type HealthBadge = 'green' | 'yellow' | 'red';

export function computeHealthBadge(repo: {
  pushedAt: string | null;
  openIssues: number;
  hasCi: boolean;
  hasReleases: boolean;
  isArchived: boolean;
}): HealthBadge {
  if (repo.isArchived) return 'red';

  const now = Date.now();
  const pushedAtMs = repo.pushedAt ? new Date(repo.pushedAt).getTime() : 0;
  const daysSincePush = (now - pushedAtMs) / (1000 * 60 * 60 * 24);

  if (daysSincePush >= 90) return 'red';
  if (daysSincePush < 14 && repo.openIssues < 500 && (repo.hasCi || repo.hasReleases)) {
    return 'green';
  }
  if (daysSincePush < 90 && repo.openIssues < 1000) {
    return 'yellow';
  }
  return 'red';
}
```

### 6.7 LicenseBadge 颜色映射

```typescript
// packages/shared/src/constants/license-colors.ts

export const LICENSE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'MIT':        { bg: '#22c55e20', text: '#22c55e', label: 'MIT' },
  'Apache-2.0': { bg: '#3b82f620', text: '#3b82f6', label: 'Apache 2.0' },
  'BSD-2-Clause': { bg: '#14b8a620', text: '#14b8a6', label: 'BSD-2' },
  'BSD-3-Clause': { bg: '#14b8a620', text: '#14b8a6', label: 'BSD-3' },
  'AGPL-3.0':   { bg: '#f9731620', text: '#f97316', label: 'AGPL-3' },
  'GPL-2.0':    { bg: '#f59e0b20', text: '#f59e0b', label: 'GPL-2' },
  'GPL-3.0':    { bg: '#f59e0b20', text: '#f59e0b', label: 'GPL-3' },
  'LGPL-2.1':   { bg: '#f59e0b20', text: '#f59e0b', label: 'LGPL-2.1' },
  'LGPL-3.0':   { bg: '#f59e0b20', text: '#f59e0b', label: 'LGPL-3' },
  'BSL-1.1':    { bg: '#ef444420', text: '#ef4444', label: 'BSL' },
  'SSPL-1.0':   { bg: '#ef444420', text: '#ef4444', label: 'SSPL' },
  'UNLICENSED': { bg: '#6b728020', text: '#6b7280', label: 'None' },
};

export function getLicenseColor(spdx: string | null): typeof LICENSE_COLORS[string] {
  if (!spdx) return { bg: '#6b728020', text: '#6b7280', label: 'Unknown' };
  return LICENSE_COLORS[spdx] || { bg: '#6b728020', text: '#6b7280', label: spdx };
}
```

### 6.8 交互行为

| 交互 | 缓动 | 时长 | 说明 |
|---|---|---|---|
| 卡片 hover | ease-out-expo | 250ms | translateY(-2px) + 背景色变化 |
| 排名行 hover | ease-out-expo | 150ms | 背景色 -> elevated |
| 页面切换 | - | 0ms | 无动画（Astro 页面导航） |
| 统计数字计数 | ease-out-expo | 800ms | 从 0 数到目标值 |
| 排行列表进场 | ease-out-expo | 250ms | 逐行 fadeIn，40ms 交错 |
| 搜索下拉展开 | ease-out-expo | 200ms | maxHeight 过渡 |
| 主题切换 | ease-out-expo | 400ms | CSS 变量过渡 |
| 骨架屏闪烁 | linear | 1.5s | background-position 动画 |
| 客户端过滤/排序 | ease-out-expo | 150ms | 列表重排过渡 |

---

## 7. AI 智能筛选系统

### 7.1 评分算法详解

#### 总体公式

```
综合得分 = 0.30 * 增长速度 + 0.20 * 项目成熟度 + 0.20 * 社区健康 + 0.20 * AI 相关性 + 0.10 * 代码质量
```

每个分项评分范围 0-100，综合得分范围 0-100。

#### A. 增长速度 (权重: 0.30)

混合绝对和相对增长（60/40），日增 100 stars 得满分。综合：日 50% + 周 30% + 月 20%。

#### B. 项目成熟度 (权重: 0.20)

年龄得分（30%）+ 发布频率（35%）+ 文档质量（35%）。近 6 个月每月 2 次以上 release 得满分。

#### C. 社区健康 (权重: 0.20)

贡献者多样性（35%）+ Issue 响应速度（35%）+ 活跃度（30%）。50+ 贡献者、1 天内关闭 issue、1 天内有 push 各得满分。

#### D. AI 相关性 (权重: 0.20)

Topic 匹配（40%）+ README 关键词密度（40%）+ 语言信号（20%）。匹配 3 个 AI_TOPICS 得满分，匹配 5 个 AI_README_KEYWORDS 得满分。

#### E. 代码质量 (权重: 0.10)

许可证（50 分）+ 测试（25 分）+ CI（25 分）。

#### 综合得分与分级

Star >= 70, Notable 50-69, Tracked 30-49, Filtered < 30。

#### 硬性排除规则

已归档、fork（除非 star >= 原仓库 5 倍）、star < 50、超过 180 天未 push。

### 7.2 LLM 分析 Prompt 模板

系统 prompt 定义 9 大分类 taxonomy 和 4 维评分 rubric（novelty/clarity/production/category_fit，各 0-10）。用户 prompt 包含仓库元数据和截断至 3000 字符的 README 内容。输出为严格 JSON 格式，通过 Zod schema 验证。

### 7.3 LLM API 调用实现

使用 OpenAI 兼容协议的通用客户端，通过环境变量配置 API Key、Base URL 和模型 ID。支持任意兼容 OpenAI Chat Completions API 的 LLM 服务商（如 OpenAI、Anthropic、DeepSeek、Moonshot、本地 Ollama 等）。

```typescript
// scripts/lib/llm-client.ts

import OpenAI from 'openai';
import type { LLMConfig } from './config';

export function createLLMClient(config: LLMConfig) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  return {
    async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await client.chat.completions.create({
            model: config.model,
            temperature: 0.2,
            max_tokens: 1024,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          });
          return response.choices[0]?.message?.content ?? '';
        } catch (err: unknown) {
          if (attempt === maxRetries) throw err;
          const isRateLimit = err instanceof Error && 'status' in err && (err as any).status === 429;
          const isServer = err instanceof Error && 'status' in err && (err as any).status >= 500;
          if (!isRateLimit && !isServer) throw err;
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`LLM API attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('LLM API: max retries exceeded');
    },
  };
}
```

调用参数：temperature 0.2，max_tokens 1024。支持最多 3 次重试，指数退避处理 429（速率限制）和 5xx（服务器错误）。输出通过 Zod schema 验证 JSON 结构。

### 7.4 分类体系

9 大 AI 分类：LLM Frameworks、Vector Databases、AI Agents、MLOps & Evaluation、Model Serving、AI Dev Tools、Multimodal、Datasets & Benchmarks、AI Applications。每个分类定义了 Topic 信号、关键词信号和语言偏好。

### 7.5 GitHub Actions 调度计划

每日两次（UTC 00:00 和 12:00），单个工作流按序执行 discover -> snapshot -> enrich -> score -> analyze -> collections -> cleanup。无 Workers CPU 时间限制。

### 7.6 精选合集自动生成

每周生成 "本周上升最快" 合集（Top 10 周星标增长），每月第一个周日生成各分类 Top 10 合集。保留策略：最新合集 + 最近 4 个 weekly_digest。

### 7.7 成本估算

| 项目 | 月费用 |
|---|---|
| Cloudflare Pages | $0.00 |
| GitHub Actions | $0.00 |
| LLM API（按所选模型计费） | 取决于模型（参考：Claude Haiku ~$0.50、DeepSeek ~$0.10、本地 Ollama $0） |
| **月度总计** | **$0 ~ $0.50**（取决于 LLM 选择） |

---

## 8. GitHub 数据抓取方案

### 8.1 数据源策略（双源架构）

| 数据源 | 角色 | 优势 | 劣势 |
|---|---|---|---|
| GitHub Search API | 主数据源 | API 稳定，结构化 JSON | 30 req/min 限制，无 starsGained |
| HTML 抓取 (cheerio) | 辅助数据源 | 可获取 starsGained 排名 | HTML 结构可能变更 |

**抓取器健壮性措施：** 最少元素断言（>= 10）、连续失败告警（3 次）、HTML 快照保存、Search API 后备。

### 8.2 GitHub API 响应映射

GitHub REST API snake_case 字段映射到应用 camelCase 类型（`mapGitHubRepoToEnriched`）。

### 8.3 GitHub REST/GraphQL API 客户端

REST 用于单个仓库补全，GraphQL 用于批量查询（100 repos/query，1842 个仓库仅需 19 次查询）。包含速率限制监控。

### 8.4 API 速率限制应对

| 端点 | 认证限制 | 应对策略 |
|---|---|---|
| REST /repos | 5000/hr | PAT 认证，顺序处理 |
| Search API | 30/min | 仅趋势发现 |
| GraphQL | 5000 points/hr | 批量查询 100 repos/query |
| Trending 页面 | 无硬性限制 | 辅助数据源 |

### 8.5 发现管道实现

一次性处理所有语言（`['all', ...SCRAPE_LANGUAGES]`）和所有时间维度（daily/weekly/monthly）。先尝试 cheerio 抓取，失败回退到 Search API。去重后批量补全元数据。

### 8.6 AI 分析管道

筛选 `composite >= 50` 且 `pushedAt > lastAnalyzedAt` 的仓库，获取 README 后调用配置的 LLM API，更新 curation 字段。

### 8.7 元数据刷新（GraphQL 批量）

使用 `batchQueryGraphQL` 全量刷新所有仓库的 stars、forks、issues、topics 等字段。

### 8.8 30 天滚动数据保留策略

清理综合评分 < 30 且超过 30 天未在趋势页出现的仓库，清理过期星标历史，保留最近 100 条同步日志。

---

## 9. 部署方案

### 9.1 Pages 配置（Astro 纯静态模式）

```typescript
// packages/frontend/astro.config.ts

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gitpulse.dev',
  output: 'static',
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

> **说明：** `output: 'static'` 表示纯静态站点生成，无需任何服务端适配器。Tailwind CSS v4 使用 `@tailwindcss/vite` 插件，不需要 `tailwind.config.ts` 文件。

### 9.2 环境变量清单

| 变量名 | 存储位置 | 用途 |
|---|---|---|
| GITHUB_TOKEN | GitHub Secret | GitHub PAT 认证，用于数据管道脚本 |
| LLM_API_KEY | GitHub Secret | LLM 服务 API 密钥 |
| LLM_BASE_URL | GitHub Secret | LLM API 基础 URL |
| LLM_MODEL | GitHub Secret | LLM 模型 ID |
| CLOUDFLARE_API_TOKEN | GitHub Secret | Cloudflare Pages 部署认证 |
| CLOUDFLARE_ACCOUNT_ID | GitHub Secret | Cloudflare 账户 ID |

### 9.3 CI/CD 部署流程

三个 GitHub Actions 工作流：

1. **sync-data.yml**（核心）：cron 每日 UTC 00:00/12:00 触发，按序执行数据管道 7 个阶段，git commit + push 数据变更，Astro SSG 构建，wrangler pages deploy 部署。使用 `concurrency` 避免并发冲突。
2. **test.yml**：PR 和 push 触发，执行 lint + typecheck + test。
3. **deploy.yml**：main 分支 push 且 paths 匹配 `packages/frontend/**`、`packages/shared/**`、`data/**` 时触发，构建并部署前端。

### 9.4 自定义域名设置

Cloudflare Dashboard -> Pages -> gitpulse-ai -> Custom Domains -> Add "gitpulse.dev"，CNAME 指向 `gitpulse-ai.pages.dev`，自动 SSL。

### 9.5 数据目录初始化脚本

`scripts/init-data.sh` 创建 `data/` 目录及所有空 JSON 数据文件（repositories.json、trending-*.json、categories.json、featured-collections.json、star-history.json、stats.json、sync-log.json、search-index.json），每个文件包含符合 schema 的初始结构。

---

## 10. 开发里程碑

| Phase | 内容 | 工时 |
|---|---|---|
| Phase 1 | 基础框架搭建（monorepo、配置、shared 包、data 初始化） | 2 天 |
| Phase 2 | 数据管道脚本（抓取、评分、搜索索引、测试） | 3 天 |
| Phase 3 | 前端页面实现（8 个页面 + 23 个组件 + 响应式） | 4 天 |
| Phase 4 | AI 策展系统（通用 LLM 客户端、Prompt、合集生成） | 2 天 |
| Phase 5 | 部署与优化（性能、SEO、安全） | 1 天 |

**总预计工时：约 12 个工作日 (2.5 周)**

> **与原架构对比：** 移除 Workers/D1/KV 后端基础设施后，总工时从 20 天缩减至 12 天。

---

## 11. 非功能需求

### 11.1 性能目标

| 指标 | 目标 |
|---|---|
| LCP | < 1.2s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTFB | < 50ms |
| 首页 JS | < 50KB gzipped |
| Lighthouse | >= 95 |

### 11.2-11.5 SEO、可访问性、安全性、监控

- SEO：唯一 title/description、JSON-LD、Open Graph、sitemap.xml
- 可访问性：WCAG 2.1 AA、键盘操作、焦点状态、对比度 >= 4.5:1
- 安全性：密钥仅在 GitHub Secrets、纯静态无服务端凭据、Zod 输入验证
- 监控：GitHub Actions 失败通知、API 配额监控、数据文件大小告警

---

## 12. 附录

### 12.1 环境变量完整清单

| 变量 | 必填 | 存储方式 | 说明 |
|---|---|---|---|
| GITHUB_TOKEN | 是 | GitHub Secret | GitHub PAT |
| LLM_API_KEY | 是 | GitHub Secret | LLM 服务 API 密钥 |
| LLM_BASE_URL | 是 | GitHub Secret | LLM API 基础 URL（如 `https://api.openai.com/v1`） |
| LLM_MODEL | 是 | GitHub Secret | LLM 模型 ID（如 `gpt-4o-mini`、`claude-haiku-4-20250414`、`deepseek-chat`） |
| CLOUDFLARE_API_TOKEN | 是 | GitHub Secret | Pages 部署 Token |
| CLOUDFLARE_ACCOUNT_ID | 是 | GitHub Secret | Cloudflare 账户 ID |

### 12.2 第三方服务账号需求

| 服务 | 费用 |
|---|---|
| Cloudflare Pages | $0/月 |
| GitHub Actions | $0/月（公开仓库） |
| LLM API（用户自选） | $0 ~ $0.50/月（取决于模型） |
| **总计** | **$0 ~ $0.50/月** |

### 12.3 完整 package.json 文件

**根目录 package.json：**

```json
{
  "name": "gitpulse-ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "pnpm --filter frontend dev",
    "build": "pnpm --filter @gitpulse/shared build && pnpm --filter frontend build",
    "deploy": "pnpm build && pnpm deploy:frontend",
    "deploy:frontend": "pnpm --filter frontend exec wrangler pages deploy ./dist --project-name=gitpulse-ai",
    "pipeline:fetch": "tsx scripts/pipeline/fetch-trending.ts",
    "pipeline:enrich": "tsx scripts/pipeline/enrich-metadata.ts",
    "pipeline:score": "tsx scripts/pipeline/score-repos.ts",
    "pipeline:curate": "tsx scripts/pipeline/ai-curate.ts",
    "pipeline:collections": "tsx scripts/pipeline/generate-collections.ts",
    "pipeline:cleanup": "tsx scripts/pipeline/cleanup-stale.ts",
    "pipeline:search-index": "tsx scripts/pipeline/build-search-index.ts",
    "pipeline:all": "tsx scripts/pipeline.ts",
    "typecheck": "pnpm -r typecheck",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "tsx": "^4.0.0",
    "typescript": "^5.7.0",
    "wrangler": "^4.0.0"
  },
  "dependencies": {
    "openai": "^4.73.0",
    "cheerio": "^1.0.0",
    "zod": "^3.23.0",
    "@gitpulse/shared": "workspace:*"
  }
}
```

**packages/frontend/package.json：**

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check && tsc --noEmit"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/react": "^4.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "fuse.js": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@gitpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "astro-check": "^0.9.0"
  }
}
```

### 12.4 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['scripts/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
```

### 12.5 本地开发快速启动

```bash
# 1. 克隆并安装
git clone <repo-url>
cd awesome-project-in-github
pnpm install

# 2. 创建本地环境变量文件
cat > .env << 'EOF'
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EOF

# 3. 初始化数据目录（两种方式二选一）
# 方式 A：使用种子数据（推荐，立即可用）
bash scripts/init-data.sh
# 方式 B：运行完整数据管道获取真实数据
pnpm run pipeline:all

# 4. 启动开发服务器（仅需一个终端）
pnpm dev
# 开发服务器默认运行在 http://localhost:4321
```

> **与原架构对比：** 本地开发从 3 个终端简化为 1 个终端。无需创建 D1 数据库和 KV 命名空间。
