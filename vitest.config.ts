import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // 本番 (Vercel/Linux) は UTC 環境。JST との跨ぎ日付バグを CI で再現させる。
    env: { TZ: "UTC" },
  },
});
