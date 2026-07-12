import Link from "next/link";

export default function SectionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Section not found</h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        This section doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/projects/ptcg-binders"
        className="rounded bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Back to Binders
      </Link>
    </div>
  );
}
