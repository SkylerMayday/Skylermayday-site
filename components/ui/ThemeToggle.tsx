"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Two-state light/dark toggle — every state per design-brief.md §6.1 /
 * DESIGN.md §7.2. Deliberately NOT a tri-state cycle: system preference is
 * only the *initial* resolution (handled by next-themes' `defaultTheme`),
 * not a user-selectable third UI position.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // `resolvedTheme` is undefined until after mount (the actual theme is
  // unknown server-side). Rendering a fixed-dimension placeholder in that
  // window — rather than nothing — is what keeps mounting from shifting
  // layout (§6.1 "Pre-mount render").
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-lg"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted transition-colors duration-150 ease-out hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
        {/* Sun — visible in light mode. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`absolute h-5 w-5 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            isDark ? "-rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        {/* Moon — visible in dark mode. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`absolute h-5 w-5 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            isDark ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          }`}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      </span>
    </button>
  );
}
