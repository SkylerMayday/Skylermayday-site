interface ErrorStateProps {
  message: string;
  className?: string;
}

/** Generic "couldn't load" block used when a data source fails server-side. */
export default function ErrorState({ message, className = "" }: ErrorStateProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-8 text-center text-fg-muted ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
