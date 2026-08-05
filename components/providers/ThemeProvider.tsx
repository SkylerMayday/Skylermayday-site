"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin client-boundary wrapper around next-themes' ThemeProvider.
 *
 * `app/layout.tsx` is a Server Component; next-themes' provider must run
 * client-side (it reads/writes localStorage and injects the pre-paint
 * blocking script), so this file exists purely to hold the "use client"
 * boundary in one place rather than making the whole root layout a client
 * component. Config (attribute="class", defaultTheme="system", etc.) is
 * passed down from layout.tsx, not hardcoded here, so the provider stays a
 * dumb pass-through.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
