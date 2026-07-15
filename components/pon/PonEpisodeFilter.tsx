"use client";

import { useMemo, useState } from "react";
import type { PonLocation } from "@/lib/pon";
import { formatMonth } from "@/lib/pon";
import PonFilterIcon, { type PonFilterIconVariant } from "./PonFilterIcons";
import EmptyState from "@/components/ui/EmptyState";

type LeafFilter = "walking" | "card-tradeshows" | "udon" | "other-noodles" | "other-food";

interface LeafFilterConfig {
  label: string;
  icon: PonFilterIconVariant;
  match: (cuisine: string) => boolean;
}

const LEAF_FILTERS: Record<LeafFilter, LeafFilterConfig> = {
  walking: { label: "Walking", icon: "walking", match: (c) => c === "Walking" },
  "card-tradeshows": {
    label: "Card Tradeshows",
    icon: "card-tradeshows",
    match: (c) => c === "Card Tradeshow",
  },
  udon: { label: "Udon", icon: "udon", match: (c) => c === "Udon" },
  "other-noodles": {
    label: "Other noodles",
    icon: "other-noodles",
    match: (c) => ["Wanton Mee", "Pasta"].includes(c),
  },
  "other-food": {
    label: "Other food",
    icon: "other-food",
    match: (c) => ["Japanese", "Western", "Chinese", "Seafood", "Thai", "Mixed"].includes(c),
  },
};

const FOOD_SUBMENU: LeafFilter[] = ["udon", "other-noodles", "other-food"];

const EM_DASH = "—";

/** Renders an em dash for empty freeform cells so rows never look broken. */
function cellText(value: string): string {
  return value === "" ? EM_DASH : value;
}

const LABEL_CLASSES = "text-xs text-neutral-600 dark:text-neutral-400";
const BUTTON_CLASSES = "flex flex-col items-center gap-1";

interface PonEpisodeFilterProps {
  locations: PonLocation[];
}

/**
 * Client-side icon filter menu + episode table for the Packs of Noods page.
 * Owns filter state; the surrounding page.tsx stays a server component.
 */
export default function PonEpisodeFilter({ locations }: PonEpisodeFilterProps) {
  const [activeFilter, setActiveFilter] = useState<LeafFilter | null>(null);
  const [foodOpen, setFoodOpen] = useState(false);

  function toggleFilter(key: LeafFilter) {
    setActiveFilter((current) => (current === key ? null : key));
  }

  function toggleFood() {
    setFoodOpen((open) => !open);
  }

  const filtered = useMemo(() => {
    if (activeFilter === null) return locations;
    return locations.filter((loc) => LEAF_FILTERS[activeFilter].match(loc.cuisine));
  }, [locations, activeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={toggleFood} className={BUTTON_CLASSES}>
            <PonFilterIcon variant="food" active={foodOpen} />
            <span className={LABEL_CLASSES}>Food{foodOpen ? " ▲" : " ▾"}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFilter("walking")}
            className={BUTTON_CLASSES}
          >
            <PonFilterIcon variant="walking" active={activeFilter === "walking"} />
            <span className={LABEL_CLASSES}>{LEAF_FILTERS.walking.label}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFilter("card-tradeshows")}
            className={BUTTON_CLASSES}
          >
            <PonFilterIcon
              variant="card-tradeshows"
              active={activeFilter === "card-tradeshows"}
            />
            <span className={LABEL_CLASSES}>{LEAF_FILTERS["card-tradeshows"].label}</span>
          </button>
        </div>

        {foodOpen ? (
          <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            {FOOD_SUBMENU.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleFilter(key)}
                className={BUTTON_CLASSES}
              >
                <PonFilterIcon variant={LEAF_FILTERS[key].icon} active={activeFilter === key} />
                <span className={LABEL_CLASSES}>{LEAF_FILTERS[key].label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No episodes match this filter yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {/* The table scrolls inside its own container so the page body never
              scrolls horizontally at narrow viewports. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  <th className="py-2 pr-4 font-medium">Content</th>
                  <th className="py-2 pr-4 font-medium">Guests</th>
                  <th className="py-2 pr-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={`${row.date}-${row.name}-${index}`}
                    className="border-b border-neutral-100 align-top dark:border-neutral-800"
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">{formatMonth(row.date)}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4">{row.location}</td>
                    <td className="py-2 pr-4">{cellText(row.content)}</td>
                    <td className="py-2 pr-4">{cellText(row.guests)}</td>
                    <td className="py-2 pr-4">{cellText(row.notes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">
            PC = Permanently Closed &middot; TC = Temporarily Closed &middot; OOA
            = Other Outlets Available.
          </p>
        </div>
      )}
    </div>
  );
}
