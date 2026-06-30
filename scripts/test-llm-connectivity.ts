// scripts/test-llm-connectivity.ts
// 最小化 LLM API 连通性测试，不依赖项目代码

const BASE_URL = process.env.LLM_BASE_URL;
const API_KEY = process.env.LLM_API_KEY;
const MODEL = process.env.LLM_MODEL;

if (!BASE_URL || !API_KEY || !MODEL) {
  console.error("需要设置 LLM_BASE_URL, LLM_API_KEY, LLM_MODEL 环境变量");
  process.exit(1);
}

const endpoint = `${BASE_URL.replace(/\/+$/, "")}/chat/completions`;

async function testConnectivity() {
  console.log("=== LLM API 连通性测试 ===");
  console.log(`端点: ${endpoint}`);
  console.log(`模型: ${MODEL}`);
  console.log("");

  // 测试 1: 最小请求
  console.log("--- 测试 1: 最小化请求 (max_tokens=5) ---");
  const startTime = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 5,
        messages: [{ role: "user", content: "Say hi" }],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP 状态: ${res.status}`);
    console.log(`耗时: ${elapsed}ms`);

    if (!res.ok) {
      const text = await res.text();
      console.log(`响应体: ${text.slice(0, 500)}`);
      console.log("结果: FAIL (HTTP 错误)");
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: test script
      const json = (await res.json()) as any;
      const content = json.choices?.[0]?.message?.content ?? "(无内容)";
      console.log(`响应: ${content}`);
      console.log(`usage: ${JSON.stringify(json.usage)}`);
      console.log("结果: PASS");
    }
  } catch (err) {
    const elapsed = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    console.log(`耗时: ${elapsed}ms`);
    console.log(`错误类型: ${name}`);
    console.log(`错误信息: ${message}`);
    console.log("结果: FAIL (网络错误)");
  }

  console.log("");

  // 测试 2: 模拟实际负载大小的请求
  console.log("--- 测试 2: 模拟实际负载 (inputChars ~7000, max_tokens=1024) ---");
  const padding = "This is a test repository with various features. ".repeat(120);
  const startTime2 = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              'You are a helpful assistant. Respond with a short JSON object: {"status": "ok", "echo": "...first 20 chars of input..."}',
          },
          { role: "user", content: `Analyze this: ${padding}` },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    const elapsed = Date.now() - startTime2;
    console.log(`HTTP 状态: ${res.status}`);
    console.log(`耗时: ${elapsed}ms`);

    if (!res.ok) {
      const text = await res.text();
      console.log(`响应体: ${text.slice(0, 500)}`);
      console.log("结果: FAIL (HTTP 错误)");
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: test script
      const json = (await res.json()) as any;
      const content = json.choices?.[0]?.message?.content ?? "(无内容)";
      console.log(`响应: ${content.slice(0, 200)}`);
      console.log(`usage: ${JSON.stringify(json.usage)}`);
      console.log("结果: PASS");
    }
  } catch (err) {
    const elapsed = Date.now() - startTime2;
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    console.log(`耗时: ${elapsed}ms`);
    console.log(`错误类型: ${name}`);
    console.log(`错误信息: ${message}`);
    console.log("结果: FAIL (网络错误)");
  }

  // 测试 3: 用原生 fetch 发送与 pipeline 完全相同的 prompt
  console.log("--- 测试 3: 模拟 pipeline 真实 prompt (原生 fetch) ---");
  const realSystemPrompt = `You are an expert AI/ML open-source project analyst. Your task is to analyze a GitHub repository and produce a structured JSON evaluation.

## AI Category Taxonomy (9 categories)

1. **llm-frameworks** — LLM Frameworks
2. **vector-databases** — Vector Databases
3. **ai-agents** — AI Agents
4. **mlops-evaluation** — MLOps & Evaluation
5. **model-serving** — Model Serving
6. **ai-dev-tools** — AI Dev Tools
7. **multimodal** — Multimodal
8. **datasets-benchmarks** — Datasets & Benchmarks
9. **ai-applications** — AI Applications

## 4-Dimension Scoring Rubric (each 0-10)
- **noveltyScore**: How novel or innovative is this project?
- **clarityScore**: How clear is the documentation?
- **productionScore**: How production-ready is the project?
- **categoryFitScore**: How well does it fit its assigned AI category?

## Output Format
Respond with ONLY a valid JSON object:
{
  "summary": "2-3 sentence summary",
  "whyNotable": "why notable",
  "categorySlug": "one of the 9 slugs or null",
  "subcategory": "optional or null",
  "strengths": ["s1", "s2"],
  "limitations": ["l1"],
  "useCases": ["u1", "u2"],
  "targetAudience": "who benefits",
  "comparableProjects": ["p1"],
  "noveltyScore": 7,
  "clarityScore": 8,
  "productionScore": 6,
  "categoryFitScore": 9,
  "innovationRating": 4,
  "productionReadiness": 3,
  "learningCurve": "medium",
  "oneLiner": "one-line description"
}`;

  const realUserPrompt = `Analyze the following GitHub repository:

## Repository Metadata
- **Name**: langchain-ai/langchain
- **Description**: Build context-aware reasoning applications
- **Language**: Python
- **Stars**: 98,000
- **Forks**: 15,000
- **Open Issues**: 200
- **Topics**: llm, langchain, ai, machine-learning
- **License**: MIT
- **Created**: 2022-10-01
- **Last Push**: 2024-01-15
- **Contributors**: 500
- **Releases (last 6 months)**: 12
- **Has CI**: true
- **Has Tests**: true
- **Has Docker**: true
- **Has Examples**: true

## README Content
# LangChain
Build context-aware reasoning applications. LangChain is a framework for developing applications powered by large language models (LLMs). It provides tools for chains, agents, and retrieval-augmented generation (RAG).

Please analyze this repository and respond with the JSON evaluation.`;

  console.log(`inputChars: ${realSystemPrompt.length + realUserPrompt.length}`);
  const startTime3 = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: realSystemPrompt },
          { role: "user", content: realUserPrompt },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    const elapsed = Date.now() - startTime3;
    console.log(`HTTP 状态: ${res.status}`);
    console.log(`耗时: ${elapsed}ms`);

    if (!res.ok) {
      const text = await res.text();
      console.log(`响应体: ${text.slice(0, 500)}`);
      console.log("结果: FAIL (HTTP 错误)");
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: test script
      const json = (await res.json()) as any;
      const content = json.choices?.[0]?.message?.content ?? "(无内容)";
      console.log(`响应 (前 300 字符): ${content.slice(0, 300)}`);
      console.log(`usage: ${JSON.stringify(json.usage)}`);
      console.log("结果: PASS");
    }
  } catch (err) {
    const elapsed = Date.now() - startTime3;
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    console.log(`耗时: ${elapsed}ms`);
    console.log(`错误类型: ${name}`);
    console.log(`错误信息: ${message}`);
    console.log("结果: FAIL (网络错误)");
  }

  console.log("");

  // 测试 4: 用 openai SDK 发送相同的 prompt（复现 pipeline 行为）
  console.log("--- 测试 4: 用 openai SDK 发送相同 prompt ---");
  const startTime4 = Date.now();
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
      timeout: 120_000,
      maxRetries: 0,
    });

    const response = await client.chat.completions.create({
      model: MODEL as string,
      temperature: 0.2,
      max_tokens: 1024,
      messages: [
        { role: "system", content: realSystemPrompt },
        { role: "user", content: realUserPrompt },
      ],
    });

    const elapsed = Date.now() - startTime4;
    const content = response.choices[0]?.message?.content ?? "(无内容)";
    console.log(`耗时: ${elapsed}ms`);
    console.log(`响应 (前 300 字符): ${content.slice(0, 300)}`);
    console.log(`usage: ${JSON.stringify(response.usage)}`);
    console.log("结果: PASS");
  } catch (err) {
    const elapsed = Date.now() - startTime4;
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.constructor.name : typeof err;
    console.log(`耗时: ${elapsed}ms`);
    console.log(`错误类型: ${name}`);
    console.log(`错误信息: ${message}`);
    console.log("结果: FAIL");
  }

  console.log("\n=== 测试完成 ===");
}

testConnectivity().catch((err) => {
  console.error("测试脚本异常:", err);
  process.exit(1);
});
