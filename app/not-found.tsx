import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        This page doesn&apos;t exist — it may have moved or never existed.
      </p>
      <Link
        href="/"
        className="rounded bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Back to Home
      </Link>
    </div>
  );
}
