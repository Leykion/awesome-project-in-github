# GitPulse AI — 项目开发指令

## 核心规则

1. **唯一实现依据**：所有代码实现必须严格遵循 `docs/spec.md` 技术规格文档 v2.0
2. **禁止自由发挥**：不得添加 spec 未定义的功能、页面、组件、类型或依赖
3. **代码风格**：TypeScript 严格模式，Biome lint/format，2 空格缩进，100 字符行宽
4. **注释语言**：中文注释（与 spec 保持一致）
5. **包管理**：使用 pnpm，不使用 npm 或 yarn

## 技术栈（不可替换）

- 前端框架: Astro 5.x (纯 SSG, `output: 'static'`)
- 交互层: React 19.x (Islands 架构)
- UI 组件: shadcn/ui (源码式)
- 样式: Tailwind CSS v4 (CSS-first, `@tailwindcss/vite` 插件, 无 tailwind.config)
- 搜索: Fuse.js 7.x (客户端)
- 校验: Zod 3.x
- 数据管道脚本运行: tsx
- HTML 解析: cheerio 1.x
- LLM 客户端: openai 包 (OpenAI 兼容协议)
- Lint/Format: Biome 1.x
- 测试: Vitest 3.x
- 部署: Cloudflare Pages (纯静态)
- CI/CD: GitHub Actions

## Monorepo 结构

```
awesome-project-in-github/
├── packages/frontend/     # Astro SSG 前端
├── packages/shared/       # 共享类型、常量、工具函数
├── scripts/               # 数据管道脚本 (非 workspace 包, 根 package.json 调用)
├── data/                  # JSON 数据文件 (Git 版本管理)
├── docs/spec.md           # 技术规格文档 (唯一真相来源)
└── .github/workflows/     # CI/CD 工作流
```

## 实现阶段

### Phase 1: 基础框架搭建
- pnpm workspace + 根配置 (package.json, pnpm-workspace.yaml, tsconfig.base.json, biome.json, .gitignore, .env.example)
- packages/shared 完整实现 (所有类型定义、常量、工具函数)
- data/ 目录初始化脚本 + 空 JSON 数据文件
- scripts/ 基础工具 (config.ts, data-io.ts)
- 验证: pnpm install + typecheck 通过

### Phase 2: 数据管道脚本
- scripts/github/ (scraper.ts, search-api.ts, api-client.ts, repo-mapper.ts, rate-limiter.ts)
- scripts/pipeline/ (fetch-trending.ts, enrich-metadata.ts, score-repos.ts, ai-curate.ts, generate-collections.ts, cleanup-stale.ts, build-search-index.ts)
- scripts/analysis/ (prompt.ts, llm-client.ts, classifier.ts, fallback.ts, schema.ts)
- scripts/pipeline.ts 编排器
- 单元测试
- 验证: typecheck + lint + test 通过

### Phase 3: 前端页面实现
- Astro 配置 + layouts (BaseLayout.astro, CategoryLayout.astro)
- 全局样式 (global.css, 设计令牌, 暗色/亮色主题)
- 静态 Astro 组件 (15 个: Header, Footer, RepoCard, TrendingRow 等)
- React Islands (6 个: SearchBar, FilterPanel, StarChart, CompareTable, ThemeToggle, MobileNav)
- 页面 (8 个: index, trending/[since], category/[slug], repo/[owner]/[name], search, featured, featured/[slug], compare, about)
- 数据加载层 (data-loader.ts, format.ts, constants.ts)
- 验证: typecheck + lint + build 通过

### Phase 4: AI 策展系统
- LLM 通用客户端 (OpenAI 兼容, 重试逻辑)
- Prompt 模板 (9 大分类 taxonomy, 4 维评分)
- Zod schema 验证
- 精选合集生成逻辑
- 验证: typecheck + lint + test 通过

### Phase 5: 部署与集成
- GitHub Actions 工作流 (sync-data.yml, deploy.yml, test.yml)
- Astro 配置完善 (sitemap, SEO meta)
- 全站集成验证: typecheck + lint + test + build 全部通过
- 修复所有发现的问题

## 验证规则

每个 Phase 完成后必须执行验证，发现问题必须修复直到通过：
1. `pnpm typecheck` — 类型检查零错误
2. `pnpm lint` — Biome lint 零错误
3. `pnpm test` — 测试全部通过
4. `pnpm build` — 构建成功 (Phase 3+ 才执行)

## 关键实现细节参考

- spec 第 3 节: 完整目录结构和文件清单
- spec 第 4 节: JSON 数据文件的 TypeScript 接口定义
- spec 第 5 节: 共享包类型、常量、工具函数的完整代码
- spec 第 6 节: UI 设计规格 (设计令牌、CSS 变量、组件规格、响应式断点)
- spec 第 7 节: 评分算法、LLM Prompt、分类体系
- spec 第 8 节: GitHub 数据抓取方案 (双源架构、API 客户端、速率限制)
- spec 第 9 节: 部署配置 (Astro config, GitHub Actions workflows)
- spec 第 12 节: 完整 package.json、测试配置、环境变量清单
