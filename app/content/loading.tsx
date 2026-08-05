export default function ContentLoading() {
  return (
    // Skeleton blocks retokened from raw neutral-200/800 to --border, so the
    // loading state belongs to the same system as the page it precedes
    // (design-brief.md §6.2 names loading states as must-re-verify; the first
    // pass left both loading.tsx files on the pre-rebrand palette, which read
    // as leftover chrome from the old design).
    <div className="flex flex-col gap-6 py-16 sm:py-24">
      <div className="h-12 w-40 animate-pulse rounded bg-border sm:h-16" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-border" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-video w-full animate-pulse rounded-lg bg-border" />
        ))}
      </div>
    </div>
  );
}
