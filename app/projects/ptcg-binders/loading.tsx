export default function BookcaseLoading() {
  return (
    // Retokened to --border and to the 64/96px section rhythm, matching
    // app/content/loading.tsx and the page this precedes (design-brief.md
    // §4.5/§6.2).
    <div className="flex flex-col gap-6 py-16 sm:py-24">
      <div className="h-12 w-48 animate-pulse rounded bg-border sm:h-16" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 w-full animate-pulse rounded-lg bg-border" />
        ))}
      </div>
    </div>
  );
}
