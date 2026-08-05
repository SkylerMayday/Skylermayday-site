// Re-exports the same generator as app/opengraph-image.tsx so `twitter:image`
// is guaranteed to be emitted regardless of whether Next.js auto-derives it
// from the opengraph-image convention (design-brief.md §5.1 flags this as
// "verify after deploy; if missing, add this file" — shipping it proactively
// rather than leaving a post-deploy verify-and-patch step pending).
//
// `runtime` is declared directly here (not re-exported) — Next.js's route
// segment config must be statically analyzable in the file itself; a
// re-exported `runtime` builds fine but is silently ignored (falls back to
// the default), which happens to also be "nodejs" for this file type, but
// declaring it explicitly avoids relying on that default staying true.
export const runtime = "nodejs";
export { default, alt, size, contentType } from "./opengraph-image";
