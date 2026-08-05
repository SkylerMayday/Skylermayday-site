"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary (Next.js file convention). Catches render
 * errors anywhere under app/layout.tsx and shows a recoverable fallback
 * instead of a blank/broken page. logs to console so a Vercel deployment's
 * function logs capture it even without a dedicated error-tracking service.
 */
export default function Error({
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
    <div className="flex flex-col items-center gap-4 py-16 text-center sm:py-24">
      <h1 className="text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Something broke
      </h1>
      <p className="prose-block text-fg-muted">
        This page hit an unexpected error. Try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong motion-reduce:transition-none"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 font-medium text-fg transition-colors duration-150 ease-out hover:border-brand motion-reduce:transition-none"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
