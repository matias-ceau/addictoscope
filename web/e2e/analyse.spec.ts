import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Route } from "@playwright/test";

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/anonymized");
const PLANTED: string[] = JSON.parse(readFileSync(resolve(DATA, "ground_truth.json"), "utf8"))["synthetique-historique-csapa.pdf"];

/**
 * A stand-in for the cloud model: it answers the two prompts from the text
 * it is sent (observation titles, observation ids), so the whole flow can
 * be tested without an API key. It does not judge model quality.
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
  await page.locator('input[type="file"]').setInputFiles(resolve(DATA, "synthetique-historique-csapa.pdf"));
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

  // What left the browser: pseudonymized pages only, routed with ZDR.
  expect(sent.length).toBeGreaterThanOrEqual(2);
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
  for (const body of sent) {
    expect(JSON.parse(body).provider).toEqual({ zdr: true, data_collection: "deny" });
    const textOnly = fold(body.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, ""));
    for (const id of PLANTED) expect(textOnly, id).not.toContain(fold(id));
  }
  expect(sent[0]).toContain("data:image/png;base64,");

  // Table view and jump back to the source observation.
  await page.getByRole("tab", { name: "Tableau" }).click();
  await expect(page.locator(".event-table tbody tr")).toHaveCount(4);
  await page.locator(".event-table button.link").first().click();
  await expect(page.locator(".source-highlight").first()).toBeVisible();
  await page.screenshot({ path: "test-results/source-jump.png" });
});
