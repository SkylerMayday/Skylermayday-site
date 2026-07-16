import { test, expect } from "@playwright/test";

// Canonical URL — /ptcg-binders 308-redirects here (next.config.ts).
const PATH = "/projects/ptcg-binders";

// Breakpoints established as meaningful by prior CLS/visual work (see specs §8).
const VIEWPORTS = [
  { label: "mobile-375", width: 375, height: 812 },   // common phone; mobile padding (p-4), ≤480 min-height tier
  { label: "mobile-428", width: 428, height: 926 },   // large phone; still mobile padding / ≤480 tier, different wrap/centering
  { label: "desktop-1280", width: 1280, height: 900 }, // true desktop; past Tailwind sm:640 → sm:p-6 chrome, >480 min-height tier
] as const;

const SCHEMES = ["light", "dark"] as const;

for (const vp of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test(`second bookshelf cabinet — ${vp.label} — ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(PATH, { waitUntil: "networkidle" });

      const secondShelf = page
        .locator("section")
        .filter({ has: page.getByRole("heading", { level: 2, name: "Personal Collection" }) });
      const cabinet = secondShelf.locator(".binder-cabinet");

      await expect(cabinet).toBeVisible();
      // Guard — see specs §5/§6: if this fails, shelf 2 got real data; re-baseline on purpose.
      await expect(cabinet).toHaveClass(/binder-cabinet-empty/);

      await expect(cabinet).toHaveScreenshot(`second-shelf-${vp.label}-${scheme}.png`);
    });
  }
}
