// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["scripts/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
