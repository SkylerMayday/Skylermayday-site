"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BinderSlot } from "@/lib/binders";
import { paginateSlots, SLOTS_PER_PAGE } from "@/lib/binders";
import CardSlot from "./CardSlot";
import PageJumpControl from "./PageJumpControl";
import EmptyState from "@/components/ui/EmptyState";

/** Minimum horizontal travel (px) for a touch gesture to count as a page-swipe. */
const MIN_SWIPE_DISTANCE_PX = 50;
/** Horizontal delta must exceed vertical delta by this factor — rejects vertical scrolls with drift. */
const HORIZONTAL_DOMINANCE_RATIO = 2;

interface BinderPageViewerProps {
  sectionName: string;
  slots: BinderSlot[]; // the full section's slots, already normalized
}

/** Bare filler tile matching CardSlot's empty-state container — no fake BinderSlot is fabricated to pass to CardSlot. */
function EmptyTile() {
  return (
    <div className="aspect-[5/7] rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
  );
}

/** Paginated 3x3 card viewer for a single binder section. Instant swap, no page-turn animation. */
export default function BinderPageViewer({
  sectionName,
  slots,
}: BinderPageViewerProps) {
  const pages = useMemo(() => paginateSlots(slots), [slots]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = pages.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goToPrev = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setPageIndex((i) => Math.min(pageCount - 1, i + 1));
  }, [pageCount]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      // Don't hijack typing/interaction inside the jump control or any input.
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") {
        return;
      }
      if (event.key === "ArrowLeft") {
        goToPrev();
      } else if (event.key === "ArrowRight") {
        goToNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  // Mobile swipe-to-turn. Native listeners on the GRID ELEMENT (not window):
  // native touch events bubble along the real DOM tree, so a touch inside the
  // portaled CardZoomModal (mounted under document.body, fixed inset-0 z-50)
  // never reaches this grid listener — the page can't flip behind an open
  // zoom modal, with no guard or state-lifting needed. (A React synthetic
  // onTouchStart here WOULD catch modal touches via React-tree bubbling
  // through the portal — do not use that.) touchstart/touchend only: the
  // final delta is all we need (no follow-the-finger animation). passive:
  // true because we never preventDefault (vertical scroll stays free).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function handleTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchEnd(event: TouchEvent) {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const isHorizontalSwipe =
        Math.abs(deltaX) >= MIN_SWIPE_DISTANCE_PX &&
        Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_DOMINANCE_RATIO;
      if (!isHorizontalSwipe) return;
      if (deltaX < 0) {
        goToNext(); // swipe left -> next page
      } else {
        goToPrev(); // swipe right -> previous page
      }
    }

    grid.addEventListener("touchstart", handleTouchStart, { passive: true });
    grid.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      grid.removeEventListener("touchstart", handleTouchStart);
      grid.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToPrev, goToNext]);

  if (pageCount === 0) {
    return <EmptyState message="This section has no cards yet." />;
  }

  const currentSlots = pages[pageIndex] ?? [];
  const cells = Array.from(
    { length: SLOTS_PER_PAGE },
    (_, i) => currentSlots[i]
  );

  return (
    <div className="flex flex-col gap-4">
      <div ref={gridRef} className="grid grid-cols-3 gap-2">
        {cells.map((slot, i) =>
          slot ? <CardSlot key={slot.slotId} slot={slot} /> : <EmptyTile key={`empty-${i}`} />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goToPrev}
          disabled={pageIndex === 0}
          aria-label={`Previous page in ${sectionName}`}
          className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded border border-neutral-300 font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700"
        >
          &larr;
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Page {pageIndex + 1} of {pageCount}
          </span>
          {pageCount > 1 && (
            <PageJumpControl
              pageIndex={pageIndex}
              pageCount={pageCount}
              onJump={setPageIndex}
            />
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={pageIndex === pageCount - 1}
          aria-label={`Next page in ${sectionName}`}
          className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded border border-neutral-300 font-medium disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
