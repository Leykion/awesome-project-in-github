// scripts/analysis/classifier.test.ts
// 规则分类器单元测试

import type { EnrichedRepo } from "@gitpulse/shared";
import { describe, expect, it } from "vitest";
import { classifyRepo } from "./classifier";

/** 构造完整的 EnrichedRepo 测试数据 */
function makeEnrichedRepo(overrides: Partial<EnrichedRepo> = {}): EnrichedRepo {
  return {
    owner: "test",
    name: "repo",
    fullName: "test/repo",
    description: null,
    language: null,
    languageColor: null,
    stars: 1000,
    forks: 100,
    starsGained: null,
    forksGained: null,
    url: "https://github.com/test/repo",
    trendingSince: null,
    trendingLanguage: null,
    id: 1,
    homepageUrl: null,
    topics: [],
    licenseSpdx: null,
    licenseName: null,
    isFork: false,
    isArchived: false,
    defaultBranch: "main",
    openIssues: 10,
    watchers: 50,
    createdAt: null,
    pushedAt: null,
    githubUpdatedAt: null,
    contributorCount: null,
    readmeSizeBytes: null,
    releasesLast6m: 0,
    avgIssueCloseDays: null,
    healthPercentage: null,
    badges: {
      hasExamples: false,
      hasCi: false,
      hasReleases: false,
      hasTests: false,
      hasDocker: false,
      hasPypi: false,
      hasNpm: false,
      hasMcp: false,
    },
    ...overrides,
  };
}

describe("classifier", () => {
  describe("LLM Frameworks 分类", () => {
    it("含 langchain/llm/rag topics 应分类为 llm-frameworks", () => {
      const repo = makeEnrichedRepo({
        topics: ["langchain", "llm", "rag"],
        description: "LLM orchestration framework",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("llm-frameworks");
    });

    it("描述含 llm framework 关键词应分类为 llm-frameworks", () => {
      const repo = makeEnrichedRepo({
        topics: [],
        description: "A langchain-based llm framework for RAG applications",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("llm-frameworks");
    });
  });

  describe("Vector Databases 分类", () => {
    it("含 vector-database/embedding topics 应分类为 vector-databases", () => {
      const repo = makeEnrichedRepo({
        topics: ["vector-database", "embedding", "similarity-search"],
        language: "Rust",
      });
      expect(classifyRepo(repo)).toBe("vector-databases");
    });

    it("描述含 vector search/milvus 等关键词应分类为 vector-databases", () => {
      const repo = makeEnrichedRepo({
        description: "A high-performance vector database similar to milvus with hnsw indexing",
        language: "Rust",
      });
      expect(classifyRepo(repo)).toBe("vector-databases");
    });
  });

  describe("AI Agents 分类", () => {
    it("含 ai-agent/multi-agent topics 应分类为 ai-agents", () => {
      const repo = makeEnrichedRepo({
        topics: ["ai-agent", "multi-agent", "autonomous-agents"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("ai-agents");
    });

    it("描述含 autonomous agent/crewai 关键词应分类为 ai-agents", () => {
      const repo = makeEnrichedRepo({
        description: "An autonomous agent framework like crewai for multi-agent orchestration",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("ai-agents");
    });
  });

  describe("MLOps & Evaluation 分类", () => {
    it("含 mlops/model-evaluation topics 应分类为 mlops-evaluation", () => {
      const repo = makeEnrichedRepo({
        topics: ["mlops", "model-evaluation", "experiment-tracking"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("mlops-evaluation");
    });

    it("描述含 mlflow/wandb 关键词应分类为 mlops-evaluation", () => {
      const repo = makeEnrichedRepo({
        description:
          "MLOps platform similar to mlflow for experiment tracking and model evaluation",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("mlops-evaluation");
    });
  });

  describe("Model Serving 分类", () => {
    it("含 inference/vllm topics 应分类为 model-serving", () => {
      const repo = makeEnrichedRepo({
        topics: ["inference", "vllm", "model-serving"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("model-serving");
    });

    it("描述含 llama.cpp/quantization 关键词应分类为 model-serving", () => {
      const repo = makeEnrichedRepo({
        description: "Fast inference engine based on llama.cpp with gguf quantization support",
        language: "C++",
      });
      expect(classifyRepo(repo)).toBe("model-serving");
    });
  });

  describe("AI Dev Tools 分类", () => {
    it("含 code-generation/copilot/mcp topics 应分类为 ai-dev-tools", () => {
      const repo = makeEnrichedRepo({
        topics: ["code-generation", "copilot", "mcp"],
        language: "TypeScript",
      });
      expect(classifyRepo(repo)).toBe("ai-dev-tools");
    });

    it("描述含 code assistant/ai coding 关键词应分类为 ai-dev-tools", () => {
      const repo = makeEnrichedRepo({
        description: "An AI code assistant for developer productivity with code completion",
        language: "TypeScript",
      });
      expect(classifyRepo(repo)).toBe("ai-dev-tools");
    });
  });

  describe("Multimodal 分类", () => {
    it("含 multimodal/computer-vision topics 应分类为 multimodal", () => {
      const repo = makeEnrichedRepo({
        topics: ["multimodal", "computer-vision", "image-generation"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("multimodal");
    });

    it("描述含 stable diffusion/text to image 关键词应分类为 multimodal", () => {
      const repo = makeEnrichedRepo({
        description:
          "A stable diffusion model for text to image generation with vision language capabilities",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("multimodal");
    });
  });

  describe("Datasets & Benchmarks 分类", () => {
    it("含 dataset/benchmark/leaderboard topics 应分类为 datasets-benchmarks", () => {
      const repo = makeEnrichedRepo({
        topics: ["dataset", "benchmark", "leaderboard"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("datasets-benchmarks");
    });

    it("描述含 evaluation benchmark/training data 关键词应分类为 datasets-benchmarks", () => {
      const repo = makeEnrichedRepo({
        description: "An evaluation benchmark and leaderboard for LLM training data quality",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("datasets-benchmarks");
    });
  });

  describe("AI Applications 分类", () => {
    it("含 chatbot/conversational-ai topics 应分类为 ai-applications", () => {
      const repo = makeEnrichedRepo({
        topics: ["chatbot", "conversational-ai", "chatgpt"],
        language: "TypeScript",
      });
      expect(classifyRepo(repo)).toBe("ai-applications");
    });

    it("描述含 chatgpt alternative/ai chat 关键词应分类为 ai-applications", () => {
      const repo = makeEnrichedRepo({
        description: "An open-source chatgpt alternative for ai chat and ai search applications",
        language: "TypeScript",
      });
      expect(classifyRepo(repo)).toBe("ai-applications");
    });
  });

  describe("无匹配分类", () => {
    it("无 AI 信号的仓库应返回 null", () => {
      const repo = makeEnrichedRepo({
        topics: ["web", "css", "html"],
        description: "A CSS framework for building responsive websites",
        language: "JavaScript",
      });
      expect(classifyRepo(repo)).toBeNull();
    });

    it("空 topics 和空描述应返回 null", () => {
      const repo = makeEnrichedRepo({
        topics: [],
        description: null,
        language: null,
      });
      expect(classifyRepo(repo)).toBeNull();
    });

    it("匹配分数低于阈值（<3）应返回 null", () => {
      // 仅语言匹配（+1 分）不足以达到 3 分阈值
      const repo = makeEnrichedRepo({
        topics: [],
        description: "A general utility library",
        language: "Python",
      });
      expect(classifyRepo(repo)).toBeNull();
    });
  });

  describe("分类优先级", () => {
    it("信号最强的分类应胜出", () => {
      // 多个分类都有匹配，但 ai-agents 的信号更强
      const repo = makeEnrichedRepo({
        topics: ["ai-agent", "multi-agent", "autonomous-agents", "ai"],
        description:
          "An autonomous agent framework for multi-agent orchestration with agentic tool use",
        language: "Python",
      });
      // ai-agents 的 topic 匹配最多（ai-agent +3, multi-agent +3, autonomous-agents +3, agent +3 = 12）
      // 加上关键词匹配（autonomous agent +2, multi-agent +2, agentic +2, tool use +2, agent orchestration +2 = 10）
      // ai-agents 总分应非常高
      expect(classifyRepo(repo)).toBe("ai-agents");
    });

    it("Topic 匹配权重（+3）应高于关键词匹配（+2）", () => {
      // 只有 topic 匹配的分类应优于只有关键词匹配的分类
      const repo = makeEnrichedRepo({
        topics: ["vector-database", "vector-search"],
        description: "A database with search capabilities",
        language: "Rust",
      });
      // vector-databases: topics 匹配 2 个 = +6，语言匹配 = +1 = 7
      expect(classifyRepo(repo)).toBe("vector-databases");
    });
  });

  describe("大小写不敏感", () => {
    it("topics 应大小写不敏感匹配", () => {
      const repo = makeEnrichedRepo({
        topics: ["LLM", "RAG", "Langchain"],
        language: "Python",
      });
      expect(classifyRepo(repo)).toBe("llm-frameworks");
    });

    it("描述应大小写不敏感匹配", () => {
      const repo = makeEnrichedRepo({
        description: "VECTOR DATABASE with EMBEDDING SEARCH using HNSW algorithm",
        language: "Rust",
      });
      expect(classifyRepo(repo)).toBe("vector-databases");
    });
  });
});
