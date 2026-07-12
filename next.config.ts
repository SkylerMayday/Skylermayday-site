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
  // Contact form POSTs same-origin to /api/contact. Stream Analyser adds a direct
  // browser connection to Twitch's public GQL endpoint (playback token, chat replay,
  // VOD list — all client-side POSTs with the public client id, CORS-open). Usher/
  // CloudFront VOD segments do NOT need an entry here — those are CORS-blocked from
  // the browser and go through the same-origin audio-proxy/playlist-proxy routes,
  // already covered by 'self'. See .pipeline/specs.md §3.5.
  "connect-src 'self' https://gql.twitch.tv",
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
  // HSTS explicitly disabled (Skyler, 2026-07-12): this site's Strict-Transport-Security
  // header was previously injected by Vercel's platform (max-age=63072000, not set by
  // this app), which made cert-substitution MITM interception (e.g. a mobile carrier's
  // content-filter proxy) a hard, unrecoverable block in-browser instead of a normal
  // cert-warning-with-override page. max-age=0 (not omission) is deliberate — this is
  // the RFC 6797 §6.1.1 signal that tells a browser to actively forget any HSTS policy
  // it already cached for this host, not just stop sending a new one. Only takes effect
  // for a given visitor once their browser receives this over a non-intercepted
  // connection — does not retroactively unblock an already-cached policy while still on
  // an intercepting network. Reversible: remove this entry (or set a real max-age) and
  // redeploy; this domain was never HSTS-preloaded, so there's no hardcoded-in-Chrome
  // state to fight either way.
  { key: "Strict-Transport-Security", value: "max-age=0" },
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
  // Tools → Projects repurpose (2026-07-12): both route trees physically moved
  // under /projects/*; every old URL 308-redirects so no shared link breaks.
  // No source starts with /projects, so the new tree is never shadowed.
  async redirects() {
    return [
      { source: "/tools", destination: "/projects", permanent: true },
      {
        source: "/tools/stream-analyser",
        destination: "/projects/stream-analyser",
        permanent: true,
      },
      { source: "/ptcg-binders", destination: "/projects/ptcg-binders", permanent: true },
      {
        source: "/ptcg-binders/:binderSlug/:sectionSlug",
        destination: "/projects/ptcg-binders/:binderSlug/:sectionSlug",
        permanent: true,
      },
      // Defensive: no single-segment binder page exists today (both sides 404),
      // but this keeps a stray shared link off the dead old prefix.
      {
        source: "/ptcg-binders/:binderSlug",
        destination: "/projects/ptcg-binders/:binderSlug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
