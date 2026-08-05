interface EmptyStateProps {
  message: string;
  className?: string;
}

/** Generic "nothing to show" block used across content/shop/binder pages. */
export default function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border p-8 text-center text-fg-muted ${className}`}
    >
      <p>{message}</p>
    </div>
  );
}
