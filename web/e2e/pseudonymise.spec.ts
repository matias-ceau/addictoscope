import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/anonymized");

test("drop, review and pseudonymise text and scanned PDFs without any network call", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:4173") && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url());
  });

  await page.goto("/");
  await expect(page.getByText("Glissez vos documents patient ici")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles([
    resolve(DATA, "synthetique-historique-csapa.pdf"),
    resolve(DATA, "synthetique-courrier-scanne.pdf"),
  ]);

  const cards = page.locator(".source-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).getByText(/À vérifier/)).toBeVisible({ timeout: 60_000 });
  await expect(cards.nth(1).getByText(/À vérifier/)).toBeVisible({ timeout: 90_000 });

  // The patient is recognised across both documents under the same pseudonym.
  await expect(page.locator(".entity .tag", { hasText: "[PATIENT]" })).toBeVisible();
  await expect(page.locator(".box").first()).toBeVisible();
  await page.screenshot({ path: "test-results/review.png" });

  // Reject one detection (the establishment) and check it stays visible after redaction.
  const etab = page.locator(".entity", { hasText: "[ETABLISSEMENT_1]" });
  await etab.locator("input").uncheck();

  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });
  await expect(cards.nth(0).getByText("Vérifié ✓")).toBeVisible();
  await page.screenshot({ path: "test-results/done.png" });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger le PDF pseudonymisé" }).click();
  expect((await download).suggestedFilename()).toMatch(/^document-\d+-pseudonymise\.pdf$/);

  // The scanned letter goes through OCR in the browser and is verified too.
  await cards.nth(1).click();
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(/Pages scannées relues par OCR : 1/)).toBeVisible();
  await page.screenshot({ path: "test-results/scan-done.png" });

  expect(external).toEqual([]);
});
