/**
 * Domain allowlist for the audio-proxy / playlist-proxy routes.
 *
 * Ported verbatim from StreamAnalyser/proxy.js:30-47 (`ALLOWED_DOMAINS` +
 * `isAllowed`). These are the only hosts the server is permitted to fetch
 * on the browser's behalf — everything else is rejected with 403, closing
 * off the routes from becoming an open server-side fetch proxy.
 */

export const ALLOWED_DOMAINS = [
  "usher.ttvnw.net",
  "gql.twitch.tv",
  ".ttvnw.net",
  ".cloudfront.net",
  ".hls.ttvnw.net",
];

/**
 * Rate-limit ceiling for the audio-proxy + playlist-proxy routes (specs.md
 * §3.2 / §8 flag #4). A full analysis fans out to ~15 audio-segment fetches
 * plus 2 playlist fetches (master + media) per VOD, so the contact-form
 * default of 10/hr would block a single analysis part-way through. 200/hr
 * per IP allows roughly 200/17 ≈ 11 full analyses/hr — generous for one
 * visitor iterating on their own VODs, while still bounding bulk scraping
 * of Twitch's CDN through this origin. Shares one namespaced bucket
 * ("sa-proxy:"+ip) across both proxy routes rather than counting each of
 * the ~17 fetches in a single analysis as a separate "request" against the
 * Claude relay's stricter 10/hr bucket.
 */
export const SA_PROXY_RATE_LIMIT = 200;

export function isAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    return ALLOWED_DOMAINS.some((d) =>
      d.startsWith(".") ? u.hostname.endsWith(d) : u.hostname === d
    );
  } catch {
    return false;
  }
}
