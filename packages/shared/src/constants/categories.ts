// packages/shared/src/constants/categories.ts（种子数据定义，与 JSON 初始化脚本共用）

import type { CategoryData } from "../types/data-files";

export const CATEGORY_SEEDS: Omit<CategoryData, "repoCount" | "topRepos">[] = [
  {
    slug: "llm-frameworks",
    name: "LLM Frameworks",
    description: "构建 LLM 驱动应用的框架和库，包括 Chain、Agent、RAG 管道",
    icon: "🔗",
    sortOrder: 1,
  },
  {
    slug: "vector-databases",
    name: "Vector Databases",
    description: "向量搜索和嵌入存储引擎",
    icon: "🗄️",
    sortOrder: 2,
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    description: "自主代理框架和多代理编排系统",
    icon: "🤖",
    sortOrder: 3,
  },
  {
    slug: "mlops-evaluation",
    name: "MLOps & Evaluation",
    description: "模型训练、部署、评估管道",
    icon: "📊",
    sortOrder: 4,
  },
  {
    slug: "model-serving",
    name: "Model Serving",
    description: "LLM 推理引擎和模型服务基础设施",
    icon: "⚡",
    sortOrder: 5,
  },
  {
    slug: "ai-dev-tools",
    name: "AI Dev Tools",
    description: "AI 原生开发者生产力工具",
    icon: "🛠️",
    sortOrder: 6,
  },
  {
    slug: "multimodal",
    name: "Multimodal",
    description: "视觉、音频和多模态模型工具",
    icon: "👁️",
    sortOrder: 7,
  },
  {
    slug: "datasets-benchmarks",
    name: "Datasets & Benchmarks",
    description: "训练数据、评估基准和排行榜",
    icon: "📋",
    sortOrder: 8,
  },
  {
    slug: "ai-applications",
    name: "AI Applications",
    description: "AI 驱动的终端用户应用",
    icon: "💡",
    sortOrder: 9,
  },
];
