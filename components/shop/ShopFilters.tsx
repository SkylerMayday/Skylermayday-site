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
        <select
          value={setFilter}
          onChange={(event) => setSetFilter(event.target.value)}
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="all">All Sets</option>
          {uniqueSets.map((set) => (
            <option key={set} value={set}>
              {set}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
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
