import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/anonymized");

test("the reviewer re-files a detection and merges two entities", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles([resolve(DATA, "synthetique-historique-csapa.pdf")]);
  await expect(page.locator(".source-card").getByText(/À vérifier/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 90_000 });

  const row = (label: string) => page.locator(".entity-wrap", { has: page.locator(".tag", { hasText: label }) });
  const tags = page.locator(".entity .tag");

  // A care-giver wrongly filed: move it to the establishments.
  const before = await tags.allTextContents();
  const etabs = before.filter((t) => t.startsWith("[ETABLISSEMENT_")).length;
  await row("[SOIGNANT_1]").getByTitle("Corriger la catégorie ou regrouper").click();
  await row("[SOIGNANT_1]").getByLabel("Catégorie").selectOption("ETABLISSEMENT");
  await expect(tags.filter({ hasText: `[ETABLISSEMENT_${etabs + 1}]` })).toHaveCount(1);
  await expect(tags.filter({ hasText: "[SOIGNANT_1]" })).toHaveCount(0);

  // Two rows that are one person: merge the second care-giver into the patient.
  await row("[SOIGNANT_2]").getByTitle("Corriger la catégorie ou regrouper").click();
  const target = row("[SOIGNANT_2]").getByLabel("Même entité que");
  const patientOption = await target.locator("option", { hasText: "[PATIENT]" }).getAttribute("value");
  await target.selectOption(patientOption!);
  await expect(tags.filter({ hasText: "[SOIGNANT_2]" })).toHaveCount(0);
  await expect(tags.filter({ hasText: "[PATIENT]" })).toHaveCount(1);
  await page.screenshot({ path: "test-results/corrections.png" });

  // The corrections reach the redacted file.
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });
});
