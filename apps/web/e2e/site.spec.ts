import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const CALL = "/call/call-saltmarsh-grace-brake-simulated-2026-11-06";
const pages = [
  { name: "landing", path: "/" },
  { name: "call", path: CALL },
  { name: "verify", path: "/verify" },
  { name: "findings", path: "/findings" },
  { name: "judge", path: "/judge" },
  { name: "trace", path: "/trace/call-saltmarsh-grace-brake-simulated-2026-11-06" },
];

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

for (const p of pages) {
  test.describe(p.name, () => {
    test("no horizontal scroll, images loaded, zero console errors", async ({ page }) => {
      const errors = await open(page, p.path);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, "horizontal overflow in px").toBeLessThanOrEqual(0);
      const broken = await page.evaluate(() =>
        [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      );
      expect(broken).toEqual([]);
      expect(errors).toEqual([]);
    });

    test("axe WCAG 2.2 AA has no serious or critical violations", async ({ page }) => {
      await open(page, p.path);
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        bad.map(
          (v) =>
            `${v.id}: ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(" "))
              .join(" | ")}`,
        ),
      ).toEqual([]);
    });

    test("reduced motion renders without animation", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, p.path);
      const anim = await page.evaluate(() =>
        [...document.querySelectorAll(".hawser-path, .stamp, .card-in")]
          .map((e) => getComputedStyle(e).animationName)
          .filter((n) => n && n !== "none"),
      );
      expect(anim).toEqual([]);
    });
  });
}

test("headline, nav, hero art and buttons do not overlap", async ({ page }) => {
  await open(page, "/");
  const boxes = await page.evaluate(() => {
    const q = (s: string) => document.querySelector(s)?.getBoundingClientRect();
    const h = q("[data-qa=headline]");
    const nav = q("[data-qa=nav]");
    const cta = q("[data-qa=cta-call]");
    return {
      h: h && { t: h.top, b: h.bottom, l: h.left, r: h.right },
      nav: nav && { t: nav.top, b: nav.bottom },
      cta: cta && { t: cta.top, b: cta.bottom, l: cta.left, r: cta.right },
    };
  });
  expect(boxes.h && boxes.nav).toBeTruthy();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);
  expect((boxes.h as { t: number }).t).toBeGreaterThanOrEqual((boxes.nav as { b: number }).b - 1);
  const h = boxes.h as { b: number };
  const c = boxes.cta as { t: number };
  expect(c.t).toBeGreaterThanOrEqual(h.b - 1);
});

test("the call page shows its provenance, three signatures and a priced difference", async ({ page }) => {
  await open(page, CALL);
  await expect(page.locator("[data-qa=provenance]")).toContainText("Simulated people");
  await expect(page.locator(".stamp")).toHaveCount(3);
  await expect(page.getByText("USD 260.41").first()).toBeVisible();
});

test("desk page in both themes passes axe", async ({ page }) => {
  await open(page, CALL);
  for (const theme of ["Dark theme", "Light theme"]) {
    await page.getByRole("button", { name: theme }).click();
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      bad.map(
        (v) =>
          `${theme} ${v.id}: ${v.nodes
            .slice(0, 2)
            .map((n) => n.target.join(" "))
            .join(" | ")}`,
      ),
    ).toEqual([]);
  }
});

test("verify page recomputes the bundled run in the browser and shows PASS", async ({ page }) => {
  await open(page, "/verify");
  await page.getByRole("button", { name: "Verify the bundled run" }).click();
  await expect(page.locator("[data-qa=verify-result]")).toContainText("PASS");
  await expect(page.locator("[data-qa=verify-result]")).toContainText("All 13 checks passed");
});

test("replay plays the recorded call back card by card", async ({ page }) => {
  await open(page, CALL);
  await page.getByRole("button", { name: "Replay the call" }).click();
  await expect(page.locator("[data-qa=transcript] .msg").first()).toBeVisible();
});

test("guided tour has seven steps and the keyboard works", async ({ page }) => {
  await open(page, CALL);
  await page.getByRole("button", { name: "Guided tour" }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Step 2 of 7")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Step 2 of 7")).toBeHidden();
});

test("the stats endpoint recomputes and every bundled run verifies", async ({ request }) => {
  const r = await request.get("/api/stats");
  expect(r.status()).toBe(200);
  const j = await r.json();
  expect(j.allVerified).toBe(true);
  expect(j.runs.length).toBeGreaterThan(0);
});

test("screenshots for the README", async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop-1440" && info.project.name !== "iphone-393",
    "one wide and one narrow set is enough",
  );
  mkdirSync("../../docs/screens", { recursive: true });
  for (const p of pages) {
    await open(page, p.path);
    await page.screenshot({ path: `../../docs/screens/${p.name}-${info.project.name}.png`, fullPage: false });
  }
});
