import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { siteConfig } from "@/data/site-config";

// Variable instance (no `weight`) — one file covers 400-900, per
// DESIGN.md §4/design-brief.md §4.4. Applied sitewide via the
// `--font-sans: var(--font-league-spartan)` binding in globals.css's
// `@theme inline` block — declaring the variable here alone does nothing
// (see globals.css's Font-Wiring Rationale comment / DESIGN.md §7.3, the
// exact bug this deliverable exists to fix for Geist).
const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skylermayday.com"),
  title: `${siteConfig.brandName}`,
  description: siteConfig.tagline,
  openGraph: {
    title: siteConfig.brandName,
    description: siteConfig.tagline,
    // No `images` array here — app/opengraph-image.tsx (the file convention)
    // is the single source of the OG image. An explicit `images` entry here
    // would compete with it (design-brief.md §5.1).
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is required by next-themes: the theme class
    // is applied to <html> by an inline pre-paint script, so the server-
    // rendered class attribute intentionally differs from the client's
    // first render (design-brief.md §5.1).
    //
    // The font variable class lives on <html>, not <body> — a sharp edge
    // found during Stage 2 verification (not in the original brief, written
    // back here and in DESIGN.md §7.3): Tailwind v4's Preflight sets
    // `font-family` on the `html, :host` selector itself. CSS custom
    // properties only resolve using variables visible on the SAME element
    // or an ANCESTOR of it — a variable class placed on <body> (a child of
    // <html>) is invisible to a `var()` reference resolved at <html>, so
    // `--font-league-spartan` silently failed to resolve there and
    // font-family fell back to the system stack, even though the variable
    // and the `--theme inline` binding were both wired correctly. Confirmed
    // via a live computed-style check (getComputedStyle(h1).fontFamily)
    // before and after moving the class.
    <html lang="en" suppressHydrationWarning className={leagueSpartan.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Skip link — first focusable element in the document, so the very
              first Tab press on any route offers a jump past the sticky
              header's six repeated nav stops. Visually hidden until focused,
              never hidden from assistive tech. Added per the Stage 4 verdict's
              heuristic 7 finding (2/4, "no skip-to-content link anywhere in
              the repo"). Styling lives in globals.css's `.skip-link` — see the
              comment there for why the Tailwind `sr-only focus:not-sr-only`
              pair was not used. */}
          <a href="#main" className="skip-link text-sm font-medium">
            Skip to content
          </a>
          <Header />
          {/* tabIndex={-1} is what makes the skip link actually work for
              assistive tech (WCAG 2.4.1). A plain in-page anchor moves the
              visual scroll position but NOT the accessibility tree's focus
              when the target isn't focusable — screen-reader users stayed in
              the header. Negative tabindex keeps <main> out of the Tab order
              while making it a valid programmatic focus target. */}
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
