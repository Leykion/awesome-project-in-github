// packages/shared/src/constants/ai-topics.ts
// AI 相关 GitHub 话题标签列表

/** AI 相关 GitHub 话题标签（用于 AI 相关性评分 Topic 匹配维度） */
export const AI_TOPICS = [
  // 通用 AI/ML
  "artificial-intelligence",
  "machine-learning",
  "deep-learning",
  "neural-network",
  "ai",
  "ml",

  // LLM 相关
  "llm",
  "large-language-model",
  "large-language-models",
  "language-model",
  "gpt",
  "chatgpt",
  "openai",
  "transformer",
  "transformers",
  "attention",

  // Agent 相关
  "ai-agent",
  "ai-agents",
  "agent",
  "autonomous-agents",
  "multi-agent",

  // RAG / 向量检索
  "rag",
  "retrieval-augmented-generation",
  "vector-database",
  "vector-search",
  "embedding",
  "embeddings",
  "similarity-search",

  // 框架/工具链
  "langchain",
  "llama-index",
  "prompt-engineering",
  "prompt",
  "fine-tuning",
  "finetuning",
  "lora",
  "qlora",

  // 推理/部署
  "inference",
  "model-serving",
  "onnx",
  "tensorrt",
  "triton",
  "vllm",

  // MLOps
  "mlops",
  "model-evaluation",
  "model-training",
  "experiment-tracking",

  // 多模态
  "multimodal",
  "computer-vision",
  "image-generation",
  "text-to-image",
  "speech-recognition",
  "text-to-speech",
  "stable-diffusion",
  "diffusion",

  // 数据/基准
  "dataset",
  "benchmark",
  "evaluation",
  "leaderboard",

  // NLP
  "nlp",
  "natural-language-processing",
  "text-generation",
  "chatbot",
  "conversational-ai",

  // 特定技术
  "pytorch",
  "tensorflow",
  "jax",
  "huggingface",
  "mcp",
  "model-context-protocol",
] as const;

export type AiTopic = (typeof AI_TOPICS)[number];

/** AI 相关 README 关键词（用于 AI 相关性评分关键词密度维度） */
export const AI_README_KEYWORDS = [
  "llm",
  "large language model",
  "gpt",
  "transformer",
  "neural network",
  "deep learning",
  "machine learning",
  "artificial intelligence",
  "embedding",
  "vector database",
  "rag",
  "retrieval augmented",
  "fine-tuning",
  "inference",
  "prompt",
  "agent",
  "chatbot",
  "nlp",
  "computer vision",
  "diffusion",
  "multimodal",
  "pytorch",
  "tensorflow",
  "hugging face",
  "openai",
  "langchain",
  "model serving",
  "tokenizer",
  "attention mechanism",
  "reinforcement learning",
] as const;

export type AiReadmeKeyword = (typeof AI_README_KEYWORDS)[number];
