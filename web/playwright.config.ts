import { defineConfig } from "@playwright/test";

/** PW_PORT: another port when 4173 is taken (reuseExistingServer would test whatever answers there). */
const port = Number(process.env.PW_PORT ?? 4173);

export default defineConfig({
  testDir: "e2e",
  timeout: 180_000,
  // Each test loads MuPDF, Tesseract and the NER model: run them one at a time.
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: { command: `npx vite build && npx vite preview --port ${port} --strictPort`, port, reuseExistingServer: true },
});
