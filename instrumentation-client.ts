import * as Sentry from "@sentry/nextjs";

// Error tracking only — no session replay, no in-app feedback widget. Not
// requested (gaps.md's ask was "no error-tracking service", not
// "no session recording"), and replay/feedback both add real privacy and
// quota footprint a mostly-static personal site doesn't need right now.
// DSN is not a secret — it's meant to ship in the client bundle — but still
// goes through an env var per this repo's usual convention, not hardcoded.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Low, non-zero sample so slow-request traces are occasionally visible in
  // the Sentry dashboard without paying full tracing overhead/quota on every
  // request. Bump if request-performance debugging becomes a real need.
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
