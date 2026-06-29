export const meta = {
  name: 'build-project',
  description: 'Build GitPulse AI from spec: 5 phases, auto-verify, auto-fix',
  whenToUse: 'When implementing the GitPulse AI project from docs/spec.md',
  phases: [
    { title: 'Phase 1: Foundation', detail: 'Monorepo skeleton, shared package, data init, base scripts config' },
    { title: 'Phase 1: Verify', detail: 'pnpm install + typecheck' },
    { title: 'Phase 2: Data Pipeline', detail: 'GitHub scrapers, pipeline stages, analysis scripts' },
    { title: 'Phase 2: Verify', detail: 'typecheck + lint + test' },
    { title: 'Phase 3: Frontend', detail: 'Astro pages, Astro components, React islands, styles' },
    { title: 'Phase 3: Verify', detail: 'typecheck + lint + build' },
    { title: 'Phase 4: AI Curation', detail: 'LLM client, prompts, collection generation' },
    { title: 'Phase 4: Verify', detail: 'typecheck + lint + test' },
    { title: 'Phase 5: Deploy & Integration', detail: 'GitHub Actions, SEO, final verify + fix loop' },
  ],
}

const SPEC_PATH = 'docs/spec.md'
const CLAUDE_MD = 'CLAUDE.md'

const BASE_PROMPT = `You are implementing the GitPulse AI project. CRITICAL RULES:
1. Read CLAUDE.md first for project rules
2. Read docs/spec.md for implementation details (it's the ONLY source of truth)
3. Implement EXACTLY what the spec defines — no additions, no modifications, no "improvements"
4. Use Chinese comments consistent with the spec
5. All code must be TypeScript strict mode
6. Use pnpm as package manager
7. When spec provides exact code snippets, use them verbatim
8. When spec defines interfaces/types, implement them exactly as specified`

// ============================================================
// PHASE 1: Foundation
// ============================================================
phase('Phase 1: Foundation')
log('Starting Phase 1: Monorepo skeleton, shared package, data initialization')

const p1_skeleton = await agent(`${BASE_PROMPT}

YOUR TASK: Create the monorepo skeleton and all configuration files.

Read docs/spec.md lines 298-597 for the complete directory structure, configuration files, and package.json definitions.
Also read docs/spec.md lines 2105-2197 for complete package.json files and vitest config.

Create these files in order:
1. pnpm-workspace.yaml (spec line ~452)
2. tsconfig.base.json (spec line ~460)
3. biome.json (spec line ~569)
4. .gitignore (spec line ~536)
5. .env.example with: GITHUB_TOKEN, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
6. Root package.json (spec line ~2109, complete version)
7. packages/shared/package.json (spec line ~669, complete version)
8. packages/shared/tsconfig.json (spec line ~490)
9. packages/frontend/package.json (spec line ~2152, complete version)
10. packages/frontend/tsconfig.json (spec line ~505)
11. scripts/tsconfig.json (spec line ~520)
12. vitest.config.ts (spec line ~2188)

IMPORTANT: Copy the exact JSON/YAML content from the spec. Do not modify versions, scripts, or dependencies.
After creating all files, run: pnpm install`, {
  label: 'skeleton+config',
  phase: 'Phase 1: Foundation',
})

const p1_shared = await agent(`${BASE_PROMPT}

YOUR TASK: Implement the complete packages/shared package — all types, constants, and utility functions.

Read docs/spec.md carefully for each file. The spec contains EXACT code to use:

1. TYPES (read spec lines 700-1112):
   - packages/shared/src/types/data-files.ts — CategoryData, RepositoryData, TrendingSnapshotData, StarHistoryEntry, StarHistoryData, FeaturedCollectionData, SiteStatsData, SyncLogEntry, SyncLogData, CurationData (all interfaces defined in spec section 4.1)
   - packages/shared/src/types/repo.ts — ScrapedRepo, EnrichedRepo types (referenced in spec)
   - packages/shared/src/types/api.ts — generic data envelope types
   - packages/shared/src/types/scoring.ts — scoring weight and threshold types
   - packages/shared/src/types/curation.ts — re-export CurationData if needed

2. CONSTANTS (read spec lines 776-1810):
   - packages/shared/src/constants/categories.ts — CATEGORY_SEEDS array (spec line ~776, exact data)
   - packages/shared/src/constants/languages.ts — language list + GitHub color mapping
   - packages/shared/src/constants/scoring-weights.ts — scoring signal weights (spec section 7.1)
   - packages/shared/src/constants/ai-topics.ts — AI-related GitHub topic tags (spec section 7.4)
   - packages/shared/src/constants/license-colors.ts — SPDX license color mapping (spec line ~1785)

3. UTILITIES:
   - packages/shared/src/utils/date.ts — date formatting helpers
   - packages/shared/src/utils/validation.ts — Zod schemas for data validation
   - packages/shared/src/utils/health-badge.ts — health status calculation (green/yellow/red)
   - packages/shared/src/utils/number.ts — number formatting (1.2k, 45.3k etc.)

4. INDEX:
   - packages/shared/src/index.ts — unified export entry (spec line ~704)

Read the ENTIRE spec carefully. For interfaces like RepositoryData (spec line ~795), CategoryData (spec line ~735), TrendingSnapshotData (spec line ~921), etc., implement them EXACTLY as defined.

For constants like CATEGORY_SEEDS, LICENSE_COLORS, SCORING_WEIGHTS — use the exact values from the spec.`, {
  label: 'shared-package',
  phase: 'Phase 1: Foundation',
})

const p1_data_init = await agent(`${BASE_PROMPT}

YOUR TASK: Create data initialization scripts and empty JSON data files.

Read docs/spec.md lines 2039-2042 for the init-data description, and lines 315-325 for the data file list.

1. Create scripts/init-data.ts that:
   - Creates the data/ directory
   - Writes initial empty JSON files matching the TypeScript interfaces defined in shared/src/types/data-files.ts:
     * data/repositories.json → []
     * data/trending-daily.json → []
     * data/trending-weekly.json → []
     * data/trending-monthly.json → []
     * data/categories.json → seed with CATEGORY_SEEDS (9 categories, repoCount: 0, topRepos: [])
     * data/featured-collections.json → []
     * data/star-history.json → {}
     * data/stats.json → { totalReposTracked: 0, totalCurations: 0, categoryCounts: {}, languageCounts: {}, lastSyncAt: null, lastCurationAt: null, syncHealth: "unhealthy" }
     * data/search-index.json → []
     * data/sync-log.json → { lastRun: "", entries: [] }

2. Create scripts/seed-categories.ts that populates categories.json with the 9 AI categories from CATEGORY_SEEDS

3. Create scripts/lib/config.ts — pipeline configuration (spec lines 600-663, exact code)

4. Create scripts/lib/data-io.ts — JSON file read/write utilities (spec lines 1139-1252, exact code)

IMPORTANT: The data-io.ts and config.ts files have exact code in the spec — use them verbatim. Import types from @gitpulse/shared.`, {
  label: 'data-init+scripts-lib',
  phase: 'Phase 1: Foundation',
})

// Phase 1 Verify
phase('Phase 1: Verify')
log('Verifying Phase 1: install + typecheck')

const p1_verify = await agent(`${BASE_PROMPT}

YOUR TASK: Verify Phase 1 implementation and fix ALL issues.

Run these commands in sequence:
1. cd to the project root
2. pnpm install (if not done)
3. pnpm typecheck

If there are errors:
- Read the error messages carefully
- Fix each issue by reading the relevant spec sections
- Re-run verification until ALL checks pass with zero errors

Common issues to watch for:
- Missing type imports between packages
- tsconfig path resolution issues
- Missing dependencies
- Type mismatches with spec definitions

Keep fixing and re-running until pnpm typecheck passes with zero errors.
Report what you fixed.`, {
  label: 'verify-phase1',
  phase: 'Phase 1: Verify',
})

// ============================================================
// PHASE 2: Data Pipeline
// ============================================================
phase('Phase 2: Data Pipeline')
log('Starting Phase 2: GitHub scrapers, pipeline stages, analysis scripts')

const p2_github = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all scripts in scripts/github/ directory.

Read docs/spec.md section 8 (lines 1943-1986) for the complete GitHub data scraping strategy.

Create these files:

1. scripts/github/rate-limiter.ts
   - API rate limit management for GitHub REST, Search, and GraphQL APIs
   - Track remaining quota, implement delay when approaching limit
   - Spec section 8.4: REST 5000/hr, Search 30/min, GraphQL 5000 points/hr

2. scripts/github/search-api.ts
   - GitHub Search API client (primary data source)
   - Search for AI-related repos by language and topic
   - Handle pagination, rate limiting
   - Spec section 8.1 and 8.5

3. scripts/github/scraper.ts
   - cheerio-based HTML parser for GitHub Trending page (auxiliary data source)
   - Parse trending repos from HTML
   - Robustness: minimum element assertion (>= 10), consecutive failure alerting
   - Spec section 8.1

4. scripts/github/api-client.ts
   - GitHub REST v3 and GraphQL v4 client
   - REST for single repo enrichment
   - GraphQL for batch queries (100 repos/query)
   - Spec sections 8.3, 8.7

5. scripts/github/repo-mapper.ts
   - Map GitHub API responses (snake_case) to app types (camelCase)
   - mapGitHubRepoToEnriched function
   - Spec section 8.2

Import types from @gitpulse/shared. Use the config from scripts/lib/config.ts.
All HTTP requests should use native fetch. GitHub token from config.githubToken.`, {
  label: 'github-clients',
  phase: 'Phase 2: Data Pipeline',
})

const p2_analysis = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all scripts in scripts/analysis/ directory.

Read docs/spec.md section 7 (lines 1826-1940) for scoring algorithm, LLM prompts, and classification.

Create these files:

1. scripts/analysis/llm-client.ts
   - Generic LLM client using OpenAI compatible protocol (spec lines 1875-1916, EXACT code)
   - Uses 'openai' npm package
   - Temperature 0.2, max_tokens 1024
   - 3 retries with exponential backoff for 429 and 5xx errors

2. scripts/analysis/prompt.ts
   - System prompt defining 9 AI category taxonomy
   - 4-dimension scoring rubric (novelty, clarity, production, category_fit, each 0-10)
   - User prompt template with repo metadata + truncated README
   - Output strict JSON format
   - Spec section 7.2

3. scripts/analysis/schema.ts
   - Zod output validation schemas for LLM responses
   - Validate the JSON structure matches CurationData interface
   - Spec section 7.2

4. scripts/analysis/classifier.ts
   - Rule-based classifier as LLM fallback
   - Classify repos into 9 categories using topics and keywords
   - Spec section 7.4

5. scripts/analysis/fallback.ts
   - Fallback analysis generation when LLM fails
   - Generate reasonable defaults for CurationData fields
   - Mark isFallback: true

Import types from @gitpulse/shared. Import config from scripts/lib/config.ts.`, {
  label: 'analysis-scripts',
  phase: 'Phase 2: Data Pipeline',
})

const p2_pipeline = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all pipeline stage scripts and the orchestrator.

Read docs/spec.md sections 2.3 (data flow, lines 149-180), 7.1 (scoring algorithm, lines 1829-1865), 7.5-7.6 (scheduling & collections, lines 1924-1931), 8.5-8.8 (pipeline implementation, lines 1971-1986).

Create these files:

1. scripts/pipeline/fetch-trending.ts
   - Stage 1: Discover new repos via GitHub Search API + Trending HTML scraping
   - Process all languages and time dimensions (daily/weekly/monthly)
   - Try cheerio scraper first, fall back to Search API on failure
   - Deduplicate across sources
   - Spec section 8.5

2. scripts/pipeline/enrich-metadata.ts
   - Stage 2: Enrich repos with GitHub REST/GraphQL API metadata
   - Use GraphQL batch queries (100 repos/query) for efficiency
   - Update stars, forks, issues, topics, contributor count, etc.
   - Spec section 8.7

3. scripts/pipeline/score-repos.ts
   - Stage 3: Rule-based scoring engine (0-100)
   - Implement the EXACT formula from spec section 7.1:
     composite = 0.30*growth + 0.20*maturity + 0.20*community + 0.20*relevance + 0.10*quality
   - Implement all sub-scores (growth, maturity, community, relevance, quality)
   - Apply tier classification: star(>=70), notable(50-69), tracked(30-49)
   - Apply hard exclusion rules (archived, fork, stars<50, 180 days no push)

4. scripts/pipeline/ai-curate.ts
   - Stage 4: LLM intelligent curation
   - Filter repos: composite >= 50 AND pushedAt > lastAnalyzedAt
   - Fetch README, call configured LLM API, update curation field
   - Batch processing with configurable batch size
   - Spec section 8.6

5. scripts/pipeline/generate-collections.ts
   - Stage 5: Auto-generate featured collections
   - Weekly: "Top 10 fastest rising" (by weekly star growth)
   - Monthly (first Sunday): category Top 10 collections
   - Retention: latest + recent 4 weekly_digests
   - Spec section 7.6

6. scripts/pipeline/cleanup-stale.ts
   - Stage 6: 30-day rolling data cleanup
   - Remove repos with composite < 30 AND > 30 days not in trending
   - Clean expired star history entries
   - Keep latest 100 sync log entries
   - Spec section 8.8

7. scripts/pipeline/build-search-index.ts
   - Stage 7: Pre-build Fuse.js search index
   - Extract searchable fields: fullName, description, topics, language, categorySlug, stars, licenseSpdx, oneLiner
   - Write to data/search-index.json
   - Spec lines 1320-1343 (EXACT code)

8. scripts/pipeline.ts (orchestrator)
   - Execute all 7 stages in sequence: fetch -> enrich -> score -> curate -> collections -> cleanup -> search-index
   - Log each stage's duration and results
   - Write sync-log.json
   - Update stats.json
   - Spec line ~155

Import types from @gitpulse/shared. Import data-io from scripts/lib/data-io.ts. Import config from scripts/lib/config.ts.`, {
  label: 'pipeline-stages',
  phase: 'Phase 2: Data Pipeline',
})

const p2_tests = await agent(`${BASE_PROMPT}

YOUR TASK: Write unit tests for the data pipeline.

Create test files using Vitest (already configured in vitest.config.ts):

1. scripts/pipeline/score-repos.test.ts
   - Test the scoring formula: composite = 0.30*growth + 0.20*maturity + 0.20*community + 0.20*relevance + 0.10*quality
   - Test tier classification: star(>=70), notable(50-69), tracked(30-49)
   - Test hard exclusion rules (archived, fork, stars<50, 180 days no push)
   - Test edge cases (all zeros, all max, boundary values)

2. scripts/pipeline/cleanup-stale.test.ts
   - Test 30-day cleanup logic
   - Test star history expiration
   - Test sync log retention (max 100 entries)

3. scripts/pipeline/build-search-index.test.ts
   - Test search index generation
   - Test field extraction from RepositoryData

4. scripts/analysis/classifier.test.ts
   - Test rule-based classification into 9 categories
   - Test with repos matching different topic/keyword patterns

5. packages/shared/src/utils/number.test.ts
   - Test number formatting (1.2k, 45.3k, 1.2M)

6. packages/shared/src/utils/health-badge.test.ts
   - Test health badge calculation (green/yellow/red)

Use vitest globals (describe, it, expect). Mock file system operations where needed.
Do NOT mock LLM or GitHub API calls — those are integration tests.`, {
  label: 'pipeline-tests',
  phase: 'Phase 2: Data Pipeline',
})

// Phase 2 Verify
phase('Phase 2: Verify')
log('Verifying Phase 2: typecheck + lint + test')

const p2_verify = await agent(`${BASE_PROMPT}

YOUR TASK: Verify Phase 2 implementation and fix ALL issues.

Run these commands in sequence:
1. pnpm typecheck
2. pnpm lint
3. pnpm test

If there are errors:
- Read error messages carefully
- Fix each issue
- Common problems: import path errors, type mismatches, missing exports, test failures
- Re-run ALL THREE checks after each fix batch

Keep fixing and re-running until ALL THREE pass with zero errors.
Report what you fixed.`, {
  label: 'verify-phase2',
  phase: 'Phase 2: Verify',
})

// ============================================================
// PHASE 3: Frontend
// ============================================================
phase('Phase 3: Frontend')
log('Starting Phase 3: Astro config, layouts, components, pages')

const p3_foundation = await agent(`${BASE_PROMPT}

YOUR TASK: Create Astro configuration, layouts, global styles, and the data loading layer.

Read docs/spec.md:
- Astro config: lines 1993-2014 (EXACT code)
- Global CSS with design tokens: lines 1424-1562 (EXACT CSS)
- Theme toggle persistence: lines 1565-1615 (EXACT code)
- Data loader: lines 196-254 (EXACT code)
- Responsive breakpoints: lines 1617-1625

Create these files:

1. packages/frontend/astro.config.ts (spec line ~2001, exact code)

2. packages/frontend/src/styles/global.css
   - Tailwind v4 CSS-first config (@import 'tailwindcss', @theme block)
   - All CSS custom properties (colors, fonts, spacing, shadows, animations, layout)
   - Dark mode default, light mode override
   - Reduced motion media query
   - Use the EXACT CSS from spec lines 1424-1562

3. packages/frontend/src/layouts/BaseLayout.astro
   - HTML skeleton with meta tags, nav, footer
   - Theme anti-FOUC inline script (spec line ~1573)
   - Import global.css
   - Responsive viewport meta tag
   - SEO: dynamic title, description via props

4. packages/frontend/src/layouts/CategoryLayout.astro
   - Category page wrapper
   - Extends BaseLayout with category-specific context

5. packages/frontend/src/lib/data-loader.ts (spec lines 196-254, EXACT code)

6. packages/frontend/src/lib/format.ts
   - Number formatting (reuse from shared or implement for client-side)
   - Relative time formatting ("2 hours ago", "3 days ago")

7. packages/frontend/src/lib/constants.ts
   - Category slug to color mapping
   - Category slug to icon mapping
   - Reuse constants from @gitpulse/shared where possible

8. packages/frontend/public/favicon.svg — simple SVG icon
9. packages/frontend/public/robots.txt — standard robots.txt allowing all crawlers`, {
  label: 'frontend-foundation',
  phase: 'Phase 3: Frontend',
})

const p3_astro_components = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all static Astro components (zero JS output).

Read docs/spec.md section 6.4 (lines 1626-1700+) for page layouts and component specs.
Read section 6.8 (lines 1812-1823) for interaction behaviors.

Create these components in packages/frontend/src/components/astro/:

1. Header.astro — Navigation bar (56px fixed, frosted glass background)
   - Logo, nav links (Trending, Categories, Featured, Search, About)
   - ThemeToggle island slot
   - Mobile hamburger menu trigger

2. Footer.astro — Links, copyright, data freshness indicator

3. RepoCard.astro — Vertical card for homepage grid
   - Owner/name, description, language badge, star count, star growth, health badge, license badge
   - Hover: translateY(-2px) + background change

4. TrendingRow.astro — Horizontal row for trending list
   - Rank number (64px, font-data), Top 3 accent color
   - Three-column grid: [rank 80px] [info 1fr] [metrics 200px]
   - Hover: translateY(-1px) + elevated background
   - Spec lines 1694-1699

5. CategoryCard.astro — Category navigation card
   - Icon + name + repo count
   - Links to /category/[slug]

6. HealthBadge.astro — Maintenance health badge (green/yellow/red)
7. LicenseBadge.astro — SPDX license colored badge
8. MetricsBar.astro — Stats bar (Stars, Forks, last commit time)
9. IntegrationBadges.astro — Integration capability icons (CI/Docker/PyPI/NPM/MCP)
10. StatsBar.astro — Site-wide statistics bar (4 metrics, count animation)
11. Pagination.astro — Pagination component
12. TimeWindowTabs.astro — Time window tabs (daily/weekly/monthly)
13. FeaturedCard.astro — Featured collection card (editorial layout)
14. ScoreBreakdown.astro — Score breakdown display (transparency component)
15. Skeleton.astro — Loading skeleton screen
16. EmptyState.astro — Empty state component (illustration + message + action button)
17. DataFreshness.astro — Data freshness indicator ("Updated X hours ago")

Use Tailwind CSS v4 classes. Reference CSS custom properties from global.css.
Each component should accept typed props. Use the design tokens from the spec.`, {
  label: 'astro-components',
  phase: 'Phase 3: Frontend',
})

const p3_react_islands = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all React Island components (interactive, client-side hydrated).

Read docs/spec.md:
- SearchBar: lines 1349-1398 (EXACT code structure)
- ThemeToggle: lines 1584-1615 (EXACT code)
- Section 6.8 for interaction behaviors

Create these files in packages/frontend/src/components/react/:

1. SearchBar.tsx (spec lines 1349-1398)
   - Fuse.js autocomplete search
   - Props: searchIndex (SearchEntry[])
   - Debounced input, results dropdown
   - Keys and weights as specified in spec
   - threshold: 0.4, limit: 20, minimum 2 chars

2. FilterPanel.tsx
   - Language filter (checkboxes)
   - Category filter (checkboxes)
   - License filter
   - Sort options: speed, total stars, composite score, last updated
   - Client-side filtering/sorting of provided data

3. StarChart.tsx
   - SVG mini sparkline chart for star history
   - Props: StarHistoryEntry[]
   - Responsive width, fixed height
   - Line chart with gradient fill

4. CompareTable.tsx
   - Repository comparison table (max 3 repos)
   - Side-by-side metrics: stars, forks, health, score, license, etc.
   - Highlight best values

5. ThemeToggle.tsx (spec lines 1584-1615, EXACT code)
   - localStorage key: 'gitpulse-theme'
   - Respect prefers-color-scheme as default
   - Toggle dark/light with data-theme attribute

6. MobileNav.tsx
   - Bottom tab bar for mobile (< 640px)
   - Tabs: Home, Trending, Categories, Search
   - Active state highlighting

All components must:
- Use React 19 patterns
- Be client-hydrated (used with client:load or client:idle in Astro)
- Use Tailwind CSS v4 classes
- Accept typed props interfaces`, {
  label: 'react-islands',
  phase: 'Phase 3: Frontend',
})

const p3_pages = await agent(`${BASE_PROMPT}

YOUR TASK: Implement all 9 Astro pages.

Read docs/spec.md:
- Homepage layout: lines 1626-1665
- Trending page layout: lines 1668-1699
- Section 5.2-5.4 for data loading patterns (lines 1256-1416)
- Section 2.5 for empty states (lines 283-295)

Create these pages in packages/frontend/src/pages/:

1. index.astro (/) — Homepage
   - Hero with title "发现 AI 开源世界的下一个趋势", amber radial gradient
   - StatsBar (4 metrics with count animation)
   - Category filter chips (9 categories + "全部")
   - "今日热门" project card grid (6-9 cards, 3/2/1 columns responsive)
   - "AI 精选" editorial section
   - Category navigation grid (3x3)
   - Empty state when data is empty
   - Load data via data-loader.ts

2. trending/[since].astro — Trending list
   - getStaticPaths: daily, weekly, monthly
   - Time window tabs
   - FilterPanel (React island, client:load)
   - TrendingRow list (25 per page)
   - Client-side pagination
   - Load trending data + categories

3. category/[slug].astro — Category page
   - getStaticPaths from categories data
   - Category header with icon, name, description
   - Repo cards filtered by category
   - Sort and filter controls

4. repo/[owner]/[name].astro — Project detail page
   - getStaticPaths from ALL repositories (spec lines 1292-1314)
   - Full repo info: description, metrics, health badge, license, topics
   - AI curation section (summary, strengths, limitations, use cases)
   - Star history chart (React island)
   - Score breakdown (transparency)
   - Integration badges
   - "AI 分析待生成" placeholder when no curation
   - Link to compare page

5. search.astro — Search page
   - SearchBar (React island, client:load)
   - Load search-index.json and pass as props
   - Display search results
   - Empty state: "未找到匹配项目"

6. featured.astro — Featured collections list
   - FeaturedCard for each collection
   - Sort by date

7. featured/[slug].astro — Collection detail page
   - getStaticPaths from featured collections
   - Collection header, description
   - Repo cards in collection order

8. compare.astro — Comparison page
   - Read repos query param (?repos=a/b,c/d)
   - CompareTable (React island, client:load)
   - Max 3 repos comparison
   - Load repository data

9. about.astro — Methodology & scoring transparency
   - Scoring formula explanation
   - Category definitions
   - Data sources description
   - Update frequency info

All pages:
- Use BaseLayout (or CategoryLayout for category pages)
- Import data via data-loader.ts functions
- Handle empty states per spec section 2.5
- Use Tailwind CSS v4 responsive classes
- SEO: unique title and meta description per page`, {
  label: 'pages',
  phase: 'Phase 3: Frontend',
})

// Phase 3 Verify
phase('Phase 3: Verify')
log('Verifying Phase 3: typecheck + lint + build')

const p3_verify = await agent(`${BASE_PROMPT}

YOUR TASK: Verify Phase 3 implementation and fix ALL issues.

Run these commands in sequence:
1. pnpm typecheck
2. pnpm lint
3. pnpm build

If there are errors:
- Fix Astro component errors (props types, imports, layout references)
- Fix React component errors (hook usage, event handlers, TypeScript)
- Fix build errors (missing data files — run the init script if needed)
- Fix CSS issues
- Re-run ALL THREE checks after each fix batch

For build to succeed, data/ directory must have valid JSON files.
If missing, run: npx tsx scripts/init-data.ts

Keep fixing and re-running until ALL THREE pass with zero errors.
Report what you fixed.`, {
  label: 'verify-phase3',
  phase: 'Phase 3: Verify',
})

// ============================================================
// PHASE 4: AI Curation System
// ============================================================
phase('Phase 4: AI Curation')
log('Starting Phase 4: LLM integration, prompts, collection generation')

const p4_ai = await agent(`${BASE_PROMPT}

YOUR TASK: Review and enhance the AI curation system (some parts were created in Phase 2).

Read docs/spec.md section 7 (lines 1826-1940) for the complete AI system spec.

Verify and fix these files (created in Phase 2):

1. scripts/analysis/llm-client.ts — Verify it matches spec lines 1875-1916 exactly
2. scripts/analysis/prompt.ts — Ensure system prompt includes:
   - 9 category taxonomy with topic signals, keyword signals, language preferences
   - 4-dimension scoring rubric (novelty 0-10, clarity 0-10, production 0-10, category_fit 0-10)
   - Innovation rating (1-5), production readiness (1-5), learning curve (low/medium/high)
   - Strict JSON output format
3. scripts/analysis/schema.ts — Zod schema must validate ALL CurationData fields
4. scripts/analysis/classifier.ts — Rule-based fallback classification
5. scripts/analysis/fallback.ts — Fallback analysis generation

Also verify:
6. scripts/pipeline/ai-curate.ts — Correct LLM client usage, batch processing
7. scripts/pipeline/generate-collections.ts — Weekly and monthly collection logic

Write tests:
8. scripts/analysis/schema.test.ts — Test Zod validation with valid/invalid LLM outputs
9. scripts/analysis/classifier.test.ts — Test classification accuracy

Run: pnpm typecheck && pnpm test
Fix any issues found.`, {
  label: 'ai-curation-system',
  phase: 'Phase 4: AI Curation',
})

// Phase 4 Verify
phase('Phase 4: Verify')
log('Verifying Phase 4: typecheck + lint + test')

const p4_verify = await agent(`${BASE_PROMPT}

YOUR TASK: Verify Phase 4 and fix ALL issues.

Run: pnpm typecheck && pnpm lint && pnpm test

Fix any issues. Keep re-running until all pass.`, {
  label: 'verify-phase4',
  phase: 'Phase 4: Verify',
})

// ============================================================
// PHASE 5: Deploy & Integration
// ============================================================
phase('Phase 5: Deploy & Integration')
log('Starting Phase 5: GitHub Actions, SEO, final integration')

const p5_cicd = await agent(`${BASE_PROMPT}

YOUR TASK: Create GitHub Actions workflow files and finalize deployment configuration.

Read docs/spec.md section 9.3 (lines 2027-2033) for CI/CD workflow descriptions.

Create these files:

1. .github/workflows/sync-data.yml
   - Trigger: cron schedule "0 0,12 * * *" (UTC 00:00 and 12:00)
   - Also: workflow_dispatch for manual trigger
   - Steps:
     a. Checkout repo
     b. Setup Node.js 22, pnpm
     c. Install dependencies
     d. Run data pipeline: pnpm pipeline:all
     e. Git commit + push data changes (if any)
     f. Build frontend: pnpm build
     g. Deploy to Cloudflare Pages: wrangler pages deploy
   - Concurrency: group sync-data, cancel-in-progress true
   - Environment secrets: GITHUB_TOKEN, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID

2. .github/workflows/test.yml
   - Trigger: push and pull_request
   - Steps: install, lint, typecheck, test

3. .github/workflows/deploy.yml
   - Trigger: push to main with paths filter (packages/frontend/**, packages/shared/**, data/**)
   - Steps: install, build shared, build frontend, deploy to Cloudflare Pages

All workflows should:
- Use pnpm/action-setup for pnpm
- Use actions/setup-node with node-version 22
- Cache pnpm store
- Use appropriate concurrency groups`, {
  label: 'cicd-workflows',
  phase: 'Phase 5: Deploy & Integration',
})

const p5_seo = await agent(`${BASE_PROMPT}

YOUR TASK: Add SEO and meta tags to all pages.

Read docs/spec.md section 11.2 for SEO requirements.

Update packages/frontend/src/layouts/BaseLayout.astro:
1. Add JSON-LD structured data (WebSite schema)
2. Open Graph meta tags (og:title, og:description, og:image, og:url)
3. Twitter card meta tags
4. Canonical URL
5. Sitemap reference

Verify each page has:
- Unique <title> containing "GitPulse AI"
- Unique meta description
- Proper heading hierarchy (h1 > h2 > h3)

Create packages/frontend/public/og-image.png placeholder (or SVG).

Also verify:
- @astrojs/sitemap is properly configured in astro.config.ts
- robots.txt exists and allows all crawlers
- favicon.svg exists`, {
  label: 'seo-meta',
  phase: 'Phase 5: Deploy & Integration',
})

// Final verification loop
log('Starting final integration verification loop')

const p5_final = await agent(`${BASE_PROMPT}

YOUR TASK: Final integration verification. Fix ALL remaining issues until the project builds cleanly.

Run this verification sequence repeatedly until everything passes:

1. pnpm install (ensure all deps resolved)
2. pnpm typecheck (zero TypeScript errors across all packages)
3. pnpm lint (zero Biome lint errors)
4. pnpm test (all tests pass)
5. npx tsx scripts/init-data.ts (ensure data files exist)
6. pnpm build (Astro SSG build succeeds)

After each run, if ANY step fails:
- Analyze the error
- Fix the root cause (not just symptoms)
- Re-run ALL steps from the beginning

Common final integration issues:
- Cross-package import errors
- Missing re-exports in shared/src/index.ts
- Astro build errors due to invalid data references
- React hydration issues
- CSS import problems with Tailwind v4
- Missing getStaticPaths or incorrect return types
- JSON data file format mismatches

ALSO verify project structure matches spec section 3:
- All directories exist
- All files listed in spec section 3 (lines 298-446) are present
- No extra files that aren't in the spec

Keep iterating until EVERY check passes with zero errors.
Report: total issues found, total fixed, final status of each check.`, {
  label: 'final-verify-loop',
  phase: 'Phase 5: Deploy & Integration',
})

log('Workflow complete. All phases executed.')

return {
  phase1: { skeleton: p1_skeleton, shared: p1_shared, dataInit: p1_data_init, verify: p1_verify },
  phase2: { github: p2_github, analysis: p2_analysis, pipeline: p2_pipeline, tests: p2_tests, verify: p2_verify },
  phase3: { foundation: p3_foundation, astroComponents: p3_astro_components, reactIslands: p3_react_islands, pages: p3_pages, verify: p3_verify },
  phase4: { ai: p4_ai, verify: p4_verify },
  phase5: { cicd: p5_cicd, seo: p5_seo, final: p5_final },
}
