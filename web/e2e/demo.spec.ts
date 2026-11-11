import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const DEMO = resolve(dirname(fileURLToPath(import.meta.url)), "../public/demo");
const index = JSON.parse(readFileSync(resolve(DEMO, "index.json"), "utf8"));
const crack = index.dossiers.find((d: { slug: string }) => d.slug === "crack-rue");
const long = index.dossiers.find((d: { slug: string }) => d.slug === "opiaces-parcours");

test("a long dossier is read in several lots, then its duplicates are regrouped", async ({ page }) => {
  test.setTimeout(480_000);
  const outbound: string[] = [];
  await page.route("https://openrouter.ai/**", (route) => {
    outbound.push(route.request().url());
    return route.abort();
  });
  await page.goto("/");
  expect(long.docs[0].pages).toBeGreaterThanOrEqual(20);
  await page.getByRole("button", { name: /Dossier long/ }).click();
  await expect(page.getByText("Dossier fictif · démonstration")).toBeVisible();
  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 300_000 });
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: /Analyser le dossier \(rejoué\)/ }).click();
  await expect(page.locator(".frise .event").first()).toBeVisible({ timeout: 60_000 });
  // Same frise as the recorded run: same lots, same regroupement, rebuilt here.
  await expect(page.locator(".frise .event")).toHaveCount(long.recordings[0].events);
  await expect(page.getByText(/lu en \d+ lots, doublons regroupés/)).toBeVisible();

  // One request per lot, and one more for the regroupement, which carries no observation text.
  await page.locator(".data-status").click();
  const entries = page.locator(".journal-entry");
  await expect(entries.first()).toBeVisible();
  const n = await entries.count();
  expect(n).toBeGreaterThanOrEqual(3);
  await expect(page.getByText("Regroupement des doublons (sans texte d'observation)")).toHaveCount(1);
  await expect(page.locator(".journal-check.good")).toHaveCount(n);
  expect(outbound).toEqual([]);
});

test("the demonstration runs the whole process on a fictional dossier, sending nothing", async ({ page }) => {
  // No key, and any request to a model would be a failure.
  const outbound: string[] = [];
  await page.route("https://openrouter.ai/**", (route) => {
    outbound.push(route.request().url());
    return route.abort();
  });
  await page.goto("/");
  await expect(page.getByText("Sur ce poste").first()).toBeVisible();
  await page.getByRole("button", { name: /Crack, rue/ }).click();
  await expect(page.getByText("Dossier fictif · démonstration")).toBeVisible();
  await expect(page.locator(".journey-step.active")).toContainText(/Détection|Relecture/);

  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 120_000 });
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: /Analyser le dossier \(rejoué\)/ }).click();
  await expect(page.locator(".frise .event").first()).toBeVisible({ timeout: 60_000 });
  // Same frise as the recorded run: the local steps rebuilt it from the answers.
  await expect(page.locator(".frise .event")).toHaveCount(crack.recordings[0].events);
  await expect(page.locator(".data-status")).toContainText("Aucun envoi");
  await expect(page.getByText("Noms réels remis sur ce poste.")).toBeVisible();

  // The journal lists each replayed request, none carrying a real value.
  await page.locator(".data-status").click();
  const entries = page.locator(".journal-entry");
  await expect(entries.first()).toBeVisible();
  const n = await entries.count();
  expect(n).toBeGreaterThanOrEqual(2);
  await expect(page.locator(".journal-check.good")).toHaveCount(n);
  await expect(page.locator(".journal-where.replay")).toHaveCount(n);
  expect(outbound).toEqual([]);
});

test("an analysis is saved, then reopened with its real names from the encrypted table", async ({ page }, info) => {
  await page.route("https://openrouter.ai/**", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: /Crack, rue/ }).click();
  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 120_000 });
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });

  // The table, encrypted with a password.
  await page.getByRole("button", { name: /Exporter la table de correspondance/ }).click();
  await page.getByLabel(/Mot de passe/).fill("phrase de passe démo");
  await page.getByLabel("Confirmer").fill("phrase de passe démo");
  const [keyDownload] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Chiffrer et télécharger" }).click()]);
  const keyPath = info.outputPath("table.axkey");
  await keyDownload.saveAs(keyPath);

  await page.getByRole("button", { name: /Analyser le dossier \(rejoué\)/ }).click();
  await expect(page.locator(".frise .event").first()).toBeVisible({ timeout: 60_000 });
  const events = await page.locator(".frise .event").count();

  // The page export says it identifies the patient (real names on screen).
  page.once("dialog", (d) => d.accept());
  const [htmlDownload] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exporter la page" }).click()]);
  expect(htmlDownload.suggestedFilename()).toBe("frise-IDENTIFIANTE.html");
  const htmlPath = info.outputPath("frise.html");
  await htmlDownload.saveAs(htmlPath);
  expect(readFileSync(htmlPath, "utf8")).toContain("Contient des données identifiantes");

  const [jsonDownload] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Enregistrer l'analyse" }).click()]);
  const jsonPath = info.outputPath("analyse.json");
  await jsonDownload.saveAs(jsonPath);
  const saved = readFileSync(jsonPath, "utf8");
  expect(JSON.parse(saved).observations.length).toBeGreaterThan(10);
  expect(saved).not.toContain("LECOINTRE"); // the fictional patient's name stays out of the file

  // Later: the analysis alone shows labels; with its table, the real names.
  await page.getByRole("button", { name: "Quitter la démonstration" }).click();
  await page.locator('input[type="file"][accept=".json,.axkey"]').setInputFiles([jsonPath, keyPath]);
  await page.getByLabel("Mot de passe").fill("phrase de passe démo");
  await page.getByRole("button", { name: "Ouvrir" }).click();
  await expect(page.getByText("Noms réels remis sur ce poste.")).toBeVisible();
  await expect(page.locator(".frise .event")).toHaveCount(events);
  await expect(page.locator(".patient-header")).toContainText("LECOINTRE");
  await page.getByRole("button", { name: "Pseudonymes" }).click();
  await expect(page.locator(".patient-header")).toContainText("[PATIENT]");
  await expect(page.locator(".patient-header")).not.toContainText("LECOINTRE");
});
