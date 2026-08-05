"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "./NavLinks";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    // Opaque surface, no backdrop-blur (design-brief.md RISK 4 — glassmorphism-
    // as-default is a banned tell, and a translucent header over a purple-
    // tinted background reads as low-contrast mush). 1px hairline bottom border.
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-black tracking-[-0.02em]">
          SkylerMayday
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium underline-offset-[6px] transition-colors duration-150 ease-out ${
                  active ? "text-fg underline decoration-2 decoration-brand" : "text-fg-muted hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>

        {/* Mobile: toggle always visible, then hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-fg"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-6 w-6"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 pb-4 md:hidden">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                // Same brand-underline active marker as the desktop nav above
                // — NOT colour alone. The first pass marked the mobile active
                // route by text-fg vs text-fg-muted only, which is one nav
                // with two indication methods and the accessibility-weaker of
                // the two (Stage 4 verdict, category 6 / heuristic 6).
                // `w-fit` so the 2px rule tracks the label, not the full-width
                // row.
                className={`w-fit rounded-lg px-2 py-2 text-sm font-medium underline-offset-[6px] transition-colors duration-150 ease-out ${
                  active
                    ? "text-fg underline decoration-2 decoration-brand"
                    : "text-fg-muted hover:text-fg"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
