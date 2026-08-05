"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary (Next.js file convention) — fires only when
 * app/layout.tsx itself throws, so it can't rely on that layout's fonts,
 * CSS tokens, or providers (they may be exactly what's broken). Renders its
 * own minimal <html>/<body> with inline styles, deliberately independent of
 * the design system. Logs to console for Vercel's function logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0 }}>Something broke</h1>
        <p style={{ color: "#666", margin: 0 }}>
          The site hit an unexpected error. Try reloading the page.
        </p>
        <button
          onClick={() => reset()}
          style={{
            borderRadius: "0.5rem",
            background: "#9146FF",
            color: "white",
            padding: "0.5rem 1rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
