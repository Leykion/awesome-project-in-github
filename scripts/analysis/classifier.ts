// scripts/analysis/classifier.ts
// 规则分类器（LLM 后备）
// 基于 topics 和关键词将仓库分类到 9 大 AI 分类

import type { EnrichedRepo } from "@gitpulse/shared";
import { CATEGORY_SEEDS } from "@gitpulse/shared";

/** 分类规则定义：topic 信号、关键词信号、语言偏好 */
interface CategoryRule {
  slug: string;
  topicSignals: string[];
  keywordSignals: string[];
  languagePreference: string[];
}

/** 9 大分类的规则匹配定义 */
const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: "llm-frameworks",
    topicSignals: [
      "langchain",
      "llama-index",
      "llm",
      "large-language-model",
      "rag",
      "retrieval-augmented-generation",
      "prompt-engineering",
      "prompt",
      "chain",
      "semantic-kernel",
    ],
    keywordSignals: [
      "langchain",
      "llama-index",
      "llamaindex",
      "rag",
      "retrieval augmented",
      "prompt engineering",
      "chain",
      "llm framework",
      "orchestration",
    ],
    languagePreference: ["python", "typescript", "javascript"],
  },
  {
    slug: "vector-databases",
    topicSignals: [
      "vector-database",
      "vector-search",
      "embedding",
      "embeddings",
      "similarity-search",
      "vector-store",
    ],
    keywordSignals: [
      "vector database",
      "vector search",
      "embedding",
      "similarity search",
      "vector store",
      "nearest neighbor",
      "ann",
      "hnsw",
      "faiss",
      "milvus",
      "qdrant",
      "chroma",
      "weaviate",
      "pinecone",
    ],
    languagePreference: ["python", "rust", "go", "c++"],
  },
  {
    slug: "ai-agents",
    topicSignals: [
      "ai-agent",
      "ai-agents",
      "agent",
      "autonomous-agents",
      "multi-agent",
      "autogpt",
      "crewai",
    ],
    keywordSignals: [
      "ai agent",
      "autonomous agent",
      "multi-agent",
      "autogpt",
      "crewai",
      "metagpt",
      "agent framework",
      "tool use",
      "function calling",
      "agentic",
      "agent orchestration",
    ],
    languagePreference: ["python", "typescript", "javascript"],
  },
  {
    slug: "mlops-evaluation",
    topicSignals: [
      "mlops",
      "model-evaluation",
      "model-training",
      "experiment-tracking",
      "evaluation",
      "benchmark",
    ],
    keywordSignals: [
      "mlops",
      "model evaluation",
      "experiment tracking",
      "model training",
      "mlflow",
      "wandb",
      "weights & biases",
      "deepeval",
      "evaluation framework",
      "model monitoring",
      "feature store",
      "data pipeline",
    ],
    languagePreference: ["python"],
  },
  {
    slug: "model-serving",
    topicSignals: ["inference", "model-serving", "vllm", "onnx", "tensorrt", "triton", "llama-cpp"],
    keywordSignals: [
      "inference",
      "model serving",
      "vllm",
      "llama.cpp",
      "ollama",
      "tgi",
      "text generation inference",
      "onnx",
      "tensorrt",
      "triton",
      "quantization",
      "gguf",
      "ggml",
      "serving engine",
    ],
    languagePreference: ["python", "c++", "rust", "go"],
  },
  {
    slug: "ai-dev-tools",
    topicSignals: [
      "ai",
      "developer-tools",
      "code-generation",
      "copilot",
      "code-assistant",
      "mcp",
      "model-context-protocol",
    ],
    keywordSignals: [
      "ai dev tool",
      "code generation",
      "copilot",
      "cursor",
      "aider",
      "continue",
      "code assistant",
      "ai coding",
      "developer productivity",
      "code completion",
      "ai ide",
      "mcp",
      "model context protocol",
    ],
    languagePreference: ["typescript", "python", "rust"],
  },
  {
    slug: "multimodal",
    topicSignals: [
      "multimodal",
      "computer-vision",
      "image-generation",
      "text-to-image",
      "speech-recognition",
      "text-to-speech",
      "stable-diffusion",
      "diffusion",
    ],
    keywordSignals: [
      "multimodal",
      "computer vision",
      "image generation",
      "text to image",
      "stable diffusion",
      "diffusion",
      "whisper",
      "clip",
      "speech recognition",
      "text to speech",
      "image segmentation",
      "object detection",
      "vision language",
      "visual",
    ],
    languagePreference: ["python"],
  },
  {
    slug: "datasets-benchmarks",
    topicSignals: ["dataset", "benchmark", "evaluation", "leaderboard"],
    keywordSignals: [
      "dataset",
      "benchmark",
      "leaderboard",
      "evaluation benchmark",
      "mmlu",
      "humaneval",
      "training data",
      "evaluation dataset",
      "test suite",
      "data collection",
    ],
    languagePreference: ["python"],
  },
  {
    slug: "ai-applications",
    topicSignals: ["chatbot", "conversational-ai", "ai", "chatgpt", "gpt"],
    keywordSignals: [
      "ai application",
      "chatbot",
      "ai chat",
      "ai search",
      "ai writing",
      "ai assistant",
      "chatgpt alternative",
      "ai app",
      "ai-powered",
      "generative ai",
    ],
    languagePreference: ["typescript", "python", "javascript"],
  },
];

/**
 * 基于规则的仓库分类器
 * 通过 topics、描述、语言等信号匹配最合适的分类
 * @returns 匹配的分类 slug，无匹配时返回 null
 */
export function classifyRepo(repo: EnrichedRepo): string | null {
  const topicsLower = repo.topics.map((t) => t.toLowerCase());
  const descLower = (repo.description ?? "").toLowerCase();
  const langLower = (repo.language ?? "").toLowerCase();

  let bestSlug: string | null = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    // Topic 信号匹配（每个匹配 +3 分）
    for (const signal of rule.topicSignals) {
      if (topicsLower.includes(signal.toLowerCase())) {
        score += 3;
      }
    }

    // 关键词信号匹配（描述中每个匹配 +2 分）
    for (const keyword of rule.keywordSignals) {
      if (descLower.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // 语言偏好匹配（+1 分）
    if (langLower && rule.languagePreference.map((l) => l.toLowerCase()).includes(langLower)) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSlug = rule.slug;
    }
  }

  // 最低匹配阈值：至少需要 3 分才认为有效分类
  if (bestScore < 3) {
    return null;
  }

  // 验证 slug 是否在已定义的分类中
  const validSlugs = CATEGORY_SEEDS.map((c) => c.slug);
  if (bestSlug && !validSlugs.includes(bestSlug)) {
    return null;
  }

  return bestSlug;
}
