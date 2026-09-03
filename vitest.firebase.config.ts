import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    hookTimeout: 20_000,
    include: ["tests/firebase/**/*.test.ts"],
    setupFiles: ["./tests/firebase/setup.ts"],
    testTimeout: 20_000,
  },
});
