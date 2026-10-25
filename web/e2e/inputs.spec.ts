import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/anonymized");

test("pseudonymise a Word document and pasted text, and download the text", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Glissez vos documents patient ici")).toBeVisible();

  // An old .doc is refused with a way out, not silently dropped.
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "synthetique-fiche-word.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: readFileSync(resolve(DATA, "synthetique-fiche-word.docx")),
    },
    { name: "ancien.doc", mimeType: "application/msword", buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]) },
  ]);
  const cards = page.locator(".source-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).locator(".file-icon")).toHaveText("DOCX");
  await expect(cards.nth(1).getByText("Erreur")).toBeVisible();

  await page.getByRole("button", { name: "Coller du texte" }).first().click();
  await page.getByLabel("Texte à pseudonymiser").fill(readFileSync(resolve(DATA, "synthetique-note-collee.txt"), "latin1"));
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(2).locator(".file-icon")).toHaveText("TXT");

  await expect(cards.nth(0).getByText(/À vérifier/)).toBeVisible({ timeout: 60_000 });
  await expect(cards.nth(2).getByText(/À vérifier/)).toBeVisible({ timeout: 60_000 });

  for (const i of [0, 2]) {
    await cards.nth(i).click();
    await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
    await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });
  }

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger le texte pseudonymisé (.txt)" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^document-\d+-pseudonymise\.txt$/);
  const text = readFileSync((await file.path())!, "utf8");
  expect(text).toContain("Cushman 3");
  for (const id of ["RIBEIRO", "Fabrice", "0061237845", "06 45 12 78 33", "LEBRETON", "CHAPUIS"]) expect(text).not.toContain(id);
});
