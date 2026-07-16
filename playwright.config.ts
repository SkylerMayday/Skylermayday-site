import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      // Small tolerance absorbs sub-pixel anti-aliasing jitter while still
      // catching real chrome regressions. Tune down if it ever masks a real diff.
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "https://skylermayday.com",
    trace: "off",
  },
  // NO webServer block — we target live production, not a local dev server (see specs §2/§3).
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }, // deviceScaleFactor 1, isMobile false — keeps pixels deterministic
    },
  ],
});
