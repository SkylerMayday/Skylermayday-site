interface EmptyStateProps {
  message: string;
  className?: string;
}

/** Generic "nothing to show" block used across content/shop/binder pages. */
export default function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400 ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
