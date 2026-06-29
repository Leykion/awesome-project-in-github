// packages/shared/src/constants/languages.ts
// 编程语言列表 + GitHub 颜色映射

/** 数据管道抓取的编程语言列表 */
export const SCRAPE_LANGUAGES = [
  "python",
  "typescript",
  "javascript",
  "rust",
  "go",
  "c++",
  "java",
  "kotlin",
  "swift",
] as const;

export type ScrapeLanguage = (typeof SCRAPE_LANGUAGES)[number];

/** GitHub 语言颜色映射（与 GitHub linguist 保持一致） */
export const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Rust: "#DEA584",
  Go: "#00ADD8",
  "C++": "#F34B7D",
  Java: "#B07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Scala: "#C22D40",
  Shell: "#89E051",
  Lua: "#000080",
  R: "#198CE7",
  Julia: "#A270BA",
  Dart: "#00B4AB",
  Jupyter: "#F37626",
  "Jupyter Notebook": "#DA5B0B",
  Zig: "#EC915C",
  Elixir: "#6E4A7E",
  Haskell: "#5E5086",
  OCaml: "#3BE133",
  Nim: "#FFC200",
  V: "#4F87C4",
  Cuda: "#3A4E3A",
};

/** 获取语言颜色，无匹配时返回默认灰色 */
export function getLanguageColor(language: string | null): string {
  if (!language) return "#8B8B8B";
  return LANGUAGE_COLORS[language] ?? "#8B8B8B";
}
