import { defineConfig, devices } from "@playwright/test";

const CHROMIUM = process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium";
const launch = process.env.CI ? {} : { executablePath: CHROMIUM, args: ["--no-sandbox"] };

const viewports = [
  { name: "desktop-1440", viewport: { width: 1440, height: 900 } },
  { name: "laptop-1280", viewport: { width: 1280, height: 800 } },
  { name: "tablet-820", viewport: { width: 820, height: 1180 } },
  { name: "iphone-393", viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true },
  { name: "pixel-412", viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true },
  { name: "android-360", viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true },
];

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /demo\.spec\.ts/,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", launchOptions: launch, trace: "off" },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: viewports.map((v) => ({
    name: v.name,
    use: {
      ...devices["Desktop Chrome"],
      viewport: v.viewport,
      isMobile: v.isMobile ?? false,
      hasTouch: v.hasTouch ?? false,
      launchOptions: launch,
    },
  })),
});
