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
      const json = await res.json();
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
          { role: "system", content: "You are a helpful assistant. Respond with a short JSON object: {\"status\": \"ok\", \"echo\": \"...first 20 chars of input...\"}" },
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
      const json = await res.json();
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

  console.log("\n=== 测试完成 ===");
}

testConnectivity().catch((err) => {
  console.error("测试脚本异常:", err);
  process.exit(1);
});
