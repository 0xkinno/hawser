import { defineConfig, devices } from "@playwright/test";

// Records video of the paced walk-through (e2e/demo.spec.ts) for the demo film.
// PW_CHROMIUM may point at an installed chrome executable. Output: ../../demo-footage
const CHROMIUM = process.env.PW_CHROMIUM;
const launchOptions = CHROMIUM ? { executablePath: CHROMIUM } : {};

const sizes = [
  { name: "desktop-1440", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "iphone-393", viewport: { width: 393, height: 852 }, mobile: true },
];

export default defineConfig({
  testDir: "./e2e",
  testMatch: /demo\.spec\.ts/,
  timeout: 180_000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "../../demo-footage",
  use: { baseURL: "http://localhost:3100", launchOptions, trace: "off" },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: sizes.map((s) => ({
    name: s.name,
    use: {
      ...devices["Desktop Chrome"],
      viewport: s.viewport,
      isMobile: s.mobile,
      hasTouch: s.mobile,
      screenshot: "on",
      video: { mode: "on", size: s.viewport },
      launchOptions,
    },
  })),
});
