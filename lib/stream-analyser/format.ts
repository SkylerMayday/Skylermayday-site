/**
 * Display-formatting helpers ported verbatim from index.html:3216-3234
 * (fmtDur, fmtDurShort, nFmt, vodIdFromURL). Shared across components and
 * rule-based.ts so the same formatting logic isn't reimplemented per call site.
 */

/** `h:mm:ss` (or `m:ss` under an hour). Matches index.html:3216-3222. */
export function fmtDur(sec: number): string {
  if (!sec || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

/** `1h 23m` (or `23m` under an hour). Matches index.html:3223-3227. */
export function fmtDurShort(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** Locale-formatted integer. Matches index.html:3233. */
export function nFmt(n: number): string {
  return (n || 0).toLocaleString();
}

/** Extracts a numeric VOD id from a pasted Twitch VOD URL or bare id string. Matches index.html:3236-3239. */
export function vodIdFromURL(url: string): string | null {
  const m = url.match(/\/videos?\/(\d+)/);
  if (m) return m[1];
  return /^\d+$/.test(url) ? url : null;
}
