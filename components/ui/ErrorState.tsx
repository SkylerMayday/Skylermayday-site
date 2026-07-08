interface ErrorStateProps {
  message: string;
  className?: string;
}

/** Generic "couldn't load" block used when a data source fails server-side. */
export default function ErrorState({ message, className = "" }: ErrorStateProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
