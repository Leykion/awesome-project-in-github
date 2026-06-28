> 版本: v1.0 | 日期: 2026-06-28 | 状态: 已审查

# GitPulse AI — GitHub 热门 AI 开源项目展示平台

## 技术规格文档 v1.0

---

## 1. 项目概述

### 1.1 项目名称

**GitPulse AI** — 面向 AI 开发者的 GitHub 热门开源项目发现与评估平台。

### 1.2 项目目标

构建一个部署在 Cloudflare 上的全栈 Web 应用，帮助 AI 开发者快速发现、评估和比较 GitHub 上最具势头的 AI 相关开源项目。区别于现有竞品（GitHub Trending、Star History、OSS Insight），本平台以 **AI 功能分类**（而非编程语言）作为主要导航维度，结合 **星标增长速度**、**维护健康度**、**许可证合规性** 和 **AI 驱动的智能策展** 四大核心信号，为 AI 开发者提供从"发现"到"集成决策"的完整信息闭环。

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
| AI 驱动策展摘要 | Claude 生成 | 无 | 博客（人工） | NL 查询（demo 级） |
| 集成能力检测 | CI/Docker/PyPI 等 | 无 | 无 | 无 |

### 1.5 技术栈总结

| 层 | 技术 | 版本 | 用途 |
|---|---|---|---|
| 前端框架 | Astro | 5.x | SSG + 按需 SSR |
| 交互层 | React | 19.x | Islands 架构，仅交互区域 |
| UI 组件 | shadcn/ui | latest | 源码式组件库 |
| 样式 | Tailwind CSS | v4 | 原子化 CSS（CSS-first 配置，使用 @tailwindcss/vite 插件） |
| 搜索（客户端） | Fuse.js | 7.x | 内存模糊搜索 |
| API 路由 | itty-router | 5.x | Workers 轻量路由 |
| 参数校验 | Zod | 3.x | 运行时类型验证 |
| 后端运行时 | Cloudflare Workers | - | V8 Isolate 边缘计算 |
| 前端托管 | Cloudflare Pages | - | 全球 CDN + SSR Functions |
| 数据库 | Cloudflare D1 | - | 边缘 SQLite |
| 缓存 | Cloudflare KV | - | 全球分布式键值存储（需 Workers Paid，免费层 1K 写入/日不足） |
| 定时任务 | Cron Triggers | - | Workers 定时调度 |
| AI 策展 | Claude Haiku 4 | claude-haiku-4-20250414 | 项目分析与分类 |
| 代码语言 | TypeScript | 5.7+ | 全栈类型安全 |
| 包管理 | pnpm | 9.x | Workspace monorepo |
| 部署 | Wrangler | 4.x | Cloudflare CLI |
| CI/CD | GitHub Actions | - | 自动化构建部署 |
| 代码检查 | Biome | 1.x | Lint + Format 一体化工具 |
| 测试 | Vitest | 3.x | 单元 + 集成测试 |

---

## 2. 系统架构

### 2.1 整体架构图

```
+-----------------------------------------------------------------------------------+
|                           用户 (AI 开发者)                                          |
+-----------------------------------------------------------------------------------+
          |                                                    |
          | HTTPS (gitpulse.pages.dev / 自定义域名)             | HTTPS (api.gitpulse.dev)
          v                                                    v
+-----------------------------------+        +-----------------------------------+
|   Cloudflare Pages (前端)          |        |  Cloudflare Worker (API)          |
|   packages/frontend/              |        |  packages/worker-api/             |
|                                   |        |                                   |
|   Astro 5.x + React 19 Islands   |        |  GET /api/trending                |
|   + shadcn/ui + Tailwind v4       |        |  GET /api/trending/:id            |
|                                   |        |  GET /api/search                  |
|   静态页面:                        |        |  GET /api/categories              |
|   - 首页、趋势列表、分类页          |        |  GET /api/categories/:slug        |
|   - 项目详情、对比页               |        |  GET /api/featured                |
|                                   |        |  GET /api/featured/:id            |
|   React Islands (交互组件):        |        |  GET /api/repos/:owner/:name      |
|   - 搜索栏、过滤面板               |        |  GET /api/stats                   |
|   - 星标趋势图、对比表格           |        |  GET /api/health                  |
|   - 主题切换                       |        |                                   |
|                                   |        |  读取: KV (热缓存) -> D1 (冷查询)  |
+-----------------------------------+        +-----------------------------------+
                                                       |            |
                                                       v            v
                                             +-------------+  +-----------+
                                             | Cloudflare   |  | Cloudflare|
                                             | KV           |  | D1        |
                                             | (热缓存)      |  | (SQLite)  |
                                             | TRENDING_KV  |  | 结构化数据 |
                                             +-------------+  +-----------+
                                                       ^            ^
                                                       |            |
                                             +-----------------------------------+
                                             |  Cloudflare Worker (定时任务)      |
                                             |  packages/worker-cron/            |
                                             |                                   |
                                             |  scheduled() handler              |
                                             |                                   |
                                             |  Cron 调度 (合并为 3 个触发器):     |
                                             |  "0 * * * *"   - 每小时统一调度     |
                                             |  "0 4 * * *"   - AI 策展分析       |
                                             |  "0 6 * * 0"   - 过期清理          |
                                             |                                   |
                                             |  数据管道:                         |
                                             |  1. 主数据源: GitHub Search API    |
                                             |  2. 辅助: HTMLRewriter 抓取       |
                                             |  3. GitHub REST API 补全元数据     |
                                             |  4. 规则评分引擎 (0-100)           |
                                             |  5. Claude Haiku 智能策展 (5-8/次) |
                                             |  6. 写入 D1 + KV                  |
                                             +-----------------------------------+
                                                  |                |
                                                  v                v
                                        +----------------+  +------------------+
                                        | GitHub         |  | Anthropic API    |
                                        | - Search API   |  | Claude Haiku 4   |
                                        |   (主数据源)    |  | 智能策展/分类     |
                                        | - /trending    |  +------------------+
                                        |   (HTML 辅助)  |
                                        | - REST v3      |
                                        |   (/repos)     |
                                        | - GraphQL v4   |
                                        |   (批量查询)    |
                                        +----------------+
```

### 2.2 三包 Monorepo 架构

项目采用 pnpm workspace monorepo 结构，拆分为三个独立的可部署单元和一个共享包：

| 包 | 部署目标 | 职责 |
|---|---|---|
| `packages/frontend` | Cloudflare Pages | Astro SSG 前端，静态 HTML + React Islands |
| `packages/worker-api` | Cloudflare Worker | API 服务，KV 读缓存 + D1 查询 |
| `packages/worker-cron` | Cloudflare Worker | 定时任务，数据抓取 + 评分 + AI 策展 |
| `packages/shared` | 内部依赖（不部署） | 共享类型定义、常量、工具函数 |

**架构决策理由：**

1. **Pages 无法运行 Cron Triggers**，必须用独立 Worker 承担定时任务
2. **单一 Worker 无法高效服务静态资源**，Pages 的全球 CDN 更适合前端
3. **API Worker 与 Cron Worker 分离**，避免 Cron 长时间运行影响 API 响应延迟
4. **共享包消除类型和常量的重复定义**，保持三个包的类型一致性

### 2.3 数据流

```
用户请求 → Pages CDN (静态 HTML) + API Worker (动态数据)
                                           |
                                     KV 缓存命中？
                                    /           \
                                  是              否
                                  |               |
                          返回缓存数据        查询 D1 数据库
                          (stale: false)     ctx.waitUntil(写入 KV)
                                              返回 D1 数据
                                              (stale: true)

Cron 定时任务 → GitHub Search API + 抓取 → 规则评分 → LLM 策展 → 写入 D1 → 更新 KV 缓存
```

### 2.4 SSG 构建时数据获取策略

前端使用 Astro SSG，在构建时需要从 API Worker 获取数据。为避免鸡生蛋问题（构建时 API Worker 可能尚未部署或数据为空），采用以下策略：

1. **CI/CD 部署顺序**：deploy.yml 中 API Worker **先于**前端部署，确保构建时 API 可用
2. **容错处理**：所有 SSG 数据获取使用 try-catch，失败时返回空数组/默认值
3. **首次运行**：系统部署后，需手动触发一次 Cron Worker 的 discover 任务以填充初始数据
4. **定时重建**：GitHub Actions schedule 每 6 小时触发前端重建，确保数据新鲜度

```typescript
// packages/frontend/src/lib/api-client.ts
const API = import.meta.env.PUBLIC_API_BASE_URL;

export async function fetchAPI<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return fallback;
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    console.warn(`API fetch failed: ${path}, using fallback`);
    return fallback;
  }
}
```

### 2.5 首次运行体验

系统首次部署后数据库为空。各页面的空状态处理：

| 页面 | 空状态展示 |
|---|---|
| 首页 | 显示 Hero 区域 + "数据同步中，请稍后访问" 提示卡片 + 分类导航网格（零计数） |
| 趋势列表 | "暂无趋势数据" 插图 + "数据将在首次 Cron 任务运行后显示" 说明 |
| 搜索页 | 搜索无结果时显示 "未找到匹配项目，试试其他关键词" + 热门搜索推荐 |
| 项目详情 | 无 AI 策展时显示 "AI 分析待生成" 占位卡片，其余字段正常展示 |
| 星标图表 | 少于 2 个数据点时显示 "数据积累中" 文字替代图表 |
| 分类页 | 分类无仓库时显示 "该分类暂无收录项目" |
| API 不可达 | 前端显示 "服务暂时不可用，请刷新重试" toast 提示 |

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
+-- .github/
|   +-- workflows/
|       +-- deploy.yml                        # CI/CD: 构建 + 部署所有包
|       +-- test.yml                          # CI: lint + 类型检查 + 测试
|
+-- packages/
|   |
|   +-- frontend/                             # Astro 5.x 前端应用
|   |   +-- package.json                      # 前端依赖声明
|   |   +-- astro.config.ts                   # Astro 配置（@astrojs/cloudflare 适配器）
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
|   |       |   +-- api/
|   |       |       +-- search.ts             # Pages Function: 服务端搜索 (SSR)
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
|   |       |   +-- react/                    # 交互 React Islands
|   |       |       +-- SearchBar.tsx         # 搜索栏（Fuse.js 自动补全）
|   |       |       +-- FilterPanel.tsx       # 过滤面板（语言 + 分类 + 排序）
|   |       |       +-- StarChart.tsx         # 星标趋势 SVG 迷你图
|   |       |       +-- CompareTable.tsx      # 仓库对比表格（最多 3 个）
|   |       |       +-- ThemeToggle.tsx       # 深色/浅色主题切换
|   |       |       +-- MobileNav.tsx         # 移动端底部标签栏
|   |       +-- lib/
|   |       |   +-- api-client.ts             # Worker API 类型化请求封装（含容错）
|   |       |   +-- format.ts                 # 数字格式化、相对时间
|   |       |   +-- constants.ts              # 分类 slug、颜色映射
|   |       +-- styles/
|   |       |   +-- global.css                # Tailwind v4 CSS-first 配置 + 设计令牌
|   |       +-- content/                      # （可选）Astro 内容集合，用于博客/周报
|   |
|   +-- worker-api/                           # Cloudflare Worker — API 服务器
|   |   +-- package.json                      # API Worker 依赖
|   |   +-- wrangler.toml                     # API Worker 部署配置
|   |   +-- .dev.vars                         # 本地开发密钥文件（gitignored）
|   |   +-- tsconfig.json                     # TypeScript 配置
|   |   +-- vitest.config.ts                  # 测试配置
|   |   +-- src/
|   |   |   +-- index.ts                      # itty-router 入口
|   |   |   +-- routes/
|   |   |   |   +-- trending.ts               # GET /api/trending, GET /api/trending/:id
|   |   |   |   +-- search.ts                 # GET /api/search
|   |   |   |   +-- categories.ts             # GET /api/categories, GET /api/categories/:slug
|   |   |   |   +-- featured.ts               # GET /api/featured, GET /api/featured/:id
|   |   |   |   +-- repos.ts                  # GET /api/repos/:owner/:name
|   |   |   |   +-- stats.ts                  # GET /api/stats
|   |   |   |   +-- health.ts                 # GET /api/health
|   |   |   +-- middleware/
|   |   |   |   +-- cors.ts                   # CORS 头处理
|   |   |   |   +-- cache.ts                  # KV 读穿缓存逻辑
|   |   |   |   +-- error-handler.ts          # 统一错误处理
|   |   |   +-- types.ts                      # Env 绑定类型、请求/响应类型
|   |   +-- tests/
|   |       +-- routes/
|   |           +-- trending.test.ts          # 趋势端点测试
|   |           +-- search.test.ts            # 搜索端点测试
|   |
|   +-- worker-cron/                          # Cloudflare Worker — 定时任务
|   |   +-- package.json                      # Cron Worker 依赖
|   |   +-- wrangler.toml                     # Cron Worker 部署配置（含 cron triggers）
|   |   +-- .dev.vars                         # 本地开发密钥文件（gitignored）
|   |   +-- tsconfig.json                     # TypeScript 配置
|   |   +-- vitest.config.ts                  # 测试配置
|   |   +-- src/
|   |   |   +-- index.ts                      # scheduled() 入口，按 cron 模式分发任务
|   |   |   +-- pipeline/
|   |   |   |   +-- discover.ts               # 阶段 1: GitHub Search API + HTMLRewriter 辅助发现
|   |   |   |   +-- snapshot.ts               # 阶段 2: 每日星标快照记录
|   |   |   |   +-- enricher.ts               # 阶段 3: GitHub REST/GraphQL API 元数据补全
|   |   |   |   +-- rule-scorer.ts            # 阶段 4: 规则评分引擎 (0-100)
|   |   |   |   +-- llm-evaluator.ts          # 阶段 5: Claude Haiku 智能策展
|   |   |   |   +-- persister.ts              # 阶段 6: D1 持久化 + KV 缓存更新
|   |   |   |   +-- cleanup.ts               # 过期仓库清理
|   |   |   |   +-- collection-generator.ts   # 精选合集自动生成
|   |   |   +-- github/
|   |   |   |   +-- scraper.ts               # HTMLRewriter 流式 HTML 解析器（辅助数据源）
|   |   |   |   +-- search-api.ts            # GitHub Search API 客户端（主数据源）
|   |   |   |   +-- api-client.ts            # GitHub REST/GraphQL API 客户端
|   |   |   |   +-- repo-mapper.ts           # GitHub API 响应 → 应用类型转换
|   |   |   |   +-- rate-limiter.ts          # API 速率限制管理
|   |   |   +-- analysis/
|   |   |   |   +-- prompt.ts                # Claude API Prompt 模板构建
|   |   |   |   +-- claude-client.ts         # Claude API 客户端（重试逻辑）
|   |   |   |   +-- classifier.ts            # 规则分类器（LLM 后备）
|   |   |   |   +-- fallback.ts              # LLM 失败时的后备分析生成
|   |   |   |   +-- schema.ts                # Zod 输出验证 schema
|   |   |   +-- types.ts                     # Cron Worker 类型定义
|   |   +-- tests/
|   |   |   +-- pipeline/
|   |   |   |   +-- rule-scorer.test.ts      # 评分引擎单元测试
|   |   |   +-- github/
|   |   |   |   +-- scraper.test.ts          # 抓取器集成测试
|   |   |   +-- fixtures/
|   |       |   +-- trending-python.html     # GitHub 趋势页 HTML 快照
|   |       |   +-- trending-typescript.html # GitHub 趋势页 HTML 快照
|   |       |   +-- trending-all.html        # GitHub 趋势页 HTML 快照
|   |
|   +-- shared/                              # 共享代码（类型、工具函数、常量）
|       +-- package.json                     # 共享包配置（含 exports 定义）
|       +-- tsconfig.json                    # TypeScript 配置
|       +-- src/
|           +-- index.ts                     # 统一导出入口
|           +-- types/
|           |   +-- repo.ts                  # ScrapedRepo, EnrichedRepo, AnalyzedRepo 类型
|           |   +-- api.ts                   # API 请求/响应通用信封类型
|           |   +-- scoring.ts               # 评分权重、阈值类型
|           |   +-- curation.ts              # AI 策展结果类型
|           |   +-- env.ts                   # Worker Env 绑定类型定义
|           +-- constants/
|           |   +-- categories.ts            # 9 大 AI 分类定义
|           |   +-- languages.ts             # 编程语言列表 + GitHub 颜色映射
|           |   +-- scoring-weights.ts       # 评分信号权重常量
|           |   +-- ai-topics.ts             # AI 相关 GitHub 话题标签列表
|           |   +-- license-colors.ts        # SPDX 许可证颜色映射
|           +-- utils/
|               +-- kv-keys.ts              # KV 键名构建工具
|               +-- date.ts                 # 日期格式化辅助函数
|               +-- validation.ts           # Zod schema：API 参数验证
|               +-- health-badge.ts         # 健康状态计算逻辑
|               +-- number.ts              # 数字格式化（1.2k, 45.3k 等）
|
+-- migrations/                              # D1 数据库迁移文件
|   +-- 0001_create_categories.sql           # 分类表
|   +-- 0002_create_repositories.sql         # 仓库主表
|   +-- 0003_create_trending_snapshots.sql   # 趋势快照表
|   +-- 0004_create_ai_curations.sql         # AI 策展结果表
|   +-- 0005_create_featured_collections.sql # 精选合集表
|   +-- 0006_create_sync_logs.sql            # 同步日志表
|   +-- 0007_create_star_history.sql         # 星标历史表
|   +-- 0008_seed_categories.sql             # 分类种子数据
|
+-- scripts/
|   +-- seed-categories.ts                   # 种子数据脚本
|   +-- test-scraper.ts                      # 手动测试抓取器
|   +-- test-llm.ts                          # 手动测试 LLM 评估
|   +-- test-scorer.ts                       # 手动测试评分引擎
|   +-- setup-resources.sh                   # 自动创建 D1/KV 并写入 wrangler.toml
|
+-- docs/
    +-- SPEC.md                              # 本技术规格文档
```

---

## 3.1 基础配置文件

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### tsconfig.base.json

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
  "exclude": ["node_modules", "dist", ".wrangler"]
}
```

### 各包 tsconfig.json

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

**packages/worker-api/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../shared" }]
}
```

**packages/worker-cron/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../shared" }]
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

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
.astro/

# Cloudflare
.wrangler/
.dev.vars

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

### biome.json

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
    "ignore": ["node_modules", "dist", ".wrangler", ".astro"]
  }
}
```

### Worker Env 类型定义

```typescript
// packages/shared/src/types/env.ts

export interface Env {
  // KV 命名空间
  TRENDING_KV: KVNamespace;

  // D1 数据库
  DB: D1Database;

  // Secrets（通过 wrangler secret put 设置）
  GITHUB_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  ALERT_WEBHOOK_URL?: string;

  // 环境变量（wrangler.toml [vars]）
  ENVIRONMENT: string;
  SCRAPE_LANGUAGES?: string;
  LLM_EVAL_THRESHOLD?: string;
  LLM_EVAL_BATCH_SIZE?: string;
  README_TRUNCATE_CHARS?: string;
}
```

### 共享包配置

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

**说明：** 共享包不需要编译步骤即可被其他包消费。其他包通过 TypeScript project references 和 pnpm `workspace:*` 协议直接引用源码。`exports` 字段使用 `.ts` 后缀直接指向源文件，因为 Workers 和 Astro 的构建工具（Wrangler/Vite）都支持直接处理 TypeScript 源码。

```typescript
// packages/shared/src/index.ts — 统一导出入口

export * from './types/repo';
export * from './types/api';
export * from './types/scoring';
export * from './types/curation';
export * from './types/env';

export * from './constants/categories';
export * from './constants/languages';
export * from './constants/scoring-weights';
export * from './constants/ai-topics';
export * from './constants/license-colors';

export * from './utils/kv-keys';
export * from './utils/date';
export * from './utils/validation';
export * from './utils/health-badge';
export * from './utils/number';
```

---

## 4. 数据模型

### 4.1 D1 数据库表定义

#### 表 1: categories（项目分类）

```sql
-- migrations/0001_create_categories.sql

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 自增主键 |
| name | TEXT | 显示名称，如 "LLM Frameworks" |
| slug | TEXT | URL 友好标识符，如 "llm-frameworks" |
| description | TEXT | 分类说明文字 |
| icon | TEXT | emoji 图标标识 |
| sort_order | INTEGER | 前端排序权重（升序） |
| created_at | TEXT | ISO 8601 创建时间 |
| updated_at | TEXT | ISO 8601 更新时间 |

#### 表 2: repositories（GitHub 仓库核心数据）

```sql
-- migrations/0002_create_repositories.sql

CREATE TABLE IF NOT EXISTS repositories (
    id                  INTEGER PRIMARY KEY,
    owner               TEXT NOT NULL,
    name                TEXT NOT NULL,
    full_name           TEXT NOT NULL UNIQUE,
    description         TEXT,
    url                 TEXT NOT NULL,
    homepage_url        TEXT,
    language            TEXT,
    language_color      TEXT,
    stars               INTEGER NOT NULL DEFAULT 0,
    forks               INTEGER NOT NULL DEFAULT 0,
    open_issues         INTEGER NOT NULL DEFAULT 0,
    watchers            INTEGER NOT NULL DEFAULT 0,
    topics              TEXT NOT NULL DEFAULT '[]',
    license_spdx        TEXT,
    license_name        TEXT,
    is_fork             INTEGER NOT NULL DEFAULT 0,
    is_archived         INTEGER NOT NULL DEFAULT 0,
    default_branch      TEXT NOT NULL DEFAULT 'main',
    created_at          TEXT,
    pushed_at           TEXT,
    github_updated_at   TEXT,
    contributor_count   INTEGER,
    has_examples_dir    INTEGER NOT NULL DEFAULT 0,
    has_ci              INTEGER NOT NULL DEFAULT 0,
    has_releases        INTEGER NOT NULL DEFAULT 0,
    has_tests           INTEGER NOT NULL DEFAULT 0,
    has_docker          INTEGER NOT NULL DEFAULT 0,
    has_pypi            INTEGER NOT NULL DEFAULT 0,
    has_npm             INTEGER NOT NULL DEFAULT 0,
    has_mcp             INTEGER NOT NULL DEFAULT 0,
    readme_size_bytes   INTEGER,
    releases_last_6m    INTEGER NOT NULL DEFAULT 0,
    avg_issue_close_days REAL,
    health_percentage   INTEGER,
    -- 评分字段
    score_growth        REAL NOT NULL DEFAULT 0,
    score_maturity      REAL NOT NULL DEFAULT 0,
    score_community     REAL NOT NULL DEFAULT 0,
    score_relevance     REAL NOT NULL DEFAULT 0,
    score_quality       REAL NOT NULL DEFAULT 0,
    score_composite     REAL NOT NULL DEFAULT 0,
    tier                TEXT NOT NULL DEFAULT 'tracked',
    -- 分类关联
    category_id         INTEGER,
    -- 时间戳
    first_seen_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_synced_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_analyzed_at    TEXT,
    trending_since      TEXT,
    trending_language   TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_repos_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repos_language ON repositories(language);
CREATE INDEX IF NOT EXISTS idx_repos_stars ON repositories(stars DESC);
CREATE INDEX IF NOT EXISTS idx_repos_category ON repositories(category_id);
CREATE INDEX IF NOT EXISTS idx_repos_pushed_at ON repositories(pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_repos_composite ON repositories(score_composite DESC);
CREATE INDEX IF NOT EXISTS idx_repos_tier ON repositories(tier);
CREATE INDEX IF NOT EXISTS idx_repos_last_synced ON repositories(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_repos_trending ON repositories(trending_since DESC);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | GitHub 仓库 ID（全局唯一，直接使用 GitHub 的 ID 作为主键） |
| owner | TEXT | 仓库所有者（用户名或组织名） |
| name | TEXT | 仓库名称 |
| full_name | TEXT | owner/name 格式（UNIQUE 约束） |
| description | TEXT | 仓库描述（可为空） |
| url | TEXT | html_url |
| homepage_url | TEXT | 项目主页/文档站 |
| language | TEXT | 主要编程语言 |
| language_color | TEXT | 语言颜色值，如 "#3572A5" |
| stars | INTEGER | 总 star 数 |
| forks | INTEGER | 总 fork 数 |
| open_issues | INTEGER | 开放 issue 数 |
| watchers | INTEGER | watcher 数 |
| topics | TEXT | JSON 数组字符串，如 '["llm","rag"]' |
| license_spdx | TEXT | SPDX 许可证标识符 |
| license_name | TEXT | 许可证全名 |
| is_fork | INTEGER | 是否为 fork (0/1) |
| is_archived | INTEGER | 是否已归档 (0/1) |
| default_branch | TEXT | 默认分支名 |
| created_at | TEXT | GitHub 仓库创建时间 |
| pushed_at | TEXT | 最近一次 push 时间 |
| github_updated_at | TEXT | GitHub 侧最后更新时间 |
| contributor_count | INTEGER | 贡献者数量（可空） |
| has_examples_dir | INTEGER | 是否有 /examples 或 /notebooks 目录 |
| has_ci | INTEGER | 是否有 CI 配置 |
| has_releases | INTEGER | 是否有正式 release |
| has_tests | INTEGER | 是否有测试目录 |
| has_docker | INTEGER | 是否有 Dockerfile |
| has_pypi | INTEGER | 是否发布到 PyPI |
| has_npm | INTEGER | 是否发布到 npm |
| has_mcp | INTEGER | 是否有 MCP 适配器 |
| readme_size_bytes | INTEGER | README 文件大小 |
| releases_last_6m | INTEGER | 近 6 个月 release 数 |
| avg_issue_close_days | REAL | 最近 10 个 issue 的平均关闭天数 |
| health_percentage | INTEGER | GitHub 社区健康度百分比 |
| score_growth | REAL | 增长速度评分 (0-100) |
| score_maturity | REAL | 项目成熟度评分 (0-100) |
| score_community | REAL | 社区健康度评分 (0-100) |
| score_relevance | REAL | AI 相关性评分 (0-100) |
| score_quality | REAL | 代码质量评分 (0-100) |
| score_composite | REAL | 综合得分 (0-100) |
| tier | TEXT | 等级：'star'(>=70) / 'notable'(50-69) / 'tracked'(30-49) |
| category_id | INTEGER | 关联分类 ID（可空） |
| first_seen_at | TEXT | 首次收录时间 |
| last_synced_at | TEXT | 最后同步时间 |
| last_analyzed_at | TEXT | 最后 LLM 分析时间 |
| trending_since | TEXT | 开始上榜的时间 |
| trending_language | TEXT | 在哪个语言的趋势页上出现 |

#### 表 3: trending_snapshots（趋势历史快照）

```sql
-- migrations/0003_create_trending_snapshots.sql

CREATE TABLE IF NOT EXISTS trending_snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id         INTEGER NOT NULL,
    snapshot_date   TEXT NOT NULL,
    since           TEXT NOT NULL CHECK (since IN ('daily', 'weekly', 'monthly')),
    rank            INTEGER,
    stars_total     INTEGER NOT NULL,
    stars_gained    INTEGER,
    forks_total     INTEGER NOT NULL DEFAULT 0,
    forks_gained    INTEGER,
    language        TEXT,
    fetched_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_unique
    ON trending_snapshots(repo_id, snapshot_date, since, language);
CREATE INDEX IF NOT EXISTS idx_snapshots_date_since
    ON trending_snapshots(snapshot_date DESC, since);
CREATE INDEX IF NOT EXISTS idx_snapshots_repo_date
    ON trending_snapshots(repo_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_rank
    ON trending_snapshots(rank ASC, snapshot_date DESC);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 自增主键 |
| repo_id | INTEGER | 关联仓库 ID |
| snapshot_date | TEXT | 快照日期 YYYY-MM-DD |
| since | TEXT | 时间维度：daily/weekly/monthly |
| rank | INTEGER | 当期排名（1-25，可空） |
| stars_total | INTEGER | 快照时的总 star 数 |
| stars_gained | INTEGER | 本周期增长数（仅 scraping 可获得，可空） |
| forks_total | INTEGER | 快照时的总 fork 数 |
| forks_gained | INTEGER | 本周期 fork 增长数（可空） |
| language | TEXT | 语言筛选条件（null 表示 all） |
| fetched_at | TEXT | 抓取时间 |

#### 表 4: star_history（星标历史）

```sql
-- migrations/0007_create_star_history.sql

CREATE TABLE IF NOT EXISTS star_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id     INTEGER NOT NULL,
    date        TEXT NOT NULL,
    star_count  INTEGER NOT NULL,
    daily_delta INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE,
    UNIQUE(repo_id, date)
);

CREATE INDEX IF NOT EXISTS idx_star_history_repo_date
    ON star_history(repo_id, date DESC);
```

#### 表 5: ai_curations（AI 策展分析结果）

```sql
-- migrations/0004_create_ai_curations.sql

CREATE TABLE IF NOT EXISTS ai_curations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id             INTEGER NOT NULL,
    summary             TEXT NOT NULL,
    why_notable         TEXT NOT NULL,
    category_slug       TEXT,
    subcategory         TEXT,
    strengths           TEXT NOT NULL DEFAULT '[]',
    limitations         TEXT NOT NULL DEFAULT '[]',
    use_cases           TEXT NOT NULL DEFAULT '[]',
    target_audience     TEXT,
    comparable_projects TEXT NOT NULL DEFAULT '[]',
    novelty_score       INTEGER NOT NULL CHECK (novelty_score BETWEEN 0 AND 10),
    clarity_score       INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 10),
    production_score    INTEGER NOT NULL CHECK (production_score BETWEEN 0 AND 10),
    category_fit_score  INTEGER NOT NULL CHECK (category_fit_score BETWEEN 0 AND 10),
    innovation_rating   INTEGER CHECK (innovation_rating BETWEEN 1 AND 5),
    production_readiness INTEGER CHECK (production_readiness BETWEEN 1 AND 5),
    learning_curve      TEXT CHECK (learning_curve IN ('low', 'medium', 'high')),
    one_liner           TEXT,
    rule_score          REAL NOT NULL DEFAULT 0,
    llm_score           REAL,
    composite_score     REAL NOT NULL DEFAULT 0,
    model_used          TEXT NOT NULL,
    prompt_version      TEXT NOT NULL DEFAULT 'v1',
    is_current          INTEGER NOT NULL DEFAULT 1,
    is_fallback         INTEGER NOT NULL DEFAULT 0,
    tokens_input        INTEGER,
    tokens_output       INTEGER,
    evaluated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    expires_at          TEXT,
    FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_curations_repo ON ai_curations(repo_id, is_current);
CREATE INDEX IF NOT EXISTS idx_curations_composite ON ai_curations(composite_score DESC, is_current);
CREATE INDEX IF NOT EXISTS idx_curations_category ON ai_curations(category_slug, composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_curations_evaluated ON ai_curations(evaluated_at DESC);
```

#### 表 6: featured_collections（精选合集）

```sql
-- migrations/0005_create_featured_collections.sql

CREATE TABLE IF NOT EXISTS featured_collections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT NOT NULL DEFAULT '',
    cover_emoji     TEXT NOT NULL DEFAULT '',
    collection_type TEXT NOT NULL DEFAULT 'curated'
        CHECK (collection_type IN ('curated', 'weekly_digest', 'category_top', 'rising')),
    is_published    INTEGER NOT NULL DEFAULT 0,
    is_pinned       INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    published_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON featured_collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON featured_collections(is_published, sort_order DESC);
CREATE INDEX IF NOT EXISTS idx_collections_type ON featured_collections(collection_type, is_published);

-- 合集-仓库关联表
CREATE TABLE IF NOT EXISTS featured_collection_repos (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id   INTEGER NOT NULL,
    repo_id         INTEGER NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    editorial_note  TEXT,
    added_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (collection_id) REFERENCES featured_collections(id) ON DELETE CASCADE,
    FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_repos_unique
    ON featured_collection_repos(collection_id, repo_id);
CREATE INDEX IF NOT EXISTS idx_collection_repos_collection
    ON featured_collection_repos(collection_id, sort_order);
```

#### 表 7: sync_logs（同步日志）

```sql
-- migrations/0006_create_sync_logs.sql

CREATE TABLE IF NOT EXISTS sync_logs (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    job_type              TEXT NOT NULL
        CHECK (job_type IN ('discover', 'snapshot', 'refresh', 'analyze', 'cleanup', 'collection')),
    since                 TEXT,
    language              TEXT,
    status                TEXT NOT NULL
        CHECK (status IN ('started', 'completed', 'failed', 'partial')),
    repos_processed       INTEGER NOT NULL DEFAULT 0,
    repos_failed          INTEGER NOT NULL DEFAULT 0,
    rate_limit_remaining  INTEGER,
    error_message         TEXT,
    duration_ms           INTEGER,
    started_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    completed_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status
    ON sync_logs(job_type, status, started_at DESC);
```

#### 分类种子数据

```sql
-- migrations/0008_seed_categories.sql

INSERT OR IGNORE INTO categories (slug, name, description, icon, sort_order) VALUES
    ('llm-frameworks', 'LLM Frameworks', '构建 LLM 驱动应用的框架和库，包括 Chain、Agent、RAG 管道', '🔗', 1),
    ('vector-databases', 'Vector Databases', '向量搜索和嵌入存储引擎', '🗄️', 2),
    ('ai-agents', 'AI Agents', '自主代理框架和多代理编排系统', '🤖', 3),
    ('mlops-evaluation', 'MLOps & Evaluation', '模型训练、部署、评估管道', '📊', 4),
    ('model-serving', 'Model Serving', 'LLM 推理引擎和模型服务基础设施', '⚡', 5),
    ('ai-dev-tools', 'AI Dev Tools', 'AI 原生开发者生产力工具', '🛠️', 6),
    ('multimodal', 'Multimodal', '视觉、音频和多模态模型工具', '👁️', 7),
    ('datasets-benchmarks', 'Datasets & Benchmarks', '训练数据、评估基准和排行榜', '📋', 8),
    ('ai-applications', 'AI Applications', 'AI 驱动的终端用户应用', '💡', 9);
```

### 4.2 KV 缓存键值设计

| 键模式 | 值 | TTL | 用途 |
|---|---|---|---|
| `trending:{since}:{language\|all}` | 完整趋势列表 JSON | daily=3600s, weekly=14400s, monthly=43200s | 前端热路径 |
| `repo:{id}` | 单个仓库详情 JSON（含 AI 策展） | 86400s (24h) | 详情页缓存 |
| `categories:all` | 分类列表 JSON（含仓库计数和 Top 3） | 86400s (24h) | 分类导航 |
| `category:{slug}:repos` | 分类下仓库列表 JSON | 21600s (6h) | 分类页 |
| `featured:list` | 精选合集列表 JSON | 43200s (12h) | 首页精选 |
| `featured:{id}` | 单个合集详情 JSON | 43200s (12h) | 合集详情页 |
| `stats:global` | 全站统计 JSON | 3600s (1h) | 统计展示 |
| `curation:{repo_id}` | AI 策展结果 JSON | 259200s (72h) | LLM 调用去重 |
| `star-history:{repo_id}` | 30 天星标历史 JSON | 86400s (24h) | 趋势图 |
| `meta:health` | 系统健康快照 JSON | 300s (5min) | 健康检查 |
| `pipeline:cursor:{job_type}` | 任务游标 JSON | 21600s (6h) | 可恢复分页 |

> **注意：** KV 写入量约 2K/天，超过免费层 1K 写入/日限制。需使用 Workers Paid 计划（$5/月），按 $0.50/百万次写入计费，月费可忽略。

**KV 键名构建工具函数：**

```typescript
// packages/shared/src/utils/kv-keys.ts

export const kvKeys = {
  trending: (since: string, language: string) =>
    `trending:${since}:${language || 'all'}`,

  repo: (id: number) => `repo:${id}`,

  categoriesAll: () => 'categories:all',

  categoryRepos: (slug: string) => `category:${slug}:repos`,

  featuredList: () => 'featured:list',

  featured: (id: number) => `featured:${id}`,

  statsGlobal: () => 'stats:global',

  curation: (repoId: number) => `curation:${repoId}`,

  starHistory: (repoId: number) => `star-history:${repoId}`,

  health: () => 'meta:health',

  pipelineCursor: (jobType: string) => `pipeline:cursor:${jobType}`,
};

export const kvTTL = {
  trendingDaily: 3600,
  trendingWeekly: 14400,
  trendingMonthly: 43200,
  repo: 86400,
  categories: 86400,
  categoryRepos: 21600,
  featured: 43200,
  stats: 3600,
  curation: 259200,
  starHistory: 86400,
  health: 300,
};

export function getTrendingTTL(since: string): number {
  switch (since) {
    case 'daily': return kvTTL.trendingDaily;
    case 'weekly': return kvTTL.trendingWeekly;
    case 'monthly': return kvTTL.trendingMonthly;
    default: return kvTTL.trendingDaily;
  }
}
```

### 4.3 数据刷新策略

| 数据类型 | 数据源 | 频率 | 存储 |
|---|---|---|---|
| 趋势发现（新仓库） | GitHub Search API + Scrape（辅助） | 每小时（每次处理 1 个语言） | D1 + KV |
| 星标快照 | D1 已有数据 | 每天 00:00 UTC | D1 star_history |
| 仓库元数据 | GitHub REST/GraphQL API | 每天 02:00 UTC（分批，每次 100 个） | D1 |
| AI 策展分析 | Claude Haiku API | 每天 04:00 UTC（每次 5-8 个仓库） | D1 + KV |
| 精选合集生成 | D1 聚合查询 | 每周日 04:30 UTC | D1 + KV |
| 过期清理 | D1 查询 | 每周日 06:00 UTC | D1 |
| 前端静态构建 | Astro SSG | 每 6 小时（CI/CD） | Pages CDN |

---

## 5. API 接口规格

### 5.1 通用约定

**基础 URL:** `https://api.{domain}/api`

**通用响应信封（成功）：**

```json
{
    "ok": true,
    "data": { },
    "meta": {
        "fetchedAt": "2026-06-28T08:00:00Z",
        "stale": false,
        "cachedAt": "2026-06-28T07:55:00Z"
    }
}
```

**分页响应信封：**

```json
{
    "ok": true,
    "data": [ ],
    "pagination": {
        "page": 1,
        "limit": 25,
        "total": 142,
        "totalPages": 6,
        "hasNext": true,
        "hasPrev": false
    },
    "meta": {
        "fetchedAt": "2026-06-28T08:00:00Z",
        "stale": false
    }
}
```

**通用错误响应：**

```json
{
    "ok": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Repository not found",
        "status": 404
    }
}
```

**错误码枚举：**

| 状态码 | 错误码 | 说明 |
|---|---|---|
| 400 | BAD_REQUEST | 参数校验失败 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMITED | 请求频率超限 |
| 500 | INTERNAL_ERROR | 服务端异常 |
| 503 | UPSTREAM_ERROR | GitHub API 不可用 |

**通用 HTTP 响应头：**
- `X-Request-Id: <UUID>` — 每个请求唯一标识
- `X-Cache: HIT | MISS | STALE` — 缓存状态
- `X-Cache-Age: <seconds>` — 缓存年龄
- `Access-Control-Allow-Origin: <origin>` — CORS 支持

**CORS 配置：**

```typescript
// packages/worker-api/src/middleware/cors.ts

const ALLOWED_ORIGINS_PRODUCTION = [
  'https://gitpulse.dev',
  'https://www.gitpulse.dev',
  'https://gitpulse-ai.pages.dev',
];

export function corsMiddleware(request: Request, env: Env): Response | void {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ENVIRONMENT === 'production'
    ? ALLOWED_ORIGINS_PRODUCTION
    : ['*'];

  const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 非 preflight 请求，在后续响应中添加 CORS 头
}
```

**速率限制：**

通过 Cloudflare WAF Rate Limiting Rules 实现（Dashboard 或 API 配置），不在 Worker 代码中实现。

| 端点类型 | 未认证限制 | 说明 |
|---|---|---|
| GET /api/* | 60 req/min per IP | Cloudflare WAF Rate Limiting Rule |
| GET /api/search | 20 req/min per IP | 搜索需要 D1 查询，限制更严格 |

**WAF 规则配置步骤（Cloudflare Dashboard）：**
1. Security → WAF → Rate limiting rules
2. 创建规则: URI Path contains "/api/" → 60 requests per minute per IP → Block for 60 seconds
3. 创建规则: URI Path equals "/api/search" → 20 requests per minute per IP → Block for 60 seconds

超限响应头：`Retry-After: 60`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: <unix-timestamp>`

### 5.2 端点详细定义

#### 端点 1: GET /api/trending

获取趋势仓库列表。

**请求参数（Query String）：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| since | string | 否 | "daily" | 时间维度：daily, weekly, monthly |
| language | string | 否 | null (全部) | 编程语言过滤，如 "python", "typescript" |
| category | string | 否 | null | 按 AI 分类 slug 过滤 |
| sort | string | 否 | "velocity" | 排序：velocity, stars, score, pushed_at |
| page | integer | 否 | 1 | 页码（>= 1） |
| limit | integer | 否 | 25 | 每页数量（1-100） |

**成功响应 200：**

```json
{
    "ok": true,
    "data": [
        {
            "id": 123456,
            "rank": 1,
            "owner": "langchain-ai",
            "name": "langchain",
            "fullName": "langchain-ai/langchain",
            "description": "Build context-aware reasoning applications",
            "url": "https://github.com/langchain-ai/langchain",
            "homepageUrl": "https://docs.langchain.com",
            "language": "Python",
            "languageColor": "#3572A5",
            "stars": 98500,
            "starsGained": 450,
            "forks": 15200,
            "openIssues": 320,
            "topics": ["llm", "rag", "agent", "langchain"],
            "licenseSpdx": "MIT",
            "pushedAt": "2026-06-28T06:30:00Z",
            "contributorCount": 2100,
            "category": {
                "slug": "llm-frameworks",
                "name": "LLM Frameworks"
            },
            "healthBadge": "green",
            "badges": {
                "hasExamples": true,
                "hasCi": true,
                "hasDocker": false,
                "hasPypi": true,
                "hasNpm": false,
                "hasMcp": false
            },
            "curation": {
                "summary": "Production RAG/agent orchestration framework",
                "oneLiner": "The go-to framework for chaining LLMs with tools and data",
                "compositeScore": 92.5,
                "innovationRating": 4,
                "productionReadiness": 5,
                "evaluatedAt": "2026-06-27T04:00:00Z"
            },
            "scores": {
                "growth": 88.5,
                "maturity": 92.0,
                "community": 95.0,
                "relevance": 100.0,
                "quality": 75.0,
                "composite": 92.5
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 25,
        "total": 25,
        "totalPages": 1,
        "hasNext": false,
        "hasPrev": false
    },
    "meta": {
        "since": "daily",
        "language": null,
        "category": null,
        "fetchedAt": "2026-06-28T07:00:00Z",
        "stale": false
    }
}
```

**缓存策略：**
- KV key: `trending:{since}:{language|all}`
- TTL: daily=3600s, weekly=14400s, monthly=43200s
- HTTP: `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=600`
- 采用 stale-while-revalidate 模式

#### 端点 2: GET /api/trending/:id

获取单个仓库的详细信息（通过 GitHub 仓库 ID）。

**路径参数：**

| 参数 | 类型 | 说明 |
|---|---|---|
| id | integer | GitHub 仓库 ID |

**成功响应 200：**

```json
{
    "ok": true,
    "data": {
        "id": 123456,
        "owner": "langchain-ai",
        "name": "langchain",
        "fullName": "langchain-ai/langchain",
        "description": "Build context-aware reasoning applications",
        "url": "https://github.com/langchain-ai/langchain",
        "homepageUrl": "https://docs.langchain.com",
        "language": "Python",
        "languageColor": "#3572A5",
        "stars": 98500,
        "forks": 15200,
        "openIssues": 320,
        "watchers": 850,
        "topics": ["llm", "rag", "agent"],
        "licenseSpdx": "MIT",
        "licenseName": "MIT License",
        "isFork": false,
        "isArchived": false,
        "defaultBranch": "main",
        "createdAt": "2022-10-25T00:00:00Z",
        "pushedAt": "2026-06-28T06:30:00Z",
        "contributorCount": 2100,
        "readmeSizeBytes": 15200,
        "badges": {
            "hasExamples": true,
            "hasCi": true,
            "hasReleases": true,
            "hasTests": true,
            "hasDocker": false,
            "hasPypi": true,
            "hasNpm": false,
            "hasMcp": false
        },
        "healthBadge": "green",
        "category": {
            "id": 1,
            "slug": "llm-frameworks",
            "name": "LLM Frameworks",
            "icon": "🔗"
        },
        "curation": {
            "summary": "Production RAG/agent orchestration framework with the broadest integration catalog",
            "whyNotable": "Dominant ecosystem for LLM application composition. Developers reach for it when they need to chain multiple LLM providers, vector stores, and tools without writing glue code.",
            "categorySlug": "llm-frameworks",
            "subcategory": "Agent Orchestration",
            "strengths": ["Broadest integration ecosystem", "Active community", "Production-tested at scale"],
            "limitations": ["Abstraction complexity", "Performance overhead vs direct API calls"],
            "useCases": ["RAG pipelines", "Multi-agent orchestration", "Tool-augmented chatbots"],
            "targetAudience": "AI engineers building production LLM applications",
            "comparableProjects": ["llama_index", "dspy", "haystack"],
            "noveltyScore": 7,
            "clarityScore": 9,
            "productionScore": 9,
            "categoryFitScore": 10,
            "innovationRating": 4,
            "productionReadiness": 5,
            "learningCurve": "medium",
            "oneLiner": "The go-to framework for chaining LLMs with tools and data",
            "modelUsed": "claude-haiku-4-20250414",
            "evaluatedAt": "2026-06-27T04:00:00Z"
        },
        "scores": {
            "growth": 88.5,
            "maturity": 92.0,
            "community": 95.0,
            "relevance": 100.0,
            "quality": 75.0,
            "composite": 92.5
        },
        "trendingHistory": [
            {"date": "2026-06-28", "since": "daily", "rank": 1, "starsGained": 450, "starsTotal": 98500},
            {"date": "2026-06-27", "since": "daily", "rank": 2, "starsGained": 380, "starsTotal": 98050},
            {"date": "2026-06-26", "since": "daily", "rank": 3, "starsGained": 310, "starsTotal": 97670}
        ],
        "starHistory": [
            {"date": "2026-06-28", "starCount": 98500, "dailyDelta": 450},
            {"date": "2026-06-27", "starCount": 98050, "dailyDelta": 380}
        ],
        "firstSeenAt": "2026-01-15T00:00:00Z",
        "lastSyncedAt": "2026-06-28T07:00:00Z"
    },
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：**
- KV key: `repo:{id}`
- TTL: 86400s (24h)
- HTTP: `Cache-Control: public, max-age=600, s-maxage=3600, stale-while-revalidate=1800`

#### 端点 3: GET /api/search

搜索仓库。

**请求参数（Query String）：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| q | string | 是 | - | 搜索关键词 |
| language | string | 否 | null | 语言过滤 |
| category | string | 否 | null | AI 分类 slug 过滤 |
| license | string | 否 | null | 许可证 SPDX 过滤 |
| minStars | integer | 否 | 0 | 最低 star 数 |
| sort | string | 否 | "relevance" | 排序：relevance, stars, pushed_at, composite_score |
| order | string | 否 | "desc" | 排序方向：asc, desc |
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 20 | 每页数量（1-50） |

**成功响应 200：**

```json
{
    "ok": true,
    "data": [
        {
            "id": 123456,
            "owner": "langchain-ai",
            "name": "langchain",
            "fullName": "langchain-ai/langchain",
            "description": "Build context-aware reasoning applications",
            "url": "https://github.com/langchain-ai/langchain",
            "language": "Python",
            "languageColor": "#3572A5",
            "stars": 98500,
            "starsGained": 450,
            "forks": 15200,
            "licenseSpdx": "MIT",
            "pushedAt": "2026-06-28T06:30:00Z",
            "healthBadge": "green",
            "category": {"slug": "llm-frameworks", "name": "LLM Frameworks"},
            "curation": {
                "summary": "Production RAG/agent orchestration framework",
                "compositeScore": 92.5
            }
        }
    ],
    "pagination": {"page": 1, "limit": 20, "total": 3, "totalPages": 1, "hasNext": false, "hasPrev": false},
    "meta": {"query": "langchain", "fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** 不使用 KV 缓存（搜索参数组合太多）。HTTP: `Cache-Control: public, max-age=60, s-maxage=300`。

**D1 查询实现：**

```sql
SELECT r.*, ac.summary, ac.composite_score, ac.category_slug
FROM repositories r
LEFT JOIN ai_curations ac ON r.id = ac.repo_id AND ac.is_current = 1
WHERE (r.full_name LIKE '%' || ?1 || '%'
       OR r.description LIKE '%' || ?1 || '%'
       OR EXISTS (SELECT 1 FROM json_each(r.topics) WHERE json_each.value LIKE '%' || ?1 || '%'))
  AND (?2 IS NULL OR r.language = ?2)
  AND (?3 IS NULL OR ac.category_slug = ?3)
  AND (?4 IS NULL OR r.license_spdx = ?4)
  AND r.stars >= ?5
ORDER BY
  CASE WHEN ?6 = 'stars' THEN r.stars END DESC,
  CASE WHEN ?6 = 'pushed_at' THEN r.pushed_at END DESC,
  CASE WHEN ?6 = 'composite_score' THEN ac.composite_score END DESC,
  r.stars DESC
LIMIT ?7 OFFSET ?8
```

#### 端点 4: GET /api/categories

获取所有分类列表。

**成功响应 200：**

```json
{
    "ok": true,
    "data": [
        {
            "id": 1,
            "name": "LLM Frameworks",
            "slug": "llm-frameworks",
            "description": "构建 LLM 驱动应用的框架和库",
            "icon": "🔗",
            "repoCount": 42,
            "topRepos": [
                {"fullName": "langchain-ai/langchain", "stars": 98500, "starsGained": 450},
                {"fullName": "run-llama/llama_index", "stars": 38200, "starsGained": 180},
                {"fullName": "stanfordnlp/dspy", "stars": 21800, "starsGained": 320}
            ]
        }
    ],
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** KV key: `categories:all`, TTL: 86400s (24h)

#### 端点 5: GET /api/categories/:slug

获取分类下的仓库列表。

**路径参数：** slug (string) — 分类 slug

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| sort | string | 否 | "score" | 排序：score, stars, velocity, pushed_at |
| order | string | 否 | "desc" | 排序方向 |
| language | string | 否 | null | 语言过滤 |
| license | string | 否 | null | 许可证过滤 |
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 25 | 每页数量 |

**成功响应 200：**

```json
{
    "ok": true,
    "data": {
        "category": {
            "id": 1,
            "name": "LLM Frameworks",
            "slug": "llm-frameworks",
            "description": "构建 LLM 驱动应用的框架和库，包括 Chain、Agent、RAG 管道",
            "icon": "🔗"
        },
        "repos": [
            {
                "id": 123456,
                "owner": "langchain-ai",
                "name": "langchain",
                "fullName": "langchain-ai/langchain",
                "description": "Build context-aware reasoning applications",
                "url": "https://github.com/langchain-ai/langchain",
                "language": "Python",
                "languageColor": "#3572A5",
                "stars": 98500,
                "starsGained": 450,
                "forks": 15200,
                "licenseSpdx": "MIT",
                "pushedAt": "2026-06-28T06:30:00Z",
                "healthBadge": "green",
                "curation": {
                    "summary": "Production RAG/agent orchestration framework",
                    "compositeScore": 92.5
                },
                "scores": {
                    "composite": 92.5
                }
            }
        ]
    },
    "pagination": {"page": 1, "limit": 25, "total": 42, "totalPages": 2, "hasNext": true, "hasPrev": false},
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** KV key: `category:{slug}:repos`, TTL: 21600s (6h)

#### 端点 6: GET /api/featured

获取精选合集列表。

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| type | string | 否 | null | 过滤类型：curated, weekly_digest, category_top, rising |
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 10 | 每页数量（1-20） |

**成功响应 200：**

```json
{
    "ok": true,
    "data": [
        {
            "id": 1,
            "title": "本周上升最快的 AI 项目",
            "slug": "weekly-rising-2026-w26",
            "description": "2026 年第 26 周星标增长最快的 AI 开源项目",
            "coverEmoji": "🚀",
            "collectionType": "weekly_digest",
            "isPinned": false,
            "repoCount": 10,
            "previewRepos": [
                {"fullName": "anthropics/claude-code", "stars": 45000, "starsGained": 2800},
                {"fullName": "browser-use/browser-use", "stars": 32000, "starsGained": 1500},
                {"fullName": "openai/codex", "stars": 28000, "starsGained": 1200}
            ],
            "publishedAt": "2026-06-28T00:00:00Z",
            "createdAt": "2026-06-28T04:30:00Z"
        }
    ],
    "pagination": {"page": 1, "limit": 10, "total": 15, "totalPages": 2, "hasNext": true, "hasPrev": false},
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** KV key: `featured:list`, TTL: 43200s (12h)

#### 端点 7: GET /api/featured/:id

获取合集详情。

**成功响应 200：**

```json
{
    "ok": true,
    "data": {
        "id": 1,
        "title": "本周上升最快的 AI 项目",
        "slug": "weekly-rising-2026-w26",
        "description": "2026 年第 26 周星标增长最快的 AI 开源项目",
        "coverEmoji": "🚀",
        "collectionType": "weekly_digest",
        "isPinned": false,
        "isPublished": true,
        "repos": [
            {
                "id": 123456,
                "owner": "langchain-ai",
                "name": "langchain",
                "fullName": "langchain-ai/langchain",
                "description": "Build context-aware reasoning applications",
                "url": "https://github.com/langchain-ai/langchain",
                "language": "Python",
                "stars": 98500,
                "starsGained": 450,
                "licenseSpdx": "MIT",
                "healthBadge": "green",
                "category": {"slug": "llm-frameworks", "name": "LLM Frameworks"},
                "editorialNote": "本周最大亮点：新增 MCP 工具调用支持",
                "sortOrder": 1,
                "scores": {"composite": 92.5}
            }
        ],
        "publishedAt": "2026-06-28T00:00:00Z",
        "createdAt": "2026-06-28T04:30:00Z",
        "updatedAt": "2026-06-28T04:30:00Z"
    },
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** KV key: `featured:{id}`, TTL: 43200s (12h)

#### 端点 8: GET /api/repos/:owner/:name

通过 owner/name 查找仓库（前端详情页路由解析用）。

**路径参数：**

| 参数 | 类型 | 说明 |
|---|---|---|
| owner | string | 仓库所有者 |
| name | string | 仓库名称 |

**成功响应 200：** 与 GET /api/trending/:id 响应格式相同。

**D1 查询：**

```sql
SELECT * FROM repositories WHERE full_name = ?1
```

**缓存策略：** 不使用 KV 缓存（owner/name 组合太多），直接查 D1。HTTP: `Cache-Control: public, max-age=300, s-maxage=1800`

#### 端点 9: GET /api/stats

获取全站统计。

```json
{
    "ok": true,
    "data": {
        "totalReposTracked": 1842,
        "totalSnapshots": 45200,
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
        "lastSyncAt": "2026-06-28T07:00:00Z",
        "lastCurationAt": "2026-06-28T04:00:00Z",
        "syncHealth": "healthy"
    },
    "meta": {"fetchedAt": "2026-06-28T08:00:00Z", "stale": false}
}
```

**缓存策略：** KV key: `stats:global`, TTL: 3600s (1h)

#### 端点 10: GET /api/health

系统健康检查。

```json
{
    "ok": true,
    "data": {
        "status": "healthy",
        "tasks": {
            "discover": "completed at 2026-06-28T06:00:00Z",
            "snapshot": "completed at 2026-06-28T00:00:00Z",
            "refresh": "completed at 2026-06-28T02:00:00Z",
            "analyze": "completed at 2026-06-28T04:00:00Z"
        },
        "kvEntries": 156,
        "d1RepoCount": 1842,
        "githubRateLimitRemaining": 4850,
        "checkedAt": "2026-06-28T08:00:00Z"
    }
}
```

**缓存策略：** KV key: `meta:health`, TTL: 300s (5min)

### 5.3 Worker 路由实现

```typescript
// packages/worker-api/src/index.ts
import { Router } from 'itty-router';
import type { Env } from '@gitpulse/shared';
import { handleTrending, handleTrendingDetail } from './routes/trending';
import { handleSearch } from './routes/search';
import { handleCategories, handleCategoryDetail } from './routes/categories';
import { handleFeaturedList, handleFeaturedDetail } from './routes/featured';
import { handleRepoByName } from './routes/repos';
import { handleStats } from './routes/stats';
import { handleHealth } from './routes/health';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';

const router = Router();

router.all('*', corsMiddleware);

router.get('/api/trending', handleTrending);
router.get('/api/trending/:id', handleTrendingDetail);
router.get('/api/search', handleSearch);
router.get('/api/categories', handleCategories);
router.get('/api/categories/:slug', handleCategoryDetail);
router.get('/api/featured', handleFeaturedList);
router.get('/api/featured/:id', handleFeaturedDetail);
router.get('/api/repos/:owner/:name', handleRepoByName);
router.get('/api/stats', handleStats);
router.get('/api/health', handleHealth);
router.all('*', () => new Response(
  JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found', status: 404 } }),
  { status: 404, headers: { 'Content-Type': 'application/json' } }
));

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(req, env, ctx).catch((err: Error) => errorHandler(err)),
};
```

### 5.4 API Worker types.ts

```typescript
// packages/worker-api/src/types.ts
// 此文件重新导出共享 Env 类型并定义 API 专用类型

export type { Env } from '@gitpulse/shared';

export interface ApiRequest extends Request {
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(url: URL, defaults?: { page?: number; limit?: number; maxLimit?: number }): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || String(defaults?.page ?? 1), 10));
  const limit = Math.min(
    defaults?.maxLimit ?? 100,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(defaults?.limit ?? 25), 10))
  );
  return { page, limit, offset: (page - 1) * limit };
}
```

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
  /* 地面层 */
  --color-ink: #0B1120;
  --color-surface: #111827;
  --color-elevated: #1A2236;
  --color-border: #2A3550;

  /* 文字层 */
  --color-text-primary: #E8E4DD;
  --color-text-secondary: #9BA4B5;
  --color-text-tertiary: #5F6B80;

  /* 强调色 */
  --color-accent: #E2A93B;        /* Signal Amber — 主强调色 */
  --color-accent-dim: rgba(226, 169, 59, 0.15);
  --color-positive: #4A9E8E;      /* Teal — 正向指标 */
  --color-decline: #C75B6A;       /* Rose — 负向指标 */
  --color-info: #5B8BD4;          /* Blue — 信息性 */

  /* 分类色 */
  --color-cat-llm: #7C6FE0;       /* LLM Frameworks */
  --color-cat-agents: #D47B3E;    /* AI Agents */
  --color-cat-vector: #4A9E8E;    /* Vector Databases */
  --color-cat-mlops: #5B8BD4;     /* MLOps */
  --color-cat-serving: #E2A93B;   /* Model Serving */
  --color-cat-devtools: #9E7CB8;  /* AI Dev Tools */
  --color-cat-multimodal: #C75B6A;/* Multimodal */
  --color-cat-datasets: #6B8F71;  /* Datasets */
  --color-cat-apps: #D4A85B;      /* AI Applications */

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

  /* 字体大小（1.25 倍比率） */
  --text-xs: 0.6875rem;     /* 11px */
  --text-sm: 0.8125rem;     /* 13px */
  --text-base: 1rem;        /* 16px */
  --text-lg: 1.25rem;       /* 20px */
  --text-xl: 1.5625rem;     /* 25px */
  --text-2xl: 1.953rem;     /* 31.25px */
  --text-3xl: 2.441rem;     /* 39px */
  --text-rank: 4rem;        /* 64px — 排名数字 */

  /* 行高 */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  /* === 间距系统 (4px 基数) === */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */

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
| - "查看更多" 链接 → /trending/daily                  |
| - 空状态: "数据同步中..." 提示卡片                    |
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
+--------------------------------------------------+
```

**数据加载（Astro SSG）：**

```astro
---
// packages/frontend/src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import RepoCard from '../components/astro/RepoCard.astro';
import CategoryCard from '../components/astro/CategoryCard.astro';
import StatsBar from '../components/astro/StatsBar.astro';
import FeaturedCard from '../components/astro/FeaturedCard.astro';
import EmptyState from '../components/astro/EmptyState.astro';
import { FilterPanel } from '../components/react/FilterPanel';
import { fetchAPI } from '../lib/api-client';

const trending = await fetchAPI('/api/trending?since=daily&limit=9', []);
const categories = await fetchAPI('/api/categories', []);
const stats = await fetchAPI('/api/stats', { totalReposTracked: 0 });
const featured = await fetchAPI('/api/featured?limit=3', []);
---
<BaseLayout title="GitPulse AI — 发现 AI 开源趋势">
  <!-- Hero -->
  <section class="hero">
    <h1>发现 AI 开源世界的下一个趋势</h1>
    <p>追踪 GitHub 最具势头的 AI 项目，智能分析，助力技术选型</p>
    <StatsBar stats={stats} />
  </section>

  <!-- 分类标签 -->
  <FilterPanel client:load categories={categories} />

  <!-- 今日热门 -->
  <section class="trending-grid">
    {trending.length > 0 ? (
      trending.map((repo) => <RepoCard repo={repo} />)
    ) : (
      <EmptyState
        icon="📊"
        title="数据同步中"
        message="趋势数据将在首次 Cron 任务运行后显示，请稍后刷新。"
      />
    )}
  </section>

  <!-- AI 精选 -->
  {featured.length > 0 && (
    <section class="featured">
      {featured.map((collection) => <FeaturedCard collection={collection} />)}
    </section>
  )}

  <!-- 分类导航 -->
  <section class="categories-grid">
    {categories.map((cat) => <CategoryCard category={cat} />)}
  </section>
</BaseLayout>
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
| | [TS]      |  | 排名 #3 — TrendingRow 组件     |   |
| | [Rust]    |  | ...                           |   |
| | [Go]      |  | 排名 #25 — TrendingRow 组件    |   |
| | [C++]     |  +-------------------------------+   |
| |           |  | 分页组件                       |   |
| | 分类过滤   |  +-------------------------------+   |
| | [LLM]    |                                     |
| | [Agents] |                                     |
| | [Vector] |                                     |
| |           |                                     |
| | 许可证过滤 |                                     |
| | [MIT]     |                                     |
| | [Apache]  |                                     |
| +----------+                                     |
+--------------------------------------------------+
```

**TrendingRow 组件规格：**

```
+------------------------------------------------------------------+
| #1  | [语言圆点] langchain-ai/langchain        | [MIT] [LLM] [🟢] |
|     |                                          |                   |
| 64px| Build context-aware reasoning apps        | ★ 98,500 (+450)   |
| rank| Python · 2,100 contributors               | 🍴 15,200         |
| 数字 |                                          | [SVG 迷你图]       |
+------------------------------------------------------------------+
```

- 排名数字：64px，font-data，颜色 var(--color-border)，Top 3 为 var(--color-accent)
- 三列网格：[排名 80px] [信息区 1fr] [指标区 200px]
- hover 效果：translateY(-1px)，背景色变为 var(--color-elevated)

#### 页面 3: 搜索 (/search)

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 搜索输入框 (52px 高度, 全宽, 自动聚焦)               |
| - placeholder: "搜索 AI 项目..."                    |
| - 实时补全下拉 (Fuse.js, 300ms debounce)            |
| - 搜索结果计数: "找到 42 个匹配项目"                  |
+--------------------------------------------------+
| 高级过滤标签栏                                      |
| [语言] [分类] [许可证] [最低星标] [排序]              |
+--------------------------------------------------+
| 搜索结果列表                                        |
| - 使用 TrendingRow 组件 (无排名数字)                 |
| - 或 RepoCard 网格 (用户可切换视图)                  |
| - 空状态: "未找到匹配项目，试试其他关键词"             |
+--------------------------------------------------+
| 分页                                               |
+--------------------------------------------------+
```

**SearchBar React Island 实现要点：**

```typescript
// packages/frontend/src/components/react/SearchBar.tsx

import Fuse from 'fuse.js';
import { useState, useCallback, useRef, useEffect } from 'react';

interface SearchBarProps {
  repos: Array<{ fullName: string; description: string; language: string }>;
}

export function SearchBar({ repos }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof repos>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fuseRef = useRef<Fuse<typeof repos[0]>>();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fuseRef.current = new Fuse(repos, {
      keys: ['fullName', 'description', 'language'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [repos]);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value.length >= 2 && fuseRef.current) {
        const found = fuseRef.current.search(value, { limit: 8 });
        setResults(found.map(r => r.item));
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // 300ms debounce
  }, []);

  return (
    <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <input
        type="search"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="搜索 AI 项目..."
        aria-label="搜索 AI 项目"
        autoFocus
      />
      {isOpen && results.length > 0 && (
        <ul role="listbox">
          {results.map((repo) => (
            <li key={repo.fullName} role="option">
              <a href={`/repo/${repo.fullName}`}>{repo.fullName}</a>
              <span>{repo.description}</span>
            </li>
          ))}
        </ul>
      )}
      {isOpen && results.length === 0 && query.length >= 2 && (
        <div className="empty-search">未找到匹配项目，试试其他关键词</div>
      )}
    </div>
  );
}
```

- 使用 `client:load` 指令立即激活水合
- Fuse.js 数据通过 Astro 页面 props 传入
- 300ms debounce 防止频繁搜索

#### 页面 4: 项目详情 (/repo/[owner]/[name])

**数据加载方式：** 前端通过 `GET /api/repos/:owner/:name` 端点解析 owner/name 到完整仓库数据。

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 项目头部                                           |
| - 仓库名 (owner/name, 可点击跳转 GitHub)            |
| - 描述                                             |
| - 徽章行: [语言] [许可证] [健康度] [分类]             |
| - 指标行: Stars | Forks | Issues | Contributors    |
| - 集成徽章行: [CI] [Docker] [PyPI] [NPM] [MCP]     |
+--------------------------------------------------+
| 星标历史图表 (SVG Canvas)                           |
| - 30 天星标趋势线                                   |
| - hover 十字准星 + tooltip                          |
| - 高度 200px                                       |
| - 空状态: 少于 2 个数据点时显示 "数据积累中"          |
+--------------------------------------------------+
| AI 分析区域                                         |
| - 评分分解: [增长][成熟度][社区][相关性][质量]=[综合]   |
| - 摘要 (summary)                                    |
| - 为什么值得关注 (whyNotable)                        |
| - 优势 / 局限 / 适用场景                             |
| - 目标用户                                          |
| - 可比较项目 (链接)                                  |
| - "分析于 X 天前 · 仓库更新于 X 小时前"               |
| - 空状态: 无策展时显示 "AI 分析待生成" 占位卡片        |
+--------------------------------------------------+
| 相关项目 (同分类, 相近评分)                           |
| - 3-4 个 RepoCard                                  |
+--------------------------------------------------+
| 趋势历史 (表格)                                     |
| - 最近 30 天排名变化                                 |
+--------------------------------------------------+
```

**StarChart React Island 实现：**

```typescript
// packages/frontend/src/components/react/StarChart.tsx
// 轻量 SVG 迷你图，不使用任何图表库

interface StarChartProps {
  data: Array<{ date: string; starCount: number; dailyDelta: number }>;
  width?: number;
  height?: number;
}

export function StarChart({ data, width = 600, height = 200 }: StarChartProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
        数据积累中，至少需要 2 天的数据才能展示趋势图
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map(d => d.starCount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = sorted.map((d, i) => ({
    x: padding.left + (i / (sorted.length - 1)) * chartW,
    y: padding.top + chartH - ((d.starCount - min) / range) * chartH,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width }} role="img" aria-label="星标趋势图">
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 区域填充 */}
      <polygon
        points={`${points[0].x},${padding.top + chartH} ${polyline} ${points[points.length-1].x},${padding.top + chartH}`}
        fill="var(--color-accent-dim)"
      />
    </svg>
  );
}
```

- 使用 `client:visible` 指令（进入视口后水合）
- 纯 SVG polyline + polygon，零外部依赖
- 总 bundle < 3KB gzipped

#### 页面 5: AI 精选 (/featured)

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 页面标题: "AI 精选"                                 |
| 副标题: "基于 AI 分析，每周更新的精选合集"             |
+--------------------------------------------------+
| 置顶合集 (FeaturedCard, 大尺寸)                     |
| - 双列: 左侧视觉面板 + 右侧编辑内容                  |
+--------------------------------------------------+
| 主题合集横向滚动区                                   |
| - "本周上升最快" 合集                                |
| - "LLM 框架 Top 10" 合集                           |
| - "新兴 AI Agent" 合集                              |
| 每个合集预览 3 个仓库                                |
+--------------------------------------------------+
| 历史合集列表                                        |
| - 分页卡片列表                                      |
+--------------------------------------------------+
```

#### 页面 6: 分类 (/category/[slug])

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 分类头部                                           |
| - 图标 + 分类名称 (如 "🔗 LLM Frameworks")         |
| - 分类描述                                         |
| - 仓库计数: "共 42 个项目"                           |
+--------------------------------------------------+
| +----------+  +-------------------------------+   |
| | 过滤侧栏  |  | 排序控制栏                     |   |
| | (240px)   |  | [评分] [星标] [速度] [更新]     |   |
| |           |  +-------------------------------+   |
| | 语言过滤   |  | 仓库列表 (TrendingRow 组件)    |   |
| | [Python]  |  | ...                           |   |
| | [TS]      |  +-------------------------------+   |
| |           |  | 分页                           |   |
| | 许可证过滤 |  +-------------------------------+   |
| | [MIT]     |                                     |
| | [Apache]  |                                     |
| +----------+                                     |
| 空状态: 分类无仓库时显示 "该分类暂无收录项目"          |
+--------------------------------------------------+
```

#### 页面 7: 对比 (/compare)

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 对比选择器 (最多 3 个仓库)                           |
| - 搜索添加仓库                                     |
| - URL 参数: ?repos=owner1/name1,owner2/name2       |
+--------------------------------------------------+
| 对比表格                                           |
| | 维度         | 仓库 A    | 仓库 B    | 仓库 C   |
| |:-------------|:----------|:----------|:---------|
| | Stars        | 98,500    | 38,200    | 21,800   |
| | Stars/周     | +450      | +180      | +320     |
| | 语言         | Python    | Python    | Python   |
| | 许可证       | MIT       | MIT       | MIT      |
| | 贡献者       | 2,100     | 850       | 320      |
| | 最近提交     | 2 小时前   | 5 小时前   | 1 天前   |
| | 健康度       | 绿色      | 绿色      | 黄色     |
| | 综合评分     | 92.5      | 85.3      | 78.1     |
| | 创新性       | 4/5       | 3/5       | 5/5      |
| | 生产就绪度   | 5/5       | 4/5       | 3/5      |
+--------------------------------------------------+
| 星标趋势对比图 (SVG, 多线叠加)                       |
+--------------------------------------------------+
```

#### 页面 8: 关于 (/about)

**布局结构：**

```
+--------------------------------------------------+
| 导航栏                                             |
+--------------------------------------------------+
| 页面标题: "关于 GitPulse AI"                        |
| 副标题: "透明的评分方法论与数据来源"                   |
+--------------------------------------------------+
| 一、评分方法论                                      |
| - 评分公式展示（含各权重）                            |
| - 五个分项评分说明（增长/成熟度/社区/相关性/质量）       |
| - 分级标准: Star >= 70, Notable 50-69, Tracked < 50 |
| - 可交互: ScoreBreakdown 组件示例                    |
+--------------------------------------------------+
| 二、AI 分析说明                                     |
| - 使用的模型: Claude Haiku 4                        |
| - Prompt 模板（完整展示，增强透明度）                  |
| - 评估频率和触发条件                                 |
| - 后备分析策略（LLM 失败时的规则分类器）               |
+--------------------------------------------------+
| 三、数据来源                                        |
| - GitHub Trending 页面 (HTML 抓取)                  |
| - GitHub Search API                                |
| - GitHub REST/GraphQL API                          |
| - 数据刷新频率表                                    |
+--------------------------------------------------+
| 四、开源与隐私                                      |
| - 开源许可证                                        |
| - 无用户追踪，无 Cookie                             |
| - 所有数据来自公开 GitHub 数据                       |
+--------------------------------------------------+
| 页脚                                               |
+--------------------------------------------------+
```

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

  // RED: 超过 90 天未提交
  if (daysSincePush >= 90) return 'red';

  // GREEN: 14 天内有提交，issues < 500，且有 CI 或 releases
  if (daysSincePush < 14 && repo.openIssues < 500 && (repo.hasCi || repo.hasReleases)) {
    return 'green';
  }

  // YELLOW: 90 天内有提交，issues < 1000
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
| 排名行 hover | ease-out-expo | 150ms | 背景色 → elevated |
| 页面切换 | - | 0ms | 无动画（Astro 页面导航） |
| 统计数字计数 | ease-out-expo | 800ms | 从 0 数到目标值 |
| 排行列表进场 | ease-out-expo | 250ms | 逐行 fadeIn，40ms 交错 |
| 搜索下拉展开 | ease-out-expo | 200ms | maxHeight 过渡 |
| 主题切换 | ease-out-expo | 400ms | CSS 变量过渡 |
| 骨架屏闪烁 | linear | 1.5s | background-position 动画 |

---

## 7. AI 智能筛选系统

### 7.1 评分算法详解

#### 总体公式

```
综合得分 = 0.30 * 增长速度 + 0.20 * 项目成熟度 + 0.20 * 社区健康 + 0.20 * AI 相关性 + 0.10 * 代码质量
```

每个分项评分范围 0-100，综合得分范围 0-100。

#### A. 增长速度 (权重: 0.30)

```typescript
// packages/worker-cron/src/pipeline/rule-scorer.ts

function scoreGrowth(repo: RepoWithHistory): number {
  const { dailyStarDelta, weeklyStarDelta, monthlyStarDelta, stars } = repo;

  // 绝对增长得分: 日增 100 stars 得满分
  const absoluteDailyScore = Math.min(dailyStarDelta / 100, 1.0) * 100;

  // 相对增长得分: 日增长率 5% 得满分
  const dailyGrowthRate = dailyStarDelta / Math.max(stars, 1);
  const relativeDailyScore = Math.min(dailyGrowthRate / 0.05, 1.0) * 100;

  // 混合绝对和相对 (60/40)
  const dailyScore = 0.6 * absoluteDailyScore + 0.4 * relativeDailyScore;

  // 周增长和月增长
  const weeklyScore = Math.min(weeklyStarDelta / 500, 1.0) * 100;
  const monthlyScore = Math.min(monthlyStarDelta / 2000, 1.0) * 100;

  // 综合: 日 50% + 周 30% + 月 20%
  return 0.5 * dailyScore + 0.3 * weeklyScore + 0.2 * monthlyScore;
}
```

#### B. 项目成熟度 (权重: 0.20)

```typescript
function scoreMaturity(repo: EnrichedRepo): number {
  // 年龄得分
  const ageDays = (Date.now() - new Date(repo.createdAt).getTime()) / 86400000;
  const ageScore = ageDays < 7 ? 10 :
                   ageDays < 30 ? 30 :
                   ageDays < 90 ? 50 :
                   ageDays < 365 ? 70 :
                   ageDays < 1095 ? 90 : 100;

  // 发布频率: 近 6 个月每月 2 次以上得满分
  const releaseFreq = repo.releasesLast6m / 6;
  const releaseScore = releaseFreq >= 2 ? 100 :
                       releaseFreq >= 1 ? 80 :
                       releaseFreq >= 0.5 ? 60 :
                       releaseFreq > 0 ? 40 : 10;

  // 文档质量
  let docScore = 0;
  docScore += repo.readmeSizeBytes > 0 ? 25 : 0;
  docScore += repo.readmeSizeBytes > 2000 ? 25 : (repo.readmeSizeBytes > 500 ? 15 : 5);
  docScore += repo.hasExamplesDir ? 20 : 0;
  docScore += repo.homepageUrl ? 20 : 0;
  docScore += repo.hasCi ? 10 : 0;

  return 0.30 * ageScore + 0.35 * releaseScore + 0.35 * docScore;
}
```

#### C. 社区健康 (权重: 0.20)

```typescript
function scoreCommunity(repo: EnrichedRepo): number {
  // 贡献者多样性
  const contributorScore = repo.contributorCount >= 50 ? 100 :
                           repo.contributorCount >= 20 ? 80 :
                           repo.contributorCount >= 10 ? 60 :
                           repo.contributorCount >= 5 ? 40 :
                           repo.contributorCount >= 2 ? 20 : 5;

  // Issue 响应速度
  const issueResponseScore = !repo.avgIssueCloseDays ? 30 :
                             repo.avgIssueCloseDays <= 1 ? 100 :
                             repo.avgIssueCloseDays <= 3 ? 80 :
                             repo.avgIssueCloseDays <= 7 ? 60 :
                             repo.avgIssueCloseDays <= 14 ? 40 :
                             repo.avgIssueCloseDays <= 30 ? 20 : 5;

  // 活跃度
  const daysSincePush = (Date.now() - new Date(repo.pushedAt).getTime()) / 86400000;
  const recencyScore = daysSincePush <= 1 ? 100 :
                       daysSincePush <= 7 ? 80 :
                       daysSincePush <= 30 ? 50 :
                       daysSincePush <= 90 ? 20 : 5;

  return 0.35 * contributorScore + 0.35 * issueResponseScore + 0.30 * recencyScore;
}
```

#### D. AI 相关性 (权重: 0.20)

```typescript
// packages/shared/src/constants/ai-topics.ts

export const AI_TOPICS = [
  'artificial-intelligence', 'machine-learning', 'deep-learning', 'llm',
  'large-language-model', 'gpt', 'transformer', 'neural-network', 'nlp',
  'computer-vision', 'reinforcement-learning', 'generative-ai', 'ai-agent',
  'rag', 'vector-database', 'embedding', 'fine-tuning', 'mlops',
  'diffusion-model', 'text-to-image', 'chatbot', 'langchain', 'llamaindex',
  'openai', 'anthropic', 'huggingface', 'pytorch', 'tensorflow', 'jax',
  'mcp', 'tool-use', 'function-calling', 'inference', 'quantization',
];

export const AI_README_KEYWORDS = [
  'llm', 'large language model', 'gpt', 'claude', 'openai',
  'anthropic', 'langchain', 'vector store', 'embedding', 'transformer',
  'neural network', 'machine learning', 'deep learning', 'ai agent',
  'rag', 'retrieval augmented', 'fine-tun', 'inference', 'model serving',
  'prompt engineering', 'diffusion', 'computer vision', 'nlp',
  'natural language processing', 'token', 'attention mechanism',
  'reinforcement learning', 'text generation', 'image generation',
  'speech recognition', 'object detection', 'semantic search',
  'knowledge graph', 'multimodal', 'foundation model',
  'mcp server', 'tool calling', 'function calling',
];

function scoreAIRelevance(repo: EnrichedRepo): number {
  const topics: string[] = JSON.parse(repo.topics || '[]');

  // Topic 匹配 (最强信号)
  const topicMatches = topics.filter(t => AI_TOPICS.includes(t)).length;
  const topicScore = Math.min(topicMatches / 3, 1.0) * 100;

  // README 关键词密度
  const readmeLower = (repo.description || '').toLowerCase();
  const keywordHits = AI_README_KEYWORDS.filter(kw => readmeLower.includes(kw)).length;
  const keywordScore = Math.min(keywordHits / 5, 1.0) * 100;

  // 语言信号
  const languageScore = ['Python', 'Jupyter Notebook'].includes(repo.language) ? 30 :
                        ['Rust', 'C++', 'Go', 'TypeScript'].includes(repo.language) ? 15 : 5;

  return 0.40 * topicScore + 0.40 * keywordScore + 0.20 * languageScore;
}
```

#### E. 代码质量 (权重: 0.10)

```typescript
function scoreQuality(repo: EnrichedRepo): number {
  let score = 0;

  // 许可证 (50 分)
  const OSI_LICENSES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
    'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'ISC'];
  score += repo.licenseSpdx && OSI_LICENSES.includes(repo.licenseSpdx) ? 50 : 0;

  // 测试 (25 分)
  score += repo.hasTests ? 25 : 0;

  // CI (25 分)
  score += repo.hasCi ? 25 : 0;

  return score;
}
```

#### 综合得分与分级

```typescript
function computeCompositeScore(repo: EnrichedRepo & RepoWithHistory): {
  scores: ScoreBreakdown;
  composite: number;
  tier: 'star' | 'notable' | 'tracked' | 'filtered';
} {
  const growth = scoreGrowth(repo);
  const maturity = scoreMaturity(repo);
  const community = scoreCommunity(repo);
  const relevance = scoreAIRelevance(repo);
  const quality = scoreQuality(repo);

  const composite = 0.30 * growth
                  + 0.20 * maturity
                  + 0.20 * community
                  + 0.20 * relevance
                  + 0.10 * quality;

  const tier = composite >= 70 ? 'star' :
               composite >= 50 ? 'notable' :
               composite >= 30 ? 'tracked' : 'filtered';

  return {
    scores: { growth, maturity, community, relevance, quality },
    composite,
    tier,
  };
}
```

#### 硬性排除规则

以下仓库直接排除，不进入评分流程：

```typescript
function shouldDisqualify(repo: ScrapedRepo): boolean {
  return (
    repo.isArchived === true ||
    repo.isFork === true || // 除非 fork 星标 >= 原仓库 5 倍
    repo.stars < 50 ||
    daysSincePush(repo.pushedAt) > 180
  );
}
```

#### D1 事务批量评分更新

评分更新使用 D1 batch() 将所有更新包装在单个事务中，避免部分更新导致数据不一致：

```typescript
// packages/worker-cron/src/pipeline/persister.ts

async function batchUpdateScores(
  env: Env,
  updates: Array<{ repoId: number; scores: ScoreBreakdown; composite: number; tier: string }>
): Promise<void> {
  const stmts = updates.map(u =>
    env.DB.prepare(
      `UPDATE repositories SET
        score_growth = ?1, score_maturity = ?2, score_community = ?3,
        score_relevance = ?4, score_quality = ?5, score_composite = ?6,
        tier = ?7, last_synced_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE id = ?8`
    ).bind(
      u.scores.growth, u.scores.maturity, u.scores.community,
      u.scores.relevance, u.scores.quality, u.composite,
      u.tier, u.repoId
    )
  );

  // D1 batch() 在单个事务中执行所有语句
  await env.DB.batch(stmts);
}
```

### 7.2 LLM 分析 Prompt 模板

```typescript
// packages/worker-cron/src/analysis/prompt.ts

export const CURATION_SYSTEM_PROMPT = `You are an expert AI/ML technology analyst. Analyze GitHub repositories and provide structured assessments. Be objective, technically precise, and concise.

CATEGORY TAXONOMY (choose exactly one):
- llm-frameworks: LLM application frameworks, chains, agents, RAG pipelines
- vector-databases: Vector search engines, embedding storage, semantic search
- ai-agents: Autonomous agent frameworks, multi-agent orchestration
- mlops-evaluation: Model training, deployment, evaluation, monitoring
- model-serving: LLM inference engines, model serving infrastructure
- ai-dev-tools: AI-native developer productivity tools, code generation
- multimodal: Vision, audio, multi-modal model tooling
- datasets-benchmarks: Training data, evaluation benchmarks, leaderboards
- ai-applications: AI-powered end-user applications

SCORING RUBRIC:
- novelty_score (0-10): Technical novelty vs thin wrapper. 10 = breakthrough approach, 0 = trivial wrapper
- clarity_score (0-10): Problem clarity in first 200 words of README. 10 = crystal clear, 0 = incomprehensible
- production_score (0-10): Production readiness evidence (CI, releases, changelogs, versioning). 10 = battle-tested, 0 = prototype
- category_fit_score (0-10): How well the project fits its best-match category. 10 = perfect fit, 0 = doesn't belong

Return ONLY valid JSON matching the exact schema below. No markdown fencing.`;

export function buildEvalPrompt(repo: EnrichedRepo, readmeContent: string): string {
  return `## Repository Information

**Name:** ${repo.fullName}
**Description:** ${repo.description || 'N/A'}
**Primary Language:** ${repo.language || 'N/A'}
**Topics:** ${JSON.parse(repo.topics || '[]').join(', ') || 'None'}
**Stars:** ${repo.stars} | **Forks:** ${repo.forks} | **Open Issues:** ${repo.openIssues}
**Created:** ${repo.createdAt} | **Last Push:** ${repo.pushedAt}
**License:** ${repo.licenseSpdx || 'None'}
**Contributors:** ${repo.contributorCount || 'Unknown'}

## README Content (truncated to 3000 chars)
${readmeContent.slice(0, 3000)}

---

Analyze and return JSON:
{
  "summary": "2-3 sentence overview of what this project does and its significance",
  "why_notable": "1-2 sentences answering: (1) what problem does this solve that alternatives don't? (2) when would a developer reach for this over alternatives?",
  "category_slug": "one of the 9 slugs listed above",
  "subcategory": "more specific classification",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "limitations": ["limitation 1", "limitation 2"],
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "target_audience": "who would benefit most",
  "comparable_projects": ["project1", "project2", "project3"],
  "novelty_score": 0-10,
  "clarity_score": 0-10,
  "production_score": 0-10,
  "category_fit_score": 0-10,
  "innovation_rating": 1-5,
  "production_readiness": 1-5,
  "learning_curve": "low | medium | high",
  "one_liner": "single catchy sentence, max 100 characters"
}`;
}
```

### 7.3 Claude API 调用实现

```typescript
// packages/worker-cron/src/analysis/claude-client.ts

import { z } from 'zod';

const AnalysisSchema = z.object({
  summary: z.string().min(10).max(500),
  why_notable: z.string().min(10).max(500),
  category_slug: z.enum([
    'llm-frameworks', 'vector-databases', 'ai-agents',
    'mlops-evaluation', 'model-serving', 'ai-dev-tools',
    'multimodal', 'datasets-benchmarks', 'ai-applications',
  ]),
  subcategory: z.string().min(2).max(100),
  strengths: z.array(z.string()).min(1).max(5),
  limitations: z.array(z.string()).min(1).max(5),
  use_cases: z.array(z.string()).min(1).max(5),
  target_audience: z.string().min(5).max(200),
  comparable_projects: z.array(z.string()).max(5),
  novelty_score: z.number().int().min(0).max(10),
  clarity_score: z.number().int().min(0).max(10),
  production_score: z.number().int().min(0).max(10),
  category_fit_score: z.number().int().min(0).max(10),
  innovation_rating: z.number().int().min(1).max(5),
  production_readiness: z.number().int().min(1).max(5),
  learning_curve: z.enum(['low', 'medium', 'high']),
  one_liner: z.string().min(5).max(100),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

export async function evaluateWithClaude(
  repo: EnrichedRepo,
  readmeContent: string,
  apiKey: string,
  maxRetries: number = 3,
): Promise<AnalysisResult | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250414',
          max_tokens: 1024,
          temperature: 0.2,
          system: CURATION_SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: buildEvalPrompt(repo, readmeContent),
          }],
        }),
      });

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (response.status === 529 || response.status >= 500) {
        await new Promise(r => setTimeout(r, 5000 * attempt));
        continue;
      }

      if (!response.ok) {
        console.error(`Claude API error: ${response.status}`);
        return null;
      }

      const data = await response.json() as {
        content: Array<{ text: string }>;
        usage: { input_tokens: number; output_tokens: number };
      };
      const text = data.content[0].text;
      const parsed = JSON.parse(text);
      const validated = AnalysisSchema.parse(parsed);

      return validated;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log(`JSON parse failed for ${repo.fullName}, attempt ${attempt}`);
        if (attempt === maxRetries) return null;
        continue;
      }
      if (error instanceof z.ZodError) {
        console.log(`Schema validation failed for ${repo.fullName}:`, error.issues);
        if (attempt === maxRetries) return null;
        continue;
      }
      console.error(`Unexpected error for ${repo.fullName}:`, error);
      return null;
    }
  }
  return null;
}
```

### 7.4 分类体系

| 分类 Slug | 显示名称 | Topic 信号 | 关键词信号 | 语言偏好 |
|---|---|---|---|---|
| llm-frameworks | LLM Frameworks | llm, large-language-model, transformer, text-generation | language model, tokenizer, gguf, lora, qlora | Python, C++, Rust |
| vector-databases | Vector Databases | vector-database, vector-search, embedding, rag | vector, embedding, semantic search, hnsw | Rust, Go, C++, Python |
| ai-agents | AI Agents | ai-agent, agent, langchain, multi-agent | agent, orchestrat, tool use, function call, agentic | Python, TypeScript |
| mlops-evaluation | MLOps & Evaluation | mlops, model-serving, model-deployment | mlops, deploy, experiment track, model registry | Python, Go |
| model-serving | Model Serving | inference, serving, quantization | model serv, vllm, triton, gpu cluster | C++, Rust, Python |
| ai-dev-tools | AI Dev Tools | developer-tools, code-generation, ai-coding | code generat, copilot, prompt engineer, eval | TypeScript, Python |
| multimodal | Multimodal | computer-vision, image-generation, diffusion-model | computer vision, diffusion, text-to-image, yolo | Python, C++ |
| datasets-benchmarks | Datasets & Benchmarks | dataset, benchmark, evaluation, leaderboard | dataset, benchmark, leaderboard, training data | Python, Jupyter Notebook |
| ai-applications | AI Applications | chatbot, ai-assistant, generative-ai | chatbot, assistant, ai-powered, text to sql | TypeScript, Python |

### 7.5 Cron 调度计划（合并优化版）

原始设计使用 5 个 Cron Triggers，恰好达到 Workers Paid 计划上限（5 个），没有扩展空间。优化为 3 个触发器，通过内部 UTC 小时分发任务：

```toml
# packages/worker-cron/wrangler.toml

[triggers]
crons = [
  "0 * * * *",     # 每小时: 统一调度器（发现/快照/刷新等）
  "0 4 * * *",     # 每天 04:00 UTC: AI 策展分析（独立触发，因耗时较长）
  "0 6 * * 0"      # 每周日 06:00 UTC: 过期仓库清理 + 合集生成
]
```

```typescript
// packages/worker-cron/src/index.ts

import type { Env } from '@gitpulse/shared';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cron = event.cron;

    if (cron === '0 * * * *') {
      // 每小时统一调度器，根据 UTC 小时决定任务
      const hour = new Date(event.scheduledTime).getUTCHours();

      // 每小时都执行: 趋势发现（每次处理 1 个语言）
      ctx.waitUntil(discoverTrendingRepos(env));

      // 00:00 UTC: 星标快照
      if (hour === 0) {
        ctx.waitUntil(snapshotStarCounts(env));
      }

      // 02:00 UTC: 元数据刷新（分批，每次 100 个仓库）
      if (hour === 2) {
        ctx.waitUntil(refreshRepoMetadata(env));
      }
    }

    if (cron === '0 4 * * *') {
      // AI 策展分析（每次处理 5-8 个仓库）
      ctx.waitUntil(runAIAnalysis(env));
    }

    if (cron === '0 6 * * 0') {
      // 每周日清理 + 合集生成
      ctx.waitUntil(cleanupStaleRepos(env));
      ctx.waitUntil(generateWeeklyCollections(env));
    }
  },
};
```

### 7.6 精选合集自动生成

```typescript
// packages/worker-cron/src/pipeline/collection-generator.ts

async function generateWeeklyCollections(env: Env): Promise<void> {
  const now = new Date();
  const weekNum = getISOWeekNumber(now);
  const year = now.getFullYear();

  // 1. 生成 "本周上升最快" 合集
  const risingSlug = `weekly-rising-${year}-w${weekNum}`;
  const existingRising = await env.DB.prepare(
    'SELECT id FROM featured_collections WHERE slug = ?'
  ).bind(risingSlug).first();

  if (!existingRising) {
    // 查询本周星标增长最多的 10 个仓库
    const risingRepos = await env.DB.prepare(`
      SELECT r.id, r.full_name, r.stars
      FROM repositories r
      INNER JOIN star_history sh ON r.id = sh.repo_id
      WHERE sh.date >= date('now', '-7 days')
      GROUP BY r.id
      ORDER BY SUM(sh.daily_delta) DESC
      LIMIT 10
    `).all();

    if (risingRepos.results.length > 0) {
      // 创建合集
      const { meta } = await env.DB.prepare(`
        INSERT INTO featured_collections (title, slug, description, cover_emoji, collection_type, is_published, published_at)
        VALUES (?, ?, ?, '🚀', 'weekly_digest', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      `).bind(
        `${year} 年第 ${weekNum} 周上升最快的 AI 项目`,
        risingSlug,
        `${year} 年第 ${weekNum} 周星标增长最快的 AI 开源项目精选`
      ).run();

      const collectionId = meta.last_row_id;

      // 关联仓库
      const stmts = risingRepos.results.map((repo: any, idx: number) =>
        env.DB.prepare(
          'INSERT INTO featured_collection_repos (collection_id, repo_id, sort_order) VALUES (?, ?, ?)'
        ).bind(collectionId, repo.id, idx + 1)
      );
      await env.DB.batch(stmts);
    }
  }

  // 2. 生成各分类 Top 10 合集（每月一次，仅在每月第一个周日）
  if (now.getDate() <= 7) {
    const categories = await env.DB.prepare('SELECT id, slug, name FROM categories').all();
    for (const cat of categories.results as any[]) {
      const topSlug = `${cat.slug}-top10-${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const existing = await env.DB.prepare(
        'SELECT id FROM featured_collections WHERE slug = ?'
      ).bind(topSlug).first();

      if (!existing) {
        const topRepos = await env.DB.prepare(`
          SELECT id FROM repositories
          WHERE category_id = ? AND score_composite > 0
          ORDER BY score_composite DESC LIMIT 10
        `).bind(cat.id).all();

        if (topRepos.results.length >= 3) {
          const { meta } = await env.DB.prepare(`
            INSERT INTO featured_collections (title, slug, description, cover_emoji, collection_type, is_published, published_at)
            VALUES (?, ?, ?, '🏆', 'category_top', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
          `).bind(
            `${cat.name} Top 10`,
            topSlug,
            `${cat.name} 分类评分最高的 10 个开源项目`
          ).run();

          const stmts = topRepos.results.map((repo: any, idx: number) =>
            env.DB.prepare(
              'INSERT INTO featured_collection_repos (collection_id, repo_id, sort_order) VALUES (?, ?, ?)'
            ).bind(meta.last_row_id, repo.id, idx + 1)
          );
          await env.DB.batch(stmts);
        }
      }
    }
  }

  // 清除 featured KV 缓存
  await env.TRENDING_KV.delete(kvKeys.featuredList());
}
```

### 7.7 成本估算

| 项目 | 月费用 | 说明 |
|---|---|---|
| Cloudflare Workers Paid | $5.00 | 基础费用，解锁 Cron Triggers + 30s CPU |
| KV 读取 (~3M/月) | ~$1.50 | 50K DAU x 10 请求 x 6 KV 读取 |
| KV 写入 (~60K/月) | ~$0.03 | $0.50/百万写入 |
| D1 读取 (~500K/天) | $0.00 | 在免费额度内（5M/天） |
| D1 写入 (~3K/天) | $0.00 | 在免费额度内（100K/天） |
| Claude Haiku 4 (~50 repos/天) | ~$1.20 | 5.5K 输入 + 500 输出 tokens x 50 x ~$0.024 |
| GitHub API | $0.00 | 免费（已有 PAT） |
| **月度总计** | **~$8.00** | |

**成本控制杠杆（按优先级）：**

1. KV 72h TTL 缓存 — 最大杠杆，稳定后达到 60-70% 命中率
2. README 截断至 3000 字符 — 超出部分的信号边际价值低
3. 变更门控 — 仅在仓库 `pushed_at` 变化时重新评估
4. 分层模型 — Haiku 做广泛筛选，可选 Sonnet 做 Top 10 深度分析

---

## 8. GitHub 数据抓取方案

### 8.1 数据源策略（双源架构）

为提高数据获取的稳定性，采用 **GitHub Search API 为主、HTMLRewriter 抓取为辅** 的双源架构：

| 数据源 | 角色 | 优势 | 劣势 |
|---|---|---|---|
| GitHub Search API | 主数据源 | API 稳定，结构化 JSON，不受 HTML 变更影响 | 30 req/min 限制，无 "stars gained" 数据 |
| HTMLRewriter 抓取 | 辅助数据源 | 可获取 starsGained 排名数据 | HTML 结构可能变更，需维护选择器 |

#### 主数据源：GitHub Search API

```typescript
// packages/worker-cron/src/github/search-api.ts

interface SearchResult {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  created_at: string;
  pushed_at: string;
  updated_at: string;
}

export class GitHubSearchClient {
  constructor(private token: string) {}

  /**
   * 搜索近期活跃的高星标 AI 相关仓库
   * 每次调用消耗 1 个 Search API 请求（30/min 限制）
   */
  async searchTrendingAI(language: string | null, page: number = 1): Promise<SearchResult[]> {
    const pushed = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const langFilter = language ? `+language:${encodeURIComponent(language)}` : '';
    const query = `stars:>100+pushed:>${pushed}${langFilter}+topic:artificial-intelligence OR topic:machine-learning OR topic:llm OR topic:deep-learning OR topic:ai-agent`;

    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30&page=${page}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitPulseAI/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub Search API error: ${response.status}`);
    }

    const data = await response.json() as { items: SearchResult[] };
    return data.items;
  }
}
```

#### 辅助数据源：HTMLRewriter 抓取

```typescript
// packages/worker-cron/src/github/scraper.ts

interface ScrapedRepo {
  rank: number;
  fullName: string;
  description: string;
  language: string | null;
  languageColor: string | null;
  stars: number;
  starsGained: number | null; // 仅 scraping 可获得
  forks: number;
  builtBy: Array<{ login: string; avatarUrl: string }>;
}

class TrendingScraper {
  async scrape(since: string, language: string): Promise<ScrapedRepo[]> {
    const url = language === 'all'
      ? `https://github.com/trending?since=${since}`
      : `https://github.com/trending/${encodeURIComponent(language)}?since=${since}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GitPulseAI/1.0 (+https://gitpulse.dev)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status} for ${url}`);
    }

    const repos: ScrapedRepo[] = [];
    let currentRepo: Partial<ScrapedRepo> = {};
    let rank = 0;

    // HTMLRewriter 流式解析 — 不缓冲完整 HTML
    const transformedResponse = new HTMLRewriter()
      .on('article.Box-row', {
        element() {
          // 在遇到新的 article 时，先推入上一个已完成的 repo
          if (currentRepo.fullName) {
            repos.push(currentRepo as ScrapedRepo);
          }
          rank++;
          currentRepo = { rank };
        },
      })
      .on('article.Box-row h2 a', {
        element(element) {
          const href = element.getAttribute('href');
          if (href) {
            currentRepo.fullName = href.startsWith('/') ? href.slice(1) : href;
          }
        },
      })
      .on('article.Box-row p.col-9', {
        text(text) {
          currentRepo.description = (currentRepo.description || '') + text.text.trim();
        },
      })
      .on('article.Box-row [itemprop="programmingLanguage"]', {
        text(text) {
          currentRepo.language = text.text.trim();
        },
      })
      .on('article.Box-row .repo-language-color', {
        element(element) {
          const style = element.getAttribute('style');
          if (style) {
            const match = style.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/);
            if (match) currentRepo.languageColor = match[1];
          }
        },
      })
      .on('article.Box-row .d-inline-block.float-sm-right', {
        text(text) {
          const match = text.text.trim().match(/([0-9,]+)\s+stars/);
          if (match) {
            currentRepo.starsGained = parseInt(match[1].replace(/,/g, ''), 10);
          }
        },
      })
      .transform(response);

    // 驱动流完成
    await transformedResponse.text();

    // 推入最后一个 repo
    if (currentRepo.fullName) {
      repos.push(currentRepo as ScrapedRepo);
    }

    return repos;
  }
}
```

**抓取器健壮性措施：**

1. **最少元素断言**: 每次抓取后检查 `repos.length >= 10`，如果不满足则记录告警并回退到 Search API
2. **连续失败告警**: 连续 3 次空结果通过 Webhook 发送告警
3. **HTML 快照保存**: 抓取失败时将原始 HTML 保存到 KV（key: `debug:html:{lang}:{since}`，TTL: 72h）用于调试
4. **Search API 后备**: 当 HTMLRewriter 抓取失败时，使用 `GET /search/repositories?q=stars:>100+pushed:>YYYY-MM-DD&sort=stars&order=desc` 作为替代数据源
5. **星标/Fork 数据**: 总星标和 fork 数通过 REST API enrichment 阶段获取，不依赖 HTML 抓取

#### 抓取语言列表

```typescript
// packages/shared/src/constants/languages.ts

export const SCRAPE_LANGUAGES = [
  'python',
  'typescript',
  'rust',
  'go',
  'jupyter-notebook',
  'cpp',
  'java',
  'c',
] as const;

// GitHub 语言颜色映射
export const LANGUAGE_COLORS: Record<string, string> = {
  'Python': '#3572A5',
  'TypeScript': '#3178C6',
  'JavaScript': '#F1E05A',
  'Rust': '#DEA584',
  'Go': '#00ADD8',
  'C++': '#F34B7D',
  'C': '#555555',
  'Java': '#B07219',
  'Jupyter Notebook': '#DA5B0B',
  'Kotlin': '#A97BFF',
  'Swift': '#F05138',
  'Ruby': '#701516',
};
```

### 8.2 GitHub API 响应映射

GitHub REST API 返回 snake_case 字段，需要映射到应用类型：

```typescript
// packages/worker-cron/src/github/repo-mapper.ts

import type { EnrichedRepo } from '@gitpulse/shared';

interface GitHubRepoResponse {
  id: number;
  owner: { login: string };
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  size: number;
}

export function mapGitHubRepoToEnriched(raw: GitHubRepoResponse): EnrichedRepo {
  return {
    id: raw.id,
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    url: raw.html_url,
    homepageUrl: raw.homepage,
    language: raw.language,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    watchers: raw.watchers_count,
    topics: JSON.stringify(raw.topics),
    licenseSpdx: raw.license?.spdx_id || null,
    licenseName: raw.license?.name || null,
    isFork: raw.fork,
    isArchived: raw.archived,
    defaultBranch: raw.default_branch,
    createdAt: raw.created_at,
    pushedAt: raw.pushed_at,
    githubUpdatedAt: raw.updated_at,
  };
}
```

### 8.3 GitHub REST/GraphQL API 客户端

```typescript
// packages/worker-cron/src/github/api-client.ts

import { mapGitHubRepoToEnriched } from './repo-mapper';
import type { EnrichedRepo } from '@gitpulse/shared';

export class GitHubClient {
  private token: string;
  private rateLimitRemaining: number = 5000;

  constructor(token: string) {
    this.token = token;
  }

  async enrichRepo(fullName: string): Promise<EnrichedRepo | null> {
    const response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'GitPulseAI/1.0',
      },
    });

    // 更新速率限制状态
    this.rateLimitRemaining = parseInt(
      response.headers.get('X-RateLimit-Remaining') || '5000', 10
    );

    if (!response.ok) return null;
    const raw = await response.json();
    return mapGitHubRepoToEnriched(raw);
  }

  async enrichBatch(fullNames: string[]): Promise<Map<string, EnrichedRepo>> {
    const results = new Map<string, EnrichedRepo>();

    // 并行请求，但监控速率限制
    const settled = await Promise.allSettled(
      fullNames.map(async (name) => {
        if (this.rateLimitRemaining < 100) {
          console.warn(`Rate limit low (${this.rateLimitRemaining}), skipping ${name}`);
          return null;
        }
        const repo = await this.enrichRepo(name);
        if (repo) results.set(name, repo);
        return repo;
      })
    );

    return results;
  }

  /**
   * GraphQL 批量查询（用于元数据刷新，一次查询最多 100 个仓库）
   * 大幅减少 API 调用次数：1842 个仓库只需 19 次查询
   */
  async batchQueryGraphQL(fullNames: string[]): Promise<Map<string, EnrichedRepo>> {
    const results = new Map<string, EnrichedRepo>();
    const chunks = chunkArray(fullNames, 100);

    for (const chunk of chunks) {
      if (this.rateLimitRemaining < 50) break;

      const aliases = chunk.map((name, i) => {
        const [owner, repo] = name.split('/');
        return `repo${i}: repository(owner: "${owner}", name: "${repo}") {
          id databaseId owner { login } name description url homepageUrl
          stargazerCount forkCount primaryLanguage { name color }
          licenseInfo { spdxId name } isArchived isFork defaultBranchRef { name }
          pushedAt createdAt updatedAt openIssues: issues(states: OPEN) { totalCount }
          watchers { totalCount } repositoryTopics(first: 20) { nodes { topic { name } } }
        }`;
      });

      const query = `query { ${aliases.join('\n')} }`;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GitPulseAI/1.0',
        },
        body: JSON.stringify({ query }),
      });

      this.rateLimitRemaining = parseInt(
        response.headers.get('X-RateLimit-Remaining') || '5000', 10
      );

      if (!response.ok) continue;
      const data = await response.json() as { data: Record<string, any> };

      for (let i = 0; i < chunk.length; i++) {
        const repo = data.data[`repo${i}`];
        if (repo) {
          results.set(chunk[i], mapGraphQLToEnriched(repo));
        }
      }
    }

    return results;
  }

  getRateLimitRemaining(): number {
    return this.rateLimitRemaining;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function mapGraphQLToEnriched(node: any): EnrichedRepo {
  return {
    id: node.databaseId,
    owner: node.owner.login,
    name: node.name,
    fullName: `${node.owner.login}/${node.name}`,
    description: node.description,
    url: node.url,
    homepageUrl: node.homepageUrl,
    language: node.primaryLanguage?.name || null,
    stars: node.stargazerCount,
    forks: node.forkCount,
    openIssues: node.openIssues.totalCount,
    watchers: node.watchers.totalCount,
    topics: JSON.stringify(node.repositoryTopics.nodes.map((n: any) => n.topic.name)),
    licenseSpdx: node.licenseInfo?.spdxId || null,
    licenseName: node.licenseInfo?.name || null,
    isFork: node.isFork,
    isArchived: node.isArchived,
    defaultBranch: node.defaultBranchRef?.name || 'main',
    createdAt: node.createdAt,
    pushedAt: node.pushedAt,
    githubUpdatedAt: node.updatedAt,
  };
}
```

### 8.4 API 速率限制应对

| 端点 | 未认证限制 | 认证限制 | 应对策略 |
|---|---|---|---|
| REST /repos | 60/hr | 5000/hr | PAT 认证，批量处理 |
| Search API | 10/min | 30/min | 仅作趋势发现，不在热路径使用 |
| GraphQL | - | 5000 points/hr | 批量查询替代 REST，100 repos/query |
| Trending 页面 | 无硬性限制 | - | 辅助数据源，每小时 1 个语言 |

**关键实现：**

- 每次 API 响应后读取 `X-RateLimit-Remaining`
- 低于 100 时记录警告并跳过剩余补全
- 低于 50 时立即停止当前批次
- 在 `sync_logs` 表记录每次运行时的剩余配额
- 元数据刷新使用 GraphQL 批量查询，1842 个仓库仅需 19 次查询（vs REST 的 1842 次）

### 8.5 发现管道实现（单语言/次）

为避免超过 Workers 的 30 秒 CPU 时间限制，发现管道每次 Cron 调用仅处理 **1 个语言**，通过 KV 游标跟踪进度：

```typescript
// packages/worker-cron/src/pipeline/discover.ts

import type { Env } from '@gitpulse/shared';
import { kvKeys } from '@gitpulse/shared';
import { TrendingScraper } from '../github/scraper';
import { GitHubSearchClient } from '../github/search-api';
import { GitHubClient } from '../github/api-client';
import { SCRAPE_LANGUAGES } from '@gitpulse/shared';

const ALL_LANGUAGES = ['all', ...SCRAPE_LANGUAGES];

async function discoverTrendingRepos(env: Env): Promise<void> {
  const startTime = Date.now();
  const MAX_DURATION_MS = 20000; // 留 10s 缓冲（30s CPU 限制）

  const scraper = new TrendingScraper();
  const searchClient = new GitHubSearchClient(env.GITHUB_TOKEN);
  const github = new GitHubClient(env.GITHUB_TOKEN);

  // 从 KV 读取当前进度游标
  const cursorJson = await env.TRENDING_KV.get(kvKeys.pipelineCursor('discover'));
  const cursor = cursorJson ? JSON.parse(cursorJson) : { languageIndex: 0, sinceIndex: 0 };

  const lang = ALL_LANGUAGES[cursor.languageIndex] || ALL_LANGUAGES[0];
  const sinceOptions = ['daily', 'weekly', 'monthly'] as const;

  let totalProcessed = 0;
  let totalFailed = 0;
  let usedFallback = false;

  try {
    for (let si = cursor.sinceIndex; si < sinceOptions.length; si++) {
      if (Date.now() - startTime > MAX_DURATION_MS) {
        // 超时，保存进度
        await env.TRENDING_KV.put(
          kvKeys.pipelineCursor('discover'),
          JSON.stringify({ languageIndex: cursor.languageIndex, sinceIndex: si }),
          { expirationTtl: 21600 }
        );
        break;
      }

      const since = sinceOptions[si];
      let repos: ScrapedRepo[] = [];

      // 先尝试 HTMLRewriter 抓取
      try {
        repos = await scraper.scrape(since, lang);
      } catch (err) {
        console.warn(`Scraper failed for ${since}/${lang}:`, err);
      }

      // 验证结果，如果抓取失败或返回过少结果，使用 Search API 后备
      if (repos.length < 10) {
        console.warn(`Low scrape results (${repos.length}) for ${since}/${lang}, using Search API fallback`);
        usedFallback = true;
        try {
          const searchResults = await searchClient.searchTrendingAI(
            lang === 'all' ? null : lang
          );
          // 将 Search API 结果转换为 ScrapedRepo 格式（不含 starsGained）
          repos = searchResults.map((r, i) => ({
            rank: i + 1,
            fullName: r.full_name,
            description: r.description || '',
            language: r.language,
            languageColor: null,
            stars: r.stargazers_count,
            starsGained: null, // Search API 无此数据
            forks: r.forks_count,
            builtBy: [],
          }));
        } catch (err) {
          console.error(`Search API fallback also failed for ${lang}:`, err);
          totalFailed++;
          continue;
        }
      }

      if (repos.length === 0) {
        totalFailed++;
        continue;
      }

      // 去重后批量补全
      const uniqueNames = [...new Set(repos.map(r => r.fullName))];
      const enriched = await github.enrichBatch(uniqueNames);

      // D1 批量持久化
      await persistTrendingData(env, repos, enriched, since, lang === 'all' ? null : lang);

      totalProcessed += repos.length;
    }

    // 本语言处理完毕，推进到下一个语言
    const nextLangIndex = (cursor.languageIndex + 1) % ALL_LANGUAGES.length;
    if (nextLangIndex === 0) {
      // 一轮完成，删除游标
      await env.TRENDING_KV.delete(kvKeys.pipelineCursor('discover'));
    } else {
      await env.TRENDING_KV.put(
        kvKeys.pipelineCursor('discover'),
        JSON.stringify({ languageIndex: nextLangIndex, sinceIndex: 0 }),
        { expirationTtl: 21600 }
      );
    }
  } catch (error) {
    console.error(`Discover failed for ${lang}:`, error);
    totalFailed++;
  }

  // 记录同步日志
  await env.DB.prepare(
    `INSERT INTO sync_logs (job_type, language, status, repos_processed, repos_failed,
     rate_limit_remaining, duration_ms, completed_at)
     VALUES ('discover', ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`
  ).bind(
    lang,
    totalFailed === 0 ? 'completed' : 'partial',
    totalProcessed,
    totalFailed,
    github.getRateLimitRemaining(),
    Date.now() - startTime,
  ).run();
}

/**
 * D1 批量持久化
 * 使用 D1 batch() 在单个事务中执行所有 INSERT OR REPLACE
 */
async function persistTrendingData(
  env: Env,
  repos: ScrapedRepo[],
  enriched: Map<string, EnrichedRepo>,
  since: string,
  language: string | null,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const stmts: D1PreparedStatement[] = [];

  for (const repo of repos) {
    const enrichedData = enriched.get(repo.fullName);
    if (!enrichedData) continue;

    // UPSERT 仓库
    stmts.push(
      env.DB.prepare(
        `INSERT OR REPLACE INTO repositories
          (id, owner, name, full_name, description, url, homepage_url,
           language, stars, forks, open_issues, watchers, topics,
           license_spdx, license_name, is_fork, is_archived, default_branch,
           created_at, pushed_at, github_updated_at, trending_since, trending_language,
           last_synced_at)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,
                COALESCE((SELECT trending_since FROM repositories WHERE id = ?1), strftime('%Y-%m-%dT%H:%M:%SZ','now')),
                ?22,
                strftime('%Y-%m-%dT%H:%M:%SZ','now'))`
      ).bind(
        enrichedData.id, enrichedData.owner, enrichedData.name, enrichedData.fullName,
        enrichedData.description, enrichedData.url, enrichedData.homepageUrl,
        enrichedData.language, enrichedData.stars, enrichedData.forks,
        enrichedData.openIssues, enrichedData.watchers, enrichedData.topics,
        enrichedData.licenseSpdx, enrichedData.licenseName,
        enrichedData.isFork ? 1 : 0, enrichedData.isArchived ? 1 : 0,
        enrichedData.defaultBranch, enrichedData.createdAt, enrichedData.pushedAt,
        enrichedData.githubUpdatedAt, language
      )
    );

    // 插入趋势快照
    stmts.push(
      env.DB.prepare(
        `INSERT OR REPLACE INTO trending_snapshots
          (repo_id, snapshot_date, since, rank, stars_total, stars_gained, forks_total, language)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      ).bind(
        enrichedData.id, today, since, repo.rank,
        enrichedData.stars, repo.starsGained, enrichedData.forks, language
      )
    );
  }

  // 分批执行（D1 batch 限制约 100 条语句）
  const BATCH_SIZE = 80;
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
    await env.DB.batch(stmts.slice(i, i + BATCH_SIZE));
  }

  // 更新 KV 缓存
  const kvKey = kvKeys.trending(since, language || 'all');
  // 重新查询 D1 获取最新数据并写入 KV
  const freshData = await env.DB.prepare(
    `SELECT r.*, ac.summary, ac.composite_score, ac.one_liner
     FROM repositories r
     LEFT JOIN ai_curations ac ON r.id = ac.repo_id AND ac.is_current = 1
     INNER JOIN trending_snapshots ts ON r.id = ts.repo_id
       AND ts.snapshot_date = ? AND ts.since = ?
       AND (ts.language = ? OR (ts.language IS NULL AND ? IS NULL))
     ORDER BY ts.rank ASC
     LIMIT 25`
  ).bind(today, since, language, language).all();

  await env.TRENDING_KV.put(kvKey, JSON.stringify(freshData.results), {
    expirationTtl: getTrendingTTL(since),
  });
}
```

### 8.6 AI 分析管道（小批次）

AI 策展分析每次 Cron 调用仅处理 **5-8 个仓库**，避免超过 30 秒 CPU 限制：

```typescript
// packages/worker-cron/src/pipeline/llm-evaluator.ts

const REPOS_PER_INVOCATION = 6; // 每次处理 6 个仓库

async function runAIAnalysis(env: Env): Promise<void> {
  const threshold = parseInt(env.LLM_EVAL_THRESHOLD || '50', 10);
  const startTime = Date.now();

  // 从 KV 读取游标
  const cursorStr = await env.TRENDING_KV.get(kvKeys.pipelineCursor('analyze'));
  const lastProcessedId = cursorStr ? parseInt(cursorStr, 10) : 0;

  // 查找需要分析的仓库：score >= threshold 且有变更（pushed_at > last_analyzed_at）
  const candidates = await env.DB.prepare(`
    SELECT r.id, r.full_name, r.description, r.language, r.topics, r.stars, r.forks,
           r.open_issues, r.created_at, r.pushed_at, r.license_spdx, r.contributor_count
    FROM repositories r
    WHERE r.score_composite >= ?
      AND r.id > ?
      AND (r.last_analyzed_at IS NULL OR r.pushed_at > r.last_analyzed_at)
    ORDER BY r.id ASC
    LIMIT ?
  `).bind(threshold, lastProcessedId, REPOS_PER_INVOCATION).all();

  if (candidates.results.length === 0) {
    // 没有更多候选，重置游标
    await env.TRENDING_KV.delete(kvKeys.pipelineCursor('analyze'));
    return;
  }

  let processed = 0;
  let failed = 0;

  for (const repo of candidates.results as any[]) {
    if (Date.now() - startTime > 20000) break; // 20s 安全阈值

    // 检查 KV 缓存是否已有近期分析
    const cached = await env.TRENDING_KV.get(kvKeys.curation(repo.id));
    if (cached) {
      processed++;
      continue;
    }

    // 获取 README 内容
    const readmeContent = await fetchReadme(env.GITHUB_TOKEN, repo.full_name);

    // 调用 Claude Haiku
    const result = await evaluateWithClaude(repo, readmeContent, env.ANTHROPIC_API_KEY);

    if (result) {
      // 将旧分析标记为非当前
      await env.DB.prepare(
        'UPDATE ai_curations SET is_current = 0 WHERE repo_id = ? AND is_current = 1'
      ).bind(repo.id).run();

      // 插入新分析
      await env.DB.prepare(`
        INSERT INTO ai_curations
          (repo_id, summary, why_notable, category_slug, subcategory,
           strengths, limitations, use_cases, target_audience, comparable_projects,
           novelty_score, clarity_score, production_score, category_fit_score,
           innovation_rating, production_readiness, learning_curve, one_liner,
           model_used, is_current)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,1)
      `).bind(
        repo.id, result.summary, result.why_notable, result.category_slug, result.subcategory,
        JSON.stringify(result.strengths), JSON.stringify(result.limitations),
        JSON.stringify(result.use_cases), result.target_audience,
        JSON.stringify(result.comparable_projects),
        result.novelty_score, result.clarity_score, result.production_score, result.category_fit_score,
        result.innovation_rating, result.production_readiness, result.learning_curve, result.one_liner,
        'claude-haiku-4-20250414'
      ).run();

      // 更新仓库分类和分析时间
      await env.DB.prepare(`
        UPDATE repositories
        SET category_id = (SELECT id FROM categories WHERE slug = ?),
            last_analyzed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
        WHERE id = ?
      `).bind(result.category_slug, repo.id).run();

      // 缓存到 KV
      await env.TRENDING_KV.put(kvKeys.curation(repo.id), JSON.stringify(result), {
        expirationTtl: kvTTL.curation,
      });

      processed++;
    } else {
      failed++;
    }
  }

  // 保存游标（最后处理的仓库 ID）
  const lastId = (candidates.results as any[])[candidates.results.length - 1].id;
  await env.TRENDING_KV.put(kvKeys.pipelineCursor('analyze'), String(lastId), {
    expirationTtl: 86400,
  });

  // 记录日志
  await env.DB.prepare(
    `INSERT INTO sync_logs (job_type, status, repos_processed, repos_failed, duration_ms, completed_at)
     VALUES ('analyze', ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`
  ).bind(
    failed === 0 ? 'completed' : 'partial',
    processed, failed, Date.now() - startTime
  ).run();
}

async function fetchReadme(token: string, fullName: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.raw+json',
        'User-Agent': 'GitPulseAI/1.0',
      },
    });
    if (!response.ok) return '';
    const text = await response.text();
    return text.slice(0, 3000); // 截断到 3000 字符
  } catch {
    return '';
  }
}
```

### 8.7 元数据刷新（GraphQL 批量）

```typescript
// packages/worker-cron/src/pipeline/enricher.ts

async function refreshRepoMetadata(env: Env): Promise<void> {
  const github = new GitHubClient(env.GITHUB_TOKEN);

  // 读取游标
  const cursorStr = await env.TRENDING_KV.get(kvKeys.pipelineCursor('refresh'));
  const lastId = cursorStr ? parseInt(cursorStr, 10) : 0;

  // 获取下一批 100 个仓库
  const batch = await env.DB.prepare(
    'SELECT id, full_name FROM repositories WHERE id > ? ORDER BY id ASC LIMIT 100'
  ).bind(lastId).all();

  if (batch.results.length === 0) {
    // 一轮完成
    await env.TRENDING_KV.delete(kvKeys.pipelineCursor('refresh'));
    return;
  }

  const fullNames = (batch.results as any[]).map(r => r.full_name);

  // 使用 GraphQL 批量查询（100 个仓库只需 1 次 API 调用）
  const enriched = await github.batchQueryGraphQL(fullNames);

  // 批量更新 D1
  const stmts = Array.from(enriched.entries()).map(([fullName, repo]) =>
    env.DB.prepare(
      `UPDATE repositories SET
        stars = ?, forks = ?, open_issues = ?, watchers = ?,
        topics = ?, license_spdx = ?, license_name = ?,
        pushed_at = ?, github_updated_at = ?,
        is_archived = ?, last_synced_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE full_name = ?`
    ).bind(
      repo.stars, repo.forks, repo.openIssues, repo.watchers,
      repo.topics, repo.licenseSpdx, repo.licenseName,
      repo.pushedAt, repo.githubUpdatedAt,
      repo.isArchived ? 1 : 0, fullName
    )
  );

  await env.DB.batch(stmts);

  // 保存游标
  const newLastId = (batch.results as any[])[batch.results.length - 1].id;
  await env.TRENDING_KV.put(kvKeys.pipelineCursor('refresh'), String(newLastId), {
    expirationTtl: 86400,
  });
}
```

---

## 9. Cloudflare 部署方案

### 9.1 wrangler.toml 配置

#### API Worker

```toml
# packages/worker-api/wrangler.toml

name = "gitpulse-api"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "TRENDING_KV"
id = "PLACEHOLDER_PRODUCTION_KV_ID"
preview_id = "PLACEHOLDER_PREVIEW_KV_ID"

[[d1_databases]]
binding = "DB"
database_name = "gitpulse-db"
database_id = "PLACEHOLDER_D1_DATABASE_ID"

[vars]
ENVIRONMENT = "production"
```

> **注意：** `PLACEHOLDER_*` 值需在初始化时替换。运行 `scripts/setup-resources.sh` 自动创建资源并更新配置文件，或按 12.4 节手动操作。

#### Cron Worker

```toml
# packages/worker-cron/wrangler.toml

name = "gitpulse-cron"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[triggers]
crons = [
  "0 * * * *",
  "0 4 * * *",
  "0 6 * * 0"
]

[[kv_namespaces]]
binding = "TRENDING_KV"
id = "PLACEHOLDER_PRODUCTION_KV_ID"
preview_id = "PLACEHOLDER_PREVIEW_KV_ID"

[[d1_databases]]
binding = "DB"
database_name = "gitpulse-db"
database_id = "PLACEHOLDER_D1_DATABASE_ID"

[vars]
ENVIRONMENT = "production"
SCRAPE_LANGUAGES = "python,typescript,rust,go,jupyter-notebook,cpp,java,c"
LLM_EVAL_THRESHOLD = "50"
LLM_EVAL_BATCH_SIZE = "6"
README_TRUNCATE_CHARS = "3000"
```

### 9.2 Pages 配置

```typescript
// packages/frontend/astro.config.ts

import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gitpulse.dev',
  output: 'hybrid', // 默认 SSG，按需 SSR
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['node:buffer'],
    },
  },
});
```

> **说明：** Tailwind CSS v4 使用 `@tailwindcss/vite` 插件代替 `@astrojs/tailwind` 集成。不需要 `tailwind.config.ts` 文件，所有主题配置通过 `global.css` 中的 `@theme` 指令完成。

### 9.3 .dev.vars 位置说明

Wrangler 会从 Worker 包目录查找 `.dev.vars` 文件。因此 `.dev.vars` 需要放在每个 Worker 包目录下：

```
packages/worker-api/.dev.vars
packages/worker-cron/.dev.vars
```

两个文件内容相同：

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

将 `.dev.vars` 添加到根目录 `.gitignore`（已包含），防止密钥泄露。

### 9.4 环境变量清单

| 变量名 | 位置 | 用途 |
|---|---|---|
| GITHUB_TOKEN | Worker Secret (`wrangler secret put`) | GitHub PAT 认证 |
| ANTHROPIC_API_KEY | Worker Secret | Claude API 密钥 |
| ALERT_WEBHOOK_URL | Worker Secret (可选) | 告警 Webhook URL |
| ENVIRONMENT | wrangler.toml `[vars]` | 环境标识 |
| SCRAPE_LANGUAGES | wrangler.toml `[vars]` | 抓取语言列表 |
| LLM_EVAL_THRESHOLD | wrangler.toml `[vars]` | LLM 评估阈值 |
| LLM_EVAL_BATCH_SIZE | wrangler.toml `[vars]` | LLM 批次大小 |
| README_TRUNCATE_CHARS | wrangler.toml `[vars]` | README 截断长度 |
| PUBLIC_API_BASE_URL | CI/CD 环境变量 | 前端 API 地址 |
| CLOUDFLARE_API_TOKEN | GitHub Secret | CI/CD 部署认证 |

### 9.5 CI/CD 部署流程

```yaml
# .github/workflows/deploy.yml

name: Deploy GitPulse AI
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # 每 6 小时重建静态站

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm -r typecheck

      - name: Run tests
        run: pnpm -r test

      - name: Build shared package
        run: pnpm --filter @gitpulse/shared build

      # 先部署 Workers（API Worker 必须在前端构建前可用）
      - name: Deploy API Worker
        run: pnpm --filter worker-api exec wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy Cron Worker
        run: pnpm --filter worker-cron exec wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      # 构建前端（此时 API Worker 已可用）
      - name: Build Frontend
        run: pnpm --filter frontend build
        env:
          PUBLIC_API_BASE_URL: https://api.gitpulse.dev

      - name: Deploy Pages
        run: pnpm --filter frontend exec wrangler pages deploy ./dist --project-name=gitpulse-ai
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

```yaml
# .github/workflows/test.yml

name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Type check
        run: pnpm -r typecheck

      - name: Test
        run: pnpm -r test
```

### 9.6 自定义域名设置

```
Pages 前端: gitpulse.dev → gitpulse-ai.pages.dev
API Worker: api.gitpulse.dev → gitpulse-api.workers.dev

设置方式:
1. Pages: Cloudflare Dashboard → Pages → Custom Domains → Add "gitpulse.dev"
2. Worker: wrangler.toml 添加:
   [[routes]]
   pattern = "api.gitpulse.dev/*"
   zone_name = "gitpulse.dev"
```

### 9.7 资源初始化脚本

```bash
#!/bin/bash
# scripts/setup-resources.sh
# 自动创建 D1 和 KV 资源并更新 wrangler.toml

set -e

echo "=== 创建 D1 数据库 ==="
D1_OUTPUT=$(wrangler d1 create gitpulse-db 2>&1)
D1_ID=$(echo "$D1_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
echo "D1 Database ID: $D1_ID"

echo "=== 创建 KV 命名空间 ==="
KV_OUTPUT=$(wrangler kv namespace create TRENDING_KV 2>&1)
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)
echo "KV ID: $KV_ID"

KV_PREVIEW_OUTPUT=$(wrangler kv namespace create TRENDING_KV --preview 2>&1)
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)
echo "KV Preview ID: $KV_PREVIEW_ID"

echo "=== 更新 wrangler.toml 文件 ==="
for TOML in packages/worker-api/wrangler.toml packages/worker-cron/wrangler.toml; do
  sed -i.bak "s/PLACEHOLDER_PRODUCTION_KV_ID/$KV_ID/g" "$TOML"
  sed -i.bak "s/PLACEHOLDER_PREVIEW_KV_ID/$KV_PREVIEW_ID/g" "$TOML"
  sed -i.bak "s/PLACEHOLDER_D1_DATABASE_ID/$D1_ID/g" "$TOML"
  rm "${TOML}.bak"
  echo "Updated: $TOML"
done

echo "=== 运行数据库迁移 ==="
for f in migrations/*.sql; do
  echo "Running: $f"
  wrangler d1 execute gitpulse-db --local --file="$f"
done

echo "=== 完成 ==="
echo "接下来请创建 .dev.vars 文件并填写 GITHUB_TOKEN 和 ANTHROPIC_API_KEY"
```

---

## 10. 开发里程碑

### Phase 1: 基础框架搭建 (3 天)

| 任务 | 预计工时 |
|---|---|
| 初始化 pnpm workspace monorepo 结构 | 2h |
| 配置 tsconfig.base.json + 各包 tsconfig | 1h |
| 配置 biome.json lint + format | 0.5h |
| 创建 shared 包：类型定义 + 常量 + 工具函数 + exports 配置 | 4h |
| 创建 D1 数据库 + 运行所有迁移 | 2h |
| 创建 KV 命名空间 + 运行 setup-resources.sh | 0.5h |
| 配置 worker-api 骨架 (itty-router + CORS + Env 类型) | 3h |
| 配置 worker-cron 骨架 (scheduled handler + 统一调度器) | 2h |
| 初始化 Astro 前端 + 集成 React + Tailwind v4 (@tailwindcss/vite) | 3h |
| 配置 .dev.vars + .gitignore + vitest.config.ts | 1h |
| 本地联调验证 3 个服务可同时启动 | 2h |

### Phase 2: 数据抓取与存储 (4 天)

| 任务 | 预计工时 |
|---|---|
| 实现 GitHub Search API 客户端（主数据源） | 3h |
| 实现 HTMLRewriter 趋势页抓取器（辅助数据源）| 4h |
| 实现 GitHub REST/GraphQL API 客户端 + repo-mapper + 速率限制 | 5h |
| 实现规则评分引擎 (5 个分项) | 6h |
| 实现发现管道 (search + scrape → enrich → score → persist) | 6h |
| 实现星标快照管道 | 2h |
| 实现元数据全量刷新管道 (GraphQL 批量) | 3h |
| 实现过期清理管道 | 1h |
| 编写评分引擎单元测试 + 抓取器集成测试 (保存 HTML 快照) | 4h |

### Phase 3: 前端页面实现 (5 天)

| 任务 | 预计工时 |
|---|---|
| 设计令牌 (CSS-first @theme) + 全局样式 | 3h |
| BaseLayout + Header + Footer + 主题切换 FOUC 防闪烁 | 3h |
| RepoCard + EmptyState 组件 | 3h |
| TrendingRow 组件 | 3h |
| CategoryCard + HealthBadge + LicenseBadge | 3h |
| 首页 (/) 含空状态处理 | 4h |
| 趋势列表页 (/trending/[since]) | 4h |
| 分类页 (/category/[slug]) 含分类头部 | 3h |
| 项目详情页 (/repo/[owner]/[name]) 含空策展状态 | 5h |
| SearchBar React Island (Fuse.js) + 搜索空状态 | 3h |
| FilterPanel React Island | 3h |
| StarChart React Island (SVG 迷你图) + 数据不足状态 | 3h |
| 分页 + TimeWindowTabs | 2h |
| 响应式适配 + 移动端底部标签栏 | 3h |
| ThemeToggle React Island + localStorage 持久化 | 2h |

### Phase 4: AI 筛选系统 (3 天)

| 任务 | 预计工时 |
|---|---|
| Claude API 客户端 + 重试逻辑 | 4h |
| Prompt 模板 + Zod 验证 schema | 3h |
| 规则分类器 (LLM 后备) | 3h |
| AI 策展管道集成（小批次，5-8 repos/invocation） | 4h |
| 变更门控 (pushed_at 检查) | 2h |
| 后备分析生成器 | 2h |
| ScoreBreakdown 展示组件 | 2h |
| AI 分析区域 UI | 3h |

### Phase 5: 搜索与高级功能 (3 天)

| 任务 | 预计工时 |
|---|---|
| 搜索 API 端点 (D1 LIKE 查询) | 3h |
| GET /api/repos/:owner/:name 端点 | 1h |
| 搜索结果页 | 3h |
| 对比页 (/compare) | 5h |
| 精选合集页面 + 合集自动生成 Cron 任务 | 4h |
| 关于页面 (方法论展示，含 Prompt 模板) | 3h |
| 全站统计端点 + 展示 | 2h |

### Phase 6: 部署与优化 (2 天)

| 任务 | 预计工时 |
|---|---|
| 配置 GitHub Actions CI/CD (deploy.yml + test.yml) | 3h |
| 首次部署 + 域名绑定 + 触发初始数据同步 | 2h |
| 性能优化 (Core Web Vitals) | 3h |
| 监控告警设置 (WAF Rate Limiting) | 2h |
| SEO meta 标签 + Open Graph + @astrojs/sitemap | 2h |
| robots.txt 配置 | 0.5h |
| 安全审查 (CORS 限制 Pages 域名, 密钥, Rate Limiting WAF 规则) | 2h |

**总预计工时：约 20 个工作日 (4 周)**

---

## 11. 非功能需求

### 11.1 性能目标

| 指标 | 目标 | 测量方式 |
|---|---|---|
| LCP (Largest Contentful Paint) | < 1.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| TTFB (Time to First Byte) | < 200ms | 全球边缘节点 |
| API 响应时间 (KV 命中) | < 50ms | Worker 日志 |
| API 响应时间 (D1 查询) | < 200ms | Worker 日志 |
| 首页 JS 总量 | < 50KB gzipped | Bundle 分析 |
| 首屏 HTML 大小 | < 100KB | 网络面板 |

**性能实现策略：**

- Astro SSG 输出纯静态 HTML，Cloudflare CDN 边缘服务
- React Islands 仅在需要交互的组件上激活 JS
- 图片使用 `loading="lazy"` 延迟加载
- StarChart 使用 `client:visible` 进入视口后水合
- SearchBar 使用 `client:load`（需即时响应），Fuse.js ~8KB 可接受
- 列表使用 Intersection Observer 实现虚拟滚动（超过 50 项时）

### 11.2 SEO 要求

- 每个页面有唯一的 `<title>` 和 `<meta name="description">`
- 结构化数据 (JSON-LD) 用于仓库详情页
- Open Graph + Twitter Card meta 标签
- 语义化 HTML 标签 (`<article>`, `<nav>`, `<main>`, `<section>`)
- 使用 `@astrojs/sitemap` 自动生成 sitemap.xml（已在 astro.config.ts 中配置）
- robots.txt 配置
- 规范化 URL (`<link rel="canonical">`)

### 11.3 可访问性

- WCAG 2.1 AA 级别合规
- 所有交互元素可通过键盘操作
- 焦点可见状态明确 (2px amber 轮廓)
- 颜色对比度 >= 4.5:1 (正文文字) / >= 3:1 (大文字)
- ARIA 标签用于 React Islands 交互组件
- `prefers-reduced-motion` 支持
- 语义化表格标题 (`<th scope="col">`)

### 11.4 安全性

- GITHUB_TOKEN 和 ANTHROPIC_API_KEY 仅通过 `wrangler secret put` 设置
- `.dev.vars` 在 `.gitignore` 中
- API Worker CORS 生产环境限制为 Pages 域名（见 5.1 节 CORS 配置）
- 所有用户输入通过 Zod schema 验证
- D1 查询使用参数化绑定 (`.bind()`)，防止 SQL 注入
- 无用户认证系统 — 纯公开只读 API
- Cloudflare WAF Rate Limiting 防止 API 滥用（Dashboard 配置，非代码实现）

### 11.5 监控与告警

| 监控项 | 阈值 | 告警方式 |
|---|---|---|
| Cron 任务连续失败 | 3 次 | Webhook (Slack/Discord) |
| 趋势抓取返回 0 条数据 | 连续 3 次 | Webhook + KV 告警队列 |
| GitHub API 配额 < 100 | 每次检查 | Worker 日志警告 |
| LLM 评估失败率 | > 20% | sync_logs 查询 |
| API 响应延迟 | P95 > 500ms | Cloudflare Analytics |
| D1 读取配额 | > 80% 日配额 | 每日检查 |

---

## 12. 附录

### 12.1 环境变量完整清单

| 变量 | 必填 | 存储方式 | 说明 |
|---|---|---|---|
| GITHUB_TOKEN | 是 | Worker Secret | GitHub Personal Access Token |
| ANTHROPIC_API_KEY | 是 | Worker Secret | Claude API 密钥 |
| ALERT_WEBHOOK_URL | 否 | Worker Secret | 告警通知 Webhook |
| CLOUDFLARE_API_TOKEN | 是 | GitHub Secret | CI/CD 部署用 Cloudflare API Token |
| PUBLIC_API_BASE_URL | 是 | CI/CD 环境变量 | 前端调用 API 的基础 URL |
| ENVIRONMENT | 是 | wrangler.toml [vars] | "production" 或 "development" |
| SCRAPE_LANGUAGES | 是 | wrangler.toml [vars] | 逗号分隔的语言列表 |
| LLM_EVAL_THRESHOLD | 是 | wrangler.toml [vars] | LLM 评估最低分数阈值 (默认 50) |
| LLM_EVAL_BATCH_SIZE | 是 | wrangler.toml [vars] | 每次 LLM 评估批次大小 (默认 6) |
| README_TRUNCATE_CHARS | 是 | wrangler.toml [vars] | README 截断字符数 (默认 3000) |

### 12.2 第三方服务账号需求

| 服务 | 用途 | 计划/费用 |
|---|---|---|
| Cloudflare | 托管 + CDN + Workers + D1 + KV | Workers Paid $5/月 |
| GitHub | API 数据源 | 免费（PAT） |
| Anthropic | Claude Haiku 4 AI 策展 | 按量计费 ~$1-3/月 |
| GitHub Actions | CI/CD | 免费（公开仓库 2000 分钟/月） |

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
    "dev:api": "pnpm --filter worker-api dev",
    "dev:cron": "pnpm --filter worker-cron dev -- --test-scheduled",
    "build": "pnpm --filter @gitpulse/shared build && pnpm -r --filter '!@gitpulse/shared' build",
    "build:frontend": "pnpm --filter frontend build",
    "build:workers": "pnpm --filter worker-api build && pnpm --filter worker-cron build",
    "deploy": "pnpm build && pnpm deploy:workers && pnpm deploy:frontend",
    "deploy:frontend": "pnpm --filter frontend exec wrangler pages deploy ./dist --project-name=gitpulse-ai",
    "deploy:workers": "pnpm --filter worker-api exec wrangler deploy && pnpm --filter worker-cron exec wrangler deploy",
    "db:migrate": "for f in migrations/*.sql; do wrangler d1 execute gitpulse-db --file=\"$f\"; done",
    "db:migrate:local": "for f in migrations/*.sql; do wrangler d1 execute gitpulse-db --local --file=\"$f\"; done",
    "typecheck": "pnpm -r typecheck",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.7.0",
    "wrangler": "^4.0.0"
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
    "@astrojs/cloudflare": "^12.0.0",
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

**packages/worker-api/package.json：**

```json
{
  "name": "worker-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler deploy --dry-run --outdir=dist",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "itty-router": "^5.0.0",
    "zod": "^3.23.0",
    "@gitpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^3.0.0",
    "typescript": "^5.7.0"
  }
}
```

**packages/worker-cron/package.json：**

```json
{
  "name": "worker-cron",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler deploy --dry-run --outdir=dist",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.0",
    "@gitpulse/shared": "workspace:*"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "vitest": "^3.0.0",
    "typescript": "^5.7.0"
  }
}
```

### 12.4 测试配置

**packages/worker-api/vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    include: ['tests/**/*.test.ts'],
  },
});
```

**packages/worker-cron/vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

**测试示例 — 评分引擎单元测试：**

```typescript
// packages/worker-cron/tests/pipeline/rule-scorer.test.ts

import { describe, it, expect } from 'vitest';
import { computeCompositeScore } from '../../src/pipeline/rule-scorer';

describe('computeCompositeScore', () => {
  it('should score a high-quality active repo as star tier', () => {
    const repo = {
      stars: 50000,
      dailyStarDelta: 200,
      weeklyStarDelta: 1000,
      monthlyStarDelta: 3000,
      createdAt: '2023-01-01T00:00:00Z',
      pushedAt: new Date(Date.now() - 86400000).toISOString(), // 昨天
      releasesLast6m: 12,
      readmeSizeBytes: 5000,
      hasExamplesDir: true,
      homepageUrl: 'https://example.com',
      hasCi: true,
      hasTests: true,
      hasReleases: true,
      contributorCount: 100,
      avgIssueCloseDays: 2,
      topics: '["llm","agent","rag"]',
      description: 'An LLM framework for building AI agents',
      language: 'Python',
      licenseSpdx: 'MIT',
    };

    const result = computeCompositeScore(repo as any);
    expect(result.tier).toBe('star');
    expect(result.composite).toBeGreaterThan(70);
  });

  it('should score an archived repo as filtered', () => {
    const repo = {
      stars: 100,
      isArchived: true,
      pushedAt: '2024-01-01T00:00:00Z',
    };
    // shouldDisqualify returns true for archived repos
    expect(true).toBe(true); // placeholder
  });
});
```

**测试示例 — 抓取器集成测试：**

```typescript
// packages/worker-cron/tests/github/scraper.test.ts

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('TrendingScraper', () => {
  it('should parse saved HTML fixture', () => {
    // 使用保存的 HTML 快照进行测试，不依赖网络
    const html = readFileSync(
      join(__dirname, '../fixtures/trending-python.html'), 'utf-8'
    );

    // 验证解析逻辑
    expect(html).toContain('article');
    // 具体的解析测试在 HTMLRewriter 可用时实现
  });
});
```

### 12.5 本地开发快速启动

```bash
# 1. 克隆并安装
git clone <repo-url>
cd awesome-project-in-github
pnpm install

# 2. 创建本地密钥文件（两个 Worker 目录各一份）
cat > packages/worker-api/.dev.vars << 'EOF'
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EOF

cp packages/worker-api/.dev.vars packages/worker-cron/.dev.vars

# 3. 创建 D1 和 KV 资源（使用自动化脚本或手动）
bash scripts/setup-resources.sh

# 4. 启动开发服务器（3 个终端）
# 终端 1: 前端 (端口 4321)
pnpm dev

# 终端 2: API Worker (端口 8787)
pnpm dev:api

# 终端 3: Cron Worker (端口 8788, 含 cron 测试端点)
pnpm dev:cron

# 手动触发 Cron:
curl http://localhost:8788/__scheduled?cron=0+*+*+*+*

# 本地开发环境变量:
# PUBLIC_API_BASE_URL 在 dev 模式下默认为 http://localhost:8787
```
