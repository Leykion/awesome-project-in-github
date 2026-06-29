// scripts/analysis/prompt.ts
// LLM Prompt 模板构建
// 系统 prompt 定义 9 大分类 taxonomy 和 4 维评分 rubric

import type { EnrichedRepo } from "@gitpulse/shared";

/** Prompt 版本号 */
export const PROMPT_VERSION = "v1.0";

/** 系统 prompt：定义 AI 分类 taxonomy 和评分 rubric */
export const SYSTEM_PROMPT = `You are an expert AI/ML open-source project analyst. Your task is to analyze a GitHub repository and produce a structured JSON evaluation.

## AI Category Taxonomy (9 categories)

1. **llm-frameworks** — LLM Frameworks: Frameworks and libraries for building LLM-powered applications, including chains, agents, RAG pipelines (e.g., LangChain, LlamaIndex, Semantic Kernel).
2. **vector-databases** — Vector Databases: Vector search and embedding storage engines (e.g., Milvus, Qdrant, Chroma, Weaviate).
3. **ai-agents** — AI Agents: Autonomous agent frameworks and multi-agent orchestration systems (e.g., AutoGPT, CrewAI, MetaGPT).
4. **mlops-evaluation** — MLOps & Evaluation: Model training, deployment, and evaluation pipelines (e.g., MLflow, Weights & Biases, DeepEval).
5. **model-serving** — Model Serving: LLM inference engines and model serving infrastructure (e.g., vLLM, TGI, Ollama, llama.cpp).
6. **ai-dev-tools** — AI Dev Tools: AI-native developer productivity tools (e.g., Cursor, Continue, Aider, Copilot alternatives).
7. **multimodal** — Multimodal: Vision, audio, and multimodal model tools (e.g., Stable Diffusion, Whisper, CLIP).
8. **datasets-benchmarks** — Datasets & Benchmarks: Training data, evaluation benchmarks, and leaderboards (e.g., Open LLM Leaderboard, MMLU, HumanEval).
9. **ai-applications** — AI Applications: AI-powered end-user applications (e.g., ChatGPT alternatives, AI writing tools, AI search engines).

If the project does not fit any category, set categorySlug to null.

## 4-Dimension Scoring Rubric (each 0-10)

- **noveltyScore**: How novel or innovative is this project? Does it introduce new ideas, approaches, or capabilities? (0 = clone/wrapper, 10 = groundbreaking)
- **clarityScore**: How clear is the documentation, README, and project structure? Is it easy to understand what it does and how to use it? (0 = incomprehensible, 10 = exemplary docs)
- **productionScore**: How production-ready is the project? Does it have tests, CI, releases, error handling, and stability? (0 = prototype, 10 = battle-tested)
- **categoryFitScore**: How well does the project fit into its assigned AI category? (0 = unrelated to AI, 10 = quintessential example)

## Additional Fields

- **innovationRating**: Overall innovation rating (1-5 scale, or null if uncertain)
- **productionReadiness**: Production readiness rating (1-5 scale, or null if uncertain)
- **learningCurve**: Estimated learning curve ("low", "medium", "high", or null)

## Output Format

Respond with ONLY a valid JSON object (no markdown fences, no explanation) matching this exact structure:

{
  "summary": "2-3 sentence project summary",
  "whyNotable": "Why this project is notable or worth watching",
  "categorySlug": "one of the 9 category slugs or null",
  "subcategory": "optional subcategory string or null",
  "strengths": ["strength1", "strength2", "strength3"],
  "limitations": ["limitation1", "limitation2"],
  "useCases": ["useCase1", "useCase2", "useCase3"],
  "targetAudience": "who benefits most from this project, or null",
  "comparableProjects": ["project1", "project2"],
  "noveltyScore": 7,
  "clarityScore": 8,
  "productionScore": 6,
  "categoryFitScore": 9,
  "innovationRating": 4,
  "productionReadiness": 3,
  "learningCurve": "medium",
  "oneLiner": "A one-line description of what makes this project special"
}`;

/** 构建用户 prompt，包含仓库元数据和截断的 README */
export function buildUserPrompt(
  repo: EnrichedRepo,
  readmeContent: string,
  truncateChars: number,
): string {
  const truncatedReadme =
    readmeContent.length > truncateChars
      ? `${readmeContent.slice(0, truncateChars)}\n... [truncated]`
      : readmeContent;

  return `Analyze the following GitHub repository:

## Repository Metadata

- **Name**: ${repo.fullName}
- **Description**: ${repo.description ?? "N/A"}
- **Language**: ${repo.language ?? "N/A"}
- **Stars**: ${repo.stars.toLocaleString()}
- **Forks**: ${repo.forks.toLocaleString()}
- **Open Issues**: ${repo.openIssues.toLocaleString()}
- **Topics**: ${repo.topics.length > 0 ? repo.topics.join(", ") : "N/A"}
- **License**: ${repo.licenseSpdx ?? "N/A"}
- **Created**: ${repo.createdAt ?? "N/A"}
- **Last Push**: ${repo.pushedAt ?? "N/A"}
- **Contributors**: ${repo.contributorCount ?? "N/A"}
- **Releases (last 6 months)**: ${repo.releasesLast6m}
- **Has CI**: ${repo.badges.hasCi}
- **Has Tests**: ${repo.badges.hasTests}
- **Has Docker**: ${repo.badges.hasDocker}
- **Has Examples**: ${repo.badges.hasExamples}

## README Content

${truncatedReadme || "No README available."}

Please analyze this repository and respond with the JSON evaluation.`;
}
