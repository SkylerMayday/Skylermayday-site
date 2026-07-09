import type { NextConfig } from "next";

// Content-Security-Policy built from the site's actual browser-loaded origins.
// Server-to-server fetches (Twitch/YouTube/Discord widget APIs) are intentionally
// NOT listed — the browser never loads them. See .pipeline/specs.md §3.
//
// 'unsafe-inline' is used (not a nonce) because Next.js App Router injects inline
// hydration scripts and the TikTok/Instagram embed scripts inject their own inline
// scripts we can't nonce. See .pipeline/specs.md §4 for the full rationale.
const cspDirectives = [
  "default-src 'self'",
  // Next.js inline hydration + TikTok/Instagram embed scripts. TikTok's
  // embed.js chain-loads a secondary script from its ttwstatic.com static
  // CDN (observed: sf16-website-login.neutral.ttwstatic.com) — wildcarded
  // since the subdomain varies. Verified via live console CSP violation
  // during Coder-stage testing (2026-07-09); not in the original Planner
  // enumeration (§3/§5 of specs.md).
  "script-src 'self' 'unsafe-inline' https://www.tiktok.com https://www.instagram.com https://*.ttwstatic.com",
  // Tailwind v4 + Next inline styles, plus TikTok embed's stylesheet
  // (chain-loaded from the same ttwstatic.com host as its script — see
  // script-src comment above). Verified via live console CSP violation.
  "style-src 'self' 'unsafe-inline' https://*.ttwstatic.com",
  // Image CDNs (mirror of images.remotePatterns) + Discord bot avatar. data: for
  // inline SVG/placeholder data URIs; blob: for next/image where applicable.
  "img-src 'self' data: blob: https://clips-media-assets2.twitch.tv https://*.jtvnw.net https://i.ytimg.com https://images.pokemontcg.io https://cdn.discordapp.com",
  // Self-hosted fonts (next/font). No third-party font CDN.
  "font-src 'self'",
  // Contact form POSTs same-origin to /api/contact; no external XHR/fetch from browser.
  "connect-src 'self'",
  // Embedded third-party iframes (TikTok / Instagram embed.js).
  "frame-src https://www.tiktok.com https://www.instagram.com",
  // This site embeds no one else's frames-of-us and should never be framed.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Upgrade any stray http subresource to https.
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Strip the framework-fingerprinting `X-Powered-By: Next.js` response header.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Twitch clip/VOD thumbnails.
      // [VERIFY] Twitch serves thumbnails from several CDN hosts; these are the
      // commonly observed ones. Confirm against a live Helix response and add
      // any additional host encountered before relying on this in production.
      {
        protocol: "https",
        hostname: "clips-media-assets2.twitch.tv",
      },
      {
        protocol: "https",
        hostname: "*.jtvnw.net",
      },
      // YouTube thumbnails.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // PTCG binder card images — verified from live binder.json imageUrl values.
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
