import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });

/** A finger dragged up over a point of the page, as a real swipe (touch events, not a mouse). */
async function swipeUp(page: import("@playwright/test").Page, x: number, fromY: number, toY: number, toX = x) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: fromY }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + ((toX - x) * i) / 8, y: fromY + ((toY - fromY) * i) / 8 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(400);
}

test("on a phone, a finger on the document scrolls it, and the steps lead to each stage", async ({ page }) => {
  await page.route("https://openrouter.ai/**", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: /Crack, rue/ }).click();
  await expect(page.getByText(/Relu aussi par l'IA locale/)).toBeVisible({ timeout: 120_000 });

  // The dossier opens at its top, and the action of the current stage comes before the pages.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const pseudonymise = page.getByRole("button", { name: "Pseudonymiser ce document" });
  const firstPage = page.locator("#page-0");
  expect((await pseudonymise.boundingBox())!.y).toBeLessThan((await firstPage.boundingBox())!.y);

  // A swipe over a page scrolls, and draws no frame.
  await page.getByRole("button", { name: /Détection/ }).click();
  await expect(page.locator(".viewer-toolbar")).toBeInViewport();
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => window.scrollY);
  const masks = await page.locator(".box").count();
  await swipeUp(page, 195, 650, 350);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  await expect(page.locator(".draft")).toHaveCount(0);
  await expect(page.locator(".box")).toHaveCount(masks);

  // A frame is drawn only once asked for, and one at a time.
  await page.getByRole("button", { name: "Masquer une zone" }).click();
  const box = (await page.locator(".page.drawing").first().boundingBox())!;
  const y = Math.max(box.y + 40, 300);
  await swipeUp(page, 120, y + 80, y, 260);
  await expect(page.locator(".box")).toHaveCount(masks + 1);
  await expect(page.getByRole("button", { name: "Masquer une zone" })).toHaveAttribute("aria-pressed", "false");
  // The frame cuts through ordinary words written elsewhere too: the document is verified all the same.

  // Each step is a button that brings its stage on screen.
  await page.getByRole("button", { name: /Masquage/ }).click();
  await expect(pseudonymise).toBeInViewport();
  await pseudonymise.click();
  await expect(page.getByText("Document pseudonymisé et vérifié")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /Analyse IA/ }).click();
  const run = page.getByRole("button", { name: /Analyser le dossier \(rejoué\)/ });
  await expect(run).toBeInViewport();
  await run.click();
  // The frise comes on screen by itself once made.
  await expect(page.locator(".frise .event").first()).toBeInViewport({ timeout: 60_000 });
  await page.getByRole("button", { name: /Dépôt/ }).click();
  await expect(page.locator(".sources")).toBeInViewport();
  await page.getByRole("button", { name: /Frise ré-identifiée/ }).click();
  await expect(page.locator(".frise")).toBeInViewport();
  // Nothing is wider than the screen.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
