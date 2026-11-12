import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Route } from "@playwright/test";

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/anonymized");
const PLANTED: string[] = JSON.parse(readFileSync(resolve(DATA, "ground_truth.json"), "utf8"))["synthetique-historique-csapa.pdf"];

/**
 * A stand-in for the cloud model: it answers the two prompts from the text
 * it is sent (observation titles, observation ids), so the whole flow can
 * be tested without an API key. It does not judge model quality. The export
 * dropped below is split by rules: only the frise prompt is expected.
 */
function fakeModel(route: Route, sent: string[]) {
  const body = route.request().postDataJSON();
  sent.push(JSON.stringify(body));
  const user = body.messages.at(-1).content;
  const text: string = typeof user === "string" ? user : user.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n");
  let answer: object;

  if (body.response_format.json_schema.name === "segmentation") {
    const lines = [...text.matchAll(/^p(\d+) L(\d+) \| (.*)$/gm)].map((m) => ({ page: +m[1], line: +m[2], text: m[3] }));
    const titles = lines.filter((l) => /^Observation .* du \d{2}\/\d{2}\/\d{4}/.test(l.text));
    const last = lines.at(-1)!;
    const observations: object[] = titles.map((t, i) => {
      const next = titles[i + 1];
      const end = next ? lines[lines.indexOf(next) - 1] : last;
      const [, d, m, y] = t.text.match(/(\d{2})\/(\d{2})\/(\d{4})/)!;
      return { start: { page: t.page, line: t.line }, end: { page: end.page, line: end.line }, date: `${y}-${m}-${d}`, kind: t.text.split(" du ")[0].replace("Observation ", ""), author_role: null, continues_previous: false, summary: "" };
    });
    if (lines[0] && titles[0] !== lines.find((l) => /^Observation /.test(l.text)) || (titles[0] && lines.indexOf(titles[0]) > 12)) {
      const end = titles[0] ? lines[lines.indexOf(titles[0]) - 1] : last;
      observations.unshift({ start: { page: lines[0].page, line: 1 }, end: { page: end.page, line: end.line }, date: null, kind: "suite", author_role: null, continues_previous: true, summary: "" });
    }
    answer = { observations };
  } else {
    const obs = [...text.matchAll(/^### (\S+) — (\S+)/gm)].map((m) => ({ id: m[1], date: m[2] }));
    answer = {
      events: [
        { kind: "substance_use", label: "Alcool", start: obs[0].date, end: null, ongoing: false, mode: "usage", loss_of_control: false, note: "8 UID/j", observation_ids: [obs[0].id] },
        { kind: "substance_use", label: "Alcool", start: obs[1].date, end: null, ongoing: false, mode: "rechute", loss_of_control: true, note: "rechute le week-end", observation_ids: [obs[1].id] },
        { kind: "medication", label: "Acamprosate", start: obs[0].date, end: null, ongoing: true, mode: null, loss_of_control: false, note: "333 mg 2-2-2", observation_ids: [obs[0].id] },
        { kind: "life_event", label: "Travail", start: obs.at(-1)!.date, end: null, ongoing: false, mode: null, loss_of_control: false, note: "reprise à mi-temps", observation_ids: [obs.at(-1)!.id] },
      ],
    };
  }
  return route.fulfill({ json: { choices: [{ message: { content: JSON.stringify(answer) } }] } });
}

test("analyse a verified document into a frise, sending nothing identifying", async ({ page }) => {
  const sent: string[] = [];
  await page.route("https://openrouter.ai/**", (route) => fakeModel(route, sent));
  await page.addInitScript(() =>
    localStorage.setItem("addictoscope.cloud", JSON.stringify({ kind: "openrouter-zdr", apiKey: "sk-test", model: "anthropic/claude-sonnet-5.5" })),
  );

  page.on("console", (m) => m.type() === "error" && console.log("BROWSER:", m.text()));
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.goto("/");
  await page.locator('input[type="file"]:not([accept=".json,.axkey"])').setInputFiles(resolve(DATA, "synthetique-historique-csapa.pdf"));
  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 90_000 });

  // Before pseudonymization, nothing can reach the model.
  expect(sent).toEqual([]);
  await page.getByRole("button", { name: "Pseudonymiser ce document" }).click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: "Analyser le dossier" }).click();
  await expect(page.getByText("Frise chronologique")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("3 observations · 4 événements")).toHaveCount(0); // panel hidden behind frise view is fine
  await expect(page.locator(".frise .event")).toHaveCount(4);
  await page.screenshot({ path: "test-results/frise.png" });

  // What left the browser: one frise request, routed with ZDR. The layout is
  // a known export, so the observations were found here: no segmentation
  // request, no page image.
  expect(sent.map((body) => JSON.parse(body).response_format.json_schema.name)).toEqual(["frise"]);
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
  for (const body of sent) {
    expect(JSON.parse(body).provider).toEqual({ zdr: true, data_collection: "deny" });
    const textOnly = fold(body.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, ""));
    for (const id of PLANTED) expect(textOnly, id).not.toContain(fold(id));
  }
  expect(sent[0]).not.toContain("data:image/");

  // Table view and jump back to the source observation.
  await page.getByRole("tab", { name: "Tableau" }).click();
  await expect(page.locator(".event-table tbody tr")).toHaveCount(4);

  // Corrections by hand: a verdict, a note rewritten, the short view. Nothing more is sent.
  await page.locator("button.verdict.ok").first().click();
  await expect(page.getByText("1 vérifié sur 4")).toBeVisible();
  await page.locator("button.verdict.fix").nth(1).click();
  await page.getByRole("dialog").getByLabel("Note").fill("note réécrite à la main");
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("1 correction à la main")).toBeVisible();
  await expect(page.locator(".event-table")).toContainText("note réécrite à la main");
  await page.getByRole("tab", { name: "Essentiel" }).click();
  await expect(page.locator("svg.essentiel .landmark").first()).toBeVisible();
  await page.screenshot({ path: "test-results/essentiel.png" });
  // The short view exports as a picture.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter l'image" }).click();
  expect((await download).suggestedFilename()).toMatch(/^essentiel-.*\.png$/);

  // An event added by hand on a line, then merged into its neighbour: four events again.
  await page.locator(".frise").getByRole("tab", { name: "Frise" }).click();
  await page.locator(".frise .lane-add").first().click();
  await page.getByRole("dialog").getByLabel("Début").fill("03/2019");
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.locator(".frise .event")).toHaveCount(5);
  await page.getByRole("tab", { name: "Tableau" }).click();
  await page.locator(".event-table tr", { hasText: "ajouté à la main" }).locator("button.verdict.fix").click();
  await page.getByRole("dialog").getByLabel("Fusionner avec un autre événement de la même ligne").selectOption({ index: 1 });
  await page.getByRole("dialog").getByRole("button", { name: "Fusionner", exact: true }).click();
  await expect(page.locator(".event-table tbody tr")).toHaveCount(4);
  // Kept in this browser without saving, and nothing more was sent.
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("addictoscope:corrections:")).length)).toBe(1);
  expect(sent).toHaveLength(1);

  await page.locator(".event-table button.link").first().click();
  await expect(page.locator(".source-highlight").first()).toBeVisible();
  await page.screenshot({ path: "test-results/source-jump.png" });
});
