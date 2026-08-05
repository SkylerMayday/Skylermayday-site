"use client";

import { useMemo, useState } from "react";
import type { ContentItem, Platform } from "@/lib/content-types";
import ContentGrid from "./ContentGrid";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

type FilterValue = "twitch" | "youtube" | "tiktok" | "instagram";

interface FilterOption {
  value: FilterValue;
  label: string;
  platforms: Platform[];
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "twitch", label: "Twitch", platforms: ["twitch-clip", "twitch-vod"] },
  { value: "youtube", label: "YouTube", platforms: ["youtube"] },
  { value: "tiktok", label: "TikTok", platforms: ["tiktok"] },
  { value: "instagram", label: "Instagram", platforms: [] },
];

export interface SourceFailures {
  twitch: boolean;
  youtube: boolean;
}

interface PlatformFilterProps {
  items: ContentItem[];
  sourceFailures: SourceFailures;
  tiktokSlot: React.ReactNode;
  instagramSlot: React.ReactNode;
}

/**
 * Client-side filter over already-fetched props. No re-fetch, no secrets
 * client-side — items were resolved server-side in app/content/page.tsx.
 */
export default function PlatformFilter({ items, sourceFailures, tiktokSlot, instagramSlot }: PlatformFilterProps) {
  const [active, setActive] = useState<FilterValue>("twitch");

  const activeOption = useMemo(
    () => FILTER_OPTIONS.find((option) => option.value === active) ?? FILTER_OPTIONS[0],
    [active]
  );

  const filteredItems = useMemo(
    () => items.filter((item) => activeOption.platforms.includes(item.platform)),
    [items, activeOption]
  );

  // If the selected tab depends entirely on a source that failed, show a
  // scoped error instead of a misleading "no content" empty state.
  const scopedError =
    active === "twitch" && sourceFailures.twitch && filteredItems.length === 0
      ? "Couldn't load Twitch right now."
      : active === "youtube" && sourceFailures.youtube && filteredItems.length === 0
        ? "Couldn't load YouTube right now."
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActive(option.value)}
            // One button vocabulary sitewide: selected = --brand fill with
            // white text (4.64:1 AA); unselected = --surface with a --border
            // hairline (the surface alone is nearly invisible against --bg in
            // light mode, so the hairline is what makes it read as a control).
            // Replaces the black-in-light / white-in-dark neutral pills, which
            // were a third button recipe competing with --brand.
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-150 ease-out motion-reduce:transition-none ${
              active === option.value
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-fg-muted hover:border-brand hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {active === "tiktok" ? (
        tiktokSlot
      ) : active === "instagram" ? (
        instagramSlot
      ) : scopedError ? (
        <ErrorState message={scopedError} />
      ) : filteredItems.length === 0 ? (
        <EmptyState message="No content to show for this filter yet." />
      ) : (
        <section>
          {/* /content's Twitch and YouTube tabs render card h3s directly under
              the page h1 (axe `heading-order`, moderate) — the TikTok and
              Instagram slots already carry their own visible h2, so only this
              branch had the gap. Named after the active tab so a screen-reader
              user hears which filter produced the list; hidden visually
              because the selected pill already says it on screen.
              Scoped here rather than inside ContentGrid, which is also used by
              the homepage teaser under its own visible h2. */}
          <h2 className="sr-only">{activeOption.label} content</h2>
          <ContentGrid items={filteredItems} />
        </section>
      )}
    </div>
  );
}
