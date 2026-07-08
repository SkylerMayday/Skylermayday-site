export default function ContentLoading() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <div className="h-8 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-video w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
