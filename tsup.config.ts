import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "index.ts",
    tui: "tui.tsx",
  },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  outDir: "dist",
})
