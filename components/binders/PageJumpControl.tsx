"use client";

interface PageJumpControlProps {
  pageIndex: number; // 0-based current
  pageCount: number;
  onJump: (index: number) => void; // receives 0-based index
}

/**
 * Native <select> quick-jump. Chosen over numbered pips or a slider: usable
 * at 375px with zero custom layout, opens the OS picker on mobile (large
 * touch targets for free), and is accessible/keyboard-operable by default.
 */
export default function PageJumpControl({
  pageIndex,
  pageCount,
  onJump,
}: PageJumpControlProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="binder-page-jump" className="sr-only">
        Jump to page
      </label>
      <select
        id="binder-page-jump"
        value={pageIndex}
        onChange={(event) => onJump(Number(event.target.value))}
        className="min-h-[44px] rounded border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <option key={i} value={i}>
            Page {i + 1} of {pageCount}
          </option>
        ))}
      </select>
    </div>
  );
}
