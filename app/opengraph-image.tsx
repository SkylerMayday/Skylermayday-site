import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site-config";

/**
 * Static Open Graph image — design-brief.md §7 / DESIGN.md §9.
 *
 * Theme-independent by design (§6.3): link unfurlers render server-side
 * with no access to a visitor's theme preference, so this is always the
 * dark look — the same reason the homepage hero stays dark in both themes
 * (a visitor who taps the preview lands on the same surface they just saw).
 *
 * Node runtime, not edge, so the backdrop image and font files can be read
 * from disk with `fs` (§7.1/§7.2). The `next/font/google` instance in
 * layout.tsx cannot be reused here — Satori needs raw font ArrayBuffers and
 * its variable-font support is unreliable, so static TTFs are committed to
 * `assets/fonts/` instead (SIL OFL licensed; see LeagueSpartan-OFL.txt in
 * that folder).
 */
export const runtime = "nodejs";

export const alt = `${siteConfig.brandName} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// --- Backdrop asset toggle (§7.6) ---------------------------------------
// The illustrated 1200x630 backdrop (Pokémon pack / ramen bowl / Lego
// minifig / SG skyline / Twitch glyph, per §7.5) is NOT in this repo as of
// this implementation pass — confirmed absent by Stage 1's search (repo,
// Downloads, Pictures, Digital Brain; gaps.md: blocked on inference.sh
// credits). Shipping the type-only fallback now (flat #1B0F2E plane, no
// backdrop, no scrim) rather than blocking deliverable 3 on the asset.
//
// To enable the backdrop once it exists: drop the optimized (<300KB)
// PNG at BACKDROP_PATH below and flip HAS_BACKDROP to true. Nothing else
// in this file needs to change — the backdrop <img> and its legibility
// scrim are a single conditional block, not a separate component (§7.6).
const HAS_BACKDROP = false;
const BACKDROP_PATH = path.join(process.cwd(), "assets", "og-backdrop.png");

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

export default async function OpengraphImage() {
  const [regular, black, backdropBuffer] = await Promise.all([
    readFile(path.join(FONT_DIR, "LeagueSpartan-Regular.ttf")),
    readFile(path.join(FONT_DIR, "LeagueSpartan-Black.ttf")),
    HAS_BACKDROP ? readFile(BACKDROP_PATH) : Promise.resolve(null),
  ]);

  const backdropDataUri = backdropBuffer
    ? `data:image/png;base64,${backdropBuffer.toString("base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "1200px",
          height: "630px",
          backgroundColor: "#1B0F2E", // --surface-hero, literal (Satori can't read CSS vars)
          fontFamily: "League Spartan",
        }}
      >
        {backdropDataUri && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori requires a plain <img>, not next/image.
          <img
            src={backdropDataUri}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          />
        )}
        {backdropDataUri && (
          // Legibility scrim over the backdrop only (§7.4) — a contrast
          // guarantee over an image, not decorative chrome. Same
          // distinction `.binder-label-scrim` already makes in
          // globals.css. Never rendered in the type-only fallback.
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              backgroundImage:
                "linear-gradient(to right, rgba(15,11,22,0.92) 0%, rgba(15,11,22,0.92) 55%, rgba(15,11,22,0) 62%)",
            }}
          />
        )}

        {/* Text zone — left-aligned, ~55% width, mirrors the site hero. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "660px",
            height: "100%",
            padding: "64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            {siteConfig.brandName}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 34,
              fontWeight: 400,
              lineHeight: 1.3,
              color: "#BF94FF", // --brand-soft, literal
            }}
          >
            {siteConfig.tagline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: 26,
              fontWeight: 700,
              color: "#F2941C", // --accent, literal
            }}
          >
            skylermayday.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "League Spartan", data: regular, weight: 400, style: "normal" },
        { name: "League Spartan", data: black, weight: 900, style: "normal" },
      ],
    }
  );
}
