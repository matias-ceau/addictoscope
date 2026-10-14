import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset URLs so the built app runs from any folder, a hospital
  // intranet share, or GitHub Pages.
  base: "./",
  plugins: [react()],
  worker: { format: "es" },
  build: { target: "es2022" },
  optimizeDeps: { exclude: ["mupdf"] },
  test: { include: ["tests/**/*.test.ts"], testTimeout: 120_000 },
});
