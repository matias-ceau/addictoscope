import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const LIB = resolve(dirname(fileURLToPath(import.meta.url)), "../public/library");
const library = JSON.parse(readFileSync(resolve(LIB, "library.json"), "utf8"));
type Entry = { slug: string; title: string; events: number; pages: number };
const groups = library.groups as { title: string; dossiers: Entry[] }[];
// The first dossier of the sidebar is a long one (20 to 30 pages); then a short one.
const dossiers = [groups[0].dossiers[0], groups[1].dossiers[0]];
const escaped = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

test("a library opens every step of analysed dossiers from a sidebar, sending nothing", async ({ page }) => {
  test.setTimeout(420_000);
  const outbound: string[] = [];
  await page.route("https://openrouter.ai/**", (route) => {
    outbound.push(route.request().url());
    return route.abort();
  });
  await page.goto("/?library=library/library.json");
  const side = page.getByRole("complementary", { name: "Dossiers" });
  await expect(side.locator(".library-item")).toHaveCount(groups.reduce((n, g) => n + g.dossiers.length, 0));
  await expect(side.getByRole("heading", { name: /Dossiers longs/ })).toBeVisible();
  expect(dossiers[0].pages).toBeGreaterThanOrEqual(20);
  await expect(side.locator(".library-item.active .library-meta")).toContainText(`${dossiers[0].pages} pages`);

  // The first dossier opens on its own: detected, pseudonymised, verified, then its saved frise.
  const first = page.locator(".library-dossier:not([hidden])");
  await expect(side.locator(".library-item.active .library-status")).toHaveText("prêt", { timeout: 300_000 });
  await expect(first.getByText("Document pseudonymisé et vérifié").first()).toBeVisible();
  await first.getByRole("tab", { name: "Observations" }).click();
  await expect(first.locator(".obs-item").first()).toBeVisible();
  await first.locator(".obs-item").first().click();
  await expect(first.locator(".viewer")).toBeVisible();
  await first.getByRole("tab", { name: "Frise" }).click();
  await expect(first.locator(".frise .event")).toHaveCount(dossiers[0].events);
  // Read in several lots, the duplicates regrouped; answered without a paid call.
  await expect(first.getByText(/doublons regroupés/)).toBeVisible();
  await expect(first.getByText(/Analyse enregistrée.*coût estimé/)).toBeVisible();
  await expect(first.locator(".data-status")).toContainText("Tout reste sur ce poste");

  // The second dossier, then back to the first: kept as it was.
  await side.getByRole("button", { name: escaped(dossiers[1].title) }).click();
  await expect(side.locator(".library-item.active .library-status")).toHaveText("prêt", { timeout: 120_000 });
  const second = page.locator(".library-dossier:not([hidden])");
  await second.getByRole("tab", { name: "Frise" }).click();
  await expect(second.locator(".frise .event")).toHaveCount(dossiers[1].events);
  await side.getByRole("button", { name: escaped(dossiers[0].title) }).click();
  await expect(page.locator(".library-dossier:not([hidden]) .frise .event")).toHaveCount(dossiers[0].events);
  expect(outbound).toEqual([]);
});
