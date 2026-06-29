// scripts/analysis/schema.test.ts
// Zod schema 验证单元测试：验证 LLM 输出的 JSON 结构

import { LLMOutputSchema } from "@gitpulse/shared";
import { describe, expect, it } from "vitest";
import { parseLLMOutput } from "./schema";

/** 构造有效的 LLM 输出 JSON */
function makeValidLLMOutput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    summary: "A powerful LLM framework for building AI applications.",
    whyNotable: "Rapidly growing with 10k+ stars and active community.",
    categorySlug: "llm-frameworks",
    subcategory: "orchestration",
    strengths: ["Active community", "Good documentation", "Production-ready"],
    limitations: ["Steep learning curve", "Heavy dependencies"],
    useCases: ["RAG pipelines", "AI chatbots", "Document processing"],
    targetAudience: "AI/ML engineers building LLM applications",
    comparableProjects: ["LangChain", "LlamaIndex"],
    noveltyScore: 7,
    clarityScore: 8,
    productionScore: 6,
    categoryFitScore: 9,
    innovationRating: 4,
    productionReadiness: 3,
    learningCurve: "medium",
    oneLiner: "The go-to framework for LLM application development",
    ...overrides,
  };
}

describe("LLMOutputSchema", () => {
  describe("有效输入验证", () => {
    it("完整有效的 LLM 输出应通过验证", () => {
      const data = makeValidLLMOutput();
      const result = LLMOutputSchema.parse(data);
      expect(result.summary).toBe(data.summary);
      expect(result.noveltyScore).toBe(7);
      expect(result.categorySlug).toBe("llm-frameworks");
    });

    it("categorySlug 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ categorySlug: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.categorySlug).toBeNull();
    });

    it("subcategory 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ subcategory: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.subcategory).toBeNull();
    });

    it("targetAudience 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ targetAudience: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.targetAudience).toBeNull();
    });

    it("oneLiner 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ oneLiner: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.oneLiner).toBeNull();
    });

    it("innovationRating 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ innovationRating: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.innovationRating).toBeNull();
    });

    it("productionReadiness 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ productionReadiness: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.productionReadiness).toBeNull();
    });

    it("learningCurve 为 null 时应通过验证", () => {
      const data = makeValidLLMOutput({ learningCurve: null });
      const result = LLMOutputSchema.parse(data);
      expect(result.learningCurve).toBeNull();
    });

    it("空数组字段应通过验证", () => {
      const data = makeValidLLMOutput({
        strengths: [],
        limitations: [],
        useCases: [],
        comparableProjects: [],
      });
      const result = LLMOutputSchema.parse(data);
      expect(result.strengths).toEqual([]);
      expect(result.limitations).toEqual([]);
      expect(result.useCases).toEqual([]);
      expect(result.comparableProjects).toEqual([]);
    });

    it("评分边界值 0 应通过验证", () => {
      const data = makeValidLLMOutput({
        noveltyScore: 0,
        clarityScore: 0,
        productionScore: 0,
        categoryFitScore: 0,
      });
      const result = LLMOutputSchema.parse(data);
      expect(result.noveltyScore).toBe(0);
    });

    it("评分边界值 10 应通过验证", () => {
      const data = makeValidLLMOutput({
        noveltyScore: 10,
        clarityScore: 10,
        productionScore: 10,
        categoryFitScore: 10,
      });
      const result = LLMOutputSchema.parse(data);
      expect(result.noveltyScore).toBe(10);
    });

    it("innovationRating 边界值 1 和 5 应通过验证", () => {
      const data1 = makeValidLLMOutput({ innovationRating: 1 });
      const data5 = makeValidLLMOutput({ innovationRating: 5 });
      expect(LLMOutputSchema.parse(data1).innovationRating).toBe(1);
      expect(LLMOutputSchema.parse(data5).innovationRating).toBe(5);
    });

    it("productionReadiness 边界值 1 和 5 应通过验证", () => {
      const data1 = makeValidLLMOutput({ productionReadiness: 1 });
      const data5 = makeValidLLMOutput({ productionReadiness: 5 });
      expect(LLMOutputSchema.parse(data1).productionReadiness).toBe(1);
      expect(LLMOutputSchema.parse(data5).productionReadiness).toBe(5);
    });

    it("learningCurve 所有合法值应通过验证", () => {
      for (const value of ["low", "medium", "high"]) {
        const data = makeValidLLMOutput({ learningCurve: value });
        expect(LLMOutputSchema.parse(data).learningCurve).toBe(value);
      }
    });

    it("所有 9 个分类 slug 应通过验证", () => {
      const slugs = [
        "llm-frameworks",
        "vector-databases",
        "ai-agents",
        "mlops-evaluation",
        "model-serving",
        "ai-dev-tools",
        "multimodal",
        "datasets-benchmarks",
        "ai-applications",
      ];
      for (const slug of slugs) {
        const data = makeValidLLMOutput({ categorySlug: slug });
        expect(LLMOutputSchema.parse(data).categorySlug).toBe(slug);
      }
    });
  });

  describe("无效输入验证", () => {
    it("缺少必要字段 summary 应抛出错误", () => {
      const data = makeValidLLMOutput();
      const { summary: _, ...withoutSummary } = data;
      expect(() => LLMOutputSchema.parse(withoutSummary)).toThrow();
    });

    it("缺少必要字段 whyNotable 应抛出错误", () => {
      const data = makeValidLLMOutput();
      const { whyNotable: _, ...withoutWhyNotable } = data;
      expect(() => LLMOutputSchema.parse(withoutWhyNotable)).toThrow();
    });

    it("缺少评分字段 noveltyScore 应抛出错误", () => {
      const data = makeValidLLMOutput();
      const { noveltyScore: _, ...withoutNovelty } = data;
      expect(() => LLMOutputSchema.parse(withoutNovelty)).toThrow();
    });

    it("noveltyScore 超过 10 应抛出错误", () => {
      const data = makeValidLLMOutput({ noveltyScore: 11 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("noveltyScore 小于 0 应抛出错误", () => {
      const data = makeValidLLMOutput({ noveltyScore: -1 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("clarityScore 超过 10 应抛出错误", () => {
      const data = makeValidLLMOutput({ clarityScore: 15 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("productionScore 小于 0 应抛出错误", () => {
      const data = makeValidLLMOutput({ productionScore: -5 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("categoryFitScore 超过 10 应抛出错误", () => {
      const data = makeValidLLMOutput({ categoryFitScore: 100 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("innovationRating 超过 5 应抛出错误", () => {
      const data = makeValidLLMOutput({ innovationRating: 6 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("innovationRating 小于 1 应抛出错误", () => {
      const data = makeValidLLMOutput({ innovationRating: 0 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("productionReadiness 超过 5 应抛出错误", () => {
      const data = makeValidLLMOutput({ productionReadiness: 10 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("productionReadiness 小于 1 应抛出错误", () => {
      const data = makeValidLLMOutput({ productionReadiness: 0 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("learningCurve 非法值应抛出错误", () => {
      const data = makeValidLLMOutput({ learningCurve: "extreme" });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("strengths 不是数组应抛出错误", () => {
      const data = makeValidLLMOutput({ strengths: "not an array" });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("limitations 不是数组应抛出错误", () => {
      const data = makeValidLLMOutput({ limitations: 42 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("summary 不是字符串应抛出错误", () => {
      const data = makeValidLLMOutput({ summary: 123 });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("noveltyScore 不是数字应抛出错误", () => {
      const data = makeValidLLMOutput({ noveltyScore: "seven" });
      expect(() => LLMOutputSchema.parse(data)).toThrow();
    });

    it("完全空对象应抛出错误", () => {
      expect(() => LLMOutputSchema.parse({})).toThrow();
    });

    it("null 输入应抛出错误", () => {
      expect(() => LLMOutputSchema.parse(null)).toThrow();
    });

    it("字符串输入应抛出错误", () => {
      expect(() => LLMOutputSchema.parse("not json")).toThrow();
    });
  });
});

describe("parseLLMOutput", () => {
  describe("JSON 解析", () => {
    it("纯 JSON 字符串应正确解析", () => {
      const data = makeValidLLMOutput();
      const result = parseLLMOutput(JSON.stringify(data));
      expect(result.summary).toBe(data.summary);
      expect(result.noveltyScore).toBe(7);
    });

    it("带 ```json 代码块包裹应正确解析", () => {
      const data = makeValidLLMOutput();
      const wrapped = `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
      const result = parseLLMOutput(wrapped);
      expect(result.summary).toBe(data.summary);
    });

    it("带 ``` 代码块包裹（无 json 标记）应正确解析", () => {
      const data = makeValidLLMOutput();
      const wrapped = `\`\`\`\n${JSON.stringify(data, null, 2)}\n\`\`\``;
      const result = parseLLMOutput(wrapped);
      expect(result.summary).toBe(data.summary);
    });

    it("前后有空白的 JSON 应正确解析", () => {
      const data = makeValidLLMOutput();
      const padded = `\n\n  ${JSON.stringify(data)}  \n\n`;
      const result = parseLLMOutput(padded);
      expect(result.summary).toBe(data.summary);
    });

    it("无效 JSON 字符串应抛出 SyntaxError", () => {
      expect(() => parseLLMOutput("not valid json")).toThrow();
    });

    it("有效 JSON 但不符合 schema 应抛出 Zod 错误", () => {
      const invalid = JSON.stringify({ foo: "bar" });
      expect(() => parseLLMOutput(invalid)).toThrow();
    });

    it("空字符串应抛出错误", () => {
      expect(() => parseLLMOutput("")).toThrow();
    });

    it("仅包含代码块标记应抛出错误", () => {
      expect(() => parseLLMOutput("```json\n```")).toThrow();
    });
  });

  describe("字段保真度", () => {
    it("应保持所有字段值不变", () => {
      const data = makeValidLLMOutput({
        noveltyScore: 3,
        clarityScore: 9,
        productionScore: 1,
        categoryFitScore: 10,
        innovationRating: 2,
        productionReadiness: 5,
        learningCurve: "high",
      });
      const result = parseLLMOutput(JSON.stringify(data));
      expect(result.noveltyScore).toBe(3);
      expect(result.clarityScore).toBe(9);
      expect(result.productionScore).toBe(1);
      expect(result.categoryFitScore).toBe(10);
      expect(result.innovationRating).toBe(2);
      expect(result.productionReadiness).toBe(5);
      expect(result.learningCurve).toBe("high");
    });

    it("应保持数组内容不变", () => {
      const data = makeValidLLMOutput({
        strengths: ["a", "b"],
        limitations: ["c"],
        useCases: ["d", "e", "f"],
        comparableProjects: ["proj1"],
      });
      const result = parseLLMOutput(JSON.stringify(data));
      expect(result.strengths).toEqual(["a", "b"]);
      expect(result.limitations).toEqual(["c"]);
      expect(result.useCases).toEqual(["d", "e", "f"]);
      expect(result.comparableProjects).toEqual(["proj1"]);
    });

    it("所有 nullable 字段为 null 时应正确解析", () => {
      const data = makeValidLLMOutput({
        categorySlug: null,
        subcategory: null,
        targetAudience: null,
        innovationRating: null,
        productionReadiness: null,
        learningCurve: null,
        oneLiner: null,
      });
      const result = parseLLMOutput(JSON.stringify(data));
      expect(result.categorySlug).toBeNull();
      expect(result.subcategory).toBeNull();
      expect(result.targetAudience).toBeNull();
      expect(result.innovationRating).toBeNull();
      expect(result.productionReadiness).toBeNull();
      expect(result.learningCurve).toBeNull();
      expect(result.oneLiner).toBeNull();
    });
  });
});
