"use client";

import { useMemo, useState } from "react";
import type { ShopListing } from "@/lib/shop";
import ShopGrid from "./ShopGrid";

type StatusFilter = "all" | "available" | "sold";

interface ShopFiltersProps {
  listings: ShopListing[];
}

export default function ShopFilters({ listings }: ShopFiltersProps) {
  const [setFilter, setSetFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const uniqueSets = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.set))).sort(),
    [listings]
  );

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      if (setFilter !== "all" && listing.set !== setFilter) return false;
      if (statusFilter !== "all" && listing.status !== statusFilter) return false;
      return true;
    });
  }, [listings, setFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {/* Both selects are visually label-less by design (their first option
            names the dimension), so each needs an accessible name of its own
            — without one a screen-reader user hears "combo box, All Sets" and
            "combo box, All" and cannot tell which filter they are changing.
            Wording matches what each control actually filters: `set` and
            `status` on ShopListing. */}
        <select
          aria-label="Filter by set"
          value={setFilter}
          onChange={(event) => setSetFilter(event.target.value)}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg"
        >
          <option value="all">All Sets</option>
          {uniqueSets.map((set) => (
            <option key={set} value={set}>
              {set}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by availability"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg"
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <ShopGrid listings={filtered} />
    </div>
  );
}
