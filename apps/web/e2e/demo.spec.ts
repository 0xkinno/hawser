import { readFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";

// Paced, recorded walk-through of every user action on the site. Run with
// playwright.demo.config.ts; the videos land in demo-footage/ for the film.
const CALL = "/call/call-saltmarsh-grace-brake-simulated-2026-11-06";
const BUNDLE = "../../runs/call-saltmarsh-grace-brake-simulated-2026-11-06.json";
const beat = (page: Page, ms = 1200) => page.waitForTimeout(ms);

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  const r = await page.goto(path, { waitUntil: "networkidle" });
  expect(r?.status()).toBe(200);
  return errors;
}

async function slowScroll(page: Page, steps = 8) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), (h * i) / steps);
    await beat(page, 700);
  }
}

test("landing: hero, scroll, anchors", async ({ page }) => {
  const errors = await open(page, "/");
  await expect(page.locator("[data-qa=headline]")).toBeVisible();
  await beat(page, 2000);
  await slowScroll(page);
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  for (const name of ["How it works", "The room", "Proof"]) {
    const nav = page.getByRole("navigation", { name: "Main" });
    const menu = nav.getByRole("button", { name: "Menu" });
    if ((await menu.isVisible()) && (await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
    await nav.getByRole("link", { name }).click();
    await beat(page, 1500);
  }
  await beat(page);
  expect(errors).toEqual([]);
});

test("desk page: provenance, signatures, replay, tour, themes", async ({ page }) => {
  const errors = await open(page, CALL);
  await expect(page.locator("[data-qa=provenance]")).toContainText("Simulated people");
  await expect(page.locator(".stamp")).toHaveCount(3);
  await expect(page.getByText("USD 260.41").first()).toBeVisible();
  await beat(page, 1500);
  await slowScroll(page, 6);
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.getByRole("button", { name: "Replay the call" }).click();
  await expect(page.locator("[data-qa=transcript] .msg").first()).toBeVisible();
  await beat(page, 4000);
  await page.getByRole("button", { name: "Guided tour" }).click();
  for (let i = 1; i <= 7; i++) {
    await expect(page.getByText(`Step ${i} of 7`)).toBeVisible();
    await beat(page, 1500);
    if (i < 7) await page.keyboard.press("ArrowRight");
  }
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByText("Step 7 of 7")).toBeHidden();
  for (const theme of ["Dark theme", "Light theme"]) {
    await page.getByRole("button", { name: theme }).click();
    await beat(page, 1500);
  }
  expect(errors).toEqual([]);
});

test("verify: bundled run passes, tampered bundle fails, junk is refused", async ({ page }) => {
  const errors = await open(page, "/verify");
  await beat(page, 1500);
  await page.getByRole("button", { name: "Verify the bundled run" }).click();
  await expect(page.locator("[data-qa=verify-result]")).toContainText("PASS");
  await expect(page.locator("[data-qa=verify-result]")).toContainText("All 13 checks passed");
  await beat(page, 3000);

  const good = JSON.parse(readFileSync(BUNDLE, "utf8"));
  const input = page.locator("input[type=file]");
  await input.setInputFiles({
    name: "good-copy.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(good)),
  });
  await expect(page.locator("[data-qa=verify-result]")).toContainText("PASS");
  await beat(page, 2000);

  const bad = JSON.parse(JSON.stringify(good));
  bad.finalDigest = `${String(bad.finalDigest).slice(0, -4)}0000`;
  await input.setInputFiles({
    name: "tampered.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.locator("[data-qa=verify-result]")).toContainText("MISMATCH");
  await beat(page, 3000);

  await input.setInputFiles({
    name: "junk.json",
    mimeType: "application/json",
    buffer: Buffer.from("not json"),
  });
  await expect(page.locator("p[role=alert]")).toContainText("not a HAWSER run bundle");
  await beat(page, 2500);
  expect(errors.filter((e) => !e.includes("Failed to load resource"))).toEqual([]);
});

test("findings, judge, trace pages and the stats endpoint", async ({ page, request }) => {
  for (const p of ["/findings", "/judge", "/trace/call-saltmarsh-grace-brake-simulated-2026-11-06"]) {
    const errors = await open(page, p);
    await beat(page, 1500);
    await slowScroll(page, 5);
    expect(errors).toEqual([]);
  }
  const r = await request.get("/api/stats");
  expect(r.status()).toBe(200);
  expect((await r.json()).allVerified).toBe(true);
  await page.goto("/this-page-does-not-exist");
  await expect(page.locator("body")).toContainText(/not on the chart/i);
  await beat(page, 1500);
});
