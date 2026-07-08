"use client";

import { useMemo, useState } from "react";
import type { ContentItem, Platform } from "@/lib/content-types";
import ContentGrid from "./ContentGrid";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

type FilterValue = "all" | "twitch" | "youtube" | "tiktok";

interface FilterOption {
  value: FilterValue;
  label: string;
  platforms: Platform[];
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "All", platforms: ["twitch-clip", "twitch-vod", "youtube", "tiktok"] },
  { value: "twitch", label: "Twitch", platforms: ["twitch-clip", "twitch-vod"] },
  { value: "youtube", label: "YouTube", platforms: ["youtube"] },
  { value: "tiktok", label: "TikTok", platforms: ["tiktok"] },
];

export interface SourceFailures {
  twitch: boolean;
  youtube: boolean;
}

interface PlatformFilterProps {
  items: ContentItem[];
  sourceFailures: SourceFailures;
  tiktokSlot: React.ReactNode;
}

/**
 * Client-side filter over already-fetched props. No re-fetch, no secrets
 * client-side — items were resolved server-side in app/content/page.tsx.
 */
export default function PlatformFilter({ items, sourceFailures, tiktokSlot }: PlatformFilterProps) {
  const [active, setActive] = useState<FilterValue>("all");

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
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active === option.value
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {active === "tiktok" ? (
        tiktokSlot
      ) : scopedError ? (
        <ErrorState message={scopedError} />
      ) : filteredItems.length === 0 ? (
        <EmptyState message="No content to show for this filter yet." />
      ) : (
        <ContentGrid items={filteredItems} />
      )}

      {active === "all" && <div className="mt-2">{tiktokSlot}</div>}
    </div>
  );
}
